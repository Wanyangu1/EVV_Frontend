import { createRouter, createWebHistory } from 'vue-router'
import LoginPage from '@/pages/Registration/LoginPage.vue'
import SignupPage from '@/pages/Registration/SignupPage.vue'
import HomePage from '@/pages/Home/HomePage.vue'
import ProfilePage from '@/pages/Registration/ProfilePage.vue'
import SettingsPage from '@/pages/Registration/UserSettings.vue/SettingsPage.vue'
import PasswordChange from '@/pages/Registration/PasswordChange.vue'

const routes = [
  {
    path: '/',
    name: 'login',
    component: LoginPage,
  },
  {
    path: '/admin-Create-User/signup',
    name: 'signup',
    component: SignupPage,
  },
  {
    path: '/home',
    name: 'home',
    component: HomePage,
  },
  {
    path: '/profile',
    name: 'profile',
    component: ProfilePage,
  },
  {
    path: '/settings',
    name: 'settings',
    component: SettingsPage,
  },
  {
    path: '/Change-Password',
    name: 'Change-Password',
    component: PasswordChange,
  },
]

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes,
  scrollBehavior(to) {
    if (to.hash) {
      return {
        el: to.hash,
        behavior: 'smooth',
      }
    }
    return { top: 0 }
  },
})

export default router
