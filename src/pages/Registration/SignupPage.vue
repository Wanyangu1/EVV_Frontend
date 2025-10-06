<script setup>
import useAuth from '@/composables/useAuth'
import TheNavbar from '@/components/TheNavbar.vue'
import TheFooter from '@/components/TheFooter.vue'

const { name, email, password, signup, authError } = useAuth()
</script>

<template>
  <TheNavbar />
  <div class="min-h-screen bg-gradient-to-br from-[#f0f9ff] to-[#e0f2fe]">
    <main class="flex flex-col lg:flex-row min-h-[calc(100vh-80px)] w-full">
      <!-- Healthcare Hero Section - Left Half -->
      <div
        class="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-[#0369a1] to-[#0ea5e9] text-white relative overflow-hidden">
        <div
          class="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1579684385127-1ef15d508118?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2070&q=80')] bg-cover bg-center opacity-20">
        </div>
        <div class="relative z-10 flex flex-col justify-center p-12 w-full h-full">
          <div class="max-w-md mx-auto">
            <div class="flex items-center mb-8">
              <div class="bg-white/20 p-2 rounded-lg backdrop-blur-sm">
                <img src="@/assets/logos/logo.jpg" class="h-10" alt="City Radius CHS" />
              </div>
              <h2
                class="ml-3 text-2xl font-semibold bg-clip-text text-transparent bg-gradient-to-r from-white to-blue-100">
                Create New Employee Account
              </h2>
            </div>

            <h1 class="text-4xl font-bold mb-6 leading-tight">Serving Our Community Together</h1>
            <p class="text-lg text-blue-100 mb-10">
              Your dedication to community health makes a difference every day. This portal helps
              you focus on what matters most.
            </p>

            <div class="space-y-6">
              <div
                class="flex items-start bg-white/10 backdrop-blur-sm p-5 rounded-xl border border-white/20 hover:border-white/30 transition-all">
                <div class="bg-white/20 p-3 rounded-full mr-4 flex-shrink-0">
                  <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24"
                    stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                      d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
                  </svg>
                </div>
                <div>
                  <h3 class="font-bold text-lg mb-1">Community Impact</h3>
                  <p class="text-blue-100">
                    Track your hours contributing to vital health services
                  </p>
                </div>
              </div>

              <div
                class="flex items-start bg-white/10 backdrop-blur-sm p-5 rounded-xl border border-white/20 hover:border-white/30 transition-all">
                <div class="bg-white/20 p-3 rounded-full mr-4 flex-shrink-0">
                  <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24"
                    stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                      d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                  </svg>
                </div>
                <div>
                  <h3 class="font-bold text-lg mb-1">HIPAA Secure</h3>
                  <p class="text-blue-100">
                    Patient privacy protected with enterprise-grade security
                  </p>
                </div>
              </div>

              <div
                class="flex items-start bg-white/10 backdrop-blur-sm p-5 rounded-xl border border-white/20 hover:border-white/30 transition-all">
                <div class="bg-white/20 p-3 rounded-full mr-4 flex-shrink-0">
                  <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24"
                    stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                      d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                </div>
                <div>
                  <h3 class="font-bold text-lg mb-1">Team Coordination</h3>
                  <p class="text-blue-100">Ensuring proper staffing for community health needs</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Signup Form Section -->
      <div class="w-full lg:w-1/2 flex items-center justify-center p-6 lg:8">
        <div
          class="w-full max-w-md bg-white rounded-2xl shadow-xl p-8 md:p-10 border border-gray-100 hover:shadow-2xl transition-shadow duration-300">
          <div class="flex flex-col items-center mb-8">
            <div class="mb-4 p-3 bg-blue-50 rounded-full">
              <img src="@/assets/logos/logo1.png" class="h-12" alt="City Radius CHS" />
            </div>
            <h2 class="text-3xl font-bold text-gray-800 text-center">Onboard A New Employee</h2>
            <p class="text-gray-600 mt-2 text-center">
              Register to access the employee portal for City Radius Community Health Services
            </p>
          </div>

          <form @submit.prevent="signup" class="space-y-6">
            <div class="space-y-5">
              <div>
                <label for="name" class="block text-sm font-medium text-gray-700 mb-2">Full Name</label>
                <div class="relative">
                  <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 text-gray-400" fill="none"
                      viewBox="0 0 24 24" stroke="currentColor">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                        d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                  </div>
                  <input v-model="name" type="text" id="name" placeholder="Enter your full name"
                    class="pl-10 block w-full border border-gray-200 rounded-lg py-3 px-4 focus:outline-none focus:ring-2 focus:ring-[#0369a1]/50 focus:border-[#0369a1] transition-all duration-200 hover:border-gray-300" />
                </div>
              </div>

              <div>
                <label for="email" class="block text-sm font-medium text-gray-700 mb-2">Work Email</label>
                <div class="relative">
                  <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 text-gray-400" fill="none"
                      viewBox="0 0 24 24" stroke="currentColor">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                        d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                  </div>
                  <input v-model="email" type="email" id="email" placeholder="your.name@cityradiuschs.org"
                    class="pl-10 block w-full border border-gray-200 rounded-lg py-3 px-4 focus:outline-none focus:ring-2 focus:ring-[#0369a1]/50 focus:border-[#0369a1] transition-all duration-200 hover:border-gray-300" />
                </div>
              </div>

              <div>
                <label for="password" class="block text-sm font-medium text-gray-700 mb-2">Password</label>
                <div class="relative">
                  <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 text-gray-400" fill="none"
                      viewBox="0 0 24 24" stroke="currentColor">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                        d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                    </svg>
                  </div>
                  <input v-model="password" type="password" id="password" placeholder="Create a secure password"
                    class="pl-10 block w-full border border-gray-200 rounded-lg py-3 px-4 focus:outline-none focus:ring-2 focus:ring-[#0369a1]/50 focus:border-[#0369a1] transition-all duration-200 hover:border-gray-300" />
                </div>
                <div class="mt-2 flex items-center text-xs text-gray-500">
                  <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24"
                    stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                      d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span>Minimum 12 characters with uppercase, number, and special character</span>
                </div>
              </div>
            </div>

            <!-- Error Message -->
            <div v-if="authError"
              class="p-4 rounded-lg bg-red-50 border border-red-200 text-red-700 flex items-start animate-fade-in">
              <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 mr-2 mt-0.5 flex-shrink-0" fill="none"
                viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                  d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span>{{ authError }}</span>
            </div>

            <div class="flex items-start">
              <div class="flex items-center h-5">
                <input id="terms" name="terms" type="checkbox" required
                  class="h-4 w-4 text-[#0369a1] focus:ring-[#0369a1] border-gray-300 rounded" />
              </div>
              <div class="ml-3 text-sm">
                <label for="terms" class="text-gray-700">
                  As an ADMIN, I agree to the
                  <a href="#" class="text-[#0369a1] hover:underline font-medium">terms of service</a>
                  and
                  <a href="#" class="text-[#0369a1] hover:underline font-medium">privacy policy</a>
                </label>
              </div>
            </div>

            <button type="submit"
              class="w-full bg-gradient-to-r from-[#0369a1] to-[#0284c7] text-white py-3 px-6 rounded-lg hover:opacity-90 transition-opacity duration-200 shadow-md flex items-center justify-center group">
              <span class="group-hover:translate-x-1 transition-transform duration-200">
                <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24"
                  stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                    d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
                </svg>
              </span>
              <span class="font-medium">Create Healthcare Account</span>
            </button>

            <div class="text-center text-sm text-gray-600 pt-2 border-t border-gray-100">
              Already serving with us?
              <router-link to="/" class="text-[#0369a1] font-medium hover:underline ml-1">Sign in to your
                account</router-link>
            </div>
          </form>
        </div>
      </div>
    </main>
  </div>
  <TheFooter />
</template>

<style>
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap');

body {
  font-family:
    'Inter',
    -apple-system,
    BlinkMacSystemFont,
    sans-serif;
}

::-webkit-scrollbar {
  width: 8px;
  height: 8px;
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

.animate-fade-in {
  animation: fadeIn 0.3s ease-out forwards;
}

/* Card hover effect */
.shadow-xl {
  transition:
    transform 0.2s ease-out,
    box-shadow 0.2s ease-out;
}

.shadow-xl:hover {
  transform: translateY(-2px);
  box-shadow:
    0 20px 25px -5px rgba(0, 0, 0, 0.1),
    0 10px 10px -5px rgba(0, 0, 0, 0.04);
}
</style>
