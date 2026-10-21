<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { capyGamesApi, type GamerProfile } from '@/api/capygames'
import { useAuthStore } from '@/stores/auth'
import ConnectModal from '@/components/ConnectModal.vue'
import {
  Trophy,
  Gamepad2,
  Clock,
  Star,
  RefreshCw,
  LogOut,
  Users,
  ExternalLink,
  ChevronRight,
  Sparkles
} from 'lucide-vue-next'

const route = useRoute()
const router = useRouter()
const authStore = useAuthStore()

const targetUserId = computed(() => {
  return route.params.id ? Number(route.params.id) : (authStore.user?.id || 0)
})

const isMyProfile = computed(() => {
  return !route.params.id || Number(route.params.id) === authStore.user?.id
})

const profile = ref<GamerProfile | null>(null)
const houseGamers = ref<any[]>([])
const isLoading = ref(true)
const isSyncingSteam = ref(false)
const isSyncingXbox = ref(false)
const syncMsg = ref('')

// Modal de conexão
const connectModalOpen = ref(false)
const connectProvider = ref<'steam' | 'xbox'>('steam')

async function fetchProfile() {
  if (!targetUserId.value) return
  isLoading.value = true
  try {
    const res = await capyGamesApi.getUserProfile(targetUserId.value)
    profile.value = res.data

    const usersRes = await capyGamesApi.getUsers()
    houseGamers.value = usersRes.data.data.filter((u: any) => u.id !== targetUserId.value)
  } catch (err) {
    console.error('Falha ao carregar perfil gamer:', err)
  } finally {
    isLoading.value = false
  }
}

async function handleSyncSteam() {
  isSyncingSteam.value = true
  syncMsg.value = ''
  try {
    const res = await capyGamesApi.syncSteam()
    syncMsg.value = res.data.message
    await fetchProfile()
  } catch (err: any) {
    syncMsg.value = err.response?.data?.message || 'Erro ao sincronizar Steam.'
  } finally {
    isSyncingSteam.value = false
  }
}

async function handleSyncXbox() {
  isSyncingXbox.value = true
  syncMsg.value = ''
  try {
    const res = await capyGamesApi.syncXbox()
    syncMsg.value = res.data.message
    await fetchProfile()
  } catch (err: any) {
    syncMsg.value = err.response?.data?.message || 'Erro ao sincronizar Xbox.'
  } finally {
    isSyncingXbox.value = false
  }
}

function openConnect(provider: 'steam' | 'xbox') {
  connectProvider.value = provider
  connectModalOpen.value = true
}

async function handleDisconnect(provider: 'steam' | 'xbox') {
  if (!confirm(`Deseja desconectar sua conta da ${provider === 'steam' ? 'Steam' : 'Xbox Live'}?`)) return

  try {
    if (provider === 'steam') {
      await capyGamesApi.disconnectSteam()
    } else {
      await capyGamesApi.disconnectXbox()
    }
    await authStore.checkAuth()
    await fetchProfile()
  } catch (err: any) {
    alert(err.response?.data?.message || 'Erro ao desconectar.')
  }
}

async function handleLogout() {
  if (confirm('Deseja realmente sair da sua conta?')) {
    await authStore.logout()
    router.push('/login')
  }
}

watch(targetUserId, () => {
  fetchProfile()
})

onMounted(() => {
  fetchProfile()
})
</script>

<template>
  <div class="profile-view container">
    <div v-if="isLoading && !profile" class="loading-state">
      <RefreshCw :size="32" class="spin text-accent" />
      <p>Carregando perfil gamer...</p>
    </div>

    <div v-else-if="profile" class="fade-in">
      <!-- User Header Card -->
      <header class="profile-header">
        <div class="header-main">
          <img
            :src="profile.user.avatar_url || 'https://api.dicebear.com/7.x/bottts/svg?seed=' + profile.user.username"
            class="profile-avatar"
          />
          <div class="header-titles">
            <h1 class="user-display-name">{{ profile.user.name }}</h1>
            <p class="user-username">@{{ profile.user.username }}</p>
          </div>
        </div>

        <button v-if="isMyProfile" class="btn-logout" @click="handleLogout" title="Sair da conta">
          <LogOut :size="18" />
        </button>
      </header>

      <!-- Feedback message -->
      <div v-if="syncMsg" class="alert-banner fade-in">
        {{ syncMsg }}
      </div>

      <!-- Gamer Stats Grid -->
      <section class="stats-grid">
        <div class="stat-card">
          <span class="stat-icon-wrapper purple">
            <Gamepad2 :size="20" />
          </span>
          <span class="stat-num mono">{{ profile.stats.total_games }}</span>
          <span class="stat-label">Biblioteca</span>
        </div>

        <div class="stat-card">
          <span class="stat-icon-wrapper green">
            <Trophy :size="20" />
          </span>
          <span class="stat-num mono">{{ profile.stats.completed }}</span>
          <span class="stat-label">Zerados</span>
        </div>

        <div class="stat-card">
          <span class="stat-icon-wrapper gold">
            <Sparkles :size="20" />
          </span>
          <span class="stat-num mono">{{ profile.stats.mastered }}</span>
          <span class="stat-label">Platinas / 100%</span>
        </div>

        <div class="stat-card">
          <span class="stat-icon-wrapper blue">
            <Clock :size="20" />
          </span>
          <span class="stat-num mono">{{ profile.stats.total_hours }}h</span>
          <span class="stat-label">Horas Estimadas</span>
        </div>
      </section>

      <!-- Connected Accounts (Steam & Xbox) -->
      <section v-if="isMyProfile" class="section-card">
        <div class="section-title-row">
          <h2 class="section-title">Contas Conectadas</h2>
          <span class="section-hint">Sincronização de biblioteca e conquistas</span>
        </div>

        <div class="accounts-list">
          <!-- Steam -->
          <div class="account-item">
            <div class="acc-info">
              <span class="provider-pill steam">Steam</span>
              <div>
                <p class="acc-name">{{ profile.user.steam_username || 'Não conectado' }}</p>
                <p class="acc-status">
                  {{ profile.user.steam_username ? 'Biblioteca conectada' : 'Vincule seu Steam ID ou perfil público' }}
                </p>
              </div>
            </div>

            <div class="acc-actions">
              <template v-if="profile.user.steam_username">
                <button
                  class="btn-sync"
                  :disabled="isSyncingSteam"
                  @click="handleSyncSteam"
                  title="Sincronizar jogos do Steam"
                >
                  <RefreshCw :size="15" :class="{ spin: isSyncingSteam }" />
                  <span>Sincronizar</span>
                </button>
                <button class="btn-disconnect" @click="handleDisconnect('steam')">
                  Desconectar
                </button>
              </template>
              <template v-else>
                <button class="btn-connect" @click="openConnect('steam')">
                  Conectar
                </button>
              </template>
            </div>
          </div>

          <!-- Xbox Live -->
          <div class="account-item">
            <div class="acc-info">
              <span class="provider-pill xbox">Xbox Live</span>
              <div>
                <p class="acc-name">{{ profile.user.xbox_gamertag || 'Não conectado' }}</p>
                <p class="acc-status">
                  {{ profile.user.xbox_gamertag ? 'Gamertag vinculada' : 'Vincule sua Gamertag do Xbox' }}
                </p>
              </div>
            </div>

            <div class="acc-actions">
              <template v-if="profile.user.xbox_gamertag">
                <button
                  class="btn-sync"
                  :disabled="isSyncingXbox"
                  @click="handleSyncXbox"
                  title="Sincronizar jogos do Xbox"
                >
                  <RefreshCw :size="15" :class="{ spin: isSyncingXbox }" />
                  <span>Sincronizar</span>
                </button>
                <button class="btn-disconnect" @click="handleDisconnect('xbox')">
                  Desconectar
                </button>
              </template>
              <template v-else>
                <button class="btn-connect" @click="openConnect('xbox')">
                  Conectar
                </button>
              </template>
            </div>
          </div>
        </div>
      </section>

      <!-- Housemates Gamers -->
      <section v-if="houseGamers.length > 0" class="section-card">
        <div class="section-title-row">
          <h2 class="section-title">
            <Users :size="18" class="text-accent" />
            <span>Moradores da CapiHouse</span>
          </h2>
          <span class="section-hint">Veja o que seus amigos estão jogando</span>
        </div>

        <div class="gamers-list">
          <div
            v-for="g in houseGamers"
            :key="g.id"
            class="gamer-pill"
            @click="router.push(`/user/${g.id}`)"
          >
            <img
              :src="g.avatar_url || 'https://api.dicebear.com/7.x/bottts/svg?seed=' + g.username"
              class="gamer-avatar"
            />
            <span class="gamer-name">{{ g.name }}</span>
            <ChevronRight :size="14" class="text-dim" />
          </div>
        </div>
      </section>
    </div>

    <!-- Modal de Conexão -->
    <ConnectModal
      :is-open="connectModalOpen"
      :provider="connectProvider"
      @close="connectModalOpen = false"
      @connected="fetchProfile"
    />
  </div>
</template>

<style scoped>
.profile-view {
  padding-top: 20px;
  padding-bottom: 30px;
}

.profile-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  background: var(--bg-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg);
  padding: 20px;
  margin-bottom: 20px;
}

.header-main {
  display: flex;
  align-items: center;
  gap: 16px;
}

.profile-avatar {
  width: 56px;
  height: 56px;
  border-radius: 50%;
  border: 2px solid var(--color-accent);
  object-fit: cover;
}

.header-titles {
  display: flex;
  flex-direction: column;
}

.user-display-name {
  font-size: 1.25rem;
  font-weight: 800;
  color: var(--text-main);
  line-height: 1.2;
}

.user-username {
  font-size: 0.82rem;
  color: var(--text-muted);
}

.btn-logout {
  color: var(--color-danger);
  padding: 8px;
  border-radius: var(--radius-sm);
  background: rgba(239, 68, 68, 0.1);
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s ease;
}

.btn-logout:hover {
  background: rgba(239, 68, 68, 0.2);
}

.alert-banner {
  background: rgba(168, 85, 247, 0.15);
  border: 1px solid var(--color-accent);
  color: var(--text-main);
  padding: 10px 16px;
  border-radius: var(--radius-sm);
  font-size: 0.85rem;
  margin-bottom: 20px;
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 12px;
  margin-bottom: 20px;
}

@media (min-width: 600px) {
  .stats-grid {
    grid-template-columns: repeat(4, 1fr);
  }
}

.stat-card {
  background: var(--bg-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  padding: 16px;
  display: flex;
  flex-direction: column;
  gap: 6px;
  align-items: center;
  text-align: center;
}

.stat-icon-wrapper {
  width: 38px;
  height: 38px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 4px;
}

.stat-icon-wrapper.purple {
  background: rgba(124, 58, 237, 0.15);
  color: #c084fc;
}

.stat-icon-wrapper.green {
  background: rgba(16, 185, 129, 0.15);
  color: #34d399;
}

.stat-icon-wrapper.gold {
  background: rgba(245, 158, 11, 0.15);
  color: #fbbf24;
}

.stat-icon-wrapper.blue {
  background: rgba(59, 130, 246, 0.15);
  color: #60a5fa;
}

.stat-num {
  font-size: 1.3rem;
  font-weight: 800;
  color: var(--text-main);
}

.stat-label {
  font-size: 0.75rem;
  color: var(--text-muted);
  text-transform: uppercase;
  letter-spacing: 0.03em;
}

.section-card {
  background: var(--bg-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  padding: 18px;
  margin-bottom: 20px;
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.section-title-row {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.section-title {
  font-size: 1rem;
  font-weight: 700;
  color: var(--text-main);
  display: flex;
  align-items: center;
  gap: 8px;
}

.section-hint {
  font-size: 0.78rem;
  color: var(--text-muted);
}

.accounts-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.account-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 14px;
  background: var(--bg-surface-elevated);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-sm);
  gap: 12px;
}

.acc-info {
  display: flex;
  align-items: center;
  gap: 12px;
  overflow: hidden;
}

.provider-pill {
  font-size: 0.7rem;
  font-weight: 700;
  padding: 4px 8px;
  border-radius: 4px;
  text-transform: uppercase;
  letter-spacing: 0.04em;
}

.provider-pill.steam {
  background: rgba(37, 99, 235, 0.2);
  color: #60a5fa;
  border: 1px solid rgba(37, 99, 235, 0.4);
}

.provider-pill.xbox {
  background: rgba(22, 163, 74, 0.2);
  color: #4ade80;
  border: 1px solid rgba(22, 163, 74, 0.4);
}

.acc-name {
  font-size: 0.88rem;
  font-weight: 700;
  color: var(--text-main);
}

.acc-status {
  font-size: 0.72rem;
  color: var(--text-muted);
}

.acc-actions {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-shrink: 0;
}

.btn-sync {
  display: flex;
  align-items: center;
  gap: 5px;
  padding: 6px 12px;
  background: var(--bg-surface-hover);
  border: 1px solid var(--color-border);
  color: var(--text-main);
  border-radius: var(--radius-sm);
  font-size: 0.78rem;
  font-weight: 600;
}

.btn-sync:hover {
  border-color: var(--color-accent);
}

.btn-disconnect {
  padding: 6px 10px;
  color: var(--color-danger);
  font-size: 0.75rem;
}

.btn-connect {
  padding: 6px 14px;
  background: var(--color-primary);
  color: #fff;
  border-radius: var(--radius-sm);
  font-size: 0.78rem;
  font-weight: 600;
}

.gamers-list {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 8px;
}

.gamer-pill {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 8px 12px;
  background: var(--bg-surface-elevated);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-sm);
  cursor: pointer;
  transition: all 0.2s ease;
}

.gamer-pill:hover {
  background: var(--bg-surface-hover);
  border-color: var(--color-accent);
}

.gamer-avatar {
  width: 28px;
  height: 28px;
  border-radius: 50%;
  object-fit: cover;
  margin-right: 8px;
}

.gamer-name {
  font-size: 0.82rem;
  font-weight: 600;
  color: var(--text-main);
  flex: 1;
}

.loading-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 80px 20px;
  gap: 12px;
  color: var(--text-muted);
}

.spin {
  animation: spin 1s linear infinite;
}

@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

.text-accent {
  color: var(--color-accent);
}

.text-dim {
  color: var(--text-dim);
}
</style>
