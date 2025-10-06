<script setup>
import { ref, onMounted, onBeforeUnmount } from 'vue'
import axiosInstance from '@/axiosconfig/axiosInstance'
import useLogout from '@/composables/useLogout'

const { logout } = useLogout()
const isMobileMenuOpen = ref(false)
const user = ref(null)
const dropdownOpen = ref(false)
const dropdownRef = ref(null)
const hoveredItem = ref(null)

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

const handleClickOutside = (e) => {
  if (dropdownRef.value && !dropdownRef.value.contains(e.target)) {
    dropdownOpen.value = false
  }
}

onMounted(() => {
  document.addEventListener('click', handleClickOutside)
})

onBeforeUnmount(() => {
  document.removeEventListener('click', handleClickOutside)
})

const setHoveredItem = (item) => {
  hoveredItem.value = item
}

const clearHoveredItem = () => {
  hoveredItem.value = null
}
</script>

<template>
  <header class="fixed w-full z-50 bg-[color:#217566] border-teal-400/20 shadow-2xl shadow-teal-400/10">
    <!-- Main Navigation -->
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div class="flex justify-between items-center h-20">
        <!-- Logo and Mobile Menu Button (left side) -->
        <div class="flex items-center w-full lg:w-auto">
          <!-- Logo -->
          <router-link to="/home"
            class="text-white px-3 py-1 rounded-md flex-shrink-0 flex items-center ml-0 lg:ml-2 group relative">
            <!-- Background wrapper around logo -->
            <div class="bg-white/90 rounded-md p-1 flex items-center justify-center shadow-lg shadow-teal-400/20">
              <img src="@/assets/logos/logo1.png" class="h-10 w-auto object-contain" alt="App Logo" />
            </div>
          </router-link>
        </div>

        <!-- Mobile menu button -->
        <button @click="isMobileMenuOpen = !isMobileMenuOpen"
          class="lg:hidden text-teal-400 p-2 rounded-md hover:bg-teal-400/10 focus:outline-none transition-all duration-300 group">
          <div class="space-y-1.5">
            <span :class="[
              'block h-0.5 w-6 bg-teal-400 transition-all duration-300',
              isMobileMenuOpen ? 'rotate-45 translate-y-2' : ''
            ]"></span>
            <span :class="[
              'block h-0.5 w-6 bg-teal-400 transition-all duration-300',
              isMobileMenuOpen ? 'opacity-0' : 'opacity-100'
            ]"></span>
            <span :class="[
              'block h-0.5 w-6 bg-teal-400 transition-all duration-300',
              isMobileMenuOpen ? '-rotate-45 -translate-y-2' : ''
            ]"></span>
          </div>
        </button>

        <nav class="hidden lg:flex lg:items-center lg:justify-center lg:space-x-1 lg:flex-1">
          <div
            class="absolute h-10 rounded-full bg-teal-400/10 pointer-events-none transition-all duration-500 ease-out"
            :style="{
              width: hoveredItem ? '100px' : '0px',
              opacity: hoveredItem ? '1' : '0',
              transform: hoveredItem ? `translateX(${hoveredItem.position}px)` : 'translateX(0)'
            }"></div>

          <!-- Main Links -->
          <router-link to="/home" @mouseenter="setHoveredItem({ id: 'home', position: 0 })"
            @mouseleave="clearHoveredItem"
            class="relative text-white px-5 py-2 text-sm font-medium flex items-center transition-all duration-300 group">

            <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 mr-2 group-hover:text-teal-300 transition-colors"
              fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
            <span class="relative z-10">Dashboard</span>
            <div
              class="absolute bottom-0 left-0 right-0 h-0.5 bg-teal-400 scale-x-0 group-hover:scale-x-100 transition-transform origin-left duration-500">
            </div>
          </router-link>
          <router-link to="/members" @mouseenter="setHoveredItem({ id: 'home', position: 0 })"
            @mouseleave="clearHoveredItem"
            class="relative text-white px-5 py-2 text-sm font-medium flex items-center transition-all duration-300 group">

            <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 mr-2 group-hover:text-teal-300 transition-colors"
              fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
            <span class="relative z-10">Member</span>
            <div
              class="absolute bottom-0 left-0 right-0 h-0.5 bg-teal-400 scale-x-0 group-hover:scale-x-100 transition-transform origin-left duration-500">
            </div>
          </router-link>
          <router-link to="/client" @mouseenter="setHoveredItem({ id: 'history', position: 140 })"
            @mouseleave="clearHoveredItem"
            class="relative text-white px-5 py-2 text-sm font-medium flex items-center transition-all duration-300 group hover:bg-gray-800/50">

            <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 mr-2 group-hover:text-teal-300 transition-colors"
              fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>

            <span class="relative z-10">Client</span>

            <!-- Chevron Down Icon -->
            <svg xmlns="http://www.w3.org/2000/svg"
              class="h-4 w-4 ml-1 text-teal-200 group-hover:text-teal-300 transition-colors" fill="none"
              viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
            </svg>

            <div
              class="absolute bottom-0 left-0 right-0 h-0.5 bg-teal-400 scale-x-0 group-hover:scale-x-100 transition-transform origin-left duration-500">
            </div>

            <!-- Dropdown Menu -->
            <div
              class="absolute top-full left-0 w-56 bg-gray-800 shadow-lg rounded-b-md overflow-hidden opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-300 transform translate-y-1 z-50">
              <router-link to="/client"
                class="flex items-center px-4 py-3 text-sm text-gray-300 hover:bg-gray-700 group/item transition-colors">
                <svg xmlns="http://www.w3.org/2000/svg"
                  class="h-5 w-5 mr-3 text-teal-400 group-hover/item:text-teal-300 transition-colors" fill="none"
                  viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                    d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                </svg>
                <span class="group-hover/item:text-teal-300 transition-colors">Client List</span>
              </router-link>
            </div>
          </router-link>

          <router-link to="/provider" @mouseenter="setHoveredItem({ id: 'hours', position: 260 })"
            @mouseleave="clearHoveredItem"
            class="relative text-white px-5 py-2 text-sm font-medium flex items-center transition-all duration-300 group hover:bg-gray-800/50">

            <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 mr-2 group-hover:text-teal-300 transition-colors"
              fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>

            <span class="relative z-10">Provider</span>

            <svg xmlns="http://www.w3.org/2000/svg"
              class="h-4 w-4 ml-1 text-teal-200 group-hover:text-teal-300 transition-colors" fill="none"
              viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
            </svg>

            <div
              class="absolute bottom-0 left-0 right-0 h-0.5 bg-teal-400 scale-x-0 group-hover:scale-x-100 transition-transform origin-left duration-500">
            </div>

            <!-- Dropdown Menu -->
            <div
              class="absolute top-full left-0 w-56 bg-gray-800 shadow-lg rounded-b-md overflow-hidden opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-300 transform translate-y-1 z-50">
              <!-- Daily Attendance Log -->
              <router-link to="/attendance-log"
                class="flex items-center px-4 py-3 text-sm text-gray-300 hover:bg-gray-700 group/item transition-colors">
                <svg xmlns="http://www.w3.org/2000/svg"
                  class="h-5 w-5 mr-3 text-teal-400 group-hover/item:text-teal-300 transition-colors" fill="none"
                  viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                    d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
                <span class="group-hover/item:text-teal-300 transition-colors">Daily Attendance Log</span>
              </router-link>

              <!-- Provider List -->
              <router-link to="/provider"
                class="flex items-center px-4 py-3 text-sm text-gray-300 hover:bg-gray-700 group/item transition-colors">
                <svg xmlns="http://www.w3.org/2000/svg"
                  class="h-5 w-5 mr-3 text-teal-400 group-hover/item:text-teal-300 transition-colors" fill="none"
                  viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                    d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
                <span class="group-hover/item:text-teal-300 transition-colors">Provider List</span>
              </router-link>

              <!-- Provider Timesheet -->
              <router-link to="/timesheet"
                class="flex items-center px-4 py-3 text-sm text-gray-300 hover:bg-gray-700 group/item transition-colors">
                <svg xmlns="http://www.w3.org/2000/svg"
                  class="h-5 w-5 mr-3 text-teal-400 group-hover/item:text-teal-300 transition-colors" fill="none"
                  viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                    d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
                </svg>
                <span class="group-hover/item:text-teal-300 transition-colors">Provider Timesheet</span>
              </router-link>
            </div>
          </router-link>
        </nav>

        <!-- User Controls (right side) -->
        <div class="flex items-center space-x-4">
          <template v-if="user">
            <div class="relative" ref="dropdownRef">
              <button @click="toggleDropdown"
                class="flex items-center text-sm rounded-full focus:outline-none group relative overflow-hidden">
                <div
                  class="absolute inset-0 bg-gradient-to-r from-teal-400 to-emerald-500 opacity-0 group-hover:opacity-10 transition-opacity duration-500 rounded-full">
                </div>
                <div
                  class="h-9 w-9 rounded-full bg-gradient-to-br from-teal-400 to-emerald-600 flex items-center justify-center text-white font-bold shadow-lg shadow-teal-400/20">
                  {{ user.name.charAt(0).toUpperCase() }}
                </div>
                <div
                  class="hidden lg:flex items-center border border-[#fba142] rounded-full px-3 py-1 ml-2 transition-all duration-300 group-hover:border-teal-300">
                  <span class="text-teal-100 font-medium">{{ user.name.split(' ')[0] }}</span>
                  <svg :class="[
                    'ml-1 h-4 w-4 text-[#fba142] transition-transform duration-200 group-hover:text-teal-300',
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
                  class="origin-top-right absolute right-0 mt-2 w-56 rounded-xl shadow-xl bg-gray-800 border border-teal-400/20 py-1 z-50 overflow-hidden">
                  <div class="absolute inset-0 bg-gradient-to-br from-teal-400/5 to-emerald-500/5 pointer-events-none">
                  </div>
                  <div class="relative">
                    <div class="px-4 py-3 border-b border-teal-400/10">
                      <p class="text-sm font-medium text-white">{{ user.name }}</p>
                      <p class="text-xs font-medium text-teal-300 truncate">{{ user.email }}</p>
                    </div>

                    <router-link to="/profile"
                      class="flex items-center px-4 py-3 text-sm text-teal-100 hover:bg-teal-400/10 transition-colors group">
                      <div class="relative z-10 flex items-center">
                        <svg xmlns="http://www.w3.org/2000/svg"
                          class="h-5 w-5 mr-3 text-teal-400 group-hover:text-teal-300 transition-colors" fill="none"
                          viewBox="0 0 24 24" stroke="currentColor">
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                            d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                        </svg>
                        <span>Profile</span>
                      </div>
                    </router-link>

                    <router-link to="/settings"
                      class="flex items-center px-4 py-3 text-sm text-teal-100 hover:bg-teal-400/10 transition-colors group">
                      <div class="relative z-10 flex items-center">
                        <svg xmlns="http://www.w3.org/2000/svg"
                          class="h-5 w-5 mr-3 text-teal-400 group-hover:text-teal-300 transition-colors" fill="none"
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
                      class="flex items-center px-4 py-3 text-sm text-teal-100 hover:bg-teal-400/10 transition-colors group">
                      <div class="relative z-10 flex items-center">
                        <svg xmlns="http://www.w3.org/2000/svg"
                          class="h-5 w-5 mr-3 text-teal-400 group-hover:text-teal-300 transition-colors" fill="none"
                          viewBox="0 0 24 24" stroke="currentColor">
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                            d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                        </svg>
                        <span>Change Password</span>
                      </div>
                    </router-link>

                    <div class="border-t border-teal-400/10 my-1"></div>

                    <button @click="logout"
                      class="flex items-center w-full text-left px-4 py-3 text-sm text-rose-400 hover:bg-rose-400/10 transition-colors group">
                      <div class="relative z-10 flex items-center">
                        <svg xmlns="http://www.w3.org/2000/svg"
                          class="h-5 w-5 mr-3 group-hover:text-rose-300 transition-colors" fill="none"
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
              class="px-4 py-2 rounded-lg border border-teal-400/30 text-teal-300 hover:bg-teal-400/10 hover:text-white transition-all duration-300 text-sm font-medium hidden sm:block shadow-sm hover:shadow-teal-400/10">
              Login
            </router-link>
            <router-link to="/signup"
              class="px-4 py-2 rounded-lg bg-gradient-to-r from-teal-400 to-emerald-500 text-gray-900 hover:from-teal-300 hover:to-emerald-400 transition-all duration-300 text-sm font-bold hidden sm:block shadow-lg hover:shadow-teal-400/20">
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
      <div v-if="isMobileMenuOpen" class="lg:hidden bg-gray-900 border-t border-teal-400/20">
        <div class="px-2 pt-2 pb-3 space-y-1">
          <!-- Dashboard Link -->
          <router-link to="/home"
            class="text-teal-100 hover:bg-teal-400/10 px-4 py-3 rounded-lg text-base font-medium flex items-center transition-colors duration-300"
            active-class="text-white bg-teal-400/20">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 mr-3" fill="none" viewBox="0 0 24 24"
              stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
            <span>Dashboard</span>
          </router-link>

          <!-- Members Link -->
          <router-link to="/members"
            class="text-teal-100 hover:bg-teal-400/10 px-4 py-3 rounded-lg text-base font-medium flex items-center transition-colors duration-300"
            active-class="text-white bg-teal-400/20">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 mr-3" fill="none" viewBox="0 0 24 24"
              stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
            <span>Members</span>
          </router-link>

          <!-- Client Link -->
          <router-link to="/client"
            class="text-teal-100 hover:bg-teal-400/10 px-4 py-3 rounded-lg text-base font-medium flex items-center transition-colors duration-300"
            active-class="text-white bg-teal-400/20">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 mr-3" fill="none" viewBox="0 0 24 24"
              stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
            </svg>
            <span>Client</span>
          </router-link>

          <!-- Provider Link -->
          <div class="relative">
            <router-link to="/provider"
              class="text-teal-100 hover:bg-teal-400/10 px-4 py-3 rounded-lg text-base font-medium flex items-center justify-between transition-colors duration-300"
              active-class="text-white bg-teal-400/20">
              <div class="flex items-center">
                <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 mr-3" fill="none" viewBox="0 0 24 24"
                  stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                    d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span>Provider</span>
              </div>
              <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 text-teal-200" fill="none" viewBox="0 0 24 24"
                stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
              </svg>
            </router-link>

            <!-- Provider Submenu -->
            <div class="pl-4">
              <router-link to="/attendance-log"
                class="block text-teal-100 hover:bg-teal-400/10 px-4 py-2 rounded-lg text-sm font-medium transition-colors duration-300"
                active-class="text-white bg-teal-400/20">
                Daily Attendance Log
              </router-link>
              <router-link to="/provider"
                class="block text-teal-100 hover:bg-teal-400/10 px-4 py-2 rounded-lg text-sm font-medium transition-colors duration-300"
                active-class="text-white bg-teal-400/20">
                Provider List
              </router-link>
              <router-link to="/timesheet"
                class="block text-teal-100 hover:bg-teal-400/10 px-4 py-2 rounded-lg text-sm font-medium transition-colors duration-300"
                active-class="text-white bg-teal-400/20">
                Provider Timesheet
              </router-link>
            </div>
          </div>
        </div>

        <div class="pt-4 pb-3 border-t border-teal-400/20">
          <template v-if="user">
            <div class="flex items-center px-5">
              <div
                class="flex-shrink-0 h-12 w-12 rounded-full bg-gradient-to-br from-teal-400 to-emerald-600 flex items-center justify-center text-white font-bold shadow-lg shadow-teal-400/20">
                {{ user.name.charAt(0).toUpperCase() }}
              </div>
              <div class="ml-3">
                <div class="text-base font-medium text-white">{{ user.name }}</div>
                <div class="text-sm font-medium text-teal-300">{{ user.email }}</div>
              </div>
            </div>
            <div class="mt-3 px-2 space-y-1">
              <router-link to="/profile"
                class="block px-4 py-3 rounded-lg text-base font-medium text-teal-100 hover:bg-teal-400/10 transition-colors duration-300">
                Profile
              </router-link>
              <router-link to="/settings"
                class="block px-4 py-3 rounded-lg text-base font-medium text-teal-100 hover:bg-teal-400/10 transition-colors duration-300">
                Settings
              </router-link>
              <router-link to="/Change-Password"
                class="block px-4 py-3 rounded-lg text-base font-medium text-teal-100 hover:bg-teal-400/10 transition-colors duration-300">
                Change Password
              </router-link>
              <button @click="logout"
                class="block w-full text-left px-4 py-3 rounded-lg text-base font-medium text-rose-400 hover:bg-rose-400/10 transition-colors duration-300">
                Logout
              </button>
            </div>
          </template>
          <template v-else>
            <div class="px-2 space-y-3">
              <router-link to="/login"
                class="block w-full text-center px-4 py-3 border border-teal-400/30 rounded-lg shadow-sm text-base font-medium text-teal-300 bg-transparent hover:bg-teal-400/10 transition-colors duration-300">
                Login
              </router-link>
              <router-link to="/signup"
                class="block w-full text-center px-4 py-3 rounded-lg shadow-lg text-base font-bold text-gray-900 bg-gradient-to-r from-teal-400 to-emerald-500 hover:from-teal-300 hover:to-emerald-400 transition-all duration-300">
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
/* Custom animations */
.router-link-active {
  position: relative;
}

.router-link-active:after {
  content: '';
  position: absolute;
  bottom: 0;
  left: 50%;
  transform: translateX(-50%);
  width: 20px;
  height: 2px;
  background: linear-gradient(to right, #5eead4, #10b981);
  border-radius: 3px;
  animation: pulse 2s infinite;
}

@keyframes pulse {
  0% {
    opacity: 0.7;
    width: 20px;
  }

  50% {
    opacity: 1;
    width: 24px;
  }

  100% {
    opacity: 0.7;
    width: 20px;
  }
}

/* Glow effect for active items */
.router-link-active.router-link-exact-active {
  text-shadow: 0 0 8px rgba(94, 234, 212, 0.3);
}

/* Smooth transitions for dropdown */
.dropdown-enter-active,
.dropdown-leave-active {
  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
}

.dropdown-enter-from,
.dropdown-leave-to {
  opacity: 0;
  transform: translateY(-10px);
}

/* Mobile menu transition */
.mobile-menu-enter-active,
.mobile-menu-leave-active {
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.mobile-menu-enter-from,
.mobile-menu-leave-to {
  opacity: 0;
  transform: translateY(-10px);
}

/* Custom scrollbar for dropdown */
.dropdown-scroll {
  scrollbar-width: thin;
  scrollbar-color: #5eead4 #0f172a;
}

.dropdown-scroll::-webkit-scrollbar {
  width: 6px;
}

.dropdown-scroll::-webkit-scrollbar-track {
  background: #0f172a;
}

.dropdown-scroll::-webkit-scrollbar-thumb {
  background-color: #5eead4;
  border-radius: 6px;
}
</style>
