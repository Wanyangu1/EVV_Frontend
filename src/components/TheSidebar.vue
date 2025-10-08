<script setup>
import { ref, defineEmits } from 'vue'
import useLogout from '@/composables/useLogout'

const { logout } = useLogout()
const emit = defineEmits(['toggleSidebar', 'navigate'])

const sidebarOpen = ref(true)

const toggleSidebar = () => {
  sidebarOpen.value = !sidebarOpen.value
  emit('toggleSidebar')
}

const handleNavigation = (route) => {
  emit('navigate', route)
}

const handleLogout = () => {
  logout()
}
</script>

<template>
  <div class="flex">
    <!-- Sidebar -->
    <aside :class="[
      'fixed lg:relative inset-y-0 left-0 top-17 h-screen z-30 bg-white border-r border-gray-200 transform transition-all duration-300 ease-in-out flex flex-col',
      sidebarOpen ? 'w-50 translate-x-0' : 'w-20 -translate-x-full lg:translate-x-0'
    ]">
      <!-- Sidebar Header -->
      <div class="flex items-center justify-between h-16 px-4 border-b border-gray-200">
        <h2 v-if="sidebarOpen" class="text-lg font-semibold text-gray-800">Dashboard</h2>
        <div v-else class="w-6"></div>
        <div class="flex items-center space-x-2">
          <!-- Desktop Toggle Button -->
          <button @click="toggleSidebar"
            class="hidden lg:flex p-2 rounded-md text-gray-500 hover:text-gray-700 hover:bg-gray-100 transition-colors">
            <svg :class="[
              'w-4 h-4 transform transition-transform duration-300',
              sidebarOpen ? 'rotate-0' : 'rotate-180'
            ]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <!-- Mobile Close Button -->
          <button @click="toggleSidebar" class="lg:hidden p-2 rounded-md text-gray-500 hover:text-gray-700">
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      </div>

      <!-- Sidebar Navigation -->
      <nav class="flex-1 px-3 py-6 space-y-1">
        <!-- Dashboard -->
        <button @click="handleNavigation('dashboard')"
          class="w-full flex items-center px-3 py-3 text-sm font-medium rounded-lg transition-colors group text-gray-700 hover:bg-gray-100 hover:text-blue-600">
          <svg class="w-5 h-5" :class="sidebarOpen ? 'mr-3' : ''" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
              d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
          </svg>
          <span v-if="sidebarOpen">Dashboard</span>
          <div v-else class="tooltip">
            <span class="tooltip-text">Dashboard</span>
          </div>
        </button>

        <!-- Clients -->
        <button @click="handleNavigation('clients')"
          class="w-full flex items-center px-3 py-3 text-sm font-medium rounded-lg transition-colors group text-gray-700 hover:bg-gray-100 hover:text-blue-600">
          <svg class="w-5 h-5" :class="sidebarOpen ? 'mr-3' : ''" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
              d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
          </svg>
          <span v-if="sidebarOpen">Clients</span>
          <div v-else class="tooltip">
            <span class="tooltip-text">Clients</span>
          </div>
        </button>

        <!-- Visits -->
        <button @click="handleNavigation('visits')"
          class="w-full flex items-center px-3 py-3 text-sm font-medium rounded-lg transition-colors group text-gray-700 hover:bg-gray-100 hover:text-blue-600">
          <svg class="w-5 h-5" :class="sidebarOpen ? 'mr-3' : ''" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
              d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span v-if="sidebarOpen">Visits</span>
          <div v-else class="tooltip">
            <span class="tooltip-text">Visits</span>
          </div>
        </button>

        <!-- Services -->
        <button @click="handleNavigation('services')"
          class="w-full flex items-center px-3 py-3 text-sm font-medium rounded-lg transition-colors group text-gray-700 hover:bg-gray-100 hover:text-blue-600">
          <svg class="w-5 h-5" :class="sidebarOpen ? 'mr-3' : ''" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
              d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
          </svg>
          <span v-if="sidebarOpen">Services</span>
          <div v-else class="tooltip">
            <span class="tooltip-text">Services</span>
          </div>
        </button>

        <!-- Profile -->
        <router-link to="/profile"
          class="w-full flex items-center px-3 py-3 text-sm font-medium rounded-lg transition-colors group text-gray-700 hover:bg-gray-100 hover:text-blue-600">
          <svg class="w-5 h-5" :class="sidebarOpen ? 'mr-3' : ''" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
              d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
          </svg>
          <span v-if="sidebarOpen">Profile</span>
          <div v-else class="tooltip">
            <span class="tooltip-text">Profile</span>
          </div>
        </router-link>

        <!-- Settings -->
        <router-link to="/settings"
          class="w-full flex items-center px-3 py-3 text-sm font-medium rounded-lg transition-colors group text-gray-700 hover:bg-gray-100 hover:text-blue-600">
          <svg class="w-5 h-5" :class="sidebarOpen ? 'mr-3' : ''" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
              d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
              d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
          <span v-if="sidebarOpen">Settings</span>
          <div v-else class="tooltip">
            <span class="tooltip-text">Settings</span>
          </div>
        </router-link>
      </nav>

      <!-- Logout Button -->
      <div class="p-4 border-t border-gray-200">
        <button @click="handleLogout"
          class="w-full flex items-center px-3 py-3 text-sm font-medium rounded-lg transition-colors group text-red-600 hover:bg-red-50 hover:text-red-700">
          <svg class="w-5 h-5" :class="sidebarOpen ? 'mr-3' : ''" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
              d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
          </svg>
          <span v-if="sidebarOpen">Logout</span>
          <div v-else class="tooltip">
            <span class="tooltip-text">Logout</span>
          </div>
        </button>
      </div>
    </aside>

    <!-- Mobile Overlay -->
    <div v-if="sidebarOpen" @click="toggleSidebar" class="fixed inset-0 bg-black bg-opacity-50 z-20 lg:hidden"></div>
  </div>
</template>

<style scoped>
.tooltip {
  position: relative;
  display: inline-block;
}

.tooltip .tooltip-text {
  visibility: hidden;
  width: 120px;
  background-color: #374151;
  color: white;
  text-align: center;
  border-radius: 6px;
  padding: 5px;
  position: absolute;
  z-index: 1;
  bottom: 125%;
  left: 50%;
  margin-left: -60px;
  opacity: 0;
  transition: opacity 0.3s;
  font-size: 12px;
}

.tooltip .tooltip-text::after {
  content: "";
  position: absolute;
  top: 100%;
  left: 50%;
  margin-left: -5px;
  border-width: 5px;
  border-style: solid;
  border-color: #374151 transparent transparent transparent;
}

.tooltip:hover .tooltip-text {
  visibility: visible;
  opacity: 1;
}
</style>
