<template>
  <div class="library-page container fade-in">
    <header class="page-header">
      <div class="header-top">
        <div>
          <h1 class="header-title mono">Minha Lista</h1>
          <p class="header-subtitle">Seu acervo pessoal, backlog e histórico de jogos</p>
        </div>
        <span v-if="gamesStore.myList.length > 0" class="count-badge mono">
          {{ gamesStore.myList.length }} jogos
        </span>
      </div>

      <!-- Filtro de Status estilo CapyFlix / CapyShowTime -->
      <div class="genres-scroll-bar">
        <button
          v-for="tab in statusTabs"
          :key="tab.id"
          type="button"
          class="genre-pill"
          :class="{ active: activeStatus === tab.id }"
          @click="activeStatus = tab.id"
        >
          {{ tab.label }}
          <span v-if="tab.count > 0" class="pill-count mono">({{ tab.count }})</span>
        </button>
      </div>
    </header>

    <main class="page-body">
      <!-- Loading State -->
      <div v-if="gamesStore.isRefreshingMyList && gamesStore.myList.length === 0" class="loading-state">
        <div class="spinner"></div>
        <p>Carregando sua lista...</p>
      </div>

      <!-- Cabeçalho de Resultados + Seletor de Visualização -->
      <div v-else-if="filteredGames.length > 0" class="results-header">
        <span class="results-count mono">{{ filteredGames.length }} títulos nesta seleção</span>

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

      <!-- Grade de Jogos -->
      <div
        v-if="filteredGames.length > 0"
        class="games-grid"
        :class="{ 'compact-grid': viewMode === 'compact' }"
      >
        <GameCard
          v-for="item in filteredGames"
          :key="item.id"
          :user-game="item"
          :compact="viewMode === 'compact'"
        />
      </div>

      <!-- Empty State no estilo CapyFlix -->
      <div v-else class="empty-state fade-in">
        <div class="empty-icon-box">
          <Bookmark :size="40" class="empty-icon" />
        </div>
        <h3 class="empty-title">
          {{ activeStatus === 'all' ? 'Sua lista está vazia' : 'Nenhum jogo nesta categoria' }}
        </h3>
        <p class="empty-desc">
          {{ activeStatus === 'all'
            ? 'Adicione jogos ao seu backlog ou conecte sua conta Steam para sincronizar seus jogos automaticamente.'
            : 'Você ainda não registrou nenhum jogo com esse status.' }}
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
import { Bookmark, Search, LayoutGrid, Grid } from 'lucide-vue-next'
import { useGamesStore } from '@/stores/games'
import GameCard from '@/components/GameCard.vue'

const gamesStore = useGamesStore()
const activeStatus = ref('all')
const viewMode = ref<'normal' | 'compact'>('normal')

const statusTabs = computed(() => {
  const list = gamesStore.myList
  return [
    { id: 'all', label: 'Todos', count: list.length },
    { id: 'playing', label: 'Jogando', count: list.filter(g => g.status === 'playing').length },
    { id: 'plan_to_play', label: 'Na Fila', count: list.filter(g => g.status === 'plan_to_play').length },
    { id: 'completed', label: 'Zerados', count: list.filter(g => g.status === 'completed').length },
    { id: 'mastered', label: 'Platinados', count: list.filter(g => g.status === 'mastered').length },
    { id: 'on_hold', label: 'Em Pausa', count: list.filter(g => g.status === 'on_hold').length },
    { id: 'dropped', label: 'Abandonados', count: list.filter(g => g.status === 'dropped').length }
  ]
})

const filteredGames = computed(() => {
  if (activeStatus.value === 'all') {
    return gamesStore.myList
  }
  return gamesStore.myList.filter(g => g.status === activeStatus.value)
})

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
  align-items: flex-start;
  margin-bottom: 12px;
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

.count-badge {
  font-size: 0.75rem;
  color: var(--color-accent);
  background: rgba(245, 197, 24, 0.1);
  border: 1px solid rgba(245, 197, 24, 0.25);
  padding: 3px 8px;
  border-radius: var(--radius-sm);
}

.pill-count {
  font-size: 0.7rem;
  opacity: 0.8;
  margin-left: 3px;
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
