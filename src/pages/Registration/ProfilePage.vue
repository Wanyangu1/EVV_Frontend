<script setup>
import { ref, computed, onMounted } from 'vue'
import axiosInstance from '@/axiosconfig/axiosInstance'
import TheNavbar from '@/components/TheNavbar.vue'
import TheFooter from '@/components/TheFooter.vue'
import { Dialog, DialogPanel, DialogTitle, TransitionChild, TransitionRoot } from '@headlessui/vue'
import { CheckCircleIcon, ExclamationCircleIcon } from '@heroicons/vue/24/outline'

const profile = ref({
  id: null,
  name: '',
  email: '',
  phone: null,
  avatar: null,
})

// Removed editableProfile since we won't be editing
const loading = ref(true)
const error = ref(null)
const showConfirmation = ref(false) // Added confirmation dialog state
const contactAdmin = ref(false) // Added state for admin contact prompt

// Compute initials for avatar placeholder
const initials = computed(() => {
  if (!profile.value.name) return '?'
  const names = profile.value.name.trim().split(/\s+/)
  return names.length > 1
    ? `${names[0][0]}${names[names.length - 1][0]}`.toUpperCase()
    : names[0][0].toUpperCase()
})

// Compute background color based on initials
const avatarBgColor = computed(() => {
  if (!profile.value.name) return 'bg-gray-400'
  const colors = [
    'bg-blue-500',
    'bg-green-500',
    'bg-purple-500',
    'bg-red-500',
    'bg-yellow-500',
    'bg-pink-500',
    'bg-indigo-500',
    'bg-teal-500',
  ]
  const charCode = profile.value.name.charCodeAt(0)
  return colors[charCode % colors.length]
})

// Fetch profile data (GET only)
const fetchProfile = async () => {
  try {
    loading.value = true
    error.value = null
    const response = await axiosInstance.get('/api/profile/')
    profile.value = response.data

    // Show confirmation dialog after data loads
    showConfirmation.value = true
  } catch (err) {
    error.value = 'Failed to load profile data. Please try again later.'
    contactAdmin.value = true // Show admin contact prompt on error
    console.error('Error fetching profile:', err)
  } finally {
    loading.value = false
  }
}

// Removed all PATCH-related functions:
// - updateProfile()
// - handleAvatarUpload()

// Fetch profile on component mount
onMounted(() => {
  fetchProfile()
})
</script>

<template>
  <TheNavbar />
  <div class="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 py-12 px-4 sm:px-6 lg:px-8">
    <div class="max-w-4xl mx-auto">
      <!-- Profile Card with Soft Shadow -->
      <div class="bg-white shadow-xl rounded-xl overflow-hidden">
        <!-- Profile Header with Gradient Background -->
        <div class="relative bg-gradient-to-r from-teal-600 to-emerald-600 px-8 py-6 text-center">
          <!-- Decorative elements -->
          <div class="absolute inset-0 opacity-10">
            <div
              class="absolute top-0 left-0 w-32 h-32 bg-white rounded-full opacity-20 mix-blend-overlay transform -translate-x-1/2 -translate-y-1/2">
            </div>
            <div
              class="absolute bottom-0 right-0 w-48 h-48 bg-white rounded-full opacity-20 mix-blend-overlay transform translate-x-1/4 translate-y-1/4">
            </div>
          </div>

          <div
            class="relative mx-auto h-25 w-25 rounded-full border-4 border-white/30 shadow-xl overflow-hidden backdrop-blur-sm">
            <!-- Avatar Image or Initials Placeholder -->
            <img v-if="profile.avatar" :src="profile.avatar" alt="Profile" class="h-full w-full object-cover" />
            <div v-else class="h-full w-full flex items-center justify-center" :class="avatarBgColor">
              <span class="text-5xl font-bold text-white">{{ initials }}</span>
            </div>
            <!-- Removed avatar upload button -->
          </div>
          <h1 class="mt-6 text-3xl font-bold text-white tracking-tight">{{ profile.name }}</h1>
          <p class="text-indigo-100/90 mt-2">{{ profile.email }}</p>
          <p v-if="profile.phone" class="text-indigo-100/80 mt-1 flex items-center justify-center">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24"
              stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
            </svg>
            {{ profile.phone }}
          </p>
        </div>

        <!-- Main Content Area -->
        <div class="px-8 py-8 divide-y divide-gray-200/50">
          <!-- Loading State -->
          <div v-if="loading" class="flex justify-center py-12">
            <div class="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
          </div>

          <!-- Error Message -->
          <div v-if="error" class="mb-8 p-4 bg-red-50/80 rounded-lg backdrop-blur-sm border border-red-100">
            <div class="flex items-center">
              <ExclamationCircleIcon class="h-5 w-5 text-red-500 mr-3 flex-shrink-0" />
              <p class="text-red-700">{{ error }}</p>
            </div>
          </div>

          <!-- Profile Display (non-editable) -->
          <div v-if="!loading" class="space-y-8">
            <!-- Personal Information Section -->
            <div>
              <div class="mb-8">
                <h2 class="text-xl font-semibold text-gray-800 tracking-tight">
                  Personal Information
                </h2>
                <p class="mt-2 text-sm text-gray-500">
                  This is your current profile information.
                </p>
              </div>

              <div class="grid grid-cols-1 gap-y-6 gap-x-6 sm:grid-cols-6">
                <!-- Name Field (display only) -->
                <div class="sm:col-span-6">
                  <label class="block text-sm font-medium text-gray-700 mb-1">
                    User Name
                  </label>
                  <div
                    class="mt-1 block w-full rounded-lg bg-gray-100/50 border-gray-300 shadow-sm sm:text-sm py-2.5 px-4 border">
                    {{ profile.name || 'Not provided' }}
                  </div>
                </div>

                <!-- Email Field (readonly) -->
                <div class="sm:col-span-6">
                  <label class="block text-sm font-medium text-gray-700 mb-1">Email address</label>
                  <div
                    class="mt-1 block w-full rounded-lg bg-gray-100/50 border-gray-300 shadow-sm sm:text-sm py-2.5 px-4 border">
                    {{ profile.email }}
                  </div>
                  <p class="mt-2 text-xs text-gray-500 flex items-start">
                    <svg xmlns="http://www.w3.org/2000/svg" class="h-3.5 w-3.5 mr-1 mt-0.5 flex-shrink-0" fill="none"
                      viewBox="0 0 24 24" stroke="currentColor">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                        d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    Contact support if you need to change your email address.
                  </p>
                </div>

                <!-- Phone Field (display only) -->
                <div class="sm:col-span-6">
                  <label class="block text-sm font-medium text-gray-700 mb-1">Phone number</label>
                  <div
                    class="mt-1 block w-full rounded-lg bg-gray-100/50 border-gray-300 shadow-sm sm:text-sm py-2.5 px-4 border">
                    {{ profile.phone || 'Not provided' }}
                  </div>
                </div>
              </div>
            </div>

            <!-- Removed form actions since we're not editing -->
          </div>
        </div>
      </div>
    </div>

    <!-- Confirmation Dialog -->
    <TransitionRoot as="template" :show="showConfirmation">
      <Dialog as="div" class="relative z-50" @close="showConfirmation = false">
        <TransitionChild as="template" enter="ease-out duration-300" enter-from="opacity-0" enter-to="opacity-100"
          leave="ease-in duration-200" leave-from="opacity-100" leave-to="opacity-0">
          <div class="fixed inset-0 bg-gray-500/80 backdrop-blur-sm transition-opacity" />
        </TransitionChild>

        <div class="fixed inset-0 z-10 overflow-y-auto">
          <div class="flex min-h-full items-end justify-center p-4 text-center sm:items-center sm:p-0">
            <TransitionChild as="template" enter="ease-out duration-300"
              enter-from="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
              enter-to="opacity-100 translate-y-0 sm:scale-100" leave="ease-in duration-200"
              leave-from="opacity-100 translate-y-0 sm:scale-100"
              leave-to="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95">
              <DialogPanel
                class="relative transform overflow-hidden rounded-xl bg-white px-6 pt-6 pb-6 text-left shadow-2xl transition-all sm:my-8 sm:w-full sm:max-w-md sm:p-8">
                <div>
                  <div
                    class="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-indigo-100/80 backdrop-blur-sm">
                    <CheckCircleIcon class="h-8 w-8 text-indigo-600" />
                  </div>
                  <div class="mt-4 text-center sm:mt-5">
                    <DialogTitle as="h3" class="text-xl font-semibold leading-6 text-gray-900 tracking-tight">
                      Confirm Your Details
                    </DialogTitle>
                    <div class="mt-2">
                      <p class="text-sm text-gray-500">
                        Please verify that your profile information is correct.
                      </p>
                    </div>
                  </div>
                </div>

                <!-- Profile Summary -->
                <div class="mt-6 bg-gray-50 p-4 rounded-lg">
                  <div class="flex items-center justify-between py-2 border-b border-gray-200">
                    <span class="text-sm font-medium text-gray-500">Name:</span>
                    <span class="text-sm text-gray-900">{{ profile.name || 'Not provided' }}</span>
                  </div>
                  <div class="flex items-center justify-between py-2 border-b border-gray-200">
                    <span class="text-sm font-medium text-gray-500">Email:</span>
                    <span class="text-sm text-gray-900">{{ profile.email }}</span>
                  </div>
                  <div class="flex items-center justify-between py-2">
                    <span class="text-sm font-medium text-gray-500">Phone:</span>
                    <span class="text-sm text-gray-900">{{ profile.phone || 'Not provided' }}</span>
                  </div>
                </div>

                <div class="mt-6 sm:mt-7 space-y-3">
                  <button type="button"
                    class="inline-flex w-full justify-center rounded-xl border border-transparent bg-gradient-to-r from-teal-600 to-emerald-600 px-4 py-3 text-base font-medium text-white shadow-sm hover:from-indigo-700 hover:to-purple-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 sm:text-sm transition-all duration-200"
                    @click="showConfirmation = false">
                    Everything Looks Correct
                  </button>
                  <button type="button"
                    class="inline-flex w-full justify-center rounded-xl border border-gray-300 bg-white px-4 py-3 text-base font-medium text-gray-700 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 sm:text-sm transition-all duration-200"
                    @click="contactAdmin = true; showConfirmation = false">
                    I Need To Make Changes
                  </button>
                </div>
              </DialogPanel>
            </TransitionChild>
          </div>
        </div>
      </Dialog>
    </TransitionRoot>

    <!-- Contact Admin Dialog -->
    <TransitionRoot as="template" :show="contactAdmin">
      <Dialog as="div" class="relative z-50" @close="contactAdmin = false">
        <TransitionChild as="template" enter="ease-out duration-300" enter-from="opacity-0" enter-to="opacity-100"
          leave="ease-in duration-200" leave-from="opacity-100" leave-to="opacity-0">
          <div class="fixed inset-0 bg-gray-500/80 backdrop-blur-sm transition-opacity" />
        </TransitionChild>

        <div class="fixed inset-0 z-10 overflow-y-auto">
          <div class="flex min-h-full items-end justify-center p-4 text-center sm:items-center sm:p-0">
            <TransitionChild as="template" enter="ease-out duration-300"
              enter-from="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
              enter-to="opacity-100 translate-y-0 sm:scale-100" leave="ease-in duration-200"
              leave-from="opacity-100 translate-y-0 sm:scale-100"
              leave-to="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95">
              <DialogPanel
                class="relative transform overflow-hidden rounded-xl bg-white px-6 pt-6 pb-6 text-left shadow-2xl transition-all sm:my-8 sm:w-full sm:max-w-md sm:p-8">
                <div>
                  <div
                    class="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-red-100/80 backdrop-blur-sm">
                    <ExclamationCircleIcon class="h-8 w-8 text-red-600" />
                  </div>
                  <div class="mt-4 text-center sm:mt-5">
                    <DialogTitle as="h3" class="text-xl font-semibold leading-6 text-gray-900 tracking-tight">
                      Contact Administrator
                    </DialogTitle>
                    <div class="mt-2">
                      <p class="text-sm text-gray-500">
                        Please contact support to update your profile information.
                      </p>
                    </div>
                  </div>
                </div>

                <div class="mt-6 bg-gray-50 p-4 rounded-lg">
                  <p class="text-sm text-gray-700 mb-3">
                    You can reach our support team at:
                  </p>
                  <div class="flex items-center space-x-2">
                    <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 text-gray-500" fill="none"
                      viewBox="0 0 24 24" stroke="currentColor">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                        d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                    <span class="text-sm text-gray-900">cityradiuschs@gmail.com</span>
                  </div>
                  <div class="flex items-center space-x-2 mt-2">
                    <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 text-gray-500" fill="none"
                      viewBox="0 0 24 24" stroke="currentColor">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                        d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                    </svg>
                    <span class="text-sm text-gray-900">+1 (480)-651-6458</span>
                  </div>
                </div>

                <div class="mt-6 sm:mt-7">
                  <button type="button"
                    class="inline-flex w-full justify-center rounded-xl border border-transparent bg-gradient-to-r from-teal-600 to-emerald-600 px-4 py-3 text-base font-medium text-white shadow-sm hover:from-indigo-700 hover:to-purple-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 sm:text-sm transition-all duration-200"
                    @click="contactAdmin = false">
                    Understood
                  </button>
                </div>
              </DialogPanel>
            </TransitionChild>
          </div>
        </div>
      </Dialog>
    </TransitionRoot>
  </div>
  <TheFooter />
</template>
