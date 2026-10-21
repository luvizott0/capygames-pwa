<template>
  <component
    :is="targetRoute ? 'router-link' : 'div'"
    :to="targetRoute"
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

      <!-- Rating Badge no topo direito (estilo CapyShowTime / CapyFlix) -->
      <div v-if="displayRating" class="rating-badge mono" :class="{ 'rating-mini': compact }">
        ★ {{ Number(displayRating).toFixed(1) }}
      </div>

      <!-- Platinado Glow Border -->
      <div v-if="statusInfo?.isMastered" class="mastered-glow" />
    </div>

    <!-- Informações de título e plataforma -->
    <div v-if="!compact" class="game-info">
      <h3 class="game-title">{{ actualGame?.title }}</h3>
      <div class="game-meta">
        <span v-if="displayPlatform" class="meta-item">{{ displayPlatform }}</span>
        <span v-if="displayPlatform && (displayHours || actualGame?.developer)" class="meta-dot">•</span>
        <span v-if="displayHours" class="meta-item mono">{{ displayHours }}</span>
        <span v-else-if="actualGame?.developer" class="meta-item">{{ actualGame?.developer }}</span>
      </div>
    </div>
  </component>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import { Trophy } from 'lucide-vue-next'
import type { CapyGame, CapyUserGame, GameSearchResult } from '@/api/capygames'
import { useGamesStore } from '@/stores/games'

const props = withDefaults(
  defineProps<{
    userGame?: CapyUserGame
    game?: CapyGame | GameSearchResult
    compact?: boolean
  }>(),
  {
    compact: false
  }
)

const emit = defineEmits<{
  (e: 'click', game: CapyGame | GameSearchResult | CapyUserGame): void
}>()

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
  return gamesStore.myList.find(ug => ug.game_id === actualGame.value?.id || ug.game?.id === actualGame.value?.id) || null
})

const targetRoute = computed(() => {
  const gId = actualGame.value?.id || props.userGame?.game_id
  if (gId) {
    return `/game/${gId}`
  }
  return undefined
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

function handleClick() {
  emit('click', props.userGame || actualGame.value!)
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
  return null
})

const displayPlatform = computed(() => {
  if (matchedUserGame.value?.platform) {
    return matchedUserGame.value.platform
  }
  if (actualGame.value?.platforms && actualGame.value.platforms.length > 0) {
    return actualGame.value.platforms[0]
  }
  return ''
})

const displayHours = computed(() => {
  if (matchedUserGame.value?.hours_played && matchedUserGame.value.hours_played > 0) {
    return `${matchedUserGame.value.hours_played}h`
  }
  return ''
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

.game-meta {
  display: flex;
  align-items: center;
  gap: 5px;
  font-size: 0.72rem;
  color: var(--text-muted);
  margin-top: 2px;
}

.meta-dot {
  color: var(--text-dim);
}

.meta-item {
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
</style>
