<script setup lang="ts">
import { ref, onMounted, watch } from 'vue'
import { useRouter } from 'vue-router'
import { capyGamesApi, type GameSearchResult } from '@/api/capygames'
import { useGridMode } from '@/composables/useGridMode'
import GameStatusModal from '@/components/GameStatusModal.vue'
import {
  Search,
  Plus,
  Flame,
  RotateCw,
  X,
  Gamepad2,
  Grid2x2,
  LayoutGrid
} from 'lucide-vue-next'

const router = useRouter()
const { gridCols, setGridCols } = useGridMode()

const query = ref('')
const searchResults = ref<GameSearchResult[]>([])
const popularGames = ref<GameSearchResult[]>([])
const isSearching = ref(false)
const isLoadingPopular = ref(true)

const isModalOpen = ref(false)
const selectedGameCandidate = ref<GameSearchResult | null>(null)

const defaultCover = 'https://images.unsplash.com/photo-1550745165-9bc0b252726f?auto=format&fit=crop&w=400&q=80'

let debounceTimer: any = null

watch(query, (newVal) => {
  clearTimeout(debounceTimer)
  if (!newVal.trim() || newVal.trim().length < 2) {
    searchResults.value = []
    isSearching.value = false
    return
  }

  isSearching.value = true
  debounceTimer = setTimeout(async () => {
    try {
      const res = await capyGamesApi.search(newVal.trim())
      searchResults.value = res.data.data
    } catch (err) {
      console.error('Falha na busca:', err)
    } finally {
      isSearching.value = false
    }
  }, 350)
})

async function fetchPopular() {
  isLoadingPopular.value = true
  try {
    const res = await capyGamesApi.popular()
    popularGames.value = res.data.data
  } catch (err) {
    console.error('Falha ao buscar populares:', err)
  } finally {
    isLoadingPopular.value = false
  }
}

function openAddModal(game: GameSearchResult) {
  selectedGameCandidate.value = game
  isModalOpen.value = true
}

function openCustomModal() {
  selectedGameCandidate.value = {
    external_id: 'custom:' + Date.now(),
    external_source: 'manual',
    title: query.value.trim() || '',
    platforms: ['PC']
  }
  isModalOpen.value = true
}

function handleUpdated() {
  router.push('/')
}

onMounted(() => {
  fetchPopular()
})
</script>

<template>
  <div class="discover-page">
    <header class="page-header">
      <div class="container">
        <div class="header-top">
          <h1 class="header-title mono">Descobrir Jogos</h1>

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

            <button
              type="button"
              class="custom-pill-btn"
              @click="openCustomModal"
            >
              <Plus :size="15" />
              <span>Manual</span>
            </button>

            <button
              v-if="!query.trim()"
              type="button"
              class="refresh-btn"
              :class="{ spinning: isLoadingPopular }"
              :disabled="isLoadingPopular"
              title="Recarregar populares"
              @click="fetchPopular"
            >
              <RotateCw :size="18" />
            </button>
          </div>
        </div>

        <!-- Barra de Busca por Texto (estilo CapyShowTime) -->
        <div class="search-bar">
          <Search :size="18" class="search-icon" />
          <input
            v-model="query"
            type="search"
            class="search-input"
            placeholder="Buscar por título (ex: Zelda, Elden Ring, Halo)..."
          />
          <button v-if="query" type="button" class="clear-btn" @click="query = ''">
            <X :size="16" />
          </button>
        </div>
      </div>
    </header>

    <main class="container page-body">
      <!-- Search Results -->
      <section v-if="query.trim().length >= 2" class="section fade-in">
        <div class="section-header">
          <h2 class="section-title mono">Resultados da Busca</h2>
          <span class="results-count mono">{{ searchResults.length }} jogos</span>
        </div>

        <div v-if="isSearching && searchResults.length === 0" class="loading-state">
          <div class="spinner"></div>
          <p>Buscando nos catálogos Steam e Xbox...</p>
        </div>

        <div v-else-if="searchResults.length === 0" class="empty-search">
          <p>Nenhum jogo encontrado para "{{ query }}".</p>
          <button type="button" class="btn-primary mt-btn" @click="openCustomModal">
            <Plus :size="18" />
            <span>Cadastrar "{{ query }}" Manualmente</span>
          </button>
        </div>

        <div
          v-else
          class="results-grid"
          :class="gridCols === 4 ? 'grid-cols-4' : 'grid-cols-2'"
        >
          <div
            v-for="game in searchResults"
            :key="game.external_id"
            class="discover-card"
            :class="{ compact: gridCols === 4 }"
            @click="openAddModal(game)"
          >
            <div class="poster-container">
              <img
                v-if="game.cover_url"
                :src="game.cover_url"
                :alt="game.title"
                class="poster-img"
                loading="lazy"
                @error="($event.target as HTMLImageElement).src = defaultCover"
              />
              <div v-else class="poster-placeholder">
                <Gamepad2 :size="gridCols === 4 ? 22 : 28" />
              </div>

              <span class="source-badge" :class="game.external_source">
                {{ game.external_source }}
              </span>

              <button
                type="button"
                class="quick-add-badge"
                title="Adicionar à biblioteca"
                @click.stop="openAddModal(game)"
              >
                <Plus :size="gridCols === 4 ? 13 : 16" />
              </button>
            </div>

            <div class="card-info">
              <h3 class="card-title" :title="game.title">{{ game.title }}</h3>
              <span v-if="game.platforms" class="card-platform">
                {{ game.platforms.join(', ') }}
              </span>
            </div>
          </div>
        </div>
      </section>

      <!-- Popular & Featured Section -->
      <section v-else class="section fade-in">
        <div class="section-header">
          <h2 class="section-title mono">
            <Flame :size="18" class="text-flame" />
            <span>Populares na Comunidade</span>
          </h2>
        </div>

        <div v-if="isLoadingPopular" class="loading-state">
          <div class="spinner"></div>
          <p>Carregando jogos em alta...</p>
        </div>

        <div
          v-else
          class="results-grid"
          :class="gridCols === 4 ? 'grid-cols-4' : 'grid-cols-2'"
        >
          <div
            v-for="game in popularGames"
            :key="game.external_id"
            class="discover-card"
            :class="{ compact: gridCols === 4 }"
            @click="openAddModal(game)"
          >
            <div class="poster-container">
              <img
                v-if="game.cover_url"
                :src="game.cover_url"
                :alt="game.title"
                class="poster-img"
                loading="lazy"
                @error="($event.target as HTMLImageElement).src = defaultCover"
              />
              <div v-else class="poster-placeholder">
                <Gamepad2 :size="gridCols === 4 ? 22 : 28" />
              </div>

              <span class="source-badge steam">Steam</span>

              <button
                type="button"
                class="quick-add-badge"
                title="Adicionar à biblioteca"
                @click.stop="openAddModal(game)"
              >
                <Plus :size="gridCols === 4 ? 13 : 16" />
              </button>
            </div>

            <div class="card-info">
              <h3 class="card-title" :title="game.title">{{ game.title }}</h3>
              <span v-if="game.platforms" class="card-platform">
                {{ game.platforms.join(', ') }}
              </span>
            </div>
          </div>
        </div>
      </section>
    </main>

    <!-- Modal de adição -->
    <GameStatusModal
      :is-open="isModalOpen"
      :game-candidate="selectedGameCandidate"
      @close="isModalOpen = false"
      @updated="handleUpdated"
    />
  </div>
</template>

<style scoped>
.discover-page {
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
  gap: 8px;
  margin-bottom: 14px;
}

.header-title {
  font-size: 1.35rem;
  font-weight: 700;
  white-space: nowrap;
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
  color: #0c0a14;
}

.custom-pill-btn {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  padding: 8px 14px;
  border-radius: var(--radius-full);
  background-color: var(--bg-surface-elevated);
  border: 1px solid var(--color-border);
  color: var(--text-main);
  font-size: 0.8rem;
  font-weight: 600;
  transition: all 0.2s;
}

.custom-pill-btn:hover {
  border-color: var(--color-accent);
  color: var(--color-accent);
}

.refresh-btn {
  width: 38px;
  height: 38px;
  border-radius: var(--radius-full);
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: var(--bg-surface-elevated);
  border: 1px solid var(--color-border);
  color: var(--text-muted);
  transition: all 0.2s;
  flex-shrink: 0;
}

.refresh-btn:hover {
  color: var(--color-accent);
  border-color: var(--color-accent);
}

.refresh-btn.spinning svg {
  animation: spin 0.8s linear infinite;
  color: var(--color-accent);
}

.search-bar {
  display: flex;
  align-items: center;
  background-color: var(--bg-surface-elevated);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-full);
  padding: 0 16px;
  gap: 8px;
  transition: border-color 0.2s ease;
}

.search-bar:focus-within {
  border-color: var(--color-accent);
}

.search-icon {
  color: var(--text-muted);
}

.search-input {
  flex: 1;
  background: none;
  border: none;
  padding: 12px 0;
  color: var(--text-main);
  font-size: 0.92rem;
  outline: none;
}

.clear-btn {
  color: var(--text-muted);
  padding: 4px;
  display: flex;
  align-items: center;
}

.page-body {
  padding-top: 24px;
}

.section {
  margin-bottom: 32px;
}

.section-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 16px;
}

.section-title {
  font-size: 1.05rem;
  font-weight: 700;
  color: var(--text-main);
  display: flex;
  align-items: center;
  gap: 8px;
}

.text-flame {
  color: var(--color-accent);
}

.results-count {
  font-size: 0.78rem;
  color: var(--text-muted);
}

.results-grid {
  display: grid;
}

.results-grid.grid-cols-2 {
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 16px;
}

.results-grid.grid-cols-4 {
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 10px;
}

@media (min-width: 640px) {
  .results-grid.grid-cols-2 {
    gap: 20px;
  }
  .results-grid.grid-cols-4 {
    gap: 16px;
  }
}

.discover-card {
  cursor: pointer;
  transition: transform 0.2s ease;
  display: flex;
  flex-direction: column;
  min-width: 0;
}

.discover-card:hover {
  transform: translateY(-4px);
}

.discover-card:active {
  transform: scale(0.97);
}

.poster-container {
  position: relative;
  width: 100%;
  aspect-ratio: 2 / 3;
  border-radius: var(--radius-md);
  overflow: hidden;
  background-color: var(--bg-surface-elevated);
  border: 1px solid var(--color-border);
  transition: border-color 0.2s ease, box-shadow 0.2s ease;
}

.discover-card.compact .poster-container {
  border-radius: var(--radius-sm);
}

.discover-card:hover .poster-container {
  border-color: var(--color-accent);
  box-shadow: 0 8px 22px rgba(124, 58, 237, 0.22);
}

.poster-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  transition: transform 0.3s ease;
}

.discover-card:hover .poster-img {
  transform: scale(1.04);
}

.poster-placeholder {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--text-dim);
}

.source-badge {
  position: absolute;
  top: 8px;
  left: 8px;
  font-size: 0.65rem;
  font-weight: 700;
  padding: 3px 9px;
  border-radius: var(--radius-full);
  text-transform: uppercase;
  backdrop-filter: blur(6px);
  background: rgba(12, 10, 20, 0.8);
  color: var(--text-main);
  border: 1px solid rgba(255, 255, 255, 0.12);
}

.discover-card.compact .source-badge {
  top: 5px;
  left: 5px;
  font-size: 0.56rem;
  padding: 2px 6px;
}

.source-badge.steam {
  background: rgba(37, 99, 235, 0.85);
  color: #fff;
}

.source-badge.xbox {
  background: rgba(22, 163, 74, 0.85);
  color: #fff;
}

.quick-add-badge {
  position: absolute;
  bottom: 8px;
  right: 8px;
  width: 32px;
  height: 32px;
  border-radius: var(--radius-full);
  background-color: var(--color-accent);
  color: #0c0a14;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.45);
  transition: transform 0.2s ease, background-color 0.2s ease;
}

.discover-card.compact .quick-add-badge {
  bottom: 5px;
  right: 5px;
  width: 24px;
  height: 24px;
}

.quick-add-badge:hover {
  background-color: var(--color-accent-hover);
  transform: scale(1.08);
}

.card-info {
  margin-top: 8px;
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.discover-card.compact .card-info {
  margin-top: 5px;
}

.card-title {
  font-size: 0.86rem;
  font-weight: 600;
  color: var(--text-main);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.discover-card.compact .card-title {
  font-size: 0.74rem;
}

.card-platform {
  font-size: 0.74rem;
  color: var(--text-dim);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.discover-card.compact .card-platform {
  font-size: 0.65rem;
}

.loading-state,
.empty-search {
  text-align: center;
  padding: 50px 20px;
  color: var(--text-muted);
}

.mt-btn {
  margin-top: 16px;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}
</style>
