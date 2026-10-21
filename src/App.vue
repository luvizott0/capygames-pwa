<template>
  <div class="app-layout">
    <router-view v-slot="{ Component, route: currentRoute }">
      <transition name="fade" mode="out-in">
        <keep-alive :include="['DiscoverView', 'ProfileView', 'MyLibraryView', 'PlayingView', 'CommunityView']">
          <component :is="Component" :key="currentRoute.fullPath" />
        </keep-alive>
      </transition>
    </router-view>

    <!-- Bottom Navigation Bar no estilo CapyShowTime -->
    <BottomNav v-if="authStore.isAuthenticated && route.name !== 'login'" />
  </div>
</template>

<script setup lang="ts">
import { useRoute } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import BottomNav from '@/components/BottomNav.vue'

const route = useRoute()
const authStore = useAuthStore()
</script>

<style>
.app-layout {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
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
