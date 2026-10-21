<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { capyGamesApi, type GameActivity } from '@/api/capygames'
import { Flame, Trophy, Star, MessageSquare, Clock, RefreshCw, Gamepad2 } from 'lucide-vue-next'

const router = useRouter()

const activities = ref<GameActivity[]>([])
const isLoading = ref(true)
const activeFilter = ref<'all' | 'milestones' | 'achievements' | 'reviews'>('all')

async function fetchFeed() {
  isLoading.value = true
  try {
    const res = await capyGamesApi.getFeed(40)
    activities.value = res.data.data
  } catch (err) {
    console.error('Falha ao buscar feed:', err)
  } finally {
    isLoading.value = false
  }
}

const filteredActivities = computed(() => {
  return activities.value.filter(act => {
    if (activeFilter.value === 'achievements') {
      return act.type === 'achievement'
    }
    if (activeFilter.value === 'milestones') {
      return (
        act.metadata?.status === 'completed' ||
        act.metadata?.status === 'mastered' ||
        act.title.includes('Zerou') ||
        act.title.includes('Platinou') ||
        act.title.includes('Miletou')
      )
    }
    if (activeFilter.value === 'reviews') {
      return act.type === 'review' || !!act.content
    }
    return true
  })
})

function formatTime(dateStr: string) {
  try {
    const date = new Date(dateStr)
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffMins = Math.floor(diffMs / (1000 * 60))
    const diffHours = Math.floor(diffMins / 60)
    const diffDays = Math.floor(diffHours / 24)

    if (diffMins < 2) return 'agora'
    if (diffMins < 60) return `há ${diffMins} min`
    if (diffHours < 24) return `há ${diffHours}h`
    if (diffDays === 1) return 'ontem'
    if (diffDays < 7) return `há ${diffDays} dias`
    return date.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })
  } catch {
    return dateStr
  }
}

onMounted(() => {
  fetchFeed()
})
</script>

<template>
  <div class="community-view container">
    <header class="page-header">
      <div class="header-left">
        <div class="title-with-icon">
          <Flame :size="24" class="text-flame" />
          <h1 class="page-title">Feed da Comunidade</h1>
        </div>
        <p class="subtitle">Conquistas, zeramentos e reviews dos moradores</p>
      </div>

      <button class="icon-btn" title="Atualizar feed" @click="fetchFeed">
        <RefreshCw :size="18" :class="{ spin: isLoading }" />
      </button>
    </header>

    <!-- Filters Bar -->
    <div class="filters-bar">
      <button
        class="filter-pill"
        :class="{ active: activeFilter === 'all' }"
        @click="activeFilter = 'all'"
      >
        Todas
      </button>
      <button
        class="filter-pill"
        :class="{ active: activeFilter === 'milestones' }"
        @click="activeFilter = 'milestones'"
      >
        🏆 Zeramentos & Platinas
      </button>
      <button
        class="filter-pill"
        :class="{ active: activeFilter === 'achievements' }"
        @click="activeFilter = 'achievements'"
      >
        🎮 Conquistas
      </button>
      <button
        class="filter-pill"
        :class="{ active: activeFilter === 'reviews' }"
        @click="activeFilter = 'reviews'"
      >
        📝 Análises
      </button>
    </div>

    <!-- Feed Content -->
    <div v-if="isLoading && activities.length === 0" class="loading-state">
      <RefreshCw :size="32" class="spin text-accent" />
      <p>Buscando atividades dos moradores...</p>
    </div>

    <div v-else-if="filteredActivities.length === 0" class="empty-state">
      <Gamepad2 :size="48" class="text-dim" />
      <h3>Nenhuma atividade por aqui ainda</h3>
      <p>As conquistas e zeramentos dos amigos da Capihouse aparecerão aqui!</p>
    </div>

    <div v-else class="activities-list fade-in">
      <article
        v-for="act in filteredActivities"
        :key="act.id"
        class="activity-card"
        :class="{
          'card-mastered': act.metadata?.status === 'mastered',
          'card-completed': act.metadata?.status === 'completed'
        }"
      >
        <!-- Header do Morador -->
        <div class="activity-top">
          <div class="user-block" @click="router.push(`/user/${act.user.id}`)">
            <img
              :src="act.user.avatar_url || 'https://api.dicebear.com/7.x/bottts/svg?seed=' + act.user.username"
              class="user-avatar"
            />
            <div class="user-meta">
              <span class="user-name">{{ act.user.name }}</span>
              <span class="time-ago">{{ formatTime(act.created_at) }}</span>
            </div>
          </div>

          <div v-if="act.metadata?.rating" class="rating-badge mono">
            <Star :size="12" fill="currentColor" />
            <span>{{ act.metadata.rating.toFixed(1) }}</span>
          </div>
        </div>

        <!-- Conteúdo / Jogo -->
        <div class="activity-content">
          <div class="activity-headline">
            <h3 class="headline-text">{{ act.title }}</h3>
          </div>

          <!-- Review Text (se houver) -->
          <div v-if="act.content" class="review-quote">
            <p>"{{ act.content }}"</p>
          </div>

          <!-- Game Card Preview -->
          <div class="game-preview" @click="router.push(`/game/${act.game.id}`)">
            <img
              :src="act.game.cover_url || act.metadata?.cover_url || 'https://images.unsplash.com/photo-1550745165-9bc0b252726f?auto=format&fit=crop&w=400&q=80'"
              :alt="act.game.title"
              class="game-thumb"
            />
            <div class="game-meta">
              <span class="game-title">{{ act.game.title }}</span>
              <div class="tags-row">
                <span v-if="act.metadata?.platform" class="tag platform">{{ act.metadata.platform }}</span>
                <span v-if="act.metadata?.hours_played" class="tag hours mono">
                  <Clock :size="11" />
                  {{ act.metadata.hours_played }}h
                </span>
                <span v-if="act.metadata?.gamerscore" class="tag gamerscore mono">
                  +{{ act.metadata.gamerscore }}G
                </span>
              </div>
            </div>
          </div>
        </div>
      </article>
    </div>
  </div>
</template>

<style scoped>
.community-view {
  padding-top: 16px;
  padding-bottom: 24px;
}

.page-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 20px;
}

.title-with-icon {
  display: flex;
  align-items: center;
  gap: 8px;
}

.page-title {
  font-size: 1.35rem;
  font-weight: 800;
  color: var(--text-main);
}

.subtitle {
  font-size: 0.8rem;
  color: var(--text-muted);
}

.text-flame {
  color: #f97316;
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
}

.filters-bar {
  display: flex;
  gap: 8px;
  overflow-x: auto;
  padding-bottom: 12px;
  margin-bottom: 18px;
  scrollbar-width: none;
}

.filters-bar::-webkit-scrollbar {
  display: none;
}

.filter-pill {
  padding: 6px 14px;
  border-radius: var(--radius-full);
  background: var(--bg-surface);
  border: 1px solid var(--color-border);
  color: var(--text-muted);
  font-size: 0.8rem;
  font-weight: 600;
  white-space: nowrap;
  transition: all 0.2s ease;
}

.filter-pill:hover {
  background: var(--bg-surface-hover);
  color: var(--text-main);
}

.filter-pill.active {
  background: var(--color-primary);
  border-color: #c084fc;
  color: #fff;
  box-shadow: 0 2px 8px rgba(124, 58, 237, 0.4);
}

.activities-list {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.activity-card {
  background: var(--bg-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  padding: 16px;
  display: flex;
  flex-direction: column;
  gap: 12px;
  transition: border-color 0.2s ease, transform 0.2s ease;
}

.activity-card:hover {
  border-color: var(--color-accent);
}

.card-mastered {
  border-color: rgba(245, 158, 11, 0.5);
  background: linear-gradient(180deg, rgba(245, 158, 11, 0.05) 0%, var(--bg-surface) 100%);
}

.card-completed {
  border-color: rgba(16, 185, 129, 0.4);
}

.activity-top {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.user-block {
  display: flex;
  align-items: center;
  gap: 10px;
  cursor: pointer;
}

.user-avatar {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  object-fit: cover;
  border: 1px solid var(--color-border);
}

.user-meta {
  display: flex;
  flex-direction: column;
}

.user-name {
  font-size: 0.88rem;
  font-weight: 700;
  color: var(--text-main);
}

.time-ago {
  font-size: 0.72rem;
  color: var(--text-muted);
}

.rating-badge {
  display: flex;
  align-items: center;
  gap: 3px;
  background: rgba(251, 191, 36, 0.15);
  border: 1px solid rgba(251, 191, 36, 0.4);
  color: #fbbf24;
  padding: 2px 8px;
  border-radius: var(--radius-sm);
  font-size: 0.8rem;
  font-weight: 700;
}

.activity-headline {
  font-size: 0.95rem;
  font-weight: 600;
  color: var(--text-main);
}

.review-quote {
  background: var(--bg-surface-elevated);
  border-left: 3px solid var(--color-accent);
  padding: 10px 14px;
  border-radius: 0 var(--radius-sm) var(--radius-sm) 0;
  font-size: 0.88rem;
  color: #e2d9f3;
  font-style: italic;
  margin-top: 4px;
}

.game-preview {
  display: flex;
  align-items: center;
  gap: 12px;
  background: var(--bg-surface-elevated);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-sm);
  padding: 8px 12px;
  cursor: pointer;
  transition: background 0.2s ease;
  margin-top: 4px;
}

.game-preview:hover {
  background: var(--bg-surface-hover);
}

.game-thumb {
  width: 40px;
  height: 56px;
  border-radius: 6px;
  object-fit: cover;
}

.game-meta {
  display: flex;
  flex-direction: column;
  gap: 4px;
  overflow: hidden;
}

.game-title {
  font-size: 0.88rem;
  font-weight: 700;
  color: var(--text-main);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.tags-row {
  display: flex;
  align-items: center;
  gap: 6px;
}

.tag {
  font-size: 0.68rem;
  padding: 2px 6px;
  border-radius: 4px;
}

.tag.platform {
  background: rgba(255, 255, 255, 0.08);
  color: var(--text-muted);
}

.tag.hours {
  color: var(--color-accent);
  display: flex;
  align-items: center;
  gap: 2px;
}

.tag.gamerscore {
  background: rgba(34, 197, 94, 0.15);
  color: #4ade80;
  font-weight: 700;
}

.loading-state,
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 60px 20px;
  gap: 12px;
  color: var(--text-muted);
  text-align: center;
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
