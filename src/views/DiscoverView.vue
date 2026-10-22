<template>
  <div class="search-page container fade-in">
    <header class="page-header">
      <div class="header-top">
        <h1 class="header-title mono">Buscar</h1>
        <RefreshButton
          v-if="!searchQuery.trim()"
          :is-refreshing="gamesStore.isRefreshingDiscover"
          @refresh="onForceRefresh"
        />
      </div>

      <!-- Barra de Busca no estilo CapyFlix / CapyShowTime -->
      <div class="search-bar">
        <Search :size="18" class="search-icon" />
        <input
          v-model="searchQuery"
          type="search"
          placeholder="Buscar jogo (ex: Elden Ring, Zelda, Halo)..."
          class="search-input"
          @input="onSearchInput"
        />
        <button v-if="searchQuery" class="clear-btn" @click="clearSearch">
          <X :size="16" />
        </button>
      </div>

      <!-- 1. Barra Rápida de Plataformas -->
      <div class="types-scroll-bar">
        <button
          v-for="plat in platformOptions"
          :key="plat.id"
          type="button"
          class="genre-pill"
          :class="{ active: selectedPlatform === plat.id }"
          @click="selectPlatform(plat.id)"
        >
          {{ plat.name }}
        </button>
      </div>

      <!-- 2. Filtro de Gêneros estilo CapyFlix -->
      <div class="genres-section">
        <div class="genres-label-row">
          <span class="filter-label mono">Gêneros:</span>
          <button
            v-if="selectedGenre !== ''"
            type="button"
            class="clear-genre-btn mono"
            @click="clearGenre"
          >
            Limpar gênero
          </button>
        </div>
        <div class="genres-scroll-bar">
          <button
            type="button"
            class="genre-pill"
            :class="{ active: selectedGenre === '' }"
            @click="clearGenre"
          >
            Todos
          </button>
          <button
            v-for="genre in genresList"
            :key="genre.id"
            type="button"
            class="genre-pill"
            :class="{ active: selectedGenre === genre.id }"
            @click="selectGenre(genre.id)"
          >
            {{ genre.name }}
          </button>
        </div>
      </div>
    </header>

    <main class="page-body">
      <!-- Cabeçalho dos Resultados + Seletor de Visualização (Justify Between) -->
      <div class="results-header">
        <span class="results-count mono">{{ displayResults.length }} jogos disponíveis</span>

        <!-- Botão de alternância da forma de visualização (Padrão vs 4 por linha) -->
        <div class="view-mode-toggle">
          <button
            type="button"
            class="view-toggle-btn"
            :class="{ active: viewMode === 'normal' }"
            title="Visualização Padrão"
            @click="viewMode = 'normal'"
          >
            <LayoutGrid :size="16" />
            <span class="mode-label">Padrão</span>
          </button>

          <button
            type="button"
            class="view-toggle-btn"
            :class="{ active: viewMode === 'compact' }"
            title="Visualização Compacta (4 por linha)"
            @click="viewMode = 'compact'"
          >
            <Grid :size="16" />
            <span class="mode-label">4 por linha</span>
          </button>
        </div>
      </div>

      <!-- Loading State -->
      <div v-if="isSearching || (gamesStore.isRefreshingDiscover && gamesStore.popularGames.length === 0)" class="loading-state">
        <div class="spinner"></div>
        <p>{{ isSearching ? 'Buscando jogos no acervo...' : 'Carregando catálogo...' }}</p>
      </div>

      <!-- Grade de Jogos (Padrão ou Compacta 4x4) -->
      <div
        v-else-if="displayResults.length > 0"
        class="games-grid"
        :class="{ 'compact-grid': viewMode === 'compact' }"
      >
        <GameCard
          v-for="item in displayResults"
          :key="item.id || item.external_id"
          :game="item"
          :compact="viewMode === 'compact'"
        />
      </div>

      <!-- Empty State no estilo CapyFlix / CapyShowTime -->
      <div v-else class="empty-state fade-in">
        <div class="empty-icon-box">
          <Gamepad2 :size="40" class="empty-icon" />
        </div>
        <h3 class="empty-title">Nenhum jogo encontrado</h3>
        <p class="empty-desc">
          Não encontramos resultados com esses filtros. Tente buscar por outros termos ou limpar a seleção.
        </p>
        <button type="button" class="btn-secondary" @click="resetFilters">
          Limpar Filtros
        </button>
      </div>
    </main>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { Search, X, Gamepad2, LayoutGrid, Grid } from 'lucide-vue-next'
import { useGamesStore } from '@/stores/games'
import { capyGamesApi, type GameSearchResult } from '@/api/capygames'
import GameCard from '@/components/GameCard.vue'
import RefreshButton from '@/components/RefreshButton.vue'

const gamesStore = useGamesStore()

const searchQuery = ref('')
const searchResults = ref<GameSearchResult[]>([])
const isSearching = ref(false)
const viewMode = ref<'normal' | 'compact'>('normal')

const selectedPlatform = ref('all')
const selectedGenre = ref('')

const platformOptions = [
  { id: 'all', name: 'Todas Plataformas' },
  { id: 'pc', name: 'PC' },
  { id: 'playstation', name: 'PlayStation' },
  { id: 'xbox', name: 'Xbox' },
  { id: 'nintendo', name: 'Nintendo' }
]

const genresList = [
  { id: 'rpg', name: 'RPGs' },
  { id: 'action', name: 'Ação' },
  { id: 'adventure', name: 'Aventura' },
  { id: 'shooter', name: 'Tiro / FPS' },
  { id: 'strategy', name: 'Estratégia' },
  { id: 'indie', name: 'Indie' },
  { id: 'horror', name: 'Terror' },
  { id: 'sports', name: 'Esportes' },
  { id: 'racing', name: 'Corrida' }
]

let searchTimer: number | undefined = undefined

function onSearchInput() {
  clearTimeout(searchTimer)
  const q = searchQuery.value.trim()
  if (!q) {
    searchResults.value = []
    return
  }

  isSearching.value = true
  searchTimer = window.setTimeout(async () => {
    try {
      const res = await capyGamesApi.search(q)
      searchResults.value = res.data.data || []
    } catch (e) {
      console.error('Erro ao buscar jogos:', e)
    } finally {
      isSearching.value = false
    }
  }, 350)
}

function clearSearch() {
  searchQuery.value = ''
  searchResults.value = []
}

async function onForceRefresh() {
  await gamesStore.fetchDiscover(true)
}

function selectPlatform(id: string) {
  selectedPlatform.value = id
}

function selectGenre(id: string) {
  selectedGenre.value = id
}

function clearGenre() {
  selectedGenre.value = ''
}

function resetFilters() {
  searchQuery.value = ''
  searchResults.value = []
  selectedPlatform.value = 'all'
  selectedGenre.value = ''
}

const displayResults = computed(() => {
  let list = searchQuery.value.trim() ? searchResults.value : gamesStore.popularGames

  // Filtro de plataforma
  if (selectedPlatform.value !== 'all') {
    const platQuery = selectedPlatform.value.toLowerCase()
    list = list.filter(g => {
      const plats = (g.platforms || []).map(p => p.toLowerCase())
      return plats.some(p => p.includes(platQuery))
    })
  }

  // Filtro de gênero
  if (selectedGenre.value) {
    const genQuery = selectedGenre.value.toLowerCase()
    list = list.filter(g => {
      const genres = (g.genres || []).map(gn => gn.toLowerCase())
      const summary = (g.summary || '').toLowerCase()
      return genres.some(gn => gn.includes(genQuery)) || summary.includes(genQuery)
    })
  }

  return list
})

onMounted(async () => {
  if (gamesStore.popularGames.length === 0) {
    await gamesStore.fetchDiscover()
  }
})
</script>

<style scoped>
.search-page {
  padding-top: 16px;
  padding-bottom: 32px;
}

.page-header {
  margin-bottom: 16px;
}

.header-top {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
  gap: 12px;
}

.header-title {
  font-size: 1.25rem;
  color: var(--text-main);
  margin-bottom: 0;
  line-height: 1.2;
}

/* Barra de Busca */
.search-bar {
  display: flex;
  align-items: center;
  background-color: var(--bg-surface-elevated);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-sm);
  padding: 8px 12px;
  gap: 8px;
  transition: border-color 0.2s;
  margin-bottom: 12px;
}

.search-bar:focus-within {
  border-color: var(--color-accent);
}

.search-icon {
  color: var(--text-muted);
  flex-shrink: 0;
}

.search-input {
  flex: 1;
  background: transparent;
  border: none;
  outline: none;
  color: var(--text-main);
  font-size: 0.9rem;
}

.search-input::placeholder {
  color: var(--text-dim);
}

.clear-btn {
  color: var(--text-muted);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 2px;
}

.clear-btn:hover {
  color: var(--text-main);
}

/* Formatos / Plataformas */
.types-scroll-bar {
  display: flex;
  gap: 6px;
  overflow-x: auto;
  padding-bottom: 8px;
  scrollbar-width: none;
}

.types-scroll-bar::-webkit-scrollbar {
  display: none;
}

/* Gêneros */
.genres-section {
  margin-top: 6px;
}

.genres-label-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 4px;
}

.filter-label {
  font-size: 0.72rem;
  color: var(--text-dim);
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.clear-genre-btn {
  font-size: 0.72rem;
  color: var(--color-accent);
  text-decoration: underline;
  cursor: pointer;
}

/* Resultados */
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
}

.view-toggle-btn:hover {
  color: var(--text-main);
}

.view-toggle-btn.active {
  background-color: var(--color-accent);
  color: #12100e;
}

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

.compact-grid {
  grid-template-columns: repeat(4, 1fr) !important;
  gap: 8px !important;
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
