<template>
  <div class="series-detail-page">
    <div v-if="loading" class="loading-state">
      <div class="spinner"></div>
      <p>Carregando jogo...</p>
    </div>

    <div v-else-if="game" class="detail-container fade-in">
      <!-- Backdrop Banner Header -->
      <div class="backdrop-wrapper">
        <img
          v-if="game.banner_url || game.cover_url"
          :src="game.banner_url || game.cover_url"
          :alt="game.title"
          class="backdrop-img clickable"
          @click="openImageViewer((game.banner_url || game.cover_url)!)"
        />
        <div class="backdrop-overlay"></div>
        <button class="back-btn" @click="goBack">
          <ArrowLeft :size="20" />
        </button>
      </div>

      <div class="container main-content">
        <!-- Header Info (Pôster + Título + Status) -->
        <div class="series-header-info">
          <div class="poster-box">
            <img
              v-if="game.cover_url"
              :src="game.cover_url"
              :alt="game.title"
              class="poster-img clickable"
              @click="openImageViewer(game.cover_url)"
            />
            <div v-else class="poster-placeholder">
              <Gamepad2 :size="40" />
            </div>
          </div>

          <div class="titles-box">
            <h1 class="series-title">{{ game.title }}</h1>
            <div class="meta-row">
              <span v-if="game.developer" class="meta-item">{{ game.developer }}</span>
              <span v-if="game.developer" class="meta-bullet">•</span>
              <span class="meta-item mono">{{ (game.platforms || ['PC']).join(', ') }}</span>
            </div>

            <!-- Seletor de Status na Lista -->
            <div class="status-selector">
              <select :value="myStatus?.status || 'none'" @change="onStatusChange" class="status-select">
                <option value="none">+ Adicionar à Lista</option>
                <option value="plan_to_play">📌 Quero Jogar</option>
                <option value="playing">▶ Jogando</option>
                <option value="completed">✓ Zerado</option>
                <option value="mastered">🏆 Platinado (100%)</option>
                <option value="on_hold">⏸ Em Pausa</option>
                <option value="dropped">✕ Abandonado</option>
                <option v-if="myStatus" value="remove">Remover da Lista</option>
              </select>
            </div>
          </div>
        </div>

        <!-- Bloco de Médias de Notas (Estilo CapyShowTime) -->
        <div class="ratings-dashboard">
          <!-- 1. Sua Nota do Jogo -->
          <div class="rating-card highlight clickable" @click="isModalOpen = true">
            <span class="rating-label">Sua Nota</span>
            <div class="rating-value-box">
              <Star :size="22" class="star-accent" fill="currentColor" />
              <span v-if="myStatus?.rating" class="rating-val mono">
                {{ Number(myStatus.rating).toFixed(1) }}
              </span>
              <span v-else class="rating-val-empty mono">--</span>
            </div>
            <span class="rating-subtext">Toque para avaliar</span>
          </div>

          <!-- 2. Média da Capihouse (Comunidade) -->
          <div class="rating-card">
            <span class="rating-label">Capihouse</span>
            <div class="rating-value-box">
              <Users :size="20" class="icon-users" />
              <span v-if="communityRating" class="rating-val mono">
                {{ Number(communityRating).toFixed(1) }}
              </span>
              <span v-else class="rating-val-empty mono">--</span>
            </div>
            <span class="rating-subtext">Média dos amigos ({{ totalRatings }})</span>
          </div>

          <!-- 3. Tempo Jogado -->
          <div class="rating-card clickable" @click="isModalOpen = true">
            <span class="rating-label">Seu Tempo</span>
            <div class="rating-value-box">
              <span class="rating-val mono">{{ myStatus?.hours_played || 0 }}h</span>
            </div>
            <span class="rating-subtext">{{ myStatus?.platform || 'Registrar horas' }}</span>
          </div>
        </div>

        <!-- Sinopse -->
        <div v-if="game.summary" class="overview-section">
          <h3 class="section-title">Sinopse</h3>
          <p class="overview-text">{{ game.summary }}</p>
        </div>

        <!-- Amigos que jogam -->
        <div v-if="housemates.length > 0" class="housemates-section">
          <h3 class="section-title">Amigos que acompanham</h3>
          <div class="housemates-avatars">
            <div
              v-for="hm in housemates"
              :key="hm.user.id"
              class="housemate-item"
              :title="`Ver perfil de ${hm.user.name}`"
              @click="goToProfile(hm.user.id)"
            >
              <img
                v-if="hm.user.avatar_url"
                :src="hm.user.avatar_url"
                :alt="hm.user.name"
                class="hm-avatar"
              />
              <div v-else class="hm-avatar-placeholder">
                {{ hm.user.name.charAt(0) }}
              </div>
              <span class="hm-name">{{ hm.user.name.split(' ')[0] }}</span>
            </div>
          </div>
        </div>

        <!-- Seção de Progresso, Conquistas e Análises -->
        <div class="seasons-section">
          <div class="seasons-tabs-header">
            <h3 class="section-title">Progresso & Avaliações</h3>
            <span v-if="myStatus?.status" class="season-avg-badge mono">
              {{ getStatusLabel(myStatus.status) }}
            </span>
          </div>

          <!-- Barra de Ações do Jogo -->
          <div class="season-action-bar">
            <div class="season-info-count">
              <span class="mono count-text">
                {{ myStatus ? `${myStatus.hours_played || 0}h em ${myStatus.platform || 'PC'}` : 'Ainda não está na sua lista' }}
              </span>
              <span
                v-if="myStatus && (myStatus.status === 'completed' || myStatus.status === 'mastered')"
                class="season-completed-badge mono"
              >
                <Check :size="12" stroke-width="3" />
                {{ myStatus.status === 'mastered' ? 'Platinado' : 'Zerado' }}
              </span>
            </div>

            <button
              type="button"
              class="season-watch-all-btn"
              :class="{ 'all-watched': myStatus && (myStatus.status === 'completed' || myStatus.status === 'mastered') }"
              @click="isModalOpen = true"
            >
              <Edit3 :size="15" stroke-width="2.5" />
              <span>{{ myStatus ? 'Editar Horas / Nota / Review' : 'Adicionar e Avaliar Jogo' }}</span>
            </button>
          </div>

          <!-- Lista de Análises dos Moradores -->
          <div class="episodes-list">
            <div v-if="myStatus?.review" class="review-card highlight">
              <div class="review-card-header">
                <span class="review-author mono">Sua Análise</span>
                <span v-if="myStatus.rating" class="badge-rating mono">★ {{ Number(myStatus.rating).toFixed(1) }}</span>
              </div>
              <p class="review-body">"{{ myStatus.review }}"</p>
            </div>

            <div
              v-for="hm in housematesWithReviews"
              :key="hm.user.id"
              class="review-card"
              @click="goToProfile(hm.user.id)"
            >
              <div class="review-card-header">
                <span class="review-author">{{ hm.user.name }}</span>
                <span v-if="hm.rating" class="badge-rating mono">★ {{ Number(hm.rating).toFixed(1) }}</span>
              </div>
              <p class="review-body">"{{ hm.review }}"</p>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Estado de Erro / Não Encontrado -->
    <div v-else class="container empty-state-detail fade-in">
      <div class="empty-icon-box">
        <AlertCircle :size="48" class="error-icon" />
      </div>
      <h3 class="error-title">Jogo não encontrado</h3>
      <p class="error-desc">{{ errorMessage || 'Não foi possível carregar as informações deste jogo.' }}</p>
      <div class="error-actions">
        <button class="btn-primary" @click="fetchGameDetails">
          <RotateCw :size="16" />
          <span>Tentar Novamente</span>
        </button>
        <button class="btn-secondary" @click="goBack">
          <span>Voltar</span>
        </button>
      </div>
    </div>

    <!-- Modal de Edição de Status / Nota / Review -->
    <GameStatusModal
      :is-open="isModalOpen"
      :user-game="myStatus"
      :game-candidate="myStatus ? null : (game as any)"
      @close="isModalOpen = false"
      @updated="handleUpdated"
      @removed="handleRemoved"
    />

    <!-- Image Viewer Modal -->
    <ImageViewerModal
      :is-open="isImageViewerOpen"
      :image-url="currentImageUrl"
      @close="closeImageViewer"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ArrowLeft, Gamepad2, Star, Users, AlertCircle, RotateCw, Check, Edit3 } from 'lucide-vue-next'
import { capyGamesApi, type CapyGame, type CapyUserGame, type GameStatus } from '@/api/capygames'
import { useGamesStore } from '@/stores/games'
import GameStatusModal from '@/components/GameStatusModal.vue'
import ImageViewerModal from '@/components/ImageViewerModal.vue'

const route = useRoute()
const router = useRouter()
const gameId = Number(route.params.id)
const gamesStore = useGamesStore()

const loading = ref(true)
const errorMessage = ref<string | null>(null)
const game = ref<CapyGame | null>(null)
const myStatus = ref<CapyUserGame | null>(null)
const communityRating = ref<number | null>(null)
const totalRatings = ref(0)
const housemates = ref<any[]>([])

const isModalOpen = ref(false)
const isImageViewerOpen = ref(false)
const currentImageUrl = ref('')

const housematesWithReviews = computed(() => {
  return housemates.value.filter(hm => hm.review)
})

function openImageViewer(url: string) {
  currentImageUrl.value = url
  isImageViewerOpen.value = true
}

function closeImageViewer() {
  isImageViewerOpen.value = false
  currentImageUrl.value = ''
}

function goBack() {
  if (window.history.length > 1) {
    router.back()
  } else {
    router.push('/')
  }
}

function goToProfile(userId: number) {
  router.push(`/profile/${userId}`)
}

function getStatusLabel(status: string): string {
  switch (status) {
    case 'plan_to_play': return 'Quero Jogar'
    case 'playing': return 'Jogando'
    case 'completed': return 'Zerado'
    case 'mastered': return 'Platinado 100%'
    case 'on_hold': return 'Em Pausa'
    case 'dropped': return 'Abandonado'
    default: return status
  }
}

async function fetchGameDetails() {
  loading.value = true
  errorMessage.value = null
  try {
    const res = await capyGamesApi.getGame(gameId)
    if (!res.data || !res.data.game) {
      throw new Error('Jogo não encontrado')
    }
    game.value = res.data.game
    myStatus.value = res.data.my_status || null
    communityRating.value = res.data.community_rating || null
    totalRatings.value = res.data.total_ratings || 0
    housemates.value = res.data.housemates || []
  } catch (err: any) {
    console.error('Erro ao carregar jogo:', err)
    errorMessage.value = err.response?.data?.message || err.message || 'Não foi possível carregar as informações deste jogo.'
  } finally {
    loading.value = false
  }
}

async function onStatusChange(e: Event) {
  const target = e.target as HTMLSelectElement
  const val = target.value
  if (val === 'none') return

  if (val === 'remove' && myStatus.value) {
    try {
      await capyGamesApi.removeGame(myStatus.value.id)
      myStatus.value = null
      gamesStore.invalidateAllCache()
      await fetchGameDetails()
    } catch (err) {
      console.error('Erro ao remover jogo:', err)
    }
    return
  }

  try {
    const res = await capyGamesApi.setStatus({
      game_id: game.value?.id,
      status: val as GameStatus,
      platform: myStatus.value?.platform || game.value?.platforms?.[0] || 'PC',
      hours_played: myStatus.value?.hours_played || 0,
      rating: myStatus.value?.rating ?? null,
      review: myStatus.value?.review ?? null
    })
    myStatus.value = res.data.user_game
    gamesStore.invalidateAllCache()
    await fetchGameDetails()
  } catch (err) {
    console.error('Erro ao alterar status:', err)
  }
}

function handleUpdated(ug: CapyUserGame) {
  myStatus.value = ug
  gamesStore.invalidateAllCache()
  fetchGameDetails()
}

function handleRemoved() {
  myStatus.value = null
  gamesStore.invalidateAllCache()
  fetchGameDetails()
}

onMounted(() => {
  fetchGameDetails()
})
</script>

<style scoped>
.series-detail-page {
  padding-bottom: 90px;
}

.backdrop-wrapper {
  position: relative;
  width: 100%;
  height: calc(220px + var(--safe-top));
  background-color: var(--bg-surface-elevated);
  overflow: hidden;
}

@media (min-width: 640px) {
  .backdrop-wrapper {
    height: calc(320px + var(--safe-top));
  }
}

.backdrop-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.backdrop-overlay {
  position: absolute;
  inset: 0;
  background: linear-gradient(to bottom, rgba(15, 13, 21, 0.2) 0%, rgba(15, 13, 21, 0.95) 100%);
}

.back-btn {
  position: absolute;
  top: calc(var(--safe-top) + 14px);
  left: 16px;
  width: 38px;
  height: 38px;
  border-radius: var(--radius-full);
  background-color: rgba(0, 0, 0, 0.6);
  backdrop-filter: blur(8px);
  color: var(--text-main);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 5;
}

.main-content {
  margin-top: -60px;
  position: relative;
  z-index: 10;
}

.series-header-info {
  display: flex;
  gap: 16px;
  align-items: flex-end;
  margin-bottom: 24px;
}

.poster-box {
  width: 110px;
  height: 160px;
  border-radius: var(--radius-md);
  overflow: hidden;
  box-shadow: 0 10px 25px rgba(0, 0, 0, 0.6);
  flex-shrink: 0;
  border: 1px solid var(--color-border);
  background-color: var(--bg-surface);
}

@media (min-width: 640px) {
  .poster-box {
    width: 140px;
    height: 200px;
  }
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

.titles-box {
  flex: 1;
}

.series-title {
  font-size: 1.4rem;
  font-weight: 800;
  color: var(--text-main);
  line-height: 1.2;
  margin-bottom: 6px;
}

.meta-row {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 0.8rem;
  color: var(--text-muted);
  margin-bottom: 12px;
  flex-wrap: wrap;
}

.meta-bullet {
  color: var(--text-dim);
}

.status-select {
  background-color: var(--bg-surface-elevated);
  border: 1px solid var(--color-border);
  color: var(--text-main);
  padding: 8px 12px;
  border-radius: var(--radius-md);
  font-size: 0.85rem;
  font-weight: 600;
  outline: none;
  cursor: pointer;
}

/* Dashboard de Notas */
.ratings-dashboard {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 12px;
  margin-bottom: 24px;
}

.rating-card {
  background-color: var(--bg-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  padding: 12px;
  text-align: center;
  display: flex;
  flex-direction: column;
  justify-content: center;
}

.rating-card.highlight {
  border-color: rgba(192, 132, 252, 0.35);
  background: linear-gradient(180deg, rgba(192, 132, 252, 0.08) 0%, var(--bg-surface) 100%);
}

.rating-label {
  font-size: 0.72rem;
  font-weight: 600;
  color: var(--text-muted);
  text-transform: uppercase;
  margin-bottom: 4px;
}

.rating-value-box {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 4px;
}

.star-accent {
  color: var(--color-accent);
}

.icon-users {
  color: var(--color-primary-light);
}

.rating-val {
  font-size: 1.5rem;
  font-weight: 700;
  color: var(--text-main);
}

.rating-val-empty {
  font-size: 1.2rem;
  color: var(--text-dim);
}

.rating-subtext {
  font-size: 0.68rem;
  color: var(--text-dim);
  margin-top: 2px;
}

.overview-section, .housemates-section {
  margin-bottom: 24px;
}

.section-title {
  font-size: 1rem;
  font-weight: 700;
  color: var(--text-main);
  margin-bottom: 8px;
}

.overview-text {
  font-size: 0.88rem;
  color: var(--text-muted);
  line-height: 1.5;
}

.housemates-avatars {
  display: flex;
  gap: 12px;
  overflow-x: auto;
  padding: 4px 0;
}

.housemate-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  cursor: pointer;
  transition: transform 0.15s ease;
}

.housemate-item:hover {
  transform: translateY(-2px);
}

.hm-avatar {
  width: 38px;
  height: 38px;
  border-radius: 50%;
  object-fit: cover;
  border: 1px solid var(--color-border);
}

.hm-avatar-placeholder {
  width: 38px;
  height: 38px;
  border-radius: 50%;
  background-color: var(--color-primary);
  color: #fff;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 700;
  font-size: 0.9rem;
}

.hm-name {
  font-size: 0.7rem;
  color: var(--text-dim);
}

/* Progresso & Análises */
.seasons-section {
  margin-top: 28px;
}

.seasons-tabs-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}

.season-avg-badge {
  background-color: var(--color-accent);
  color: #0f0d15;
  font-size: 0.75rem;
  font-weight: 700;
  padding: 2px 8px;
  border-radius: var(--radius-sm);
}

.season-action-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 14px;
  gap: 12px;
  flex-wrap: wrap;
}

.season-info-count {
  display: flex;
  align-items: center;
  gap: 8px;
}

.count-text {
  font-size: 0.8rem;
  color: var(--text-dim);
}

.season-completed-badge {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  font-size: 0.72rem;
  font-weight: 700;
  color: #0f0d15;
  background-color: var(--color-accent);
  padding: 2px 7px;
  border-radius: var(--radius-sm);
}

.season-watch-all-btn {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  background-color: var(--bg-surface-elevated);
  border: 1px solid var(--color-border);
  color: var(--text-main);
  padding: 6px 12px;
  border-radius: var(--radius-full);
  font-size: 0.78rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
}

.season-watch-all-btn:hover:not(:disabled) {
  border-color: var(--color-accent);
  color: var(--color-accent);
}

.season-watch-all-btn.all-watched {
  background-color: rgba(192, 132, 252, 0.15);
  border-color: var(--color-accent);
  color: var(--color-accent);
}

.episodes-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.review-card {
  background-color: var(--bg-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  padding: 14px;
  cursor: pointer;
}

.review-card.highlight {
  border-color: rgba(192, 132, 252, 0.35);
}

.review-card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 6px;
}

.review-author {
  font-size: 0.85rem;
  font-weight: 700;
  color: var(--text-main);
}

.review-body {
  font-size: 0.85rem;
  color: var(--text-muted);
  font-style: italic;
  line-height: 1.4;
}

.loading-state {
  text-align: center;
  padding: 40px 0;
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

.empty-state-detail {
  text-align: center;
  padding: 80px 20px;
}

.empty-icon-box {
  width: 80px;
  height: 80px;
  background-color: var(--bg-surface-elevated);
  border-radius: var(--radius-full);
  display: inline-flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 16px;
}

.error-icon {
  color: var(--color-danger);
}

.error-title {
  font-size: 1.3rem;
  font-weight: 700;
  margin-bottom: 8px;
  color: var(--text-main);
}

.error-desc {
  color: var(--text-muted);
  font-size: 0.9rem;
  max-width: 400px;
  margin: 0 auto 24px;
}

.error-actions {
  display: flex;
  justify-content: center;
  gap: 12px;
}

.clickable {
  cursor: pointer;
}
</style>
