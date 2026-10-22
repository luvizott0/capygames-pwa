<template>
  <div class="library-page container fade-in">
    <header class="page-header">
      <div class="header-top">
        <div>
          <h1 class="header-title mono">Lista</h1>
          <p class="header-subtitle">Sua fila de jogos e ordem de prioridade para jogar</p>
        </div>
        <div class="header-actions">
          <RefreshButton
            :is-refreshing="gamesStore.isRefreshingMyList"
            @refresh="onForceRefresh"
          />
        </div>
      </div>
    </header>

    <main class="page-body">
      <!-- Loading State -->
      <div v-if="gamesStore.isRefreshingMyList && gamesStore.myList.length === 0" class="loading-state">
        <div class="spinner"></div>
        <p>Carregando sua lista...</p>
      </div>

      <!-- Quando há jogos na lista -->
      <div v-else-if="listGames.length > 0" class="list-content fade-in">
        <div class="results-header">
          <span class="results-count mono">
            {{ listGames.length }} {{ listGames.length === 1 ? 'jogo na fila' : 'jogos na fila' }}
          </span>

          <div class="view-mode-toggle">
            <button
              type="button"
              class="view-toggle-btn"
              :class="{ active: viewMode === 'list' }"
              title="Visualização em Fila (Reordenar)"
              @click="viewMode = 'list'"
            >
              <ListOrdered :size="16" />
              <span class="mode-label">Fila</span>
            </button>
            <button
              type="button"
              class="view-toggle-btn"
              :class="{ active: viewMode === 'grid' }"
              title="Visualização em Grade"
              @click="viewMode = 'grid'"
            >
              <LayoutGrid :size="16" />
              <span class="mode-label">Grade</span>
            </button>
          </div>
        </div>

        <!-- Modo 1: Fila Reordenável (Cards com prioridade #1, #2, setas subir/descer) -->
        <div v-if="viewMode === 'list'" class="reorder-queue-list">
          <div
            v-for="(item, index) in listGames"
            :key="item.id"
            class="queue-item-card"
          >
            <!-- Badge de Posição / Prioridade -->
            <div class="queue-rank-box mono">
              <span class="rank-hash">#</span>
              <span class="rank-num">{{ index + 1 }}</span>
            </div>

            <!-- Capa do Jogo -->
            <div class="queue-poster-box" @click="goToGame(item.game_id || item.game?.id)">
              <img
                v-if="item.game?.cover_url"
                :src="item.game.cover_url"
                :alt="item.game.title"
                class="queue-poster-img"
                loading="lazy"
              />
              <div v-else class="queue-poster-placeholder">
                <Gamepad2 :size="20" />
              </div>
            </div>

            <!-- Informações do Jogo -->
            <div class="queue-info-box" @click="goToGame(item.game_id || item.game?.id)">
              <h3 class="queue-game-title">{{ item.game?.title }}</h3>
              <div class="queue-meta-row">
                <span v-if="item.platform" class="queue-meta-chip">
                  <PlatformIcon :platform="item.platform" :size="13" />
                  <span>{{ item.platform }}</span>
                </span>
                <span v-if="item.status && item.status !== 'plan_to_play'" class="queue-status-chip" :class="item.status">
                  {{ getStatusText(item.status) }}
                </span>
              </div>
            </div>

            <!-- Controles de Reordenação e Remoção -->
            <div class="queue-actions-box">
              <div class="reorder-arrows">
                <button
                  type="button"
                  class="btn-arrow"
                  :disabled="index === 0 || isSavingOrder"
                  title="Mover para cima"
                  @click="moveItem(index, -1)"
                >
                  <ChevronUp :size="18" />
                </button>
                <button
                  type="button"
                  class="btn-arrow"
                  :disabled="index === listGames.length - 1 || isSavingOrder"
                  title="Mover para baixo"
                  @click="moveItem(index, 1)"
                >
                  <ChevronDown :size="18" />
                </button>
              </div>

              <button
                type="button"
                class="btn-remove-from-list"
                title="Remover da lista"
                :disabled="isSavingOrder"
                @click="removeFromList(item)"
              >
                <X :size="16" />
              </button>
            </div>
          </div>
        </div>

        <!-- Modo 2: Grade com numeração #1, #2 no topo -->
        <div v-else class="games-grid">
          <div
            v-for="(item, index) in listGames"
            :key="item.id"
            class="grid-item-wrapper"
          >
            <div class="grid-rank-badge mono">
              #{{ index + 1 }}
            </div>
            <GameCard :user-game="item" />
          </div>
        </div>
      </div>

      <!-- Empty State quando não há jogos adicionados à lista -->
      <div v-else class="empty-state fade-in">
        <div class="empty-icon-box">
          <Bookmark :size="40" class="empty-icon" />
        </div>
        <h3 class="empty-title">Sua lista está vazia</h3>
        <p class="empty-desc">
          Adicione jogos à sua lista para definir a ordem em que você pretende jogar cada título.
        </p>
        <router-link to="/discover" class="btn-primary">
          <Search :size="16" />
          <span>Explorar Catálogo</span>
        </router-link>
      </div>
    </main>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import {
  Bookmark,
  Search,
  LayoutGrid,
  ListOrdered,
  ChevronUp,
  ChevronDown,
  X,
  Gamepad2
} from 'lucide-vue-next'
import { useGamesStore } from '@/stores/games'
import type { CapyUserGame } from '@/api/capygames'
import GameCard from '@/components/GameCard.vue'
import RefreshButton from '@/components/RefreshButton.vue'
import PlatformIcon from '@/components/PlatformIcon.vue'

const router = useRouter()
const gamesStore = useGamesStore()
const viewMode = ref<'list' | 'grid'>('list')
const isSavingOrder = ref(false)

// Apenas jogos que o jogador ativamente adicionou à lista, ordenados por list_order
const listGames = computed<CapyUserGame[]>(() => {
  return gamesStore.myList
    .filter(g => Boolean(g.in_list || g.status === 'plan_to_play'))
    .slice()
    .sort((a, b) => {
      const orderA = a.list_order ?? 999999
      const orderB = b.list_order ?? 999999
      if (orderA !== orderB) return orderA - orderB
      return (a.id || 0) - (b.id || 0)
    })
})

function getStatusText(status: string) {
  const map: Record<string, string> = {
    playing: 'Jogando',
    completed: 'Zerado',
    mastered: 'Platinado',
    on_hold: 'Em Pausa',
    dropped: 'Abandonado'
  }
  return map[status] || status
}

function goToGame(gameId?: number) {
  if (gameId) {
    router.push(`/game/${gameId}`)
  }
}

async function onForceRefresh() {
  await gamesStore.fetchMyList(true)
}

async function moveItem(index: number, direction: -1 | 1) {
  const targetIndex = index + direction
  if (targetIndex < 0 || targetIndex >= listGames.value.length || isSavingOrder.value) {
    return
  }

  // Cria uma cópia da ordenação atual
  const reordered = [...listGames.value]
  const [moved] = reordered.splice(index, 1)
  reordered.splice(targetIndex, 0, moved)

  // Extrai os IDs dos jogos na nova ordem
  const gameIds = reordered.map(item => item.game_id || item.game?.id).filter(Boolean) as number[]

  isSavingOrder.value = true
  try {
    await gamesStore.reorderList(gameIds)
  } catch (err) {
    console.error('Falha ao salvar nova ordem:', err)
  } finally {
    isSavingOrder.value = false
  }
}

async function removeFromList(item: CapyUserGame) {
  const gId = item.game_id || item.game?.id
  if (!gId || isSavingOrder.value) return
  try {
    await gamesStore.toggleList(gId)
    await gamesStore.fetchMyList(true)
  } catch (err) {
    console.error('Erro ao remover da lista:', err)
  }
}

onMounted(async () => {
  if (gamesStore.myList.length === 0) {
    await gamesStore.fetchMyList()
  }
})
</script>

<style scoped>
.library-page {
  padding-top: 16px;
  padding-bottom: 32px;
}

.page-header {
  margin-bottom: 20px;
}

.header-top {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 12px;
}

.header-title {
  font-size: 1.25rem;
  color: var(--text-main);
  margin-bottom: 4px;
}

.header-subtitle {
  font-size: 0.82rem;
  color: var(--text-muted);
}

.header-actions {
  display: flex;
  align-items: center;
  gap: 8px;
}

.results-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
  gap: 12px;
}

.results-count {
  font-size: 0.78rem;
  color: var(--text-dim);
}

.view-mode-toggle {
  display: flex;
  gap: 4px;
  background-color: var(--bg-surface-elevated);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-sm);
  padding: 2px;
}

.view-toggle-btn {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 4px 8px;
  border-radius: var(--radius-sm);
  color: var(--text-muted);
  font-size: 0.72rem;
  font-weight: 600;
  transition: all 0.2s;
  cursor: pointer;
  background: transparent;
  border: none;
}

.view-toggle-btn:hover {
  color: var(--text-main);
}

.view-toggle-btn.active {
  background-color: var(--color-accent);
  color: #ffffff;
}

/* Fila Reordenável */
.reorder-queue-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.queue-item-card {
  display: flex;
  align-items: center;
  gap: 12px;
  background-color: var(--bg-surface-elevated);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-sm);
  padding: 10px 12px;
  transition: border-color 0.2s, background-color 0.2s;
}

.queue-item-card:hover {
  border-color: rgba(124, 58, 237, 0.4);
}

.queue-rank-box {
  display: flex;
  align-items: baseline;
  justify-content: center;
  min-width: 34px;
  font-weight: 800;
  color: var(--color-accent);
}

.rank-hash {
  font-size: 0.75rem;
  opacity: 0.7;
}

.rank-num {
  font-size: 1.1rem;
}

.queue-poster-box {
  width: 48px;
  aspect-ratio: 2 / 3;
  border-radius: var(--radius-xs, 4px);
  overflow: hidden;
  background-color: var(--bg-surface);
  border: 1px solid var(--color-border);
  cursor: pointer;
  flex-shrink: 0;
}

.queue-poster-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.queue-poster-placeholder {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--text-dim);
}

.queue-info-box {
  flex: 1;
  min-width: 0;
  cursor: pointer;
}

.queue-game-title {
  font-size: 0.95rem;
  font-weight: 700;
  color: var(--text-main);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  margin-bottom: 4px;
}

.queue-meta-row {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
}

.queue-meta-chip {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  font-size: 0.72rem;
  color: var(--text-muted);
}

.queue-status-chip {
  font-size: 0.68rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.03em;
  padding: 2px 6px;
  border-radius: 4px;
  background: rgba(255, 255, 255, 0.06);
  color: var(--text-muted);
}

.queue-status-chip.playing {
  background: rgba(59, 130, 246, 0.15);
  color: #60a5fa;
}

.queue-actions-box {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-shrink: 0;
}

.reorder-arrows {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.btn-arrow {
  width: 28px;
  height: 22px;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: var(--bg-surface);
  border: 1px solid var(--color-border);
  border-radius: 4px;
  color: var(--text-muted);
  cursor: pointer;
  transition: all 0.15s;
}

.btn-arrow:hover:not(:disabled) {
  background-color: var(--color-accent);
  color: #ffffff;
  border-color: var(--color-accent);
}

.btn-arrow:disabled {
  opacity: 0.25;
  cursor: not-allowed;
}

.btn-remove-from-list {
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: transparent;
  border: 1px solid transparent;
  border-radius: var(--radius-sm);
  color: var(--text-dim);
  cursor: pointer;
  transition: all 0.2s;
}

.btn-remove-from-list:hover:not(:disabled) {
  color: #ef4444;
  background-color: rgba(239, 68, 68, 0.1);
  border-color: rgba(239, 68, 68, 0.2);
}

/* Modo Grade */
.games-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(130px, 1fr));
  gap: 14px;
}

@media (min-width: 640px) {
  .games-grid {
    grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
    gap: 16px;
  }
}

.grid-item-wrapper {
  position: relative;
}

.grid-rank-badge {
  position: absolute;
  top: 6px;
  left: 6px;
  z-index: 5;
  background-color: var(--color-accent);
  color: #ffffff;
  font-size: 0.72rem;
  font-weight: 800;
  padding: 2px 6px;
  border-radius: 4px;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.6);
}

.loading-state {
  text-align: center;
  padding: 60px 20px;
  color: var(--text-muted);
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
}

.empty-state {
  text-align: center;
  padding: 60px 20px;
}

.empty-icon-box {
  width: 64px;
  height: 64px;
  background-color: var(--bg-surface-elevated);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-sm);
  display: inline-flex;
  align-items: center;
  justify-content: center;
  color: var(--color-accent);
  margin-bottom: 16px;
}

.empty-title {
  font-size: 1.1rem;
  color: var(--text-main);
  margin-bottom: 8px;
}

.empty-desc {
  font-size: 0.84rem;
  color: var(--text-muted);
  max-width: 380px;
  margin: 0 auto 20px;
  line-height: 1.5;
}
</style>
