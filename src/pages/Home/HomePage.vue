<script setup>
import { ref, computed, onMounted } from 'vue'
import axiosInstance from '@/axiosconfig/axiosInstance'
import TheNavbar from '@/components/TheNavbar.vue'
import TheFooter from '@/components/TheFooter.vue'
import TheSidebar from '@/components/TheSidebar.vue'
import ClientsView from '@/components/ClientsView.vue'
import VisitsView from '@/components/VisitsView.vue'
import EmployeeView from '@/components/EmployeeView.vue'
import XrefsPage from '@/components/XrefsPage.vue'
import SettingsPage from '../Registration/UserSettings.vue/SettingsPage.vue'
import ProfilePage from '../Registration/ProfilePage.vue'
import PasswordChange from '../Registration/PasswordChange.vue'

// State management
const currentView = ref('dashboard')
const scheduledVisits = ref([])
const completedVisits = ref([])
const selectedSchedule = ref(null)
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

// Enhanced form state for EVV compliance (fields updated to match backend model)
const caregiverVisit = ref({
  // Required by AHCCCS / EVV
  visit_other_id: '',
  sequence_id: '',
  employee_qualifier: 'EmployeeSSN',
  employee_identifier: '',
  client_id_qualifier: 'ClientCustomID',
  client_id: '',
  client_other_id: '',
  visit_cancelled_indicator: false,
  payer_id: 'AZDDD',
  payer_program: 'AHCCCS',
  procedure_code: 'T1019',
  visit_time_zone: 'US/Arizona',
  schedule_start_time: '',
  schedule_end_time: '',

  // EVV Call data
  calls: [
    {
      call_external_id: '',
      call_date_time: '',
      call_assignment: 'Time In',
      call_type: 'Mobile',
      procedure_code: 'T1019',
      client_identifier_on_call: '',
      mobile_login: '',
      call_latitude: '',
      call_longitude: '',
      telephony_pin: null,
      originating_phone_number: null,
      location: '',
      visit_location_type: '1'
    }
  ],

  // EVV Client Verification (REQUIRED)
  client_verified_times: false,
  client_verified_tasks: false,
  client_verified_service: false,
  client_signature_available: false,
  client_voice_recording: false,

  // Visit Changes (required for manual adjustments)
  visit_changes: [],

  // Tasks (optional)
  tasks: [],

  // Existing fields for internal use (match model)
  actual_start_time: '',
  actual_end_time: '',
  start_latitude: '',
  start_longitude: '',
  end_latitude: '',
  end_longitude: '',
  services_rendered: [],
  visit_notes: '',
  client_signature: '',
  caregiver_signature: '',
  location_verified: false,
  hours_worked: 0,
  supplies_used: [],
  vital_signs: {
    blood_pressure: '',
    heart_rate: '',
    temperature: '',
    oxygen_saturation: ''
  },
  incident_report: '',
  follow_up_required: false
})

// Location verification
const locationStatus = ref({
  verified: false,
  message: '',
  distance: null
})

// Signature capture
const signatureCanvas = ref(null)
const isSignatureActive = ref(false)
const signatureData = ref('')

// Available services mapped to EVV Task IDs (unchanged)
const availableServices = ref([
  { id: '0110', name: 'Shopping', description: 'Grocery and essential shopping' },
  { id: '0120', name: 'Meal Preparation', description: 'Meal planning and preparation' },
  { id: '0130', name: 'Errand', description: 'Running errands' },
  { id: '0140', name: 'Medical Appointment', description: 'Transportation to appointments' },
  { id: '0150', name: 'Medication', description: 'Medication reminders and assistance' },
  { id: '0160', name: 'Bathing', description: 'Assistance with bathing' },
  { id: '0170', name: 'Eating', description: 'Assistance with eating' },
  { id: '0190', name: 'Dressing/Grooming', description: 'Assistance with dressing and grooming' }
])

// Computed properties
const todaySchedules = computed(() => {
  const today = new Date().toISOString().split('T')[0]
  return scheduledVisits.value.filter(schedule => {
    if (!schedule.schedule_start_time) return false
    const scheduleDate = new Date(schedule.schedule_start_time).toISOString().split('T')[0]
    return scheduleDate === today
  })
})

const activeVisit = computed(() => {
  return completedVisits.value.find(v => v.visit_type === 'in_progress')
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

// Helper functions
const showNotification = (message, type = 'success') => {
  notification.value = { show: true, message, type }
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
  if (currentView.value === 'caregiverCheckin' || currentView.value === 'caregiverCheckout') {
    currentView.value = 'dashboard'
  }
}

// Generate SequenceID as timestamp (YYYYMMDDHHMMSS)
const generateSequenceID = () => {
  const now = new Date();
  return now.getFullYear().toString() +
    String(now.getMonth() + 1).padStart(2, '0') +
    String(now.getDate()).padStart(2, '0') +
    String(now.getHours()).padStart(2, '0') +
    String(now.getMinutes()).padStart(2, '0') +
    String(now.getSeconds()).padStart(2, '0');
}

// Generate CallExternalID
const generateCallExternalID = (prefix) => {
  const timestamp = Date.now();
  return `${prefix}${timestamp.toString().slice(-8)}`;
}

// Data fetching
const fetchDashboardData = async () => {
  try {
    loading.value = true
    const today = new Date().toISOString().split('T')[0]

    // Get scheduled visits for today and next 7 days
    const nextWeek = new Date()
    nextWeek.setDate(nextWeek.getDate() + 7)
    const nextWeekStr = nextWeek.toISOString().split('T')[0]

    const [schedulesRes, visitsRes] = await Promise.all([
      axiosInstance.get(`/api/evv/visits/?type=scheduled&date_from=${today}&date_to=${nextWeekStr}`),
      axiosInstance.get('/api/evv/visits/?type=completed,in_progress&limit=10')
    ])

    scheduledVisits.value = schedulesRes.data
    completedVisits.value = visitsRes.data

    // Check if caregiver is currently checked in
    const active = completedVisits.value.find(v => v.visit_type === 'in_progress')
    if (active) {
      isCheckedIn.value = true
      currentVisit.value = active
      // preload selected schedule for display if available
      selectedSchedule.value = scheduledVisits.value.find(s => s.visit_other_id === active.visit_other_id) || null
      // Map currentVisit actual times into caregiverVisit for UI if needed
      caregiverVisit.value.actual_start_time = active.actual_start_time || caregiverVisit.value.actual_start_time
      caregiverVisit.value.actual_end_time = active.actual_end_time || caregiverVisit.value.actual_end_time
      caregiverVisit.value.start_latitude = active.start_latitude || caregiverVisit.value.start_latitude
      caregiverVisit.value.start_longitude = active.start_longitude || caregiverVisit.value.start_longitude
    } else {
      isCheckedIn.value = false
      currentVisit.value = null
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
      return
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        locationLoading.value = false
        const latitude = parseFloat(position.coords.latitude.toFixed(6))
        const longitude = parseFloat(position.coords.longitude.toFixed(6))

        resolve({
          latitude,
          longitude,
          accuracy: position.coords.accuracy,
          timestamp: position.timestamp
        })
      },
      (error) => {
        locationLoading.value = false
        reject(error)
      },
      {
        enableHighAccuracy: true,
        timeout: 40000,
        maximumAge: 0
      }
    )
  })
}

const calculateDistance = (lat1, lon1, lat2, lon2) => {
  const R = 6371; // Earth's radius in kilometers
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distanceKm = R * c;
  return distanceKm * 0.621371; // Convert to miles
}

const verifyLocation = async (client) => {
  try {
    const currentLocation = await getCurrentLocation()

    // If client doesn't have location coordinates, allow check-in
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

    // EVV allows up to 2km (1.24 miles) radius
    const isWithinRange = distance <= 1.24

    locationStatus.value = {
      verified: isWithinRange,
      message: isWithinRange
        ? `Location verified. You are ${distance.toFixed(2)} miles from client (within 1.24 miles).`
        : `Location not verified. You are ${distance.toFixed(2)} miles from client (max 1.24 miles).`,
      distance
    }

    caregiverVisit.value.location_verified = isWithinRange
    return isWithinRange
  } catch (error) {
    console.error('Error verifying location:', error)
    locationStatus.value = {
      verified: false,
      message: 'Could not verify location. Please enable location services.',
      distance: null
    }
    caregiverVisit.value.location_verified = false
    return false
  }
}

// Helper function to format dates for Django
const formatDateForDjango = (date) => {
  if (!date) return null;
  const d = new Date(date);
  return d.toISOString();
};

// Helper to format UTC for EVV
const formatToUTC = (date) => {
  return date.toISOString().replace(/\.\d{3}Z$/, 'Z');
};

// Signature functions
const startSignature = () => {
  isSignatureActive.value = true
  const canvas = signatureCanvas.value
  if (!canvas) return

  const ctx = canvas.getContext('2d')
  ctx.clearRect(0, 0, canvas.width, canvas.height)
  ctx.strokeStyle = '#000'
  ctx.lineWidth = 2

  let isDrawing = false
  let lastX = 0
  let lastY = 0

  canvas.onmousedown = (e) => {
    isDrawing = true
    const rect = canvas.getBoundingClientRect()
    lastX = e.clientX - rect.left
    lastY = e.clientY - rect.top
  }

  canvas.onmousemove = (e) => {
    if (!isDrawing) return
    const rect = canvas.getBoundingClientRect()
    const x = e.clientX - rect.left
    const y = e.clientY - rect.top

    ctx.beginPath()
    ctx.moveTo(lastX, lastY)
    ctx.lineTo(x, y)
    ctx.stroke()

    lastX = x
    lastY = y
  }

  canvas.onmouseup = () => {
    isDrawing = false
    saveSignature()
  }

  canvas.onmouseout = () => {
    isDrawing = false
  }
}

const saveSignature = () => {
  const canvas = signatureCanvas.value
  if (!canvas) return

  const dataURL = canvas.toDataURL('image/png')
  signatureData.value = dataURL
  caregiverVisit.value.client_signature_available = true
  caregiverVisit.value.client_signature = dataURL

  showNotification('Signature captured successfully', 'success')
}

const clearSignature = () => {
  const canvas = signatureCanvas.value
  if (!canvas) return

  const ctx = canvas.getContext('2d')
  ctx.clearRect(0, 0, canvas.width, canvas.height)
  signatureData.value = ''
  caregiverVisit.value.client_signature_available = false
  caregiverVisit.value.client_signature = ''
}

// Caregiver check-in process
const initiateCaregiverCheckIn = async (schedule) => {
  if (!schedule) {
    showNotification('Please select a schedule', 'error')
    return
  }

  selectedSchedule.value = schedule

  // Check if schedule has client data
  const client = schedule.client_details || {}
  if (!client.first_name) {
    showNotification('Client data not available for this schedule', 'error')
    return
  }

  // Verify location
  const locationVerified = await verifyLocation(client)

  if (locationVerified) {
    // Capture location coordinates
    try {
      const currentLocation = await getCurrentLocation()

      // Populate EVV call data for check-in (use backend field names)
      const now = new Date()
      caregiverVisit.value = {
        ...caregiverVisit.value,
        visit_other_id: schedule.visit_other_id,
        sequence_id: generateSequenceID(),
        employee_identifier: schedule.employee_details?.ssn || schedule.employee,
        client_id: client.medicaid_id || '',
        client_other_id: client.medicaid_id || '',
        payer_id: schedule.payer_id || 'AZDDD',
        procedure_code: schedule.procedure_code || 'T1019',
        visit_time_zone: schedule.visit_time_zone || 'US/Arizona',
        schedule_start_time: schedule.schedule_start_time,
        schedule_end_time: schedule.schedule_end_time,

        // Call in data
        calls: [
          {
            call_external_id: generateCallExternalID('IN'),
            call_date_time: formatToUTC(now),
            call_assignment: 'Time In',
            call_type: 'Mobile',
            procedure_code: schedule.procedure_code || 'T1019',
            client_identifier_on_call: client.medicaid_id || '',
            mobile_login: localStorage.getItem('caregiver_email') || 'caregiver@agency.com',
            call_latitude: currentLocation.latitude,
            call_longitude: currentLocation.longitude,
            location: client.address_line1 || '',
            visit_location_type: '1'
          }
        ],

        // Model-aligned fields
        actual_start_time: formatDateForDjango(now),
        start_latitude: currentLocation.latitude,
        start_longitude: currentLocation.longitude,
        location_verified: true
      }

      currentView.value = 'caregiverCheckin'
      showNotification('Location verified. Ready to check in.', 'success')
    } catch (error) {
      console.error('Error capturing location:', error)
      showNotification('Failed to capture location', 'error')
    }
  } else {
    showNotification('Location verification failed. Cannot check in.', 'error')
  }
}

const submitCaregiverCheckIn = async () => {
  try {
    const now = new Date()

    // Prepare EVV-compliant payload (top-level EVV payload kept similar)
    const evvPayload = {
      ProviderIdentification: {
        ProviderQualifier: "MedicaidID",
        ProviderID: "211108"
      },
      VisitOtherID: caregiverVisit.value.visit_other_id,
      SequenceID: caregiverVisit.value.sequence_id,
      EmployeeQualifier: "EmployeeSSN",
      EmployeeIdentifier: caregiverVisit.value.employee_identifier,
      ClientIDQualifier: "ClientCustomID",
      ClientID: caregiverVisit.value.client_id,
      ClientOtherID: caregiverVisit.value.client_other_id,
      VisitCancelledIndicator: false,
      PayerID: caregiverVisit.value.payer_id,
      PayerProgram: "AHCCCS",
      ProcedureCode: caregiverVisit.value.procedure_code,
      Modifier1: null,
      Modifier2: null,
      Modifier3: null,
      Modifier4: null,
      VisitTimeZone: caregiverVisit.value.visit_time_zone,
      ScheduleStartTime: caregiverVisit.value.schedule_start_time,
      ScheduleEndTime: caregiverVisit.value.schedule_end_time,
      AdjInDateTime: null,
      AdjOutDateTime: null,
      BillVisit: true,
      HoursToBill: 0,
      HoursToPay: 0,
      ClientVerifiedTimes: false,
      ClientVerifiedTasks: false,
      ClientVerifiedService: false,
      ClientSignatureAvailable: caregiverVisit.value.client_signature_available,
      ClientVoiceRecording: false,
      Calls: caregiverVisit.value.calls,
    }

    // Save to local database using model-aligned fields
    const localVisitData = {
      ...caregiverVisit.value,
      client: selectedSchedule.value.client,
      employee: selectedSchedule.value.employee,
      service_date: now.toISOString().split('T')[0],
      visit_type: 'in_progress',
      evv_payload: evvPayload,
      evv_sequence_id: caregiverVisit.value.sequence_id
    }

    const response = await axiosInstance.post('/api/evv/visits/', localVisitData)

    currentVisit.value = response.data
    isCheckedIn.value = true

    // Reset checkout-related fields
    caregiverVisit.value.actual_end_time = ''
    caregiverVisit.value.end_latitude = ''
    caregiverVisit.value.end_longitude = ''
    caregiverVisit.value.hours_worked = 0
    caregiverVisit.value.visit_notes = ''

    currentView.value = 'dashboard'
    showNotification('Successfully checked in. Visit is in progress.', 'success')
    fetchDashboardData()

  } catch (err) {
    console.error('Error during caregiver check-in:', err)
    console.error('Error details:', err.response?.data)
    showNotification('Failed to check in: ' + (err.response?.data?.detail || 'Please check the form data'), 'error')
  }
}

// Caregiver check-out process
const initiateCaregiverCheckOut = async () => {
  if (!currentVisit.value) {
    showNotification('No active visit found', 'error')
    return
  }

  // Verify location again for checkout
  const locationVerified = await verifyLocation(selectedSchedule.value?.client_details || {})

  if (locationVerified) {
    // Capture location coordinates for checkout
    try {
      const currentLocation = await getCurrentLocation()
      caregiverVisit.value.end_latitude = currentLocation.latitude
      caregiverVisit.value.end_longitude = currentLocation.longitude

      // Add call out data
      const now = new Date()
      caregiverVisit.value.calls.push({
        call_external_id: generateCallExternalID('OUT'),
        call_date_time: formatToUTC(now),
        call_assignment: 'Time Out',
        call_type: 'Mobile',
        procedure_code: caregiverVisit.value.procedure_code,
        client_identifier_on_call: caregiverVisit.value.client_id,
        mobile_login: localStorage.getItem('caregiver_email') || 'caregiver@agency.com',
        call_latitude: currentLocation.latitude,
        call_longitude: currentLocation.longitude,
        location: selectedSchedule.value?.client_details?.address_line1 || '',
        visit_location_type: '1'
      })

      caregiverVisit.value.actual_end_time = formatDateForDjango(now)
      currentView.value = 'caregiverCheckout'
      showNotification('Location verified. Ready to check out.', 'success')
    } catch (error) {
      console.error('Error capturing checkout location:', error)
      showNotification('Error capturing location', 'error')
    }
  } else {
    showNotification('Location verification failed. Cannot check out.', 'error')
  }
}

const submitCaregiverCheckOut = async () => {
  try {
    const now = new Date()

    // Calculate hours worked using actual_start_time (model aligned)
    const checkInTime = new Date(caregiverVisit.value.actual_start_time)
    const checkOutTime = now
    const hoursWorked = (checkOutTime - checkInTime) / (1000 * 60 * 60)
    const hoursToBill = parseFloat(hoursWorked.toFixed(3))

    // Update EVV payload for checkout
    const updatedEvvPayload = {
      ...currentVisit.value.evv_payload,
      SequenceID: generateSequenceID(),
      Calls: caregiverVisit.value.calls,
      HoursToBill: hoursToBill,
      HoursToPay: hoursToBill,
      ClientVerifiedTimes: caregiverVisit.value.client_verified_times,
      ClientVerifiedTasks: caregiverVisit.value.client_verified_tasks,
      ClientVerifiedService: caregiverVisit.value.client_verified_service,
      ClientSignatureAvailable: caregiverVisit.value.client_signature_available,
      VisitChanges: caregiverVisit.value.visit_changes.length > 0 ? caregiverVisit.value.visit_changes : null,
      VisitTasks: caregiverVisit.value.services_rendered.map(serviceId => ({
        TaskID: serviceId,
        TaskRefused: false
      }))
    }

    // Update local visit data using backend field names
    const visitData = {
      actual_end_time: formatDateForDjango(now),
      visit_type: 'completed',
      hours_to_bill: hoursToBill,
      end_latitude: caregiverVisit.value.end_latitude,
      end_longitude: caregiverVisit.value.end_longitude,
      tasks_completed: caregiverVisit.value.services_rendered,
      supplies_used: caregiverVisit.value.supplies_used,
      memo: caregiverVisit.value.visit_notes,
      location_verified: caregiverVisit.value.location_verified,
      client_verified_times: caregiverVisit.value.client_verified_times,
      client_verified_tasks: caregiverVisit.value.client_verified_tasks,
      client_verified_service: caregiverVisit.value.client_verified_service,
      client_signature_available: caregiverVisit.value.client_signature_available,
      client_signature: caregiverVisit.value.client_signature,
      evv_payload: updatedEvvPayload,
      evv_sequence_id: updatedEvvPayload.SequenceID,
      ready_for_evv_upload: true,
      calls: caregiverVisit.value.calls
    }

    // Patch the visit
    const response = await axiosInstance.patch(`/api/evv/visits/${currentVisit.value.id}/`, visitData)

    // Send to EVV immediately (best-effort)
    try {
      const evvResponse = await axiosInstance.post('/api/evv/evv/visits/upload/', [updatedEvvPayload])
      console.log('EVV upload response:', evvResponse.data)
      showNotification('Visit completed and sent to EVV system', 'success')
    } catch (evvError) {
      console.error('EVV upload failed:', evvError)
      showNotification('Visit completed but EVV upload failed. Admin will retry.', 'warning')
    }

    // Reset state
    currentVisit.value = null
    isCheckedIn.value = false
    selectedSchedule.value = null

    // Reset form (use model-aligned names)
    Object.assign(caregiverVisit.value, {
      visit_other_id: '',
      sequence_id: '',
      employee_identifier: '',
      client_id: '',
      client_other_id: '',
      actual_start_time: '',
      actual_end_time: '',
      start_latitude: '',
      start_longitude: '',
      end_latitude: '',
      end_longitude: '',
      services_rendered: [],
      visit_notes: '',
      client_signature: '',
      client_signature_available: false,
      client_verified_times: false,
      client_verified_tasks: false,
      client_verified_service: false,
      location_verified: false,
      hours_worked: 0,
      supplies_used: [],
      vital_signs: {
        blood_pressure: '',
        heart_rate: '',
        temperature: '',
        oxygen_saturation: ''
      },
      incident_report: '',
      follow_up_required: false,
      calls: [],
      visit_changes: []
    })

    signatureData.value = ''
    clearSignature()

    currentView.value = 'dashboard'
    fetchDashboardData()

  } catch (err) {
    console.error('Error during caregiver check-out:', err)
    console.error('Error details:', err.response?.data)
    showNotification('Failed to check out: ' + (err.response?.data?.detail || 'Please check the form data'), 'error')
  }
}

// Client verification toggles
const toggleClientVerification = (field) => {
  caregiverVisit.value[field] = !caregiverVisit.value[field]
}

// Form handlers
const toggleService = (serviceId) => {
  const index = caregiverVisit.value.services_rendered.indexOf(serviceId)
  if (index > -1) {
    caregiverVisit.value.services_rendered.splice(index, 1)
  } else {
    caregiverVisit.value.services_rendered.push(serviceId)
  }
}

// Auto-refresh data
const startAutoRefresh = () => {
  setInterval(() => {
    if (currentView.value === 'dashboard') {
      fetchDashboardData()
    }
  }, 300000)
}

// Initialize
onMounted(() => {
  fetchDashboardData()
  startAutoRefresh()

  // Load caregiver info from localStorage
  const caregiverEmail = localStorage.getItem('caregiver_email')
  if (caregiverEmail && caregiverVisit.value.calls && caregiverVisit.value.calls.length > 0) {
    caregiverVisit.value.calls[0].mobile_login = caregiverEmail
  }
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
            <div class="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-blue-500 mb-4"></div>
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
                <h1 class="text-2xl font-bold text-gray-900">Caregiver EVV Dashboard</h1>
                <p class="text-gray-600 mt-1">{{ currentDate }} • {{ currentTime }}</p>
              </div>
              <div class="mt-4 sm:mt-0">
                <div class="bg-white rounded-lg shadow-sm border border-gray-200 px-4 py-3">
                  <p class="text-sm font-medium text-gray-700">Status:
                    <span v-if="isCheckedIn" class="text-green-600 font-semibold">Checked In</span>
                    <span v-else class="text-gray-500">Available</span>
                  </p>
                  <p class="text-xs text-gray-500 mt-1">GPS: {{ locationStatus.verified ? '✓ Ready' : 'Needs permission'
                  }}</p>
                </div>
              </div>
            </div>
          </div>

          <!-- Today's Schedules -->
          <div class="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-8">
            <h2 class="text-xl font-semibold text-gray-900 mb-6">Today's Schedules</h2>

            <div v-if="todaySchedules.length > 0" class="space-y-4">
              <div v-for="schedule in todaySchedules" :key="schedule.id"
                class="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition-colors">
                <div class="flex justify-between items-start">
                  <div>
                    <p class="font-medium text-gray-900">
                      {{ schedule.client_details?.first_name || 'Client' }} {{ schedule.client_details?.last_name || ''
                      }}
                    </p>
                    <p class="text-sm text-gray-500 mt-1">
                      ⏰ {{ new Date(schedule.schedule_start_time).toLocaleTimeString([], {
                        hour: '2-digit',
                        minute: '2-digit'
                      }) }} -
                      {{ new Date(schedule.schedule_end_time).toLocaleTimeString([], {
                        hour: '2-digit',
                        minute: '2-digit'
                      }) }}
                    </p>
                    <p class="text-sm text-gray-500">
                      📍 {{ schedule.client_details?.address_line1 || schedule.client_details?.city || 'Address not set'
                      }}
                    </p>
                    <p class="text-xs text-blue-600 mt-2">
                      Service: {{ schedule.procedure_code || 'T1019' }}
                    </p>
                  </div>
                  <button @click="initiateCaregiverCheckIn(schedule)" :disabled="isCheckedIn || locationLoading"
                    class="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-sm">
                    {{ locationLoading ? 'Getting Location...' : 'Start Visit' }}
                  </button>
                </div>
              </div>
            </div>
            <div v-else class="text-center py-8 text-gray-500">
              <svg class="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                  d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              <p class="mt-2">No schedules for today</p>
              <p class="text-sm mt-1">Check back later or contact your supervisor</p>
            </div>
          </div>

          <!-- Current Status -->
          <div v-if="isCheckedIn" class="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-8">
            <div class="flex items-center justify-between">
              <div class="flex items-center">
                <svg class="w-5 h-5 text-yellow-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                    d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <p class="text-yellow-800 font-medium">
                  Currently checked in with {{ selectedSchedule?.client_details?.first_name || 'Client' }} {{
                    selectedSchedule?.client_details?.last_name || '' }}
                </p>
              </div>
              <button @click="initiateCaregiverCheckOut"
                class="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors text-sm">
                End Visit
              </button>
            </div>
            <div class="mt-2 text-sm text-yellow-700">
              <p>📍 Location: {{ locationStatus.verified ? 'Verified ✓' : 'Not verified' }}</p>
              <p>⏰ Started: {{ caregiverVisit.actual_start_time ? new
                Date(caregiverVisit.actual_start_time).toLocaleTimeString() : '-' }}</p>
            </div>
          </div>

          <!-- Recent Visits -->
          <div class="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h2 class="text-xl font-semibold text-gray-900 mb-6">Recent Visits</h2>
            <div v-if="completedVisits.length > 0" class="space-y-4">
              <div v-for="visit in completedVisits.slice(0, 5)" :key="visit.id"
                class="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition-colors">
                <div class="flex justify-between items-start">
                  <div>
                    <p class="font-medium text-gray-900">
                      {{ visit.client_details?.first_name || 'Client' }} {{ visit.client_details?.last_name || 'Client'
                      }}
                    </p>
                    <p class="text-sm text-gray-500 mt-1">
                      {{ new Date(visit.service_date || visit.schedule_start_time).toLocaleDateString() }} •
                      {{ visit.hours_to_bill || 0 }} hours
                    </p>
                    <p class="text-xs text-gray-500">
                      EVV: {{ visit.submitted_to_evv ? 'Sent ✓' : 'Pending' }}
                    </p>
                  </div>
                  <span :class="{
                    'px-2 py-1 rounded-full text-xs font-medium': true,
                    'bg-green-100 text-green-800': visit.visit_type === 'completed',
                    'bg-yellow-100 text-yellow-800': visit.visit_type === 'in_progress',
                    'bg-blue-100 text-blue-800': visit.visit_type === 'scheduled',
                    'bg-red-100 text-red-800': visit.visit_type === 'cancelled',
                    'bg-gray-100 text-gray-800': visit.visit_type === 'no_show'
                  }">
                    {{ visit.visit_type }}
                  </span>
                </div>
              </div>
            </div>
            <div v-else class="text-center py-8 text-gray-500">
              <svg class="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                  d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
              <p class="mt-2">No visits recorded yet</p>
            </div>
          </div>
        </div>

        <!-- Caregiver Check-In Details View -->
        <div v-else-if="currentView === 'caregiverCheckin'" class="max-w-4xl mx-auto">
          <div class="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div class="flex items-center justify-between mb-6">
              <div>
                <h1 class="text-2xl font-bold text-gray-900">Visit Check-In</h1>
                <p class="text-gray-600 mt-1">Complete check-in for {{ selectedSchedule?.client_details?.first_name ||
                  'Client' }} {{
                    selectedSchedule?.client_details?.last_name || '' }}</p>
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
              <div class="rounded-lg p-4 border border-green-200 bg-green-50">
                <div class="flex items-center">
                  <svg class="h-5 w-5 mr-2 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                      d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                  </svg>
                  <span class="text-sm font-medium text-green-700">
                    {{ locationStatus.message }}
                  </span>
                </div>
                <div class="mt-2 text-xs text-green-600">
                  <p>📍 GPS Coordinates: {{ caregiverVisit.start_latitude }}, {{ caregiverVisit.start_longitude }}</p>
                  <p>⏰ Check-in Time: {{ caregiverVisit.actual_start_time ? new
                    Date(caregiverVisit.actual_start_time).toLocaleTimeString() : '-' }}</p>
                </div>
              </div>

              <!-- Services Selection -->
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-3">Services to be Provided (Select all that
                  apply)</label>
                <div class="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div v-for="service in availableServices" :key="service.id"
                    class="flex items-center p-3 border rounded-lg cursor-pointer hover:bg-gray-50 transition-colors"
                    :class="caregiverVisit.services_rendered.includes(service.id) ? 'border-blue-500 bg-blue-50' : 'border-gray-200'"
                    @click="toggleService(service.id)">
                    <input :id="`service-${service.id}`" type="checkbox" :value="service.id"
                      v-model="caregiverVisit.services_rendered"
                      class="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500">
                    <label :for="`service-${service.id}`" class="ml-3 text-sm text-gray-700 flex-1 cursor-pointer">
                      <span class="font-medium">{{ service.name }}</span>
                      <p class="text-xs text-gray-500 mt-1">{{ service.description }}</p>
                      <p class="text-xs text-blue-500 mt-1">Task ID: {{ service.id }}</p>
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
                <button @click="submitCaregiverCheckIn" type="button"
                  class="px-6 py-3 border border-transparent rounded-lg text-sm font-medium text-white bg-green-600 hover:bg-green-700 focus:outline-none transition-colors shadow-sm">
                  Confirm Check In
                </button>
              </div>
            </div>
          </div>
        </div>

        <!-- Caregiver Check-Out Details View -->
        <div v-else-if="currentView === 'caregiverCheckout'" class="max-w-4xl mx-auto">
          <div class="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div class="flex items-center justify-between mb-6">
              <div>
                <h1 class="text-2xl font-bold text-gray-900">Visit Check-Out</h1>
                <p class="text-gray-600 mt-1">Complete check-out for {{ selectedSchedule?.client_details?.first_name ||
                  'Client' }} {{
                    selectedSchedule?.client_details?.last_name || '' }}</p>
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
              <div class="rounded-lg p-4 border border-green-200 bg-green-50">
                <div class="flex items-center">
                  <svg class="h-5 w-5 mr-2 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                      d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                  </svg>
                  <span class="text-sm font-medium text-green-700">
                    {{ locationStatus.message }}
                  </span>
                </div>
                <div class="mt-2 text-xs text-green-600">
                  <p>📍 Check-out GPS: {{ caregiverVisit.end_latitude }}, {{ caregiverVisit.end_longitude }}</p>
                  <p>⏰ Check-out Time: {{ caregiverVisit.actual_end_time ? new
                    Date(caregiverVisit.actual_end_time).toLocaleTimeString() : '-' }}</p>
                </div>
              </div>

              <!-- Client Verification (EVV REQUIRED) -->
              <div class="border border-gray-200 rounded-lg p-6 bg-blue-50">
                <h3 class="text-lg font-medium text-gray-900 mb-4">Client Verification</h3>
                <p class="text-sm text-gray-600 mb-4">AHCCCS requires client verification for EVV compliance.</p>

                <div class="space-y-4">
                  <div class="flex items-center">
                    <button @click="toggleClientVerification('client_verified_times')" :class="{
                      'w-10 h-6 rounded-full transition-colors': true,
                      'bg-green-500': caregiverVisit.client_verified_times,
                      'bg-gray-300': !caregiverVisit.client_verified_times
                    }">
                      <span :class="{
                        'block w-4 h-4 bg-white rounded-full transform transition-transform': true,
                        'translate-x-5': caregiverVisit.client_verified_times,
                        'translate-x-1': !caregiverVisit.client_verified_times
                      }"></span>
                    </button>
                    <span class="ml-3 text-sm text-gray-700">
                      Client verified visit times are accurate
                    </span>
                  </div>

                  <div class="flex items-center">
                    <button @click="toggleClientVerification('client_verified_tasks')" :class="{
                      'w-10 h-6 rounded-full transition-colors': true,
                      'bg-green-500': caregiverVisit.client_verified_tasks,
                      'bg-gray-300': !caregiverVisit.client_verified_tasks
                    }">
                      <span :class="{
                        'block w-4 h-4 bg-white rounded-full transform transition-transform': true,
                        'translate-x-5': caregiverVisit.client_verified_tasks,
                        'translate-x-1': !caregiverVisit.client_verified_tasks
                      }"></span>
                    </button>
                    <span class="ml-3 text-sm text-gray-700">
                      Client verified tasks were completed
                    </span>
                  </div>

                  <div class="flex items-center">
                    <button @click="toggleClientVerification('client_verified_service')" :class="{
                      'w-10 h-6 rounded-full transition-colors': true,
                      'bg-green-500': caregiverVisit.client_verified_service,
                      'bg-gray-300': !caregiverVisit.client_verified_service
                    }">
                      <span :class="{
                        'block w-4 h-4 bg-white rounded-full transform transition-transform': true,
                        'translate-x-5': caregiverVisit.client_verified_service,
                        'translate-x-1': !caregiverVisit.client_verified_service
                      }"></span>
                    </button>
                    <span class="ml-3 text-sm text-gray-700">
                      Client verified services were provided
                    </span>
                  </div>
                </div>

                <!-- Signature Capture -->
                <div class="mt-6">
                  <label class="block text-sm font-medium text-gray-700 mb-2">Client Signature (Optional but
                    recommended)</label>
                  <div class="border-2 border-dashed border-gray-300 rounded-lg p-4">
                    <canvas ref="signatureCanvas" width="500" height="200"
                      class="w-full border border-gray-200 rounded bg-white"></canvas>
                    <div class="flex space-x-3 mt-4">
                      <button @click="startSignature" type="button"
                        class="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50">
                        Start Signature
                      </button>
                      <button @click="clearSignature" type="button"
                        class="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50">
                        Clear
                      </button>
                    </div>
                    <p class="text-xs text-gray-500 mt-2">Signature helps with EVV compliance and reduces exceptions</p>
                  </div>
                </div>
              </div>

              <!-- Services Provided -->
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-3">Services Provided</label>
                <div class="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div v-for="service in availableServices.filter(s => caregiverVisit.services_rendered.includes(s.id))"
                    :key="service.id" class="flex items-center p-3 border border-green-500 rounded-lg bg-green-50">
                    <svg class="w-4 h-4 text-green-500 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
                    </svg>
                    <span class="text-sm text-gray-700 font-medium">{{ service.name }}</span>
                    <span class="ml-auto text-xs text-gray-500">Task ID: {{ service.id }}</span>
                  </div>
                </div>
              </div>

              <!-- Visit Notes -->
              <div>
                <label for="visit-notes" class="block text-sm font-medium text-gray-700 mb-2">Visit Notes</label>
                <textarea id="visit-notes" v-model="caregiverVisit.visit_notes" rows="4"
                  class="w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 transition-colors"
                  placeholder="Add any notes about the visit..."></textarea>
                <p class="text-xs text-gray-500 mt-1">Notes will be included in EVV transmission</p>
              </div>

              <!-- EVV Information -->
              <div class="bg-gray-50 border border-gray-200 rounded-lg p-4">
                <h4 class="text-sm font-medium text-gray-900 mb-2">EVV Information</h4>
                <div class="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p class="text-gray-600">Visit ID:</p>
                    <p class="font-mono text-gray-900">{{ caregiverVisit.visit_other_id }}</p>
                  </div>
                  <div>
                    <p class="text-gray-600">Sequence ID:</p>
                    <p class="font-mono text-gray-900">{{ caregiverVisit.sequence_id }}</p>
                  </div>
                  <div>
                    <p class="text-gray-600">Client ID:</p>
                    <p class="font-mono text-gray-900">{{ caregiverVisit.client_id }}</p>
                  </div>
                  <div>
                    <p class="text-gray-600">Procedure Code:</p>
                    <p class="font-mono text-gray-900">{{ caregiverVisit.procedure_code }}</p>
                  </div>
                </div>
              </div>

              <!-- Action Buttons -->
              <!-- Action Buttons -->
              <div class="flex justify-end space-x-3 pt-6 border-t border-gray-200">
                <button @click="goBack" type="button"
                  class="px-6 py-3 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 transition-colors">
                  Cancel
                </button>
                <button @click="submitCaregiverCheckOut" type="button"
                  class="px-6 py-3 border border-transparent rounded-lg text-sm font-medium text-white bg-red-600 hover:bg-red-700 focus:outline-none transition-colors shadow-sm">
                  Confirm Check Out <!-- ✅ CORRECTED -->
                </button>
              </div>
            </div>
          </div>
        </div>

        <!-- Other Views -->
        <ClientsView v-else-if="currentView === 'clients'" />
        <VisitsView v-else-if="currentView === 'visits'" />
        <EmployeeView v-else-if="currentView === 'services'" />
        <XrefsPage v-else-if="currentView === 'xrefs'" />
        <SettingsPage v-else-if="currentView === 'settings'" />
        <ProfilePage v-else-if="currentView === 'profile'" />
        <PasswordChange v-else-if="currentView === 'password'" />

      </main>
    </div>
  </div>
  <TheFooter />
</template>

<style scoped>
canvas {
  touch-action: none;
}
</style>
