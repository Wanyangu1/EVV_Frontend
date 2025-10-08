<template>
  <!-- Footer -->
  <footer class="bg-navy-blue border-t border-sky-blue/20 py-6 px-4 sm:px-6 lg:px-8">
    <div class="max-w-7xl mx-auto">
      <div class="flex flex-col md:flex-row justify-between items-center">
        <div class="text-center md:text-left mb-4 md:mb-0">
          <p class="text-white text-sm">
            &copy; {{ new Date().getFullYear() }} DivineAngelCare. All rights reserved.
          </p>
        </div>
        <div class="flex space-x-6">
          <a href="#" class="text-white/70 hover:text-sky-blue transition-colors text-sm">Privacy Policy</a>
          <a href="#" class="text-white/70 hover:text-sky-blue transition-colors text-sm">Terms of Service</a>
          <a href="#" class="text-white/70 hover:text-sky-blue transition-colors text-sm">Contact Us</a>
        </div>
        <div class="flex items-center space-x-2 text-sm">
          <span class="text-gray-400">Crafted with care by</span>
          <a href="https://acw-portfolio.afroartsafary.com/" target="_blank"
            class="text-orange hover:text-orange/80 transition-colors font-medium">
            ACW Developers
          </a>
        </div>
      </div>
    </div>
  </footer>
</template>

<style scoped>
.text-orange {
  color: #ff7f50;
}

.border-sky-blue {
  border-color: #87ceeb;
}

.bg-navy-blue {
  background-color: #091f3c;
}

.bg-sky-blue {
  background-color: #87ceeb;
}

.text-sky-blue {
  color: #87ceeb;
}

.border-sky-blue {
  border-color: #87ceeb;
}
</style>
