// src/composables/useConfirmDialog.js
import { ref } from 'vue'

export const useConfirmDialog = () => {
  const isOpen = ref(false)
  const dialogConfig = ref({
    title: '',
    message: '',
    confirmText: 'Confirm',
    cancelText: 'Cancel',
    icon: null,
    onConfirm: () => {},
    onCancel: () => {},
  })

  const showDialog = (config) => {
    return new Promise((resolve) => {
      dialogConfig.value = {
        ...dialogConfig.value,
        ...config,
        onConfirm: () => {
          isOpen.value = false
          resolve(true)
        },
        onCancel: () => {
          isOpen.value = false
          resolve(false)
        },
      }
      isOpen.value = true
    })
  }

  return {
    isOpen,
    dialogConfig,
    showDialog,
  }
}
