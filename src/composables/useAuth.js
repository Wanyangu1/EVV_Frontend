// useAuth.js
import { ref } from 'vue'
import axiosInstance from '@/axiosconfig/axiosInstance'
import { useRouter } from 'vue-router'
import { useLocalStorage } from '@vueuse/core'

export default function useAuth() {
  const name = ref('')
  const email = ref('')
  const password = ref('')
  const router = useRouter()
  const errorMessage = ref('') // 💡 New ref to hold errors
  const authError = ref('')

  const accessToken = useLocalStorage('access-token', null)
  const refreshToken = useLocalStorage('refresh-token', null)

  const login = async () => {
    errorMessage.value = '' // Clear previous errors
    try {
      const response = await axiosInstance.post('/api/login/', {
        email: email.value,
        password: password.value,
      })

      accessToken.value = response.data.access_token
      refreshToken.value = response.data.refresh_token

      axiosInstance.defaults.headers.common['Authorization'] = `Bearer ${accessToken.value}`

      router.push('/home')
    } catch (error) {
      console.error(error)
      if (error.response) {
        errorMessage.value =
          error.response.data.detail || 'Login failed. Please check your credentials.'
      } else {
        errorMessage.value = 'Something went wrong. Please try again.'
      }
    }
  }

  const signup = async () => {
    authError.value = '' // Reset error
    try {
      const response = await axiosInstance.post('/api/register/', {
        name: name.value,
        email: email.value,
        password: password.value,
      })

      accessToken.value = response.data.access_token
      refreshToken.value = response.data.refresh_token

      axiosInstance.defaults.headers.common['Authorization'] = `Bearer ${accessToken.value}`
      router.push('/home')
    } catch (error) {
      console.error(error)
      authError.value =
        error.response?.data?.detail || 'Signup failed. Please check your details and try again.'
    }
  }

  const logout = async () => {
    try {
      await axiosInstance.post('/api/logout/', {
        refresh: refreshToken.value,
      })

      accessToken.value = null
      refreshToken.value = null
      delete axiosInstance.defaults.headers.common['Authorization']

      router.push('/')
    } catch (error) {
      console.error(error)
    }
  }
  return {
    name,
    email,
    password,
    login,
    signup,
    logout,
    accessToken,
    refreshToken,
    authError, // Include this
  }
}
