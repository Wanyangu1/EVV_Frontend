<script setup>
import { ref, onMounted } from 'vue'
import axiosInstance from '@/axiosconfig/axiosInstance'

const visits = ref([])
const loading = ref(false)

const fetchVisits = async () => {
  try {
    loading.value = true
    const response = await axiosInstance.get('/api/evv/visits/')
    visits.value = response.data
  } catch (err) {
    console.error('Error fetching visits:', err)
    // You could emit an error event to parent here if needed
  } finally {
    loading.value = false
  }
}

const formatDateTime = (dateString) => {
  return new Date(dateString).toLocaleString()
}

const calculateDuration = (checkIn, checkOut) => {
  const hours = (new Date(checkOut) - new Date(checkIn)) / (1000 * 60 * 60)
  return hours.toFixed(1)
}

const getStatusClass = (visit) => {
  if (visit.check_out) return 'bg-green-100 text-green-800'
  if (visit.check_in) return 'bg-blue-100 text-blue-800'
  return 'bg-gray-100 text-gray-800'
}

const getStatusText = (visit) => {
  if (visit.check_out) return 'Completed'
  if (visit.check_in) return 'In Progress'
  return 'Scheduled'
}

onMounted(() => {
  fetchVisits()
})
</script>
<template>
  <div>
    <div class="mb-8">
      <h1 class="text-2xl font-bold text-gray-900">Weekly Visits</h1>
      <p class="text-gray-600 mt-1">Check-in and check-out records for this week</p>
    </div>

    <div class="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
      <div class="flex items-center justify-between mb-6">
        <h2 class="text-xl font-semibold text-gray-900">This Week's Visits</h2>
        <div class="flex items-center space-x-4">
          <span class="text-sm text-gray-500">{{ visits.length }} total visits</span>
          <button @click="fetchVisits" class="p-2 text-gray-500 hover:text-gray-700 rounded-lg hover:bg-gray-100">
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
          </button>
        </div>
      </div>

      <!-- Loading State -->
      <div v-if="loading" class="text-center py-12">
        <div class="animate-spin rounded-full h-12 w-12 border-t-4 border-b-4 border-sky-blue mx-auto mb-4"></div>
        <p class="text-gray-600">Loading visits...</p>
      </div>

      <!-- Visits Table -->
      <div v-else class="overflow-x-auto">
        <table class="w-full">
          <thead>
            <tr class="border-b border-gray-200">
              <th class="text-left py-3 px-4 text-sm font-medium text-gray-700">Client</th>
              <th class="text-left py-3 px-4 text-sm font-medium text-gray-700">Check In</th>
              <th class="text-left py-3 px-4 text-sm font-medium text-gray-700">Check Out</th>
              <th class="text-left py-3 px-4 text-sm font-medium text-gray-700">Duration</th>
              <th class="text-left py-3 px-4 text-sm font-medium text-gray-700">Status</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="visit in visits" :key="visit.id" class="border-b border-gray-100 hover:bg-gray-50">
              <td class="py-3 px-4 text-sm text-gray-900">
                {{ visit.client?.first_name }} {{ visit.client?.last_name }}
              </td>
              <td class="py-3 px-4 text-sm text-gray-600">
                {{ visit.check_in ? formatDateTime(visit.check_in) : 'Not checked in' }}
              </td>
              <td class="py-3 px-4 text-sm text-gray-600">
                {{ visit.check_out ? formatDateTime(visit.check_out) : 'Not checked out' }}
              </td>
              <td class="py-3 px-4 text-sm text-gray-600">
                <span v-if="visit.check_in && visit.check_out">
                  {{ calculateDuration(visit.check_in, visit.check_out) }}h
                </span>
                <span v-else class="text-gray-400">-</span>
              </td>
              <td class="py-3 px-4">
                <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium"
                  :class="getStatusClass(visit)">
                  {{ getStatusText(visit) }}
                </span>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <div v-if="visits.length === 0 && !loading" class="text-center py-12">
        <svg class="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
            d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
        <h3 class="mt-2 text-sm font-medium text-gray-900">No visits found</h3>
        <p class="mt-1 text-sm text-gray-500">No visit records available for this week.</p>
      </div>
    </div>
  </div>
</template>
