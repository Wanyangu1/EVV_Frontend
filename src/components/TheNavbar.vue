<script setup>
import { ref, onMounted, onBeforeUnmount } from 'vue'
import axiosInstance from '@/axiosconfig/axiosInstance'
import useLogout from '@/composables/useLogout'

const { logout } = useLogout()
const isMobileMenuOpen = ref(false)
const user = ref(null)
const dropdownOpen = ref(false)
const dropdownRef = ref(null)
const notificationsOpen = ref(false)
const notificationsRef = ref(null)

const fetchUserProfile = async () => {
  try {
    const response = await axiosInstance.get('/api/profile')
    user.value = response.data
  } catch (error) {
    console.error('User profile not found:', error)
  }
}

onMounted(() => {
  fetchUserProfile()
})

const toggleDropdown = () => {
  dropdownOpen.value = !dropdownOpen.value
}

const toggleNotifications = () => {
  notificationsOpen.value = !notificationsOpen.value
}

const handleClickOutside = (e) => {
  if (dropdownRef.value && !dropdownRef.value.contains(e.target)) {
    dropdownOpen.value = false
  }
  if (notificationsRef.value && !notificationsRef.value.contains(e.target)) {
    notificationsOpen.value = false
  }
}

onMounted(() => {
  document.addEventListener('click', handleClickOutside)
})

onBeforeUnmount(() => {
  document.removeEventListener('click', handleClickOutside)
})
</script>

<template>
  <header class="fixed w-full z-50 bg-navy-blue border-sky-blue/20 shadow-sm">
    <!-- Main Navigation -->
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div class="flex justify-between items-center h-17">
        <!-- Logo and Mobile Menu Button (left side) -->
        <div class="flex items-center w-full lg:w-auto">
          <!-- Logo -->
          <router-link to="/home">
            <!-- Background wrapper around logo -->
            <div class="bg-black/20 rounded-md p-1 flex items-center justify-center shadow-lg shadow-sky-blue/20">
              <img src="@/assets/logos/logo.jpg" class="h-8 w-10 object-contain" alt="DivineAngelCare Logo" />
              <h3 class="text-blue-400 font-bold">Brightpath EVV</h3>
            </div>
          </router-link>
        </div>

        <!-- User Controls (right side) -->
        <div class="flex items-center space-x-4">
          <!-- Notifications -->
          <div class="relative" ref="notificationsRef">
            <button @click="toggleNotifications"
              class="text-sky-blue p-2 rounded-full hover:bg-sky-blue/10 focus:outline-none transition-all duration-300 group relative">
              <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24"
                stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                  d="M15 17h5l-5 5v-5zM10.5 3.75a6 6 0 0 0-6 6v2.25l-2.47 2.47a.75.75 0 0 0 .53 1.28h15.88a.75.75 0 0 0 .53-1.28L16.5 12V9.75a6 6 0 0 0-6-6z" />
              </svg>
              <span
                class="absolute -top-1 -right-1 bg-orange h-5 w-5 rounded-full flex items-center justify-center text-xs text-white font-bold shadow-md">
                3
              </span>
            </button>

            <!-- Notifications Dropdown -->
            <transition enter-active-class="transition duration-200 ease-out"
              enter-from-class="transform scale-95 opacity-0" enter-to-class="transform scale-100 opacity-100"
              leave-active-class="transition duration-150 ease-in" leave-from-class="transform scale-100 opacity-100"
              leave-to-class="transform scale-95 opacity-0">
              <div v-if="notificationsOpen"
                class="origin-top-right absolute right-0 mt-2 w-80 rounded-xl shadow-xl bg-white border border-sky-blue/20 py-1 z-50 overflow-hidden">
                <div class="px-4 py-3 border-b border-sky-blue/10 bg-sky-blue/5">
                  <p class="text-sm font-semibold text-navy-blue">Notifications</p>
                </div>
                <div class="px-4 py-2 border-t border-sky-blue/10 bg-sky-blue/5">
                  <button
                    class="w-full text-center text-sm text-sky-blue font-medium hover:text-navy-blue transition-colors">
                    No Notifications
                  </button>
                </div>
              </div>
            </transition>
          </div>

          <template v-if="user">
            <div class="relative" ref="dropdownRef">
              <button @click="toggleDropdown"
                class="flex items-center text-sm rounded-full focus:outline-none group relative overflow-hidden">
                <div
                  class="absolute inset-0 bg-gradient-to-r from-sky-blue to-orange opacity-0 group-hover:opacity-10 transition-opacity duration-500 rounded-full">
                </div>
                <div
                  class="h-9 w-9 rounded-full bg-gradient-to-br from-sky-blue to-navy-blue flex items-center justify-center text-white font-bold shadow-lg shadow-sky-blue/20">
                  {{ user.name.charAt(0).toUpperCase() }}
                </div>
                <div
                  class="hidden lg:flex items-center border border-blue-300 rounded-full px-3 py-1 ml-2 transition-all duration-300 group-hover:border-sky-blue">
                  <span class="text-white font-medium">{{ user.name.split(' ')[0] }}</span>
                  <svg :class="[
                    'ml-1 h-4 w-4 text-orange transition-transform duration-200 group-hover:text-sky-blue',
                    dropdownOpen ? 'rotate-180' : '',
                  ]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
                  </svg>
                </div>
              </button>

              <!-- Dropdown menu -->
              <transition enter-active-class="transition duration-200 ease-out"
                enter-from-class="transform scale-95 opacity-0" enter-to-class="transform scale-100 opacity-100"
                leave-active-class="transition duration-150 ease-in" leave-from-class="transform scale-100 opacity-100"
                leave-to-class="transform scale-95 opacity-0">
                <div v-if="dropdownOpen"
                  class="origin-top-right absolute right-0 mt-2 w-56 rounded-xl shadow-xl bg-white border border-sky-blue/20 py-1 z-50 overflow-hidden">
                  <div class="absolute inset-0 bg-gradient-to-br from-sky-blue/5 to-orange/5 pointer-events-none">
                  </div>
                  <div class="relative">
                    <div class="px-4 py-3 border-b border-sky-blue/10">
                      <p class="text-sm font-medium text-navy-blue">{{ user.name }}</p>
                      <p class="text-xs font-medium text-sky-blue truncate">{{ user.email }}</p>
                    </div>

                    <router-link to="/profile"
                      class="flex items-center px-4 py-3 text-sm text-gray-700 hover:bg-sky-blue/10 transition-colors group">
                      <div class="relative z-10 flex items-center">
                        <svg xmlns="http://www.w3.org/2000/svg"
                          class="h-5 w-5 mr-3 text-sky-blue group-hover:text-navy-blue transition-colors" fill="none"
                          viewBox="0 0 24 24" stroke="currentColor">
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                            d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                        </svg>
                        <span>Profile</span>
                      </div>
                    </router-link>

                    <router-link to="/settings"
                      class="flex items-center px-4 py-3 text-sm text-gray-700 hover:bg-sky-blue/10 transition-colors group">
                      <div class="relative z-10 flex items-center">
                        <svg xmlns="http://www.w3.org/2000/svg"
                          class="h-5 w-5 mr-3 text-sky-blue group-hover:text-navy-blue transition-colors" fill="none"
                          viewBox="0 0 24 24" stroke="currentColor">
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                            d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                            d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                        <span>Settings</span>
                      </div>
                    </router-link>

                    <router-link to="/Change-Password"
                      class="flex items-center px-4 py-3 text-sm text-gray-700 hover:bg-sky-blue/10 transition-colors group">
                      <div class="relative z-10 flex items-center">
                        <svg xmlns="http://www.w3.org/2000/svg"
                          class="h-5 w-5 mr-3 text-sky-blue group-hover:text-navy-blue transition-colors" fill="none"
                          viewBox="0 0 24 24" stroke="currentColor">
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                            d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                        </svg>
                        <span>Change Password</span>
                      </div>
                    </router-link>

                    <div class="border-t border-sky-blue/10 my-1"></div>

                    <button @click="logout"
                      class="flex items-center w-full text-left px-4 py-3 text-sm text-orange hover:bg-orange/10 transition-colors group">
                      <div class="relative z-10 flex items-center">
                        <svg xmlns="http://www.w3.org/2000/svg"
                          class="h-5 w-5 mr-3 group-hover:text-orange/80 transition-colors" fill="none"
                          viewBox="0 0 24 24" stroke="currentColor">
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                            d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                        </svg>
                        <span>Logout</span>
                      </div>
                    </button>
                  </div>
                </div>
              </transition>
            </div>
          </template>
          <template v-else>
            <router-link to="/"
              class="px-4 py-2 rounded-lg border border-sky-blue/30 text-sky-blue hover:bg-sky-blue/10 hover:text-white transition-all duration-300 text-sm font-medium hidden sm:block shadow-sm hover:shadow-sky-blue/10">
              Login
            </router-link>
            <router-link to="/signup"
              class="px-4 py-2 rounded-lg bg-gradient-to-r from-sky-blue to-orange text-white hover:from-sky-blue/90 hover:to-orange/90 transition-all duration-300 text-sm font-bold hidden sm:block shadow-lg hover:shadow-orange/20">
              Sign Up
            </router-link>
          </template>
        </div>
      </div>
    </div>

    <!-- Mobile Menu -->
    <transition enter-active-class="transition duration-300 ease-out"
      enter-from-class="transform -translate-y-4 opacity-0" enter-to-class="transform translate-y-0 opacity-100"
      leave-active-class="transition duration-200 ease-in" leave-from-class="transform translate-y-0 opacity-100"
      leave-to-class="transform -translate-y-4 opacity-0">
      <div v-if="isMobileMenuOpen" class="lg:hidden bg-navy-blue border-t border-sky-blue/20">

        <div class="pt-4 pb-3 border-t border-sky-blue/20">
          <template v-if="user">
            <div class="flex items-center px-5">
              <div
                class="flex-shrink-0 h-12 w-12 rounded-full bg-gradient-to-br from-sky-blue to-navy-blue flex items-center justify-center text-white font-bold shadow-lg shadow-sky-blue/20">
                {{ user.name.charAt(0).toUpperCase() }}
              </div>
              <div class="ml-3">
                <div class="text-base font-medium text-white">{{ user.name }}</div>
                <div class="text-sm font-medium text-sky-blue">{{ user.email }}</div>
              </div>
            </div>
            <div class="mt-3 px-2 space-y-1">
              <router-link to="/profile"
                class="block px-4 py-3 rounded-lg text-base font-medium text-white hover:bg-sky-blue/10 transition-colors duration-300">
                Profile
              </router-link>
              <router-link to="/settings"
                class="block px-4 py-3 rounded-lg text-base font-medium text-white hover:bg-sky-blue/10 transition-colors duration-300">
                Settings
              </router-link>
              <router-link to="/Change-Password"
                class="block px-4 py-3 rounded-lg text-base font-medium text-white hover:bg-sky-blue/10 transition-colors duration-300">
                Change Password
              </router-link>
              <button @click="logout"
                class="block w-full text-left px-4 py-3 rounded-lg text-base font-medium text-orange hover:bg-orange/10 transition-colors duration-300">
                Logout
              </button>
            </div>
          </template>
          <template v-else>
            <div class="px-2 space-y-3">
              <router-link to="/login"
                class="block w-full text-center px-4 py-3 border border-sky-blue/30 rounded-lg shadow-sm text-base font-medium text-sky-blue bg-transparent hover:bg-sky-blue/10 transition-colors duration-300">
                Login
              </router-link>
              <router-link to="/signup"
                class="block w-full text-center px-4 py-3 rounded-lg shadow-lg text-base font-bold text-white bg-gradient-to-r from-sky-blue to-orange hover:from-sky-blue/90 hover:to-orange/90 transition-all duration-300">
                Sign Up
              </router-link>
            </div>
          </template>
        </div>
      </div>
    </transition>
  </header>

  <!-- Spacer for fixed header -->
  <div class="h-20"></div>
</template>

<style scoped>
/* Custom color definitions */
.bg-navy-blue {
  background-color: #1e3a5f;
}

.bg-sky-blue {
  background-color: #87ceeb;
}

.text-sky-blue {
  color: #87ceeb;
}

.bg-orange {
  background-color: #ff7f50;
}

.text-orange {
  color: #ff7f50;
}

.border-sky-blue {
  border-color: #87ceeb;
}
</style>
