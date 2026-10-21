<template>
  <div class="app-root">
    <HeaderNav v-if="authStore.isAuthenticated && route.name !== 'login'" />

    <main class="main-content">
      <router-view v-slot="{ Component, route: currentRoute }">
        <transition name="fade" mode="out-in">
          <keep-alive :include="['HomeView', 'DiscoverView', 'ProfileView', 'MyLibraryView', 'CommunityView']">
            <component :is="Component" :key="currentRoute.fullPath" />
          </keep-alive>
        </transition>
      </router-view>
    </main>

    <BottomNav v-if="authStore.isAuthenticated && route.name !== 'login'" />
  </div>
</template>

<script setup lang="ts">
import { onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import HeaderNav from '@/components/HeaderNav.vue'
import BottomNav from '@/components/BottomNav.vue'

const route = useRoute()
const authStore = useAuthStore()

onMounted(async () => {
  if (authStore.token && !authStore.user) {
    await authStore.checkAuth()
  }
})
</script>

<style>
.app-root {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
}

.main-content {
  flex: 1;
  padding-bottom: calc(72px + var(--safe-bottom));
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.15s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
