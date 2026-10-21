<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { capyGamesApi, type CapyUserGame, type GameStatus } from '@/api/capygames'
import GameCard from '@/components/GameCard.vue'
import GameStatusModal from '@/components/GameStatusModal.vue'
import { Search, Plus, SlidersHorizontal, RefreshCw, Trophy, Gamepad2 } from 'lucide-vue-next'

const router = useRouter()

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
  { id: 'plan_to_play', label: 'A Jogar' },
  { id: 'completed', label: 'Zerados' },
  { id: 'mastered', label: 'Platinas', icon: Trophy },
  { id: 'on_hold', label: 'Pausa' },
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
    // Filtro por tab
    if (activeTab.value !== 'all' && ug.status !== activeTab.value) {
      return false
    }

    // Filtro por plataforma
    if (selectedPlatform.value !== 'all' && ug.platform !== selectedPlatform.value) {
      return false
    }

    // Filtro por busca de texto
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
  <div class="library-view container">
    <!-- Top Bar -->
    <header class="page-header">
      <div class="header-left">
        <div class="logo-badge">
          <Gamepad2 :size="20" class="logo-icon" />
          <h1 class="logo-text">CapyGames</h1>
        </div>
        <p class="header-subtitle">Minha Biblioteca Gamer</p>
      </div>

      <div class="header-actions">
        <button class="icon-btn" title="Atualizar" @click="fetchLibrary">
          <RefreshCw :size="18" :class="{ spin: isLoading }" />
        </button>
        <button class="add-btn" @click="router.push('/discover')">
          <Plus :size="18" />
          <span>Buscar Jogos</span>
        </button>
      </div>
    </header>

    <!-- Filters Bar (Search & Platforms) -->
    <div class="filters-section">
      <div class="search-box">
        <Search :size="18" class="search-icon" />
        <input
          v-model="searchQuery"
          type="text"
          class="search-input"
          placeholder="Filtrar por nome ou plataforma..."
        />
      </div>

      <div v-if="availablePlatforms.length > 0" class="platform-filter">
        <SlidersHorizontal :size="14" class="text-dim" />
        <select v-model="selectedPlatform" class="platform-select">
          <option value="all">Todas Plataformas</option>
          <option v-for="p in availablePlatforms" :key="p" :value="p">{{ p }}</option>
        </select>
      </div>
    </div>

    <!-- Status Tabs -->
    <div class="tabs-scroll">
      <button
        v-for="t in tabs"
        :key="t.id"
        class="tab-btn"
        :class="{ active: activeTab === t.id }"
        @click="activeTab = t.id"
      >
        <component :is="t.icon" v-if="t.icon" :size="14" class="tab-icon" />
        <span>{{ t.label }}</span>
        <span class="tab-count mono">{{ getCount(t.id) }}</span>
      </button>
    </div>

    <!-- Loading State -->
    <div v-if="isLoading && library.length === 0" class="loading-state">
      <RefreshCw :size="32" class="spin text-accent" />
      <p>Carregando sua biblioteca...</p>
    </div>

    <!-- Empty State -->
    <div v-else-if="filteredGames.length === 0" class="empty-state">
      <div class="empty-icon-box">
        <Gamepad2 :size="48" class="text-dim" />
      </div>
      <h3>Nenhum jogo encontrado</h3>
      <p v-if="searchQuery">Nenhum título corresponde a "{{ searchQuery }}"</p>
      <p v-else-if="activeTab !== 'all'">Você não possui jogos nesta categoria ainda.</p>
      <p v-else>Sua biblioteca está vazia! Explore o catálogo e monte seu backlog.</p>

      <button class="btn-primary mt-4" @click="router.push('/discover')">
        <Plus :size="18" />
        <span>Explorar Catálogo</span>
      </button>
    </div>

    <!-- Games Grid -->
    <div v-else class="games-grid fade-in">
      <GameCard
        v-for="ug in filteredGames"
        :key="ug.id"
        :user-game="ug"
        @click="handleCardClick"
      />
    </div>

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
.library-view {
  padding-top: 16px;
  padding-bottom: 24px;
}

.page-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 20px;
}

.logo-badge {
  display: flex;
  align-items: center;
  gap: 8px;
}

.logo-icon {
  color: var(--color-accent);
}

.logo-text {
  font-size: 1.4rem;
  font-weight: 800;
  letter-spacing: -0.02em;
  background: linear-gradient(135deg, #f5f3ff 0%, #c084fc 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
}

.header-subtitle {
  font-size: 0.8rem;
  color: var(--text-muted);
  font-weight: 500;
}

.header-actions {
  display: flex;
  align-items: center;
  gap: 8px;
}

.icon-btn {
  padding: 8px;
  border-radius: var(--radius-sm);
  background: var(--bg-surface);
  border: 1px solid var(--color-border);
  color: var(--text-muted);
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s ease;
}

.icon-btn:hover {
  background: var(--bg-surface-hover);
  color: var(--text-main);
}

.add-btn {
  display: flex;
  align-items: center;
  gap: 6px;
  background: var(--color-primary);
  color: #fff;
  padding: 8px 14px;
  border-radius: var(--radius-sm);
  font-size: 0.82rem;
  font-weight: 600;
  box-shadow: 0 4px 12px rgba(124, 58, 237, 0.3);
  transition: all 0.2s ease;
}

.add-btn:hover {
  background: var(--color-primary-light);
  transform: translateY(-1px);
}

.filters-section {
  display: flex;
  gap: 10px;
  margin-bottom: 16px;
}

.search-box {
  flex: 1;
  position: relative;
  display: flex;
  align-items: center;
}

.search-icon {
  position: absolute;
  left: 12px;
  color: var(--text-dim);
}

.search-input {
  width: 100%;
  background: var(--bg-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  padding: 10px 14px 10px 38px;
  color: var(--text-main);
  font-size: 0.88rem;
  outline: none;
  transition: border-color 0.2s ease;
}

.search-input:focus {
  border-color: var(--color-accent);
}

.platform-filter {
  display: flex;
  align-items: center;
  gap: 6px;
  background: var(--bg-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  padding: 0 10px;
}

.platform-select {
  background: transparent;
  border: none;
  color: var(--text-muted);
  font-size: 0.82rem;
  outline: none;
  cursor: pointer;
  padding: 8px 0;
}

.tabs-scroll {
  display: flex;
  gap: 8px;
  overflow-x: auto;
  padding-bottom: 12px;
  margin-bottom: 16px;
  scrollbar-width: none;
}

.tabs-scroll::-webkit-scrollbar {
  display: none;
}

.tab-btn {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 7px 14px;
  border-radius: var(--radius-full);
  background: var(--bg-surface);
  border: 1px solid var(--color-border);
  color: var(--text-muted);
  font-size: 0.82rem;
  font-weight: 600;
  white-space: nowrap;
  transition: all 0.2s ease;
}

.tab-btn:hover {
  background: var(--bg-surface-hover);
  color: var(--text-main);
}

.tab-btn.active {
  background: var(--color-primary);
  border-color: #c084fc;
  color: #fff;
  box-shadow: 0 2px 8px rgba(124, 58, 237, 0.4);
}

.tab-count {
  font-size: 0.75rem;
  opacity: 0.8;
  background: rgba(0, 0, 0, 0.2);
  padding: 1px 6px;
  border-radius: var(--radius-full);
}

.games-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 14px;
}

@media (min-width: 500px) {
  .games-grid {
    grid-template-columns: repeat(3, 1fr);
    gap: 16px;
  }
}

@media (min-width: 720px) {
  .games-grid {
    grid-template-columns: repeat(4, 1fr);
    gap: 18px;
  }
}

.loading-state,
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 60px 20px;
  text-align: center;
  gap: 12px;
  color: var(--text-muted);
}

.empty-icon-box {
  width: 80px;
  height: 80px;
  border-radius: 50%;
  background: var(--bg-surface);
  border: 1px solid var(--color-border);
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 8px;
}

.empty-state h3 {
  color: var(--text-main);
  font-size: 1.15rem;
}

.empty-state p {
  font-size: 0.88rem;
  max-width: 320px;
}

.btn-primary {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  background: var(--color-primary);
  color: #fff;
  padding: 10px 20px;
  border-radius: var(--radius-sm);
  font-size: 0.88rem;
  font-weight: 600;
  box-shadow: 0 4px 12px rgba(124, 58, 237, 0.35);
  transition: all 0.2s ease;
}

.btn-primary:hover {
  background: var(--color-primary-light);
}

.mt-4 {
  margin-top: 16px;
}

.spin {
  animation: spin 1s linear infinite;
}

@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

.text-accent {
  color: var(--color-accent);
}
</style>
