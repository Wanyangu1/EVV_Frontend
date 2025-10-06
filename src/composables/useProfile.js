import { ref, onMounted } from 'vue'
import axiosInstance from '@/axiosconfig/axiosInstance'

export default function useProfile() {
  const profile = ref({
    name: '',
    email: '',
    phone: '',
  })

  const getProfile = async () => {
    try {
      const response = await axiosInstance.get('api/profile/')
      profile.value = response.data
    } catch (error) {
      console.error('Error fetching profile:', error)
    }
  }

  const saveProfile = async () => {
    try {
      await axiosInstance.put('api/profile/', profile.value)
      alert('Profile updated successfully!')
    } catch (error) {
      console.error('Error saving profile:', error)
    }
  }

  const passwordForm = ref({
    currentPassword: '',
    newPassword: '',
    confirmNewPassword: '',
  })

  const changePassword = async () => {
    if (passwordForm.value.newPassword !== passwordForm.value.confirmNewPassword) {
      alert('New passwords do not match.')
      return
    }

    try {
      await axiosInstance.post('api/change-password/', {
        current_password: passwordForm.value.currentPassword,
        new_password: passwordForm.value.newPassword,
      })
      alert('Password changed successfully!')
      // Clear the form fields after successful password change
      passwordForm.value.currentPassword = ''
      passwordForm.value.newPassword = ''
      passwordForm.value.confirmNewPassword = ''
    } catch (error) {
      console.error('Error changing password:', error)
      alert('Error changing password. Please ensure your current password is correct.')
    }
  }

  onMounted(() => {
    getProfile()
  })

  return {
    profile,
    saveProfile,
    passwordForm,
    changePassword,
  }
}
