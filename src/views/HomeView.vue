<template>
  <div class="home-view fade-in">
    <!-- Header estilo CapyShowTime -->
    <header class="page-header">
      <div class="container">
        <div class="header-content">
          <div class="header-title-box">
            <h1 class="header-title mono">Para Jogar</h1>
            <p class="header-subtitle">Seus jogos recentes e em andamento</p>
          </div>
          <div class="header-actions">
            <!-- Botão de Recarregar / Sincronizar -->
            <button
              type="button"
              class="btn-icon-link"
              :class="{ 'is-refreshing': isRefreshing }"
              title="Recarregar fila de jogos"
              @click="onForceRefresh"
            >
              <RefreshCw :size="18" :class="{ spinning: isRefreshing }" />
            </button>
            <router-link to="/discover" class="btn-icon-link" title="Buscar Jogos">
              <Plus :size="20" />
            </router-link>
          </div>
        </div>
      </div>
    </header>

    <main class="container page-body">
      <!-- Loading State Inicial -->
      <div v-if="!gamesStore.myListLoaded && gamesStore.isRefreshingMyList && currentlyPlayingGames.length === 0" class="loading-state">
        <div class="spinner"></div>
        <p>Carregando sua fila de jogos...</p>
      </div>

      <!-- Empty State quando não há jogos recentes -->
      <div v-else-if="currentlyPlayingGames.length === 0 && selectedCategory === 'all'" class="empty-state fade-in">
        <div class="empty-icon-box">
          <Gamepad2 :size="48" class="empty-icon" />
        </div>
        <h3 class="empty-title">Nenhum jogo em andamento!</h3>
        <p class="empty-desc">
          Você está em dia com seus jogos ou ainda não adicionou nenhum título para acompanhar o seu progresso.
        </p>
        <router-link to="/discover" class="btn-primary">
          <Search :size="18" />
          <span>Explorar Jogos</span>
        </router-link>
      </div>

      <!-- Up Next List (Últimos 10 jogos jogados por data com progresso visual) -->
      <section v-else-if="selectedCategory === 'all'" class="up-next-section fade-in">
        <div class="up-next-grid">
          <div
            v-for="item in currentlyPlayingGames"
            :key="item.id"
            class="up-next-card"
          >
            <!-- Capa do Jogo na Esquerda -->
            <div class="card-poster" @click="goToGame(item.game?.id || item.game_id)">
              <img
                v-if="item.game?.cover_url || item.game?.banner_url"
                :src="item.game?.cover_url || item.game?.banner_url"
                :alt="item.game?.title"
                class="poster-img"
                loading="lazy"
              />
              <div v-else class="poster-placeholder">
                <Gamepad2 :size="32" />
              </div>
              <div v-if="item.rating" class="rating-badge-mini mono">
                ★ {{ Number(item.rating).toFixed(1) }}
              </div>
            </div>

            <!-- Detalhes do Jogo na Direita -->
            <div class="card-details">
              <div class="game-top-row">
                <div class="game-title-box">
                  <h3 class="game-title" @click="goToGame(item.game?.id || item.game_id)">
                    {{ item.game?.title }}
                  </h3>
                  <div class="game-meta-row">
                    <!-- Ícone com cor respectiva da marca -->
                    <span class="platform-icon-pill" :title="item.platform || 'Multiplataforma'">
                      <PlatformIcon :platform="item.platform || 'PC'" :size="15" />
                    </span>
                    <span v-if="item.hours_played > 0" class="meta-dot">•</span>
                    <span v-if="item.hours_played > 0" class="hours-text mono">{{ item.hours_played }}h jogadas</span>
                    <span v-if="item.status === 'completed'" class="status-pill-mini completed mono">Zerado</span>
                    <span v-else-if="item.status === 'mastered'" class="status-pill-mini mastered mono">Platinado</span>
                  </div>
                </div>
              </div>

              <!-- Barra de Progresso Visual do Jogo -->
              <div class="progress-container">
                <div class="progress-bar-bg">
                  <div
                    class="progress-bar-fill"
                    :style="{ width: `${getProgressPercent(item)}%` }"
                  ></div>
                </div>
                <div class="progress-labels mono">
                  <span>{{ getProgressLabel(item) }}</span>
                  <span class="progress-percent">{{ getProgressPercent(item) }}%</span>
                </div>
              </div>

              <!-- Ações no Card com Ícones -->
              <div class="card-actions">
                <!-- 1. Zerar jogo (Trophy) com modal de confirmação -->
                <button
                  type="button"
                  class="check-action-btn"
                  title="Marcar como Zerado"
                  @click="promptCompleteGame(item)"
                >
                  <Trophy :size="16" />
                  <span>Zerei</span>
                </button>

                <!-- 2. Abandonar jogo (Ban) com modal de confirmação -->
                <button
                  type="button"
                  class="action-btn-pill drop-pill"
                  title="Marcar como Abandonado"
                  @click="promptDropGame(item)"
                >
                  <Ban :size="15" />
                  <span>Abandonar</span>
                </button>

                <!-- 3. Review: Ícone de texto e escrita (SquarePen) -->
                <button
                  type="button"
                  class="action-btn-pill review-pill"
                  title="Escrever Análise / Review"
                  @click="openReviewModal(item)"
                >
                  <SquarePen :size="15" />
                  <span>Review</span>
                </button>

                <!-- 4. Ver Detalhes do Jogo -->
                <button
                  type="button"
                  class="details-btn"
                  title="Ver detalhes completos do jogo"
                  @click="goToGame(item.game?.id || item.game_id)"
                >
                  <span>Ver Jogo</span>
                  <ChevronRight :size="16" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      <!-- Barra Rápida de Categorias -->
      <div class="categories-bar-wrapper">
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

      <!-- Grade filtrada por categoria -->
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

      <!-- Carrosséis de Exploração (quando "Todos" estiver selecionado) -->
      <div v-else class="carousels-wrapper">
        <!-- 1. Em Alta Esta Semana -->
        <GameCarousel
          title="Em Alta Esta Semana"
          :items="trendingGames.slice(0, 10)"
          view-all-route="/collection/popular"
        />

        <!-- 2. Jogados pela Comunidade -->
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
    </main>

    <!-- Modal de Confirmação: Marcar como Zerado -->
    <Teleport to="body">
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
    </Teleport>

    <!-- Modal de Confirmação: Marcar como Abandonado -->
    <Teleport to="body">
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
    </Teleport>

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
  ChevronRight,
  Trophy,
  Ban,
  SquarePen,
  RefreshCw,
  Plus,
  Search
} from 'lucide-vue-next'
import { useGamesStore } from '@/stores/games'
import { capyGamesApi, type CapyUserGame } from '@/api/capygames'
import GameCard from '@/components/GameCard.vue'
import GameCarousel from '@/components/GameCarousel.vue'
import PlatformIcon from '@/components/PlatformIcon.vue'
import GameStatusModal from '@/components/GameStatusModal.vue'

const router = useRouter()
const gamesStore = useGamesStore()

const isRefreshing = ref(false)
const selectedCategory = ref('all')

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

// Últimos 10 jogos jogados por data com progresso
const currentlyPlayingGames = computed(() => {
  const list = gamesStore.myList || []
  // Preferencialmente jogos em andamento (playing) ou com horas jogadas, e outros da biblioteca
  const playing = list.filter(ug => ug.status === 'playing')
  const others = list.filter(ug => ug.status !== 'playing' && ug.status !== 'dropped')

  const combined = [...playing, ...others].filter(
    (item, index, self) => index === self.findIndex(t => (t.game?.id || t.game_id) === (item.game?.id || item.game_id))
  )

  return combined
    .slice()
    .sort((a, b) => {
      const dateA = new Date(a.updated_at || a.created_at || 0).getTime()
      const dateB = new Date(b.updated_at || b.created_at || 0).getTime()
      return dateB - dateA
    })
    .slice(0, 10)
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

function goToGame(id?: number) {
  if (id) {
    router.push(`/game/${id}`)
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
  if (item.status === 'completed' || item.status === 'mastered') return 100
  if (item.status === 'dropped') return 15
  const raw = item.game?.raw_data
  if (raw?.achievements_count && raw.achievements_count > 0) {
    const earned = item.achievements_earned || 0
    if (earned > 0) {
      return Math.min(100, Math.round((earned / raw.achievements_count) * 100))
    }
  }
  if (item.achievements_total && item.achievements_total > 0) {
    const earned = item.achievements_earned || 0
    return Math.min(100, Math.round((earned / item.achievements_total) * 100))
  }
  if (item.hours_played && item.hours_played > 0) {
    return Math.min(95, Math.round(item.hours_played * 4))
  }
  return 25
}

function getProgressLabel(item: CapyUserGame): string {
  const raw = item.game?.raw_data
  if (raw?.achievements_count && raw.achievements_count > 0) {
    const earned = item.achievements_earned || 0
    return `${earned}/${raw.achievements_count} conquistas`
  }
  if (item.achievements_total && item.achievements_total > 0) {
    return `${item.achievements_earned || 0}/${item.achievements_total} conquistas`
  }
  if (item.status === 'completed') return 'Jogo Zerado'
  if (item.status === 'mastered') return '100% Platinado'
  if (item.hours_played && item.hours_played > 0) {
    return `${item.hours_played}h jogadas`
  }
  return `${getProgressPercent(item)}% concluído`
}

async function onForceRefresh() {
  isRefreshing.value = true
  try {
    await Promise.all([
      gamesStore.fetchMyList(true),
      gamesStore.fetchDiscover(true),
      gamesStore.fetchCommunity(true)
    ])
  } finally {
    isRefreshing.value = false
  }
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

/* Page Header estilo CapyShowTime */
.page-header {
  padding: calc(var(--safe-top) + 16px) 0 16px;
  border-bottom: 1px solid var(--color-border);
  background-color: var(--bg-surface);
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

.btn-icon-link {
  width: 38px;
  height: 38px;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: var(--bg-surface-elevated);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-sm);
  color: var(--text-main);
  transition: all 0.2s;
  cursor: pointer;
}

.btn-icon-link:hover {
  border-color: var(--color-accent);
  color: var(--color-accent);
  transform: translateY(-1px);
}

.page-body {
  padding-top: 20px;
}

/* Loading & Empty State */
.loading-state {
  text-align: center;
  padding: 60px 0;
  color: var(--text-muted);
}

.empty-state {
  text-align: center;
  padding: 50px 20px;
}

.empty-icon-box {
  width: 80px;
  height: 80px;
  background-color: var(--bg-surface-elevated);
  border-radius: var(--radius-md);
  border: 1px solid var(--color-border);
  display: inline-flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 16px;
}

.empty-icon {
  color: var(--color-accent);
}

.empty-title {
  font-size: 1.25rem;
  font-weight: 700;
  margin-bottom: 8px;
  color: var(--text-main);
}

.empty-desc {
  color: var(--text-muted);
  font-size: 0.9rem;
  max-width: 420px;
  margin: 0 auto 24px;
  line-height: 1.5;
}

/* Up Next Grid (Estilo CapyShowTime Cards) */
.up-next-section {
  margin-bottom: 32px;
}

.up-next-grid {
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.up-next-card {
  display: flex;
  gap: 16px;
  background-color: var(--bg-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  padding: 14px;
  transition: border-color 0.2s, transform 0.2s;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.25);
}

.up-next-card:hover {
  border-color: var(--color-primary-light);
  transform: translateY(-1px);
}

.card-poster {
  width: 88px;
  height: 126px;
  border-radius: var(--radius-sm);
  overflow: hidden;
  flex-shrink: 0;
  background-color: var(--bg-surface-elevated);
  cursor: pointer;
  position: relative;
  border: 1px solid var(--color-border-subtle);
}

.poster-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  transition: transform 0.2s ease;
}

.card-poster:hover .poster-img {
  transform: scale(1.05);
}

.poster-placeholder {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--text-dim);
}

.rating-badge-mini {
  position: absolute;
  top: 4px;
  right: 4px;
  background: rgba(15, 13, 21, 0.88);
  backdrop-filter: blur(4px);
  color: var(--color-accent);
  border: 1px solid rgba(192, 132, 252, 0.4);
  font-size: 0.68rem;
  font-weight: 700;
  padding: 2px 5px;
  border-radius: 2px;
}

.card-details {
  flex: 1;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  min-width: 0;
}

.game-top-row {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 10px;
}

.game-title-box {
  flex: 1;
  min-width: 0;
}

.game-title {
  font-size: 1.05rem;
  font-weight: 700;
  color: var(--text-main);
  cursor: pointer;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  line-height: 1.3;
}

.game-title:hover {
  color: var(--color-accent);
}

.game-meta-row {
  display: flex;
  align-items: center;
  gap: 6px;
  margin-top: 4px;
  font-size: 0.75rem;
  color: var(--text-muted);
}

.platform-icon-pill {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 2px 5px;
  background-color: var(--bg-surface-elevated);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-sm);
}

.hours-text {
  font-size: 0.75rem;
}

.meta-dot {
  color: var(--text-dim);
}

.status-pill-mini {
  padding: 2px 6px;
  border-radius: 2px;
  font-size: 0.68rem;
  font-weight: 700;
}

.status-pill-mini.completed {
  background: rgba(52, 211, 153, 0.15);
  color: var(--color-success);
  border: 1px solid rgba(52, 211, 153, 0.35);
}

.status-pill-mini.mastered {
  background: var(--color-accent-dim);
  color: var(--color-accent);
  border: 1px solid rgba(192, 132, 252, 0.35);
}

/* Progresso no Jogo */
.progress-container {
  margin: 10px 0;
}

.progress-bar-bg {
  width: 100%;
  height: 6px;
  background-color: var(--bg-surface-elevated);
  border-radius: 3px;
  overflow: hidden;
  margin-bottom: 5px;
  border: 1px solid rgba(255, 255, 255, 0.05);
}

.progress-bar-fill {
  height: 100%;
  background: linear-gradient(90deg, var(--color-primary), var(--color-accent));
  border-radius: 3px;
  transition: width 0.3s ease;
}

.progress-labels {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 0.74rem;
  color: var(--text-muted);
}

.progress-percent {
  color: var(--color-accent);
  font-weight: 700;
}

/* Ações no Card */
.card-actions {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
  padding-top: 6px;
}

.check-action-btn {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  background-color: rgba(52, 211, 153, 0.14);
  color: var(--color-success);
  border: 1px solid rgba(52, 211, 153, 0.38);
  font-weight: 700;
  padding: 6px 12px;
  border-radius: var(--radius-sm);
  transition: all 0.2s ease;
  font-size: 0.78rem;
  cursor: pointer;
}

.check-action-btn:hover {
  background-color: var(--color-success);
  color: #0f0d15;
  transform: translateY(-1px);
}

.action-btn-pill {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  padding: 6px 12px;
  font-size: 0.78rem;
  font-weight: 600;
  border-radius: var(--radius-sm);
  background: var(--bg-surface-elevated);
  border: 1px solid var(--color-border);
  color: var(--text-muted);
  transition: all 0.2s ease;
  cursor: pointer;
}

.action-btn-pill:hover {
  background: var(--bg-surface-hover);
  color: var(--text-main);
  border-color: var(--color-border);
}

.action-btn-pill.drop-pill {
  background-color: rgba(248, 113, 113, 0.1);
  color: var(--color-danger);
  border-color: rgba(248, 113, 113, 0.3);
}

.action-btn-pill.drop-pill:hover {
  background-color: var(--color-danger);
  color: #fff;
}

.action-btn-pill.review-pill {
  background-color: var(--color-accent-dim);
  color: var(--color-accent);
  border-color: rgba(192, 132, 252, 0.35);
}

.action-btn-pill.review-pill:hover {
  background-color: var(--color-accent);
  color: #0f0d15;
}

.details-btn {
  margin-left: auto;
  display: inline-flex;
  align-items: center;
  gap: 4px;
  background-color: var(--bg-surface-elevated);
  color: var(--text-muted);
  border: 1px solid var(--color-border);
  font-weight: 600;
  padding: 6px 12px;
  border-radius: var(--radius-sm);
  transition: all 0.2s ease;
  font-size: 0.78rem;
  cursor: pointer;
}

.details-btn:hover {
  background-color: var(--bg-surface-hover);
  color: var(--text-main);
  border-color: var(--color-accent);
}

/* Categorias */
.categories-bar-wrapper {
  margin-bottom: 24px;
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

.carousels-wrapper {
  display: flex;
  flex-direction: column;
  gap: 24px;
}

/* Modais de Confirmação */
.confirm-modal-backdrop {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  width: 100vw;
  height: 100vh;
  background: rgba(15, 13, 21, 0.85);
  backdrop-filter: blur(8px);
  -webkit-backdrop-filter: blur(8px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 99999;
  padding: 16px;
  box-sizing: border-box;
}

.confirm-modal-card {
  width: 100%;
  max-width: 380px;
  margin: auto;
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
  background: rgba(192, 132, 252, 0.15);
  color: var(--color-accent);
  border: 1px solid rgba(192, 132, 252, 0.35);
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

.spinning {
  animation: spin 0.8s linear infinite;
}

@media (max-width: 600px) {
  .up-next-card {
    padding: 10px;
    gap: 12px;
  }
  .card-poster {
    width: 78px;
    height: 112px;
  }
  .check-action-btn span,
  .action-btn-pill span,
  .details-btn span {
    display: none;
  }
  .check-action-btn,
  .action-btn-pill,
  .details-btn {
    padding: 7px;
  }
}
</style>
