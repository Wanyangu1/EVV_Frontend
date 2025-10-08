<script setup>
import { ref, computed, onMounted } from 'vue'
import axiosInstance from '@/axiosconfig/axiosInstance'

const services = ref([])
const loading = ref(false)

const fetchReports = async () => {
  try {
    loading.value = true
    const response = await axiosInstance.get('/api/evv/services/')
    services.value = response.data
  } catch (err) {
    console.error('Error fetching reports:', err)
    // You could emit an error event to parent here if needed
  } finally {
    loading.value = false
  }
}

const activeServicesCount = computed(() => {
  return services.value.filter(service => service.is_active).length
})

const categoriesCount = computed(() => {
  const categories = new Set(services.value.map(service => service.category))
  return categories.size
})

const generateReport = () => {
  // Implement report generation logic
  console.log('Generating report...')
}

const exportData = () => {
  // Implement export logic
  console.log('Exporting data...')
}

onMounted(() => {
  fetchReports()
})
</script>
<template>
  <div>
    <div class="mb-8">
      <h1 class="text-2xl font-bold text-gray-900">Reports & Analytics</h1>
      <p class="text-gray-600 mt-1">View detailed reports and analytics</p>
    </div>

    <div class="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
      <div class="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h3 class="text-lg font-semibold text-gray-900 mb-4">Quick Stats</h3>
        <div class="space-y-4">
          <div class="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
            <span class="text-sm font-medium text-gray-700">Total Services</span>
            <span class="text-lg font-bold text-blue-600">{{ services.length }}</span>
          </div>
          <div class="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
            <span class="text-sm font-medium text-gray-700">Active Services</span>
            <span class="text-lg font-bold text-green-600">{{ activeServicesCount }}</span>
          </div>
          <div class="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
            <span class="text-sm font-medium text-gray-700">Categories</span>
            <span class="text-lg font-bold text-orange-600">{{ categoriesCount }}</span>
          </div>
        </div>
      </div>

      <div class="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h3 class="text-lg font-semibold text-gray-900 mb-4">Report Actions</h3>
        <div class="space-y-3">
          <button @click="generateReport"
            class="w-full px-4 py-3 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center">
            <svg class="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            Generate Service Report
          </button>
          <button @click="exportData"
            class="w-full px-4 py-3 text-sm border border-gray-300 rounded-lg text-gray-700 bg-white hover:bg-gray-50 transition-colors flex items-center justify-center">
            <svg class="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            Export to CSV
          </button>
        </div>
      </div>
    </div>

    <div class="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
      <div class="flex items-center justify-between mb-6">
        <h2 class="text-xl font-semibold text-gray-900">Service Reports</h2>
        <div class="flex space-x-2">
          <button @click="fetchReports" class="p-2 text-gray-500 hover:text-gray-700 rounded-lg hover:bg-gray-100">
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
        <p class="text-gray-600">Loading reports data...</p>
      </div>

      <!-- Services List -->
      <div v-else-if="services.length > 0" class="space-y-4">
        <div v-for="service in services" :key="service.id"
          class="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition-colors">
          <div class="flex items-center justify-between">
            <div>
              <h3 class="text-lg font-semibold text-gray-900">{{ service.name }}</h3>
              <p class="text-sm text-gray-600 mt-1">{{ service.description }}</p>
              <div class="flex items-center mt-2 space-x-4">
                <span class="text-xs text-gray-500">Category: {{ service.category }}</span>
                <span class="text-xs text-gray-500">Duration: {{ service.duration }} mins</span>
              </div>
            </div>
            <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium"
              :class="service.is_active ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'">
              {{ service.is_active ? 'Active' : 'Inactive' }}
            </span>
          </div>
        </div>
      </div>

      <!-- No Data Message -->
      <div v-else class="text-center py-12">
        <svg class="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
            d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
        </svg>
        <h3 class="mt-2 text-sm font-medium text-gray-900">No reports data</h3>
        <p class="mt-1 text-sm text-gray-500">No service data available for reporting.</p>
      </div>
    </div>
  </div>
</template>
