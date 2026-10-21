<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { capyGamesApi, type GamerProfile } from '@/api/capygames'
import { useAuthStore } from '@/stores/auth'
import { useGridMode } from '@/composables/useGridMode'
import GameCard from '@/components/GameCard.vue'
import ConnectModal from '@/components/ConnectModal.vue'
import {
  Trophy,
  Gamepad2,
  Clock,
  RefreshCw,
  LogOut,
  Users,
  ChevronRight,
  ArrowLeft,
  Grid2x2,
  LayoutGrid
} from 'lucide-vue-next'

const route = useRoute()
const router = useRouter()
const authStore = useAuthStore()
const { gridCols, setGridCols } = useGridMode()

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
  <div class="profile-page">
    <div v-if="isLoading && !profile" class="loading-state">
      <div class="spinner"></div>
      <p>Carregando perfil gamer...</p>
    </div>

    <div v-else-if="profile" class="container page-body fade-in">
      <!-- Top Back Bar quando visualizando perfil de amigo -->
      <div v-if="!isMyProfile" class="friend-nav-bar">
        <button type="button" class="back-btn" @click="router.back()">
          <ArrowLeft :size="18" />
          <span>Voltar</span>
        </button>
      </div>

      <!-- Card Principal de Perfil (estilo CapyShowTime) -->
      <div class="profile-card">
        <div class="user-header">
          <img
            :src="profile.user.avatar_url || 'https://api.dicebear.com/7.x/bottts/svg?seed=' + profile.user.username"
            :alt="profile.user.name"
            class="avatar-lg"
          />
          <h2 class="user-name">{{ profile.user.name }}</h2>
          <span class="user-username">@{{ profile.user.username }}</span>
        </div>

        <!-- Contador de Horas Jogadas (estilo CapyShowTime Time-Spent Banner) -->
        <div class="time-spent-banner">
          <Clock :size="24" class="clock-icon" />
          <div class="time-spent-info">
            <span class="time-spent-label">Tempo estimado em jogos</span>
            <span class="time-spent-value mono">
              {{ profile.stats.total_hours }} horas
            </span>
          </div>
        </div>

        <!-- Stats Grid -->
        <div class="stats-grid">
          <div class="stat-box">
            <span class="stat-val mono">{{ profile.stats.total_games }}</span>
            <span class="stat-label">Na Biblioteca</span>
          </div>
          <div class="stat-box">
            <span class="stat-val mono">{{ profile.stats.completed }}</span>
            <span class="stat-label">Zerados</span>
          </div>
          <div class="stat-box">
            <span class="stat-val mono">{{ profile.stats.mastered }}</span>
            <span class="stat-label">Platinas 100%</span>
          </div>
        </div>
      </div>

      <!-- Feedback message -->
      <div v-if="syncMsg" class="alert-banner fade-in">
        {{ syncMsg }}
      </div>

      <!-- Jogos Recentes do Perfil (com opção Grid 2 ou 4) -->
      <section v-if="profile.recent_games && profile.recent_games.length > 0" class="section-card">
        <div class="section-header-row">
          <div>
            <h2 class="section-title mono">
              <Gamepad2 :size="18" class="text-accent" />
              <span>Jogos Recentes</span>
            </h2>
          </div>

          <div class="grid-toggle" role="group" aria-label="Modo de visualização">
            <button
              type="button"
              class="grid-toggle-btn mono"
              :class="{ active: gridCols === 2 }"
              @click="setGridCols(2)"
            >
              <Grid2x2 :size="14" />
              <span>2</span>
            </button>
            <button
              type="button"
              class="grid-toggle-btn mono"
              :class="{ active: gridCols === 4 }"
              @click="setGridCols(4)"
            >
              <LayoutGrid :size="14" />
              <span>4</span>
            </button>
          </div>
        </div>

        <div
          class="recent-games-grid"
          :class="gridCols === 4 ? 'grid-cols-4' : 'grid-cols-2'"
        >
          <GameCard
            v-for="ug in profile.recent_games"
            :key="ug.id"
            :user-game="ug"
            :compact="gridCols === 4"
            @click="router.push(`/game/${ug.game.id}`)"
          />
        </div>
      </section>

      <!-- Connected Accounts (Steam & Xbox) -->
      <section v-if="isMyProfile" class="section-card">
        <div class="section-title-row">
          <h2 class="section-title mono">Contas Conectadas</h2>
          <span class="section-hint">Sincronização de biblioteca, horas e conquistas</span>
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
                  type="button"
                  class="btn-sync"
                  :disabled="isSyncingSteam"
                  @click="handleSyncSteam"
                >
                  <RefreshCw :size="15" :class="{ spin: isSyncingSteam }" />
                  <span>Sincronizar</span>
                </button>
                <button type="button" class="btn-disconnect" @click="handleDisconnect('steam')">
                  Desconectar
                </button>
              </template>
              <template v-else>
                <button type="button" class="btn-connect" @click="openConnect('steam')">
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
                  type="button"
                  class="btn-sync"
                  :disabled="isSyncingXbox"
                  @click="handleSyncXbox"
                >
                  <RefreshCw :size="15" :class="{ spin: isSyncingXbox }" />
                  <span>Sincronizar</span>
                </button>
                <button type="button" class="btn-disconnect" @click="handleDisconnect('xbox')">
                  Desconectar
                </button>
              </template>
              <template v-else>
                <button type="button" class="btn-connect" @click="openConnect('xbox')">
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
          <h2 class="section-title mono">
            <Users :size="18" class="text-accent" />
            <span>Amigos da CapiHouse</span>
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
            <ChevronRight :size="15" class="text-dim" />
          </div>
        </div>
      </section>

      <!-- Botão de Logout (estilo CapyShowTime) -->
      <div v-if="isMyProfile" class="logout-box">
        <button type="button" class="btn-logout-full" @click="handleLogout">
          <LogOut :size="18" />
          <span>Sair da Conta</span>
        </button>
      </div>
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
.profile-page {
  padding-bottom: 90px;
}

.page-body {
  padding-top: calc(var(--safe-top) + 20px);
}

.friend-nav-bar {
  margin-bottom: 16px;
}

.back-btn {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 8px 16px;
  border-radius: var(--radius-full);
  background-color: var(--bg-surface);
  border: 1px solid var(--color-border);
  color: var(--text-main);
  font-size: 0.85rem;
  font-weight: 600;
  transition: all 0.2s;
}

.back-btn:hover {
  border-color: var(--color-accent);
  background-color: var(--bg-surface-elevated);
}

.profile-card {
  background-color: var(--bg-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg);
  padding: 24px 20px;
  margin-bottom: 20px;
}

.user-header {
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  margin-bottom: 20px;
}

.avatar-lg {
  width: 80px;
  height: 80px;
  border-radius: 50%;
  object-fit: cover;
  border: 3px solid var(--color-accent);
  margin-bottom: 12px;
}

.user-name {
  font-size: 1.35rem;
  font-weight: 700;
  color: var(--text-main);
}

.user-username {
  font-size: 0.85rem;
  color: var(--text-muted);
}

.time-spent-banner {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 14px;
  background-color: var(--bg-surface-elevated);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  padding: 14px 18px;
  margin-bottom: 16px;
}

.clock-icon {
  color: var(--color-accent);
}

.time-spent-info {
  display: flex;
  flex-direction: column;
}

.time-spent-label {
  font-size: 0.75rem;
  color: var(--text-muted);
  text-transform: uppercase;
  letter-spacing: 0.04em;
}

.time-spent-value {
  font-size: 1.25rem;
  font-weight: 700;
  color: var(--text-main);
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 10px;
}

.stat-box {
  background-color: var(--bg-surface-elevated);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  padding: 14px 10px;
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  gap: 4px;
}

.stat-val {
  font-size: 1.25rem;
  font-weight: 700;
  color: var(--color-accent);
}

.stat-label {
  font-size: 0.72rem;
  color: var(--text-muted);
}

.alert-banner {
  background: var(--color-accent-dim);
  border: 1px solid var(--color-accent);
  color: var(--text-main);
  padding: 12px 18px;
  border-radius: var(--radius-md);
  font-size: 0.86rem;
  margin-bottom: 20px;
}

.section-card {
  background: var(--bg-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg);
  padding: 20px;
  margin-bottom: 20px;
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.section-header-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
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

.grid-toggle {
  display: inline-flex;
  align-items: center;
  background-color: var(--bg-surface-elevated);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-full);
  padding: 3px;
  gap: 2px;
}

.grid-toggle-btn {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 4px 10px;
  border-radius: var(--radius-full);
  color: var(--text-muted);
  font-size: 0.74rem;
  font-weight: 700;
  transition: all 0.2s ease;
}

.grid-toggle-btn.active {
  background-color: var(--color-accent);
  color: #0c0a14;
}

.recent-games-grid {
  display: grid;
}

.recent-games-grid.grid-cols-2 {
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 14px;
}

.recent-games-grid.grid-cols-4 {
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 10px;
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
  padding: 14px 16px;
  background: var(--bg-surface-elevated);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  gap: 12px;
  flex-wrap: wrap;
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
  padding: 4px 10px;
  border-radius: var(--radius-full);
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
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 7px 14px;
  background: var(--bg-surface-hover);
  border: 1px solid var(--color-border);
  color: var(--text-main);
  border-radius: var(--radius-full);
  font-size: 0.78rem;
  font-weight: 600;
  transition: all 0.2s;
}

.btn-sync:hover {
  border-color: var(--color-accent);
}

.btn-disconnect {
  padding: 7px 12px;
  color: var(--color-danger);
  font-size: 0.76rem;
  font-weight: 600;
  border-radius: var(--radius-full);
}

.btn-connect {
  padding: 8px 16px;
  background: var(--color-accent);
  color: #0c0a14;
  border-radius: var(--radius-full);
  font-size: 0.8rem;
  font-weight: 700;
  transition: all 0.2s;
}

.btn-connect:hover {
  background: var(--color-accent-hover);
}

.gamers-list {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 10px;
}

.gamer-pill {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 8px 14px 8px 8px;
  background: var(--bg-surface-elevated);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-full);
  cursor: pointer;
  transition: all 0.2s ease;
}

.gamer-pill:hover {
  background: var(--bg-surface-hover);
  border-color: var(--color-accent);
  transform: translateY(-1px);
}

.gamer-avatar {
  width: 30px;
  height: 30px;
  border-radius: 50%;
  object-fit: cover;
  margin-right: 10px;
}

.gamer-name {
  font-size: 0.84rem;
  font-weight: 600;
  color: var(--text-main);
  flex: 1;
}

.logout-box {
  margin-top: 8px;
}

.btn-logout-full {
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 14px;
  border-radius: var(--radius-full);
  background-color: rgba(248, 113, 113, 0.12);
  border: 1px solid rgba(248, 113, 113, 0.3);
  color: var(--color-danger);
  font-size: 0.9rem;
  font-weight: 700;
  transition: all 0.2s;
}

.btn-logout-full:hover {
  background-color: rgba(248, 113, 113, 0.2);
}

.loading-state {
  text-align: center;
  padding: 80px 20px;
  color: var(--text-muted);
}

.spin {
  animation: spin 1s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.text-accent {
  color: var(--color-accent);
}

.text-dim {
  color: var(--text-dim);
}
</style>
