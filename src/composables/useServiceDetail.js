import { ref, watch, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import axiosInstance from '@/axiosconfig/axiosInstance'

export function useServiceDetail() {
  const route = useRoute()
  const serviceId = ref(route.params.id)
  const service = ref(null)
  const isLoading = ref(true)
  const error = ref(null)
  const currentImage = ref(null)
  const relatedServices = ref([])

  const fetchServiceDetails = async () => {
    isLoading.value = true
    try {
      const response = await axiosInstance.get(`/api/services/services/${serviceId.value}`)
      service.value = response.data

      if (service.value.images?.length > 0) {
        currentImage.value = service.value.images[0]
      }

      fetchRelatedServices(service.value.category)
    } catch (err) {
      error.value = 'Error fetching service details'
      console.error(err)
    } finally {
      isLoading.value = false
    }
  }

  const fetchRelatedServices = async (category) => {
    try {
      const response = await axiosInstance.get(`/api/services/services?category=${category}`)
      relatedServices.value = response.data.filter((s) => s.id !== serviceId.value)
    } catch (err) {
      console.error('Error fetching related services', err)
    }
  }

  const changeImage = (image) => {
    currentImage.value = image
  }

  watch(
    () => route.params.id,
    (newId) => {
      serviceId.value = newId
      fetchServiceDetails()
    },
  )

  onMounted(fetchServiceDetails)

  return {
    service,
    isLoading,
    error,
    currentImage,
    relatedServices,
    changeImage,
  }
}
