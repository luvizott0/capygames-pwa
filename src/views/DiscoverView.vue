<template>
  <div class="search-page container fade-in">
    <header class="page-header">
      <div class="header-top">
        <h1 class="header-title mono">Buscar</h1>
        <div class="header-actions">
          <button
            type="button"
            class="filter-toggle-btn"
            :class="{ active: showFiltersPanel || activeFilterCount > 0 }"
            @click="showFiltersPanel = !showFiltersPanel"
          >
            <SlidersHorizontal :size="16" />
            <span>Filtros</span>
            <span v-if="activeFilterCount > 0" class="filter-count-badge mono">
              {{ activeFilterCount }}
            </span>
          </button>

          <RefreshButton
            v-if="!searchQuery.trim() && !hasActiveFilters"
            :is-refreshing="gamesStore.isRefreshingDiscover"
            @refresh="onForceRefresh"
          />
        </div>
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

      <!-- Painel Expansível de Filtros (Igual CapyShowTime) -->
      <div v-if="showFiltersPanel && !searchQuery.trim()" class="filters-panel fade-in">
        <!-- 1. Plataforma -->
        <div class="filter-group">
          <label class="filter-label">
            <Gamepad2 :size="14" class="label-icon accent" />
            <span>Plataforma</span>
          </label>
          <div class="chips-row">
            <button
              v-for="plat in platformOptions"
              :key="plat.id"
              type="button"
              class="filter-chip"
              :class="{ active: selectedPlatform === plat.id }"
              @click="selectPlatform(plat.id)"
            >
              {{ plat.name }}
            </button>
          </div>
        </div>

        <!-- 2. Gênero -->
        <div class="filter-group">
          <label class="filter-label">
            <Tag :size="14" class="label-icon" />
            <span>Gênero</span>
          </label>
          <div class="chips-row">
            <button
              type="button"
              class="filter-chip"
              :class="{ active: selectedGenre === '' }"
              @click="clearGenre"
            >
              Todos
            </button>
            <button
              v-for="genre in genresList"
              :key="genre.id"
              type="button"
              class="filter-chip"
              :class="{ active: selectedGenre === genre.id }"
              @click="selectGenre(genre.id)"
            >
              {{ genre.name }}
            </button>
          </div>
        </div>

        <!-- 3. Ordenar por -->
        <div class="filter-group">
          <label class="filter-label">
            <ArrowUpDown :size="14" class="label-icon" />
            <span>Ordenar por</span>
          </label>
          <div class="chips-row">
            <button
              v-for="opt in sortOptions"
              :key="opt.value"
              type="button"
              class="filter-chip"
              :class="{ active: sortBy === opt.value }"
              @click="sortBy = opt.value"
            >
              {{ opt.label }}
            </button>
          </div>
        </div>

        <!-- Rodapé do painel de filtros (Limpar filtros) -->
        <div v-if="hasActiveFilters" class="filters-footer">
          <button type="button" class="reset-filters-btn mono" @click="resetFilters">
            <RotateCcw :size="12" />
            <span>Limpar filtros</span>
          </button>
        </div>
      </div>
    </header>

    <main class="page-body">
      <!-- Cabeçalho dos Resultados + Seletor de Visualização -->
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

      <!-- Loading State Inicial -->
      <div v-if="isSearching || (gamesStore.isRefreshingDiscover && gamesStore.popularGames.length === 0)" class="loading-state">
        <div class="spinner"></div>
        <p>{{ isSearching ? 'Buscando jogos no acervo...' : 'Carregando catálogo...' }}</p>
      </div>

      <!-- Grade de Jogos -->
      <template v-else-if="displayResults.length > 0">
        <div
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

        <!-- Scroll Infinito: Sentinel e Indicador de Carregamento -->
        <div
          v-if="!searchQuery.trim()"
          ref="sentinelRef"
          class="infinite-scroll-sentinel"
        >
          <div v-if="gamesStore.isLoadingMoreDiscover" class="infinite-loading">
            <div class="spinner-mini"></div>
            <span class="mono">Carregando mais jogos...</span>
          </div>
        </div>
      </template>

      <!-- Empty State -->
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
import { ref, computed, onMounted, onUnmounted, watch } from 'vue'
import {
  Search,
  X,
  Gamepad2,
  LayoutGrid,
  Grid,
  SlidersHorizontal,
  Tag,
  ArrowUpDown,
  RotateCcw
} from 'lucide-vue-next'
import { useGamesStore } from '@/stores/games'
import { capyGamesApi, type GameSearchResult } from '@/api/capygames'
import GameCard from '@/components/GameCard.vue'
import RefreshButton from '@/components/RefreshButton.vue'

const gamesStore = useGamesStore()

const searchQuery = ref('')
const searchResults = ref<GameSearchResult[]>([])
const isSearching = ref(false)
const viewMode = ref<'normal' | 'compact'>('normal')

const showFiltersPanel = ref(false)
const selectedPlatform = ref('all')
const selectedGenre = ref('')
const sortBy = ref<'popular' | 'alpha'>('popular')

const sentinelRef = ref<HTMLElement | null>(null)
let observer: IntersectionObserver | null = null

const sortOptions: Array<{ label: string; value: 'popular' | 'alpha' }> = [
  { label: 'Em Destaque / Populares', value: 'popular' },
  { label: 'Título (A-Z)', value: 'alpha' }
]

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

const activeFilterCount = computed(() => {
  let count = 0
  if (selectedPlatform.value !== 'all') count++
  if (selectedGenre.value !== '') count++
  if (sortBy.value !== 'popular') count++
  return count
})

const hasActiveFilters = computed(() => activeFilterCount.value > 0)

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
  sortBy.value = 'popular'
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

  // Ordenação
  if (sortBy.value === 'alpha') {
    list = [...list].sort((a, b) => (a.title || '').localeCompare(b.title || ''))
  }

  return list
})

function setupObserver() {
  if (observer) {
    observer.disconnect()
    observer = null
  }

  if (!sentinelRef.value) return

  observer = new IntersectionObserver(
    (entries) => {
      const entry = entries[0]
      if (entry && entry.isIntersecting && !searchQuery.value.trim() && gamesStore.discoverHasMore) {
        gamesStore.loadMorePopular()
      }
    },
    {
      rootMargin: '300px 0px'
    }
  )

  observer.observe(sentinelRef.value)
}

watch(sentinelRef, () => {
  setupObserver()
})

onMounted(async () => {
  if (gamesStore.popularGames.length === 0) {
    await gamesStore.fetchDiscover()
  }
  setupObserver()
})

onUnmounted(() => {
  if (observer) {
    observer.disconnect()
    observer = null
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

.header-actions {
  display: flex;
  align-items: center;
  gap: 8px;
}

/* Botão de Filtros igual CapyShowTime */
.filter-toggle-btn {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 8px 12px;
  border-radius: var(--radius-sm);
  background-color: var(--bg-surface-elevated);
  border: 1px solid var(--color-border);
  color: var(--text-muted);
  font-size: 0.82rem;
  font-weight: 600;
  transition: all 0.2s;
  cursor: pointer;
}

.filter-toggle-btn.active {
  border-color: var(--color-accent);
  color: var(--color-accent);
  background-color: rgba(245, 197, 24, 0.1);
}

.filter-count-badge {
  background-color: var(--color-accent);
  color: #12100e;
  font-size: 0.7rem;
  font-weight: 700;
  padding: 1px 6px;
  border-radius: var(--radius-sm);
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

/* Painel de Filtros Avançados */
.filters-panel {
  margin-top: 4px;
  margin-bottom: 16px;
  padding: 14px;
  background-color: var(--bg-surface-elevated);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-sm);
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.filter-group {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.filter-label {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-size: 0.75rem;
  font-weight: 700;
  color: var(--text-muted);
  text-transform: uppercase;
  letter-spacing: 0.03em;
}

.label-icon {
  color: var(--text-dim);
}

.label-icon.accent {
  color: var(--color-accent);
}

.chips-row {
  display: flex;
  gap: 8px;
  overflow-x: auto;
  padding-bottom: 2px;
  scrollbar-width: none;
}

.chips-row::-webkit-scrollbar {
  display: none;
}

.filter-chip {
  padding: 6px 12px;
  border-radius: var(--radius-sm);
  background-color: var(--bg-surface);
  border: 1px solid var(--color-border);
  color: var(--text-muted);
  font-size: 0.78rem;
  font-weight: 600;
  white-space: nowrap;
  transition: all 0.15s;
  cursor: pointer;
}

.filter-chip:hover {
  color: var(--text-main);
  border-color: var(--color-primary-light);
}

.filter-chip.active {
  background-color: rgba(245, 197, 24, 0.15);
  border-color: var(--color-accent);
  color: var(--color-accent);
  font-weight: 700;
}

.filters-footer {
  display: flex;
  justify-content: flex-end;
  padding-top: 4px;
  border-top: 1px solid var(--color-border);
}

.reset-filters-btn {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 6px 10px;
  border-radius: var(--radius-sm);
  background: none;
  border: 1px solid var(--color-border);
  color: var(--text-dim);
  font-size: 0.75rem;
  cursor: pointer;
  transition: all 0.2s;
}

.reset-filters-btn:hover {
  color: var(--color-accent);
  border-color: var(--color-accent);
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

/* Scroll Infinito */
.infinite-scroll-sentinel {
  min-height: 48px;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-top: 24px;
  margin-bottom: 24px;
}

.infinite-loading {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  color: var(--text-muted);
  font-size: 0.8rem;
}

.spinner-mini {
  width: 16px;
  height: 16px;
  border: 2px solid var(--color-border);
  border-top-color: var(--color-accent);
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
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

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}
</style>
