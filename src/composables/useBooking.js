// src/composables/useBooking.js
import { ref, computed } from 'vue'
import { useRoute } from 'vue-router'
// import axiosInstance from '@/axiosconfig/axiosInstance'

export function useBooking() {
  const route = useRoute()
  // const router = useRouter()

  // Extract booking details from query parameters
  const bookingDetails = computed(() => ({
    id: route.query.id,
    title: route.query.title,
    price: route.query.price,
    provider: route.query.provider,
    location: route.query.location,
    description: route.query.description,
    image: route.query.image,
    category: route.query.category,
  }))

  // Compute full image path
  const serviceImage = computed(() => {
    return bookingDetails.value.image
      ? `http://localhost:8000/media/${bookingDetails.value.image}`
      : '/default-service.jpg'
  })

  // Form state
  const customerDetails = ref({
    name: '',
    email: '',
    phone: '',
    persons: 1,
    check_in_date: '',
    check_out_date: '',
    notes: '',
  })

  // State management
  const isSubmitting = ref(false)
  const error = ref(null)
  const successMessage = ref(null)

  // Submit booking function
  // const submitBooking = async () => {
  //   isSubmitting.value = true
  //   error.value = null
  //   successMessage.value = null

  //   // Validate required fields
  //   if (
  //     !customerDetails.value.name ||
  //     !customerDetails.value.email ||
  //     !customerDetails.value.phone
  //   ) {
  //     error.value = 'Please fill in all required fields.'
  //     isSubmitting.value = false
  //     return
  //   }

  //   // Prepare payload
  //   const payload = {
  //     service_id: bookingDetails.value.id,
  //     service_title: bookingDetails.value.title || 'Untitled Booking',
  //     category: bookingDetails.value.category || '',
  //     description: bookingDetails.value.description || '',
  //     provider: bookingDetails.value.provider || '',
  //     location: bookingDetails.value.location || '',
  //     price: parseFloat(bookingDetails.value.price) || 0,
  //     customer_name: customerDetails.value.name,
  //     customer_email: customerDetails.value.email,
  //     customer_phone: customerDetails.value.phone,
  //     persons: parseInt(customerDetails.value.persons, 10) || 1,
  //     check_in_date: customerDetails.value.check_in_date || null,
  //     check_out_date: customerDetails.value.check_out_date || null,
  //     special_request: customerDetails.value.notes || '',
  //   }

  //   try {
  //     await axiosInstance.post('/api/bookings/', payload)
  //     successMessage.value = 'Booking confirmed successfully!'
  //     setTimeout(() => router.push('/'), 3000) // Redirect after success
  //   } catch (err) {
  //     console.error('🚨 Booking Submission Error:', err.response?.data)
  //     error.value = err.response?.data?.message || 'An error occurred while booking.'
  //   } finally {
  //     isSubmitting.value = false
  //   }
  // }

  return {
    bookingDetails,
    serviceImage,
    customerDetails,
    isSubmitting,
    error,
    successMessage,
    // submitBooking,
  }
}
