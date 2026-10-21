<template>
  <div class="home-view fade-in">
    <!-- Hero Banner Estilo CapyFlix -->
    <div v-if="heroGame" class="hero-wrapper">
      <div
        class="hero-banner"
        :style="{ backgroundImage: `url(${heroGame.banner_url || heroGame.cover_url})` }"
      >
        <div class="hero-overlay"></div>
        <div class="hero-content container">
          <div class="hero-meta-top">
            <span v-if="heroGameRating" class="badge-rating mono">
              ★ {{ Number(heroGameRating).toFixed(1) }}
            </span>
            <!-- Apenas Ícone da Plataforma (sem label de texto) -->
            <span class="platform-icon-pill" :title="heroGamePlatform">
              <PlatformIcon :platform="heroGamePlatform" :size="16" />
            </span>
            <span v-if="heroGame.developer" class="meta-text">{{ heroGame.developer }}</span>
            <span v-if="heroGame.genres && heroGame.genres.length > 0" class="meta-dot">•</span>
            <span v-if="heroGame.genres && heroGame.genres.length > 0" class="meta-text">{{ heroGame.genres[0] }}</span>
          </div>

          <h1 class="hero-title">{{ heroGame.title }}</h1>
          <p class="hero-synopsis">{{ heroGame.summary || 'Acompanhe seu progresso, registre suas conquistas e compartilhe sua jogatina com a comunidade.' }}</p>

          <div class="hero-actions">
            <router-link :to="`/game/${heroGame.id}`" class="btn-primary">
              <Gamepad2 :size="16" />
              <span>Ver Detalhes</span>
            </router-link>

            <button
              type="button"
              class="btn-secondary"
              @click="toggleFavoriteHero"
            >
              <Bookmark :size="16" :fill="isHeroInLibrary ? 'currentColor' : 'none'" />
              <span>{{ isHeroInLibrary ? 'Na Minha Lista' : 'Adicionar à Lista' }}</span>
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Barra Rápida de Categorias no Estilo CapyFlix / CapyShowTime -->
    <div class="container categories-bar-wrapper">
      <div class="genres-scroll-bar">
        <button
          v-for="cat in categories"
          :key="cat.key"
          type="button"
          class="genre-pill"
          :class="{ active: selectedCategory === cat.key }"
          @click="selectedCategory = cat.key"
        >
          {{ cat.label }}
        </button>
      </div>
    </div>

    <div class="container page-content">
      <!-- Continuar Jogando (Últimos 5 jogos jogados por data) -->
      <section v-if="currentlyPlayingGames.length > 0 && selectedCategory === 'all'" class="continue-section">
        <div class="section-header">
          <h2 class="section-title mono">Continuar Jogando</h2>
        </div>

        <div class="continue-wrapper">
          <button
            v-if="canScrollContinueLeft"
            type="button"
            class="nav-btn prev"
            aria-label="Anterior"
            @click="scrollContinue(-1)"
          >
            <ChevronLeft :size="18" />
          </button>

          <div ref="continueTrackRef" class="continue-track" @scroll="onContinueTrackScroll">
            <div
              v-for="item in currentlyPlayingGames"
              :key="item.id"
              class="continue-card"
            >
              <div class="continue-thumb-wrapper" @click="goToGame(item.game?.id || item.game_id)">
                <img
                  :src="item.game?.banner_url || item.game?.cover_url"
                  :alt="item.game?.title"
                  class="continue-thumb"
                  loading="lazy"
                />
                <div class="play-overlay-mini">
                  <Play :size="18" fill="currentColor" />
                </div>
                <div class="continue-progress-bar">
                  <div
                    class="continue-progress-fill"
                    :style="{ width: `${getProgressPercent(item)}%` }"
                  ></div>
                </div>
              </div>

              <div class="continue-info">
                <h4 class="continue-title" @click="goToGame(item.game?.id || item.game_id)">
                  {{ item.game?.title }}
                </h4>

                <!-- Metadados com apenas ÍCONE da plataforma -->
                <div class="continue-meta-row">
                  <span class="platform-icon-wrap" :title="item.platform || 'PC'">
                    <PlatformIcon :platform="item.platform || 'PC'" :size="14" />
                  </span>
                  <span v-if="item.hours_played > 0" class="meta-dot">•</span>
                  <span v-if="item.hours_played > 0" class="hours-text mono">{{ item.hours_played }}h</span>
                </div>

                <!-- Botões de Ação com Apenas ÍCONES -->
                <div class="card-icon-actions">
                  <!-- 1. Ir aos detalhes -->
                  <button
                    type="button"
                    class="action-icon-btn"
                    title="Ver detalhes do jogo"
                    @click="goToGame(item.game?.id || item.game_id)"
                  >
                    <Info :size="14" />
                  </button>

                  <!-- 2. Marcar como Zerado -->
                  <button
                    type="button"
                    class="action-icon-btn complete-btn"
                    title="Marcar como Zerado"
                    @click="promptCompleteGame(item)"
                  >
                    <Trophy :size="14" />
                  </button>

                  <!-- 3. Marcar como Abandonado -->
                  <button
                    type="button"
                    class="action-icon-btn drop-btn"
                    title="Marcar como Abandonado"
                    @click="promptDropGame(item)"
                  >
                    <Ban :size="14" />
                  </button>

                  <!-- 4. Fazer Review / Avaliar -->
                  <button
                    type="button"
                    class="action-icon-btn review-btn"
                    title="Avaliar e escrever análise"
                    @click="openReviewModal(item)"
                  >
                    <Star :size="14" />
                  </button>
                </div>
              </div>
            </div>
          </div>

          <button
            type="button"
            class="nav-btn next"
            aria-label="Próximo"
            @click="scrollContinue(1)"
          >
            <ChevronRight :size="18" />
          </button>
        </div>
      </section>

      <!-- Grade filtrada quando uma categoria específica for selecionada -->
      <section v-if="selectedCategory !== 'all'" class="filtered-category-section fade-in">
        <div class="section-header">
          <h2 class="section-title mono">{{ categoryTitle }}</h2>
        </div>

        <div v-if="filteredGames.length > 0" class="category-grid">
          <GameCard
            v-for="(item, idx) in filteredGames"
            :key="item.id || item.external_id || idx"
            :game="item"
          />
        </div>
        <div v-else class="empty-state">
          <p class="empty-desc">Nenhum jogo encontrado nessa categoria no momento.</p>
        </div>
      </section>

      <!-- Carrosséis quando "Todos" estiver selecionado -->
      <div v-else class="carousels-wrapper">
        <!-- 1. Em Alta no Momento -->
        <GameCarousel
          title="Em Alta Esta Semana"
          :items="trendingGames.slice(0, 10)"
          view-all-route="/collection/popular"
        />

        <!-- 2. O que a Capihouse está jogando -->
        <GameCarousel
          v-if="communityGames.length > 0"
          title="Jogados pela Comunidade"
          :items="communityGames.slice(0, 10)"
          view-all-route="/collection/community"
        />

        <!-- 3. Mais Bem Avaliados -->
        <GameCarousel
          v-if="topRatedGames.length > 0"
          title="Mais Bem Avaliados"
          :items="topRatedGames.slice(0, 10)"
          view-all-route="/collection/top-rated"
        />

        <!-- 4. Mundos de RPG -->
        <GameCarousel
          v-if="rpgGames.length > 0"
          title="Aventuras & RPGs"
          :items="rpgGames.slice(0, 10)"
          view-all-route="/collection/genre-rpg"
        />

        <!-- 5. Ação & Tiro -->
        <GameCarousel
          v-if="actionGames.length > 0"
          title="Ação & Sobrevivência"
          :items="actionGames.slice(0, 10)"
          view-all-route="/collection/genre-action"
        />

        <!-- 6. Destaques Indie -->
        <GameCarousel
          v-if="indieGames.length > 0"
          title="Jóias Indie"
          :items="indieGames.slice(0, 10)"
          view-all-route="/collection/genre-indie"
        />
      </div>
    </div>

    <!-- Modal de Confirmação: Marcar como Zerado -->
    <div v-if="showCompleteModal && targetUserGame" class="confirm-modal-backdrop" @click.self="showCompleteModal = false">
      <div class="confirm-modal-card fade-in">
        <div class="confirm-modal-icon trophy-icon-box">
          <Trophy :size="28" />
        </div>
        <h3 class="confirm-modal-title">Parabéns por Zerar! 🏆</h3>
        <p class="confirm-modal-desc">
          Deseja marcar <strong>{{ targetUserGame.game?.title }}</strong> como <strong>Zerado</strong> na sua biblioteca?
        </p>
        <div class="confirm-modal-actions">
          <button type="button" class="btn-secondary" @click="showCompleteModal = false">
            Cancelar
          </button>
          <button type="button" class="btn-primary" :disabled="isSubmittingAction" @click="confirmComplete">
            {{ isSubmittingAction ? 'Salvando...' : 'Confirmar Zerado' }}
          </button>
        </div>
      </div>
    </div>

    <!-- Modal de Confirmação: Marcar como Abandonado -->
    <div v-if="showDropModal && targetUserGame" class="confirm-modal-backdrop" @click.self="showDropModal = false">
      <div class="confirm-modal-card fade-in">
        <div class="confirm-modal-icon drop-icon-box">
          <Ban :size="28" />
        </div>
        <h3 class="confirm-modal-title">Abandonar Jogo</h3>
        <p class="confirm-modal-desc">
          Deseja marcar <strong>{{ targetUserGame.game?.title }}</strong> como <strong>Abandonado</strong>? Você poderá retomar depois quando quiser.
        </p>
        <div class="confirm-modal-actions">
          <button type="button" class="btn-secondary" @click="showDropModal = false">
            Cancelar
          </button>
          <button type="button" class="btn-primary danger" :disabled="isSubmittingAction" @click="confirmDrop">
            {{ isSubmittingAction ? 'Salvando...' : 'Confirmar Abandono' }}
          </button>
        </div>
      </div>
    </div>

    <!-- Modal de Avaliação / Review / Horas -->
    <GameStatusModal
      :is-open="isStatusModalOpen"
      :user-game="selectedGameForStatus"
      @close="isStatusModalOpen = false"
      @updated="handleStatusUpdated"
      @removed="handleStatusRemoved"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import {
  Gamepad2,
  Bookmark,
  ChevronLeft,
  ChevronRight,
  Play,
  Info,
  Trophy,
  Ban,
  Star
} from 'lucide-vue-next'
import { useGamesStore } from '@/stores/games'
import { capyGamesApi, type CapyUserGame } from '@/api/capygames'
import GameCard from '@/components/GameCard.vue'
import GameCarousel from '@/components/GameCarousel.vue'
import PlatformIcon from '@/components/PlatformIcon.vue'
import GameStatusModal from '@/components/GameStatusModal.vue'

const router = useRouter()
const gamesStore = useGamesStore()

const selectedCategory = ref('all')
const continueTrackRef = ref<HTMLElement | null>(null)
const canScrollContinueLeft = ref(false)

// Modais de ação rápida
const targetUserGame = ref<CapyUserGame | null>(null)
const showCompleteModal = ref(false)
const showDropModal = ref(false)
const isSubmittingAction = ref(false)

// Modal de status/review
const isStatusModalOpen = ref(false)
const selectedGameForStatus = ref<CapyUserGame | null>(null)

const categories = [
  { key: 'all', label: 'Todos' },
  { key: 'rpg', label: 'RPGs' },
  { key: 'action', label: 'Ação' },
  { key: 'adventure', label: 'Aventura' },
  { key: 'shooter', label: 'Tiro' },
  { key: 'strategy', label: 'Estratégia' },
  { key: 'indie', label: 'Indie' },
  { key: 'horror', label: 'Terror' }
]

const categoryTitle = computed(() => {
  const cat = categories.find(c => c.key === selectedCategory.value)
  return cat ? cat.label : 'Jogos'
})

// Últimos 5 jogos jogados na listagem por data
const currentlyPlayingGames = computed(() => {
  return gamesStore.myList
    .filter(ug => ug.status === 'playing')
    .slice()
    .sort((a, b) => {
      const dateA = new Date(a.updated_at || a.created_at || 0).getTime()
      const dateB = new Date(b.updated_at || b.created_at || 0).getTime()
      return dateB - dateA
    })
    .slice(0, 5)
})

// Jogos populares
const trendingGames = computed(() => {
  return gamesStore.popularGames
})

// Jogos da comunidade
const communityGames = computed(() => {
  const map = new Map<number, any>()
  for (const act of gamesStore.communityActivities) {
    if (act.game && !map.has(act.game.id)) {
      map.set(act.game.id, act.game)
    }
  }
  return Array.from(map.values())
})

// Jogos bem avaliados
const topRatedGames = computed(() => {
  const rated = gamesStore.myList.filter(ug => ug.rating && ug.rating >= 8)
  if (rated.length > 0) {
    return rated.map(ug => ug.game)
  }
  return gamesStore.popularGames.slice().reverse()
})

// Gêneros filtrados
const rpgGames = computed(() => {
  return gamesStore.popularGames.filter(g =>
    (g.genres || []).some(gen => /rpg|role-playing/i.test(gen)) ||
    (g.summary || '').toLowerCase().includes('rpg')
  )
})

const actionGames = computed(() => {
  return gamesStore.popularGames.filter(g =>
    (g.genres || []).some(gen => /action|ação|shooter|tiro/i.test(gen)) ||
    (g.summary || '').toLowerCase().includes('action')
  )
})

const indieGames = computed(() => {
  return gamesStore.popularGames.filter(g =>
    (g.genres || []).some(gen => /indie/i.test(gen)) ||
    (g.summary || '').toLowerCase().includes('indie')
  )
})

const filteredGames = computed(() => {
  if (selectedCategory.value === 'all') return []
  const cat = selectedCategory.value.toLowerCase()
  return gamesStore.popularGames.filter(g => {
    const genres = (g.genres || []).map(x => x.toLowerCase())
    const summary = (g.summary || '').toLowerCase()
    return genres.some(gn => gn.includes(cat)) || summary.includes(cat)
  })
})

// Destaque do Hero Banner
const heroGame = computed<any>(() => {
  if (currentlyPlayingGames.value.length > 0) {
    return currentlyPlayingGames.value[0].game
  }
  if (gamesStore.popularGames.length > 0) {
    return gamesStore.popularGames[0]
  }
  return null
})

const heroGameRating = computed(() => {
  if (!heroGame.value) return 9.2
  const inList = gamesStore.myList.find(ug => ug.game_id === heroGame.value.id || ug.game?.id === heroGame.value.id)
  return inList?.rating || 9.2
})

const heroGamePlatform = computed(() => {
  if (!heroGame.value) return 'PC'
  if (heroGame.value.platforms && heroGame.value.platforms.length > 0) {
    return heroGame.value.platforms[0]
  }
  return 'PC'
})

const isHeroInLibrary = computed(() => {
  if (!heroGame.value) return false
  return gamesStore.myList.some(ug => ug.game_id === heroGame.value.id || ug.game?.id === heroGame.value.id)
})

function goToGame(id: number) {
  if (id) {
    router.push(`/game/${id}`)
  }
}

function toggleFavoriteHero() {
  if (heroGame.value) {
    router.push(`/game/${heroGame.value.id}`)
  }
}

function promptCompleteGame(item: CapyUserGame) {
  targetUserGame.value = item
  showCompleteModal.value = true
}

function promptDropGame(item: CapyUserGame) {
  targetUserGame.value = item
  showDropModal.value = true
}

function openReviewModal(item: CapyUserGame) {
  selectedGameForStatus.value = item
  isStatusModalOpen.value = true
}

async function confirmComplete() {
  if (!targetUserGame.value) return
  isSubmittingAction.value = true
  try {
    await capyGamesApi.setStatus({
      game_id: targetUserGame.value.game_id || targetUserGame.value.game?.id,
      status: 'completed',
      platform: targetUserGame.value.platform,
      hours_played: targetUserGame.value.hours_played,
      rating: targetUserGame.value.rating
    })
    showCompleteModal.value = false
    await gamesStore.fetchMyList(true)
  } catch (err) {
    console.error('Erro ao marcar jogo como zerado:', err)
  } finally {
    isSubmittingAction.value = false
  }
}

async function confirmDrop() {
  if (!targetUserGame.value) return
  isSubmittingAction.value = true
  try {
    await capyGamesApi.setStatus({
      game_id: targetUserGame.value.game_id || targetUserGame.value.game?.id,
      status: 'dropped',
      platform: targetUserGame.value.platform,
      hours_played: targetUserGame.value.hours_played,
      rating: targetUserGame.value.rating
    })
    showDropModal.value = false
    await gamesStore.fetchMyList(true)
  } catch (err) {
    console.error('Erro ao marcar jogo como abandonado:', err)
  } finally {
    isSubmittingAction.value = false
  }
}

async function handleStatusUpdated() {
  isStatusModalOpen.value = false
  await gamesStore.fetchMyList(true)
}

async function handleStatusRemoved() {
  isStatusModalOpen.value = false
  await gamesStore.fetchMyList(true)
}

function getProgressPercent(item: CapyUserGame): number {
  if (item.achievements_total && item.achievements_total > 0) {
    return Math.min(100, Math.round(((item.achievements_earned || 0) / item.achievements_total) * 100))
  }
  if (item.hours_played > 0) {
    return Math.min(100, Math.round((item.hours_played / 50) * 100))
  }
  return 25
}

function onContinueTrackScroll() {
  if (continueTrackRef.value) {
    canScrollContinueLeft.value = continueTrackRef.value.scrollLeft > 20
  }
}

function scrollContinue(direction: number) {
  if (!continueTrackRef.value) return
  const itemWidth = 220 + 12
  continueTrackRef.value.scrollBy({
    left: itemWidth * 2 * direction,
    behavior: 'smooth'
  })
}

onMounted(async () => {
  await Promise.all([
    gamesStore.fetchMyList(),
    gamesStore.fetchDiscover(),
    gamesStore.fetchCommunity()
  ])
})
</script>

<style scoped>
.home-view {
  padding-bottom: 24px;
}

/* Hero Banner */
.hero-wrapper {
  position: relative;
  width: 100%;
  margin-bottom: 8px;
}

.hero-banner {
  position: relative;
  min-height: 380px;
  background-size: cover;
  background-position: center top;
  display: flex;
  align-items: flex-end;
  padding-bottom: 32px;
  padding-top: 60px;
}

@media (min-width: 768px) {
  .hero-banner {
    min-height: 440px;
    padding-bottom: 44px;
  }
}

.hero-overlay {
  position: absolute;
  inset: 0;
  background: linear-gradient(
    to top,
    var(--bg-app) 0%,
    rgba(18, 16, 14, 0.85) 45%,
    rgba(18, 16, 14, 0.35) 100%
  );
  pointer-events: none;
}

.hero-content {
  position: relative;
  z-index: 2;
  width: 100%;
}

.hero-meta-top {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 10px;
  flex-wrap: wrap;
}

.platform-icon-pill {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 4px 7px;
  background-color: var(--bg-surface-elevated);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-sm);
  color: var(--color-accent);
}

.meta-text {
  font-size: 0.82rem;
  color: var(--text-muted);
}

.meta-dot {
  color: var(--text-dim);
}

.hero-title {
  font-size: 1.8rem;
  font-weight: 800;
  color: var(--text-main);
  line-height: 1.15;
  margin-bottom: 8px;
  max-width: 650px;
  letter-spacing: -0.5px;
}

@media (min-width: 768px) {
  .hero-title {
    font-size: 2.3rem;
  }
}

.hero-synopsis {
  font-size: 0.88rem;
  color: var(--text-muted);
  line-height: 1.45;
  max-width: 580px;
  margin-bottom: 18px;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.hero-actions {
  display: flex;
  align-items: center;
  gap: 10px;
  flex-wrap: wrap;
}

/* Categorias */
.categories-bar-wrapper {
  margin-bottom: 16px;
}

/* Continuar Jogando Section */
.continue-section {
  margin-bottom: 28px;
}

.section-header {
  margin-bottom: 12px;
}

.continue-wrapper {
  position: relative;
}

.continue-track {
  display: flex;
  gap: 12px;
  overflow-x: auto;
  scroll-behavior: smooth;
  padding: 4px 0 12px;
  scrollbar-width: none;
}

.continue-track::-webkit-scrollbar {
  display: none;
}

.continue-card {
  flex: 0 0 210px;
  width: 210px;
  display: flex;
  flex-direction: column;
}

@media (min-width: 640px) {
  .continue-card {
    flex: 0 0 230px;
    width: 230px;
  }
}

.continue-thumb-wrapper {
  position: relative;
  width: 100%;
  aspect-ratio: 16 / 9;
  border-radius: var(--radius-sm);
  overflow: hidden;
  background-color: var(--bg-surface-elevated);
  border: 1px solid var(--color-border);
  transition: border-color 0.2s;
  cursor: pointer;
}

.continue-card:hover .continue-thumb-wrapper {
  border-color: var(--color-accent);
}

.continue-thumb {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.play-overlay-mini {
  position: absolute;
  inset: 0;
  background: rgba(0, 0, 0, 0.4);
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--color-accent);
  opacity: 0.8;
  transition: opacity 0.2s;
}

.continue-card:hover .play-overlay-mini {
  opacity: 1;
}

.continue-progress-bar {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  height: 3px;
  background-color: rgba(0, 0, 0, 0.6);
}

.continue-progress-fill {
  height: 100%;
  background-color: var(--color-accent);
}

.continue-info {
  margin-top: 6px;
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.continue-title {
  font-size: 0.82rem;
  font-weight: 600;
  color: var(--text-main);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  cursor: pointer;
}

.continue-title:hover {
  color: var(--color-accent);
}

.continue-meta-row {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 0.72rem;
  color: var(--text-muted);
}

.platform-icon-wrap {
  display: inline-flex;
  align-items: center;
}

.hours-text {
  font-size: 0.72rem;
  color: var(--text-muted);
}

/* Botões de Ação com Apenas Ícones */
.card-icon-actions {
  display: flex;
  align-items: center;
  gap: 6px;
  margin-top: 6px;
  padding-top: 6px;
  border-top: 1px solid var(--color-border-subtle);
}

.action-icon-btn {
  width: 28px;
  height: 28px;
  border-radius: var(--radius-sm);
  background-color: var(--bg-surface-elevated);
  border: 1px solid var(--color-border);
  color: var(--text-muted);
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.2s ease;
}

.action-icon-btn:hover {
  color: var(--text-main);
  border-color: var(--color-primary-light);
  background-color: var(--bg-surface-hover);
}

.action-icon-btn.complete-btn:hover {
  color: var(--color-success);
  border-color: rgba(52, 211, 153, 0.4);
  background-color: rgba(52, 211, 153, 0.1);
}

.action-icon-btn.drop-btn:hover {
  color: var(--color-danger);
  border-color: rgba(248, 113, 113, 0.4);
  background-color: rgba(248, 113, 113, 0.1);
}

.action-icon-btn.review-btn:hover {
  color: var(--color-accent);
  border-color: var(--color-accent);
  background-color: rgba(245, 197, 24, 0.1);
}

/* Category Grid */
.category-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(130px, 1fr));
  gap: 14px;
}

@media (min-width: 640px) {
  .category-grid {
    grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
    gap: 16px;
  }
}

.nav-btn {
  position: absolute;
  top: 45%;
  transform: translateY(-50%);
  width: 32px;
  height: 32px;
  border-radius: var(--radius-sm);
  background: rgba(22, 19, 17, 0.9);
  border: 1px solid var(--color-border);
  color: var(--text-main);
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  z-index: 10;
  backdrop-filter: blur(8px);
  transition: all 0.2s ease;
  opacity: 0;
}

.continue-wrapper:hover .nav-btn {
  opacity: 1;
}

.nav-btn:hover {
  background: var(--color-accent);
  color: #12100e;
  border-color: var(--color-accent);
}

.nav-btn.prev {
  left: -8px;
}

.nav-btn.next {
  right: -8px;
}

@media (max-width: 768px) {
  .nav-btn {
    display: none !important;
  }
}

.empty-state {
  text-align: center;
  padding: 40px 20px;
  color: var(--text-muted);
}

/* Modais de Confirmação */
.confirm-modal-backdrop {
  position: fixed;
  inset: 0;
  background: rgba(18, 16, 14, 0.85);
  backdrop-filter: blur(8px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: 16px;
}

.confirm-modal-card {
  width: 100%;
  max-width: 380px;
  background: var(--bg-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  padding: 24px;
  text-align: center;
  box-shadow: 0 16px 40px rgba(0, 0, 0, 0.7);
}

.confirm-modal-icon {
  width: 56px;
  height: 56px;
  border-radius: var(--radius-sm);
  display: inline-flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 14px;
}

.trophy-icon-box {
  background: rgba(245, 197, 24, 0.15);
  color: var(--color-accent);
  border: 1px solid rgba(245, 197, 24, 0.35);
}

.drop-icon-box {
  background: rgba(248, 113, 113, 0.15);
  color: var(--color-danger);
  border: 1px solid rgba(248, 113, 113, 0.35);
}

.confirm-modal-title {
  font-size: 1.15rem;
  color: var(--text-main);
  margin-bottom: 8px;
}

.confirm-modal-desc {
  font-size: 0.84rem;
  color: var(--text-muted);
  line-height: 1.5;
  margin-bottom: 20px;
}

.confirm-modal-actions {
  display: flex;
  gap: 10px;
  justify-content: center;
}

.btn-primary.danger {
  background-color: var(--color-danger);
  color: #fff;
}

.btn-primary.danger:hover {
  background-color: #ef4444;
}
</style>
