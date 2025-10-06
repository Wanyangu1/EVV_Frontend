<script setup>
import { computed } from 'vue'

const props = defineProps({
  employee: {
    type: Object,
    required: true,
    default: () => ({
      name: '',
      email: '',
      phone: '',
      address: {
        street: '',
        street2: '',
        city: '',
        state: '',
        zip: '',
      },
      employment: {
        manager: '',
        payPeriodStart: '',
        payPeriodEnd: '',
      },
    }),
  },
})

const currentDate = computed(() => {
  const azDate = new Date().toLocaleString('en-US', {
    timeZone: 'America/Phoenix'
  });

  // Convert to Date object and format
  return new Date(azDate).toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
});


const formattedPhone = computed(() => {
  if (!props.employee.phone) return ''
  const cleaned = ('' + props.employee.phone).replace(/\D/g, '')
  const match = cleaned.match(/^(\d{3})(\d{3})(\d{4})$/)
  return match ? `(${match[1]}) ${match[2]}-${match[3]}` : props.employee.phone
})
</script>
<template>
  <div class="relative">
    <!-- Animated background elements -->
    <div class="absolute inset-0 overflow-hidden">
      <div
        class="absolute top-0 right-0 w-64 h-64 bg-blue-100 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-2000">
      </div>
      <div
        class="absolute bottom-0 left-0 w-64 h-64 bg-indigo-100 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-4000">
      </div>
    </div>

    <!-- Update Reminder Banner -->
    <div
      class="relative bg-gradient-to-r from-blue-50 to-indigo-50 rounded-2xl p-6 border border-blue-100 shadow-sm mb-6 animate-pulse">
      <div class="flex flex-col md:flex-row md:items-center gap-5">
        <div class="flex-shrink-0 bg-blue-100 p-3 rounded-full">
          <svg class="h-8 w-8 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
              d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
          </svg>
        </div>
        <div class="flex-1">
          <h3 class="text-lg font-semibold text-gray-800 mb-1">Keep your profile up to date!</h3>
          <p class="text-gray-600">
            Your accurate information helps us serve you better. Please review and update your
            <span class="font-medium text-blue-600">personal details</span> and
            <span class="font-medium text-blue-600">contact information</span>.
          </p>
        </div>
        <div class="flex-shrink-0">
          <router-link to="/settings">
            <button
              class="inline-flex items-center px-4 py-2 bg-[color:#217566] text-white rounded-lg shadow-sm hover:shadow-md transition-all duration-200 transform hover:-translate-y-0.5">
              <svg class="h-5 w-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                  d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
              Confirm Now
            </button>
          </router-link>
        </div>
      </div>
    </div>

    <!-- Employee Profile Section -->
    <div
      class="relative bg-white rounded-2xl overflow-hidden border border-gray-100 shadow-lg transition-all duration-500 hover:shadow-xl">
      <!-- Glassmorphism Header -->
      <div
        class="px-8 py-6 bg-gradient-to-r from-blue-50/80 to-indigo-50/80 border-b border-gray-100/50 backdrop-blur-sm">
        <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
          <div class="animate-fade-in-up">
            <h2
              class="text-2xl font-bold text-gray-800 tracking-tight bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600">
              <span class="inline-flex items-center">
                <svg class="w-8 h-6 mr-3 text-indigo-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                    d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"></path>
                </svg>
                Employee Profile
              </span>
            </h2>
            <p class="text-sm text-gray-500 mt-1 font-medium">Comprehensive professional details</p>
          </div>
          <div class="animate-fade-in-up animation-delay-100">
            <span
              class="inline-flex items-center px-4 py-2 rounded-full text-sm font-medium bg-white/90 text-blue-600 border border-blue-100 shadow-sm backdrop-blur-sm">
              <svg class="h-4 w-4 mr-2 text-blue-500 animate-pulse" fill="none" viewBox="0 0 24 24"
                stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                  d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Last updated: {{ currentDate }}
            </span>
          </div>
        </div>
      </div>

      <!-- Main Content Grid -->
      <div class="px-8 py-8 grid grid-cols-1 lg:grid-cols-2 gap-8">
        <!-- Address Card -->
        <div
          class="bg-white/90 p-7 rounded-xl border border-gray-100 shadow-sm transition-all duration-300 hover:shadow-md hover:border-blue-200 transform hover:scale-[1.005] backdrop-blur-sm animate-fade-in-up animation-delay-150">
          <div class="flex items-start mb-6">
            <div class="bg-gradient-to-br from-blue-100 to-blue-50 p-3 rounded-xl mr-4 shadow-inner">
              <svg class="h-7 w-7 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.8"
                  d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.8"
                  d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </div>
            <div>
              <h3 class="text-xl font-bold text-gray-800 mb-1">Location Details</h3>
              <p class="text-sm text-gray-500 font-medium">Primary residence and mailing address</p>
            </div>
          </div>

          <div class="space-y-5">
            <div class="grid grid-cols-1 sm:grid-cols-4 gap-3 sm:gap-5 items-start group">
              <p class="text-sm font-medium text-gray-500 sm:col-span-1 flex items-center">
                <svg class="w-4 h-4 mr-2 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                    d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"></path>
                </svg>
                Street
              </p>
              <p class="text-sm text-gray-800 sm:col-span-3 font-medium group-hover:text-blue-600 transition-colors">
                {{ employee.address.street || 'Not specified' }}
              </p>
            </div>
            <div class="grid grid-cols-1 sm:grid-cols-4 gap-3 sm:gap-5 items-start group">
              <p class="text-sm font-medium text-gray-500 sm:col-span-1 flex items-center">
                <svg class="w-4 h-4 mr-2 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                    d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4">
                  </path>
                </svg>
                Address 2
              </p>
              <p class="text-sm text-gray-500 sm:col-span-3 italic group-hover:text-blue-500 transition-colors">
                {{ employee.address.street2 || 'None provided' }}
              </p>
            </div>
            <div class="grid grid-cols-1 sm:grid-cols-4 gap-3 sm:gap-5 items-start group">
              <p class="text-sm font-medium text-gray-500 sm:col-span-1 flex items-center">
                <svg class="w-4 h-4 mr-2 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                    d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0zM15 11a3 3 0 11-6 0 3 3 0 016 0z">
                  </path>
                </svg>
                City, State ZIP
              </p>
              <p class="text-sm text-gray-800 sm:col-span-3 font-medium group-hover:text-blue-600 transition-colors">
                <template v-if="employee.address.city && employee.address.state && employee.address.zip">
                  {{ employee.address.city }}, {{ employee.address.state }}
                  {{ employee.address.zip }}
                </template>
                <span v-else class="text-gray-400">Not specified</span>
              </p>
            </div>
          </div>
        </div>

        <!-- Right Column - Stacked Cards -->
        <div class="space-y-6">
          <!-- Personal Information Card -->
          <div
            class="bg-white/90 p-7 rounded-xl border border-gray-100 shadow-sm transition-all duration-300 hover:shadow-md hover:border-indigo-200 transform hover:scale-[1.005] backdrop-blur-sm animate-fade-in-up animation-delay-200">
            <div class="flex items-start mb-6">
              <div class="bg-gradient-to-br from-indigo-100 to-indigo-50 p-3 rounded-xl mr-4 shadow-inner">
                <svg class="h-7 w-7 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.8"
                    d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
              </div>
              <div>
                <h3 class="text-xl font-bold text-gray-800 mb-1">Personal Details</h3>
                <p class="text-sm text-gray-500 font-medium">
                  Contact information and identification
                </p>
              </div>
            </div>

            <div class="space-y-5">
              <div class="grid grid-cols-1 sm:grid-cols-4 gap-3 sm:gap-5 items-start group">
                <p class="text-sm font-medium text-gray-500 sm:col-span-1 flex items-center">
                  <svg class="w-4 h-4 mr-2 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                      d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"></path>
                  </svg>
                  Full Name
                </p>
                <p
                  class="text-sm text-gray-800 sm:col-span-3 font-medium group-hover:text-indigo-600 transition-colors">
                  {{ employee.name || 'Not specified' }}
                </p>
              </div>
              <div class="grid grid-cols-1 sm:grid-cols-4 gap-3 sm:gap-5 items-start group">
                <p class="text-sm font-medium text-gray-500 sm:col-span-1 flex items-center">
                  <svg class="w-4 h-4 mr-2 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                      d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z">
                    </path>
                  </svg>
                  Phone
                </p>
                <p
                  class="text-sm text-gray-800 sm:col-span-3 font-medium group-hover:text-indigo-600 transition-colors">
                  {{ formattedPhone || '-' }}
                </p>
              </div>
              <div class="grid grid-cols-1 sm:grid-cols-4 gap-3 sm:gap-5 items-start group">
                <p class="text-sm font-medium text-gray-500 sm:col-span-1 flex items-center">
                  <svg class="w-4 h-4 mr-2 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                      d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z">
                    </path>
                  </svg>
                  Email
                </p>
                <p
                  class="text-sm text-blue-600 sm:col-span-3 font-medium hover:underline cursor-pointer break-all transition-colors group-hover:text-blue-700">
                  {{ employee.email || '-' }}
                </p>
              </div>
            </div>
          </div>

          <!-- Employment Details Card -->
          <div
            class="bg-white/90 p-7 rounded-xl border border-gray-100 shadow-sm transition-all duration-300 hover:shadow-md hover:border-purple-200 transform hover:scale-[1.005] backdrop-blur-sm animate-fade-in-up animation-delay-250">
            <div class="flex items-start mb-6">
              <div class="bg-gradient-to-br from-purple-100 to-purple-50 p-3 rounded-xl mr-4 shadow-inner">
                <svg class="h-7 w-7 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.8"
                    d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
              </div>
              <div>
                <h3 class="text-xl font-bold text-gray-800 mb-1">Employment Status</h3>
                <p class="text-sm text-gray-500 font-medium">Position and compensation details</p>
              </div>
            </div>

            <div class="space-y-5">
              <div class="grid grid-cols-1 sm:grid-cols-4 gap-3 sm:gap-5 items-start group">
                <p class="text-sm font-medium text-gray-500 sm:col-span-1 flex items-center">
                  <svg class="w-4 h-4 mr-2 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                      d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z">
                    </path>
                  </svg>
                  Manager
                </p>
                <p
                  class="text-sm text-gray-800 sm:col-span-3 font-medium group-hover:text-purple-600 transition-colors">
                  {{ employee.employment.manager || 'Not specified' }}
                </p>
              </div>
              <div class="grid grid-cols-1 sm:grid-cols-4 gap-3 sm:gap-5 items-start group">
                <p class="text-sm font-medium text-gray-500 sm:col-span-1 flex items-center">
                  <svg class="w-4 h-4 mr-2 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                      d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"></path>
                  </svg>
                  Pay Period
                </p>
                <p
                  class="text-sm text-gray-800 sm:col-span-3 font-medium group-hover:text-purple-600 transition-colors">
                  <template v-if="employee.employment.payPeriodStart && employee.employment.payPeriodEnd">
                    {{ employee.employment.payPeriodStart }} –
                    {{ employee.employment.payPeriodEnd }}
                  </template>
                  <span v-else class="text-gray-400">Not available</span>
                </p>
              </div>
              <div class="grid grid-cols-1 sm:grid-cols-4 gap-3 sm:gap-5 items-start group">
                <p class="text-sm font-medium text-gray-500 sm:col-span-1 flex items-center">
                  <svg class="w-4 h-4 mr-2 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                      d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                  </svg>
                  Status
                </p>
                <p class="text-sm sm:col-span-3">
                  <span
                    class="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold bg-gradient-to-r from-green-100 to-green-50 text-green-800 border border-green-200 shadow-inner group-hover:from-green-200 group-hover:to-green-100 transition-colors">
                    <span class="w-2 h-2 mr-2 bg-green-500 rounded-full animate-pulse"></span>
                    Active
                  </span>
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
@keyframes fadeInUp {
  from {
    opacity: 0;
    transform: translateY(20px);
  }

  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes blob {
  0% {
    transform: translate(0px, 0px) scale(1);
  }

  33% {
    transform: translate(30px, -50px) scale(1.1);
  }

  66% {
    transform: translate(-20px, 20px) scale(0.9);
  }

  100% {
    transform: translate(0px, 0px) scale(1);
  }
}

.animate-fade-in-up {
  animation: fadeInUp 0.6s ease-out forwards;
}

.animate-blob {
  animation: blob 7s infinite ease-in-out;
}

.animation-delay-100 {
  animation-delay: 100ms;
}

.animation-delay-150 {
  animation-delay: 150ms;
}

.animation-delay-200 {
  animation-delay: 200ms;
}

.animation-delay-250 {
  animation-delay: 250ms;
}

.backdrop-blur-sm {
  backdrop-filter: blur(4px);
}
</style>
