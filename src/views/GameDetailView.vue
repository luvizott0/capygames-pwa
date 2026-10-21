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
        <button class="back-btn" title="Voltar" @click="goBack">
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
              <span v-if="game.developer && releaseDateText" class="meta-bullet">•</span>
              <span v-if="releaseDateText" class="meta-item mono">{{ releaseDateText }}</span>
            </div>

            <!-- Seletor de Status na Lista -->
            <div class="status-selector">
              <select :value="myStatus?.status || 'none'" class="status-select" @change="onStatusChange">
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

        <!-- Meu Progresso & Conquistas (Se estiver na biblioteca ou tiver conquistas) -->
        <div class="detail-section progress-detail-box">
          <div class="section-header-row">
            <h3 class="section-title">Meu Progresso</h3>
            <span v-if="myStatus?.status" class="season-avg-badge mono">
              {{ getStatusLabel(myStatus.status) }}
            </span>
          </div>

          <div class="progress-stats-grid">
            <!-- Barra de Progresso de Conquistas -->
            <div class="progress-col">
              <div class="progress-header-labels">
                <span class="prog-label">
                  <Trophy :size="15" class="trophy-gold" />
                  <span>Conquistas:</span>
                </span>
                <span class="prog-numbers mono">
                  {{ achievementsEarned }}/{{ totalAchievementsCount }}
                  <template v-if="totalAchievementsCount > 0">
                    ({{ achievementPercent }}%)
                  </template>
                </span>
              </div>
              <div class="detail-progress-bar">
                <div
                  class="detail-progress-fill"
                  :style="{ width: `${achievementPercent}%` }"
                ></div>
              </div>
            </div>

            <!-- Botão de Editar Registro -->
            <div class="progress-action-col">
              <button
                type="button"
                class="season-watch-all-btn"
                @click="isModalOpen = true"
              >
                <Edit3 :size="15" stroke-width="2.5" />
                <span>{{ myStatus ? 'Editar Horas / Nota / Review' : 'Adicionar e Avaliar Jogo' }}</span>
              </button>
            </div>
          </div>
        </div>

        <!-- Sinopse -->
        <div v-if="game.summary" class="detail-section overview-section">
          <h3 class="section-title">Sinopse</h3>
          <p class="overview-text">{{ game.summary }}</p>
        </div>

        <!-- Plataformas Disponíveis para Jogar -->
        <div v-if="availablePlatforms.length > 0" class="detail-section platforms-section">
          <h3 class="section-title">Onde Jogar</h3>
          <div class="platforms-chips-row">
            <div
              v-for="plat in availablePlatforms"
              :key="plat"
              class="platform-chip"
            >
              <PlatformIcon :platform="plat" :size="16" />
              <span>{{ plat }}</span>
            </div>
          </div>
        </div>

        <!-- Recursos do Jogo (Categories / Features) -->
        <div v-if="gameFeatures.length > 0" class="detail-section features-section">
          <h3 class="section-title">Recursos do Jogo</h3>
          <div class="features-chips-row">
            <span
              v-for="feat in gameFeatures"
              :key="feat"
              class="feature-chip"
            >
              <Check :size="13" class="feat-check" />
              <span>{{ feat }}</span>
            </span>
          </div>
        </div>

        <!-- Galeria de Prints / Screenshots -->
        <div v-if="gameScreenshots.length > 0" class="detail-section screenshots-section">
          <h3 class="section-title">Capturas de Tela (Prints)</h3>
          <div class="screenshots-track">
            <div
              v-for="(shot, idx) in gameScreenshots"
              :key="shot.id || idx"
              class="screenshot-thumb-wrapper"
              @click="openImageViewer(shot.full || shot.thumbnail || '')"
            >
              <img
                :src="shot.thumbnail || shot.full"
                :alt="`Print de ${game.title}`"
                class="screenshot-img"
                loading="lazy"
              />
              <div class="screenshot-hover-overlay">
                <Maximize2 :size="18" />
              </div>
            </div>
          </div>
        </div>

        <!-- Amigos que jogam (Label ajustada conforme solicitado) -->
        <div v-if="housemates.length > 0" class="detail-section housemates-section">
          <h3 class="section-title">Amigos que jogam</h3>
          <div class="housemates-avatars">
            <div
              v-for="hm in housemates"
              :key="hm.user.id"
              class="housemate-item"
              :title="`Ver perfil de ${hm.user.name}`"
              @click="goToProfile(hm.user.id)"
            >
              <img
                v-if="hm.user.avatar_url && !failedAvatars[hm.user.id]"
                :src="hm.user.avatar_url"
                :alt="hm.user.name"
                class="hm-avatar"
                @error="failedAvatars[hm.user.id] = true"
              />
              <div v-else class="hm-avatar-placeholder">
                {{ hm.user.name.charAt(0) }}
              </div>
              <span class="hm-name">{{ hm.user.name.split(' ')[0] }}</span>
              <span v-if="hm.rating" class="hm-rating mono">★{{ Number(hm.rating).toFixed(1) }}</span>
            </div>
          </div>
        </div>

        <!-- Avaliações dos Moradores -->
        <div v-if="myStatus?.review || housematesWithReviews.length > 0" class="detail-section reviews-section">
          <h3 class="section-title">Avaliações & Reviews</h3>
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

    <!-- Image Viewer Modal para Prints e Capas em Tela Cheia -->
    <ImageViewerModal
      :is-open="isImageViewerOpen"
      :image-url="currentImageUrl"
      @close="closeImageViewer"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import {
  ArrowLeft,
  Gamepad2,
  Star,
  Users,
  AlertCircle,
  RotateCw,
  Check,
  Edit3,
  Trophy,
  Maximize2
} from 'lucide-vue-next'
import { capyGamesApi, type CapyGame, type CapyUserGame, type GameStatus } from '@/api/capygames'
import { useGamesStore } from '@/stores/games'
import GameStatusModal from '@/components/GameStatusModal.vue'
import ImageViewerModal from '@/components/ImageViewerModal.vue'
import PlatformIcon from '@/components/PlatformIcon.vue'

const route = useRoute()
const router = useRouter()
const gameId = Number(route.params.id)
const gamesStore = useGamesStore()
const failedAvatars = reactive<Record<number, boolean>>({})

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
  return housemates.value.filter(hm => hm.review && hm.user.id !== myStatus.value?.user_id)
})

const releaseDateText = computed(() => {
  return game.value?.raw_data?.release_date || game.value?.release_date || ''
})

const availablePlatforms = computed(() => {
  return game.value?.platforms && game.value.platforms.length > 0
    ? game.value.platforms
    : ['PC']
})

const gameFeatures = computed(() => {
  return game.value?.raw_data?.categories || []
})

const gameScreenshots = computed(() => {
  const shots = game.value?.raw_data?.screenshots || []
  if (shots.length > 0) return shots
  if (game.value?.banner_url) {
    return [{ id: 1, thumbnail: game.value.banner_url, full: game.value.banner_url }]
  }
  return []
})

const achievementsEarned = computed(() => {
  return myStatus.value?.achievements_earned || 0
})

const totalAchievementsCount = computed(() => {
  return myStatus.value?.achievements_total || game.value?.raw_data?.achievements_count || 0
})

const achievementPercent = computed(() => {
  if (totalAchievementsCount.value <= 0) return 0
  return Math.min(100, Math.round((achievementsEarned.value / totalAchievementsCount.value) * 100))
})

async function fetchGameDetails() {
  loading.value = true
  errorMessage.value = null

  try {
    const res = await capyGamesApi.getGame(gameId)
    const data = res.data
    game.value = data.game
    myStatus.value = data.my_status
    communityRating.value = data.community_rating
    totalRatings.value = data.total_ratings
    housemates.value = data.housemates || []
  } catch (err: any) {
    console.error('Erro ao buscar detalhes do jogo:', err)
    errorMessage.value = err.response?.data?.message || 'Falha ao carregar detalhes do jogo.'
  } finally {
    loading.value = false
  }
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

function openImageViewer(url: string) {
  if (!url) return
  currentImageUrl.value = url
  isImageViewerOpen.value = true
}

function closeImageViewer() {
  isImageViewerOpen.value = false
  currentImageUrl.value = ''
}

async function onStatusChange(e: Event) {
  const val = (e.target as HTMLSelectElement).value
  if (!game.value) return

  if (val === 'remove') {
    if (myStatus.value?.id) {
      await capyGamesApi.removeGame(myStatus.value.id)
      myStatus.value = null
      await gamesStore.fetchMyList(true)
    }
    return
  }

  if (val !== 'none') {
    await capyGamesApi.setStatus({
      game_id: game.value.id,
      status: val as GameStatus,
      platform: myStatus.value?.platform || 'PC',
      hours_played: myStatus.value?.hours_played || 0,
      rating: myStatus.value?.rating
    })
    await fetchGameDetails()
    await gamesStore.fetchMyList(true)
  }
}

function handleUpdated() {
  isModalOpen.value = false
  fetchGameDetails()
  gamesStore.fetchMyList(true)
}

function handleRemoved() {
  isModalOpen.value = false
  myStatus.value = null
  fetchGameDetails()
  gamesStore.fetchMyList(true)
}

function getStatusLabel(status: string) {
  const map: Record<string, string> = {
    plan_to_play: 'Quero Jogar',
    playing: 'Jogando',
    completed: 'Zerado',
    mastered: 'Platinado (100%)',
    on_hold: 'Em Pausa',
    dropped: 'Abandonado'
  }
  return map[status] || status
}

onMounted(() => {
  fetchGameDetails()
})
</script>

<style scoped>
.series-detail-page {
  padding-bottom: 60px;
}

.loading-state,
.empty-state-detail {
  min-height: 50vh;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  text-align: center;
  gap: 16px;
  padding: 40px 16px;
  color: var(--text-muted);
}

.backdrop-wrapper {
  position: relative;
  width: 100%;
  height: 280px;
  background-color: var(--bg-surface-elevated);
}

@media (min-width: 768px) {
  .backdrop-wrapper {
    height: 380px;
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
  background: linear-gradient(to bottom, rgba(18, 16, 14, 0.2) 0%, rgba(18, 16, 14, 0.95) 100%);
}

.back-btn {
  position: absolute;
  top: calc(var(--safe-top) + 14px);
  left: 16px;
  width: 38px;
  height: 38px;
  border-radius: var(--radius-sm);
  background-color: rgba(18, 16, 14, 0.7);
  backdrop-filter: blur(8px);
  border: 1px solid var(--color-border);
  color: var(--text-main);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 5;
  cursor: pointer;
  transition: all 0.2s;
}

.back-btn:hover {
  background-color: var(--color-accent);
  color: #12100e;
  border-color: var(--color-accent);
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
  width: 120px;
  aspect-ratio: 2 / 3;
  border-radius: var(--radius-sm);
  overflow: hidden;
  background-color: var(--bg-surface-elevated);
  border: 1px solid var(--color-border);
  box-shadow: 0 10px 25px rgba(0, 0, 0, 0.6);
  flex-shrink: 0;
}

@media (min-width: 640px) {
  .poster-box {
    width: 160px;
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
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.series-title {
  font-size: 1.4rem;
  font-weight: 700;
  color: var(--text-main);
  line-height: 1.2;
}

@media (min-width: 640px) {
  .series-title {
    font-size: 1.8rem;
  }
}

.meta-row {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 0.8rem;
  color: var(--text-muted);
}

.meta-bullet {
  color: var(--text-dim);
}

.status-selector {
  margin-top: 8px;
}

.status-select {
  background-color: var(--bg-surface-elevated);
  border: 1px solid var(--color-border);
  color: var(--color-accent);
  padding: 8px 12px;
  border-radius: var(--radius-sm);
  font-size: 0.82rem;
  font-weight: 600;
  cursor: pointer;
  outline: none;
  transition: border-color 0.2s;
}

.status-select:focus {
  border-color: var(--color-accent);
}

/* Dashboard de Notas */
.ratings-dashboard {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 10px;
  margin-bottom: 24px;
}

.rating-card {
  background-color: var(--bg-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-sm);
  padding: 12px;
  text-align: center;
  display: flex;
  flex-direction: column;
  justify-content: center;
}

.rating-card.highlight {
  border-color: rgba(245, 197, 24, 0.35);
  background: linear-gradient(180deg, rgba(245, 197, 24, 0.08) 0%, var(--bg-surface) 100%);
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
  margin-bottom: 4px;
}

.star-accent {
  color: var(--color-accent);
}

.icon-users {
  color: var(--color-primary-light);
}

.rating-val {
  font-size: 1.25rem;
  font-weight: 700;
  color: var(--text-main);
}

.rating-val-empty {
  font-size: 1.25rem;
  font-weight: 700;
  color: var(--text-dim);
}

.rating-subtext {
  font-size: 0.72rem;
  color: var(--text-muted);
}

.clickable {
  cursor: pointer;
}

/* Seções Gerais */
.detail-section {
  margin-bottom: 24px;
}

.section-title {
  font-size: 1rem;
  font-weight: 700;
  color: var(--text-main);
  margin-bottom: 10px;
  letter-spacing: 0.2px;
}

.overview-text {
  font-size: 0.88rem;
  color: var(--text-muted);
  line-height: 1.6;
}

/* Progresso e Conquistas */
.progress-detail-box {
  background-color: var(--bg-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-sm);
  padding: 16px;
}

.section-header-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 14px;
}

.season-avg-badge {
  background-color: var(--color-accent);
  color: #12100e;
  font-size: 0.75rem;
  font-weight: 700;
  padding: 2px 8px;
  border-radius: var(--radius-sm);
}

.progress-stats-grid {
  display: flex;
  flex-direction: column;
  gap: 14px;
}

@media (min-width: 640px) {
  .progress-stats-grid {
    flex-direction: row;
    align-items: center;
    justify-content: space-between;
  }
}

.progress-col {
  flex: 1;
}

.progress-header-labels {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 0.82rem;
  margin-bottom: 6px;
}

.prog-label {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  color: var(--text-main);
  font-weight: 600;
}

.trophy-gold {
  color: var(--color-accent);
}

.prog-numbers {
  color: var(--text-muted);
  font-size: 0.78rem;
}

.detail-progress-bar {
  width: 100%;
  height: 6px;
  background-color: var(--bg-surface-elevated);
  border-radius: 3px;
  overflow: hidden;
}

.detail-progress-fill {
  height: 100%;
  background: linear-gradient(90deg, var(--color-primary) 0%, var(--color-accent) 100%);
  border-radius: 3px;
  transition: width 0.4s ease;
}

.season-watch-all-btn {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  background-color: var(--bg-surface-elevated);
  border: 1px solid var(--color-border);
  color: var(--text-main);
  padding: 8px 14px;
  border-radius: var(--radius-sm);
  font-size: 0.8rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
  white-space: nowrap;
}

.season-watch-all-btn:hover {
  border-color: var(--color-accent);
  color: var(--color-accent);
}

/* Onde Jogar (Plataformas) */
.platforms-chips-row {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

.platform-chip {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 6px 12px;
  background-color: var(--bg-surface-elevated);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-sm);
  font-size: 0.8rem;
  color: var(--text-main);
  font-weight: 500;
}

/* Recursos do Jogo */
.features-chips-row {
  display: flex;
  gap: 6px;
  flex-wrap: wrap;
}

.feature-chip {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  padding: 4px 10px;
  background-color: var(--bg-surface-elevated);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-sm);
  font-size: 0.75rem;
  color: var(--text-muted);
}

.feat-check {
  color: var(--color-accent);
}

/* Screenshots / Prints */
.screenshots-track {
  display: flex;
  gap: 10px;
  overflow-x: auto;
  padding-bottom: 8px;
  scrollbar-width: none;
}

.screenshots-track::-webkit-scrollbar {
  display: none;
}

.screenshot-thumb-wrapper {
  position: relative;
  flex: 0 0 200px;
  width: 200px;
  aspect-ratio: 16 / 9;
  border-radius: var(--radius-sm);
  overflow: hidden;
  background-color: var(--bg-surface-elevated);
  border: 1px solid var(--color-border);
  cursor: pointer;
  transition: border-color 0.2s;
}

@media (min-width: 640px) {
  .screenshot-thumb-wrapper {
    flex: 0 0 260px;
    width: 260px;
  }
}

.screenshot-thumb-wrapper:hover {
  border-color: var(--color-accent);
}

.screenshot-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.screenshot-hover-overlay {
  position: absolute;
  inset: 0;
  background: rgba(0, 0, 0, 0.4);
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--color-accent);
  opacity: 0;
  transition: opacity 0.2s;
}

.screenshot-thumb-wrapper:hover .screenshot-hover-overlay {
  opacity: 1;
}

/* Amigos que Jogam */
.housemates-avatars {
  display: flex;
  gap: 12px;
  overflow-x: auto;
  padding-bottom: 6px;
  scrollbar-width: none;
}

.housemates-avatars::-webkit-scrollbar {
  display: none;
}

.housemate-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  cursor: pointer;
}

.hm-avatar {
  width: 44px;
  height: 44px;
  border-radius: var(--radius-sm);
  object-fit: cover;
  border: 1px solid var(--color-border);
}

.hm-avatar-placeholder {
  width: 44px;
  height: 44px;
  border-radius: var(--radius-sm);
  background-color: var(--bg-surface-elevated);
  border: 1px solid var(--color-border);
  color: var(--color-accent);
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 700;
  font-size: 1.1rem;
}

.hm-name {
  font-size: 0.72rem;
  color: var(--text-muted);
  max-width: 50px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.hm-rating {
  font-size: 0.65rem;
  color: var(--color-accent);
  font-weight: 700;
}

/* Reviews */
.episodes-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.review-card {
  background-color: var(--bg-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-sm);
  padding: 12px 16px;
}

.review-card.highlight {
  border-color: rgba(245, 197, 24, 0.35);
  background: linear-gradient(180deg, rgba(245, 197, 24, 0.05) 0%, var(--bg-surface) 100%);
}

.review-card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 6px;
}

.review-author {
  font-size: 0.84rem;
  font-weight: 600;
  color: var(--text-main);
}

.review-body {
  font-size: 0.84rem;
  color: var(--text-muted);
  line-height: 1.5;
  font-style: italic;
}
</style>
