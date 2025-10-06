import { ref } from 'vue'
import { useRouter } from 'vue-router'
import axiosInstance from '@/axiosconfig/axiosInstance'
import useToken from '@/composables/useToken'

export default function useLogout() {
  const router = useRouter()

  const isAuthenticated = ref(true)

  const { refreshToken, clearTokens } = useToken()

  const logout = async () => {
    try {
      await axiosInstance.post('api/logout/', {
        refresh: refreshToken.value,
      })

      clearTokens

      isAuthenticated.value = false

      router.push('/')
    } catch (error) {
      console.error('Error logging out:', error)
    }
  }

  return {
    logout,
    isAuthenticated,
  }
}
