<script setup>
import { ref, computed, onMounted, nextTick } from 'vue'
import axiosInstance from '@/axiosconfig/axiosInstance'
import TheNavbar from '@/components/TheNavbar.vue'
import TheFooter from '@/components/TheFooter.vue'
import TheSidebar from '@/components/TheSidebar.vue'
import ClientsView from '@/components/ClientsView.vue'
import VisitsView from '@/components/VisitsView.vue'
import ReportsView from '@/components/ReportsView.vue'

// State management
const currentView = ref('dashboard')
const clients = ref([])
const visits = ref([])
const stats = ref({})
const selectedClient = ref(null)
const loading = ref(false)
const locationLoading = ref(false)
const notification = ref({
  show: false,
  message: '',
  type: 'success',
})

// Sidebar state
const sidebarOpen = ref(true)

// Check-in/out state
const currentVisit = ref(null)
const isCheckedIn = ref(false)

// Signature state
const clientSignature = ref(null)
const caregiverSignature = ref(null)
const signatureType = ref('')
const signaturePad = ref(null)
const isDrawing = ref(false)
const lastX = ref(0)
const lastY = ref(0)

// Services state
const selectedServices = ref([])
const visitNotes = ref('')

// Location verification
const locationStatus = ref({
  verified: false,
  message: '',
  distance: null
})

// Computed properties
const assignedClients = computed(() => {
  return clients.value.filter(client => client.assigned_caregivers && client.assigned_caregivers.length > 0)
})

const currentDate = computed(() => {
  return new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })
})

const currentTime = computed(() => {
  return new Date().toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit'
  })
})

// Helper functions
const showNotification = (message, type = 'success') => {
  notification.value = {
    show: true,
    message,
    type,
  }
  setTimeout(() => {
    notification.value.show = false
  }, 3000)
}

const toggleSidebar = () => {
  sidebarOpen.value = !sidebarOpen.value
}

const handleNavigation = (route) => {
  currentView.value = route
  if (route === 'dashboard') {
    fetchDashboardData()
  }
}

const goBack = () => {
  if (currentView.value === 'checkin' || currentView.value === 'checkout' || currentView.value === 'signature') {
    currentView.value = 'dashboard'
  }
}

// Data fetching
const fetchDashboardData = async () => {
  try {
    loading.value = true
    const [clientsRes, visitsRes] = await Promise.all([
      axiosInstance.get('/api/evv/clients/'),
      axiosInstance.get('/api/evv/visits/')
    ])

    clients.value = clientsRes.data
    visits.value = visitsRes.data

    // Calculate stats
    stats.value = {
      totalClients: clients.value.length,
      assignedClients: assignedClients.value.length,
      completedVisits: visits.value.filter(v => v.check_out).length,
      pendingVisits: visits.value.filter(v => !v.check_out).length,
      totalHours: visits.value.reduce((total, visit) => {
        if (visit.check_in && visit.check_out) {
          const hours = (new Date(visit.check_out) - new Date(visit.check_in)) / (1000 * 60 * 60)
          return total + hours
        }
        return total
      }, 0)
    }
  } catch (err) {
    console.error('Error fetching dashboard data:', err)
    showNotification('Failed to load dashboard data', 'error')
  } finally {
    loading.value = false
  }
}

// Location functions
const getCurrentLocation = () => {
  return new Promise((resolve, reject) => {
    locationLoading.value = true
    if (!navigator.geolocation) {
      locationLoading.value = false
      reject(new Error('Geolocation is not supported by your browser'))
    } else {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          locationLoading.value = false
          resolve({
            latitude: position.coords.latitude,
            longitude: position.coords.longitude
          })
        },
        (error) => {
          locationLoading.value = false
          reject(error)
        }
      )
    }
  })
}

const calculateDistance = (lat1, lon1, lat2, lon2) => {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distance = R * c;
  return distance * 0.621371;
}

const verifyLocation = async (client) => {
  try {
    const currentLocation = await getCurrentLocation()

    if (!client.latitude || !client.longitude) {
      locationStatus.value = {
        verified: true,
        message: 'Client location not set. Check-in allowed.',
        distance: null
      }
      return true
    }

    const distance = calculateDistance(
      currentLocation.latitude,
      currentLocation.longitude,
      parseFloat(client.latitude),
      parseFloat(client.longitude)
    )

    const isWithinRange = distance <= 0.2

    locationStatus.value = {
      verified: isWithinRange,
      message: isWithinRange
        ? `Location verified. You are ${distance.toFixed(2)} miles from client.`
        : `Location not verified. You are ${distance.toFixed(2)} miles from client (max 0.2 miles).`,
      distance
    }

    return isWithinRange
  } catch (error) {
    console.error('Error verifying location:', error)
    locationStatus.value = {
      verified: false,
      message: 'Could not verify location. Please enable location services.',
      distance: null
    }
    return false
  }
}

// Check-in process
const initiateCheckIn = async (client) => {
  selectedClient.value = client
  currentView.value = 'checkin'

  const locationVerified = await verifyLocation(client)

  if (!locationVerified) {
    showNotification('Location verification failed. Cannot check in.', 'error')
  }
}

const confirmCheckIn = async () => {
  try {
    const currentLocation = await getCurrentLocation()

    const response = await axiosInstance.post('/api/evv/visits/checkin/', {
      client: selectedClient.value.id,
      check_in: new Date().toISOString(),
      start_lat: currentLocation.latitude,
      start_lng: currentLocation.longitude,
      service: selectedServices.value.length > 0 ? selectedServices.value[0] : null
    })

    currentVisit.value = response.data
    isCheckedIn.value = true
    currentView.value = 'dashboard'
    showNotification('Successfully checked in')
  } catch (err) {
    console.error('Error checking in:', err)
    showNotification('Failed to check in', 'error')
  }
}

// Check-out process
const initiateCheckOut = async () => {
  currentView.value = 'checkout'

  const locationVerified = await verifyLocation(selectedClient.value)

  if (!locationVerified) {
    showNotification('Location verification failed. Cannot check out.', 'error')
  }
}

const confirmCheckOut = async () => {
  try {
    const currentLocation = await getCurrentLocation()

    // Prepare the data object for the API
    const visitData = {
      client: selectedClient.value.id,
      check_out: new Date().toISOString(),
      end_lat: currentLocation.latitude,
      end_lng: currentLocation.longitude,
      services_offered: JSON.stringify(selectedServices.value),
      notes: visitNotes.value || ''
    }

    // Add base64 signatures if they exist
    if (clientSignature.value) {
      // Extract base64 data from data URL
      const base64Data = clientSignature.value.split(',')[1]
      visitData.client_signature = base64Data
    }

    if (caregiverSignature.value) {
      // Extract base64 data from data URL
      const base64Data = caregiverSignature.value.split(',')[1]
      visitData.caregiver_signature = base64Data
    }

    const response = await axiosInstance.patch(`/api/evv/visits/${currentVisit.value.id}/checkout/`, visitData)

    currentVisit.value = null
    isCheckedIn.value = false
    selectedClient.value = null
    selectedServices.value = []
    clientSignature.value = null
    caregiverSignature.value = null
    visitNotes.value = ''
    currentView.value = 'dashboard'
    showNotification('Successfully checked out and visit recorded')
  } catch (err) {
    console.error('Error checking out:', err)
    if (err.response?.data) {
      console.error('Server response:', err.response.data)
      showNotification(`Failed to check out: ${JSON.stringify(err.response.data)}`, 'error')
    } else {
      showNotification('Failed to check out', 'error')
    }
  }
}

// Service selection
const toggleService = (serviceId) => {
  const index = selectedServices.value.indexOf(serviceId)
  if (index > -1) {
    selectedServices.value.splice(index, 1)
  } else {
    selectedServices.value.push(serviceId)
  }
}

// Signature functions
const initializeSignaturePad = () => {
  nextTick(() => {
    const canvas = document.getElementById('signature-pad')
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    ctx.strokeStyle = '#000000'
    ctx.lineWidth = 2
    ctx.lineCap = 'round'
    ctx.lineJoin = 'round'

    ctx.fillStyle = '#ffffff'
    ctx.fillRect(0, 0, canvas.width, canvas.height)

    signaturePad.value = ctx
  })
}

const startDrawing = (event) => {
  isDrawing.value = true
  const canvas = document.getElementById('signature-pad')
  const rect = canvas.getBoundingClientRect()

  if (event.type.includes('touch')) {
    lastX.value = event.touches[0].clientX - rect.left
    lastY.value = event.touches[0].clientY - rect.top
  } else {
    lastX.value = event.offsetX
    lastY.value = event.offsetY
  }
}

const draw = (event) => {
  if (!isDrawing.value || !signaturePad.value) return

  const canvas = document.getElementById('signature-pad')
  const rect = canvas.getBoundingClientRect()
  let currentX, currentY

  if (event.type.includes('touch')) {
    currentX = event.touches[0].clientX - rect.left
    currentY = event.touches[0].clientY - rect.top
  } else {
    currentX = event.offsetX
    currentY = event.offsetY
  }

  signaturePad.value.beginPath()
  signaturePad.value.moveTo(lastX.value, lastY.value)
  signaturePad.value.lineTo(currentX, currentY)
  signaturePad.value.stroke()

  lastX.value = currentX
  lastY.value = currentY
}

const stopDrawing = () => {
  isDrawing.value = false
}

const clearSignature = () => {
  if (!signaturePad.value) return
  const canvas = document.getElementById('signature-pad')
  signaturePad.value.clearRect(0, 0, canvas.width, canvas.height)
  signaturePad.value.fillStyle = '#ffffff'
  signaturePad.value.fillRect(0, 0, canvas.width, canvas.height)
}

const captureSignature = () => {
  const canvas = document.getElementById('signature-pad')
  if (!canvas) return

  const signatureData = canvas.toDataURL('image/png')

  if (signatureType.value === 'client') {
    clientSignature.value = signatureData
  } else {
    caregiverSignature.value = signatureData
  }

  currentView.value = 'checkout'
  showNotification(`${signatureType.value} signature captured successfully`)
}

const openSignatureModal = (type) => {
  signatureType.value = type
  currentView.value = 'signature'
  nextTick(() => {
    initializeSignaturePad()
  })
}

// Initialize
onMounted(() => {
  fetchDashboardData()
})
</script>

<template>
  <div class="min-h-screen bg-gray-50 flex">
    <TheNavbar />

    <TheSidebar :sidebarOpen="sidebarOpen" @toggleSidebar="toggleSidebar" @navigate="handleNavigation" />

    <!-- Main Content -->
    <div class="flex-1 flex mt-17 flex-col lg:ml-0">
      <!-- Mobile sidebar toggle -->
      <div class="lg:hidden bg-white border-b border-gray-200 px-4 py-3">
        <button @click="toggleSidebar" class="p-2 rounded-md text-gray-500 hover:text-gray-700">
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>
      </div>

      <main class="flex-1 p-6">
        <!-- Loading overlay -->
        <div v-if="loading && currentView === 'dashboard'"
          class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 backdrop-blur-sm">
          <div class="flex flex-col items-center">
            <div class="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-sky-blue mb-4"></div>
            <p class="text-white font-medium">Loading data...</p>
          </div>
        </div>

        <!-- Notification -->
        <transition enter-active-class="transform ease-out duration-300 transition"
          enter-from-class="translate-y-2 opacity-0 sm:translate-y-0 sm:translate-x-2"
          enter-to-class="translate-y-0 opacity-100 sm:translate-x-0"
          leave-active-class="transition ease-in duration-100" leave-from-class="opacity-100"
          leave-to-class="opacity-0">
          <div v-if="notification.show" class="fixed top-20 right-6 z-50">
            <div :class="{
              'flex items-center p-4 rounded-lg shadow-xl border-l-4': true,
              'bg-green-50 text-green-800 border-green-500': notification.type === 'success',
              'bg-red-50 text-red-800 border-red-500': notification.type === 'error',
              'bg-yellow-50 text-yellow-800 border-yellow-500': notification.type === 'warning',
            }">
              <div :class="{
                'flex-shrink-0': true,
                'text-green-500': notification.type === 'success',
                'text-red-500': notification.type === 'error',
                'text-yellow-500': notification.type === 'warning',
              }">
                <svg v-if="notification.type === 'success'" class="h-6 w-6" fill="none" viewBox="0 0 24 24"
                  stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
                </svg>
                <svg v-else-if="notification.type === 'error'" class="h-6 w-6" fill="none" viewBox="0 0 24 24"
                  stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
                <svg v-else class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                    d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>
              <div class="ml-3">
                <p class="text-sm font-medium">{{ notification.message }}</p>
              </div>
            </div>
          </div>
        </transition>

        <!-- Dashboard View -->
        <div v-if="currentView === 'dashboard'">
          <!-- Dashboard Header -->
          <div class="mb-8">
            <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h1 class="text-2xl font-bold text-gray-900">EVV Dashboard</h1>
                <p class="text-gray-600 mt-1">{{ currentDate }} • {{ currentTime }}</p>
              </div>
              <div class="mt-4 sm:mt-0">
                <div class="bg-white rounded-lg shadow-sm border border-gray-200 px-4 py-3">
                  <p class="text-sm font-medium text-gray-700">Status:
                    <span v-if="isCheckedIn" class="text-green-600 font-semibold">Checked In</span>
                    <span v-else class="text-gray-500">Available</span>
                  </p>
                </div>
              </div>
            </div>
          </div>

          <!-- Stats Cards -->
          <div class="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <div class="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <div class="flex items-center">
                <div class="bg-sky-blue/10 p-1 rounded-lg">
                  <svg class="w-6 h-6 text-sky-blue" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                      d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                  </svg>
                </div>
                <div class="ml-4">
                  <p class="text-sm font-medium text-gray-600">Total Clients</p>
                  <p class="text-2xl font-bold text-gray-900">{{ stats.totalClients || 0 }}</p>
                </div>
              </div>
            </div>

            <div class="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <div class="flex items-center">
                <div class="bg-green-100 p-1 rounded-lg">
                  <svg class="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                      d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div class="ml-4">
                  <p class="text-sm font-medium text-gray-600">Completed Visits</p>
                  <p class="text-2xl font-bold text-gray-900">{{ stats.completedVisits || 0 }}</p>
                </div>
              </div>
            </div>

            <div class="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <div class="flex items-center">
                <div class="bg-orange/10 p-1 rounded-lg">
                  <svg class="w-6 h-6 text-orange" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                      d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div class="ml-4">
                  <p class="text-sm font-medium text-gray-600">Pending Visits</p>
                  <p class="text-2xl font-bold text-gray-900">{{ stats.pendingVisits || 0 }}</p>
                </div>
              </div>
            </div>

            <div class="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <div class="flex items-center">
                <div class="bg-purple-100 p-1 rounded-lg">
                  <svg class="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                      d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div class="ml-4">
                  <p class="text-sm font-medium text-gray-600">Total Hours</p>
                  <p class="text-2xl font-bold text-gray-900">{{ (stats.totalHours || 0).toFixed(1) }}h</p>
                </div>
              </div>
            </div>
          </div>

          <!-- Current Status Card -->
          <div class="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-8">
            <div class="flex items-center justify-between">
              <div>
                <h2 class="text-lg font-semibold text-gray-800">Current Visit</h2>
                <p v-if="isCheckedIn" class="text-green-600 font-medium mt-1 flex items-center">
                  <svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
                  </svg>
                  Checked in with {{ selectedClient?.first_name }} {{ selectedClient?.last_name }}
                </p>
                <p v-else class="text-gray-600 mt-1 flex items-center">
                  <svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                      d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  Ready for next visit
                </p>
              </div>
              <div v-if="isCheckedIn" class="flex space-x-3">
                <button @click="initiateCheckOut"
                  class="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors flex items-center">
                  <svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                      d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                  </svg>
                  Check Out
                </button>
              </div>
            </div>
          </div>

          <!-- Clients Section -->
          <div class="mb-8">
            <div class="flex items-center justify-between mb-6">
              <h2 class="text-xl font-semibold text-gray-900">My Clients</h2>
              <span class="text-sm text-gray-500">{{ assignedClients.length }} clients</span>
            </div>

            <!-- Clients Grid -->
            <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <div v-for="client in assignedClients" :key="client.id"
                class="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden transition-all duration-300 hover:shadow-md">
                <div class="p-6">
                  <div class="flex items-start justify-between mb-4">
                    <div>
                      <h3 class="text-lg font-semibold text-gray-900">
                        {{ client.first_name }} {{ client.last_name }}
                      </h3>
                      <p class="text-sm text-gray-500 mt-1">Age: {{ client.age }}</p>
                    </div>
                    <span
                      class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-sky-blue/10 text-sky-blue">
                      {{ client.visits_per_week }} visits/week
                    </span>
                  </div>

                  <div class="space-y-3">
                    <div class="flex items-center text-sm text-gray-600">
                      <svg class="h-4 w-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                          d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                      </svg>
                      {{ client.services_needed?.length || 0 }} services needed
                    </div>

                    <div class="flex items-center text-sm text-gray-600">
                      <svg class="h-4 w-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                          d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                          d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                      {{ client.address ? client.address.substring(0, 30) + '...' : 'No address' }}
                    </div>
                  </div>

                  <div class="mt-6">
                    <button @click="initiateCheckIn(client)" :disabled="isCheckedIn || locationLoading"
                      class="w-full flex items-center justify-center px-4 py-2 border border-transparent rounded-lg text-sm font-medium text-white bg-green-600 hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors">
                      <svg v-if="locationLoading" class="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none"
                        viewBox="0 0 24 24">
                        <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4">
                        </circle>
                        <path class="opacity-75" fill="currentColor"
                          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z">
                        </path>
                      </svg>
                      <svg v-else class="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
                      </svg>
                      {{ locationLoading ? 'Verifying...' : 'Check In' }}
                    </button>
                  </div>
                </div>
              </div>
            </div>

            <!-- No Clients Message -->
            <div v-if="assignedClients.length === 0 && !loading" class="text-center py-12">
              <svg class="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                  d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <h3 class="mt-2 text-sm font-medium text-gray-900">No clients assigned</h3>
              <p class="mt-1 text-sm text-gray-500">You haven't been assigned to any clients yet.</p>
            </div>
          </div>
        </div>

        <!-- Check In Page -->
        <div v-else-if="currentView === 'checkin'" class="max-w-2xl mx-auto">
          <div class="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div class="flex items-center justify-between mb-6">
              <div>
                <h1 class="text-2xl font-bold text-gray-900">Check In</h1>
                <p class="text-gray-600 mt-1">Complete check-in process for client</p>
              </div>
              <button @click="goBack" class="p-2 text-gray-500 hover:text-gray-700 rounded-lg hover:bg-gray-100">
                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div v-if="selectedClient" class="space-y-6">
              <!-- Client Information -->
              <div class="bg-blue-50 rounded-lg p-4">
                <h3 class="text-lg font-semibold text-blue-900 mb-2">Client Information</h3>
                <p class="text-blue-700"><strong>Name:</strong> {{ selectedClient.first_name }} {{
                  selectedClient.last_name }}</p>
                <p class="text-blue-700"><strong>Age:</strong> {{ selectedClient.age }}</p>
                <p class="text-blue-700"><strong>Address:</strong> {{ selectedClient.address }}</p>
              </div>

              <!-- Location Verification -->
              <div class="bg-blue-50 rounded-lg p-4">
                <div class="flex items-center">
                  <svg class="h-5 w-5 text-blue-400 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                      d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                  </svg>
                  <span class="text-sm font-medium"
                    :class="locationStatus.verified ? 'text-green-600' : 'text-red-600'">
                    {{ locationStatus.message }}
                  </span>
                </div>
              </div>

              <!-- Service Selection -->
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-3">Select Services</label>
                <div class="space-y-3">
                  <div v-for="service in selectedClient.services_needed" :key="service.id"
                    class="flex items-center p-3 border rounded-lg cursor-pointer hover:bg-gray-50 transition-colors"
                    :class="selectedServices.includes(service.id) ? 'border-green-500 bg-green-50' : 'border-gray-200'"
                    @click="toggleService(service.id)">
                    <input :id="`service-${service.id}`" type="checkbox" :value="service.id" v-model="selectedServices"
                      class="h-4 w-4 text-green-600 border-gray-300 rounded focus:ring-green-500">
                    <label :for="`service-${service.id}`" class="ml-3 text-sm text-gray-700 flex-1 cursor-pointer">
                      <span class="font-medium">{{ service.name }}</span>
                      <p class="text-xs text-gray-500 mt-1">{{ service.description }}</p>
                    </label>
                  </div>
                </div>
              </div>

              <!-- Action Buttons -->
              <div class="flex justify-end space-x-3 pt-6 border-t border-gray-200">
                <button @click="goBack" type="button"
                  class="px-6 py-3 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 transition-colors">
                  Cancel
                </button>
                <button @click="confirmCheckIn" type="button" :disabled="!locationStatus.verified || locationLoading"
                  class="px-6 py-3 border border-transparent rounded-lg text-sm font-medium text-white bg-green-600 hover:bg-green-700 focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed transition-colors">
                  Confirm Check In
                </button>
              </div>
            </div>
          </div>
        </div>

        <!-- Check Out Page -->
        <div v-else-if="currentView === 'checkout'" class="max-w-4xl mx-auto">
          <div class="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div class="flex items-center justify-between mb-6">
              <div>
                <h1 class="text-2xl font-bold text-gray-900">Check Out</h1>
                <p class="text-gray-600 mt-1">Complete check-out process and record visit details</p>
              </div>
              <button @click="goBack" class="p-2 text-gray-500 hover:text-gray-700 rounded-lg hover:bg-gray-100">
                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div class="space-y-6">
              <!-- Location Verification -->
              <div class="bg-blue-50 rounded-lg p-4">
                <div class="flex items-center">
                  <svg class="h-5 w-5 text-blue-400 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                      d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                  </svg>
                  <span class="text-sm font-medium"
                    :class="locationStatus.verified ? 'text-green-600' : 'text-red-600'">
                    {{ locationStatus.message }}
                  </span>
                </div>
              </div>

              <!-- Services Provided -->
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-3">Services Provided</label>
                <div class="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div v-for="service in selectedClient?.services_needed" :key="service.id"
                    class="flex items-center p-3 border rounded-lg cursor-pointer hover:bg-gray-50 transition-colors"
                    :class="selectedServices.includes(service.id) ? 'border-green-500 bg-green-50' : 'border-gray-200'"
                    @click="toggleService(service.id)">
                    <input :id="`service-out-${service.id}`" type="checkbox" :value="service.id"
                      v-model="selectedServices"
                      class="h-4 w-4 text-green-600 border-gray-300 rounded focus:ring-green-500">
                    <label :for="`service-out-${service.id}`" class="ml-3 text-sm text-gray-700 flex-1 cursor-pointer">
                      <span class="font-medium">{{ service.name }}</span>
                      <p class="text-xs text-gray-500 mt-1">{{ service.description }}</p>
                    </label>
                  </div>
                </div>
              </div>

              <!-- Signatures -->
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-3">Signatures</label>
                <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div class="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center">
                    <p class="text-sm font-medium text-gray-700 mb-2">Client Signature</p>
                    <div v-if="clientSignature" class="h-32 bg-gray-100 rounded flex items-center justify-center mb-3">
                      <img :src="clientSignature" alt="Client Signature" class="max-h-full max-w-full object-contain">
                    </div>
                    <div v-else class="h-32 bg-gray-50 rounded flex flex-col items-center justify-center mb-3">
                      <svg class="h-8 w-8 text-gray-400 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                          d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                      </svg>
                      <span class="text-xs text-gray-500">No signature captured</span>
                    </div>
                    <button @click="openSignatureModal('client')" type="button"
                      class="w-full px-4 py-2 text-sm border border-gray-300 rounded-lg text-gray-700 bg-white hover:bg-gray-50 transition-colors">
                      {{ clientSignature ? 'Resign' : 'Capture Signature' }}
                    </button>
                  </div>

                  <div class="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center">
                    <p class="text-sm font-medium text-gray-700 mb-2">Caregiver Signature</p>
                    <div v-if="caregiverSignature"
                      class="h-32 bg-gray-100 rounded flex items-center justify-center mb-3">
                      <img :src="caregiverSignature" alt="Caregiver Signature"
                        class="max-h-full max-w-full object-contain">
                    </div>
                    <div v-else class="h-32 bg-gray-50 rounded flex flex-col items-center justify-center mb-3">
                      <svg class="h-8 w-8 text-gray-400 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                          d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                      </svg>
                      <span class="text-xs text-gray-500">No signature captured</span>
                    </div>
                    <button @click="openSignatureModal('caregiver')" type="button"
                      class="w-full px-4 py-2 text-sm border border-gray-300 rounded-lg text-gray-700 bg-white hover:bg-gray-50 transition-colors">
                      {{ caregiverSignature ? 'Resign' : 'Capture Signature' }}
                    </button>
                  </div>
                </div>
              </div>

              <!-- Notes -->
              <div>
                <label for="visit-notes" class="block text-sm font-medium text-gray-700 mb-2">Visit Notes</label>
                <textarea id="visit-notes" v-model="visitNotes" rows="4"
                  class="w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Add any notes about the visit..."></textarea>
              </div>

              <!-- Action Buttons -->
              <div class="flex justify-end space-x-3 pt-6 border-t border-gray-200">
                <button @click="goBack" type="button"
                  class="px-6 py-3 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 transition-colors">
                  Cancel
                </button>
                <button @click="confirmCheckOut" type="button" :disabled="!locationStatus.verified || locationLoading"
                  class="px-6 py-3 border border-transparent rounded-lg text-sm font-medium text-white bg-red-600 hover:bg-red-700 focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed transition-colors">
                  Complete Check Out
                </button>
              </div>
            </div>
          </div>
        </div>

        <!-- Signature Page -->
        <div v-else-if="currentView === 'signature'" class="max-w-md mx-auto">
          <div class="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div class="flex items-center justify-between mb-6">
              <h1 class="text-2xl font-bold text-gray-900">
                {{ signatureType === 'client' ? 'Client' : 'Caregiver' }} Signature
              </h1>
              <button @click="goBack" class="p-2 text-gray-500 hover:text-gray-700 rounded-lg hover:bg-gray-100">
                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div class="border-2 border-gray-300 rounded-lg mb-4 bg-white overflow-hidden">
              <canvas id="signature-pad" width="400" height="200" class="w-full h-48 touch-none"
                @mousedown="startDrawing" @mousemove="draw" @mouseup="stopDrawing" @mouseleave="stopDrawing"
                @touchstart="startDrawing" @touchmove="draw" @touchend="stopDrawing"></canvas>
            </div>

            <div class="flex justify-between items-center">
              <button @click="clearSignature" type="button"
                class="px-4 py-2 text-sm border border-gray-300 rounded-lg text-gray-700 bg-white hover:bg-gray-50 transition-colors">
                Clear Signature
              </button>
              <div class="space-x-3">
                <button @click="goBack" type="button"
                  class="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 transition-colors">
                  Cancel
                </button>
                <button @click="captureSignature" type="button"
                  class="px-4 py-2 border border-transparent rounded-lg text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 transition-colors">
                  Save Signature
                </button>
              </div>
            </div>
          </div>
        </div>

        <!-- Clients View Component -->
        <ClientsView v-else-if="currentView === 'clients'" />

        <!-- Visits View Component -->
        <VisitsView v-else-if="currentView === 'visits'" />

        <!-- Reports View Component -->
        <ReportsView v-else-if="currentView === 'services'" />

      </main>
    </div>
  </div>
  <TheFooter />
</template>

<style scoped>
.bg-sky-blue {
  background-color: #87ceeb;
}

.text-sky-blue {
  color: #87ceeb;
}

.bg-orange {
  background-color: #ff7f50;
}

.text-orange {
  color: #ff7f50;
}
</style>
