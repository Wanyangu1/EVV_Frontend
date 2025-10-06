<script setup>
import { reactive, ref } from 'vue'
import axiosInstance from '@/axiosconfig/axiosInstance'
import TheNavbar from '@/components/TheNavbar.vue'
import TheFooter from '@/components/TheFooter.vue'

const form = reactive({
  current_password: '',
  new_password: '',
  confirm_password: '',
})

const errors = reactive({
  current_password: '',
  new_password: '',
  confirm_password: '',
})

const message = reactive({
  text: '',
  type: '',
})

const loading = ref(false)
const showPassword = reactive({
  current: false,
  new: false,
  confirm: false
})

const validateForm = () => {
  let isValid = true

  errors.current_password = ''
  errors.new_password = ''
  errors.confirm_password = ''

  if (!form.current_password) {
    errors.current_password = 'Current password is required'
    isValid = false
  }

  if (!form.new_password) {
    errors.new_password = 'New password is required'
    isValid = false
  } else if (form.new_password.length < 8) {
    errors.new_password = 'Password must be at least 8 characters'
    isValid = false
  } else if (!/[A-Z]/.test(form.new_password)) {
    errors.new_password = 'Password must contain at least one uppercase letter'
    isValid = false
  } else if (!/[0-9]/.test(form.new_password)) {
    errors.new_password = 'Password must contain at least one number'
    isValid = false
  } else if (!/[^A-Za-z0-9]/.test(form.new_password)) {
    errors.new_password = 'Password must contain at least one special character'
    isValid = false
  }

  if (!form.confirm_password) {
    errors.confirm_password = 'Please confirm your new password'
    isValid = false
  } else if (form.new_password !== form.confirm_password) {
    errors.confirm_password = 'Passwords do not match'
    isValid = false
  }

  return isValid
}

const changePassword = async () => {
  if (!validateForm()) return

  loading.value = true
  message.text = ''

  try {
    const response = await axiosInstance.post(
      'https://backend.mycityradiusattendance.com/api/change-password/',
      {
        current_password: form.current_password,
        new_password: form.new_password,
      },
      {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('access_token')}`,
        },
      },
    )

    message.text = response.data.detail || 'Password changed successfully'
    message.type = 'success'

    form.current_password = ''
    form.new_password = ''
    form.confirm_password = ''

    showPassword.current = false
    showPassword.new = false
    showPassword.confirm = false
  } catch (error) {
    let errorMessage = 'An error occurred while changing password'

    if (error.response) {
      if (error.response.data.detail) {
        errorMessage = error.response.data.detail
      } else if (error.response.data.new_password) {
        errorMessage = error.response.data.new_password.join(' ')
      }
    }

    message.text = errorMessage
    message.type = 'error'
  } finally {
    loading.value = false
  }
}

const togglePasswordVisibility = (field) => {
  showPassword[field] = !showPassword[field]
}
</script>

<template>
  <TheNavbar />

  <!-- Main Container with Fade-in Animation -->
  <div class="min-h-screen bg-gradient-to-br from-indigo-50 to-white py-12 px-4 sm:px-6 lg:px-8 animate-fade-in">
    <div
      class="max-w-md mx-auto bg-white rounded-2xl shadow-xl overflow-hidden transition-all duration-300 hover:shadow-2xl">
      <div class="bg-gradient-to-r from-teal-600 to-emerald-500  p-6 text-white">
        <div class="flex items-center space-x-3">
          <!-- Animated Lock Icon -->
          <div class="relative">
            <svg class="h-10 w-10 text-white animate-bounce" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
            <div class="absolute -top-1 -right-1 bg-yellow-400 rounded-full w-4 h-4 flex items-center justify-center">
              <svg class="h-3 w-3 text-yellow-800" viewBox="0 0 20 20" fill="currentColor">
                <path fill-rule="evenodd"
                  d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z"
                  clip-rule="evenodd" />
              </svg>
            </div>
          </div>
          <div>
            <h2 class="text-2xl font-bold">Change Password</h2>
            <p class="text-indigo-100 text-sm">Secure your account with a new password</p>
          </div>
        </div>
      </div>

      <!-- Card Body -->
      <div class="p-6">
        <form @submit.prevent="changePassword" class="space-y-6">
          <!-- Current Password -->
          <div class="space-y-2">
            <label for="current_password" class="block text-sm font-medium text-gray-700">Current Password</label>
            <div class="relative">
              <input v-model="form.current_password" :type="showPassword.current ? 'text' : 'password'"
                id="current_password" name="current_password" required
                class="block w-full px-4 py-3 border border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-200"
                :class="{ 'border-red-500': errors.current_password, 'pr-10': true }"
                placeholder="Enter your current password" />
              <button type="button" class="absolute inset-y-0 right-0 pr-3 flex items-center"
                @click="togglePasswordVisibility('current')">
                <svg class="h-5 w-5 text-gray-400 hover:text-indigo-600 transition-colors duration-200" fill="none"
                  viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                    :d="showPassword.current ? 'M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21' : 'M15 12a3 3 0 11-6 0 3 3 0 016 0z M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z'" />
                </svg>
              </button>
            </div>
            <transition name="fade">
              <p v-if="errors.current_password" class="mt-1 text-sm text-red-600 flex items-start">
                <svg class="h-4 w-4 mr-1 mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                    d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                {{ errors.current_password }}
              </p>
            </transition>
          </div>

          <!-- New Password -->
          <div class="space-y-2">
            <label for="new_password" class="block text-sm font-medium text-gray-700">New Password</label>
            <div class="relative">
              <input v-model="form.new_password" :type="showPassword.new ? 'text' : 'password'" id="new_password"
                name="new_password" required
                class="block w-full px-4 py-3 border border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-200"
                :class="{ 'border-red-500': errors.new_password, 'pr-10': true }" placeholder="Create a new password" />
              <button type="button" class="absolute inset-y-0 right-0 pr-3 flex items-center"
                @click="togglePasswordVisibility('new')">
                <svg class="h-5 w-5 text-gray-400 hover:text-indigo-600 transition-colors duration-200" fill="none"
                  viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                    :d="showPassword.new ? 'M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21' : 'M15 12a3 3 0 11-6 0 3 3 0 016 0z M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z'" />
                </svg>
              </button>
            </div>

            <!-- Password Strength Meter -->
            <div class="mt-2">
              <div class="flex space-x-1">
                <div v-for="i in 4" :key="i" class="h-1.5 flex-1 rounded-full bg-gray-200" :class="{
                  'bg-red-400': form.new_password.length > 0 && form.new_password.length < 4,
                  'bg-yellow-400': form.new_password.length >= 4 && form.new_password.length < 8,
                  'bg-green-400': form.new_password.length >= 8 && (
                    !/[A-Z]/.test(form.new_password) ||
                    !/[0-9]/.test(form.new_password) ||
                    !/[^A-Za-z0-9]/.test(form.new_password)
                  ),
                  'bg-indigo-500': form.new_password.length >= 8 &&
                    /[A-Z]/.test(form.new_password) &&
                    /[0-9]/.test(form.new_password) &&
                    /[^A-Za-z0-9]/.test(form.new_password)
                }" :style="{ width: form.new_password.length > 0 ? '100%' : '0%', transition: 'all 0.3s ease' }"></div>
              </div>

              <p class="mt-1 text-xs text-gray-500">
                <span v-if="form.new_password.length > 0 && form.new_password.length < 4">Very weak</span>
                <span v-else-if="form.new_password.length >= 4 && form.new_password.length < 8">Weak</span>
                <span
                  v-else-if="form.new_password.length >= 8 && (!/[A-Z]/.test(form.new_password) || !/[0-9]/.test(form.new_password) || !/[^A-Za-z0-9]/.test(form.new_password))">Good</span>
                <span
                  v-else-if="form.new_password.length >= 8 && /[A-Z]/.test(form.new_password) && /[0-9]/.test(form.new_password) && /[^A-Za-z0-9]/.test(form.new_password)">Strong</span>
                <span v-else>Password strength</span>
              </p>
            </div>

            <transition name="fade">
              <p v-if="errors.new_password" class="mt-1 text-sm text-red-600 flex items-start">
                <svg class="h-4 w-4 mr-1 mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                    d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                {{ errors.new_password }}
              </p>
            </transition>

            <div class="mt-2 grid grid-cols-2 gap-2 text-xs text-gray-500">
              <div class="flex items-center" :class="{ 'text-green-600': form.new_password.length >= 8 }">
                <svg class="h-3 w-3 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"
                    :class="{ 'opacity-0': form.new_password.length < 8 }" />
                </svg>
                8+ characters
              </div>
              <div class="flex items-center" :class="{ 'text-green-600': /[A-Z]/.test(form.new_password) }">
                <svg class="h-3 w-3 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"
                    :class="{ 'opacity-0': !/[A-Z]/.test(form.new_password) }" />
                </svg>
                Uppercase
              </div>
              <div class="flex items-center" :class="{ 'text-green-600': /[0-9]/.test(form.new_password) }">
                <svg class="h-3 w-3 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"
                    :class="{ 'opacity-0': !/[0-9]/.test(form.new_password) }" />
                </svg>
                Number
              </div>
              <div class="flex items-center" :class="{ 'text-green-600': /[^A-Za-z0-9]/.test(form.new_password) }">
                <svg class="h-3 w-3 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"
                    :class="{ 'opacity-0': !/[^A-Za-z0-9]/.test(form.new_password) }" />
                </svg>
                Special char
              </div>
            </div>
          </div>

          <!-- Confirm New Password -->
          <div class="space-y-2">
            <label for="confirm_password" class="block text-sm font-medium text-gray-700">Confirm New Password</label>
            <div class="relative">
              <input v-model="form.confirm_password" :type="showPassword.confirm ? 'text' : 'password'"
                id="confirm_password" name="confirm_password" required
                class="block w-full px-4 py-3 border border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-200"
                :class="{ 'border-red-500': errors.confirm_password, 'pr-10': true }"
                placeholder="Confirm your new password" />
              <button type="button" class="absolute inset-y-0 right-0 pr-3 flex items-center"
                @click="togglePasswordVisibility('confirm')">
                <svg class="h-5 w-5 text-gray-400 hover:text-indigo-600 transition-colors duration-200" fill="none"
                  viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                    :d="showPassword.confirm ? 'M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21' : 'M15 12a3 3 0 11-6 0 3 3 0 016 0z M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z'" />
                </svg>
              </button>
            </div>
            <transition name="fade">
              <p v-if="errors.confirm_password" class="mt-1 text-sm text-red-600 flex items-start">
                <svg class="h-4 w-4 mr-1 mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                    d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                {{ errors.confirm_password }}
              </p>
            </transition>
          </div>

          <transition name="slide-fade">
            <div v-if="message.text" class="rounded-lg p-4 border-l-4" :class="{
              'bg-green-50 text-green-800 border-green-500': message.type === 'success',
              'bg-red-50 text-red-800 border-red-500': message.type === 'error',
            }">
              <div class="flex items-center">
                <svg v-if="message.type === 'success'" class="h-5 w-5 text-green-500 mr-3 flex-shrink-0" fill="none"
                  viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                    d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <svg v-if="message.type === 'error'" class="h-5 w-5 text-red-500 mr-3 flex-shrink-0" fill="none"
                  viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                    d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <p class="text-sm font-medium">{{ message.text }}</p>
              </div>
            </div>
          </transition>

          <!-- Submit Button with Hover Animation -->
          <div>
            <button type="submit"
              class="w-full flex justify-center items-center py-3 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-all duration-300 hover:shadow-md transform hover:-translate-y-0.5"
              :disabled="loading">
              <svg v-if="loading" class="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg"
                fill="none" viewBox="0 0 24 24">
                <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                <path class="opacity-75" fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z">
                </path>
              </svg>
              {{ loading ? 'Changing Password...' : 'Change Password' }}
            </button>
          </div>
        </form>
      </div>
    </div>
  </div>

  <TheFooter />
</template>

<style>
.animate-fade-in {
  animation: fadeIn 0.5s ease-in-out;
}

@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(10px);
  }

  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

.slide-fade-enter-active {
  transition: all 0.3s ease-out;
}

.slide-fade-leave-active {
  transition: all 0.3s cubic-bezier(1, 0.5, 0.8, 1);
}

.slide-fade-enter-from,
.slide-fade-leave-to {
  transform: translateX(20px);
  opacity: 0;
}
</style>
