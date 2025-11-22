<script setup>
import { ref, computed, onMounted, nextTick, watch } from 'vue'
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

// Check-in/out state - Load from localStorage on initialization
const currentVisit = ref(null)
const isCheckedIn = ref(false)

// Load check-in status from localStorage on component mount
const loadCheckInStatus = () => {
  const savedStatus = localStorage.getItem('evv_checkin_status')
  const savedVisit = localStorage.getItem('evv_current_visit')
  const savedClient = localStorage.getItem('evv_selected_client')

  if (savedStatus === 'true' && savedVisit && savedClient) {
    isCheckedIn.value = true
    currentVisit.value = JSON.parse(savedVisit)
    selectedClient.value = JSON.parse(savedClient)
  }
}

// Save check-in status to localStorage
const saveCheckInStatus = () => {
  localStorage.setItem('evv_checkin_status', isCheckedIn.value.toString())
  if (currentVisit.value) {
    localStorage.setItem('evv_current_visit', JSON.stringify(currentVisit.value))
  }
  if (selectedClient.value) {
    localStorage.setItem('evv_selected_client', JSON.stringify(selectedClient.value))
  }
}

// Clear check-in status from localStorage
const clearCheckInStatus = () => {
  localStorage.removeItem('evv_checkin_status')
  localStorage.removeItem('evv_current_visit')
  localStorage.removeItem('evv_selected_client')
}

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
    minute: '2-digit',
    second: '2-digit'
  })
})

// Enhanced stats with real-time calculations
const enhancedStats = computed(() => {
  const completedVisits = visits.value.filter(v => v.status === 'completed')
  const pendingVisits = visits.value.filter(v => v.status !== 'completed')

  // Calculate total hours from completed visits
  const totalHours = completedVisits.reduce((total, visit) => {
    return total + parseFloat(visit.hours_worked || 0)
  }, 0)

  return {
    totalClients: clients.value.length,
    assignedClients: assignedClients.value.length,
    completedVisits: completedVisits.length,
    pendingVisits: pendingVisits.length,
    totalHours: totalHours,
    avgHoursPerVisit: completedVisits.length > 0 ? (totalHours / completedVisits.length).toFixed(2) : 0
  }
})

// Current visit duration for active check-ins
const currentVisitDuration = computed(() => {
  if (!isCheckedIn.value || !currentVisit.value || !currentVisit.value.check_in_time) return '0:00'

  const checkInTime = new Date(currentVisit.value.check_in_time)
  const now = new Date()
  const diffMs = now - checkInTime
  const diffMins = Math.floor(diffMs / 60000)
  const diffHrs = Math.floor(diffMins / 60)
  const remainingMins = diffMins % 60

  return `${diffHrs}:${remainingMins.toString().padStart(2, '0')}`
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

    // Check if there's an active visit that matches our stored check-in
    if (isCheckedIn.value && currentVisit.value) {
      const activeVisit = visits.value.find(v =>
        v.id === currentVisit.value.id &&
        v.status !== 'completed'
      )

      // If no active visit found, reset check-in status
      if (!activeVisit) {
        isCheckedIn.value = false
        currentVisit.value = null
        selectedClient.value = null
        clearCheckInStatus()
        showNotification('Previous check-in session was completed elsewhere', 'warning')
      } else {
        // Update current visit with latest data
        currentVisit.value = activeVisit
      }
    }
  } catch (err) {
    console.error('Error fetching dashboard data:', err)
    showNotification('Failed to load dashboard data', 'error')
  } finally {
    loading.value = false
  }
}

// Location functions - FIXED to properly preserve 6 decimal places
// Location functions - Preserves 6 decimal places precisely
const getCurrentLocation = () => {
  return new Promise((resolve, reject) => {
    locationLoading.value = true

    if (!navigator.geolocation) {
      locationLoading.value = false
      reject(new Error('Geolocation is not supported by your browser'))
      return
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        locationLoading.value = false

        // ✅ Preserve precision up to 6 decimal places
        const latitude = parseFloat(position.coords.latitude.toFixed(6))
        const longitude = parseFloat(position.coords.longitude.toFixed(6))

        console.log('📍 Current Location (6 decimals):', { latitude, longitude })

        resolve({ latitude, longitude })
      },
      (error) => {
        locationLoading.value = false
        console.error('❌ Location error:', error)
        reject(error)
      },
      {
        enableHighAccuracy: true,
        timeout: 40000,   // Allow time for precise GPS fix
        maximumAge: 0     // Prevent cached positions
      }
    )
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

    const isWithinRange = distance <= 0.9

    locationStatus.value = {
      verified: isWithinRange,
      message: isWithinRange
        ? `Location verified. You are ${distance.toFixed(2)} miles from client.`
        : `Location not verified. You are ${distance.toFixed(2)} miles from client (max 0.9 miles).`,
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

// Check-in process - UPDATED with debug logging
const initiateCheckIn = async (client) => {
  if (isCheckedIn.value) {
    showNotification('You are already checked in with another client', 'warning')
    return
  }

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

    // ✅ Create payload with explicit 6 decimal places precision
    const payload = {
      client: selectedClient.value.id,
      check_in: new Date().toISOString(),
      start_lat: currentLocation.latitude,  // ✅ 6 decimal places precision
      start_lng: currentLocation.longitude, // ✅ 6 decimal places precision
      services: selectedServices.value.length > 0 ? selectedServices.value : []
    }

    console.log('Check-in payload with coordinates:', payload);
    console.log('Coordinate precision verification:', {
      start_lat: payload.start_lat.toString(),
      start_lng: payload.start_lng.toString(),
      decimal_places_lat: payload.start_lat.toString().split('.')[1]?.length || 0,
      decimal_places_lng: payload.start_lng.toString().split('.')[1]?.length || 0
    });

    const response = await axiosInstance.post('/api/evv/visits/checkin/', payload)

    currentVisit.value = response.data
    isCheckedIn.value = true
    saveCheckInStatus()

    currentView.value = 'dashboard'
    showNotification(`Successfully checked in with ${selectedClient.value.first_name} ${selectedClient.value.last_name}`)
    fetchDashboardData()
  } catch (err) {
    console.error('Error checking in:', err)
    showNotification('Failed to check in', 'error')
  }
}

// Check-out process - UPDATED with debug logging
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

    const visitData = {
      client: selectedClient.value.id,
      check_out: new Date().toISOString(),
      end_lat: currentLocation.latitude,   // ✅ 6 decimal places precision
      end_lng: currentLocation.longitude,  // ✅ 6 decimal places precision
      services_offered: selectedServices.value,
      notes: visitNotes.value || ''
    }

    console.log('Check-out payload with coordinates:', visitData);
    console.log('Coordinate precision verification:', {
      end_lat: visitData.end_lat.toString(),
      end_lng: visitData.end_lng.toString(),
      decimal_places_lat: visitData.end_lat.toString().split('.')[1]?.length || 0,
      decimal_places_lng: visitData.end_lng.toString().split('.')[1]?.length || 0
    });

    if (clientSignature.value) {
      visitData.client_signature = clientSignature.value.split(',')[1]
    }
    if (caregiverSignature.value) {
      visitData.caregiver_signature = caregiverSignature.value.split(',')[1]
    }

    const response = await axiosInstance.patch(`/api/evv/visits/${currentVisit.value.id}/checkout/`, visitData)

    currentVisit.value = null
    isCheckedIn.value = false
    selectedClient.value = null
    selectedServices.value = []
    clientSignature.value = null
    caregiverSignature.value = null
    visitNotes.value = ''
    clearCheckInStatus()

    currentView.value = 'dashboard'
    showNotification('Successfully checked out and visit recorded')
    fetchDashboardData()
  } catch (err) {
    console.error('Error checking out:', err)
    showNotification('Failed to check out', 'error')
  }
}

// Force check-out (emergency function)
const forceCheckOut = async () => {
  if (!confirm('Are you sure you want to force check out? This should only be used if normal check out is not working.')) {
    return
  }

  try {
    await axiosInstance.patch(`/api/evv/visits/${currentVisit.value.id}/checkout/`, {
      check_out: new Date().toISOString(),
      force: true
    })

    // Reset check-in state
    currentVisit.value = null
    isCheckedIn.value = false
    selectedClient.value = null

    // Clear check-in status from localStorage
    clearCheckInStatus()

    showNotification('Force check out completed', 'warning')
    fetchDashboardData()
  } catch (err) {
    console.error('Error during force check out:', err)
    showNotification('Failed to force check out', 'error')
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

// Auto-refresh data every 30 seconds
const startAutoRefresh = () => {
  setInterval(() => {
    if (currentView.value === 'dashboard') {
      fetchDashboardData()
    }
  }, 300000)
}

// Initialize
onMounted(() => {
  // Load any existing check-in status from localStorage
  loadCheckInStatus()

  // Fetch initial data
  fetchDashboardData()

  // Start auto-refresh
  startAutoRefresh()
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
                  <p v-if="isCheckedIn" class="text-xs text-gray-500 mt-1">
                    Duration: {{ currentVisitDuration }} • Auto-saved
                  </p>
                </div>
              </div>
            </div>
          </div>

          <!-- Stats Section -->
          <div class="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <!-- Total Clients -->
            <div
              class="col-span-1 sm:col-span-1 lg:col-span-1 bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow">
              <div class="flex items-center">
                <div class="bg-sky-blue/10 p-1 rounded-xl">
                  <svg class="w-6 h-6 text-sky-blue" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                      d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                  </svg>
                </div>
                <div class="ml-4">
                  <p class="text-sm font-medium text-gray-600">Total Clients</p>
                  <p class="text-2xl font-bold text-gray-900">{{ enhancedStats.totalClients || 0 }}</p>
                </div>
              </div>
            </div>

            <!-- Pending Visits (span full width only on small screens) -->
            <div
              class="col-span-1 sm:col-span-1 lg:col-span-1 bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow">
              <div class="flex items-center">
                <div class="bg-orange/10 p-1 rounded-xl">
                  <svg class="w-6 h-6 text-orange" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                      d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div class="ml-4">
                  <p class="text-sm font-medium text-gray-600">Pending Visits</p>
                  <p class="text-2xl font-bold text-gray-900">{{ enhancedStats.pendingVisits || 0 }}</p>
                </div>
              </div>
            </div>

            <!-- Completed Visits -->
            <div
              class="col-span-2 sm:col-span-2 lg:col-span-1 bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow">
              <div class="flex items-center">
                <div class="bg-green-100 p-3 rounded-xl">
                  <svg class="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                      d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div class="ml-4">
                  <p class="text-sm font-medium text-gray-600">Completed Visits</p>
                  <p class="text-2xl font-bold text-gray-900">{{ enhancedStats.completedVisits || 0 }}</p>
                </div>
              </div>
            </div>

            <!-- Total Hours -->
            <div
              class="col-span-2 sm:col-span-2 lg:col-span-1 bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow">
              <div class="flex items-center">
                <div class="bg-purple-100 p-3 rounded-xl">
                  <svg class="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                      d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div class="ml-4">
                  <p class="text-sm font-medium text-gray-600">Total Hours</p>
                  <p class="text-2xl font-bold text-gray-900">{{ (enhancedStats.totalHours || 0).toFixed(1) }}h</p>
                  <p class="text-xs text-gray-500 mt-1">
                    Avg: {{ enhancedStats.avgHoursPerVisit }}h/visit
                  </p>
                </div>
              </div>
            </div>
          </div>

          <!-- Current Status Card -->
          <div class="bg-white rounded-xl shadow-sm border border-gray-200 p-4 sm:p-6 mb-8">
            <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between sm:space-y-0 space-y-4">
              <!-- Left Section -->
              <div>
                <h2 class="text-lg font-semibold text-gray-800">Current Visit</h2>

                <!-- Checked In -->
                <div v-if="isCheckedIn" class="mt-2 space-y-2">
                  <p class="text-green-600 font-medium flex items-center">
                    <svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
                    </svg>
                    Checked in with {{ selectedClient?.first_name }} {{ selectedClient?.last_name }}
                  </p>

                  <div class="flex flex-col sm:flex-row sm:items-center sm:space-x-3 text-sm text-gray-600">
                    <div class="flex items-center">
                      <svg class="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                          d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <span>Duration: {{ currentVisitDuration }}</span>
                    </div>

                    <div class="hidden sm:inline">•</div>

                    <div class="flex items-center">
                      <svg class="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                          d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                      <span>Started: {{ new Date(currentVisit?.check_in_time).toLocaleTimeString() }}</span>
                    </div>
                  </div>
                </div>

                <!-- Not Checked In -->
                <p v-else class="text-gray-600 mt-2 flex items-center">
                  <svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                      d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  Ready for next visit
                </p>
              </div>

              <!-- Right Section (Buttons) -->
              <div v-if="isCheckedIn" class="flex flex-col sm:flex-row sm:space-x-3 space-y-2 sm:space-y-0">
                <button @click="initiateCheckOut"
                  class="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors flex items-center justify-center shadow-sm">
                  <svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                      d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a2 2 0 00-2-2h4a2 2 0 013 3v1" />
                  </svg>
                  Check Out
                </button>

                <button @click="forceCheckOut"
                  class="px-3 py-2 bg-yellow-500 text-white rounded-lg hover:bg-yellow-600 transition-colors flex items-center justify-center shadow-sm text-sm"
                  title="Force check out (emergency)">
                  <svg class="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                      d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                  Force
                </button>
              </div>
            </div>
          </div>

          <!-- Clients Section -->
          <div class="mb-8">
            <div class="flex items-center justify-between mb-6">
              <h2 class="text-xl font-semibold text-gray-900">My Clients</h2>
              <div class="flex items-center space-x-4">
                <span class="text-sm text-gray-500">{{ assignedClients.length }} clients</span>
                <button @click="fetchDashboardData"
                  class="p-2 text-gray-500 hover:text-gray-700 rounded-lg hover:bg-gray-100 transition-colors"
                  title="Refresh data">
                  <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                      d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                </button>
              </div>
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
                      class="w-full flex items-center justify-center px-4 py-2 border border-transparent rounded-lg text-sm font-medium text-white bg-green-600 hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-sm">
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
                      {{ locationLoading ? 'Verifying...' : (isCheckedIn ? 'Already Checked In' : 'Check In') }}
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
              <button @click="goBack"
                class="p-2 text-gray-500 hover:text-gray-700 rounded-lg hover:bg-gray-100 transition-colors">
                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div v-if="selectedClient" class="space-y-6">
              <!-- Client Information -->
              <div class="bg-blue-50 rounded-lg p-4 border border-blue-200">
                <h3 class="text-lg font-semibold text-blue-900 mb-2">Client Information</h3>
                <p class="text-blue-700"><strong>Name:</strong> {{ selectedClient.first_name }} {{
                  selectedClient.last_name }}</p>
                <p class="text-blue-700"><strong>Age:</strong> {{ selectedClient.age }}</p>
                <p class="text-blue-700"><strong>Address:</strong> {{ selectedClient.address }}</p>
              </div>

              <!-- Location Verification -->
              <div class="rounded-lg p-4 border"
                :class="locationStatus.verified ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'">
                <div class="flex items-center">
                  <svg class="h-5 w-5 mr-2" :class="locationStatus.verified ? 'text-green-500' : 'text-red-500'"
                    fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                      d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                  </svg>
                  <span class="text-sm font-medium"
                    :class="locationStatus.verified ? 'text-green-700' : 'text-red-700'">
                    {{ locationStatus.message }}
                  </span>
                </div>
              </div>

              <!-- Action Buttons -->
              <div class="flex justify-end space-x-3 pt-6 border-t border-gray-200">
                <button @click="goBack" type="button"
                  class="px-6 py-3 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 transition-colors">
                  Cancel
                </button>
                <button @click="confirmCheckIn" type="button" :disabled="!locationStatus.verified || locationLoading"
                  class="px-6 py-3 border border-transparent rounded-lg text-sm font-medium text-white bg-green-600 hover:bg-green-700 focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-sm">
                  Confirm Check In
                </button>
              </div>
            </div>
          </div>
        </div>

        <!-- Check Out Page -->
        <div v-else-if="currentView === 'checkout'" class="max-w-4xl mx-auto">
          <div class="bg-white rounded-xl shadow-sm border border-gray-200 p-3">
            <div class="flex items-center justify-between mb-6">
              <div>
                <h1 class="text-2xl font-bold text-gray-900">Check Out</h1>
                <p class="text-gray-600 mt-1">Complete check-out process and record visit details</p>
              </div>
              <button @click="goBack"
                class="p-2 text-gray-500 hover:text-gray-700 rounded-lg hover:bg-gray-100 transition-colors">
                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div class="space-y-6">
              <!-- Location Verification -->
              <div class="rounded-lg p-4 border"
                :class="locationStatus.verified ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'">
                <div class="flex items-center">
                  <svg class="h-5 w-5 mr-2" :class="locationStatus.verified ? 'text-green-500' : 'text-red-500'"
                    fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                      d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                  </svg>
                  <span class="text-sm font-medium"
                    :class="locationStatus.verified ? 'text-green-700' : 'text-red-700'">
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
                  <div
                    class="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center hover:border-gray-400 transition-colors">
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

                  <div
                    class="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center hover:border-gray-400 transition-colors">
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
                  class="w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 transition-colors"
                  placeholder="Add any notes about the visit..."></textarea>
              </div>

              <!-- Action Buttons -->
              <div class="flex justify-end space-x-3 pt-6 border-t border-gray-200">
                <button @click="goBack" type="button"
                  class="px-6 py-3 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 transition-colors">
                  Cancel
                </button>
                <button @click="confirmCheckOut" type="button" :disabled="!locationStatus.verified || locationLoading"
                  class="px-6 py-3 border border-transparent rounded-lg text-sm font-medium text-white bg-red-600 hover:bg-red-700 focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-sm">
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
              <button @click="goBack"
                class="p-2 text-gray-500 hover:text-gray-700 rounded-lg hover:bg-gray-100 transition-colors">
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
                  class="px-4 py-2 border border-transparent rounded-lg text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 transition-colors shadow-sm">
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

/* Smooth transitions for all interactive elements */
button,
input,
textarea,
select {
  transition: all 0.2s ease-in-out;
}

/* Enhanced hover effects */
.hover-lift:hover {
  transform: translateY(-2px);
  box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
}
</style>
