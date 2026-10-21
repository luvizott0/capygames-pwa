<template>
  <div class="my-list-page">
    <header class="page-header">
      <div class="container">
        <div class="header-top">
          <h1 class="header-title mono">Minha Lista</h1>
          <div class="header-actions">
            <!-- Toggle Grid 2 ou 4 colunas -->
            <div class="grid-toggle" role="group" aria-label="Modo de visualização">
              <button
                type="button"
                class="grid-toggle-btn mono"
                :class="{ active: gridCols === 2 }"
                title="Grid de 2 colunas"
                @click="setGridCols(2)"
              >
                <Grid2x2 :size="15" />
                <span>2</span>
              </button>
              <button
                type="button"
                class="grid-toggle-btn mono"
                :class="{ active: gridCols === 4 }"
                title="Grid de 4 colunas"
                @click="setGridCols(4)"
              >
                <LayoutGrid :size="15" />
                <span>4</span>
              </button>
            </div>

            <!-- Botão de Recarregamento Forçado -->
            <RefreshButton
              :is-refreshing="gamesStore.isRefreshingMyList"
              @refresh="onForceRefresh"
            />
          </div>
        </div>

        <!-- Abas de Filtro -->
        <div class="tabs-container">
          <button
            v-for="tab in tabs"
            :key="tab.value"
            class="tab-btn"
            :class="{ active: currentTab === tab.value }"
            @click="setTab(tab.value)"
          >
            {{ tab.label }}
          </button>
        </div>
      </div>
    </header>

    <main class="container page-body">
      <!-- Loading State Inicial -->
      <div v-if="gamesStore.isRefreshingMyList && !gamesStore.myListLoaded" class="loading-state">
        <div class="spinner"></div>
        <p>Carregando sua lista...</p>
      </div>

      <div v-else-if="filteredList.length === 0" class="empty-state fade-in">
        <Bookmark :size="48" class="empty-icon" />
        <h3 class="empty-title">Nenhum jogo aqui ainda</h3>
        <p class="empty-desc">Adicione jogos para organizar o que você quer jogar ou já zerou!</p>
        <router-link to="/discover" class="btn-primary">
          <Search :size="18" />
          <span>Buscar Jogos</span>
        </router-link>
      </div>

      <div
        v-else
        class="series-grid fade-in"
        :class="gridCols === 4 ? 'grid-cols-4' : 'grid-cols-2'"
      >
        <div
          v-for="item in filteredList"
          :key="item.id"
          class="series-card"
          :class="{ compact: gridCols === 4 }"
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
              <Gamepad2 :size="28" />
            </div>
            <div class="status-badge">
              {{ getStatusLabel(item.status) }}
            </div>
            <div v-if="item.rating" class="rating-badge mono">
              ★ {{ Number(item.rating).toFixed(1) }}
            </div>
          </div>
          <div class="series-info">
            <h3 class="series-title">{{ item.game.title }}</h3>
            <span class="series-seasons mono">
              {{ item.platform || 'PC' }}<template v-if="item.hours_played > 0"> • {{ item.hours_played }}h</template>
            </span>
          </div>
        </div>
      </div>
    </main>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { Bookmark, Search, Gamepad2, Grid2x2, LayoutGrid } from 'lucide-vue-next'
import { useGamesStore } from '@/stores/games'
import { useGridMode } from '@/composables/useGridMode'
import RefreshButton from '@/components/RefreshButton.vue'

const router = useRouter()
const gamesStore = useGamesStore()
const { gridCols, setGridCols } = useGridMode()

const currentTab = computed({
  get: () => gamesStore.myListActiveTab,
  set: (val: string) => { gamesStore.myListActiveTab = val }
})

const tabs = [
  { label: 'Todos', value: 'all' },
  { label: 'Jogando', value: 'playing' },
  { label: 'Quero Jogar', value: 'plan_to_play' },
  { label: 'Zerados', value: 'completed' },
  { label: 'Platinados', value: 'mastered' },
  { label: 'Em Pausa', value: 'on_hold' },
  { label: 'Abandonados', value: 'dropped' },
]

function onForceRefresh() {
  gamesStore.fetchMyList(true)
}

const filteredList = computed(() => {
  if (currentTab.value === 'all') return gamesStore.myList
  return gamesStore.myList.filter(i => i.status === currentTab.value)
})

function setTab(tab: string) {
  gamesStore.myListActiveTab = tab
}

function getStatusLabel(status: string): string {
  switch (status) {
    case 'plan_to_play': return 'Na Fila'
    case 'playing': return 'Jogando'
    case 'completed': return 'Zerado'
    case 'mastered': return 'Platinado'
    case 'on_hold': return 'Em Pausa'
    case 'dropped': return 'Abandonado'
    default: return status
  }
}

function goToGame(gameId: number) {
  router.push(`/game/${gameId}`)
}

onMounted(() => {
  gamesStore.fetchMyList(false)
})
</script>

<style scoped>
.my-list-page {
  padding-bottom: 90px;
}

.page-header {
  padding: calc(var(--safe-top) + 16px) 0 12px;
  background-color: var(--bg-surface);
  border-bottom: 1px solid var(--color-border);
  position: sticky;
  top: 0;
  z-index: 10;
}

.header-top {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 14px;
}

.header-title {
  font-size: 1.4rem;
  font-weight: 700;
}

.header-actions {
  display: flex;
  align-items: center;
  gap: 8px;
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
  padding: 5px 10px;
  border-radius: var(--radius-full);
  color: var(--text-muted);
  font-size: 0.75rem;
  font-weight: 700;
  transition: all 0.2s ease;
}

.grid-toggle-btn:hover {
  color: var(--text-main);
}

.grid-toggle-btn.active {
  background-color: var(--color-accent);
  color: #0f0d15;
}

.tabs-container {
  display: flex;
  gap: 8px;
  overflow-x: auto;
  padding-bottom: 4px;
  scrollbar-width: none;
}
.tabs-container::-webkit-scrollbar {
  display: none;
}

.tab-btn {
  padding: 8px 16px;
  background-color: var(--bg-surface-elevated);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-full);
  color: var(--text-muted);
  font-size: 0.85rem;
  font-weight: 500;
  white-space: nowrap;
  transition: all 0.2s;
}

.tab-btn.active {
  background-color: var(--color-accent);
  color: #0f0d15;
  border-color: var(--color-accent);
  font-weight: 700;
}

.page-body {
  padding-top: 24px;
}

.series-grid {
  display: grid;
  gap: 16px;
}

.series-grid.grid-cols-2 {
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 16px;
}

.series-grid.grid-cols-4 {
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 10px;
}

@media (min-width: 640px) {
  .series-grid.grid-cols-2 {
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 20px;
  }
  .series-grid.grid-cols-4 {
    grid-template-columns: repeat(4, minmax(0, 1fr));
    gap: 16px;
  }
}

.series-card {
  cursor: pointer;
  transition: transform 0.2s;
  min-width: 0;
}

.series-card:hover {
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

.series-card.compact .poster-container {
  border-radius: var(--radius-sm);
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

.status-badge {
  position: absolute;
  top: 8px;
  left: 8px;
  background: rgba(0, 0, 0, 0.8);
  color: var(--text-main);
  font-size: 0.7rem;
  font-weight: 600;
  padding: 2px 6px;
  border-radius: var(--radius-sm);
  backdrop-filter: blur(4px);
}

.series-card.compact .status-badge {
  top: 5px;
  left: 5px;
  font-size: 0.58rem;
  padding: 1px 5px;
}

.rating-badge {
  position: absolute;
  top: 8px;
  right: 8px;
  background: rgba(0, 0, 0, 0.8);
  color: var(--color-accent);
  font-size: 0.72rem;
  font-weight: 700;
  padding: 2px 6px;
  border-radius: var(--radius-sm);
  backdrop-filter: blur(4px);
}

.series-card.compact .rating-badge {
  top: 5px;
  right: 5px;
  font-size: 0.6rem;
  padding: 1px 4px;
}

.series-info {
  margin-top: 8px;
}

.series-card.compact .series-info {
  margin-top: 5px;
}

.series-title {
  font-size: 0.85rem;
  font-weight: 600;
  color: var(--text-main);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.series-card.compact .series-title {
  font-size: 0.74rem;
}

.series-seasons {
  font-size: 0.75rem;
  color: var(--text-dim);
}

.series-card.compact .series-seasons {
  font-size: 0.65rem;
}

.loading-state, .empty-state {
  text-align: center;
  padding: 60px 0;
  color: var(--text-muted);
}

.empty-icon {
  color: var(--color-accent);
  margin-bottom: 12px;
}

.empty-title {
  font-size: 1.15rem;
  font-weight: 700;
  margin-bottom: 6px;
  color: var(--text-main);
}

.empty-desc {
  font-size: 0.85rem;
  margin-bottom: 20px;
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
