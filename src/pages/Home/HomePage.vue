<script setup>
import { ref, computed, onMounted } from 'vue'
import axiosInstance from '@/axiosconfig/axiosInstance'
import TheNavbar from '@/components/TheNavbar.vue'
import TheFooter from '@/components/TheFooter.vue'
import EmployeeInfo from '@/components/EmployeeInfo.vue'

// Employee data structure
const employee = ref({
  name: '',
  email: '',
  phone: '',
  address: {
    street: '',
    street2: '',
    city: '',
    state: '',
    zip: '',
  },
  employment: {
    manager: '',
    payPeriodStart: '',
    payPeriodEnd: '',
  },
  settings: {
    id: null,
    street_address: '',
    address2: '',
    city: '',
    state: '',
    zip_code: '',
    manager_name: '',
    user: null,
  },
})

// UI State
const loading = ref(false)
const error = ref(null)
const recentDays = ref([])
const todayCheckIn = ref(null)
const todayCheckOut = ref(null)
const currentSessionStart = ref(null)
const payPeriod = ref({ start: '', end: '' })
const notification = ref({
  show: false,
  message: '',
  type: 'success',
})
const isTimerPaused = ref(false)
const pauseStartTime = ref(null)
const timeAway = ref(0.0)
const pauseReason = ref('')
const showPauseModal = ref(false)
const showResumeModal = ref(false)
const userId = ref(null)
const locationLoading = ref(false)

// Computed properties
const totalHours = computed(() => {
  return recentDays.value.reduce((total, day) => total + day.hours, 0)
})

const ratePerHour = computed(() => {
  return recentDays.value[0]?.rate_per_hour || 0
})

const formattedRate = computed(() => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(ratePerHour.value)
})

const biweeklyTotalHours = computed(() => {
  return recentDays.value[0]?.biweekly_total_hours || 80
})

const biweeklyProgress = computed(() => {
  return Math.min(100, (biweeklyHours.value / biweeklyTotalHours.value) * 100)
})

const currentDate = computed(() => {
  const azDate = new Date().toLocaleString('en-US', {
    timeZone: 'America/Phoenix'
  });
  return new Date(azDate).toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
})

const biweeklyHours = computed(() => {
  return recentDays.value.reduce((total, day) => {
    return total + (day.hours || 0)
  }, 0)
})

const todayHours = computed(() => {
  const todayStr = new Date().toLocaleDateString('en-US', {
    month: 'numeric',
    day: 'numeric',
    year: 'numeric',
  });
  const todayRecord = recentDays.value.find(day => day.date === todayStr);
  return todayRecord ? todayRecord.hours : 0;
})

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

// Timer control functions
const openPauseModal = () => {
  showPauseModal.value = true
}

const pauseTimer = async () => {
  if (!pauseReason.value.trim()) {
    showNotification('Please enter a reason for pausing', 'error')
    return
  }

  try {
    let location = { latitude: null, longitude: null }
    try {
      location = await getCurrentLocation()
    } catch (geoError) {
      console.warn('Could not get location:', geoError)
      showNotification('Could not get your location. Pause recorded without location.', 'warning')
    }

    pauseStartTime.value = new Date()
    isTimerPaused.value = true
    showPauseModal.value = false

    await axiosInstance.post('api/attendance/pause/', {
      reason: pauseReason.value,
      pause_time: pauseStartTime.value.toISOString(),
      user: userId.value,
      user_name: employee.value.name,
      latitude: location.latitude,
      longitude: location.longitude
    })
    await checkPauseState()
    showNotification('Timer paused successfully')
    pauseReason.value = ''
  } catch (error) {
    console.error('Error pausing timer:', error)
    showNotification('Failed to pause timer', 'error')
  }
}

const resumeTimer = () => {
  const now = new Date()
  timeAway.value = (now - new Date(pauseStartTime.value)) / (1000 * 60)
  showResumeModal.value = true
}

const confirmResume = async () => {
  const resumeTime = new Date()

  try {
    let location = { latitude: null, longitude: null }
    try {
      location = await getCurrentLocation()
    } catch (geoError) {
      console.warn('Could not get location:', geoError)
      showNotification('Could not get your location. Resume recorded without location.', 'warning')
    }

    await axiosInstance.post('api/attendance/resume/', {
      time_record: timeAway.value,
      pause_reason: pauseReason.value,
      resume_time: resumeTime.toISOString(),
      user: userId.value,
      user_name: employee.value.name,
      latitude: location.latitude,
      longitude: location.longitude
    })
    await checkPauseState()
    isTimerPaused.value = false
    pauseStartTime.value = null
    showResumeModal.value = false
    timeAway.value = 0

    showNotification('Timer resumed successfully')
  } catch (error) {
    console.error('Error resuming timer:', error)
    showNotification('Failed to resume timer', 'error')
  }
}

// Helper Methods
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

const formatHours = (hours) => {
  if (isNaN(hours) || hours === 0) return '0h 0m'
  const hrs = Math.floor(hours)
  const mins = Math.round((hours % 1) * 60)
  return `${hrs}h ${mins}m`
}

const formatDate = (dateStr) => {
  if (!dateStr) return '--/--/----'
  try {
    const date = new Date(dateStr)
    if (isNaN(date.getTime())) return '--/--/----'
    return date.toLocaleDateString('en-US', {
      month: 'numeric',
      day: 'numeric',
      year: 'numeric',
    })
  } catch {
    return '--/--/----'
  }
}

const formatTime = (timeStr) => {
  return timeStr || '--:-- --'
}

// Data Fetching Methods
const fetchPayPeriodRange = async () => {
  try {
    const response = await axiosInstance.get('api/attendance/biweekly-date-range/')
    payPeriod.value = {
      start: response.data.start_date,
      end: response.data.end_date
    }
    employee.value.employment.payPeriodStart = payPeriod.value.start
    employee.value.employment.payPeriodEnd = payPeriod.value.end
    return payPeriod.value
  } catch (err) {
    console.error('Error fetching pay period range:', err)
    showNotification('Failed to load pay period range', 'error')
    return null
  }
}

const fetchSettings = async () => {
  try {
    const response = await axiosInstance.get('/api/user/settings/')
    employee.value.settings = response.data

    employee.value.address = {
      street: response.data.street_address || '',
      street2: response.data.address2 || '',
      city: response.data.city || '',
      state: response.data.state || '',
      zip: response.data.zip_code || '',
    }

    if (response.data.manager_name) {
      employee.value.employment.manager = response.data.manager_name
    }
  } catch (err) {
    if (err.response?.status === 404) {
      console.log('No settings found, using default values')
    } else {
      console.error('Error fetching settings:', err)
      showNotification('Failed to load settings', 'error')
    }
  }
}

const fetchEmployeeData = async () => {
  try {
    loading.value = true
    error.value = null

    const profileResponse = await axiosInstance.get('/api/profile/')
    employee.value.name = profileResponse.data.name || ''
    employee.value.email = profileResponse.data.email || ''
    employee.value.phone = profileResponse.data.phone || ''
    userId.value = profileResponse.data.id || null

    await fetchSettings()
    await fetchPayPeriodRange()
    await fetchTimeRecords()
    await fetchTodayStatus()
  } catch (err) {
    error.value = 'Failed to load employee data. Please try again later.'
    console.error('Error fetching employee data:', err)
    showNotification('Failed to load employee data', 'error')
  } finally {
    loading.value = false
  }
}

const fetchTimeRecords = async () => {
  try {
    const response = await axiosInstance.get('api/attendance/history/')

    // Get pay period range
    const payPeriodRange = await fetchPayPeriodRange()
    const startDate = new Date(payPeriodRange.start)
    const endDate = new Date(payPeriodRange.end)

    // Filter records within the pay period range
    const filteredRecords = response.data.filter(record => {
      const recordDate = new Date(record.date)
      return recordDate >= startDate && recordDate <= endDate
    })

    recentDays.value = filteredRecords.map((record) => {
      const fullDate = record.date
      const day = new Date(fullDate).toLocaleDateString('en-US', { weekday: 'long' })
      return {
        id: record.id,
        date: formatDate(fullDate),
        day,
        checkIn: record.check_in || '--:-- --',
        checkOut: record.check_out || null,
        hours: parseFloat(record.hours_worked) || 0,
        status: record.check_out ? 'Completed' : 'In Progress',
        rate_per_hour: parseFloat(record.rate_per_hour) || 0,
        biweekly_total_hours: parseFloat(record.biweekly_total_hours) || 80,
      }
    })

    // Update pay period dates from the API response
    if (payPeriodRange) {
      payPeriod.value.start = payPeriodRange.start
      payPeriod.value.end = payPeriodRange.end
      employee.value.employment.payPeriodStart = payPeriod.value.start
      employee.value.employment.payPeriodEnd = payPeriod.value.end
    }
  } catch (err) {
    console.error('Error fetching time records:', err)
    showNotification('Failed to load time records', 'error')
  }
}

const fetchTodayStatus = async () => {
  try {
    const response = await axiosInstance.get('api/attendance/today/')
    if (response.data.id) {
      todayCheckIn.value = response.data.check_in || '--:-- --'
      currentSessionStart.value = `${response.data.date} ${response.data.check_in}`
      if (response.data.check_out) {
        todayCheckOut.value = response.data.check_out
      }
    }
  } catch (err) {
    console.error('Error fetching today status:', err)
  }
}

// Action Methods
const checkIn = async () => {
  try {
    let location = { latitude: null, longitude: null }
    try {
      location = await getCurrentLocation()
    } catch (geoError) {
      console.warn('Could not get location:', geoError)
      showNotification('Could not get your location. Check-in recorded without location.', 'warning')
    }

    const response = await axiosInstance.post('api/attendance/checkin/', {
      latitude: location.latitude,
      longitude: location.longitude
    })
    const record = response.data

    todayCheckIn.value = formatTime(record.check_in)
    currentSessionStart.value = record.check_in

    const todayStr = formatDate(record.date)
    const existingIndex = recentDays.value.findIndex((day) => day.date === todayStr)

    if (existingIndex === -1) {
      recentDays.value.unshift({
        id: record.id,
        date: todayStr,
        day: new Date(record.date).toLocaleDateString('en-US', { weekday: 'long' }),
        checkIn: todayCheckIn.value,
        checkOut: null,
        hours: 0,
        status: 'In Progress',
      })
    }

    showNotification('Checked in successfully')
  } catch (err) {
    const errorMsg = err.response?.data?.error || 'Failed to check in'
    error.value = errorMsg
    showNotification(errorMsg, 'error')
    console.error('Error checking in:', err)
  }
}

const checkOut = async () => {
  try {
    let location = { latitude: null, longitude: null }
    try {
      location = await getCurrentLocation()
    } catch (geoError) {
      console.warn('Could not get location:', geoError)
      showNotification('Could not get your location. Check-out recorded without location.', 'warning')
    }

    const response = await axiosInstance.post('api/attendance/checkout/', {
      latitude: location.latitude,
      longitude: location.longitude
    })
    const record = response.data

    todayCheckOut.value = formatTime(record.check_out)

    const todayStr = formatDate(record.date)
    const todayIndex = recentDays.value.findIndex((day) => day.date === todayStr)

    if (todayIndex !== -1) {
      recentDays.value[todayIndex].checkOut = todayCheckOut.value
      recentDays.value[todayIndex].status = 'Completed'
      recentDays.value[todayIndex].hours = parseFloat(record.hours_worked) || 0
    }

    showNotification('Checked out successfully')
  } catch (err) {
    const errorMsg = err.response?.data?.error || 'Failed to check out'
    error.value = errorMsg
    showNotification(errorMsg, 'error')
    console.error('Error checking out:', err)
  }
}

const showTimeHistory = async () => {
  try {
    await fetchTimeRecords()
    showNotification('Time records refreshed')
  } catch (err) {
    showNotification('Failed to refresh time records', 'error')
    console.error('Error refreshing time records:', err)
  }
}

const checkPauseState = async () => {
  try {
    const response = await axiosInstance.get('api/attendance/resume/')
    isTimerPaused.value = response.data.paused
  } catch (error) {
    console.error('Error checking pause state:', error)
    isTimerPaused.value = false
  }
}

const printTimeRecords = async () => {
  try {
    const style = document.createElement('style')
    style.innerHTML = `
      @page {
        size: A4 portrait;
        margin: 1.5cm;
      }
      @media print {
        body {
          font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
          color: #2c3e50;
          background: #fff;
        }
        .print-header {
          text-align: center;
          margin-bottom: 30px;
        }
        .print-title {
          font-size: 26px;
          font-weight: bold;
        }
        .print-subtitle {
          font-size: 16px;
          color: #555;
          margin-top: 5px;
        }
        .print-table {
          width: 100%;
          border-collapse: collapse;
          margin-top: 30px;
          font-size: 14px;
        }
        .print-table th,
        .print-table td {
          border: 1px solid #ccc;
          padding: 8px 12px;
          text-align: left;
        }
        .print-table th {
          background-color: #f0f0f0;
        }
        .print-table .print-total {
          font-weight: bold;
          background-color: #f9f9f9;
        }
        .status-completed {
          color: #28a745;
          font-weight: bold;
        }
        .status-in-progress {
          color: #ffc107;
          font-weight: bold;
        }
        .status-missing {
          color: #dc3545;
          font-weight: bold;
        }
      }
    `

    const printWindow = window.open('', '_blank', 'width=800,height=600')

    const tableHtml = `
      <table class="print-table">
        <thead>
          <tr>
            <th>Date</th>
            <th>Day</th>
            <th>Check In</th>
            <th>Check Out</th>
            <th>Hours</th>
            <th>Status</th>
          </tr>
        </thead>
        <tbody>
          ${recentDays.value.map(day => `
            <tr>
              <td>${day.date}</td>
              <td>${day.day}</td>
              <td>${day.checkIn || '--:-- --'}</td>
              <td>${day.checkOut || '--:-- --'}</td>
              <td>${formatHours(day.hours)}</td>
              <td class="status-${day.status.toLowerCase().replace(' ', '-')}">
                ${day.status}
              </td>
            </tr>
          `).join('')}
          <tr class="print-total">
            <td colspan="4">Total Hours</td>
            <td>${formatHours(totalHours.value)}</td>
            <td></td>
          </tr>
        </tbody>
      </table>
    `

    printWindow.document.open()
    printWindow.document.write(`
      <html>
        <head>
          <title>Time Records - ${employee.value.name}</title>
          <style>${style.innerHTML}</style>
        </head>
        <body>
          <div class="print-header">
            <div class="print-title">Time Records - ${employee.value.name}</div>
            <div class="print-subtitle">
              Pay Period: ${payPeriod.value.start || '--/--/----'} - ${payPeriod.value.end || '--/--/----'}
            </div>
          </div>
          ${tableHtml}
          <script>
            window.addEventListener('load', function() {
              setTimeout(function() {
                window.print();
              }, 300);
            });
          <\/script>
        </body>
      </html>
    `)
    printWindow.document.close()

    showNotification('Printing time records...')
  } catch (error) {
    console.error('Error printing time records:', error)
    showNotification('Failed to print time records', 'error')
  }
}

onMounted(() => {
  fetchEmployeeData()
  checkPauseState()
  setInterval(() => { }, 60000)
})
</script>

<template>
  <TheNavbar />
  <div class="min-h-screen bg-gray-50">
    <!-- Loading overlay -->
    <div v-if="loading"
      class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 backdrop-blur-sm">
      <div class="flex flex-col items-center">
        <div class="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-blue-500 mb-4"></div>
        <p class="text-white font-medium">Loading your dashboard...</p>
      </div>
    </div>

    <!-- Notification -->
    <transition enter-active-class="transform ease-out duration-300 transition"
      enter-from-class="translate-y-2 opacity-0 sm:translate-y-0 sm:translate-x-2"
      enter-to-class="translate-y-0 opacity-100 sm:translate-x-0" leave-active-class="transition ease-in duration-100"
      leave-from-class="opacity-100" leave-to-class="opacity-0">
      <div v-if="notification.show" class="fixed top-6 right-6 z-50">
        <div :class="{
          'flex items-center p-4 rounded-lg shadow-xl border-l-4': true,
          'bg-green-50 text-green-800 border-green-500': notification.type === 'success',
          'bg-red-50 text-red-800 border-red-500': notification.type === 'error',
          'bg-yellow-50 text-yellow-800 border-yellow-500': notification.type === 'warning',
          'animate-fade-in-up': notification.show,
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

    <!-- Error message -->
    <transition enter-active-class="transform ease-out duration-300 transition"
      enter-from-class="translate-y-2 opacity-0" enter-to-class="translate-y-0 opacity-100"
      leave-active-class="transition ease-in duration-100" leave-from-class="opacity-100" leave-to-class="opacity-0">
      <div v-if="error"
        class="bg-red-50 border-l-4 border-red-500 text-red-700 p-4 mb-6 mx-6 mt-6 rounded-r-lg shadow-sm">
        <div class="flex">
          <div class="flex-shrink-0">
            <svg class="h-5 w-5 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <div class="ml-3">
            <p class="text-sm">{{ error }}</p>
          </div>
        </div>
      </div>
    </transition>

    <!-- Main Content -->
    <main class="max-w-7xl mx-auto px-4 py-6 sm:px-6 lg:px-8">
      <!-- System Header Section -->
      <div
        class="relative bg-gradient-to-r from-blue-50 to-indigo-50 rounded-2xl p-6 border border-blue-100 shadow-sm mb-6 animate-pulse">
        <div class="flex flex-col md:flex-row md:items-center gap-5">
          <div class="flex-shrink-0 bg-blue-100 p-3 rounded-full">
            <svg class="h-8 w-8 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
            </svg>
          </div>
          <div class="flex-1">
            <h3 class="text-lg font-semibold text-gray-800 mb-1">Keep your profile up to date!</h3>
            <p class="text-gray-600">
              Your accurate information helps us serve you better. Please review and update your
              <span class="font-medium text-blue-600">personal details</span> and
              <span class="font-medium text-blue-600">contact information</span>.
            </p>
          </div>
          <div class="flex-shrink-0">
            <router-link to="/settings">
              <button
                class="inline-flex items-center px-4 py-2 bg-[color:#217566] text-white rounded-lg shadow-sm hover:shadow-md transition-all duration-200 transform hover:-translate-y-0.5">
                <svg class="h-5 w-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                    d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
                Confirm Now
              </button>
            </router-link>
          </div>
        </div>
      </div>

      <!-- Action Cards Section -->
      <div class="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <!-- Today's Hours Card -->
        <div
          class="bg-white rounded-xl shadow-md overflow-hidden transition-all duration-300 hover:shadow-lg hover:-translate-y-1">
          <div class="px-6 py-5 bg-gradient-to-r from-green-50 to-teal-50 border-b border-gray-200">
            <h2 class="text-lg font-semibold text-gray-800 flex items-center">
              <svg class="h-5 w-5 text-green-600 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                  d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Today's Status
            </h2>
          </div>
          <div class="px-6 py-5">
            <div class="flex items-center justify-between mb-4">
              <p class="text-sm font-medium text-gray-500">Date</p>
              <p class="text-sm font-medium text-gray-700">{{ currentDate }}</p>
            </div>
            <div class="space-y-5">
              <div>
                <p class="text-sm font-medium text-gray-500 mb-1">Check In</p>
                <p class="text-xl font-medium"
                  :class="{ 'text-gray-400': !todayCheckIn, 'text-green-600': todayCheckIn }">
                  {{ todayCheckIn || '--:-- --' }}
                </p>
              </div>
              <div>
                <p class="text-sm font-medium text-gray-500 mb-1">Check Out</p>
                <p class="text-xl font-medium"
                  :class="{ 'text-gray-400': !todayCheckOut, 'text-red-600': todayCheckOut }">
                  {{ todayCheckOut || '--:-- --' }}
                </p>
              </div>
              <div>
                <p class="text-sm font-medium text-gray-500 mb-1">Hours Today</p>
                <p class="text-2xl font-bold text-blue-600">{{ formatHours(todayHours) }}</p>
              </div>
            </div>
          </div>
        </div>

        <!-- Quick Actions Card -->
        <div
          class="bg-white rounded-xl shadow-md overflow-hidden transition-all duration-300 hover:shadow-lg hover:-translate-y-1">
          <div class="px-6 py-5 bg-gradient-to-r from-purple-50 to-pink-50 border-b border-gray-200">
            <h2 class="text-lg font-semibold text-gray-800 flex items-center">
              <svg class="h-5 w-5 text-purple-600 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                  d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                  d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              Quick Actions
            </h2>
          </div>
          <div class="px-6 py-5 space-y-4">
            <button @click="checkIn" :disabled="!!todayCheckIn || locationLoading"
              class="w-full flex items-center justify-center px-6 py-3 border border-transparent rounded-xl shadow-sm text-sm font-medium text-white bg-gradient-to-r from-green-500 to-teal-600 hover:from-green-600 hover:to-teal-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-70 disabled:cursor-not-allowed transition-all duration-300 transform hover:scale-[1.02]">
              <svg v-if="locationLoading" class="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
                xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                <path class="opacity-75" fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z">
                </path>
              </svg>
              <svg v-else class="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
              </svg>
              {{ locationLoading ? 'Getting location...' : 'Check In' }}
            </button>
            <button @click="checkOut" :disabled="!todayCheckIn || !!todayCheckOut || locationLoading"
              class="w-full flex items-center justify-center px-6 py-3 border border-transparent rounded-xl shadow-sm text-sm font-medium text-white bg-gradient-to-r from-red-500 to-pink-600 hover:from-red-600 hover:to-pink-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-70 disabled:cursor-not-allowed transition-all duration-300 transform hover:scale-[1.02]">
              <svg v-if="locationLoading" class="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
                xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                <path class="opacity-75" fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z">
                </path>
              </svg>
              <svg v-else class="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20 12H4" />
              </svg>
              {{ locationLoading ? 'Getting location...' : 'Check Out' }}
            </button>
            <button @click="showTimeHistory"
              class="w-full flex items-center justify-center px-6 py-3 border border-gray-300 rounded-xl shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all duration-300 transform hover:scale-[1.02]">
              <svg class="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                  d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              Refresh Time History
            </button>
          </div>
        </div>

        <!-- Current Pay Period Hours Card -->
        <div id="hoursworked"
          class="bg-white shadow-lg rounded-xl overflow-hidden transition-all duration-300 hover:shadow-xl">
          <div class="px-6 py-4 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-indigo-50">
            <h2 class="text-lg font-semibold text-gray-800">Current Pay Period</h2>
          </div>
          <div class="px-6 py-5">
            <div class="flex items-center justify-between mb-6">
              <div>
                <p class="text-sm font-medium text-gray-500">Hours Worked</p>
                <p class="text-3xl font-bold text-blue-600">{{ formatHours(biweeklyHours) }}</p>
              </div>
              <div class="bg-blue-100 p-3 rounded-full">
                <svg xmlns="http://www.w3.org/2000/svg" class="h-8 w-8 text-blue-600" fill="none" viewBox="0 0 24 24"
                  stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                    d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </div>
            </div>

            <div class="mb-4">
              <p class="text-sm font-medium text-gray-500">Rate Per Hour</p>
              <p class="text-xl font-bold text-green-600">{{ formattedRate }}</p>
            </div>

            <div>
              <div class="flex items-center justify-between mb-1">
                <span class="text-xs font-medium text-gray-500">
                  Progress to {{ biweeklyTotalHours }} hours
                </span>
                <span class="text-xs font-medium text-gray-500">
                  {{ Math.round(biweeklyProgress) }}%
                </span>
              </div>
              <div class="w-full bg-gray-200 rounded-full h-2.5">
                <div class="bg-gradient-to-r from-blue-500 to-indigo-600 h-2.5 rounded-full"
                  :style="{ width: `${biweeklyProgress}%` }"></div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Rest of your existing content (Recent Days Worked Table, Current Time Tracking Banner, Modals) -->
      <!-- Recent Days Worked Table -->
      <div id="workedhours"
        class="bg-white rounded-xl shadow-xl overflow-hidden mb-8 transition-all duration-300 hover:shadow-2xl">
        <div class="px-6 py-5 bg-gradient-to-r from-gray-800 to-gray-900 flex justify-between items-center">
          <h2 class="text-lg font-semibold text-white flex items-center">
            <svg class="h-5 w-5 text-blue-300 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            Recent Days Worked
          </h2>
          <div class="px-4 py-4 flex flex-col sm:flex-row sm:justify-between sm:items-center space-y-3 sm:space-y-0">
            <div class="sm:hidden">
              <p
                class="text-sm text-blue-600 font-medium border border-blue-300 rounded-md px-3 py-1 bg-blue-100 transition-colors">
                Name: {{ employee.name || 'Not specified' }}
              </p>
            </div>
            <div class="flex flex-col sm:flex-row sm:items-center sm:space-x-4 space-y-3 sm:space-y-0 w-full sm:w-auto">
              <p
                class="hidden sm:block text-sm text-blue-600 font-medium border-2 border-blue-300 rounded-md px-3 py-1 bg-blue-100 transition-colors">
                Name: {{ employee.name || 'Not specified' }}
              </p>
              <div class="flex items-center space-x-2 bg-gray-700 px-3 py-1 rounded-full">
                <span class="text-xs text-gray-300">Pay Period:</span>
                <span class="text-xs font-medium text-white">
                  {{ payPeriod.start || '--/--/----' }} - {{ payPeriod.end || '--/--/----' }}
                </span>
              </div>
              <button @click="printTimeRecords"
                class="flex items-center text-white bg-blue-600 hover:bg-blue-700 px-3 py-1 rounded-lg text-sm transition-colors">
                <svg class="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                    d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
                </svg>
                Print
              </button>
            </div>
          </div>
        </div>
        <div class="overflow-x-auto">
          <table class="min-w-full divide-y divide-gray-200">
            <thead class="bg-gray-50">
              <tr>
                <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Date</th>
                <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Day</th>
                <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Check In</th>
                <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Check Out</th>
                <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Hours</th>
                <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status</th>
              </tr>
            </thead>
            <tbody class="bg-white divide-y divide-gray-200">
              <tr v-for="day in recentDays" :key="day.id" class="hover:bg-gray-50 transition-colors duration-150">
                <td class="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                  {{ day.date }}
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {{ day.day }}
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {{ day.checkIn || '--:-- --' }}
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {{ day.checkOut || '--:-- --' }}
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {{ formatHours(day.hours) }}
                </td>
                <td class="px-6 py-4 whitespace-nowrap">
                  <span :class="{
                    'px-2.5 py-0.5 inline-flex text-xs leading-5 font-semibold rounded-full': true,
                    'bg-green-100 text-green-800': day.status === 'Completed',
                    'bg-yellow-100 text-yellow-800': day.status === 'In Progress',
                    'bg-red-100 text-red-800': day.status === 'Missing',
                  }">
                    {{ day.status }}
                  </span>
                </td>
              </tr>
              <!-- Total row for display (hidden when printing) -->
              <tr class="bg-gray-100 font-semibold no-print">
                <td class="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900" colspan="4">Total Hours</td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{{ formatHours(totalHours) }}</td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900"></td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <!-- Current Time Tracking Banner -->
      <transition enter-active-class="transform transition duration-500 ease-out"
        enter-from-class="-translate-y-10 opacity-0" enter-to-class="translate-y-0 opacity-100"
        leave-active-class="transform transition duration-300 ease-in" leave-from-class="translate-y-0 opacity-100"
        leave-to-class="-translate-y-10 opacity-0">
        <div v-if="todayCheckIn && !todayCheckOut"
          class="bg-gradient-to-r from-blue-100 to-indigo-100 rounded-xl p-6 mb-8 shadow-lg border border-blue-200">
          <div class="flex flex-col md:flex-row items-center justify-between">
            <div class="flex items-center mb-4 md:mb-0">
              <div class="bg-gradient-to-br from-blue-400 to-indigo-500 p-3 rounded-full mr-4 shadow-md">
                <svg class="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                    d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div>
                <h3 class="text-lg font-semibold text-indigo-800">Currently Working</h3>
                <p class="text-sm text-indigo-600 font-medium">
                  Checked in at <span class="text-indigo-800 font-bold">{{ todayCheckIn }}</span>
                </p>
              </div>
            </div>
            <div class="text-center md:text-right">
              <p class="text-sm text-indigo-600 font-medium">Time elapsed today</p>
              <p class="text-3xl font-bold text-indigo-700 animate-pulse">
                {{ formatHours(todayHours) }}
              </p>
            </div>
          </div>
          <div class="flex justify-center space-x-4 mt-4">
            <button v-if="!isTimerPaused" @click="openPauseModal" :disabled="locationLoading"
              class="px-4 py-2 bg-yellow-500 text-white rounded-lg hover:bg-yellow-600 transition-colors flex items-center disabled:opacity-70 disabled:cursor-not-allowed">
              <svg v-if="locationLoading" class="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
                xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                <path class="opacity-75" fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z">
                </path>
              </svg>
              <svg v-else class="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                  d="M10 9v6m4-6v6m7-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              {{ locationLoading ? 'Getting location...' : 'Pause Timer' }}
            </button>

            <button v-else @click="resumeTimer" :disabled="locationLoading"
              class="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors flex items-center disabled:opacity-70 disabled:cursor-not-allowed">
              <svg v-if="locationLoading" class="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
                xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                <path class="opacity-75" fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z">
                </path>
              </svg>
              <svg v-else class="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                  d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                  d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              {{ locationLoading ? 'Getting location...' : 'Resume Timer' }}
            </button>
          </div>

          <div v-if="isTimerPaused" class="mt-4 text-center">
            <span
              class="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-yellow-100 text-yellow-800">
              <svg class="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                  d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Timer Paused
            </span>
          </div>
        </div>
      </transition>

      <!-- Pause Timer Modal -->
      <transition enter-active-class="ease-out duration-300" enter-from-class="opacity-0" enter-to-class="opacity-100"
        leave-active-class="ease-in duration-200" leave-from-class="opacity-100" leave-to-class="opacity-0">
        <div v-if="showPauseModal"
          class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div class="bg-white rounded-xl shadow-xl max-w-md w-full p-6">
            <h3 class="text-lg font-medium text-gray-900 mb-4">Pause Timer</h3>
            <p class="text-sm text-gray-500 mb-4">
              Please provide a reason for pausing your timer:
            </p>

            <textarea v-model="pauseReason" rows="3"
              class="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              placeholder="Enter reason..."></textarea>

            <div class="mt-6 flex justify-end space-x-3">
              <button @click="showPauseModal = false" type="button"
                class="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500">
                Cancel
              </button>
              <button @click="pauseTimer" type="button" :disabled="locationLoading"
                class="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-yellow-600 hover:bg-yellow-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-yellow-500 disabled:opacity-70 disabled:cursor-not-allowed">
                <svg v-if="locationLoading" class="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
                  xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                  <path class="opacity-75" fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z">
                  </path>
                </svg>
                {{ locationLoading ? 'Processing...' : 'Confirm Pause' }}
              </button>
            </div>
          </div>
        </div>
      </transition>

      <!-- Resume Timer Modal -->
      <transition enter-active-class="ease-out duration-300" enter-from-class="opacity-0" enter-to-class="opacity-100"
        leave-active-class="ease-in duration-200" leave-from-class="opacity-100" leave-to-class="opacity-0">
        <div v-if="showResumeModal"
          class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div class="bg-white rounded-xl shadow-xl max-w-md w-full p-6">
            <div class="text-center mb-6">
              <div class="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-green-100 mb-4">
                <svg class="h-6 w-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h3 class="text-lg font-medium text-gray-900 mb-2">Ready to Resume Work?</h3>
              <p class="text-sm text-gray-500">
                Welcome back! Your timer will continue from where you left off.
              </p>
            </div>

            <div class="bg-blue-50 rounded-lg p-4 mb-6">
              <div class="flex items-center justify-center space-x-2">
                <svg class="h-5 w-5 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                    d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span class="text-sm font-medium text-blue-700">Timer will resume automatically</span>
              </div>
            </div>

            <div class="mt-6 flex justify-end space-x-3">
              <button @click="showResumeModal = false" type="button"
                class="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors duration-200">
                Cancel
              </button>
              <button @click="confirmResume" type="button" :disabled="locationLoading"
                class="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 transition-colors duration-200 disabled:opacity-70 disabled:cursor-not-allowed">
                <svg v-if="locationLoading" class="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
                  xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                  <path class="opacity-75" fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z">
                  </path>
                </svg>
                {{ locationLoading ? 'Processing...' : 'Resume Timer' }}
              </button>
            </div>
          </div>
        </div>
      </transition>
      <!-- Employee Profile Section -->
      <div class="bg-white rounded-xl shadow-lg overflow-hidden mb-8">
        <div class="px-6 py-5 bg-gradient-to-r from-gray-50 to-gray-100 border-b border-gray-200">
          <h2 class="text-xl font-semibold text-gray-800">Employee Profile</h2>
        </div>
        <div class="p-6">
          <EmployeeInfo :employee="employee" :loading="loading" :error="error" />
        </div>
      </div>
    </main>
  </div>
  <TheFooter />
</template>

<style scoped>
@keyframes fadeInUp {
  from {
    opacity: 0;
    transform: translateY(20px);
  }

  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.animate-fade-in-up {
  animation: fadeInUp 0.5s ease-out;
}

button,
a,
input,
select,
textarea,
.transition-all {
  transition-property: all;
  transition-timing-function: cubic-bezier(0.4, 0, 0.2, 1);
  transition-duration: 200ms;
}

.shadow-md {
  box-shadow:
    0 4px 6px -1px rgba(0, 0, 0, 0.1),
    0 2px 4px -1px rgba(0, 0, 0, 0.06);
}

.shadow-lg {
  box-shadow:
    0 10px 15px -3px rgba(0, 0, 0, 0.1),
    0 4px 6px -2px rgba(0, 0, 0, 0.05);
}

.shadow-xl {
  box-shadow:
    0 20px 25px -5px rgba(0, 0, 0, 0.1),
    0 10px 10px -5px rgba(0, 0, 0, 0.04);
}

.shadow-2xl {
  box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
}

@keyframes pulse {

  0%,
  100% {
    opacity: 1;
  }

  50% {
    opacity: 0.7;
  }
}

.animate-pulse {
  animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
}

.hover\:scale-\[1\.02\]:hover {
  transform: scale(1.02);
}

.backdrop-blur-sm {
  backdrop-filter: blur(4px);
}
</style>
