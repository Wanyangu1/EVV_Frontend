<script setup>
import { ref, onMounted } from 'vue'
import axiosInstance from '@/axiosconfig/axiosInstance'

const clients = ref([])
const loading = ref(false)

const fetchClients = async () => {
  try {
    loading.value = true
    const response = await axiosInstance.get('/api/evv/clients/')
    clients.value = response.data
  } catch (err) {
    console.error('Error fetching clients:', err)
    // You could emit an error event to parent here if needed
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  fetchClients()
})
</script>
<template>
  <div>
    <div class="mb-8">
      <h1 class="text-2xl font-bold text-gray-900">Clients Management</h1>
      <p class="text-gray-600 mt-1">Manage all client records</p>
    </div>

    <div class="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
      <div class="flex items-center justify-between mb-6">
        <h2 class="text-xl font-semibold text-gray-900">All Clients</h2>
        <div class="flex items-center space-x-4">
          <span class="text-sm text-gray-500">{{ clients.length }} total clients</span>
          <button @click="fetchClients" class="p-2 text-gray-500 hover:text-gray-700 rounded-lg hover:bg-gray-100">
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
        <p class="text-gray-600">Loading clients...</p>
      </div>

      <!-- Clients Table -->
      <div v-else class="overflow-x-auto">
        <table class="w-full">
          <thead>
            <tr class="border-b border-gray-200">
              <th class="text-left py-3 px-4 text-sm font-medium text-gray-700">Name</th>
              <th class="text-left py-3 px-4 text-sm font-medium text-gray-700">Age</th>
              <th class="text-left py-3 px-4 text-sm font-medium text-gray-700">Services</th>
              <th class="text-left py-3 px-4 text-sm font-medium text-gray-700">Visits/Week</th>
              <th class="text-left py-3 px-4 text-sm font-medium text-gray-700">Status</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="client in clients" :key="client.id" class="border-b border-gray-100 hover:bg-gray-50">
              <td class="py-3 px-4 text-sm text-gray-900">
                {{ client.first_name }} {{ client.last_name }}
              </td>
              <td class="py-3 px-4 text-sm text-gray-600">{{ client.age }}</td>
              <td class="py-3 px-4 text-sm text-gray-600">
                {{ client.services_needed?.length || 0 }} services
              </td>
              <td class="py-3 px-4 text-sm text-gray-600">{{ client.visits_per_week }}</td>
              <td class="py-3 px-4">
                <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium"
                  :class="client.assigned_caregivers?.length ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'">
                  {{ client.assigned_caregivers?.length ? 'Assigned' : 'Unassigned' }}
                </span>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- No Clients Message -->
      <div v-if="clients.length === 0 && !loading" class="text-center py-12">
        <svg class="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
            d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        <h3 class="mt-2 text-sm font-medium text-gray-900">No clients found</h3>
        <p class="mt-1 text-sm text-gray-500">No client records available.</p>
      </div>
    </div>
  </div>
</template>
