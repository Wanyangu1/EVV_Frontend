import useToken from '@/composables/useToken'
import axios from 'axios'

const axiosInstance = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL,
  headers: {
    Accept: 'application/json',
  },
})

const { accessToken } = useToken()

axiosInstance.interceptors.request.use((config) => {
  if (accessToken.value) {
    config.headers['Authorization'] = `Bearer ${accessToken.value}`
  }
  return config
})

export default axiosInstance
