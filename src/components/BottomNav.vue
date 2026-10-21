<script setup lang="ts">
import { Gamepad2, Compass, Flame, User } from 'lucide-vue-next'
</script>

<template>
  <nav class="bottom-nav">
    <router-link to="/" class="nav-item" active-class="active">
      <Gamepad2 class="nav-icon" :size="22" />
      <span class="nav-label">Biblioteca</span>
    </router-link>

    <router-link to="/discover" class="nav-item" active-class="active">
      <Compass class="nav-icon" :size="22" />
      <span class="nav-label">Explorar</span>
    </router-link>

    <router-link to="/community" class="nav-item" active-class="active">
      <Flame class="nav-icon" :size="22" />
      <span class="nav-label">Comunidade</span>
    </router-link>

    <router-link to="/profile" class="nav-item" active-class="active">
      <User class="nav-icon" :size="22" />
      <span class="nav-label">Perfil</span>
    </router-link>
  </nav>
</template>

<style scoped>
.bottom-nav {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  height: calc(64px + var(--safe-bottom));
  padding-bottom: var(--safe-bottom);
  background: rgba(21, 18, 34, 0.95);
  backdrop-filter: blur(16px);
  -webkit-backdrop-filter: blur(16px);
  border-top: 1px solid var(--color-border);
  display: flex;
  align-items: center;
  justify-content: space-around;
  z-index: 50;
  max-width: 768px;
  margin: 0 auto;
}

.nav-item {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 4px;
  height: 100%;
  color: var(--text-dim);
  transition: all 0.2s ease;
  text-decoration: none;
}

.nav-item:active {
  transform: scale(0.92);
}

.nav-icon {
  transition: transform 0.2s ease, color 0.2s ease;
}

.nav-label {
  font-size: 0.72rem;
  font-weight: 600;
  letter-spacing: 0.02em;
}

.nav-item.active {
  color: var(--color-accent);
}

.nav-item.active .nav-icon {
  transform: translateY(-2px);
  color: #c084fc;
}
</style>
