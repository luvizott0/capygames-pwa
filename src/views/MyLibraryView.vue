<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { capyGamesApi, type CapyUserGame } from '@/api/capygames'
import { useGridMode } from '@/composables/useGridMode'
import GameCard from '@/components/GameCard.vue'
import GameStatusModal from '@/components/GameStatusModal.vue'
import {
  Search,
  Plus,
  SlidersHorizontal,
  RotateCw,
  Trophy,
  Gamepad2,
  X,
  Grid2x2,
  LayoutGrid
} from 'lucide-vue-next'

const router = useRouter()
const { gridCols, setGridCols } = useGridMode()

const library = ref<CapyUserGame[]>([])
const isLoading = ref(true)
const activeTab = ref<string>('all')
const searchQuery = ref('')
const selectedPlatform = ref('all')

const isModalOpen = ref(false)
const selectedUserGame = ref<CapyUserGame | null>(null)

const tabs = [
  { id: 'all', label: 'Todos' },
  { id: 'playing', label: 'Jogando' },
  { id: 'plan_to_play', label: 'Na Fila' },
  { id: 'completed', label: 'Zerados' },
  { id: 'mastered', label: 'Platinas', icon: Trophy },
  { id: 'on_hold', label: 'Em Pausa' },
  { id: 'dropped', label: 'Abandonados' }
]

const availablePlatforms = computed(() => {
  const set = new Set<string>()
  library.value.forEach(ug => {
    if (ug.platform) set.add(ug.platform)
  })
  return Array.from(set)
})

async function fetchLibrary() {
  isLoading.value = true
  try {
    const res = await capyGamesApi.getMyLibrary()
    library.value = res.data.data
  } catch (err) {
    console.error('Falha ao buscar biblioteca:', err)
  } finally {
    isLoading.value = false
  }
}

const filteredGames = computed(() => {
  return library.value.filter(ug => {
    if (activeTab.value !== 'all' && ug.status !== activeTab.value) {
      return false
    }

    if (selectedPlatform.value !== 'all' && ug.platform !== selectedPlatform.value) {
      return false
    }

    if (searchQuery.value.trim()) {
      const q = searchQuery.value.toLowerCase()
      const titleMatch = ug.game.title.toLowerCase().includes(q)
      const platMatch = ug.platform?.toLowerCase().includes(q)
      if (!titleMatch && !platMatch) return false
    }

    return true
  })
})

function getCount(tabId: string): number {
  if (tabId === 'all') return library.value.length
  return library.value.filter(ug => ug.status === tabId).length
}

function handleCardClick(ug: CapyUserGame) {
  selectedUserGame.value = ug
  isModalOpen.value = true
}

function handleUpdated(updatedUserGame: CapyUserGame) {
  const index = library.value.findIndex(ug => ug.id === updatedUserGame.id)
  if (index !== -1) {
    library.value[index] = updatedUserGame
  } else {
    library.value.unshift(updatedUserGame)
  }
}

function handleRemoved(id: number) {
  library.value = library.value.filter(ug => ug.id !== id)
}

onMounted(() => {
  fetchLibrary()
})
</script>

<template>
  <div class="library-page">
    <header class="page-header">
      <div class="container">
        <div class="header-top">
          <h1 class="header-title mono">Minha Biblioteca</h1>

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
              class="refresh-btn"
              :class="{ spinning: isLoading }"
              :disabled="isLoading"
              title="Recarregar biblioteca"
              @click="fetchLibrary"
            >
              <RotateCw :size="18" />
            </button>

            <button type="button" class="add-pill-btn" @click="router.push('/discover')">
              <Plus :size="16" />
              <span>Buscar</span>
            </button>
          </div>
        </div>

        <!-- Barra de Busca e Plataforma -->
        <div class="filters-row">
          <div class="search-bar">
            <Search :size="18" class="search-icon" />
            <input
              v-model="searchQuery"
              type="search"
              class="search-input"
              placeholder="Filtrar por nome ou plataforma..."
            />
            <button v-if="searchQuery" type="button" class="clear-btn" @click="searchQuery = ''">
              <X :size="16" />
            </button>
          </div>

          <div v-if="availablePlatforms.length > 0" class="platform-filter">
            <SlidersHorizontal :size="14" class="filter-icon" />
            <select v-model="selectedPlatform" class="platform-select">
              <option value="all">Plataformas</option>
              <option v-for="p in availablePlatforms" :key="p" :value="p">{{ p }}</option>
            </select>
          </div>
        </div>

        <!-- Abas de Status (estilo CapyShowTime) -->
        <div class="tabs-container">
          <button
            v-for="t in tabs"
            :key="t.id"
            type="button"
            class="tab-btn"
            :class="{ active: activeTab === t.id }"
            @click="activeTab = t.id"
          >
            <component :is="t.icon" v-if="t.icon" :size="14" />
            <span>{{ t.label }}</span>
            <span class="tab-count mono">{{ getCount(t.id) }}</span>
          </button>
        </div>
      </div>
    </header>

    <main class="container page-body">
      <!-- Loading State -->
      <div v-if="isLoading && library.length === 0" class="loading-state">
        <div class="spinner"></div>
        <p>Carregando sua biblioteca...</p>
      </div>

      <!-- Empty State -->
      <div v-else-if="filteredGames.length === 0" class="empty-state fade-in">
        <Gamepad2 :size="48" class="empty-icon" />
        <h3 class="empty-title">Nenhum jogo aqui ainda</h3>
        <p v-if="searchQuery" class="empty-desc">Nenhum título corresponde a "{{ searchQuery }}".</p>
        <p v-else-if="activeTab !== 'all'" class="empty-desc">Você não possui jogos nesta categoria ainda.</p>
        <p v-else class="empty-desc">Adicione jogos para organizar seu backlog, horas jogadas e platinas!</p>

        <router-link to="/discover" class="btn-primary">
          <Search :size="18" />
          <span>Buscar Jogos</span>
        </router-link>
      </div>

      <!-- Games Grid (2 ou 4 colunas) -->
      <div
        v-else
        class="games-grid fade-in"
        :class="gridCols === 4 ? 'grid-cols-4' : 'grid-cols-2'"
      >
        <GameCard
          v-for="ug in filteredGames"
          :key="ug.id"
          :user-game="ug"
          :compact="gridCols === 4"
          @click="handleCardClick"
        />
      </div>
    </main>

    <!-- Modal de Edição de Status / Avaliação -->
    <GameStatusModal
      :is-open="isModalOpen"
      :user-game="selectedUserGame"
      @close="isModalOpen = false"
      @updated="handleUpdated"
      @removed="handleRemoved"
    />
  </div>
</template>

<style scoped>
.library-page {
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

.add-pill-btn {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  background-color: var(--color-accent);
  color: #0c0a14;
  padding: 8px 14px;
  border-radius: var(--radius-full);
  font-size: 0.82rem;
  font-weight: 700;
  transition: all 0.2s ease;
}

.add-pill-btn:hover {
  background-color: var(--color-accent-hover);
  transform: translateY(-1px);
}

.filters-row {
  display: flex;
  gap: 8px;
  margin-bottom: 12px;
}

.search-bar {
  flex: 1;
  display: flex;
  align-items: center;
  background-color: var(--bg-surface-elevated);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-full);
  padding: 0 14px;
  gap: 8px;
  transition: border-color 0.2s ease;
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
  background: none;
  border: none;
  padding: 10px 0;
  color: var(--text-main);
  font-size: 0.9rem;
  outline: none;
  min-width: 0;
}

.clear-btn {
  color: var(--text-muted);
  padding: 4px;
  display: flex;
  align-items: center;
}

.platform-filter {
  display: flex;
  align-items: center;
  gap: 6px;
  background-color: var(--bg-surface-elevated);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-full);
  padding: 0 14px;
}

.filter-icon {
  color: var(--text-muted);
}

.platform-select {
  background: transparent;
  border: none;
  color: var(--text-muted);
  font-size: 0.82rem;
  font-weight: 600;
  outline: none;
  cursor: pointer;
  padding: 9px 0;
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
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 8px 16px;
  background-color: var(--bg-surface-elevated);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-full);
  color: var(--text-muted);
  font-size: 0.84rem;
  font-weight: 500;
  white-space: nowrap;
  transition: all 0.2s;
}

.tab-btn:hover {
  color: var(--text-main);
}

.tab-btn.active {
  background-color: var(--color-accent);
  color: #0c0a14;
  border-color: var(--color-accent);
  font-weight: 700;
}

.tab-count {
  font-size: 0.72rem;
  opacity: 0.85;
  background: rgba(0, 0, 0, 0.18);
  padding: 1px 7px;
  border-radius: var(--radius-full);
}

.page-body {
  padding-top: 24px;
}

.games-grid {
  display: grid;
}

.games-grid.grid-cols-2 {
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 16px;
}

.games-grid.grid-cols-4 {
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 10px;
}

@media (min-width: 640px) {
  .games-grid.grid-cols-2 {
    gap: 20px;
  }
  .games-grid.grid-cols-4 {
    gap: 16px;
  }
}

.loading-state,
.empty-state {
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
  max-width: 320px;
  margin-left: auto;
  margin-right: auto;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}
</style>
