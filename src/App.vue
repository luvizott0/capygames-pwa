<script setup lang="ts">
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import BottomNav from '@/components/BottomNav.vue'

const route = useRoute()
const authStore = useAuthStore()

const showBottomNav = computed(() => {
  return authStore.isAuthenticated && route.name !== 'login'
})
</script>

<template>
  <div class="app-layout">
    <main class="main-content" :class="{ 'with-bottom-nav': showBottomNav }">
      <router-view v-slot="{ Component }">
        <transition name="page" mode="out-in">
          <component :is="Component" />
        </transition>
      </router-view>
    </main>

    <BottomNav v-if="showBottomNav" />
  </div>
</template>

<style scoped>
.app-layout {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  background-color: var(--bg-app);
  color: var(--text-main);
}

.main-content {
  flex: 1;
  width: 100%;
}

.main-content.with-bottom-nav {
  padding-bottom: calc(72px + var(--safe-bottom));
}

.page-enter-active,
.page-leave-active {
  transition: opacity 0.15s ease, transform 0.15s ease;
}

.page-enter-from {
  opacity: 0;
  transform: translateY(4px);
}

.page-leave-to {
  opacity: 0;
  transform: translateY(-4px);
}
</style>
