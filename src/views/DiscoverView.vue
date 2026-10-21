<script setup lang="ts">
import { ref, onMounted, watch } from 'vue'
import { useRouter } from 'vue-router'
import { capyGamesApi, type GameSearchResult } from '@/api/capygames'
import GameStatusModal from '@/components/GameStatusModal.vue'
import { Search, Compass, Plus, Flame, Sparkles, RefreshCw, ArrowLeft } from 'lucide-vue-next'

const router = useRouter()

const query = ref('')
const searchResults = ref<GameSearchResult[]>([])
const popularGames = ref<GameSearchResult[]>([])
const isSearching = ref(false)
const isLoadingPopular = ref(true)

const isModalOpen = ref(false)
const selectedGameCandidate = ref<GameSearchResult | null>(null)

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
  <div class="discover-view container">
    <header class="page-header">
      <div class="header-left">
        <button class="back-btn" @click="router.push('/')">
          <ArrowLeft :size="20" />
        </button>
        <div>
          <h1 class="page-title">Explorar Catálogo</h1>
          <p class="subtitle">Adicione jogos da Steam, Xbox ou crie manuais</p>
        </div>
      </div>

      <button class="custom-add-btn" @click="openCustomModal">
        <Plus :size="16" />
        <span>Personalizado</span>
      </button>
    </header>

    <!-- Search Input -->
    <div class="search-bar">
      <Search :size="20" class="search-icon" />
      <input
        v-model="query"
        type="text"
        class="search-input"
        placeholder="Digite o nome de qualquer jogo (ex: Zelda, Elden Ring, Halo...)"
        autofocus
      />
      <RefreshCw v-if="isSearching" :size="18" class="spin search-spinner" />
    </div>

    <!-- Search Results -->
    <section v-if="query.trim().length >= 2" class="section">
      <div class="section-header">
        <h2 class="section-title">
          <Search :size="18" class="text-accent" />
          <span>Resultados para "{{ query }}"</span>
        </h2>
        <span class="results-count mono">{{ searchResults.length }} encontrados</span>
      </div>

      <div v-if="isSearching && searchResults.length === 0" class="loading-box">
        <RefreshCw :size="28" class="spin text-accent" />
        <p>Buscando nos catálogos Steam e Xbox...</p>
      </div>

      <div v-else-if="searchResults.length === 0" class="no-results">
        <p>Nenhum jogo encontrado com esse nome.</p>
        <button class="btn-create-manual" @click="openCustomModal">
          <Plus :size="18" />
          <span>Cadastrar "{{ query }}" Manualmente</span>
        </button>
      </div>

      <div v-else class="results-grid fade-in">
        <div
          v-for="game in searchResults"
          :key="game.external_id"
          class="result-card"
        >
          <div class="card-cover-wrapper">
            <img
              :src="game.cover_url || 'https://images.unsplash.com/photo-1550745165-9bc0b252726f?auto=format&fit=crop&w=400&q=80'"
              :alt="game.title"
              class="card-cover"
              loading="lazy"
            />
            <span class="source-tag" :class="game.external_source">
              {{ game.external_source }}
            </span>
          </div>

          <div class="card-details">
            <h3 class="card-title" :title="game.title">{{ game.title }}</h3>
            <p v-if="game.platforms" class="card-platform">{{ game.platforms.join(', ') }}</p>
            
            <button class="btn-add-library" @click="openAddModal(game)">
              <Plus :size="16" />
              <span>Adicionar</span>
            </button>
          </div>
        </div>
      </div>
    </section>

    <!-- Popular & Featured Section -->
    <section v-else class="section">
      <div class="section-header">
        <h2 class="section-title">
          <Flame :size="20" class="text-flame" />
          <span>Populares na Comunidade</span>
        </h2>
      </div>

      <div v-if="isLoadingPopular" class="loading-box">
        <RefreshCw :size="24" class="spin text-accent" />
      </div>

      <div v-else class="results-grid fade-in">
        <div
          v-for="game in popularGames"
          :key="game.external_id"
          class="result-card"
        >
          <div class="card-cover-wrapper">
            <img
              :src="game.cover_url"
              :alt="game.title"
              class="card-cover"
              loading="lazy"
            />
            <span class="source-tag steam">Steam</span>
          </div>

          <div class="card-details">
            <h3 class="card-title" :title="game.title">{{ game.title }}</h3>
            <p v-if="game.platforms" class="card-platform">{{ game.platforms.join(', ') }}</p>

            <button class="btn-add-library" @click="openAddModal(game)">
              <Plus :size="16" />
              <span>Adicionar</span>
            </button>
          </div>
        </div>
      </div>
    </section>

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
.discover-view {
  padding-top: 16px;
  padding-bottom: 30px;
}

.page-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 20px;
}

.header-left {
  display: flex;
  align-items: center;
  gap: 12px;
}

.back-btn {
  color: var(--text-muted);
  padding: 8px;
  border-radius: var(--radius-sm);
  background: var(--bg-surface);
  border: 1px solid var(--color-border);
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s ease;
}

.back-btn:hover {
  color: var(--text-main);
  background: var(--bg-surface-hover);
}

.page-title {
  font-size: 1.35rem;
  font-weight: 800;
  color: var(--text-main);
  line-height: 1.2;
}

.subtitle {
  font-size: 0.8rem;
  color: var(--text-muted);
}

.custom-add-btn {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 8px 12px;
  background: var(--bg-surface);
  border: 1px solid var(--color-border);
  color: var(--text-main);
  border-radius: var(--radius-sm);
  font-size: 0.82rem;
  font-weight: 600;
  transition: all 0.2s ease;
}

.custom-add-btn:hover {
  background: var(--bg-surface-hover);
  border-color: var(--color-accent);
}

.search-bar {
  position: relative;
  display: flex;
  align-items: center;
  margin-bottom: 24px;
}

.search-icon {
  position: absolute;
  left: 14px;
  color: var(--text-dim);
}

.search-spinner {
  position: absolute;
  right: 14px;
  color: var(--color-accent);
}

.search-input {
  width: 100%;
  background: var(--bg-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  padding: 14px 44px 14px 44px;
  color: var(--text-main);
  font-size: 0.95rem;
  outline: none;
  transition: border-color 0.2s ease, box-shadow 0.2s ease;
}

.search-input:focus {
  border-color: var(--color-accent);
  box-shadow: 0 0 16px rgba(124, 58, 237, 0.2);
}

.section {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.section-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
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
  color: #f97316;
}

.results-count {
  font-size: 0.78rem;
  color: var(--text-muted);
}

.results-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 14px;
}

@media (min-width: 500px) {
  .results-grid {
    grid-template-columns: repeat(3, 1fr);
    gap: 16px;
  }
}

@media (min-width: 720px) {
  .results-grid {
    grid-template-columns: repeat(4, 1fr);
    gap: 18px;
  }
}

.result-card {
  background: var(--bg-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  overflow: hidden;
  display: flex;
  flex-direction: column;
  transition: transform 0.2s ease, border-color 0.2s ease;
}

.result-card:hover {
  transform: translateY(-4px);
  border-color: var(--color-accent);
}

.card-cover-wrapper {
  position: relative;
  width: 100%;
  aspect-ratio: 2 / 3;
  background: #120e20;
}

.card-cover {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.source-tag {
  position: absolute;
  top: 8px;
  right: 8px;
  font-size: 0.65rem;
  font-weight: 700;
  padding: 2px 6px;
  border-radius: 4px;
  text-transform: uppercase;
}

.source-tag.steam {
  background: rgba(37, 99, 235, 0.85);
  color: #fff;
}

.source-tag.xbox {
  background: rgba(22, 163, 74, 0.85);
  color: #fff;
}

.source-tag.manual {
  background: rgba(124, 58, 237, 0.85);
  color: #fff;
}

.card-details {
  padding: 10px;
  display: flex;
  flex-direction: column;
  gap: 6px;
  flex: 1;
}

.card-title {
  font-size: 0.88rem;
  font-weight: 600;
  color: var(--text-main);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.card-platform {
  font-size: 0.72rem;
  color: var(--text-muted);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.btn-add-library {
  margin-top: auto;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  padding: 7px 10px;
  background: var(--color-primary);
  color: #fff;
  border-radius: var(--radius-sm);
  font-size: 0.78rem;
  font-weight: 600;
  transition: all 0.2s ease;
}

.btn-add-library:hover {
  background: var(--color-primary-light);
}

.loading-box,
.no-results {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 50px 20px;
  gap: 12px;
  color: var(--text-muted);
  text-align: center;
}

.btn-create-manual {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  background: var(--color-primary);
  color: #fff;
  padding: 9px 16px;
  border-radius: var(--radius-sm);
  font-size: 0.85rem;
  font-weight: 600;
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
