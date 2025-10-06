<script setup>
import { ref, onMounted } from 'vue'
import TheNavbar from '@/components/TheNavbar.vue'
import TheFooter from '@/components/TheFooter.vue'
import axiosInstance from '@/axiosconfig/axiosInstance'

const settings = ref({
  street_address: '',
  address2: '',
  city: '',
  state: '',
  zip_code: '',
  manager_name: '',
})

const isLoading = ref(true)
const isSubmitting = ref(false)
const showSuccess = ref(false)
const showError = ref(false)

const fetchSettings = async () => {
  try {
    const response = await axiosInstance.get('/api/user/settings/')
    settings.value = response.data
  } catch (error) {
    if (error.response && error.response.status === 404) {
      console.log('No settings found')
    } else {
      console.error(error)
      showError.value = true
    }
  } finally {
    isLoading.value = false
  }
}

const confirmDetails = () => {
  isSubmitting.value = true
  showError.value = false
  showSuccess.value = false

  try {
    // Simulate confirmation
    showSuccess.value = true
    setTimeout(() => {
      showSuccess.value = false
    }, 3000)
  } catch (error) {
    console.error(error)
    showError.value = true
  } finally {
    isSubmitting.value = false
  }
}

onMounted(fetchSettings)
</script>

<template>
  <TheNavbar />
  <div class="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 py-12 px-4 sm:px-6 lg:px-8">
    <div class="max-w-3xl mx-auto">
      <!-- Success Alert -->
      <transition enter-active-class="transition ease-out duration-300" enter-from-class="transform opacity-0 scale-95"
        enter-to-class="transform opacity-100 scale-100" leave-active-class="transition ease-in duration-200"
        leave-from-class="transform opacity-100 scale-100" leave-to-class="transform opacity-0 scale-95">
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
              <p class="text-sm font-medium text-green-800">Details confirmed successfully!</p>
            </div>
          </div>
        </div>
      </transition>

      <!-- Error Alert -->
      <transition enter-active-class="transition ease-out duration-300" enter-from-class="transform opacity-0 scale-95"
        enter-to-class="transform opacity-100 scale-100" leave-active-class="transition ease-in duration-200"
        leave-from-class="transform opacity-100 scale-100" leave-to-class="transform opacity-0 scale-95">
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
                An error occurred while processing your request.
              </p>
            </div>
          </div>
        </div>
      </transition>

      <div class="bg-white shadow-xl rounded-xl overflow-hidden">
        <!-- Header -->
        <div class="px-6 py-5 bg-gradient-to-r from-teal-600 to-emerald-500">
          <h2 class="text-2xl font-bold text-white">User Settings</h2>
          <p class="mt-1 text-indigo-100">Your personal and address information, contact manager for changes</p>
        </div>

        <!-- Loading State -->
        <div v-if="isLoading" class="p-8 flex justify-center">
          <div class="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
        </div>

        <!-- Content -->
        <div v-else class="px-6 py-8 space-y-6">
          <!-- Address Section -->
          <div class="space-y-4">
            <h3 class="text-lg font-medium text-gray-900 flex items-center">
              <svg class="w-5 h-5 mr-2 text-teal-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                  d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
              </svg>
              Address Information
            </h3>

            <div class="grid grid-cols-1 gap-y-4 gap-x-6 sm:grid-cols-6">
              <!-- Street Address -->
              <div class="sm:col-span-6">
                <label class="text-sm font-medium text-gray-700 mb-1 flex items-center">
                  <svg class="w-4 h-4 mr-2 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                      d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                      d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  Street Address
                </label>
                <div class="mt-1 text-sm text-gray-900 bg-gray-50 p-3 rounded-md border border-gray-200">
                  {{ settings.street_address || 'Not provided' }}
                </div>
              </div>

              <!-- Address Line 2 -->
              <div class="sm:col-span-6" v-if="settings.address2">
                <label class="block text-sm font-medium text-gray-700 mb-1">
                  Address Line 2
                </label>
                <div class="mt-1 text-sm text-gray-900 bg-gray-50 p-3 rounded-md border border-gray-200">
                  {{ settings.address2 }}
                </div>
              </div>

              <!-- City -->
              <div class="sm:col-span-3">
                <label class="text-sm font-medium text-gray-700 mb-1 flex items-center">
                  <svg class="w-4 h-4 mr-2 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                      d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                  </svg>
                  City
                </label>
                <div class="mt-1 text-sm text-gray-900 bg-gray-50 p-3 rounded-md border border-gray-200">
                  {{ settings.city || 'Not provided' }}
                </div>
              </div>

              <!-- State -->
              <div class="sm:col-span-2">
                <label class="text-sm font-medium text-gray-700 mb-1 flex items-center">
                  <svg class="w-4 h-4 mr-2 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                      d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  State
                </label>
                <div class="mt-1 text-sm text-gray-900 bg-gray-50 p-3 rounded-md border border-gray-200">
                  {{ settings.state || 'Not provided' }}
                </div>
              </div>

              <!-- ZIP Code -->
              <div class="sm:col-span-1">
                <label class="text-sm font-medium text-gray-700 mb-1 flex items-center">
                  <svg class="w-4 h-4 mr-2 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                      d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                  </svg>
                  ZIP Code
                </label>
                <div class="mt-1 text-sm text-gray-900 bg-gray-50 p-3 rounded-md border border-gray-200">
                  {{ settings.zip_code || 'Not provided' }}
                </div>
              </div>
            </div>
          </div>

          <!-- Manager Section -->
          <div class="space-y-4">
            <h3 class="text-lg font-medium text-gray-900 flex items-center">
              <svg class="w-5 h-5 mr-2 text-indigo-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                  d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
              Manager Information
            </h3>

            <div class="grid grid-cols-1 gap-y-4 gap-x-6 sm:grid-cols-6">
              <div class="sm:col-span-6">
                <label class="text-sm font-medium text-gray-700 mb-1 flex items-center">
                  <svg class="w-4 h-4 mr-2 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                      d="M5.121 17.804A13.937 13.937 0 0112 16c2.5 0 4.847.655 6.879 1.804M15 10a3 3 0 11-6 0 3 3 0 016 0zm6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  Manager Name
                </label>
                <div class="mt-1 text-sm text-gray-900 bg-gray-50 p-3 rounded-md border border-gray-200">
                  {{ settings.manager_name || 'Not provided' }}
                </div>
              </div>
            </div>
          </div>

          <!-- Form Actions -->
          <div class="flex justify-between pt-6 border-t border-gray-200">
            <div class="text-sm text-gray-500">
              Last updated: {{ new Date().toLocaleDateString() }}
            </div>
            <div class="flex space-x-3">
              <button type="button" @click="confirmDetails" :disabled="isSubmitting"
                class="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-all duration-200 hover:shadow-md disabled:opacity-75 disabled:cursor-not-allowed">
                <svg v-if="isSubmitting" class="animate-spin -ml-1 mr-2 h-4 w-4 text-white"
                  xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                  <path class="opacity-75" fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z">
                  </path>
                </svg>
                <svg v-else class="-ml-1 mr-2 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
                </svg>
                {{ isSubmitting ? 'Confirming...' : 'Confirm Details' }}
              </button>
              <a href="mailto:cityradiuschs@gmail.com">
                <button type="button"
                  class="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md shadow-sm text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-all duration-200">
                  <svg class="-ml-1 mr-2 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                      d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                  </svg>
                  Contact Manager
                </button>
              </a>

            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
  <TheFooter />
</template>

<style scoped>
/* Custom transitions */
button {
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

/* Smooth gradient transitions */
.bg-gradient-to-r {
  transition: background 0.5s ease;
}

/* Enhanced shadow transitions */
.shadow-md {
  transition: box-shadow 0.3s ease;
}

/* Display fields styling */
.bg-gray-50 {
  min-height: 42px;
  display: flex;
  align-items: center;
}
</style>
