<script setup>
import { ref, computed, onMounted } from 'vue'
import axiosInstance from '@/axiosconfig/axiosInstance'

const services = ref([])
const loading = ref(false)
const searchQuery = ref('')
const selectedCategory = ref('all')

const fetchServices = async () => {
  try {
    loading.value = true
    const response = await axiosInstance.get('/api/evv/services/')
    services.value = response.data
  } catch (err) {
    console.error('Error fetching services:', err)
  } finally {
    loading.value = false
  }
}

// Filter services based on search and category
const filteredServices = computed(() => {
  return services.value.filter(service => {
    const matchesSearch = service.name.toLowerCase().includes(searchQuery.value.toLowerCase()) ||
      service.description.toLowerCase().includes(searchQuery.value.toLowerCase())
    const matchesCategory = selectedCategory.value === 'all' || service.category === selectedCategory.value
    return matchesSearch && matchesCategory
  })
})

// Get unique categories for filter
const serviceCategories = computed(() => {
  const categories = [...new Set(services.value.map(service => service.category))]
  return ['all', ...categories]
})

// Service icons mapping
const getServiceIcon = (serviceName) => {
  const iconMap = {
    'Personal Care Assistance': '🛁',
    'Companionship Care': '💬',
    'Medication Management': '💊',
    'Skilled Nursing Care': '🏥',
    'Respite Care': '🌿'
  }
  return iconMap[serviceName] || '📋'
}

// Service color mapping
const getServiceColor = (serviceName) => {
  const colorMap = {
    'Personal Care Assistance': 'bg-blue-50 text-blue-600 border-blue-200',
    'Companionship Care': 'bg-green-50 text-green-600 border-green-200',
    'Medication Management': 'bg-purple-50 text-purple-600 border-purple-200',
    'Skilled Nursing Care': 'bg-red-50 text-red-600 border-red-200',
    'Respite Care': 'bg-orange-50 text-orange-600 border-orange-200'
  }
  return colorMap[serviceName] || 'bg-gray-50 text-gray-600 border-gray-200'
}

// Stats computations
const totalServices = computed(() => services.value.length)
const activeServicesCount = computed(() => services.value.filter(service => service.is_active).length)

const generateReport = () => {
  // Implement report generation logic
  console.log('Generating service report...')
}

const exportData = () => {
  // Implement export logic
  console.log('Exporting services data...')
}

onMounted(() => {
  fetchServices()
})
</script>

<template>
  <div class="min-h-screen bg-gray-50 p-2 md:p-2">
    <!-- Header -->
    <div class="mb-8">
      <div class="flex flex-col md:flex-row md:items-center md:justify-between">
        <div>
          <h1 class="text-2xl md:text-3xl font-bold text-gray-900">Services Catalog</h1>
          <p class="text-gray-600 mt-1">Manage and explore available care services</p>
        </div>
        <div class="mt-4 md:mt-0 flex space-x-3">
          <button @click="generateReport"
            class="px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center">
            <svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            Generate Report
          </button>
          <button @click="exportData"
            class="px-4 py-2 text-sm border border-gray-300 rounded-lg text-gray-700 bg-white hover:bg-gray-50 transition-colors flex items-center">
            <svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            Export CSV
          </button>
        </div>
      </div>
    </div>

    <!-- Stats Cards -->
    <div class="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
      <div class="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div class="flex items-center">
          <div class="p-3 rounded-lg bg-blue-50 text-blue-600 mr-4">
            <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
            </svg>
          </div>
          <div>
            <p class="text-sm font-medium text-gray-600">Total Services</p>
            <p class="text-2xl font-bold text-gray-900">{{ totalServices }}</p>
          </div>
        </div>
      </div>

      <div class="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div class="flex items-center">
          <div class="p-3 rounded-lg bg-green-50 text-green-600 mr-4">
            <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <div>
            <p class="text-sm font-medium text-gray-600">Active Services</p>
            <p class="text-2xl font-bold text-gray-900">{{ activeServicesCount }}</p>
          </div>
        </div>
      </div>

      <div class="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div class="flex items-center">
          <div class="p-3 rounded-lg bg-purple-50 text-purple-600 mr-4">
            <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
            </svg>
          </div>
          <div>
            <p class="text-sm font-medium text-gray-600">Categories</p>
            <p class="text-2xl font-bold text-gray-900">{{ serviceCategories.length - 1 }}</p>
          </div>
        </div>
      </div>
    </div>

    <!-- Search and Filter Section -->
    <div class="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-8">
      <div class="flex flex-col md:flex-row md:items-center md:justify-between space-y-4 md:space-y-0">
        <div class="flex-1 max-w-md">
          <div class="relative">
            <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <svg class="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
            <input v-model="searchQuery" type="text" placeholder="Search services..."
              class="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500" />
          </div>
        </div>
        <div class="flex space-x-4">
          <select v-model="selectedCategory"
            class="border border-gray-300 rounded-lg px-3 py-2 focus:ring-blue-500 focus:border-blue-500">
            <option value="all">All Categories</option>
            <option v-for="category in serviceCategories.filter(cat => cat !== 'all')" :key="category"
              :value="category">
              {{ category }}
            </option>
          </select>
          <button @click="fetchServices"
            class="p-2 text-gray-500 hover:text-gray-700 rounded-lg hover:bg-gray-100 transition-colors">
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
          </button>
        </div>
      </div>
    </div>

    <!-- Services Grid -->
    <div class="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
      <div class="flex items-center justify-between mb-6">
        <h2 class="text-xl font-semibold text-gray-900">Available Services</h2>
        <span class="text-sm text-gray-500">{{ filteredServices.length }} services</span>
      </div>

      <!-- Loading State -->
      <div v-if="loading" class="text-center py-12">
        <div class="animate-spin rounded-full h-12 w-12 border-t-4 border-b-4 border-blue-500 mx-auto mb-4"></div>
        <p class="text-gray-600">Loading services...</p>
      </div>

      <!-- Services Grid -->
      <div v-else-if="filteredServices.length > 0" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <div v-for="service in filteredServices" :key="service.id"
          class="border border-gray-200 rounded-xl p-6 hover:shadow-md transition-all duration-200 bg-white">
          <div class="flex items-start justify-between mb-4">
            <div class="flex items-center">
              <div class="w-12 h-12 rounded-lg flex items-center justify-center text-2xl mr-4"
                :class="getServiceColor(service.name).split(' ')[0]">
                {{ getServiceIcon(service.name) }}
              </div>
              <div>
                <h3 class="text-lg font-semibold text-gray-900">{{ service.name }}</h3>
                <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium mt-1"
                  :class="service.is_active ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'">
                  {{ service.is_active ? 'Active' : 'Inactive' }}
                </span>
              </div>
            </div>
          </div>

          <p class="text-gray-600 text-sm mb-4 line-clamp-3">{{ service.description }}</p>

          <div class="flex items-center justify-between text-sm text-gray-500">
            <div class="flex items-center">
              <svg class="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                  d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
              </svg>
              <span>{{ service.category || 'General' }}</span>
            </div>
            <div v-if="service.duration" class="flex items-center">
              <svg class="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                  d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span>{{ service.duration }} mins</span>
            </div>
          </div>
        </div>
      </div>

      <!-- No Results Message -->
      <div v-else-if="searchQuery || selectedCategory !== 'all'" class="text-center py-12">
        <svg class="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
            d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        <h3 class="mt-2 text-sm font-medium text-gray-900">No services found</h3>
        <p class="mt-1 text-sm text-gray-500">
          No services match your search criteria. Try adjusting your filters.
        </p>
      </div>

      <!-- No Data Message -->
      <div v-else class="text-center py-12">
        <svg class="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
            d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
        </svg>
        <h3 class="mt-2 text-sm font-medium text-gray-900">No services available</h3>
        <p class="mt-1 text-sm text-gray-500">No service data available in the system.</p>
      </div>
    </div>
  </div>
</template>
