import { ref, computed, watch, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import axiosInstance from '@/axiosconfig/axiosInstance'

export default function useServices() {
  const services = ref([]) // Stores all services
  const searchQuery = ref('') // Stores user input for search
  const route = useRoute()

  // Fetch services from API
  const fetchServices = async () => {
    try {
      const response = await axiosInstance.get('/api/services/services/')
      const servicesData = response.data

      const imagesResponse = await axiosInstance.get('/api/services/images/service-images/')
      const imagesData = imagesResponse.data

      // Associate images with services
      services.value = servicesData.map((service) => {
        const serviceImages = imagesData.filter((image) => image.service === service.id)
        return {
          id: service.id,
          title: service.title,
          provider: service.provider,
          category: service.category, // Ensure API provides a category field
          description: service.description,
          price: service.price,
          available: service.available,
          image: serviceImages.length > 0 ? serviceImages[0].image_url : null,
        }
      })
    } catch (error) {
      console.error('Error fetching services:', error)
    }
  }

  // Computed property to filter services based on search query and category
  const filteredServices = computed(() => {
    let results = services.value
    const selectedCategory = route.query.category || ''

    if (selectedCategory) {
      results = results.filter((service) => service.category === selectedCategory)
    }

    if (searchQuery.value.trim()) {
      results = results.filter(
        (service) =>
          service.title.toLowerCase().includes(searchQuery.value.toLowerCase()) ||
          service.provider.toLowerCase().includes(searchQuery.value.toLowerCase()) ||
          service.category.toLowerCase().includes(searchQuery.value.toLowerCase()),
      )
    }

    return results
  })

  // Watch for category changes and re-fetch services if needed
  watch(() => route.query.category, fetchServices, { immediate: true })

  onMounted(fetchServices)

  return {
    services,
    searchQuery,
    filteredServices,
  }
}
