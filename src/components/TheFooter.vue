<template>
  <footer class="bg-gray-900 text-white pt-16 pb-8">
    <div class="max-w-7xl mx-auto px-6">
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 mb-12">
        <!-- Brand Column -->
        <div class="space-y-6">
          <div class="flex items-center space-x-3">
            <img src="@/assets/logos/logo1.png" class="h-10" alt="City Radius CHS Logo" />
          </div>
          <p class="text-gray-300 leading-relaxed">
            Providing exceptional community healthcare services with compassion and professionalism
            since 2005.
          </p>
          <div class="flex space-x-3 pt-2">
            <a v-for="social in socialLinks" :key="social.name" :href="social.url" target="_blank"
              class="bg-gray-700 hover:bg-blue-500 rounded-full w-10 h-10 flex items-center justify-center transition-all duration-300 hover:scale-105"
              :aria-label="social.name">
              <i :class="social.icon + ' text-lg text-white'"></i>
            </a>
          </div>
        </div>

        <!-- Quick Links -->
        <div>
          <h3 class="text-lg font-semibold mb-6 pb-2 border-b border-gray-700 flex items-center">
            <i class="fas fa-link text-blue-400 mr-2"></i>
            Quick Links
          </h3>
          <ul class="space-y-4">
            <li v-for="link in quickLinks" :key="link.text">
              <a :href="link.url"
                class="flex items-center space-x-3 group hover:text-blue-300 transition-colors text-gray-300">
                <div class="w-2 h-2 rounded-full bg-blue-400 opacity-0 group-hover:opacity-100 transition-opacity">
                </div>
                <span>{{ link.text }}</span>
              </a>
            </li>
          </ul>
        </div>

        <!-- Services -->
        <div>
          <h3 class="text-lg font-semibold mb-6 pb-2 border-b border-gray-700 flex items-center">
            <i class="fas fa-hand-holding-medical text-blue-400 mr-2"></i>
            Our Services
          </h3>
          <ul class="space-y-4">
            <li v-for="service in services" :key="service.text">
              <a :href="service.url"
                class="flex items-center space-x-3 group hover:text-blue-300 transition-colors text-gray-300">
                <div class="w-2 h-2 rounded-full bg-blue-400 opacity-0 group-hover:opacity-100 transition-opacity">
                </div>
                <span>{{ service.text }}</span>
              </a>
            </li>
          </ul>
        </div>

        <!-- Contact Info -->
        <div>
          <h3 class="text-lg font-semibold mb-6 pb-2 border-b border-gray-700 flex items-center">
            <i class="fas fa-headset text-blue-400 mr-2"></i>
            Contact Us
          </h3>
          <ul class="space-y-5">
            <li class="flex items-start space-x-4">
              <div class="bg-blue-400/20 p-2 rounded-full flex-shrink-0">
                <i class="fas fa-phone-alt text-blue-400 text-sm"></i>
              </div>
              <div>
                <p class="font-medium text-white">Phone</p>
                <a href="tel:+14806516458" class="text-gray-300 hover:text-blue-300">+1(480)-651-6458</a>
              </div>
            </li>
            <li class="flex items-start space-x-4">
              <div class="bg-blue-400/20 p-2 rounded-full flex-shrink-0">
                <i class="fas fa-envelope text-blue-400 text-sm"></i>
              </div>
              <div>
                <p class="font-medium text-white">Email</p>
                <a href="mailto:cityradiuschs@gmail.com"
                  class="text-gray-300 hover:text-blue-300">cityradiuschs@gmail.com</a>
              </div>
            </li>
            <li class="flex items-start space-x-4">
              <div class="bg-blue-400/20 p-2 rounded-full flex-shrink-0">
                <i class="fas fa-map-marker-alt text-blue-400 text-sm"></i>
              </div>
              <div>
                <p class="font-medium text-white">Corporate Office:</p>
                <p class="text-gray-300">6125 S Ash Ave. Tempe, AZ 85283</p>
              </div>
            </li>
            <li class="flex items-start space-x-4">
              <div class="bg-blue-400/20 p-2 rounded-full flex-shrink-0">
                <i class="fas fa-clock text-blue-400 text-sm"></i>
              </div>
              <div>
                <p class="font-medium text-white">Hours</p>
                <p class="text-gray-300">Mon-Fri: 8am - 4pm</p>
              </div>
            </li>
          </ul>
        </div>
      </div>
      <div class="border-t border-gray-700 my-8"></div>

      <!-- Bottom Footer -->
      <div class="flex flex-col md:flex-row justify-between items-center">
        <div class="mb-4 md:mb-0">
          <p class="text-sm text-gray-400">
            &copy; {{ new Date().getFullYear() }} City Radius Community Health Service. All rights reserved.
          </p>
        </div>

        <div class="flex flex-wrap gap-4 justify-center">
          <a href="https://acw-portfolio.afroartsafary.com/" target="_blank"
            class="text-blue-200 hover:text-blue-600 text-sm transition-colors">
            Designed by ACW Developers
          </a>
        </div>
      </div>
    </div>
  </footer>
</template>

<script setup>
const socialLinks = [
  { name: 'Facebook', url: 'https://facebook.com/cityradiuschs', icon: 'fab fa-facebook-f' },
  { name: 'Twitter', url: 'https://twitter.com/cityradiuschs', icon: 'fab fa-twitter' },
  { name: 'Instagram', url: 'https://instagram.com/cityradiuschs', icon: 'fab fa-instagram' },
  { name: 'LinkedIn', url: 'https://linkedin.com/company/cityradiuschs', icon: 'fab fa-linkedin-in' },
  { name: 'YouTube', url: 'https://youtube.com/cityradiuschs', icon: 'fab fa-youtube' },
]

const quickLinks = [
  { text: 'About Us', url: 'https://www.mycityradiuschs.com/behavioral-health-care-about-us' },
  { text: 'Careers', url: 'https://www.mycityradiuschs.com/behavioral-health-care-careers' },
  { text: 'News & Updates', url: 'https://www.mycityradiuschs.com/behavioral-health-care-faqs' },
  { text: 'Patient Resources', url: 'https://www.mycityradiuschs.com/behavioral-health-care-services' },
  { text: 'FAQs', url: 'https://www.mycityradiuschs.com/behavioral-health-care-faqs' },
]

const services = [
  { text: 'Counselling services', url: 'https://www.mycityradiuschs.com/services/counselling' },
  { text: 'Mental Health Screening', url: 'https://www.mycityradiuschs.com/services/screening' },
  { text: 'Crisis Intervention and Management', url: 'https://www.mycityradiuschs.com/services/crisis' },
  { text: 'Personal Care Services', url: 'https://www.mycityradiuschs.com/services/personal-care' },
  { text: 'Habilitation', url: 'https://www.mycityradiuschs.com/services/habilitation' },
]
</script>

<style scoped>
footer {
  font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
}

a,
button {
  transition:
    color 0.25s ease,
    background-color 0.25s ease,
    transform 0.25s ease;
}

@keyframes float {
  0% {
    transform: translateY(0);
  }

  50% {
    transform: translateY(-3px);
  }

  100% {
    transform: translateY(0);
  }
}

.hover-scale:hover {
  animation: float 1s ease-in-out infinite;
}

@media (max-width: 768px) {
  .grid-cols-4 {
    grid-template-columns: repeat(2, 1fr);
  }
}

@media (max-width: 480px) {
  .grid-cols-4 {
    grid-template-columns: 1fr;
  }

  .flex-wrap {
    justify-content: center;
  }
}
</style>
