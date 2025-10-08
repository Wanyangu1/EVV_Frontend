<script setup>
import { ref, onMounted, computed } from 'vue'
import axiosInstance from '@/axiosconfig/axiosInstance'

const visits = ref([])
const loading = ref(false)
const activeTab = ref('overview')

const fetchVisits = async () => {
  try {
    loading.value = true
    const response = await axiosInstance.get('/api/evv/visits/')
    visits.value = response.data
  } catch (err) {
    console.error('Error fetching visits:', err)
  } finally {
    loading.value = false
  }
}

// Computed properties for statistics
const stats = computed(() => {
  const completedVisits = visits.value.filter(v => v.status === 'completed').length
  const inProgressVisits = visits.value.filter(v => v.status === 'checked_in').length
  const totalHours = visits.value
    .filter(v => v.hours_worked)
    .reduce((sum, v) => sum + parseFloat(v.hours_worked), 0)

  return {
    total: visits.value.length,
    completed: completedVisits,
    inProgress: inProgressVisits,
    totalHours: totalHours.toFixed(1)
  }
})

// Format date and time
const formatDate = (dateString) => {
  return new Date(dateString).toLocaleDateString()
}

const formatTime = (dateString) => {
  return new Date(dateString).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
}

const formatDateTime = (dateString) => {
  return new Date(dateString).toLocaleString()
}

// Get status display info
const getStatusInfo = (visit) => {
  if (visit.status === 'completed') {
    return {
      class: 'bg-green-100 text-green-800',
      text: 'Completed',
      icon: '✓'
    }
  } else if (visit.status === 'checked_in') {
    return {
      class: 'bg-blue-100 text-blue-800',
      text: 'In Progress',
      icon: '⏱️'
    }
  } else {
    return {
      class: 'bg-gray-100 text-gray-800',
      text: 'Scheduled',
      icon: '📅'
    }
  }
}

// Get client name (placeholder - you'll need to adjust based on your data structure)
const getClientName = (clientId) => {
  // In a real app, you'd have a clients mapping
  const clientNames = {
    1: 'John Smith',
    2: 'Mary Johnson',
    3: 'Robert Davis'
  }
  return clientNames[clientId] || `Client ${clientId}`
}

onMounted(() => {
  fetchVisits()
})
</script>

<template>
  <div class="min-h-screen bg-gray-50 p- md:p-2">
    <!-- Header -->
    <div class="mb-8">
      <h1 class="text-2xl md:text-3xl font-bold text-gray-900">Service Delivery Dashboard</h1>
      <p class="text-gray-600 mt-1">Track your caregiving progress and visit history</p>
    </div>

    <!-- Stats Cards -->
    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
      <div class="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
        <div class="flex items-center">
          <div class="p-3 rounded-lg bg-blue-50 text-blue-600 mr-4">
            <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
          </div>
          <div>
            <p class="text-sm font-medium text-gray-600">Total Visits</p>
            <p class="text-2xl font-bold text-gray-900">{{ stats.total }}</p>
          </div>
        </div>
      </div>

      <div class="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
        <div class="flex items-center">
          <div class="p-3 rounded-lg bg-green-50 text-green-600 mr-4">
            <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <div>
            <p class="text-sm font-medium text-gray-600">Completed</p>
            <p class="text-2xl font-bold text-gray-900">{{ stats.completed }}</p>
          </div>
        </div>
      </div>

      <div class="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
        <div class="flex items-center">
          <div class="p-3 rounded-lg bg-yellow-50 text-yellow-600 mr-4">
            <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <div>
            <p class="text-sm font-medium text-gray-600">In Progress</p>
            <p class="text-2xl font-bold text-gray-900">{{ stats.inProgress }}</p>
          </div>
        </div>
      </div>

      <div class="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
        <div class="flex items-center">
          <div class="p-3 rounded-lg bg-purple-50 text-purple-600 mr-4">
            <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <div>
            <p class="text-sm font-medium text-gray-600">Hours Worked</p>
            <p class="text-2xl font-bold text-gray-900">{{ stats.totalHours }}h</p>
          </div>
        </div>
      </div>
    </div>

    <!-- Progress Bar -->
    <div class="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-8">
      <div class="flex justify-between items-center mb-2">
        <h3 class="text-lg font-semibold text-gray-900">Weekly Progress</h3>
        <span class="text-sm font-medium text-gray-700">
          {{ stats.completed }} of {{ stats.total }} visits completed
        </span>
      </div>
      <div class="w-full bg-gray-200 rounded-full h-4">
        <div class="bg-green-500 h-4 rounded-full transition-all duration-500"
          :style="{ width: stats.total > 0 ? `${(stats.completed / stats.total) * 100}%` : '0%' }"></div>
      </div>
      <p class="text-sm text-gray-600 mt-2">
        {{ stats.total > 0 ? Math.round((stats.completed / stats.total) * 100) : 0 }}% of visits completed this week
      </p>
    </div>

    <!-- Tabs -->
    <div class="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden mb-8">
      <div class="border-b border-gray-200">
        <nav class="flex -mb-px">
          <button @click="activeTab = 'overview'" :class="activeTab === 'overview'
            ? 'border-blue-500 text-blue-600'
            : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'"
            class="whitespace-nowrap py-4 px-6 border-b-2 font-medium text-sm">
            Visit Overview
          </button>
          <button @click="activeTab = 'details'" :class="activeTab === 'details'
            ? 'border-blue-500 text-blue-600'
            : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'"
            class="whitespace-nowrap py-4 px-6 border-b-2 font-medium text-sm">
            Visit Details
          </button>
        </nav>
      </div>

      <!-- Tab Content -->
      <div class="p-6">
        <!-- Overview Tab -->
        <div v-if="activeTab === 'overview'">
          <div class="flex items-center justify-between mb-6">
            <h2 class="text-xl font-semibold text-gray-900">Recent Visits</h2>
            <div class="flex items-center space-x-4">
              <span class="text-sm text-gray-500">{{ visits.length }} total visits</span>
              <button @click="fetchVisits"
                class="p-2 text-gray-500 hover:text-gray-700 rounded-lg hover:bg-gray-100 transition-colors">
                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
            <div v-for="visit in visits" :key="visit.id"
              class="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden hover:shadow-md transition-shadow">
              <div class="p-5">
                <div class="flex justify-between items-start mb-4">
                  <div>
                    <h3 class="font-semibold text-gray-900">{{ getClientName(visit.client) }}</h3>
                    <p class="text-sm text-gray-500">{{ formatDate(visit.created_at) }}</p>
                  </div>
                  <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium"
                    :class="getStatusInfo(visit).class">
                    <span class="mr-1">{{ getStatusInfo(visit).icon }}</span>
                    {{ getStatusInfo(visit).text }}
                  </span>
                </div>

                <div class="space-y-3">
                  <div class="flex items-center text-sm text-gray-600">
                    <svg class="w-4 h-4 mr-2 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                        d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <span>Check-in: {{ visit.check_in_time ? formatTime(visit.check_in_time) : 'Not checked in'
                    }}</span>
                  </div>

                  <div class="flex items-center text-sm text-gray-600">
                    <svg class="w-4 h-4 mr-2 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                        d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <span>Check-out: {{ visit.check_out_time ? formatTime(visit.check_out_time) : 'Not checked out'
                    }}</span>
                  </div>

                  <div v-if="visit.hours_worked" class="flex items-center text-sm text-gray-600">
                    <svg class="w-4 h-4 mr-2 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                        d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                    </svg>
                    <span>Hours: {{ visit.hours_worked }}h</span>
                  </div>

                  <div v-if="visit.services && visit.services.length > 0"
                    class="flex items-center text-sm text-gray-600">
                    <svg class="w-4 h-4 mr-2 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                        d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                    </svg>
                    <span>Services: {{ visit.services.length }}</span>
                  </div>
                </div>

                <div v-if="visit.visit_notes" class="mt-4 p-3 bg-blue-50 rounded-lg">
                  <p class="text-sm text-blue-800">{{ visit.visit_notes }}</p>
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
              <span class="text-sm text-gray-500">{{ visits.length }} total visits</span>
              <button @click="fetchVisits"
                class="p-2 text-gray-500 hover:text-gray-700 rounded-lg hover:bg-gray-100 transition-colors">
                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
          <div v-else class="overflow-x-auto">
            <table class="w-full">
              <thead>
                <tr class="border-b border-gray-200">
                  <th class="text-left py-3 px-4 text-sm font-medium text-gray-700">Client</th>
                  <th class="text-left py-3 px-4 text-sm font-medium text-gray-700">Check In</th>
                  <th class="text-left py-3 px-4 text-sm font-medium text-gray-700">Check Out</th>
                  <th class="text-left py-3 px-4 text-sm font-medium text-gray-700">Duration</th>
                  <th class="text-left py-3 px-4 text-sm font-medium text-gray-700">Status</th>
                  <th class="text-left py-3 px-4 text-sm font-medium text-gray-700">Services</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="visit in visits" :key="visit.id"
                  class="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                  <td class="py-3 px-4 text-sm text-gray-900">
                    {{ getClientName(visit.client) }}
                  </td>
                  <td class="py-3 px-4 text-sm text-gray-600">
                    {{ visit.check_in_time ? formatDateTime(visit.check_in_time) : 'Not checked in' }}
                  </td>
                  <td class="py-3 px-4 text-sm text-gray-600">
                    {{ visit.check_out_time ? formatDateTime(visit.check_out_time) : 'Not checked out' }}
                  </td>
                  <td class="py-3 px-4 text-sm text-gray-600">
                    <span v-if="visit.hours_worked">
                      {{ visit.hours_worked }}h
                    </span>
                    <span v-else class="text-gray-400">-</span>
                  </td>
                  <td class="py-3 px-4">
                    <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium"
                      :class="getStatusInfo(visit).class">
                      <span class="mr-1">{{ getStatusInfo(visit).icon }}</span>
                      {{ getStatusInfo(visit).text }}
                    </span>
                  </td>
                  <td class="py-3 px-4 text-sm text-gray-600">
                    {{ visit.services ? visit.services.length : 0 }}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
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
  </div>
</template>
