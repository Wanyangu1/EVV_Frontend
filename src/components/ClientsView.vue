<script setup>
import { ref, onMounted } from 'vue'
import axiosInstance from '@/axiosconfig/axiosInstance'

const clients = ref([])
const loading = ref(false)
const expandedClientId = ref(null)

const fetchClients = async () => {
  try {
    loading.value = true
    const response = await axiosInstance.get('/api/evv/clients/')
    clients.value = response.data
  } catch (err) {
    console.error('Error fetching clients:', err)
  } finally {
    loading.value = false
  }
}

const toggleClientDetails = (clientId) => {
  expandedClientId.value = expandedClientId.value === clientId ? null : clientId
}

const makePhoneCall = (phoneNumber) => {
  window.open(`tel:${phoneNumber}`, '_self')
}

const getGoogleMapsUrl = (latitude, longitude) => {
  return `https://www.google.com/maps?q=${latitude},${longitude}`
}

const formatVisitTimes = (visitTimes) => {
  if (Array.isArray(visitTimes)) {
    // Format for array structure
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
    return visitTimes.map(visit => ({
      day: days[visit.weekday],
      times: `${visit.start} - ${visit.end}`
    }))
  } else {
    // Format for object structure
    const dayNames = {
      monday: 'Monday',
      tuesday: 'Tuesday',
      wednesday: 'Wednesday',
      thursday: 'Thursday',
      friday: 'Friday',
      saturday: 'Saturday',
      sunday: 'Sunday'
    }

    return Object.entries(visitTimes).map(([day, times]) => ({
      day: dayNames[day],
      times: Array.isArray(times) ? times.join(', ') : times
    }))
  }
}

const getServiceTimesSummary = (visitTimes) => {
  const formattedTimes = formatVisitTimes(visitTimes)
  if (!formattedTimes || formattedTimes.length === 0) return 'No scheduled visits'

  const dayCount = formattedTimes.length
  const timeSlots = formattedTimes.reduce((total, day) => {
    let slots = 0

    if (Array.isArray(day.times)) {
      // If it's already an array like ['08:00', '10:00']
      slots = day.times.length
    } else if (typeof day.times === 'string') {
      // If it's a comma-separated string like '08:00,10:00'
      slots = day.times.split(',').length
    }

    return total + slots
  }, 0)

  return `${dayCount} days, ${timeSlots} time slots`
}

onMounted(() => {
  fetchClients()
})
</script>

<template>
  <div class="min-h-screen bg-gray-50 p-0 md:p-2">
    <!-- Header -->
    <div class="mb-8">
      <div class="flex flex-col md:flex-row md:items-center justify-between">
        <div>
          <h1 class="text-2xl md:text-3xl font-bold text-gray-900">Client Management</h1>
          <p class="text-gray-600 mt-1">Manage all client records and care schedules</p>
        </div>
        <div class="mt-4 md:mt-0 flex items-center space-x-4">
          <span class="text-sm text-gray-500">{{ clients.length }} total clients</span>
          <button @click="fetchClients"
            class="flex items-center px-4 py-2 bg-sky-600 text-white rounded-lg hover:bg-sky-700 transition-colors">
            <svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            Refresh
          </button>
        </div>
      </div>
    </div>

    <!-- Loading State -->
    <div v-if="loading" class="bg-white rounded-xl shadow-sm border border-gray-200 p-8 text-center">
      <div class="animate-spin rounded-full h-12 w-12 border-t-4 border-b-4 border-sky-600 mx-auto mb-4"></div>
      <p class="text-gray-600">Loading clients...</p>
    </div>

    <!-- Clients Grid -->
    <div v-else class="space-y-6">
      <div v-for="client in clients" :key="client.id"
        class="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-shadow">
        <!-- Client Header - Always Visible -->
        <div class="p-5 border-b border-gray-100 cursor-pointer" @click="toggleClientDetails(client.id)">
          <div class="flex justify-between items-start">
            <div class="flex-1">
              <div class="flex items-center justify-between">
                <div>
                  <h2 class="text-xl font-semibold text-gray-900">{{ client.first_name }} {{ client.last_name }}</h2>
                  <p class="text-gray-500 text-sm mt-1">ID: {{ client.id }}</p>
                </div>
                <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium"
                  :class="client.assigned_caregivers?.length ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'">
                  {{ client.assigned_caregivers?.length ? 'Assigned' : 'Unassigned' }}
                </span>
              </div>
            </div>
            <svg class="w-5 h-5 text-gray-400 ml-4 transition-transform duration-200"
              :class="{ 'rotate-180': expandedClientId === client.id }" fill="none" stroke="currentColor"
              viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
            </svg>
          </div>
        </div>

        <!-- Client Info - Always Visible -->
        <div class="p-5">
          <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div class="flex items-center">
              <svg class="w-5 h-5 text-gray-400 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                  d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              <div>
                <p class="text-sm text-gray-500">Age</p>
                <p class="font-medium">{{ client.age }}</p>
              </div>
            </div>

            <div class="flex items-center">
              <svg class="w-5 h-5 text-gray-400 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                  d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <div>
                <p class="text-sm text-gray-500">Service Times</p>
                <p class="font-medium">{{ getServiceTimesSummary(client.visit_times) }}</p>
              </div>
            </div>

            <div class="flex items-center">
              <svg class="w-5 h-5 text-gray-400 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                  d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
              </svg>
              <div>
                <p class="text-sm text-gray-500">Phone</p>
                <p class="font-medium text-sky-600 hover:text-sky-700 cursor-pointer"
                  @click.stop="makePhoneCall(client.phone)">
                  {{ client.phone }}
                </p>
              </div>
            </div>

            <div class="flex items-center">
              <svg class="w-5 h-5 text-gray-400 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                  d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                  d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              <div>
                <p class="text-sm text-gray-500">Location</p>
                <a :href="getGoogleMapsUrl(client.latitude, client.longitude)" target="_blank"
                  class="font-medium text-sky-600 hover:text-sky-700" @click.stop>
                  View on Map
                </a>
              </div>
            </div>
          </div>

          <!-- Services -->
          <div class="mt-4">
            <p class="text-sm text-gray-500 mb-2">Services Needed</p>
            <div class="flex flex-wrap gap-1">
              <span v-for="service in client.services_needed.slice(0, 3)" :key="service.id"
                class="inline-flex items-center px-2 py-1 rounded text-xs bg-blue-50 text-blue-700">
                {{ service.name }}
              </span>
              <span v-if="client.services_needed.length > 3"
                class="inline-flex items-center px-2 py-1 rounded text-xs bg-gray-100 text-gray-600">
                +{{ client.services_needed.length - 3 }} more
              </span>
            </div>
          </div>
        </div>

        <!-- Expanded Details -->
        <div v-if="expandedClientId === client.id" class="border-t border-gray-200 bg-gray-50">
          <div class="p-6">
            <div class="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <!-- Left Column - Personal Info -->
              <div>
                <h3 class="text-lg font-semibold text-gray-900 mb-4 pb-2 border-b border-gray-200">Personal Information
                </h3>

                <div class="space-y-4">
                  <div class="flex">
                    <div class="w-1/3 text-sm text-gray-500">Full Name</div>
                    <div class="w-2/3 font-medium">{{ client.first_name }} {{ client.last_name }}</div>
                  </div>

                  <div class="flex">
                    <div class="w-1/3 text-sm text-gray-500">Date of Birth</div>
                    <div class="w-2/3 font-medium">{{ client.date_of_birth }}</div>
                  </div>

                  <div class="flex">
                    <div class="w-1/3 text-sm text-gray-500">Age</div>
                    <div class="w-2/3 font-medium">{{ client.age }}</div>
                  </div>

                  <div class="flex">
                    <div class="w-1/3 text-sm text-gray-500">SSN</div>
                    <div class="w-2/3 font-medium">{{ client.ssn }}</div>
                  </div>

                  <div class="flex">
                    <div class="w-1/3 text-sm text-gray-500">Phone</div>
                    <div class="w-2/3">
                      <a :href="`tel:${client.phone}`" class="font-medium text-sky-600 hover:text-sky-700">
                        {{ client.phone }}
                      </a>
                    </div>
                  </div>

                  <div class="flex">
                    <div class="w-1/3 text-sm text-gray-500">Email</div>
                    <div class="w-2/3 font-medium">{{ client.email }}</div>
                  </div>

                  <div class="flex">
                    <div class="w-1/3 text-sm text-gray-500">Address</div>
                    <div class="w-2/3 font-medium">{{ client.address }}</div>
                  </div>
                </div>

                <!-- Next of Kin -->
                <h3 class="text-lg font-semibold text-gray-900 mt-6 mb-4 pb-2 border-b border-gray-200">Next of Kin</h3>

                <div class="space-y-4">
                  <div class="flex">
                    <div class="w-1/3 text-sm text-gray-500">Name</div>
                    <div class="w-2/3 font-medium">{{ client.next_of_kin_name }}</div>
                  </div>

                  <div class="flex">
                    <div class="w-1/3 text-sm text-gray-500">Phone</div>
                    <div class="w-2/3">
                      <a :href="`tel:${client.next_of_kin_phone}`" class="font-medium text-sky-600 hover:text-sky-700">
                        {{ client.next_of_kin_phone }}
                      </a>
                    </div>
                  </div>
                </div>

                <!-- Medical History -->
                <h3 class="text-lg font-semibold text-gray-900 mt-6 mb-4 pb-2 border-b border-gray-200">Medical History
                </h3>
                <p class="text-gray-700 text-sm">{{ client.medical_history }}</p>

                <!-- Notes -->
                <h3 class="text-lg font-semibold text-gray-900 mt-6 mb-4 pb-2 border-b border-gray-200">Notes</h3>
                <p class="text-gray-700 text-sm">{{ client.notes }}</p>
              </div>

              <!-- Right Column - Services & Schedule -->
              <div>
                <!-- Services Needed -->
                <h3 class="text-lg font-semibold text-gray-900 mb-4 pb-2 border-b border-gray-200">Services Needed</h3>

                <div class="space-y-3 mb-6">
                  <div v-for="service in client.services_needed" :key="service.id" class="bg-blue-50 rounded-lg p-4">
                    <h4 class="font-medium text-blue-800">{{ service.name }}</h4>
                    <p class="text-sm text-blue-700 mt-1">{{ service.description }}</p>
                  </div>
                </div>

                <!-- Visit Schedule -->
                <h3 class="text-lg font-semibold text-gray-900 mb-4 pb-2 border-b border-gray-200">Visit Schedule</h3>

                <div class="space-y-3 mb-6">
                  <div v-for="visit in formatVisitTimes(client.visit_times)" :key="visit.day"
                    class="bg-green-50 rounded-lg p-4">
                    <div class="flex justify-between items-center">
                      <span class="font-medium text-green-800">{{ visit.day }}</span>
                      <span class="text-sm text-green-700">{{ visit.times }}</span>
                    </div>
                  </div>
                </div>

                <!-- Assigned Caregivers -->
                <h3 class="text-lg font-semibold text-gray-900 mb-4 pb-2 border-b border-gray-200">Assigned Caregivers
                </h3>

                <div class="space-y-2 mb-6">
                  <div v-for="caregiver in client.assigned_caregivers" :key="caregiver" class="flex items-center">
                    <svg class="w-5 h-5 text-green-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                        d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                    <span class="font-medium">{{ caregiver }}</span>
                  </div>
                  <p v-if="client.assigned_caregivers.length === 0" class="text-gray-500 italic">No caregivers assigned
                  </p>
                </div>

                <!-- Location Map -->
                <h3 class="text-lg font-semibold text-gray-900 mb-4 pb-2 border-b border-gray-200">Location</h3>

                <div class="bg-gray-100 rounded-lg p-4">
                  <div class="flex justify-between items-center mb-2">
                    <span class="text-sm text-gray-600">Coordinates</span>
                    <a :href="getGoogleMapsUrl(client.latitude, client.longitude)" target="_blank"
                      class="text-sm text-sky-600 hover:text-sky-700 font-medium">
                      View on Google Maps
                    </a>
                  </div>
                  <div class="bg-white rounded p-3 text-center">
                    <p class="text-gray-700 text-sm">Lat: {{ client.latitude }}, Lng: {{ client.longitude }}</p>
                    <div class="mt-2 h-40 bg-gray-200 rounded flex items-center justify-center">
                      <p class="text-gray-500 text-sm">Map visualization would appear here</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- No Clients Message -->
    <div v-if="clients.length === 0 && !loading"
      class="bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center">
      <svg class="mx-auto h-16 w-16 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
          d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
      <h3 class="mt-4 text-lg font-medium text-gray-900">No clients found</h3>
      <p class="mt-2 text-gray-500">No client records available in the system.</p>
      <button @click="fetchClients"
        class="mt-4 px-4 py-2 bg-sky-600 text-white rounded-lg hover:bg-sky-700 transition-colors">
        Try Again
      </button>
    </div>
  </div>
</template>

<style scoped>
.rotate-180 {
  transform: rotate(180deg);
}
</style>
