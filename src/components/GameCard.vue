<template>
  <div
    class="game-card"
    :class="{ 'is-compact': compact }"
    :title="actualGame?.title"
    @click="handleClick"
  >
    <div class="poster-container">
      <img
        :src="optimizedCover"
        :alt="actualGame?.title || 'Jogo'"
        class="poster-img"
        loading="lazy"
        @error="handleImageError"
      />

      <!-- Badges de status no topo esquerdo -->
      <div v-if="statusInfo" class="badges-overlay">
        <span class="badge-mini mono" :class="statusInfo.class">
          <component :is="statusInfo.icon" v-if="statusInfo.icon" :size="compact ? 10 : 11" />
          {{ compact ? statusInfo.shortLabel : statusInfo.label }}
        </span>
      </div>

      <!-- Rating Badge no topo direito -->
      <div v-if="displayRating" class="rating-badge mono" :class="{ 'rating-mini': compact }">
        ★ {{ Number(displayRating).toFixed(1) }}
      </div>

      <!-- Platinado Glow Border -->
      <div v-if="statusInfo?.isMastered" class="mastered-glow" />
    </div>

    <!-- Apenas Título do Jogo (sem poluição de labels de plataforma) -->
    <div v-if="!compact && !hideTitle" class="game-info">
      <h3 class="game-title">{{ actualGame?.title }}</h3>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import { useRouter } from 'vue-router'
import { Trophy } from 'lucide-vue-next'
import { capyGamesApi, type CapyGame, type CapyUserGame, type GameSearchResult } from '@/api/capygames'
import { useGamesStore } from '@/stores/games'

const props = withDefaults(
  defineProps<{
    userGame?: CapyUserGame
    game?: CapyGame | GameSearchResult
    compact?: boolean
    hideTitle?: boolean
  }>(),
  {
    compact: false,
    hideTitle: false
  }
)

const emit = defineEmits<{
  (e: 'click', game: CapyGame | GameSearchResult | CapyUserGame): void
}>()

const router = useRouter()
const gamesStore = useGamesStore()
const fallbackActive = ref(false)

const actualGame = computed(() => {
  if (props.userGame?.game) {
    return props.userGame.game
  }
  return props.game || null
})

// Tenta associar com o item da biblioteca do usuário se não for passado explicitamente
const matchedUserGame = computed<CapyUserGame | null>(() => {
  if (props.userGame) return props.userGame
  if (!actualGame.value?.id) return null
  return gamesStore.myList.find(ug =>
    ug.game_id === actualGame.value?.id ||
    ug.game?.id === actualGame.value?.id ||
    (ug.game?.slug && actualGame.value?.slug && ug.game.slug === actualGame.value.slug) ||
    (ug.game?.title && actualGame.value?.title && ug.game.title.trim().toLowerCase() === actualGame.value.title.trim().toLowerCase())
  ) || null
})

const defaultCover = 'https://images.unsplash.com/photo-1550745165-9bc0b252726f?auto=format&fit=crop&w=400&q=80'

const optimizedCover = computed(() => {
  if (fallbackActive.value || !actualGame.value?.cover_url) {
    return defaultCover
  }
  return actualGame.value.cover_url
})

function handleImageError() {
  fallbackActive.value = true
}

async function handleClick() {
  emit('click', props.userGame || actualGame.value!)

  // Se já tem id local, navega direto para a tela de detalhes
  const gId = actualGame.value?.id || props.userGame?.game_id
  if (gId) {
    router.push(`/game/${gId}`)
    return
  }

  // Se for um jogo recém-pesquisado sem id na base, garante sua criação e redireciona
  if (actualGame.value?.title) {
    try {
      const res = await capyGamesApi.ensureGame({
        title: actualGame.value.title,
        external_id: actualGame.value.external_id,
        external_source: actualGame.value.external_source,
        cover_url: actualGame.value.cover_url,
        banner_url: actualGame.value.banner_url,
        summary: actualGame.value.summary,
        developer: actualGame.value.developer,
        publisher: actualGame.value.publisher,
        platforms: actualGame.value.platforms,
        genres: actualGame.value.genres,
      })
      if (res.data?.data?.id) {
        router.push(`/game/${res.data.data.id}`)
      }
    } catch (err) {
      console.error('Erro ao abrir detalhes do jogo:', err)
    }
  }
}

const statusInfo = computed(() => {
  const ug = matchedUserGame.value
  if (!ug) return null

  switch (ug.status) {
    case 'mastered':
      return { label: 'Platinado', shortLabel: '100%', class: 'status-mastered', icon: Trophy, isMastered: true }
    case 'completed':
      return { label: 'Zerado', shortLabel: 'Zerado', class: 'status-completed' }
    case 'playing':
      return { label: 'Jogando', shortLabel: 'Jogando', class: 'status-playing' }
    case 'plan_to_play':
      return { label: 'Na Fila', shortLabel: 'Fila', class: 'status-backlog' }
    case 'dropped':
      return { label: 'Abandonado', shortLabel: 'Drop', class: 'status-dropped' }
    case 'on_hold':
      return { label: 'Em Pausa', shortLabel: 'Pausa', class: 'status-onhold' }
    default:
      return null
  }
})

const displayRating = computed(() => {
  if (matchedUserGame.value?.rating) {
    return matchedUserGame.value.rating
  }
  const anyGame = actualGame.value as any
  if (anyGame?.rating) return anyGame.rating
  if (anyGame?.community_rating) return anyGame.community_rating
  if (anyGame?.avg_rating) return anyGame.avg_rating
  return null
})
</script>

<style scoped>
.game-card {
  display: flex;
  flex-direction: column;
  text-decoration: none;
  color: inherit;
  transition: transform 0.2s ease;
  min-width: 0;
  cursor: pointer;
}

.game-card:hover {
  transform: translateY(-4px);
}

.poster-container {
  position: relative;
  width: 100%;
  aspect-ratio: 2 / 3;
  background-color: var(--bg-surface-elevated);
  border-radius: var(--radius-sm);
  overflow: hidden;
  border: 1px solid var(--color-border);
  transition: border-color 0.2s ease, box-shadow 0.2s ease;
}

.game-card:hover .poster-container {
  border-color: var(--color-accent);
  box-shadow: 0 6px 18px rgba(0, 0, 0, 0.45);
}

.poster-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  transition: transform 0.3s ease;
}

.game-card:hover .poster-img {
  transform: scale(1.04);
}

.badges-overlay {
  position: absolute;
  top: 6px;
  left: 6px;
  display: flex;
  flex-direction: column;
  gap: 4px;
  z-index: 2;
}

.badge-mini {
  font-size: 0.65rem;
  font-weight: 700;
  padding: 2px 6px;
  border-radius: var(--radius-sm);
  background: rgba(18, 16, 14, 0.85);
  backdrop-filter: blur(4px);
  color: var(--text-main);
  border: 1px solid var(--color-border);
  display: inline-flex;
  align-items: center;
  gap: 3px;
  letter-spacing: 0.2px;
}

.status-mastered {
  background: var(--color-accent);
  color: #12100e;
  border-color: var(--color-accent);
}

.status-completed {
  background: rgba(52, 211, 153, 0.22);
  color: var(--color-success);
  border-color: rgba(52, 211, 153, 0.45);
}

.status-playing {
  background: rgba(245, 197, 24, 0.16);
  color: var(--color-accent);
  border-color: rgba(245, 197, 24, 0.35);
}

.status-backlog {
  background: var(--bg-surface-elevated);
  color: var(--text-muted);
}

.status-dropped {
  background: rgba(248, 113, 113, 0.2);
  color: var(--color-danger);
}

.status-onhold {
  background: rgba(158, 145, 133, 0.2);
  color: var(--text-muted);
}

.rating-badge {
  position: absolute;
  top: 6px;
  right: 6px;
  background-color: var(--color-accent);
  color: #12100e;
  font-size: 0.68rem;
  font-weight: 700;
  padding: 1px 5px;
  border-radius: var(--radius-sm);
  z-index: 2;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.35);
}

.rating-mini {
  font-size: 0.6rem;
  padding: 1px 4px;
}

.mastered-glow {
  position: absolute;
  inset: 0;
  border: 2px solid var(--color-accent);
  border-radius: inherit;
  pointer-events: none;
  box-shadow: inset 0 0 10px rgba(245, 197, 24, 0.35);
}

.game-info {
  margin-top: 6px;
}

.game-title {
  font-size: 0.84rem;
  font-weight: 600;
  color: var(--text-main);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  line-height: 1.3;
}
</style>
