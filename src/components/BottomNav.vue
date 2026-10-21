<template>
  <nav class="bottom-nav">
    <router-link to="/" class="nav-item" active-class="active" exact>
      <Gamepad2 :size="22" />
      <span>Início</span>
    </router-link>

    <router-link to="/discover" class="nav-item" active-class="active">
      <Search :size="22" />
      <span>Buscar</span>
    </router-link>

    <router-link to="/my-list" class="nav-item" active-class="active">
      <Bookmark :size="22" />
      <span>Minha Lista</span>
    </router-link>

    <router-link to="/community" class="nav-item" active-class="active">
      <Users :size="22" />
      <span>Capihouse</span>
    </router-link>

    <router-link to="/profile" class="nav-item" active-class="active">
      <UserIcon :size="22" />
      <span>Perfil</span>
    </router-link>
  </nav>
</template>

<script setup lang="ts">
import { Gamepad2, Search, Bookmark, Users, User as UserIcon } from 'lucide-vue-next'
</script>

<style scoped>
.bottom-nav {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  height: calc(64px + var(--safe-bottom));
  padding-bottom: var(--safe-bottom);
  background-color: rgba(22, 19, 17, 0.95);
  backdrop-filter: blur(16px);
  -webkit-backdrop-filter: blur(16px);
  border-top: 1px solid var(--color-border);
  display: flex;
  justify-content: space-around;
  align-items: center;
  z-index: 100;
}

.nav-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  color: var(--text-muted);
  font-size: 0.72rem;
  font-weight: 500;
  transition: all 0.2s ease;
  padding: 8px 12px;
}

.nav-item:hover {
  color: var(--text-main);
}

.nav-item.active {
  color: var(--color-accent);
}
</style>
