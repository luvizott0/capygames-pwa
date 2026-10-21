<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { capyGamesApi, type CapyGame, type CapyUserGame } from '@/api/capygames'
import GameStatusModal from '@/components/GameStatusModal.vue'
import { ArrowLeft, Star, Clock, Trophy, Users, Edit3, Plus, Gamepad2, RefreshCw } from 'lucide-vue-next'

const route = useRoute()
const router = useRouter()

const gameId = computed(() => Number(route.params.id))
const game = ref<CapyGame | null>(null)
const myStatus = ref<CapyUserGame | null>(null)
const communityRating = ref<number | null>(null)
const totalRatings = ref(0)
const housemates = ref<any[]>([])

const isLoading = ref(true)
const isModalOpen = ref(false)

async function fetchDetails() {
  isLoading.value = true
  try {
    const res = await capyGamesApi.getGame(gameId.value)
    game.value = res.data.game
    myStatus.value = res.data.my_status
    communityRating.value = res.data.community_rating
    totalRatings.value = res.data.total_ratings
    housemates.value = res.data.housemates
  } catch (err) {
    console.error('Falha ao carregar jogo:', err)
  } finally {
    isLoading.value = false
  }
}

function handleUpdated(ug: CapyUserGame) {
  myStatus.value = ug
  fetchDetails()
}

function handleRemoved() {
  myStatus.value = null
  fetchDetails()
}

const statusText = (s: string) => {
  switch (s) {
    case 'mastered': return '🏆 Platinado'
    case 'completed': return '🏁 Zerado'
    case 'playing': return '🎮 Jogando'
    case 'plan_to_play': return '📌 A Jogar'
    case 'on_hold': return '⏸️ Em Pausa'
    case 'dropped': return '🛑 Abandonado'
    default: return s
  }
}

onMounted(() => {
  fetchDetails()
})
</script>

<template>
  <div class="game-detail-view">
    <div v-if="isLoading" class="loading-state container">
      <RefreshCw :size="32" class="spin text-accent" />
      <p>Carregando informações do jogo...</p>
    </div>

    <div v-else-if="!game" class="empty-state container">
      <p>Jogo não encontrado.</p>
      <button class="btn-back" @click="router.push('/')">Voltar</button>
    </div>

    <div v-else class="fade-in">
      <!-- Hero Banner -->
      <div class="hero-banner">
        <img
          :src="game.banner_url || game.cover_url || 'https://images.unsplash.com/photo-1550745165-9bc0b252726f?auto=format&fit=crop&w=1200&q=80'"
          class="banner-bg"
        />
        <div class="banner-gradient"></div>

        <button class="nav-back-btn" @click="router.back()">
          <ArrowLeft :size="20" />
        </button>
      </div>

      <div class="container content-container">
        <!-- Main Game Card Header -->
        <div class="header-card">
          <img
            :src="game.cover_url || 'https://images.unsplash.com/photo-1550745165-9bc0b252726f?auto=format&fit=crop&w=400&q=80'"
            class="poster-img"
          />

          <div class="header-details">
            <h1 class="game-title">{{ game.title }}</h1>
            <p v-if="game.developer" class="developer-text">{{ game.developer }}</p>

            <div class="badges-row">
              <span v-if="communityRating" class="badge-rating mono">
                <Star :size="13" fill="currentColor" />
                {{ communityRating }} / 10
              </span>
              <span v-if="game.platforms" class="platform-badge">
                {{ game.platforms.join(' • ') }}
              </span>
            </div>

            <!-- Action Button -->
            <button class="action-btn" @click="isModalOpen = true">
              <template v-if="myStatus">
                <Edit3 :size="16" />
                <span>{{ statusText(myStatus.status) }} (Editar)</span>
              </template>
              <template v-else>
                <Plus :size="16" />
                <span>Adicionar à Biblioteca</span>
              </template>
            </button>
          </div>
        </div>

        <!-- My Review & Stats if registered -->
        <div v-if="myStatus" class="my-status-box">
          <div class="my-status-header">
            <h3>Seu Registro</h3>
            <span class="status-pill" :class="myStatus.status">
              {{ statusText(myStatus.status) }}
            </span>
          </div>

          <div class="status-metrics">
            <div v-if="myStatus.rating" class="metric-item">
              <span class="metric-label">Sua Nota</span>
              <span class="metric-value mono text-gold">
                <Star :size="14" fill="#fbbf24" />
                {{ myStatus.rating }} / 10
              </span>
            </div>

            <div class="metric-item">
              <span class="metric-label">Tempo Jogado</span>
              <span class="metric-value mono">
                <Clock :size="14" class="text-accent" />
                {{ myStatus.hours_played }} horas
              </span>
            </div>

            <div v-if="myStatus.platform" class="metric-item">
              <span class="metric-label">Plataforma</span>
              <span class="metric-value">{{ myStatus.platform }}</span>
            </div>
          </div>

          <div v-if="myStatus.review" class="my-review-box">
            <span class="review-title">Sua Análise:</span>
            <p>"{{ myStatus.review }}"</p>
          </div>
        </div>

        <!-- Sinopse -->
        <div v-if="game.summary" class="section-box">
          <h2 class="section-heading">Sobre o Jogo</h2>
          <p class="summary-text">{{ game.summary }}</p>
        </div>

        <!-- Housemates who play this game -->
        <div class="section-box">
          <div class="section-heading-row">
            <h2 class="section-heading">
              <Users :size="18" class="text-accent" />
              <span>Moradores da CapiHouse que jogam ({{ housemates.length }})</span>
            </h2>
          </div>

          <div v-if="housemates.length === 0" class="no-housemates">
            <p>Nenhum outro morador adicionou este jogo ainda.</p>
          </div>

          <div v-else class="housemates-list">
            <div
              v-for="hm in housemates"
              :key="hm.user.id"
              class="housemate-item"
              @click="router.push(`/user/${hm.user.id}`)"
            >
              <img
                :src="hm.user.avatar_url || 'https://api.dicebear.com/7.x/bottts/svg?seed=' + hm.user.username"
                class="hm-avatar"
              />
              <div class="hm-info">
                <span class="hm-name">{{ hm.user.name }}</span>
                <span class="hm-status">{{ statusText(hm.status) }}</span>
              </div>

              <div class="hm-meta">
                <span v-if="hm.rating" class="hm-rating mono">
                  <Star :size="11" fill="#fbbf24" />
                  {{ hm.rating }}
                </span>
                <span v-if="hm.hours_played > 0" class="hm-hours mono">
                  {{ hm.hours_played }}h
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Modal de Edição -->
    <GameStatusModal
      :is-open="isModalOpen"
      :user-game="myStatus"
      :game-candidate="myStatus ? null : game"
      @close="isModalOpen = false"
      @updated="handleUpdated"
      @removed="handleRemoved"
    />
  </div>
</template>

<style scoped>
.game-detail-view {
  padding-bottom: 40px;
}

.hero-banner {
  position: relative;
  width: 100%;
  height: 240px;
  overflow: hidden;
}

.banner-bg {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.banner-gradient {
  position: absolute;
  inset: 0;
  background: linear-gradient(180deg, rgba(12, 10, 20, 0.4) 0%, rgba(12, 10, 20, 1) 100%);
}

.nav-back-btn {
  position: absolute;
  top: 16px;
  left: 16px;
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background: rgba(12, 10, 20, 0.6);
  backdrop-filter: blur(8px);
  border: 1px solid var(--color-border);
  color: var(--text-main);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 10;
}

.content-container {
  margin-top: -60px;
  position: relative;
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.header-card {
  display: flex;
  gap: 16px;
  background: var(--bg-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg);
  padding: 16px;
  box-shadow: 0 12px 30px rgba(0, 0, 0, 0.5);
}

.poster-img {
  width: 100px;
  height: 145px;
  border-radius: var(--radius-md);
  object-fit: cover;
  box-shadow: 0 6px 16px rgba(0, 0, 0, 0.4);
  flex-shrink: 0;
}

.header-details {
  display: flex;
  flex-direction: column;
  justify-content: center;
  gap: 8px;
  overflow: hidden;
}

.game-title {
  font-size: 1.25rem;
  font-weight: 800;
  color: var(--text-main);
  line-height: 1.2;
}

.developer-text {
  font-size: 0.8rem;
  color: var(--text-muted);
}

.badges-row {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 8px;
}

.platform-badge {
  font-size: 0.72rem;
  color: var(--text-muted);
  background: var(--bg-surface-elevated);
  border: 1px solid var(--color-border);
  padding: 3px 10px;
  border-radius: var(--radius-full);
}

.action-btn {
  align-self: flex-start;
  margin-top: 6px;
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 9px 18px;
  background: var(--color-accent);
  color: #0c0a14;
  border-radius: var(--radius-full);
  font-size: 0.84rem;
  font-weight: 700;
  transition: all 0.2s ease;
  box-shadow: 0 4px 14px rgba(168, 85, 247, 0.35);
}

.action-btn:hover {
  background: var(--color-accent-hover);
  transform: translateY(-1px);
}

.my-status-box {
  background: var(--bg-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg);
  padding: 18px;
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.my-status-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.my-status-header h3 {
  font-size: 0.95rem;
  font-weight: 700;
  color: var(--text-main);
}

.status-pill {
  font-size: 0.72rem;
  font-weight: 700;
  padding: 3px 10px;
  border-radius: var(--radius-full);
  background: var(--bg-surface-elevated);
  color: var(--text-main);
}

.status-metrics {
  display: flex;
  gap: 20px;
  border-top: 1px solid var(--color-border-subtle);
  padding-top: 12px;
}

.metric-item {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.metric-label {
  font-size: 0.72rem;
  color: var(--text-dim);
  text-transform: uppercase;
}

.metric-value {
  font-size: 0.95rem;
  font-weight: 700;
  display: flex;
  align-items: center;
  gap: 4px;
}

.text-gold {
  color: #fbbf24;
}

.my-review-box {
  background: var(--bg-surface-elevated);
  border-left: 3px solid var(--color-accent);
  padding: 10px 14px;
  border-radius: 0 var(--radius-sm) var(--radius-sm) 0;
  font-size: 0.88rem;
  color: #e2d9f3;
  font-style: italic;
}

.review-title {
  display: block;
  font-size: 0.72rem;
  font-style: normal;
  font-weight: 700;
  color: var(--text-dim);
  margin-bottom: 4px;
  text-transform: uppercase;
}

.section-box {
  background: var(--bg-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  padding: 18px;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.section-heading {
  font-size: 1rem;
  font-weight: 700;
  color: var(--text-main);
  display: flex;
  align-items: center;
  gap: 8px;
}

.summary-text {
  font-size: 0.88rem;
  color: var(--text-muted);
  line-height: 1.6;
}

.housemates-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.housemate-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 8px 12px;
  background: var(--bg-surface-elevated);
  border-radius: var(--radius-sm);
  cursor: pointer;
  transition: background 0.2s ease;
}

.housemate-item:hover {
  background: var(--bg-surface-hover);
}

.hm-avatar {
  width: 34px;
  height: 34px;
  border-radius: 50%;
  object-fit: cover;
  margin-right: 10px;
}

.hm-info {
  display: flex;
  flex-direction: column;
  flex: 1;
}

.hm-name {
  font-size: 0.85rem;
  font-weight: 700;
  color: var(--text-main);
}

.hm-status {
  font-size: 0.72rem;
  color: var(--text-muted);
}

.hm-meta {
  display: flex;
  align-items: center;
  gap: 8px;
}

.hm-rating {
  font-size: 0.78rem;
  color: #fbbf24;
  display: flex;
  align-items: center;
  gap: 3px;
  font-weight: 700;
}

.hm-hours {
  font-size: 0.75rem;
  color: var(--color-accent);
}

.no-housemates {
  padding: 16px 0;
  text-align: center;
  font-size: 0.85rem;
  color: var(--text-muted);
}

.loading-state,
.empty-state {
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
</style>
