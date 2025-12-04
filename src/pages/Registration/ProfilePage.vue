<script setup>
import { ref, onMounted } from 'vue'
import axiosInstance from '@/axiosconfig/axiosInstance'

// Component state
const sidebarOpen = ref(false)
const userProfile = ref({
  id: '',
  name: '',
  email: '',
  phone: '',
  role: '',
  profile: {
    phone_number: ''
  }
})

const isLoading = ref(true)
const isSubmitting = ref(false)
const showSuccess = ref(false)
const showError = ref(false)
const errorMessage = ref('')

// Data fetching
const fetchUserProfile = async () => {
  try {
    // Get user profile data
    const response = await axiosInstance.get('/api/profile/')
    userProfile.value = response.data

    // If profile doesn't exist, create it with empty values
    if (!userProfile.value.profile) {
      userProfile.value.profile = {
        phone_number: userProfile.value.phone || ''
      }
    }
  } catch (error) {
    console.error('Error fetching user profile:', error)
    if (error.response && error.response.status === 404) {
      // Try to get user info from user-info endpoint
      try {
        const userInfoResponse = await axiosInstance.get('/api/accounts/user-info/')
        userProfile.value = {
          ...userInfoResponse.data,
          profile: {
            phone_number: userInfoResponse.data.phone || ''
          }
        }
      } catch (userInfoError) {
        console.error('Error fetching user info:', userInfoError)
        showError.value = true
        errorMessage.value = 'Unable to load user information'
      }
    } else {
      showError.value = true
      errorMessage.value = error.response?.data?.detail || 'Failed to load profile'
    }
  } finally {
    isLoading.value = false
  }
}

// Format phone number for display
const formatPhoneNumber = (phone) => {
  if (!phone) return 'Not provided'

  // Remove all non-digit characters
  const cleaned = phone.replace(/\D/g, '')

  // Format based on length
  if (cleaned.length === 10) {
    return `(${cleaned.slice(0, 3)}) ${cleaned.slice(3, 6)}-${cleaned.slice(6)}`
  } else if (cleaned.length === 11 && cleaned.startsWith('1')) {
    return `+1 (${cleaned.slice(1, 4)}) ${cleaned.slice(4, 7)}-${cleaned.slice(7)}`
  }

  return phone
}

// Format role for display
const formatRole = (role) => {
  const roleMap = {
    'admin': 'Administrator',
    'superuser': 'Super User',
    'caregiver': 'Caregiver',
    'coordinator': 'Care Coordinator',
    'manager': 'Manager'
  }
  return roleMap[role] || role
}

// Update profile
const updateProfile = async () => {
  isSubmitting.value = true
  showError.value = false
  showSuccess.value = false

  try {
    // Prepare data for update
    const updateData = {
      name: userProfile.value.name,
      phone: userProfile.value.phone || userProfile.value.profile?.phone_number || '',
    }

    const response = await axiosInstance.patch('/api/accounts/profile/', updateData)

    userProfile.value = {
      ...userProfile.value,
      ...response.data,
      profile: {
        phone_number: response.data.phone || ''
      }
    }

    showSuccess.value = true
    setTimeout(() => {
      showSuccess.value = false
    }, 3000)
  } catch (error) {
    console.error('Error updating profile:', error)
    showError.value = true
    errorMessage.value = error.response?.data?.detail || 'Failed to update profile'
  } finally {
    isSubmitting.value = false
  }
}

// Get user initials for avatar
const getUserInitials = () => {
  if (!userProfile.value.name) return 'U'
  return userProfile.value.name
    .split(' ')
    .map(word => word[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)
}

// Get role badge color
const getRoleBadgeClass = (role) => {
  switch (role) {
    case 'admin':
    case 'superuser':
      return 'bg-purple-100 text-purple-800 border-purple-200'
    case 'manager':
      return 'bg-blue-100 text-blue-800 border-blue-200'
    case 'coordinator':
      return 'bg-teal-100 text-teal-800 border-teal-200'
    case 'caregiver':
      return 'bg-green-100 text-green-800 border-green-200'
    default:
      return 'bg-gray-100 text-gray-800 border-gray-200'
  }
}

onMounted(fetchUserProfile)
</script>

<template>
  <div class="flex flex-1 min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">

    <!-- Main Content with Sidebar -->
    <div class="flex flex-1">

      <!-- Main Content Area -->
      <main class="flex-1 transition-all duration-300 ease-in-out" :class="sidebarOpen ? 'lg:ml-2' : 'lg:ml-0'">
        <div class="py-10 px-4 sm:px-6 lg:px-6">
          <div class="max-w-3xl mx-auto">
            <!-- Success Alert -->
            <transition enter-active-class="transition ease-out duration-300"
              enter-from-class="transform opacity-0 scale-95" enter-to-class="transform opacity-100 scale-100"
              leave-active-class="transition ease-in duration-200" leave-from-class="transform opacity-100 scale-100"
              leave-to-class="transform opacity-0 scale-95">
              <div v-if="showSuccess" class="mb-6 p-4 bg-green-50 rounded-lg border border-green-200">
                <div class="flex items-center">
                  <div class="flex-shrink-0">
                    <svg class="h-5 w-5 text-green-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"
                      fill="currentColor">
                      <path fill-rule="evenodd"
                        d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                        clip-rule="evenodd" />
                    </svg>
                  </div>
                  <div class="ml-3">
                    <p class="text-sm font-medium text-green-800">Profile updated successfully!</p>
                  </div>
                </div>
              </div>
            </transition>

            <!-- Error Alert -->
            <transition enter-active-class="transition ease-out duration-300"
              enter-from-class="transform opacity-0 scale-95" enter-to-class="transform opacity-100 scale-100"
              leave-active-class="transition ease-in duration-200" leave-from-class="transform opacity-100 scale-100"
              leave-to-class="transform opacity-0 scale-95">
              <div v-if="showError" class="mb-6 p-4 bg-red-50 rounded-lg border border-red-200">
                <div class="flex items-center">
                  <div class="flex-shrink-0">
                    <svg class="h-5 w-5 text-red-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"
                      fill="currentColor">
                      <path fill-rule="evenodd"
                        d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                        clip-rule="evenodd" />
                    </svg>
                  </div>
                  <div class="ml-3">
                    <p class="text-sm font-medium text-red-800">
                      {{ errorMessage || 'An error occurred while processing your request.' }}
                    </p>
                  </div>
                </div>
              </div>
            </transition>

            <div class="bg-white shadow-xl rounded-xl overflow-hidden">
              <!-- Header -->
              <div class="px-6 py-5 bg-gradient-to-r from-indigo-600 to-purple-600">
                <div class="flex items-center">
                  <div class="flex-shrink-0">
                    <div
                      class="h-12 w-12 rounded-full bg-white/20 flex items-center justify-center text-white font-bold text-lg">
                      {{ getUserInitials() }}
                    </div>
                  </div>
                  <div class="ml-4">
                    <h2 class="text-2xl font-bold text-white">{{ userProfile.name || 'User Profile' }}</h2>
                    <p class="mt-1 text-indigo-100">Manage your personal information and account settings</p>
                  </div>
                </div>
              </div>

              <!-- Loading State -->
              <div v-if="isLoading" class="p-8 flex justify-center">
                <div class="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
              </div>

              <!-- Content -->
              <div v-else class="px-6 py-8 space-y-8">
                <!-- Role Badge -->
                <div class="flex items-center justify-between">
                  <div>
                    <h3 class="text-lg font-medium text-gray-900">Account Information</h3>
                    <p class="text-sm text-gray-500">Your role and account details</p>
                  </div>
                  <span
                    :class="['px-3 py-1 text-xs font-medium rounded-full border', getRoleBadgeClass(userProfile.role)]">
                    {{ formatRole(userProfile.role) }}
                  </span>
                </div>

                <!-- Personal Information Section -->
                <div class="space-y-6">
                  <h4 class="text-md font-medium text-gray-900 flex items-center">
                    <svg class="w-5 h-5 mr-2 text-teal-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                        d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                    Personal Information
                  </h4>

                  <div class="grid grid-cols-1 gap-y-6 gap-x-6 sm:grid-cols-6">
                    <!-- Name -->
                    <div class="sm:col-span-3">
                      <label class="text-sm font-medium text-gray-700 mb-1 flex items-center">
                        <svg class="w-4 h-4 mr-2 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                            d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                        </svg>
                        Full Name
                      </label>
                      <input v-model="userProfile.name" type="text"
                        class="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm">
                      <p class="mt-1 text-xs text-gray-500">Your full name as it should appear in the system</p>
                    </div>

                    <!-- Email -->
                    <div class="sm:col-span-3">
                      <label class="text-sm font-medium text-gray-700 mb-1 flex items-center">
                        <svg class="w-4 h-4 mr-2 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                            d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                        </svg>
                        Email Address
                      </label>
                      <div class="mt-1 text-sm text-gray-900 bg-gray-50 p-3 rounded-md border border-gray-200">
                        {{ userProfile.email || 'Not provided' }}
                      </div>
                      <p class="mt-1 text-xs text-gray-500">Your login email (contact admin to change)</p>
                    </div>

                    <!-- Phone -->
                    <div class="sm:col-span-3">
                      <label class="text-sm font-medium text-gray-700 mb-1 flex items-center">
                        <svg class="w-4 h-4 mr-2 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                            d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                        </svg>
                        Phone Number
                      </label>
                      <input v-model="userProfile.phone" type="tel" :placeholder="formatPhoneNumber(userProfile.phone)"
                        class="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm">
                      <p class="mt-1 text-xs text-gray-500">Your contact phone number</p>
                    </div>

                    <!-- User ID -->
                    <div class="sm:col-span-3">
                      <label class="text-sm font-medium text-gray-700 mb-1 flex items-center">
                        <svg class="w-4 h-4 mr-2 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                            d="M10 6H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V8a2 2 0 00-2-2h-5m-4 0V5a2 2 0 114 0v1m-4 0a2 2 0 104 0m-5 8a2 2 0 100-4 2 2 0 000 4zm0 0c1.306 0 2.417.835 2.83 2M9 14a3.001 3.001 0 00-2.83 2M15 11h3m-3 4h2" />
                        </svg>
                        User ID
                      </label>
                      <div
                        class="mt-1 text-sm text-gray-900 bg-gray-50 p-3 rounded-md border border-gray-200 font-mono">
                        {{ userProfile.id || 'Not available' }}
                      </div>
                      <p class="mt-1 text-xs text-gray-500">Your unique user identifier</p>
                    </div>
                  </div>
                </div>

                <!-- System Information -->
                <div class="space-y-4 border-t border-gray-200 pt-8">
                  <h4 class="text-md font-medium text-gray-900 flex items-center">
                    <svg class="w-5 h-5 mr-2 text-indigo-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                        d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                        d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                    System Information
                  </h4>

                  <div class="bg-gray-50 rounded-lg p-4">
                    <dl class="grid grid-cols-1 gap-4 sm:grid-cols-2">
                      <div>
                        <dt class="text-sm font-medium text-gray-500">Account Created</dt>
                        <dd class="mt-1 text-sm text-gray-900">{{ new Date().toLocaleDateString() }}</dd>
                      </div>
                      <div>
                        <dt class="text-sm font-medium text-gray-500">Last Updated</dt>
                        <dd class="mt-1 text-sm text-gray-900">{{ new Date().toLocaleDateString() }}</dd>
                      </div>
                      <div>
                        <dt class="text-sm font-medium text-gray-500">Account Status</dt>
                        <dd class="mt-1">
                          <span class="px-2 py-1 text-xs font-medium rounded-full bg-green-100 text-green-800">
                            Active
                          </span>
                        </dd>
                      </div>
                      <div>
                        <dt class="text-sm font-medium text-gray-500">Permissions</dt>
                        <dd class="mt-1 text-sm text-gray-900">{{ formatRole(userProfile.role) }} access</dd>
                      </div>
                    </dl>
                  </div>
                </div>

                <!-- Form Actions -->
                <div class="flex flex-col sm:flex-row justify-between pt-6 border-t border-gray-200 gap-4">
                  <div class="text-sm text-gray-500">
                    Profile last updated: {{ new Date().toLocaleDateString() }}
                  </div>
                  <div class="flex flex-col sm:flex-row space-y-3 sm:space-y-0 sm:space-x-3">
                    <button type="button" @click="updateProfile" :disabled="isSubmitting"
                      class="inline-flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-all duration-200 hover:shadow-md disabled:opacity-75 disabled:cursor-not-allowed">
                      <svg v-if="isSubmitting" class="animate-spin -ml-1 mr-2 h-4 w-4 text-white"
                        xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4">
                        </circle>
                        <path class="opacity-75" fill="currentColor"
                          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z">
                        </path>
                      </svg>
                      <svg v-else class="-ml-1 mr-2 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
                      </svg>
                      {{ isSubmitting ? 'Saving...' : 'Save Changes' }}
                    </button>
                    <a href="/profile/password" v-if="currentView === 'settings'">
                      <button type="button"
                        class="inline-flex items-center justify-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md shadow-sm text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-all duration-200 w-full sm:w-auto">
                        <svg class="-ml-1 mr-2 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                            d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                        </svg>
                        Change Password
                      </button>
                    </a>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  </div>
</template>
