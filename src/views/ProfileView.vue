<template>
  <div class="profile-page">
    <!-- Header estilo CapyShowTime -->
    <header class="page-header">
      <div class="container">
        <div class="header-content">
          <div v-if="!isMe" class="friend-nav-bar">
            <button class="back-btn" @click="goBack">
              <ArrowLeft :size="18" />
              <span>Voltar</span>
            </button>
          </div>
          <div v-else class="header-title-box">
            <h1 class="header-title mono">Meu Perfil</h1>
            <p class="header-subtitle">Estatísticas e contas vinculadas</p>
          </div>
          <div class="header-actions">
            <RefreshButton
              :is-refreshing="isRefreshingProfile"
              @refresh="onForceRefreshProfile"
            />
          </div>
        </div>
      </div>
    </header>

    <div v-if="loading" class="loading-state">
      <div class="spinner"></div>
      <p>Carregando perfil...</p>
    </div>

    <div v-else-if="profile" class="container page-body fade-in">

      <div class="profile-card">
        <div class="user-header">
          <img
            v-if="profile.user.avatar_url && !avatarBroken"
            :src="profile.user.avatar_url"
            :alt="profile.user.name"
            class="avatar-lg"
            @error="avatarBroken = true"
          />
          <div v-else class="avatar-lg-placeholder">
            {{ profile.user.name.charAt(0) }}
          </div>

          <h2 class="user-name">{{ profile.user.name }}</h2>
          <span class="user-username">@{{ profile.user.username }}</span>
        </div>

        <!-- Stats Grid -->
        <div class="stats-grid">
          <div class="stat-box">
            <span class="stat-val mono">{{ profile.stats.total_games }}</span>
            <span class="stat-label">Jogos na Lista</span>
          </div>
          <div class="stat-box">
            <span class="stat-val mono">{{ profile.stats.completed }}</span>
            <span class="stat-label">Jogos Zerados</span>
          </div>
          <div class="stat-box">
            <span class="stat-val mono">{{ profile.stats.mastered }}</span>
            <span class="stat-label">Platinas 100%</span>
          </div>
        </div>
      </div>

      <!-- Feedback de sincronização -->
      <div v-if="syncMsg" class="update-feedback-banner fade-in">
        <span>ℹ️ {{ syncMsg }}</span>
      </div>

      <!-- 1. Lista de Jogos a Jogar (Scroll Lateral) -->
      <section class="profile-list-section">
        <div class="section-header">
          <div class="section-title-group">
            <Bookmark :size="18" class="section-icon" />
            <h3 class="section-title mono">Jogos a Jogar</h3>
          </div>
          <span class="section-count mono">{{ toPlayGames.length }}</span>
        </div>

        <div v-if="toPlayGames.length === 0" class="empty-list-box">
          <p>{{ isMe ? 'Você ainda não adicionou jogos para jogar.' : 'Nenhum jogo na fila para jogar.' }}</p>
        </div>

        <div v-else class="horizontal-series-scroll">
          <div
            v-for="item in toPlayGames"
            :key="item.id"
            class="scroll-series-card"
            @click="goToGame(item.game.id)"
          >
            <div class="poster-container">
              <img
                v-if="item.game.cover_url"
                :src="item.game.cover_url"
                :alt="item.game.title"
                class="poster-img"
                loading="lazy"
              />
              <div v-else class="poster-placeholder">
                <Gamepad2 :size="26" />
              </div>
              <div class="status-pill" :class="item.status === 'playing' ? 'watching' : ''">
                {{ item.status === 'playing' ? 'Jogando' : 'Na Fila' }}
              </div>
              <div v-if="item.rating" class="rating-pill mono">
                ★ {{ Number(item.rating).toFixed(1) }}
              </div>
            </div>
            <div class="series-info">
              <h4 class="series-title">{{ item.game.title }}</h4>
              <span class="series-meta mono">
                {{ item.platform || 'PC' }}<template v-if="item.hours_played > 0"> • {{ item.hours_played }}h</template>
              </span>
            </div>
          </div>
        </div>
      </section>

      <!-- 2. Lista de Jogos Zerados / Platinados -->
      <section class="profile-list-section">
        <div class="section-header">
          <div class="section-title-group">
            <CheckCircle2 :size="18" class="section-icon completed-icon" />
            <h3 class="section-title mono">Jogos Zerados / Platinados</h3>
          </div>
          <span class="section-count mono">{{ completedGames.length }}</span>
        </div>

        <div v-if="completedGames.length === 0" class="empty-list-box">
          <p>{{ isMe ? 'Você ainda não zerou nenhum jogo.' : 'Nenhum jogo zerado ainda.' }}</p>
        </div>

        <div v-else class="horizontal-series-scroll">
          <div
            v-for="item in completedGames"
            :key="item.id"
            class="scroll-series-card"
            @click="goToGame(item.game.id)"
          >
            <div class="poster-container">
              <img
                v-if="item.game.cover_url"
                :src="item.game.cover_url"
                :alt="item.game.title"
                class="poster-img"
                loading="lazy"
              />
              <div v-else class="poster-placeholder">
                <Gamepad2 :size="26" />
              </div>
              <div class="status-pill completed">
                {{ item.status === 'mastered' ? '🏆 Platinado' : 'Zerado' }}
              </div>
              <div v-if="item.rating" class="rating-pill mono">
                ★ {{ Number(item.rating).toFixed(1) }}
              </div>
            </div>
            <div class="series-info">
              <h4 class="series-title">{{ item.game.title }}</h4>
              <span class="series-meta mono">
                {{ item.platform || 'PC' }}<template v-if="item.hours_played > 0"> • {{ item.hours_played }}h</template>
              </span>
            </div>
          </div>
        </div>
      </section>

      <!-- 3. Lista de Jogos Abandonados -->
      <section class="profile-list-section">
        <div class="section-header">
          <div class="section-title-group">
            <XCircle :size="18" class="section-icon dropped-icon" />
            <h3 class="section-title mono">Jogos Abandonados</h3>
          </div>
          <span class="section-count mono">{{ droppedGames.length }}</span>
        </div>

        <div v-if="droppedGames.length === 0" class="empty-list-box">
          <p>{{ isMe ? 'Você não possui jogos marcados como abandonados.' : 'Nenhum jogo abandonado.' }}</p>
        </div>

        <div v-else class="horizontal-series-scroll">
          <div
            v-for="item in droppedGames"
            :key="item.id"
            class="scroll-series-card"
            @click="goToGame(item.game.id)"
          >
            <div class="poster-container">
              <img
                v-if="item.game.cover_url"
                :src="item.game.cover_url"
                :alt="item.game.title"
                class="poster-img"
                loading="lazy"
              />
              <div v-else class="poster-placeholder">
                <Gamepad2 :size="26" />
              </div>
              <div class="status-pill dropped">
                Abandonado
              </div>
              <div v-if="item.rating" class="rating-pill mono">
                ★ {{ Number(item.rating).toFixed(1) }}
              </div>
            </div>
            <div class="series-info">
              <h4 class="series-title">{{ item.game.title }}</h4>
              <span class="series-meta mono">
                {{ item.platform || 'PC' }}<template v-if="item.hours_played > 0"> • {{ item.hours_played }}h</template>
              </span>
            </div>
          </div>
        </div>
      </section>

      <!-- Seção de Integrações, Atualizações do App e Logout (Apenas no próprio perfil) -->
      <div v-if="isMe" class="profile-actions-card">
        <!-- Integrações Steam & Xbox -->
        <div class="app-updates-box">
          <div class="updates-header">
            <Gamepad2 :size="18" class="updates-icon" />
            <h4 class="updates-title mono">Contas Conectadas (Steam & Xbox)</h4>
          </div>
          <p class="updates-desc">
            Vincule suas contas para sincronizar automaticamente seus jogos, horas jogadas e conquistas.
          </p>

          <div class="accounts-list">
            <!-- Steam -->
            <div class="account-item">
              <div class="acc-info">
                <span class="provider-pill steam">Steam</span>
                <div>
                  <p class="acc-name">{{ profile.user.steam_username || 'Não conectado' }}</p>
                  <p class="acc-status">
                    {{ profile.user.steam_username ? 'Biblioteca conectada' : 'Vincule seu Steam ID ou perfil' }}
                  </p>
                </div>
              </div>
              <div class="acc-actions">
                <template v-if="profile.user.steam_username">
                  <button
                    type="button"
                    class="btn-secondary acc-btn"
                    :disabled="isSyncingSteam"
                    @click="handleSyncSteam"
                  >
                    <RefreshCw :size="14" :class="{ spinning: isSyncingSteam }" />
                    <span>Sincronizar</span>
                  </button>
                  <button type="button" class="btn-disconnect" @click="handleDisconnect('steam')">
                    Desconectar
                  </button>
                </template>
                <template v-else>
                  <button type="button" class="btn-primary acc-btn" @click="openConnect('steam')">
                    Conectar
                  </button>
                </template>
              </div>
            </div>

            <!-- Xbox -->
            <div class="account-item">
              <div class="acc-info">
                <span class="provider-pill xbox">Xbox</span>
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
                    class="btn-secondary acc-btn"
                    :disabled="isSyncingXbox"
                    @click="handleSyncXbox"
                  >
                    <RefreshCw :size="14" :class="{ spinning: isSyncingXbox }" />
                    <span>Sincronizar</span>
                  </button>
                  <button type="button" class="btn-disconnect" @click="handleDisconnect('xbox')">
                    Desconectar
                  </button>
                </template>
                <template v-else>
                  <button type="button" class="btn-primary acc-btn" @click="openConnect('xbox')">
                    Conectar
                  </button>
                </template>
              </div>
            </div>
          </div>
        </div>

        <!-- Atualizações do App -->
        <div class="app-updates-box">
          <div class="updates-header">
            <RefreshCw :size="18" class="updates-icon" :class="{ spinning: isCheckingUpdates }" />
            <h4 class="updates-title mono">Atualizações do Aplicativo</h4>
          </div>
          <p class="updates-desc">
            Busque a versão mais recente do CapyGames ou recarregue o aplicativo para sincronizar novidades.
          </p>

          <!-- Banner de nova atualização pronta -->
          <div v-if="pwaNeedRefresh" class="update-alert-banner">
            <div class="update-alert-text">
              <strong>Nova versão disponível!</strong>
              <span>Uma atualização do CapyGames está pronta para instalar.</span>
            </div>
            <button type="button" class="btn-primary apply-update-btn" @click="updateServiceWorker">
              Atualizar Agora
            </button>
          </div>

          <!-- Mensagem de feedback da checagem -->
          <div v-else-if="pwaFeedbackMessage" class="update-feedback-banner">
            <span>ℹ️ {{ pwaFeedbackMessage }}</span>
          </div>

          <div class="updates-buttons-row">
            <button
              type="button"
              class="btn-secondary update-action-btn"
              :disabled="isCheckingUpdates"
              @click="checkForUpdates"
            >
              <RefreshCw :size="16" :class="{ spinning: isCheckingUpdates }" />
              <span>{{ isCheckingUpdates ? 'Buscando...' : 'Buscar Atualizações' }}</span>
            </button>

            <button
              type="button"
              class="btn-secondary update-action-btn"
              @click="forceReloadApp"
            >
              <RotateCcw :size="16" />
              <span>Recarregar App</span>
            </button>
          </div>
        </div>

        <div class="logout-section">
          <button class="btn-secondary logout-btn" @click="handleLogout">
            <LogOut :size="16" />
            <span>Sair da Conta</span>
          </button>
        </div>
      </div>
    </div>

    <!-- Modal de Conexão Steam / Xbox -->
    <ConnectModal
      :is-open="connectModalOpen"
      :provider="connectProvider"
      @close="connectModalOpen = false"
      @connected="loadProfile(true)"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted, onActivated } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import {
  LogOut,
  ArrowLeft,
  Bookmark,
  CheckCircle2,
  XCircle,
  Gamepad2,
  RefreshCw,
  RotateCcw
} from 'lucide-vue-next'
import { useAuthStore } from '@/stores/auth'
import { useGamesStore } from '@/stores/games'
import { capyGamesApi } from '@/api/capygames'
import { usePwaUpdate } from '@/composables/usePwaUpdate'
import ConnectModal from '@/components/ConnectModal.vue'
import RefreshButton from '@/components/RefreshButton.vue'

const route = useRoute()
const router = useRouter()
const authStore = useAuthStore()
const gamesStore = useGamesStore()

const {
  needRefresh: pwaNeedRefresh,
  isChecking: isCheckingUpdates,
  feedbackMessage: pwaFeedbackMessage,
  checkForUpdates,
  updateServiceWorker,
  forceReloadApp
} = usePwaUpdate()

const targetUserId = computed(() => {
  return route.params.id ? Number(route.params.id) : authStore.user?.id
})

const profile = ref<any>(targetUserId.value ? gamesStore.getCachedProfile(targetUserId.value) : null)
const loading = ref(!profile.value)
const avatarBroken = ref(false)

const isSyncingSteam = ref(false)
const isSyncingXbox = ref(false)
const syncMsg = ref('')
const connectModalOpen = ref(false)
const connectProvider = ref<'steam' | 'xbox'>('steam')

const isMe = computed(() => {
  return !route.params.id || Number(route.params.id) === authStore.user?.id
})

const gamesList = computed<any[]>(() => {
  if (isMe.value && gamesStore.myList.length > 0) {
    return gamesStore.myList.filter((item: any) => item.game)
  }
  return (profile.value?.recent_games || []).filter((item: any) => item.game)
})

const toPlayGames = computed(() => {
  return gamesList.value.filter(
    (item: any) => item.status === 'plan_to_play' || item.status === 'playing' || item.status === 'on_hold'
  )
})

const completedGames = computed(() => {
  return gamesList.value.filter(
    (item: any) => item.status === 'completed' || item.status === 'mastered'
  )
})

const droppedGames = computed(() => {
  return gamesList.value.filter((item: any) => item.status === 'dropped')
})

function goBack() {
  if (window.history.length > 1) {
    router.back()
  } else {
    router.push('/community')
  }
}

function goToGame(gameId: number) {
  router.push(`/game/${gameId}`)
}

const isRefreshingProfile = ref(false)

async function onForceRefreshProfile() {
  isRefreshingProfile.value = true
  try {
    await Promise.all([
      loadProfile(true),
      isMe.value ? gamesStore.fetchMyList(true) : Promise.resolve()
    ])
  } finally {
    isRefreshingProfile.value = false
  }
}

async function loadProfile(force = false) {
  if (!targetUserId.value) return

  const cached = gamesStore.getCachedProfile(targetUserId.value)
  if (cached && !profile.value) {
    profile.value = cached
  }

  // Se já temos o perfil carregado (ou em cache) e não for um recarregamento forçado, não faz chamada à API
  if (!force && profile.value) {
    loading.value = false
    return
  }

  if (!profile.value) {
    loading.value = true
  }

  try {
    if (isMe.value && force) {
      await gamesStore.fetchMyList(true)
    }
    const res = await capyGamesApi.getUserProfile(targetUserId.value)
    profile.value = res.data
    gamesStore.setCachedProfile(targetUserId.value, res.data)
  } catch (err) {
    console.error('Erro ao carregar perfil:', err)
  } finally {
    loading.value = false
  }
}

function openConnect(provider: 'steam' | 'xbox') {
  connectProvider.value = provider
  connectModalOpen.value = true
}

async function handleSyncSteam() {
  isSyncingSteam.value = true
  syncMsg.value = ''
  try {
    const res = await capyGamesApi.syncSteam()
    syncMsg.value = res.data.message
    await gamesStore.fetchMyList(true)
    await loadProfile(true)
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
    await gamesStore.fetchMyList(true)
    await loadProfile(true)
  } catch (err: any) {
    syncMsg.value = err.response?.data?.message || 'Erro ao sincronizar Xbox.'
  } finally {
    isSyncingXbox.value = false
  }
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
    await loadProfile(true)
  } catch (err: any) {
    alert(err.response?.data?.message || 'Erro ao desconectar.')
  }
}

async function handleLogout() {
  await authStore.logout()
  router.push('/login')
}

watch(
  () => route.params.id,
  () => {
    pwaFeedbackMessage.value = ''
    if (targetUserId.value) {
      const cached = gamesStore.getCachedProfile(targetUserId.value)
      profile.value = cached
      loading.value = !cached
    }
    loadProfile(false)
  }
)

onMounted(() => {
  pwaFeedbackMessage.value = ''
  loadProfile(!!profile.value)
})

onActivated(() => {
  if (targetUserId.value) {
    loadProfile(true)
  }
})
</script>

<style scoped>
.profile-page {
  padding-bottom: 96px;
}

.page-header {
  padding: calc(var(--safe-top) + 16px) 0 16px;
  border-bottom: 1px solid var(--color-border);
  background-color: var(--bg-surface);
  margin-bottom: 20px;
}

.header-content {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.header-title {
  font-size: 1.5rem;
  font-weight: 700;
  color: var(--text-main);
  line-height: 1.2;
}

.header-subtitle {
  font-size: 0.85rem;
  color: var(--text-muted);
}

.header-actions {
  display: flex;
  align-items: center;
  gap: 10px;
}

.friend-nav-bar {
  margin-bottom: 14px;
}

.back-btn {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  color: var(--text-muted);
  font-size: 0.85rem;
  font-weight: 600;
  padding: 6px 12px;
  border-radius: var(--radius-md);
  background-color: var(--bg-surface);
  border: 1px solid var(--color-border);
  transition: all 0.2s;
}

.back-btn:hover {
  color: var(--text-main);
  border-color: var(--color-accent);
}

.profile-card {
  background-color: var(--bg-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg);
  padding: 24px 20px;
  margin-bottom: 24px;
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
  border: 2px solid var(--color-accent);
  margin-bottom: 12px;
}

.avatar-lg-placeholder {
  width: 80px;
  height: 80px;
  border-radius: 50%;
  background-color: var(--color-primary);
  color: #fff;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 2rem;
  font-weight: 700;
  margin-bottom: 12px;
  border: 2px solid var(--color-accent);
}

.user-name {
  font-size: 1.3rem;
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
  gap: 16px;
  background: linear-gradient(135deg, rgba(245, 197, 24, 0.12) 0%, rgba(166, 97, 48, 0.18) 100%);
  border: 1px solid rgba(245, 197, 24, 0.25);
  border-radius: var(--radius-md);
  padding: 16px;
  margin-bottom: 18px;
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
  font-weight: 600;
}

.time-spent-value {
  font-size: 1.4rem;
  font-weight: 700;
  color: var(--color-accent);
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 12px;
}

.stat-box {
  background-color: var(--bg-surface-elevated);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  padding: 14px 8px;
  text-align: center;
}

.stat-val {
  font-size: 1.3rem;
  font-weight: 700;
  color: var(--text-main);
  display: block;
}

.stat-label {
  font-size: 0.68rem;
  color: var(--text-muted);
  margin-top: 4px;
  display: block;
}

/* Seções de Listas de Jogos */
.profile-list-section {
  margin-bottom: 28px;
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}

.section-title-group {
  display: flex;
  align-items: center;
  gap: 8px;
}

.section-icon {
  color: var(--color-accent);
}

.completed-icon {
  color: var(--color-success);
}

.dropped-icon {
  color: var(--color-danger, #ef4444);
}

.section-title {
  font-size: 1rem;
  font-weight: 700;
  color: var(--text-main);
}

.section-count {
  font-size: 0.78rem;
  font-weight: 700;
  color: var(--text-muted);
  background-color: var(--bg-surface);
  border: 1px solid var(--color-border);
  padding: 2px 8px;
  border-radius: var(--radius-full);
}

.empty-list-box {
  background-color: var(--bg-surface);
  border: 1px dashed var(--color-border);
  border-radius: var(--radius-md);
  padding: 24px 16px;
  text-align: center;
  color: var(--text-muted);
  font-size: 0.85rem;
}

.horizontal-series-scroll {
  display: flex;
  gap: 14px;
  overflow-x: auto;
  padding: 4px 2px 12px;
  scroll-snap-type: x proximity;
  -webkit-overflow-scrolling: touch;
}

.horizontal-series-scroll::-webkit-scrollbar {
  height: 6px;
}

.horizontal-series-scroll::-webkit-scrollbar-thumb {
  background: var(--bg-surface-hover);
  border-radius: var(--radius-full);
}

.scroll-series-card {
  width: 132px;
  flex-shrink: 0;
  cursor: pointer;
  scroll-snap-align: start;
  transition: transform 0.2s ease;
}

@media (min-width: 640px) {
  .scroll-series-card {
    width: 148px;
  }
}

.scroll-series-card:hover {
  transform: translateY(-4px);
}

.poster-container {
  position: relative;
  width: 100%;
  aspect-ratio: 2 / 3;
  border-radius: var(--radius-md);
  overflow: hidden;
  background-color: var(--bg-surface-elevated);
  border: 1px solid var(--color-border);
}

.poster-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.poster-placeholder {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--text-dim);
}

.status-pill {
  position: absolute;
  top: 8px;
  left: 8px;
  background: rgba(18, 16, 14, 0.85);
  color: var(--text-main);
  font-size: 0.65rem;
  font-weight: 700;
  padding: 2px 7px;
  border-radius: var(--radius-sm);
  backdrop-filter: blur(4px);
  border: 1px solid var(--color-border);
}

.status-pill.watching {
  color: var(--color-accent);
  border-color: rgba(245, 197, 24, 0.35);
}

.status-pill.completed {
  color: var(--color-success);
  border-color: rgba(52, 211, 153, 0.35);
}

.status-pill.dropped {
  color: var(--color-danger);
  border-color: rgba(248, 113, 113, 0.35);
}

.rating-pill {
  position: absolute;
  bottom: 8px;
  right: 8px;
  background: rgba(18, 16, 14, 0.88);
  color: var(--color-accent);
  font-size: 0.72rem;
  font-weight: 700;
  padding: 2px 6px;
  border-radius: var(--radius-sm);
  backdrop-filter: blur(4px);
}

.series-info {
  margin-top: 8px;
}

.series-title {
  font-size: 0.82rem;
  font-weight: 600;
  color: var(--text-main);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.series-meta {
  font-size: 0.72rem;
  color: var(--text-dim);
}

/* Integrações, Atualizações do App e Logout */
.profile-actions-card {
  background-color: var(--bg-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg);
  padding: 20px;
}

.app-updates-box {
  padding-bottom: 18px;
  margin-bottom: 18px;
  border-bottom: 1px solid var(--color-border);
}

.updates-header {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 6px;
}

.updates-icon {
  color: var(--color-accent);
}

.updates-title {
  font-size: 0.95rem;
  font-weight: 700;
  color: var(--text-main);
}

.updates-desc {
  font-size: 0.8rem;
  color: var(--text-muted);
  margin-bottom: 14px;
  line-height: 1.4;
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
  border-radius: var(--radius-md);
  gap: 12px;
  flex-wrap: wrap;
}

.acc-info {
  display: flex;
  align-items: center;
  gap: 10px;
}

.provider-pill {
  font-size: 0.68rem;
  font-weight: 700;
  padding: 3px 8px;
  border-radius: var(--radius-sm);
  text-transform: uppercase;
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
  font-size: 0.85rem;
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
}

.acc-btn {
  padding: 7px 12px;
  font-size: 0.78rem;
}

.btn-disconnect {
  font-size: 0.75rem;
  font-weight: 600;
  color: var(--color-danger);
  padding: 6px 8px;
}

.update-alert-banner {
  display: flex;
  flex-direction: column;
  gap: 10px;
  background: rgba(245, 197, 24, 0.12);
  border: 1px solid rgba(245, 197, 24, 0.4);
  border-radius: var(--radius-md);
  padding: 12px;
  margin-bottom: 12px;
}

@media (min-width: 500px) {
  .update-alert-banner {
    flex-direction: row;
    align-items: center;
    justify-content: space-between;
  }
}

.update-alert-text {
  display: flex;
  flex-direction: column;
  font-size: 0.8rem;
  color: var(--text-main);
}

.update-alert-text span {
  color: var(--text-muted);
  font-size: 0.75rem;
}

.apply-update-btn {
  padding: 8px 14px;
  font-size: 0.8rem;
  white-space: nowrap;
}

.update-feedback-banner {
  background-color: var(--bg-surface-elevated);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  padding: 10px 12px;
  font-size: 0.8rem;
  color: var(--text-main);
  margin-bottom: 12px;
}

.updates-buttons-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 10px;
}

.update-action-btn {
  width: 100%;
  font-size: 0.82rem;
  padding: 10px 12px;
}

.spinning {
  animation: spin 0.9s linear infinite;
}

.logout-section {
  display: flex;
  justify-content: center;
}

.logout-btn {
  width: 100%;
  color: var(--color-danger);
  border-color: rgba(239, 68, 68, 0.25);
}

.logout-btn:hover {
  background-color: rgba(239, 68, 68, 0.1);
}

.loading-state {
  text-align: center;
  padding: 60px 0;
  color: var(--text-muted);
}

.spinner {
  width: 32px;
  height: 32px;
  border: 3px solid var(--color-border);
  border-top-color: var(--color-accent);
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
  margin: 0 auto 12px;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}
</style>
