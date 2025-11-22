<script setup>
import useAuth from '@/composables/useAuth'
import { ref, onMounted, onBeforeUnmount } from 'vue'
import logoImage from '@/assets/logos/logo.jpg'
import bgImage from '@/assets/General/senior-reading.jpg'

// Health service specific images
const backgroundImage = ref(bgImage)

const { email, password, login, errorMessage } = useAuth()
const showPassword = ref(false)
const isLoading = ref(false)
const attendanceType = ref('check-in') // Default to check-in

// Time display with fixed width to prevent layout shifting
const currentDateTime = ref('')
const timeDisplayWidth = 'min-w-[22ch]' // Fixed width for time display

function updateArizonaTime() {
  const options = {
    timeZone: 'America/Phoenix',
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: true
  }

  // Use Intl.DateTimeFormat for consistent formatting
  const formatter = new Intl.DateTimeFormat('en-US', options)
  const parts = formatter.formatToParts(new Date())

  currentDateTime.value = parts.map(part => part.value).join('')
}

let intervalId

onMounted(() => {
  updateArizonaTime()
  intervalId = setInterval(updateArizonaTime, 1000)
})

onBeforeUnmount(() => {
  clearInterval(intervalId)
})

const handleLogin = async () => {
  isLoading.value = true
  await login()
  isLoading.value = false
}
</script>

<template>
  <div class="min-h-screen flex flex-col md:flex-row bg-gradient-to-br from-sky-50 to-white">
    <!-- Left Side: Health Service Information (Hidden on mobile) -->
    <div class="hidden md:flex md:w-1/2 relative">
      <!-- Background Image -->
      <img :src="backgroundImage" alt="Healthcare background" class="absolute inset-0 w-full h-full object-cover" />

      <!-- Gradient Overlay -->
      <div class="absolute inset-0 bg-gradient-to-t from-navy-900/70 to-navy-800/40"></div>

      <!-- Content Overlay -->
      <div class="relative z-10 flex flex-col mt-2 justify-between p-4 text-white h-screen">
        <!-- Main Logo and Title - Hidden on small screens -->
        <div class="hidden md:flex flex-col items-center">
          <div class="bg-black/70 backdrop-blur-sm p-2 rounded-xl text-center">
            <img :src="logoImage" class="h-16 w-16 mx-auto" alt="City Radius CHS" />
          </div>
        </div>

        <!-- Featured Content -->
        <div class="mb-4">
          <h1 class="text-3xl font-bold mb-4">Electronic Visit Verification (EVV)</h1>
          <p class="text-lg opacity-90 mb-8">
            Recording your time helps us ensure proper staffing to serve our community's health needs.
          </p>

          <!-- Health Service Info -->
          <div class="bg-white/20 backdrop-blur-sm p-6 rounded-xl max-w-md border border-white/30">
            <div class="flex items-start">
              <svg xmlns="http://www.w3.org/2000/svg" class="h-12 w-12 text-sky-200 mr-4" fill="none"
                viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                  d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
              </svg>
              <div>
                <p class="mb-2">Please record your attendance accurately to help us:</p>
                <ul class="list-disc pl-5 space-y-1">
                  <li>Improve Accountability</li>
                  <li>Track service hours</li>
                  <li>Ensure payroll accuracy</li>
                </ul>
              </div>
            </div>
          </div>
        </div>

        <!-- Current Time Display (Desktop) -->
        <div class="bg-white/20 backdrop-blur-sm p-4 rounded-lg border border-white/30" :class="timeDisplayWidth">
          <p class="text-sm opacity-90">Current Date & Time:</p>
          <p class="text-xl font-mono tracking-tight">{{ currentDateTime }}</p>
        </div>
      </div>
    </div>

    <!-- Right Side: Attendance Form -->
    <div class="w-full md:w-1/2 flex items-center justify-center p-4 md:p-12">
      <div class="w-full max-w-md">
        <!-- Mobile Logo - Completely removed for small screens -->
        <!-- <div class="md:hidden flex justify-center mb-6">
          <div class="bg-sky-50 p-4 rounded-xl text-center border border-sky-100">
            <img :src="logoImage" class="h-14 mx-auto" alt="Logo" />
          </div>
        </div> -->

        <!-- Attendance Card -->
        <div class="bg-white rounded-2xl shadow-xl overflow-hidden border border-gray-100">
          <!-- Card Header -->
          <div class="bg-navy-700 p-4 text-center">
            <h2 class="text-2xl font-bold text-white">Electronic Visit Verification</h2>
            <p class="text-sky-200 mt-1">Brightpath Technologies EVV</p>
          </div>

          <!-- Card Body -->
          <div class="p-6 md:p-8">
            <!-- Current Time Display (Mobile) -->
            <div class="md:hidden bg-sky-50 p-4 rounded-lg mb-6 text-center border border-sky-100"
              :class="timeDisplayWidth">
              <p class="text-sm text-navy-700 font-medium">Current Date & Time:</p>
              <p class="text-lg font-mono tracking-tight text-navy-800">{{ currentDateTime }}</p>
            </div>

            <!-- Login Form -->
            <form @submit.prevent="handleLogin" class="space-y-6">
              <!-- Error Message -->
              <div v-if="errorMessage" class="rounded-md bg-red-50 p-4 border-l-4 border-red-400">
                <div class="flex">
                  <div class="flex-shrink-0">
                    <svg class="h-5 w-5 text-red-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"
                      fill="currentColor">
                      <path fill-rule="evenodd"
                        d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                        clip-rule="evenodd" />
                    </svg>
                  </div>
                  <div class="ml-3">
                    <p class="text-sm font-medium text-red-800">{{ errorMessage }}</p>
                  </div>
                </div>
              </div>

              <!-- Employee ID Field -->
              <div>
                <label for="email" class="block text-sm font-medium text-gray-700 mb-1">Caregiver Email</label>
                <div class="relative">
                  <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 text-gray-400" fill="none"
                      viewBox="0 0 24 24" stroke="currentColor">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                        d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                  </div>
                  <input v-model="email" type="text" id="employee-id" placeholder="Your employee ID"
                    class="block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg shadow-sm focus:ring-orange-500 focus:border-orange-500 transition-colors"
                    required />
                </div>
              </div>

              <!-- Password Field -->
              <div>
                <label for="password" class="block text-sm font-medium text-gray-700 mb-1">Password</label>
                <div class="relative">
                  <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 text-gray-400" fill="none"
                      viewBox="0 0 24 24" stroke="currentColor">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                        d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                    </svg>
                  </div>
                  <input v-model="password" :type="showPassword ? 'text' : 'password'" id="password"
                    placeholder="••••••••"
                    class="block w-full pl-10 pr-10 py-3 border border-gray-300 rounded-lg shadow-sm focus:ring-orange-500 focus:border-orange-500 transition-colors"
                    required />
                  <button type="button" @click="showPassword = !showPassword"
                    class="absolute inset-y-0 right-0 pr-3 flex items-center">
                    <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 text-gray-400" fill="none"
                      viewBox="0 0 24 24" stroke="currentColor">
                      <path v-if="showPassword" stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                        d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                      <path v-else stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                        d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                  </button>
                </div>
                <div class="mt-2 flex justify-end">
                  <p class="text-sm text-gray-600">
                    <a href="mailto:mycityradius5@gmail.com"
                      class="font-medium text-orange-600 hover:text-orange-500 transition-colors">Contact Admin If
                      Forgot
                      credentials</a>
                  </p>
                </div>
              </div>

              <!-- Location Verification -->
              <div class="bg-sky-50 p-4 rounded-lg border border-sky-100">
                <label class="flex items-start">
                  <input type="checkbox" class="mt-1 mr-2 rounded text-orange-500 focus:ring-orange-500" required />
                  <span class="text-sm text-navy-700">I confirm that I am physically present at my designated work
                    location</span>
                </label>
              </div>

              <!-- Submit Button -->
              <div>
                <button type="submit" :disabled="isLoading"
                  class="w-full flex justify-center py-3 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500 transition-all duration-300"
                  :class="{ 'opacity-70 cursor-not-allowed': isLoading }">
                  <svg v-if="isLoading" class="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
                    xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                    <path class="opacity-75" fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z">
                    </path>
                  </svg>
                  <span v-if="attendanceType === 'check-in'">
                    {{ isLoading ? 'Checking in...' : 'Check In' }}
                  </span>
                  <span v-else>
                    {{ isLoading ? 'Checking out...' : 'Check Out' }}
                  </span>
                </button>
              </div>
            </form>
          </div>

          <!-- Admin Login Card Footer -->
          <div
            class="bg-gradient-to-r from-sky-50 to-white px-6 py-5 text-center rounded-b-lg border-t border-gray-200">
            <div class="flex items-center justify-center space-x-2">
              <!-- Shield Admin Icon -->
              <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 text-navy-600" fill="none" viewBox="0 0 24 24"
                stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                  d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>

              <p class="text-sm font-medium text-navy-700">
                Administrator Access
              </p>
            </div>

            <div class="mt-2">
              <a href="https://divinecarebackend.jikubaliafrica.org/admin" target="_blank" rel="noopener noreferrer"
                class="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-gradient-to-r from-navy-600 to-navy-700 hover:from-navy-700 hover:to-navy-800 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-navy-500">
                <!-- Lock Icon -->
                <svg xmlns="http://www.w3.org/2000/svg" class="-ml-1 mr-2 h-4 w-4" fill="none" viewBox="0 0 24 24"
                  stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                    d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
                Access Admin Dashboard
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
/* Custom animations */
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

/* Apply animation to form elements */
form>* {
  animation: fadeIn 0.5s ease-out forwards;
}

/* Delay animations for each form element */
form>*:nth-child(1) {
  animation-delay: 0.1s;
}

form>*:nth-child(2) {
  animation-delay: 0.2s;
}

form>*:nth-child(3) {
  animation-delay: 0.3s;
}

form>*:nth-child(4) {
  animation-delay: 0.4s;
}

/* Time display styling to prevent layout shift */
.font-mono {
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace;
  letter-spacing: -0.025em;
}

/* Hover effects for interactive elements */
button,
a {
  transition: all 0.2s ease;
}

/* Focus styles */
input:focus,
button:focus {
  outline: none;
  box-shadow: 0 0 0 3px rgba(249, 115, 22, 0.3);
}

/* Responsive adjustments */
@media (max-width: 767px) {
  .min-h-screen {
    padding-top: 1rem;
    padding-bottom: 1rem;
  }

  /* Ensure form is the primary focus on mobile */
  .md\\:hidden+div {
    margin-top: 0;
  }
}

/* Custom color definitions for navy blue, sky blue, and orange */
.bg-navy-700 {
  background-color: #1e3a8a;
}

.bg-navy-600 {
  background-color: #2563eb;
}

.bg-navy-900 {
  background-color: #0f172a;
}

.text-navy-700 {
  color: #1e3a8a;
}

.text-navy-800 {
  color: #1e40af;
}

.border-navy-500 {
  border-color: #3b82f6;
}

.from-navy-600 {
  --tw-gradient-from: #2563eb;
  --tw-gradient-stops: var(--tw-gradient-from), var(--tw-gradient-to, rgba(37, 99, 235, 0));
}

.to-navy-700 {
  --tw-gradient-to: #1d4ed8;
}

.hover\\:from-navy-700:hover {
  --tw-gradient-from: #1d4ed8;
  --tw-gradient-stops: var(--tw-gradient-from), var(--tw-gradient-to, rgba(29, 78, 216, 0));
}

.hover\\:to-navy-800:hover {
  --tw-gradient-to: #1e40af;
}

.bg-sky-50 {
  background-color: #f0f9ff;
}

.text-sky-200 {
  color: #bae6fd;
}

.border-sky-100 {
  border-color: #e0f2fe;
}

.from-sky-50 {
  --tw-gradient-from: #f0f9ff;
  --tw-gradient-stops: var(--tw-gradient-from), var(--tw-gradient-to, rgba(240, 249, 255, 0));
}

.bg-orange-500 {
  background-color: #f97316;
}

.bg-orange-600 {
  background-color: #ea580c;
}

.from-orange-500 {
  --tw-gradient-from: #f97316;
  --tw-gradient-stops: var(--tw-gradient-from), var(--tw-gradient-to, rgba(249, 115, 22, 0));
}

.to-orange-600 {
  --tw-gradient-to: #ea580c;
}

.hover\\:from-orange-600:hover {
  --tw-gradient-from: #ea580c;
  --tw-gradient-stops: var(--tw-gradient-from), var(--tw-gradient-to, rgba(234, 88, 12, 0));
}

.hover\\:to-orange-700:hover {
  --tw-gradient-to: #c2410c;
}

.text-orange-600 {
  color: #ea580c;
}

.focus\\:ring-orange-500:focus {
  --tw-ring-color: #f97316;
}

.focus\\:border-orange-500:focus {
  border-color: #f97316;
}
</style>
