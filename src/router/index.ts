import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from '@/stores/auth'

import PlayingView from '@/views/PlayingView.vue'
import DiscoverView from '@/views/DiscoverView.vue'
import MyLibraryView from '@/views/MyLibraryView.vue'
import GameDetailView from '@/views/GameDetailView.vue'
import CommunityView from '@/views/CommunityView.vue'
import ProfileView from '@/views/ProfileView.vue'
import LoginView from '@/views/LoginView.vue'

const router = createRouter({
  history: createWebHistory(),
  scrollBehavior(_to, _from, savedPosition) {
    if (savedPosition) {
      return new Promise((resolve) => {
        setTimeout(() => {
          resolve(savedPosition)
        }, 160)
      })
    }
    return { top: 0 }
  },
  routes: [
    {
      path: '/',
      name: 'playing',
      component: PlayingView,
      meta: { requiresAuth: true }
    },
    {
      path: '/discover',
      name: 'discover',
      component: DiscoverView,
      meta: { requiresAuth: true }
    },
    {
      path: '/my-list',
      name: 'my-list',
      component: MyLibraryView,
      meta: { requiresAuth: true }
    },
    {
      path: '/library',
      redirect: '/my-list'
    },
    {
      path: '/game/:id',
      name: 'game-detail',
      component: GameDetailView,
      meta: { requiresAuth: true }
    },
    {
      path: '/community',
      name: 'community',
      component: CommunityView,
      meta: { requiresAuth: true }
    },
    {
      path: '/profile/:id?',
      name: 'profile',
      component: ProfileView,
      meta: { requiresAuth: true }
    },
    {
      path: '/user/:id',
      redirect: to => `/profile/${to.params.id}`
    },
    {
      path: '/login',
      name: 'login',
      component: LoginView,
      meta: { guestOnly: true }
    }
  ]
})

router.beforeEach(async (to, _from, next) => {
  const authStore = useAuthStore()

  if (authStore.token && !authStore.user) {
    await authStore.checkAuth()
  }

  if (to.meta.requiresAuth && !authStore.isAuthenticated) {
    next({ name: 'login' })
  } else if (to.meta.guestOnly && authStore.isAuthenticated) {
    next({ name: 'playing' })
  } else {
    next()
  }
})

export default router
