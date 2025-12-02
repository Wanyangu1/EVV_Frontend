<script setup>
import { ref, computed, onMounted } from 'vue'
import axiosInstance from '@/axiosconfig/axiosInstance'
import { Dialog, DialogPanel, DialogTitle, TransitionChild, TransitionRoot } from '@headlessui/vue'
import { CheckCircleIcon, ExclamationCircleIcon, PencilIcon, PlusIcon } from '@heroicons/vue/24/outline'

// Sidebar state
const sidebarOpen = ref(true)

// Profile state
const profile = ref({
  id: null,
  name: '',
  email: '',
  phone: '',
  avatar: null,
})

// Editable state
const editableProfile = ref({})
const isEditing = ref(false)
const loading = ref(true)
const saving = ref(false)
const error = ref(null)
const success = ref(null)

// Dialog states
const showSuccessDialog = ref(false)
// Toggle sidebar
const toggleSidebar = () => {
  sidebarOpen.value = !sidebarOpen.value
}

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

// Fetch profile data
const fetchProfile = async () => {
  try {
    loading.value = true
    error.value = null
    const response = await axiosInstance.get('/api/profile/')
    profile.value = response.data
    // Initialize editable profile with current data
    editableProfile.value = { ...response.data }
  } catch (err) {
    error.value = 'Failed to load profile data. Please try again later.'
    console.error('Error fetching profile:', err)
  } finally {
    loading.value = false
  }
}

// Start editing
const startEditing = () => {
  editableProfile.value = { ...profile.value }
  isEditing.value = true
}

// Cancel editing
const cancelEditing = () => {
  editableProfile.value = { ...profile.value }
  isEditing.value = false
  error.value = null
}

// Update profile
const updateProfile = async () => {
  try {
    saving.value = true
    error.value = null

    const response = await axiosInstance.patch('/api/profile/', editableProfile.value)
    profile.value = response.data
    isEditing.value = false
    success.value = 'Profile updated successfully!'
    showSuccessDialog.value = true
  } catch (err) {
    error.value = 'Failed to update profile. Please try again.'
    console.error('Error updating profile:', err)
  } finally {
    saving.value = false
  }
}

// Handle avatar upload
const handleAvatarUpload = async (event) => {
  const file = event.target.files[0]
  if (!file) return

  // Validate file type and size
  const validTypes = ['image/jpeg', 'image/png', 'image/gif']
  const maxSize = 5 * 1024 * 1024 // 5MB

  if (!validTypes.includes(file.type)) {
    error.value = 'Please select a valid image file (JPEG, PNG, GIF)'
    return
  }

  if (file.size > maxSize) {
    error.value = 'Image size must be less than 5MB'
    return
  }

  try {
    saving.value = true
    const formData = new FormData()
    formData.append('avatar', file)

    const response = await axiosInstance.patch('/api/profile/', formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    })

    profile.value = response.data
    editableProfile.value.avatar = response.data.avatar
    success.value = 'Profile picture updated successfully!'
    showSuccessDialog.value = true
  } catch (err) {
    error.value = 'Failed to upload profile picture. Please try again.'
    console.error('Error uploading avatar:', err)
  } finally {
    saving.value = false
    event.target.value = '' // Reset file input
  }
}

// Fetch profile on component mount
onMounted(() => {
  fetchProfile()
})
</script>

<template>
  <div class="min-h-screen bg-gray-50 flex">

    <!-- Main Content -->
    <div class="flex-1 flex flex-col mt-2 lg:ml-4">
      <!-- Mobile sidebar toggle -->
      <div class="lg:hidden bg-white border-b border-gray-200 px-4 py-3">
        <button @click="toggleSidebar" class="p-2 rounded-md text-gray-500 hover:text-gray-700">
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>
      </div>

      <main class="flex-1 p-6">
        <!-- Header Section -->
        <div class="mb-8">
          <h1 class="text-2xl font-bold text-gray-900">Profile Management</h1>
          <p class="mt-1 text-gray-600">Manage your personal information and account settings</p>
        </div>

        <!-- Profile Card -->
        <div class="max-w-2xl ">
          <div class="bg-white shadow-lg rounded-xl overflow-hidden">
            <!-- Profile Header -->
            <div class="relative bg-gradient-to-r from-blue-600 to-indigo-700 px-6 py-8 text-center">
              <div class="absolute inset-0 opacity-10">
                <div
                  class="absolute top-0 left-0 w-24 h-24 bg-white rounded-full opacity-20 mix-blend-overlay transform -translate-x-1/2 -translate-y-1/2">
                </div>
                <div
                  class="absolute bottom-0 right-0 w-32 h-32 bg-white rounded-full opacity-20 mix-blend-overlay transform translate-x-1/4 translate-y-1/4">
                </div>
              </div>

              <div
                class="relative mx-auto w-24 h-24 rounded-full border-4 border-white/30 shadow-lg overflow-hidden backdrop-blur-sm">
                <!-- Avatar Image or Initials Placeholder -->
                <img v-if="profile.avatar" :src="profile.avatar" alt="Profile" class="w-full h-full object-cover" />
                <div v-else class="w-full h-full flex items-center justify-center" :class="avatarBgColor">
                  <span class="text-2xl font-bold text-white">{{ initials }}</span>
                </div>

                <!-- Avatar Upload Button -->
                <label v-if="isEditing"
                  class="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity cursor-pointer">
                  <PlusIcon class="w-6 h-6 text-white" />
                  <input type="file" class="hidden" accept="image/*" @change="handleAvatarUpload" />
                </label>
              </div>

              <h1 class="mt-4 text-xl font-bold text-white">{{ profile.name || 'No Name' }}</h1>
              <p class="text-blue-100/90 mt-1 text-sm">{{ profile.email }}</p>
              <p v-if="profile.phone" class="text-blue-100/80 mt-1 flex items-center justify-center text-sm">
                <svg xmlns="http://www.w3.org/2000/svg" class="h-3 w-3 mr-1" fill="none" viewBox="0 0 24 24"
                  stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                    d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                </svg>
                {{ profile.phone }}
              </p>
            </div>

            <!-- Main Content Area -->
            <div class="px-6 py-6">
              <!-- Loading State -->
              <div v-if="loading" class="flex justify-center py-8">
                <div class="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
              </div>

              <!-- Error Message -->
              <div v-if="error" class="mb-4 p-3 bg-red-50 rounded-lg border border-red-200">
                <div class="flex items-center">
                  <ExclamationCircleIcon class="h-4 w-4 text-red-500 mr-2 flex-shrink-0" />
                  <p class="text-red-700 text-sm">{{ error }}</p>
                </div>
              </div>

              <!-- Profile Form -->
              <div v-if="!loading" class="space-y-6">
                <!-- Action Buttons -->
                <div class="flex justify-between items-center">
                  <h2 class="text-lg font-semibold text-gray-800">Personal Information</h2>
                  <button v-if="!isEditing" @click="startEditing"
                    class="inline-flex items-center px-3 py-1.5 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors">
                    <PencilIcon class="h-3 w-3 mr-1" />
                    Edit Profile
                  </button>
                </div>

                <!-- Personal Information Section -->
                <div class="grid grid-cols-1 gap-y-4 gap-x-4">
                  <!-- Name Field -->
                  <div>
                    <label class="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
                    <input v-if="isEditing" v-model="editableProfile.name" type="text"
                      class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-sm py-2 px-3 border"
                      placeholder="Enter your full name" />
                    <div v-else
                      class="mt-1 block w-full rounded-md bg-gray-50 border-gray-300 shadow-sm text-sm py-2 px-3 border">
                      {{ profile.name || 'Not provided' }}
                    </div>
                  </div>

                  <!-- Email Field -->
                  <div>
                    <label class="block text-sm font-medium text-gray-700 mb-1">Email Address</label>
                    <input v-if="isEditing" v-model="editableProfile.email" type="email"
                      class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-sm py-2 px-3 border"
                      placeholder="Enter your email" />
                    <div v-else
                      class="mt-1 block w-full rounded-md bg-gray-50 border-gray-300 shadow-sm text-sm py-2 px-3 border">
                      {{ profile.email }}
                    </div>
                  </div>

                  <!-- Phone Field -->
                  <div>
                    <label class="block text-sm font-medium text-gray-700 mb-1">Phone Number</label>
                    <input v-if="isEditing" v-model="editableProfile.phone" type="tel"
                      class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-sm py-2 px-3 border"
                      placeholder="Enter your phone number" />
                    <div v-else
                      class="mt-1 block w-full rounded-md bg-gray-50 border-gray-300 shadow-sm text-sm py-2 px-3 border">
                      {{ profile.phone || 'Not provided' }}
                    </div>
                  </div>
                </div>

                <!-- Form Actions -->
                <div v-if="isEditing" class="flex justify-end space-x-3 pt-4 border-t border-gray-200">
                  <button @click="cancelEditing" type="button"
                    class="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors">
                    Cancel
                  </button>
                  <button @click="updateProfile" :disabled="saving" type="button"
                    class="px-4 py-2 border border-transparent rounded-md text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors">
                    <span v-if="saving" class="inline-flex items-center">
                      <div class="animate-spin rounded-full h-3 w-3 border-t-2 border-b-2 border-white mr-1"></div>
                      Saving...
                    </span>
                    <span v-else>Save Changes</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  </div>

  <!-- Success Dialog -->
  <TransitionRoot as="template" :show="showSuccessDialog">
    <Dialog as="div" class="relative z-50" @close="showSuccessDialog = false">
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
              class="relative transform overflow-hidden rounded-lg bg-white px-4 pt-5 pb-4 text-left shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-sm sm:p-6">
              <div>
                <div class="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-green-100">
                  <CheckCircleIcon class="h-6 w-6 text-green-600" />
                </div>
                <div class="mt-3 text-center sm:mt-5">
                  <DialogTitle as="h3" class="text-lg font-semibold leading-6 text-gray-900">
                    Success
                  </DialogTitle>
                  <div class="mt-2">
                    <p class="text-sm text-gray-500">
                      {{ success }}
                    </p>
                  </div>
                </div>
              </div>

              <div class="mt-5 sm:mt-6">
                <button @click="showSuccessDialog = false" type="button"
                  class="inline-flex w-full justify-center rounded-md border border-transparent bg-blue-600 px-4 py-2 text-base font-medium text-white shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 sm:text-sm transition-colors">
                  Continue
                </button>
              </div>
            </DialogPanel>
          </TransitionChild>
        </div>
      </div>
    </Dialog>
  </TransitionRoot>
</template>

<style scoped>
/* Custom styles for better visual hierarchy */
.hover-lift:hover {
  transform: translateY(-1px);
  transition: transform 0.2s ease-in-out;
}

/* Smooth transitions for all interactive elements */
button,
input,
.transition-all {
  transition: all 0.2s ease-in-out;
}
</style>
