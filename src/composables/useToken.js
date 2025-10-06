import { computed } from 'vue'
import { useLocalStorage } from '@vueuse/core'

export default function useToken() {
  const _accessToken = useLocalStorage('access-token', null)
  const _refreshToken = useLocalStorage('refresh-token', null)

  const accessToken = computed(() => _accessToken.value)
  const refreshToken = computed(() => _refreshToken.value)

  const clearTokens = () => {
    _accessToken.value = null
    _refreshToken.value = null
  }

  return {
    accessToken,
    refreshToken,
    clearTokens,
  }
}
