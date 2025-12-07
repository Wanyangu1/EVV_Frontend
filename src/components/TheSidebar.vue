<script setup>
import { ref, defineEmits, onMounted, computed, onUnmounted } from 'vue'
import useLogout from '@/composables/useLogout'
import axiosInstance from '@/axiosconfig/axiosInstance'

const { logout } = useLogout()
const emit = defineEmits(['toggleSidebar', 'navigate'])

// User data state
const userData = ref(null)
const loadingUser = ref(false)
const userError = ref(null)

// reactive state
const sidebarOpen = ref(true)
const isLarge = ref(false)

// Compute if user is admin
const isAdmin = computed(() => {
  if (!userData.value) return false
  return userData.value.role === 'admin' || userData.value.role === 'superuser'
})

// Fetch user data from API
const fetchUserInfo = async () => {
  try {
    loadingUser.value = true
    userError.value = null

    const response = await axiosInstance.get('/api/user-info/')
    userData.value = response.data

    // Store in localStorage as fallback
    localStorage.setItem('user_role', response.data.role)
    localStorage.setItem('user_name', response.data.name)
    localStorage.setItem('user_email', response.data.email)

  } catch (error) {
    console.error('Error fetching user info:', error)
    userError.value = error

    // Fallback to localStorage if API fails
    userData.value = {
      role: localStorage.getItem('user_role') || 'caregiver',
      name: localStorage.getItem('user_name') || 'User',
      email: localStorage.getItem('user_email') || '',
      phone: localStorage.getItem('user_phone') || ''
    }
  } finally {
    loadingUser.value = false
  }
}

// Setup auto-refresh for user data
let refreshInterval = null

// initialize based on screen size (desktop open, mobile closed)
onMounted(() => {
  // Fetch user info on mount
  fetchUserInfo()

  // Set up auto-refresh every 5 minutes
  refreshInterval = setInterval(fetchUserInfo, 5 * 60 * 1000)

  const mq = window.matchMedia('(min-width: 1024px)')
  const setInitial = (matches) => {
    isLarge.value = matches
    sidebarOpen.value = matches // open on large, closed on small
  }
  setInitial(mq.matches)

  const handler = (e) => {
    // when switching to large, ensure sidebar opens; when switching to small, keep it closed
    setInitial(e.matches)
  }

  if (mq.addEventListener) mq.addEventListener('change', handler)
  else mq.addListener(handler)
})

// Clean up interval on unmount
onUnmounted(() => {
  if (refreshInterval) {
    clearInterval(refreshInterval)
  }
})

// explicit open/close
const openSidebar = () => {
  sidebarOpen.value = true
  emit('toggleSidebar')
}
const closeSidebar = () => {
  sidebarOpen.value = false
  emit('toggleSidebar')
}
const toggleSidebar = () => {
  sidebarOpen.value ? closeSidebar() : openSidebar()
}

const handleNavigation = (route) => {
  emit('navigate', route)
  // auto-close on mobile after navigation
  if (!isLarge.value) closeSidebar()
}

const handleLogout = () => {
  // Clear user data from localStorage
  localStorage.removeItem('user_role')
  localStorage.removeItem('user_name')
  localStorage.removeItem('user_email')
  localStorage.removeItem('user_phone')

  logout()
  if (!isLarge.value) closeSidebar()
}

// Refresh user data manually
const refreshUserData = () => {
  fetchUserInfo()
}
</script>

<template>
  <div class="flex">
    <!-- Sidebar -->
    <aside @click.stop :class="[
      'fixed lg:relative inset-y-0 left-0 mt-17 bg-white border-r border-gray-200 transform transition-all duration-300 ease-in-out flex flex-col z-40',
      sidebarOpen ? 'w-50 translate-x-0' : '-translate-x-full lg:translate-x-0 lg:w-20'
    ]">
      <!-- Sidebar Header -->
      <div class="flex items-center justify-between h-16 px-4 border-b border-gray-200">
        <div v-if="sidebarOpen" class="flex-1 min-w-0">
          <h2 class="text-lg font-semibold text-gray-800 truncate">
            {{ isAdmin ? 'Admin Panel' : 'Caregiver Panel' }}
          </h2>
          <div v-if="userData" class="flex items-center mt-1">
            <button @click="refreshUserData" :disabled="loadingUser"
              class="text-xs text-gray-500 hover:text-blue-600 flex items-center disabled:opacity-50"
              title="Refresh user data">
              <svg v-if="loadingUser" class="animate-spin h-3 w-3 mr-1" fill="none" viewBox="0 0 24 24">
                <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                <path class="opacity-75" fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z">
                </path>
              </svg>
              <svg v-else class="h-3 w-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                  d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              {{ loadingUser ? 'Loading...' : userData.name }}
            </button>
          </div>
        </div>
        <div v-else class="w-6"></div>
        <div class="flex items-center space-x-2">
          <!-- Desktop Toggle Button (collapse/expand width on large screens) -->
          <button @click="toggleSidebar"
            class="hidden lg:flex p-2 rounded-md text-gray-500 hover:text-gray-700 hover:bg-gray-100 transition-colors"
            title="Toggle sidebar">
            <svg :class="[
              'w-4 h-4 transform transition-transform duration-300',
              sidebarOpen ? 'rotate-0' : 'rotate-180'
            ]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
            </svg>
          </button>

          <!-- Mobile Close Button -->
          <button v-if="sidebarOpen && !isLarge" @click="closeSidebar"
            class="lg:hidden p-2 rounded-md text-gray-500 hover:text-gray-700" title="Close sidebar">
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      </div>

      <!-- Loading State -->
      <div v-if="loadingUser && !userData" class="flex-1 flex items-center justify-center">
        <div class="text-center">
          <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p class="mt-2 text-sm text-gray-500">Loading user data...</p>
        </div>
      </div>

      <!-- Sidebar Navigation -->
      <nav v-else class="flex-1 px-3 py-6 space-y-1">
        <!-- Dashboard - Always visible -->
        <button @click="handleNavigation('dashboard')"
          class="w-full flex items-center px-3 py-3 text-sm font-medium rounded-lg transition-colors group text-gray-700 hover:bg-gray-100 hover:text-blue-600">
          <svg class="w-5 h-5" :class="sidebarOpen ? 'mr-3' : ''" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
              d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
          </svg>
          <span v-if="sidebarOpen">Dashboard</span>
          <div v-else class="tooltip"><span class="tooltip-text">Dashboard</span></div>
        </button>

        <!-- Admin Only Menu Items -->
        <template v-if="isAdmin">
          <!-- Clients -->
          <button @click="handleNavigation('clients')"
            class="w-full flex items-center px-3 py-3 text-sm font-medium rounded-lg transition-colors group text-gray-700 hover:bg-gray-100 hover:text-blue-600">
            <svg class="w-5 h-5" :class="sidebarOpen ? 'mr-3' : ''" fill="none" stroke="currentColor"
              viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
            </svg>
            <span v-if="sidebarOpen">Clients</span>
            <div v-else class="tooltip"><span class="tooltip-text">Clients</span></div>
          </button>

          <!-- Visits -->
          <button @click="handleNavigation('visits')"
            class="w-full flex items-center px-3 py-3 text-sm font-medium rounded-lg transition-colors group text-gray-700 hover:bg-gray-100 hover:text-blue-600">
            <svg class="w-5 h-5" :class="sidebarOpen ? 'mr-3' : ''" fill="none" stroke="currentColor"
              viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span v-if="sidebarOpen">Visits</span>
            <div v-else class="tooltip"><span class="tooltip-text">Visits</span></div>
          </button>

          <!-- Services (Employee) -->
          <button @click="handleNavigation('services')"
            class="w-full flex items-center px-3 py-3 text-sm font-medium rounded-lg transition-colors group text-gray-700 hover:bg-gray-100 hover:text-blue-600">
            <svg class="w-5 h-5" :class="sidebarOpen ? 'mr-3' : ''" fill="none" stroke="currentColor"
              viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
            </svg>
            <span v-if="sidebarOpen">Employee</span>
            <div v-else class="tooltip"><span class="tooltip-text">Employee</span></div>
          </button>

          <!-- Xrefs -->
          <button @click="handleNavigation('xrefs')"
            class="w-full flex items-center px-3 py-3 text-sm font-medium rounded-lg transition-colors group text-gray-700 hover:bg-gray-100 hover:text-blue-600">
            <svg class="w-5 h-5" :class="sidebarOpen ? 'mr-3' : ''" fill="none" stroke="currentColor"
              viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
            </svg>
            <span v-if="sidebarOpen">Relationships</span>
            <div v-else class="tooltip"><span class="tooltip-text">Relationships</span></div>
          </button>
        </template>

        <!-- Profile - Always visible -->
        <button @click="handleNavigation('profile')"
          class="w-full flex items-center px-3 py-3 text-sm font-medium rounded-lg transition-colors group text-gray-700 hover:bg-gray-100 hover:text-blue-600">
          <svg class="w-5 h-5" :class="sidebarOpen ? 'mr-3' : ''" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
              d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
          </svg>
          <span v-if="sidebarOpen">Profile</span>
          <div v-else class="tooltip"><span class="tooltip-text">Profile</span></div>
        </button>

        <!-- Settings - Always visible -->
        <button @click="handleNavigation('settings')"
          class="w-full flex items-center px-3 py-3 text-sm font-medium rounded-lg transition-colors group text-gray-700 hover:bg-gray-100 hover:text-blue-600">
          <svg class="w-5 h-5" :class="sidebarOpen ? 'mr-3' : ''" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
              d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
              d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
          <span v-if="sidebarOpen">Settings</span>
          <div v-else class="tooltip"><span class="tooltip-text">Settings</span></div>
        </button>
      </nav>

      <!-- User Role Indicator -->
      <div v-if="sidebarOpen && userData" class="px-4 py-2 border-t border-gray-200">
        <div class="flex items-center justify-between">
          <div class="flex items-center">
            <div :class="[
              'w-3 h-3 rounded-full mr-2',
              isAdmin ? 'bg-green-500' : 'bg-blue-500'
            ]"></div>
            <span class="text-xs font-medium text-gray-700">
              {{ isAdmin ? 'Administrator' : 'Caregiver' }}
            </span>
          </div>
          <span v-if="userError" class="text-xs text-red-500" title="Error loading user data">
            ⚠
          </span>
        </div>
      </div>

      <!-- Logout Button -->
      <div class="p-4 border-t border-gray-200">
        <button @click="handleLogout"
          class="w-full flex items-center px-3 py-3 text-sm font-medium rounded-lg transition-colors group text-red-600 hover:bg-red-50 hover:text-red-700">
          <svg class="w-5 h-5" :class="sidebarOpen ? 'mr-3' : ''" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
              d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
          </svg>
          <span v-if="sidebarOpen">Logout</span>
          <div v-else class="tooltip"><span class="tooltip-text">Logout</span></div>
        </button>
      </div>
    </aside>

    <!-- Mobile Overlay (when sidebar is open on small screens) -->
    <div v-if="sidebarOpen && !isLarge" @click="closeSidebar" class="fixed inset-0 bg-opacity-50 z-30 lg:hidden"></div>

    <!-- Floating Toggle Button (when sidebar is closed on mobile) -->
    <button v-if="!sidebarOpen && !isLarge" @click="openSidebar"
      class="fixed top-19 left-4 z-50 p-2 bg-white rounded-md shadow lg:hidden" aria-label="Open sidebar"
      title="Open sidebar">
      <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6 text-gray-800" fill="none" viewBox="0 0 24 24"
        stroke="currentColor">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16" />
      </svg>
    </button>
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
