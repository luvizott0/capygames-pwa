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

        <!-- Barra de Busca por Texto -->
        <div class="search-bar">
          <Search :size="18" class="search-icon" />
          <input
            v-model="searchQuery"
            type="search"
            placeholder="Buscar por título (ex: Elden Ring, Zelda, Halo)..."
            class="search-input"
            @input="onSearchInput"
          />
          <button v-if="searchQuery" class="clear-btn" @click="clearSearch">
            <X :size="16" />
          </button>
        </div>

        <!-- Barra Rápida de Plataformas / Categorias (Scroll Lateral) -->
        <div v-if="!searchQuery.trim()" class="genres-scroll-bar">
          <button
            type="button"
            class="genre-pill"
            :class="{ active: selectedPlatform === '' }"
            @click="selectedPlatform = ''"
          >
            Todos
          </button>
          <button
            v-for="plat in platformsList"
            :key="plat.id"
            type="button"
            class="genre-pill"
            :class="{ active: selectedPlatform === plat.id }"
            @click="togglePlatform(plat.id)"
          >
            {{ plat.name }}
          </button>
        </div>

        <!-- Painel Expansível de Filtros Avançados -->
        <div v-if="showFiltersPanel && !searchQuery.trim()" class="filters-panel fade-in">
          <!-- 1. Catálogo / Loja -->
          <div class="filter-group">
            <label class="filter-label">
              <Gamepad2 :size="14" class="label-icon accent" />
              <span>Loja / Catálogo</span>
            </label>
            <div class="chips-row">
              <button
                v-for="opt in sourceOptions"
                :key="opt.value"
                type="button"
                class="filter-chip"
                :class="{ active: filters.source === opt.value }"
                @click="filters.source = opt.value"
              >
                {{ opt.label }}
              </button>
            </div>
          </div>

          <!-- 2. Ordenar por -->
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
                :class="{ active: filters.sortBy === opt.value }"
                @click="filters.sortBy = opt.value"
              >
                {{ opt.label }}
              </button>
            </div>
          </div>

          <!-- 3. Cadastro Manual -->
          <div class="filter-group">
            <label class="filter-label">
              <Plus :size="14" class="label-icon" />
              <span>Jogo fora do catálogo</span>
            </label>
            <div class="chips-row">
              <button type="button" class="filter-chip active" @click="openCustomModal">
                + Cadastrar Jogo Manualmente
              </button>
            </div>
          </div>

          <div v-if="hasActiveFilters" class="filters-footer">
            <button type="button" class="reset-filters-btn" @click="resetAllFilters">
              <RotateCcw :size="14" />
              <span>Limpar todos os filtros</span>
            </button>
          </div>
        </div>
      </div>
    </header>

    <main class="container page-body">
      <!-- Loading State da Busca por Texto -->
      <div v-if="searching" class="loading-state">
        <div class="spinner"></div>
        <p>Buscando jogos...</p>
      </div>

      <!-- Search Results -->
      <section v-else-if="searchQuery.trim()" class="section fade-in">
        <h2 class="section-title mono">Resultados da Busca</h2>
        <div v-if="searchResults.length === 0" class="empty-search">
          <p>Nenhum jogo encontrado para "{{ searchQuery }}".</p>
          <button type="button" class="btn-secondary mt-btn" @click="openCustomModal">
            + Cadastrar "{{ searchQuery }}" Manualmente
          </button>
        </div>
        <div
          v-else
          class="series-grid"
          :class="gridCols === 4 ? 'grid-cols-4' : 'grid-cols-2'"
        >
          <div
            v-for="game in searchResults"
            :key="game.external_id"
            class="series-card"
            :class="{ compact: gridCols === 4 }"
            @click="onSelectGame(game)"
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
                <Gamepad2 :size="28" />
              </div>
              <div class="rating-badge mono">
                {{ game.external_source.toUpperCase() }}
              </div>
            </div>
            <div class="series-info">
              <h3 class="series-title">{{ game.title }}</h3>
              <span class="series-year">{{ (game.platforms || ['PC']).join(', ') }}</span>
            </div>
          </div>
        </div>
      </section>

      <!-- Resultados Filtrados -->
      <section v-else-if="hasActiveFilters" class="section fade-in">
        <div class="filtered-header">
          <div>
            <h2 class="section-title mono">Jogos Filtrados</h2>
            <p class="filtered-subtitle">
              {{ filteredGames.length }} jogos encontrados em destaque
            </p>
          </div>
          <button type="button" class="clear-inline-btn" @click="resetAllFilters">
            <X :size="14" />
            <span>Limpar</span>
          </button>
        </div>

        <div v-if="filteredGames.length === 0" class="empty-search">
          <p>Nenhum jogo encontrado com essa combinação de filtros.</p>
          <button type="button" class="btn-secondary mt-btn" @click="resetAllFilters">
            Remover Filtros
          </button>
        </div>

        <div
          v-else
          class="series-grid"
          :class="gridCols === 4 ? 'grid-cols-4' : 'grid-cols-2'"
        >
          <div
            v-for="game in filteredGames"
            :key="game.external_id"
            class="series-card"
            :class="{ compact: gridCols === 4 }"
            @click="onSelectGame(game)"
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
                <Gamepad2 :size="28" />
              </div>
              <div class="rating-badge mono">
                {{ game.external_source.toUpperCase() }}
              </div>
            </div>
            <div class="series-info">
              <h3 class="series-title">{{ game.title }}</h3>
              <span class="series-year">{{ (game.platforms || ['PC']).join(', ') }}</span>
            </div>
          </div>
        </div>
      </section>

      <!-- Trending / Popular (padrão sem filtros ativos) -->
      <div v-else class="fade-in">
        <section class="section">
          <h2 class="section-title mono">Em Alta Esta Semana</h2>
          <div
            class="series-grid"
            :class="gridCols === 4 ? 'grid-cols-4' : 'grid-cols-2'"
          >
            <div
              v-for="game in trendingSlice"
              :key="game.external_id"
              class="series-card"
              :class="{ compact: gridCols === 4 }"
              @click="onSelectGame(game)"
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
                  <Gamepad2 :size="28" />
                </div>
                <div class="rating-badge mono">
                  ★ DESTAQUE
                </div>
              </div>
              <div class="series-info">
                <h3 class="series-title">{{ game.title }}</h3>
                <span class="series-year">{{ (game.platforms || ['PC']).join(', ') }}</span>
              </div>
            </div>
          </div>
        </section>

        <section class="section">
          <h2 class="section-title mono">Mais Populares</h2>
          <div
            class="series-grid"
            :class="gridCols === 4 ? 'grid-cols-4' : 'grid-cols-2'"
          >
            <div
              v-for="game in popularSlice"
              :key="game.external_id"
              class="series-card"
              :class="{ compact: gridCols === 4 }"
              @click="onSelectGame(game)"
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
                  <Gamepad2 :size="28" />
                </div>
                <div class="rating-badge mono">
                  STEAM
                </div>
              </div>
              <div class="series-info">
                <h3 class="series-title">{{ game.title }}</h3>
                <span class="series-year">{{ (game.platforms || ['PC']).join(', ') }}</span>
              </div>
            </div>
          </div>
        </section>
      </div>
    </main>

    <!-- Modal de Adição de Jogo -->
    <GameStatusModal
      :is-open="isModalOpen"
      :game-candidate="selectedGameCandidate"
      @close="isModalOpen = false"
      @updated="handleUpdated"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import {
  Search,
  X,
  Gamepad2,
  SlidersHorizontal,
  ArrowUpDown,
  Plus,
  RotateCcw,
  Grid2x2,
  LayoutGrid
} from 'lucide-vue-next'
import { capyGamesApi, type GameSearchResult } from '@/api/capygames'
import { useGamesStore } from '@/stores/games'
import { useGridMode } from '@/composables/useGridMode'
import GameStatusModal from '@/components/GameStatusModal.vue'
import RefreshButton from '@/components/RefreshButton.vue'

const router = useRouter()
const gamesStore = useGamesStore()
const { gridCols, setGridCols } = useGridMode()

const defaultCover = 'https://images.unsplash.com/photo-1550745165-9bc0b252726f?auto=format&fit=crop&w=400&q=80'

const searchQuery = computed({
  get: () => gamesStore.discoverSearchQuery,
  set: (v: string) => { gamesStore.discoverSearchQuery = v }
})
const searchResults = computed({
  get: () => gamesStore.discoverSearchResults,
  set: (v: GameSearchResult[]) => { gamesStore.discoverSearchResults = v }
})
const searching = ref(false)
let debounceTimeout: any = null

const showFiltersPanel = computed({
  get: () => gamesStore.discoverShowFiltersPanel,
  set: (v: boolean) => { gamesStore.discoverShowFiltersPanel = v }
})

const platformsList = [
  { id: 'PC', name: 'PC / Steam' },
  { id: 'PlayStation', name: 'PlayStation' },
  { id: 'Xbox', name: 'Xbox' },
  { id: 'Nintendo Switch', name: 'Nintendo Switch' },
  { id: 'Steam Deck', name: 'Steam Deck' },
  { id: 'Retro', name: 'Retro / Emulador' }
]

const selectedPlatform = computed({
  get: () => gamesStore.discoverSelectedPlatform,
  set: (v: string) => { gamesStore.discoverSelectedPlatform = v }
})

const filters = gamesStore.discoverFilters

const sourceOptions = [
  { label: 'Todos', value: '' },
  { label: 'Steam', value: 'steam' },
  { label: 'Xbox Live', value: 'xbox' }
]

const sortOptions = [
  { label: 'Mais Populares', value: 'popular' },
  { label: 'Ordem Alfabética (A–Z)', value: 'title_asc' }
]

const activeFilterCount = computed(() => {
  let count = 0
  if (selectedPlatform.value !== '') count++
  if (filters.source !== '') count++
  if (filters.sortBy !== 'popular') count++
  return count
})

const hasActiveFilters = computed(() => activeFilterCount.value > 0)

const filteredGames = computed(() => {
  let list = [...gamesStore.popularGames]
  if (selectedPlatform.value) {
    list = list.filter(g =>
      (g.platforms || []).some(p => p.toLowerCase().includes(selectedPlatform.value.toLowerCase()))
    )
  }
  if (filters.source) {
    list = list.filter(g => g.external_source === filters.source)
  }
  if (filters.sortBy === 'title_asc') {
    list.sort((a, b) => a.title.localeCompare(b.title))
  }
  return list
})

const trendingSlice = computed(() => gamesStore.popularGames.slice(0, 6))
const popularSlice = computed(() => gamesStore.popularGames.slice(6))

const isModalOpen = ref(false)
const selectedGameCandidate = ref<GameSearchResult | null>(null)

function onForceRefresh() {
  gamesStore.fetchDiscover(true)
}

function togglePlatform(platId: string) {
  if (selectedPlatform.value === platId) {
    selectedPlatform.value = ''
  } else {
    selectedPlatform.value = platId
  }
}

function resetAllFilters() {
  gamesStore.resetDiscoverFilters()
}

function onSearchInput() {
  clearTimeout(debounceTimeout)
  if (!searchQuery.value.trim() || searchQuery.value.trim().length < 2) {
    searchResults.value = []
    return
  }

  debounceTimeout = setTimeout(async () => {
    searching.value = true
    try {
      const res = await capyGamesApi.search(searchQuery.value.trim())
      searchResults.value = res.data.data || []
    } catch (err) {
      console.error('Erro na busca:', err)
    } finally {
      searching.value = false
    }
  }, 400)
}

function clearSearch() {
  gamesStore.clearDiscoverSearch()
}

function onSelectGame(game: GameSearchResult) {
  if (game.id) {
    router.push(`/game/${game.id}`)
    return
  }
  selectedGameCandidate.value = game
  isModalOpen.value = true
}

function openCustomModal() {
  selectedGameCandidate.value = {
    external_id: 'custom:' + Date.now(),
    external_source: 'manual',
    title: searchQuery.value.trim() || '',
    platforms: ['PC']
  }
  isModalOpen.value = true
}

function handleUpdated(userGame: any) {
  gamesStore.invalidateAllCache()
  if (userGame?.game_id) {
    router.push(`/game/${userGame.game_id}`)
  } else {
    router.push('/my-list')
  }
}

onMounted(() => {
  gamesStore.fetchDiscover(false)
})
</script>

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

.filter-toggle-btn {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 8px 12px;
  border-radius: var(--radius-md);
  background-color: var(--bg-surface-elevated);
  border: 1px solid var(--color-border);
  color: var(--text-muted);
  font-size: 0.82rem;
  font-weight: 600;
  transition: all 0.2s;
}

.filter-toggle-btn.active {
  border-color: var(--color-accent);
  color: var(--color-accent);
  background-color: rgba(192, 132, 252, 0.12);
}

.filter-count-badge {
  background-color: var(--color-accent);
  color: #0f0d15;
  font-size: 0.7rem;
  font-weight: 700;
  padding: 1px 6px;
  border-radius: var(--radius-full);
}

.search-bar {
  display: flex;
  align-items: center;
  background-color: var(--bg-surface-elevated);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  padding: 0 12px;
  gap: 8px;
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
  font-size: 0.95rem;
  outline: none;
}

.clear-btn {
  color: var(--text-muted);
  padding: 4px;
}

/* Barra de Gêneros / Plataformas */
.genres-scroll-bar {
  display: flex;
  gap: 8px;
  overflow-x: auto;
  padding: 12px 0 4px;
  scrollbar-width: none;
}

.genres-scroll-bar::-webkit-scrollbar {
  display: none;
}

.genre-pill {
  padding: 6px 14px;
  border-radius: var(--radius-full);
  background-color: var(--bg-surface-elevated);
  border: 1px solid var(--color-border);
  color: var(--text-muted);
  font-size: 0.8rem;
  font-weight: 600;
  white-space: nowrap;
  transition: all 0.2s;
}

.genre-pill:hover {
  color: var(--text-main);
}

.genre-pill.active {
  background-color: var(--color-accent);
  color: #0f0d15;
  border-color: var(--color-accent);
  font-weight: 700;
}

/* Painel de Filtros Avançados */
.filters-panel {
  margin-top: 12px;
  padding-top: 12px;
  border-top: 1px solid var(--color-border);
  display: flex;
  flex-direction: column;
  gap: 14px;
  max-height: 60vh;
  overflow-y: auto;
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
  background-color: var(--bg-surface-elevated);
  border: 1px solid var(--color-border);
  color: var(--text-muted);
  font-size: 0.78rem;
  font-weight: 600;
  white-space: nowrap;
  transition: all 0.15s;
}

.filter-chip.active {
  background-color: rgba(192, 132, 252, 0.15);
  border-color: var(--color-accent);
  color: var(--color-accent);
}

.filters-footer {
  display: flex;
  justify-content: flex-end;
  padding-top: 4px;
}

.reset-filters-btn {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-size: 0.78rem;
  font-weight: 600;
  color: var(--color-danger);
  padding: 6px 10px;
  border-radius: var(--radius-sm);
  background-color: rgba(239, 68, 68, 0.1);
}

.page-body {
  padding-top: 24px;
}

.section {
  margin-bottom: 32px;
}

.filtered-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 16px;
}

.filtered-header .section-title {
  margin-bottom: 2px;
}

.filtered-subtitle {
  font-size: 0.78rem;
  color: var(--text-muted);
}

.clear-inline-btn {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  font-size: 0.78rem;
  color: var(--text-muted);
  padding: 6px 10px;
  border-radius: var(--radius-sm);
  background-color: var(--bg-surface);
  border: 1px solid var(--color-border);
}

.section-title {
  font-size: 1.1rem;
  color: var(--text-main);
  margin-bottom: 16px;
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
  font-size: 0.58rem;
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

.series-year {
  font-size: 0.75rem;
  color: var(--text-dim);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  display: block;
}

.series-card.compact .series-year {
  font-size: 0.65rem;
}

.mt-btn {
  margin-top: 12px;
}

.loading-state, .empty-search {
  text-align: center;
  padding: 48px 0;
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
</style>
