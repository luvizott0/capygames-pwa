<script setup lang="ts">
import { computed } from 'vue'
import type { CapyUserGame } from '@/api/capygames'
import { Trophy, Star, Clock } from 'lucide-vue-next'

const props = defineProps<{
  userGame: CapyUserGame
}>()

const emit = defineEmits<{
  (e: 'click', userGame: CapyUserGame): void
}>()

const game = computed(() => props.userGame.game)

const statusBadge = computed(() => {
  switch (props.userGame.status) {
    case 'mastered':
      return { label: 'Platinado', class: 'status-mastered', icon: Trophy }
    case 'completed':
      return { label: 'Zerado', class: 'status-completed' }
    case 'playing':
      return { label: 'Jogando', class: 'status-playing' }
    case 'plan_to_play':
      return { label: 'A Jogar', class: 'status-backlog' }
    case 'dropped':
      return { label: 'Abandonado', class: 'status-dropped' }
    case 'on_hold':
      return { label: 'Em Pausa', class: 'status-onhold' }
    default:
      return { label: props.userGame.status, class: 'status-backlog' }
  }
})

const defaultCover = 'https://images.unsplash.com/photo-1550745165-9bc0b252726f?auto=format&fit=crop&w=400&q=80'
</script>

<template>
  <div class="game-card" @click="emit('click', userGame)">
    <div class="cover-wrapper">
      <img
        :src="game.cover_url || defaultCover"
        :alt="game.title"
        class="cover-image"
        loading="lazy"
        @error="($event.target as HTMLImageElement).src = defaultCover"
      />

      <!-- Status badge overlay -->
      <div class="badge-overlay" :class="statusBadge.class">
        <component :is="statusBadge.icon" v-if="statusBadge.icon" :size="12" class="badge-icon" />
        <span>{{ statusBadge.label }}</span>
      </div>

      <!-- Rating badge overlay (if exists) -->
      <div v-if="userGame.rating" class="rating-overlay mono">
        <Star :size="11" class="star-icon" fill="currentColor" />
        <span>{{ userGame.rating.toFixed(1) }}</span>
      </div>

      <!-- Platinado glow border -->
      <div v-if="userGame.status === 'mastered'" class="mastered-glow" />
    </div>

    <div class="info">
      <h3 class="title" :title="game.title">{{ game.title }}</h3>
      
      <div class="meta-row">
        <span v-if="userGame.platform" class="platform-tag">{{ userGame.platform }}</span>
        <span v-if="userGame.hours_played > 0" class="hours-tag mono">
          <Clock :size="11" />
          {{ userGame.hours_played }}h
        </span>
      </div>
    </div>
  </div>
</template>

<style scoped>
.game-card {
  display: flex;
  flex-direction: column;
  cursor: pointer;
  border-radius: var(--radius-md);
  background: var(--bg-surface);
  border: 1px solid var(--color-border);
  overflow: hidden;
  transition: transform 0.2s ease, border-color 0.2s ease, box-shadow 0.2s ease;
}

.game-card:hover {
  transform: translateY(-4px);
  border-color: var(--color-accent);
  box-shadow: 0 8px 24px rgba(124, 58, 237, 0.2);
}

.game-card:active {
  transform: scale(0.97);
}

.cover-wrapper {
  position: relative;
  width: 100%;
  aspect-ratio: 2 / 3;
  background: #110e1c;
  overflow: hidden;
}

.cover-image {
  width: 100%;
  height: 100%;
  object-fit: cover;
  transition: transform 0.3s ease;
}

.game-card:hover .cover-image {
  transform: scale(1.05);
}

.badge-overlay {
  position: absolute;
  top: 8px;
  left: 8px;
  font-size: 0.68rem;
  font-weight: 700;
  padding: 3px 8px;
  border-radius: var(--radius-sm);
  backdrop-filter: blur(8px);
  display: inline-flex;
  align-items: center;
  gap: 4px;
  text-transform: uppercase;
  letter-spacing: 0.04em;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.4);
}

.status-mastered {
  background: rgba(245, 158, 11, 0.9);
  color: #fff;
  border: 1px solid #fbbf24;
}

.status-completed {
  background: rgba(16, 185, 129, 0.9);
  color: #fff;
}

.status-playing {
  background: rgba(59, 130, 246, 0.9);
  color: #fff;
}

.status-backlog {
  background: rgba(139, 92, 246, 0.9);
  color: #fff;
}

.status-dropped {
  background: rgba(239, 68, 68, 0.9);
  color: #fff;
}

.status-onhold {
  background: rgba(107, 114, 128, 0.9);
  color: #fff;
}

.rating-overlay {
  position: absolute;
  bottom: 8px;
  right: 8px;
  background: rgba(12, 10, 20, 0.85);
  backdrop-filter: blur(6px);
  color: #fbbf24;
  border: 1px solid rgba(251, 191, 36, 0.4);
  font-size: 0.75rem;
  font-weight: 700;
  padding: 2px 6px;
  border-radius: var(--radius-sm);
  display: flex;
  align-items: center;
  gap: 3px;
}

.mastered-glow {
  position: absolute;
  inset: 0;
  border: 2px solid #f59e0b;
  pointer-events: none;
  box-shadow: inset 0 0 12px rgba(245, 158, 11, 0.35);
}

.info {
  padding: 10px;
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.title {
  font-size: 0.88rem;
  font-weight: 600;
  color: var(--text-main);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  line-height: 1.3;
}

.meta-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 6px;
}

.platform-tag {
  font-size: 0.7rem;
  color: var(--text-muted);
  background: var(--bg-surface-elevated);
  padding: 2px 6px;
  border-radius: var(--radius-sm);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.hours-tag {
  font-size: 0.72rem;
  color: var(--color-accent);
  display: inline-flex;
  align-items: center;
  gap: 3px;
  font-weight: 600;
}
</style>
