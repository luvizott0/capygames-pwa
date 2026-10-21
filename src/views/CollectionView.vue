<template>
  <div class="collection-page container fade-in">
    <!-- Barra Superior de Navegação / Voltar -->
    <div class="collection-top-nav">
      <button type="button" class="back-link-btn" @click="router.back()">
        <ArrowLeft :size="18" />
        <span>Voltar</span>
      </button>
    </div>

    <header class="page-header">
      <div class="header-content">
        <h1 class="header-title mono">{{ collectionMeta.title }}</h1>
        <p class="header-subtitle">{{ collectionMeta.subtitle }}</p>
      </div>
    </header>

    <main class="page-body">
      <!-- Cabeçalho de Resultados + Seletor de Visualização -->
      <div class="results-header">
        <span class="results-count mono">{{ collectionItems.length }} jogos disponíveis</span>

        <!-- Botão de alternância da forma de visualização -->
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
        v-if="collectionItems.length > 0"
        class="games-grid"
        :class="{ 'compact-grid': viewMode === 'compact' }"
      >
        <GameCard
          v-for="(item, idx) in collectionItems"
          :key="item.id || item.game?.id || idx"
          :game="item.game || item"
          :user-game="item.game ? item : undefined"
          :compact="viewMode === 'compact'"
        />
      </div>

      <div v-else class="empty-state">
        <p class="empty-desc">Nenhum jogo encontrado nesta coleção.</p>
      </div>
    </main>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ArrowLeft, LayoutGrid, Grid } from 'lucide-vue-next'
import { useGamesStore } from '@/stores/games'
import GameCard from '@/components/GameCard.vue'

const route = useRoute()
const router = useRouter()
const gamesStore = useGamesStore()

const viewMode = ref<'normal' | 'compact'>('normal')

const collectionId = computed(() => (route.params.id as string) || '')

const collectionMeta = computed(() => {
  switch (collectionId.value) {
    case 'popular':
    case 'trending':
      return {
        title: 'Em Alta Esta Semana',
        subtitle: 'Os jogos mais populares e jogados do momento.'
      }
    case 'community':
      return {
        title: 'Jogados pela Comunidade',
        subtitle: 'Jogos recentemente curtidos e avaliados na Capihouse.'
      }
    case 'top-rated':
      return {
        title: 'Mais Bem Avaliados',
        subtitle: 'Títulos aclamados e com as maiores notas registradas.'
      }
    case 'genre-rpg':
      return {
        title: 'Aventuras & RPGs',
        subtitle: 'Grandes jornadas, narrativas profundas e mundos abertos épicos.'
      }
    case 'genre-action':
      return {
        title: 'Ação & Sobrevivência',
        subtitle: 'Jogos dinâmicos, combates intensos e desafios frenéticos.'
      }
    case 'genre-indie':
      return {
        title: 'Jóias Indie',
        subtitle: 'Criatividade, arte única e experiências autorais inesquecíveis.'
      }
    default:
      return {
        title: 'Coleção de Jogos',
        subtitle: 'Explorando catálogo completo da Capihouse.'
      }
  }
})

const collectionItems = computed(() => {
  switch (collectionId.value) {
    case 'popular':
    case 'trending':
      return gamesStore.popularGames
    case 'community': {
      const map = new Map<number, any>()
      for (const act of gamesStore.communityActivities) {
        if (act.game && !map.has(act.game.id)) {
          map.set(act.game.id, act.game)
        }
      }
      return Array.from(map.values())
    }
    case 'top-rated': {
      const rated = gamesStore.myList.filter(ug => ug.rating && ug.rating >= 8)
      if (rated.length > 0) return rated.map(ug => ug.game)
      return gamesStore.popularGames.slice().reverse()
    }
    case 'genre-rpg':
      return gamesStore.popularGames.filter(g =>
        (g.genres || []).some(gen => /rpg|role-playing/i.test(gen)) ||
        (g.summary || '').toLowerCase().includes('rpg')
      )
    case 'genre-action':
      return gamesStore.popularGames.filter(g =>
        (g.genres || []).some(gen => /action|ação|shooter|tiro/i.test(gen)) ||
        (g.summary || '').toLowerCase().includes('action')
      )
    case 'genre-indie':
      return gamesStore.popularGames.filter(g =>
        (g.genres || []).some(gen => /indie/i.test(gen)) ||
        (g.summary || '').toLowerCase().includes('indie')
      )
    default:
      return gamesStore.popularGames
  }
})

onMounted(async () => {
  if (gamesStore.popularGames.length === 0) {
    await gamesStore.fetchDiscover()
  }
  if (gamesStore.communityActivities.length === 0) {
    await gamesStore.fetchCommunity()
  }
})
</script>

<style scoped>
.collection-page {
  padding-top: 16px;
  padding-bottom: 32px;
}

.collection-top-nav {
  margin-bottom: 12px;
}

.back-link-btn {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  color: var(--text-muted);
  font-size: 0.82rem;
  font-weight: 600;
  cursor: pointer;
  padding: 4px 0;
  transition: color 0.2s;
}

.back-link-btn:hover {
  color: var(--color-accent);
}

.page-header {
  margin-bottom: 20px;
}

.header-title {
  font-size: 1.3rem;
  color: var(--text-main);
  margin-bottom: 4px;
}

.header-subtitle {
  font-size: 0.84rem;
  color: var(--text-muted);
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

.empty-state {
  text-align: center;
  padding: 40px 20px;
  color: var(--text-muted);
}
</style>
