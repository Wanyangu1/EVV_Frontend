<script setup>
import { ref, onMounted, computed } from 'vue'
import axiosInstance from '@/axiosconfig/axiosInstance'

const visits = ref([])
const clients = ref([])
const loading = ref(false)
const activeTab = ref('overview')

// Fetch both visits and clients data
const fetchData = async () => {
  try {
    loading.value = true
    const [visitsResponse, clientsResponse] = await Promise.all([
      axiosInstance.get('/api/evv/visits/'),
      axiosInstance.get('/api/evv/clients/')
    ])

    visits.value = visitsResponse.data
    clients.value = clientsResponse.data
  } catch (err) {
    console.error('Error fetching data:', err)
  } finally {
    loading.value = false
  }
}

// Create a clients map for easy lookup
const clientsMap = computed(() => {
  const map = {}
  clients.value.forEach(client => {
    map[client.id] = client
  })
  return map
})

// Get client details by ID
const getClientDetails = (clientId) => {
  return clientsMap.value[clientId] || null
}

// Get client name with fallback
const getClientName = (clientId) => {
  const client = getClientDetails(clientId)
  if (client) {
    return `${client.first_name} ${client.last_name}`
  }
  return `Client ${clientId}`
}

// Get client services
const getClientServices = (clientId) => {
  const client = getClientDetails(clientId)
  return client?.services_needed || []
}

// Get completed services for a visit
const getCompletedServices = (visit) => {
  if (!visit.services || visit.services.length === 0) return []

  const clientServices = getClientServices(visit.client)
  return clientServices.filter(service =>
    visit.services.includes(service.id)
  )
}

// Computed properties for statistics
const stats = computed(() => {
  const completedVisits = visits.value.filter(v => v.status === 'completed').length
  const inProgressVisits = visits.value.filter(v => v.status === 'checked_in').length
  const totalHours = visits.value
    .filter(v => v.hours_worked)
    .reduce((sum, v) => sum + parseFloat(v.hours_worked), 0)

  // Calculate unique clients served
  const uniqueClients = new Set(visits.value.map(v => v.client)).size

  return {
    total: visits.value.length,
    completed: completedVisits,
    inProgress: inProgressVisits,
    totalHours: totalHours.toFixed(1),
    uniqueClients: uniqueClients
  }
})

// Enhanced stats with client-specific data
const enhancedStats = computed(() => {
  const today = new Date()
  const oneWeekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000)

  const recentVisits = visits.value.filter(v =>
    new Date(v.created_at) >= oneWeekAgo
  )

  const recentCompleted = recentVisits.filter(v => v.status === 'completed').length
  const recentHours = recentVisits
    .filter(v => v.hours_worked)
    .reduce((sum, v) => sum + parseFloat(v.hours_worked), 0)

  return {
    ...stats.value,
    recentCompleted,
    recentHours: recentHours.toFixed(1),
    completionRate: stats.value.total > 0 ? (stats.value.completed / stats.value.total) * 100 : 0
  }
})

// Format date and time
const formatDate = (dateString) => {
  if (!dateString) return 'N/A'
  return new Date(dateString).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  })
}

const formatTime = (dateString) => {
  if (!dateString) return 'N/A'
  return new Date(dateString).toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: true
  })
}


// Format duration
const formatDuration = (hours) => {
  if (!hours) return 'N/A'
  const totalMinutes = parseFloat(hours) * 60
  const hoursPart = Math.floor(totalMinutes / 60)
  const minutesPart = Math.round(totalMinutes % 60)

  if (hoursPart > 0) {
    return `${hoursPart}h ${minutesPart}m`
  }
  return `${minutesPart}m`
}

// Get status display info
const getStatusInfo = (visit) => {
  if (visit.status === 'completed') {
    return {
      class: 'bg-green-100 text-green-800 border border-green-200',
      text: 'Completed',
      icon: '✓'
    }
  } else if (visit.status === 'checked_in') {
    return {
      class: 'bg-blue-100 text-blue-800 border border-blue-200',
      text: 'In Progress',
      icon: '⏱️'
    }
  } else {
    return {
      class: 'bg-gray-100 text-gray-800 border border-gray-200',
      text: 'Scheduled',
      icon: '📅'
    }
  }
}

// Get visit location info
const getLocationInfo = (visit) => {
  if (visit.check_in_lat && visit.check_in_lng) {
    return {
      hasLocation: true,
      lat: visit.check_in_lat,
      lng: visit.check_in_lng
    }
  }
  return { hasLocation: false }
}

// Sort visits by date (newest first)
const sortedVisits = computed(() => {
  return [...visits.value].sort((a, b) =>
    new Date(b.created_at) - new Date(a.created_at)
  )
})

// Filter visits by status
const filteredVisits = computed(() => {
  return sortedVisits.value
})

onMounted(() => {
  fetchData()
})
</script>

<template>
  <div class="min-h-screen bg-gray-50 md:p-6">
    <!-- Header -->
    <div class="mb-8">
      <h1 class="text-2xl md:text-3xl font-bold text-gray-900">Service Delivery Dashboard</h1>
      <p class="text-gray-600 mt-1">Track your caregiving progress and visit history</p>
    </div>

    <!-- Stats Cards -->
    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
      <div class="bg-white rounded-xl shadow-sm border border-gray-200 p-5 hover:shadow-md transition-shadow">
        <div class="flex items-center">
          <div class="p-3 rounded-lg bg-blue-50 text-blue-600 mr-4">
            <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
          </div>
          <div>
            <p class="text-sm font-medium text-gray-600">Total Visits</p>
            <p class="text-2xl font-bold text-gray-900">{{ enhancedStats.total }}</p>
            <p class="text-xs text-gray-500 mt-1">{{ enhancedStats.uniqueClients }} unique clients</p>
          </div>
        </div>
      </div>

      <div class="bg-white rounded-xl shadow-sm border border-gray-200 p-5 hover:shadow-md transition-shadow">
        <div class="flex items-center">
          <div class="p-3 rounded-lg bg-green-50 text-green-600 mr-4">
            <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <div>
            <p class="text-sm font-medium text-gray-600">Completed</p>
            <p class="text-2xl font-bold text-gray-900">{{ enhancedStats.completed }}</p>
            <p class="text-xs text-gray-500 mt-1">{{ enhancedStats.recentCompleted }} this week</p>
          </div>
        </div>
      </div>

      <div class="bg-white rounded-xl shadow-sm border border-gray-200 p-5 hover:shadow-md transition-shadow">
        <div class="flex items-center">
          <div class="p-3 rounded-lg bg-yellow-50 text-yellow-600 mr-4">
            <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <div>
            <p class="text-sm font-medium text-gray-600">In Progress</p>
            <p class="text-2xl font-bold text-gray-900">{{ enhancedStats.inProgress }}</p>
            <p class="text-xs text-gray-500 mt-1">Active visits</p>
          </div>
        </div>
      </div>

      <div class="bg-white rounded-xl shadow-sm border border-gray-200 p-5 hover:shadow-md transition-shadow">
        <div class="flex items-center">
          <div class="p-3 rounded-lg bg-purple-50 text-purple-600 mr-4">
            <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <div>
            <p class="text-sm font-medium text-gray-600">Hours Worked</p>
            <p class="text-2xl font-bold text-gray-900">{{ enhancedStats.totalHours }}h</p>
            <p class="text-xs text-gray-500 mt-1">{{ enhancedStats.recentHours }}h this week</p>
          </div>
        </div>
      </div>
    </div>

    <!-- Progress Bar -->
    <div class="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-8">
      <div class="flex justify-between items-center mb-2">
        <h3 class="text-lg font-semibold text-gray-900">Visit Completion Progress</h3>
        <span class="text-sm font-medium text-gray-700">
          {{ enhancedStats.completed }} of {{ enhancedStats.total }} visits completed
        </span>
      </div>
      <div class="w-full bg-gray-200 rounded-full h-4">
        <div class="bg-green-500 h-4 rounded-full transition-all duration-500"
          :style="{ width: `${Math.min(enhancedStats.completionRate, 100)}%` }"></div>
      </div>
      <p class="text-sm text-gray-600 mt-2">
        {{ Math.round(enhancedStats.completionRate) }}% of all visits completed
      </p>
    </div>

    <!-- Tabs -->
    <div class="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden mb-8">
      <div class="border-b border-gray-200">
        <nav class="flex -mb-px">
          <button @click="activeTab = 'overview'" :class="activeTab === 'overview'
            ? 'border-blue-500 text-blue-600'
            : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'"
            class="whitespace-nowrap py-4 px-6 border-b-2 font-medium text-sm transition-colors">
            Visit Overview
          </button>
          <button @click="activeTab = 'details'" :class="activeTab === 'details'
            ? 'border-blue-500 text-blue-600'
            : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'"
            class="whitespace-nowrap py-4 px-6 border-b-2 font-medium text-sm transition-colors">
            Visit Details
          </button>
        </nav>
      </div>

      <!-- Tab Content -->
      <div class="p-3">
        <!-- Overview Tab -->
        <div v-if="activeTab === 'overview'">
          <div class="flex items-center justify-between mb-6">
            <h2 class="text-xl font-semibold text-gray-900">Recent Visits</h2>
            <div class="flex items-center space-x-4">
              <span class="text-sm text-gray-500">{{ filteredVisits.length }} total visits</span>
              <button @click="fetchData"
                class="p-2 text-gray-500 hover:text-gray-700 rounded-lg hover:bg-gray-100 transition-colors"
                :disabled="loading">
                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"
                  :class="{ 'animate-spin': loading }">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                    d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
              </button>
            </div>
          </div>

          <!-- Loading State -->
          <div v-if="loading" class="text-center py-12">
            <div class="animate-spin rounded-full h-12 w-12 border-t-4 border-b-4 border-blue-500 mx-auto mb-4"></div>
            <p class="text-gray-600">Loading visits...</p>
          </div>

          <!-- Visit Cards -->
          <div v-else class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div v-for="visit in filteredVisits" :key="visit.id"
              class="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden hover:shadow-md transition-all duration-300 hover-lift">
              <div class="p-5">
                <div class="flex justify-between items-start mb-4">
                  <div>
                    <h3 class="font-semibold text-gray-900 text-lg">{{ getClientName(visit.client) }}</h3>
                    <p class="text-sm text-gray-500 mt-1">{{ formatDate(visit.created_at) }}</p>

                    <!-- Client Age -->
                    <div v-if="getClientDetails(visit.client)" class="flex items-center mt-1">
                      <span class="text-xs text-gray-500">
                        Age: {{ getClientDetails(visit.client).age }} •
                        {{ getClientServices(visit.client).length }} services needed
                      </span>
                    </div>
                  </div>
                  <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium"
                    :class="getStatusInfo(visit).class">
                    <span class="mr-1">{{ getStatusInfo(visit).icon }}</span>
                    {{ getStatusInfo(visit).text }}
                  </span>
                </div>

                <div class="space-y-3">
                  <!-- Check-in Time -->
                  <div class="flex items-center text-sm text-gray-600">
                    <svg class="w-4 h-4 mr-2 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                        d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <span>Check-in: {{ formatTime(visit.check_in_time) }}</span>
                  </div>

                  <!-- Check-out Time -->
                  <div class="flex items-center text-sm text-gray-600">
                    <svg class="w-4 h-4 mr-2 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                        d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <span>Check-out: {{ formatTime(visit.check_out_time) }}</span>
                  </div>

                  <!-- Duration -->
                  <div v-if="visit.hours_worked" class="flex items-center text-sm text-gray-600">
                    <svg class="w-4 h-4 mr-2 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                        d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                    </svg>
                    <span>Duration: {{ formatDuration(visit.hours_worked) }}</span>
                  </div>

                  <!-- Services Provided -->
                  <div v-if="visit.services && visit.services.length > 0" class="text-sm">
                    <div class="flex items-start">
                      <svg class="w-4 h-4 mr-2 text-gray-400 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor"
                        viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                          d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                      </svg>
                      <div>
                        <span class="text-gray-600">Services Provided:</span>
                        <div class="mt-1 space-y-1">
                          <div v-for="service in getCompletedServices(visit)" :key="service.id"
                            class="text-xs bg-green-50 text-green-700 px-2 py-1 rounded">
                            {{ service.name }}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  <!-- Location Info -->
                  <div v-if="getLocationInfo(visit).hasLocation" class="flex items-center text-sm text-gray-600">
                    <svg class="w-4 h-4 mr-2 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                        d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                        d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                    <span>Location verified</span>
                  </div>
                </div>

                <!-- Visit Notes -->
                <div v-if="visit.visit_notes" class="mt-4 p-3 bg-blue-50 rounded-lg border border-blue-100">
                  <p class="text-sm text-blue-800 font-medium">Visit Notes:</p>
                  <p class="text-sm text-blue-700 mt-1">{{ visit.visit_notes }}</p>
                </div>

                <!-- Signatures Status -->
                <div class="mt-4 flex items-center justify-between text-xs text-gray-500">
                  <div class="flex items-center space-x-4">
                    <span v-if="visit.client_signature" class="text-green-600 flex items-center">
                      <svg class="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
                      </svg>
                      Client signed
                    </span>
                    <span v-if="visit.caregiver_signature" class="text-green-600 flex items-center">
                      <svg class="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
                      </svg>
                      Caregiver signed
                    </span>
                  </div>
                  <span>ID: {{ visit.id }}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Details Tab -->
        <div v-if="activeTab === 'details'">
          <div class="flex items-center justify-between mb-6">
            <h2 class="text-xl font-semibold text-gray-900">Visit Details</h2>
            <div class="flex items-center space-x-4">
              <span class="text-sm text-gray-500">{{ filteredVisits.length }} total visits</span>
              <button @click="fetchData"
                class="p-2 text-gray-500 hover:text-gray-700 rounded-lg hover:bg-gray-100 transition-colors"
                :disabled="loading">
                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"
                  :class="{ 'animate-spin': loading }">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                    d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
              </button>
            </div>
          </div>

          <!-- Loading State -->
          <div v-if="loading" class="text-center py-12">
            <div class="animate-spin rounded-full h-12 w-12 border-t-4 border-b-4 border-blue-500 mx-auto mb-4"></div>
            <p class="text-gray-600">Loading visits...</p>
          </div>

          <!-- Visits Table -->
          <div v-else class="overflow-x-auto bg-white rounded-lg border border-gray-200">
            <table class="w-full">
              <thead class="bg-gray-50">
                <tr class="border-b border-gray-200">
                  <th class="text-left py-4 px-4 text-sm font-semibold text-gray-700">Client</th>
                  <th class="text-left py-4 px-4 text-sm font-semibold text-gray-700">Check In</th>
                  <th class="text-left py-4 px-4 text-sm font-semibold text-gray-700">Check Out</th>
                  <th class="text-left py-4 px-4 text-sm font-semibold text-gray-700">Duration</th>
                  <th class="text-left py-4 px-4 text-sm font-semibold text-gray-700">Services</th>
                  <th class="text-left py-4 px-4 text-sm font-semibold text-gray-700">Status</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="visit in filteredVisits" :key="visit.id"
                  class="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                  <td class="py-4 px-4">
                    <div>
                      <p class="text-sm font-medium text-gray-900">{{ getClientName(visit.client) }}</p>
                      <p v-if="getClientDetails(visit.client)" class="text-xs text-gray-500">
                        Age {{ getClientDetails(visit.client).age }}
                      </p>
                    </div>
                  </td>
                  <td class="py-4 px-4">
                    <p class="text-sm text-gray-900">{{ formatTime(visit.check_in_time) }}</p>
                    <p class="text-xs text-gray-500">{{ formatDate(visit.check_in_time) }}</p>
                  </td>
                  <td class="py-4 px-4">
                    <p class="text-sm text-gray-900">{{ formatTime(visit.check_out_time) }}</p>
                    <p class="text-xs text-gray-500">{{ formatDate(visit.check_out_time) }}</p>
                  </td>
                  <td class="py-4 px-4">
                    <span v-if="visit.hours_worked" class="text-sm font-medium text-gray-900">
                      {{ formatDuration(visit.hours_worked) }}
                    </span>
                    <span v-else class="text-sm text-gray-400">-</span>
                  </td>
                  <td class="py-4 px-4">
                    <div v-if="visit.services && visit.services.length > 0">
                      <span class="text-sm text-gray-900">{{ visit.services.length }}</span>
                      <div class="text-xs text-gray-500 mt-1 space-y-1">
                        <div v-for="service in getCompletedServices(visit).slice(0, 2)" :key="service.id">
                          {{ service.name }}
                        </div>
                        <div v-if="getCompletedServices(visit).length > 2" class="text-blue-600">
                          +{{ getCompletedServices(visit).length - 2 }} more
                        </div>
                      </div>
                    </div>
                    <span v-else class="text-sm text-gray-400">-</span>
                  </td>
                  <td class="py-4 px-4">
                    <span class="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium"
                      :class="getStatusInfo(visit).class">
                      <span class="mr-1">{{ getStatusInfo(visit).icon }}</span>
                      {{ getStatusInfo(visit).text }}
                    </span>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <div v-if="filteredVisits.length === 0 && !loading" class="text-center py-12">
          <svg class="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
              d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
          <h3 class="mt-2 text-sm font-medium text-gray-900">No visits found</h3>
          <p class="mt-1 text-sm text-gray-500">No visit records available.</p>
          <button @click="fetchData"
            class="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
            Refresh Data
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.hover-lift:hover {
  transform: translateY(-2px);
  box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
}

/* Smooth transitions for all interactive elements */
button,
.transition-all {
  transition: all 0.2s ease-in-out;
}
</style>
