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

            <!-- Botões de Ação na Lista & Status -->
            <div class="detail-actions-bar">
              <!-- Botão Adicionar à Lista / Na Lista (Substitui com ícone de remover/check) -->
              <button
                type="button"
                class="btn-list-toggle"
                :class="{ 'in-list': isInList }"
                :disabled="isTogglingList"
                @click="handleToggleList"
                :title="isInList ? 'Clique para remover da sua lista' : 'Adicionar à sua lista de jogos a jogar'"
              >
                <BookmarkCheck v-if="isInList" :size="16" class="icon-in-list" />
                <Plus v-else :size="16" />
                <span>{{ isInList ? 'Na Lista' : 'Adicionar à Lista' }}</span>
              </button>

              <!-- Status Atual do Jogo (Jogando, Zerado, Platinado, Em Pausa, Abandonado) -->
              <div v-if="myStatus?.status && myStatus.status !== 'plan_to_play'" class="status-indicator-badge" :class="`badge-${effectiveStatus}`">
                <span>{{ getStatusLabel(effectiveStatus) }}</span>
              </div>

              <!-- Ações Rápidas -->
              <div class="quick-status-actions">
                <button
                  v-if="effectiveStatus !== 'completed' && effectiveStatus !== 'mastered'"
                  type="button"
                  class="btn-quick-status"
                  title="Marcar como Zerado"
                  @click="markStatus('completed')"
                >
                  <Trophy :size="14" />
                  <span>Zerar</span>
                </button>

                <button
                  v-if="effectiveStatus === 'playing' || effectiveStatus === 'on_hold'"
                  type="button"
                  class="btn-quick-status danger"
                  title="Marcar como Abandonado"
                  @click="markStatus('dropped')"
                >
                  <Ban :size="14" />
                  <span>Abandonar</span>
                </button>

                <button
                  v-if="effectiveStatus === 'dropped'"
                  type="button"
                  class="btn-quick-status"
                  title="Retomar Jogatina"
                  @click="markStatus('playing')"
                >
                  <Play :size="14" />
                  <span>Retomar</span>
                </button>
              </div>
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

          <!-- 3. Tempo Jogado (Soma de Todas as Plataformas) -->
          <div class="rating-card clickable" @click="isModalOpen = true">
            <span class="rating-label">Seu Tempo</span>
            <div class="rating-value-box">
              <span v-if="totalPlatformHours > 0" class="rating-val mono">{{ totalPlatformHours }}h</span>
              <span v-else class="rating-val-empty mono">--</span>
            </div>
            <span class="rating-subtext" :title="platformHoursBreakdown">{{ totalPlatformHours > 0 ? platformHoursSubtext : 'Toque para registrar' }}</span>
          </div>
        </div>

        <!-- Amigos que jogam -->
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

        <!-- Meu Progresso & Conquistas (Se estiver na biblioteca ou tiver progresso) -->
        <div class="detail-section progress-detail-box">
          <div class="section-header-row">
            <div class="progress-title-group">
              <Trophy :size="18" class="trophy-gold" />
              <h3 class="section-title">Meu Progresso</h3>
            </div>
            <span v-if="myStatus?.status" class="status-indicator-badge-mini mono" :class="`badge-${effectiveStatus}`">
              {{ getStatusLabel(effectiveStatus) }}
            </span>
          </div>

          <!-- Barra de Progresso Principal -->
          <div class="progress-bar-card">
            <div class="progress-bar-header">
              <span class="prog-main-title">Conclusão</span>
              <span class="prog-main-percent mono">{{ achievementPercent }}%</span>
            </div>
            <div class="detail-progress-bar">
              <div
                class="detail-progress-fill"
                :style="{ width: `${achievementPercent}%` }"
              ></div>
            </div>
          </div>

          <!-- Grade de Métricas (Conquistas, Gamerscore, Horas) -->
          <div v-if="hasProgressMetrics" class="progress-metrics-grid">
            <!-- 1. Conquistas -->
            <div v-if="achievementsEarned > 0 || totalAchievementsCount > 0" class="metric-card">
              <Award :size="16" class="metric-icon gold" />
              <div class="metric-info">
                <span class="metric-val mono">
                  {{ achievementsEarned }}<template v-if="totalAchievementsCount > 0">/{{ totalAchievementsCount }}</template>
                </span>
                <span class="metric-sub">Conquistas</span>
              </div>
            </div>

            <!-- 2. Gamerscore (Xbox) -->
            <div v-if="myStatus?.gamerscore_total" class="metric-card">
              <Gamepad2 :size="16" class="metric-icon accent" />
              <div class="metric-info">
                <span class="metric-val mono">{{ myStatus.gamerscore_earned || 0 }} / {{ myStatus.gamerscore_total }}</span>
                <span class="metric-sub">Gamerscore (G)</span>
              </div>
            </div>

            <!-- 3. Horas Jogadas -->
            <div v-if="totalPlatformHours > 0" class="metric-card">
              <Clock :size="16" class="metric-icon blue" />
              <div class="metric-info">
                <span class="metric-val mono">{{ totalPlatformHours }}h</span>
                <span class="metric-sub">Tempo Jogado</span>
              </div>
            </div>
          </div>

          <!-- Botão de Editar Registro -->
          <div class="progress-footer-action">
            <button
              type="button"
              class="btn-edit-progress"
              @click="isModalOpen = true"
            >
              <Edit3 :size="14" />
              <span>{{ myStatus ? 'Editar Horas / Nota / Review' : 'Adicionar e Avaliar Jogo' }}</span>
            </button>
          </div>
        </div>

        <!-- Sinopse & Informações de Lançamento -->
        <div v-if="game.summary || formattedReleaseDate" class="detail-section overview-section">
          <template v-if="game.summary">
            <h3 class="section-title">Sinopse</h3>
            <p class="overview-text">{{ game.summary }}</p>
          </template>

          <!-- Data de Lançamento e Desenvolvedora abaixo da Sinopse -->
          <div v-if="formattedReleaseDate || game.developer" class="meta-details-footer">
            <div v-if="formattedReleaseDate" class="meta-detail-row">
              <Calendar :size="15" class="meta-detail-icon" />
              <span class="meta-detail-label">Data de Lançamento:</span>
              <span class="meta-detail-value mono">{{ formattedReleaseDate }}</span>
            </div>
            <div v-if="game.developer" class="meta-detail-row">
              <Building2 :size="15" class="meta-detail-icon" />
              <span class="meta-detail-label">Desenvolvedora:</span>
              <span class="meta-detail-value">{{ game.developer }}</span>
            </div>
          </div>
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
  Maximize2,
  Plus,
  BookmarkCheck,
  Play,
  Ban,
  Calendar,
  Building2,
  Award,
  Clock
} from 'lucide-vue-next'
import { capyGamesApi, type CapyGame, type CapyUserGame } from '@/api/capygames'
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
const isTogglingList = ref(false)

const isModalOpen = ref(false)
const isImageViewerOpen = ref(false)
const currentImageUrl = ref('')

const housematesWithReviews = computed(() => {
  return housemates.value.filter(hm => hm.review && hm.user.id !== myStatus.value?.user_id)
})

const formattedReleaseDate = computed(() => {
  const rawData = game.value?.raw_data?.release_date as any
  const raw = (typeof rawData === 'object' && rawData !== null)
    ? (rawData.date || '')
    : (rawData || game.value?.release_date)

  if (!raw) return ''
  const str = String(raw).trim()
  if (!str) return ''

  try {
    const d = new Date(str)
    if (!isNaN(d.getTime())) {
      const day = String(d.getUTCDate()).padStart(2, '0')
      const month = String(d.getUTCMonth() + 1).padStart(2, '0')
      const year = d.getUTCFullYear()
      return `${day}/${month}/${year}`
    }
  } catch {}

  return str
})

const isInList = computed(() => {
  return Boolean(myStatus.value?.in_list || myStatus.value?.status === 'plan_to_play')
})

const effectiveStatus = computed<string>(() => {
  if (!myStatus.value) return ''
  const st = myStatus.value.status
  if (st === 'playing' && myStatus.value.updated_at) {
    const updated = new Date(myStatus.value.updated_at).getTime()
    const thirtyDaysAgo = Date.now() - 30 * 24 * 60 * 60 * 1000
    if (updated < thirtyDaysAgo) {
      return 'on_hold'
    }
  }
  return st
})

// Horas jogadas somadas em todas as plataformas
const totalPlatformHours = computed(() => {
  return myStatus.value?.hours_played || 0
})

const platformHoursBreakdown = computed(() => {
  const ph = myStatus.value?.platform_hours
  if (ph && Object.keys(ph).length > 0) {
    return Object.entries(ph)
      .map(([plat, h]) => `${plat}: ${h}h`)
      .join(' • ')
  }
  return myStatus.value?.platform || 'Todas as plataformas'
})

const platformHoursSubtext = computed(() => {
  const ph = myStatus.value?.platform_hours
  if (ph && Object.keys(ph).length > 1) {
    return `${Object.keys(ph).length} plataformas somadas`
  }
  return myStatus.value?.platform || 'Todas as plataformas'
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
  if (myStatus.value?.status === 'completed' || myStatus.value?.status === 'mastered') return 100
  if (totalAchievementsCount.value > 0) {
    return Math.min(100, Math.round((achievementsEarned.value / totalAchievementsCount.value) * 100))
  }
  if (myStatus.value?.gamerscore_total && myStatus.value.gamerscore_total > 0) {
    return Math.min(100, Math.round(((myStatus.value.gamerscore_earned || 0) / myStatus.value.gamerscore_total) * 100))
  }
  if (myStatus.value?.progress_percentage && myStatus.value.progress_percentage > 0) {
    return myStatus.value.progress_percentage
  }
  if (myStatus.value?.hours_played && myStatus.value.hours_played > 0) {
    return Math.min(95, Math.round(myStatus.value.hours_played * 4))
  }
  return 0
})

const hasProgressMetrics = computed(() => {
  return (
    achievementsEarned.value > 0 ||
    totalAchievementsCount.value > 0 ||
    Boolean(myStatus.value?.gamerscore_total) ||
    totalPlatformHours.value > 0
  )
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

async function handleToggleList() {
  if (!game.value || isTogglingList.value) return
  isTogglingList.value = true
  try {
    const res = await gamesStore.toggleList(game.value.id)
    if (res.user_game) {
      myStatus.value = res.user_game
    }
    await fetchGameDetails()
    await gamesStore.fetchMyList(true)
  } catch (err) {
    console.error('Erro ao alternar lista:', err)
  } finally {
    isTogglingList.value = false
  }
}

async function markStatus(newStatus: 'playing' | 'completed' | 'dropped') {
  if (!game.value) return
  try {
    await capyGamesApi.setStatus({
      game_id: game.value.id,
      status: newStatus,
      platform: myStatus.value?.platform || 'PC',
      hours_played: myStatus.value?.hours_played || 0,
      rating: myStatus.value?.rating
    })
    await fetchGameDetails()
    await gamesStore.fetchMyList(true)
  } catch (err) {
    console.error('Erro ao atualizar status:', err)
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

.detail-actions-bar {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 10px;
  margin-top: 10px;
}

.btn-list-toggle {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 8px 14px;
  border-radius: var(--radius-sm);
  background-color: var(--color-accent);
  color: #ffffff;
  font-size: 0.82rem;
  font-weight: 600;
  border: 1px solid var(--color-accent);
  cursor: pointer;
  transition: all 0.2s;
}

.btn-list-toggle:hover:not(:disabled) {
  opacity: 0.9;
  transform: translateY(-1px);
}

.btn-list-toggle.in-list {
  background-color: rgba(124, 58, 237, 0.15);
  color: var(--color-accent);
  border-color: rgba(124, 58, 237, 0.4);
}

.btn-list-toggle.in-list:hover:not(:disabled) {
  background-color: rgba(239, 68, 68, 0.15);
  color: #ef4444;
  border-color: rgba(239, 68, 68, 0.3);
}

.status-indicator-badge {
  display: inline-flex;
  align-items: center;
  padding: 6px 10px;
  border-radius: var(--radius-sm);
  font-size: 0.75rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.03em;
  background-color: var(--bg-surface-elevated);
  border: 1px solid var(--color-border);
  color: var(--text-main);
}

.status-indicator-badge.badge-playing {
  background-color: rgba(59, 130, 246, 0.15);
  color: #60a5fa;
  border-color: rgba(59, 130, 246, 0.3);
}

.status-indicator-badge.badge-completed {
  background-color: rgba(16, 185, 129, 0.15);
  color: #34d399;
  border-color: rgba(16, 185, 129, 0.3);
}

.status-indicator-badge.badge-mastered {
  background-color: rgba(245, 158, 11, 0.15);
  color: #fbbf24;
  border-color: rgba(245, 158, 11, 0.3);
}

.status-indicator-badge.badge-on_hold {
  background-color: rgba(249, 115, 22, 0.15);
  color: #fb923c;
  border-color: rgba(249, 115, 22, 0.3);
}

.status-indicator-badge.badge-dropped {
  background-color: rgba(239, 68, 68, 0.15);
  color: #f87171;
  border-color: rgba(239, 68, 68, 0.3);
}

.quick-status-actions {
  display: flex;
  align-items: center;
  gap: 6px;
}

.btn-quick-status {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  padding: 7px 11px;
  border-radius: var(--radius-sm);
  background-color: var(--bg-surface-elevated);
  border: 1px solid var(--color-border);
  color: var(--text-main);
  font-size: 0.78rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-quick-status:hover {
  background-color: var(--bg-surface-hover);
  border-color: var(--color-accent);
}

.btn-quick-status.danger:hover {
  border-color: #ef4444;
  color: #ef4444;
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

.meta-details-footer {
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin-top: 14px;
  padding-top: 12px;
  border-top: 1px solid var(--color-border);
}

.meta-detail-row {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  font-size: 0.85rem;
  color: var(--text-muted);
}

.meta-detail-icon {
  color: var(--color-accent);
  flex-shrink: 0;
}

.meta-detail-label {
  font-weight: 500;
  color: var(--text-dim);
}

.meta-detail-value {
  color: var(--text-main);
  font-weight: 600;
}

/* Progresso e Conquistas */
.progress-detail-box {
  background-color: var(--bg-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  padding: 18px 20px;
  display: flex;
  flex-direction: column;
  gap: 16px;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.25);
}

.section-header-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.progress-title-group {
  display: flex;
  align-items: center;
  gap: 8px;
}

.trophy-gold {
  color: #fbbf24;
}

.status-indicator-badge-mini {
  display: inline-flex;
  align-items: center;
  padding: 4px 10px;
  border-radius: var(--radius-sm);
  font-size: 0.72rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  border: 1px solid var(--color-border);
  background: var(--bg-surface-elevated);
  color: var(--text-muted);
}

.status-indicator-badge-mini.badge-playing {
  background-color: rgba(59, 130, 246, 0.15);
  color: #60a5fa;
  border-color: rgba(59, 130, 246, 0.35);
}

.status-indicator-badge-mini.badge-completed {
  background-color: rgba(16, 185, 129, 0.15);
  color: #34d399;
  border-color: rgba(16, 185, 129, 0.35);
}

.status-indicator-badge-mini.badge-mastered {
  background-color: rgba(245, 158, 11, 0.15);
  color: #fbbf24;
  border-color: rgba(245, 158, 11, 0.35);
}

.status-indicator-badge-mini.badge-on_hold {
  background-color: rgba(249, 115, 22, 0.15);
  color: #fb923c;
  border-color: rgba(249, 115, 22, 0.35);
}

.status-indicator-badge-mini.badge-dropped {
  background-color: rgba(239, 68, 68, 0.15);
  color: #f87171;
  border-color: rgba(239, 68, 68, 0.35);
}

/* Card da Barra de Progresso */
.progress-bar-card {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.progress-bar-header {
  display: flex;
  justify-content: space-between;
  align-items: baseline;
}

.prog-main-title {
  font-size: 0.82rem;
  font-weight: 600;
  color: var(--text-muted);
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.prog-main-percent {
  font-size: 1.15rem;
  font-weight: 700;
  color: var(--color-accent);
}

.detail-progress-bar {
  width: 100%;
  height: 8px;
  background-color: var(--bg-surface-elevated);
  border-radius: 4px;
  overflow: hidden;
  border: 1px solid rgba(255, 255, 255, 0.05);
}

.detail-progress-fill {
  height: 100%;
  background: linear-gradient(90deg, var(--color-primary) 0%, var(--color-accent) 100%);
  border-radius: 4px;
  transition: width 0.4s ease;
}

/* Grade de Métricas */
.progress-metrics-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(130px, 1fr));
  gap: 10px;
}

.metric-card {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 12px;
  background: var(--bg-surface-elevated);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-sm);
  transition: border-color 0.2s;
}

.metric-card:hover {
  border-color: rgba(192, 132, 252, 0.3);
}

.metric-icon {
  flex-shrink: 0;
}

.metric-icon.gold {
  color: #fbbf24;
}

.metric-icon.accent {
  color: var(--color-accent);
}

.metric-icon.blue {
  color: #60a5fa;
}

.metric-info {
  display: flex;
  flex-direction: column;
  min-width: 0;
}

.metric-val {
  font-size: 0.86rem;
  font-weight: 700;
  color: var(--text-main);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.metric-sub {
  font-size: 0.68rem;
  color: var(--text-muted);
  text-transform: uppercase;
  letter-spacing: 0.3px;
}

/* Footer Action */
.progress-footer-action {
  display: flex;
  justify-content: flex-end;
  padding-top: 4px;
}

.btn-edit-progress {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 7px;
  background-color: var(--bg-surface-elevated);
  border: 1px solid var(--color-border);
  color: var(--text-main);
  padding: 9px 16px;
  border-radius: var(--radius-sm);
  font-size: 0.82rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
  width: 100%;
}

@media (min-width: 640px) {
  .btn-edit-progress {
    width: auto;
  }
}

.btn-edit-progress:hover {
  background-color: var(--bg-surface-hover);
  border-color: var(--color-accent);
  color: var(--color-accent);
  transform: translateY(-1px);
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
