<script setup lang="ts">
import { computed } from 'vue'
import type { CapyUserGame } from '@/api/capygames'
import { Trophy, Star, Clock, Gamepad2 } from 'lucide-vue-next'

const props = defineProps<{
  userGame: CapyUserGame
  compact?: boolean
}>()

const emit = defineEmits<{
  (e: 'click', userGame: CapyUserGame): void
}>()

const game = computed(() => props.userGame.game)

const statusBadge = computed(() => {
  switch (props.userGame.status) {
    case 'mastered':
      return { label: 'Platinado', shortLabel: '100%', class: 'status-mastered', icon: Trophy }
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
      return { label: props.userGame.status, shortLabel: props.userGame.status, class: 'status-backlog' }
  }
})

const defaultCover = 'https://images.unsplash.com/photo-1550745165-9bc0b252726f?auto=format&fit=crop&w=400&q=80'
</script>

<template>
  <div class="game-card" :class="{ compact }" @click="emit('click', userGame)">
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
        <Gamepad2 :size="compact ? 22 : 28" />
      </div>

      <!-- Status badge overlay (estilo CapyShowTime) -->
      <div class="status-badge" :class="statusBadge.class">
        <component :is="statusBadge.icon" v-if="statusBadge.icon" :size="compact ? 10 : 11" />
        <span>{{ compact ? statusBadge.shortLabel : statusBadge.label }}</span>
      </div>

      <!-- Rating badge overlay -->
      <div v-if="userGame.rating" class="rating-badge mono">
        <Star :size="compact ? 9 : 11" fill="currentColor" />
        <span>{{ userGame.rating.toFixed(1) }}</span>
      </div>

      <!-- Platinado glow border -->
      <div v-if="userGame.status === 'mastered'" class="mastered-glow" />
    </div>

    <div class="game-info">
      <h3 class="game-title" :title="game.title">{{ game.title }}</h3>
      <div class="meta-row">
        <span v-if="userGame.platform" class="game-platform">{{ userGame.platform }}</span>
        <span v-if="userGame.hours_played > 0" class="game-hours mono">
          <Clock v-if="!compact" :size="11" />
          {{ userGame.hours_played }}h
        </span>
      </div>
    </div>
  </div>
</template>

<style scoped>
.game-card {
  cursor: pointer;
  transition: transform 0.2s ease;
  display: flex;
  flex-direction: column;
  min-width: 0;
}

.game-card:hover {
  transform: translateY(-4px);
}

.game-card:active {
  transform: scale(0.97);
}

.poster-container {
  position: relative;
  width: 100%;
  aspect-ratio: 2 / 3;
  border-radius: var(--radius-md);
  overflow: hidden;
  background-color: var(--bg-surface-elevated);
  border: 1px solid var(--color-border);
  transition: border-color 0.2s ease, box-shadow 0.2s ease;
}

.game-card.compact .poster-container {
  border-radius: var(--radius-sm);
}

.game-card:hover .poster-container {
  border-color: var(--color-accent);
  box-shadow: 0 8px 22px rgba(124, 58, 237, 0.22);
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

.poster-placeholder {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--text-dim);
}

.status-badge {
  position: absolute;
  top: 8px;
  left: 8px;
  background: rgba(12, 10, 20, 0.82);
  color: var(--text-main);
  font-size: 0.7rem;
  font-weight: 600;
  padding: 3px 9px;
  border-radius: var(--radius-full);
  backdrop-filter: blur(6px);
  display: inline-flex;
  align-items: center;
  gap: 4px;
  border: 1px solid rgba(255, 255, 255, 0.12);
}

.game-card.compact .status-badge {
  top: 5px;
  left: 5px;
  font-size: 0.6rem;
  padding: 2px 6px;
}

.status-mastered {
  background: rgba(245, 158, 11, 0.92);
  color: #12100e;
  border-color: #fbbf24;
  font-weight: 700;
}

.status-completed {
  background: rgba(16, 185, 129, 0.88);
  color: #fff;
}

.status-playing {
  background: rgba(59, 130, 246, 0.88);
  color: #fff;
}

.status-backlog {
  background: rgba(12, 10, 20, 0.82);
  color: var(--text-main);
}

.status-dropped {
  background: rgba(239, 68, 68, 0.88);
  color: #fff;
}

.status-onhold {
  background: rgba(107, 114, 128, 0.88);
  color: #fff;
}

.rating-badge {
  position: absolute;
  bottom: 8px;
  right: 8px;
  background: rgba(12, 10, 20, 0.85);
  backdrop-filter: blur(6px);
  color: #fbbf24;
  border: 1px solid rgba(251, 191, 36, 0.4);
  font-size: 0.72rem;
  font-weight: 700;
  padding: 2px 8px;
  border-radius: var(--radius-full);
  display: inline-flex;
  align-items: center;
  gap: 3px;
}

.game-card.compact .rating-badge {
  bottom: 5px;
  right: 5px;
  font-size: 0.62rem;
  padding: 1px 5px;
}

.mastered-glow {
  position: absolute;
  inset: 0;
  border: 2px solid #f59e0b;
  border-radius: inherit;
  pointer-events: none;
  box-shadow: inset 0 0 12px rgba(245, 158, 11, 0.35);
}

.game-info {
  margin-top: 8px;
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.game-card.compact .game-info {
  margin-top: 5px;
}

.game-title {
  font-size: 0.86rem;
  font-weight: 600;
  color: var(--text-main);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.game-card.compact .game-title {
  font-size: 0.74rem;
}

.meta-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 6px;
}

.game-platform {
  font-size: 0.74rem;
  color: var(--text-dim);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.game-card.compact .game-platform {
  font-size: 0.65rem;
}

.game-hours {
  font-size: 0.72rem;
  color: var(--color-accent);
  display: inline-flex;
  align-items: center;
  gap: 3px;
  font-weight: 600;
  flex-shrink: 0;
}

.game-card.compact .game-hours {
  font-size: 0.64rem;
}
</style>
