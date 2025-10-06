<script setup>
import { useRouter } from 'vue-router'
const router = useRouter()

localStorage.removeItem('access')
localStorage.removeItem('refresh')
router.push('/login')
</script>

<template>
  <div>
    <h1>Logged out</h1>
    <p>
      You have been successfully logged out.
      <router-link to="/login">Log-in again</router-link>.
    </p>
  </div>
</template>
