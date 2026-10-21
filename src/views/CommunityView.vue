<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { capyGamesApi, type GameActivity } from '@/api/capygames'
import { Trophy, Star, Clock, RotateCw, Gamepad2, Users } from 'lucide-vue-next'

const router = useRouter()

const activities = ref<GameActivity[]>([])
const houseUsers = ref<any[]>([])
const isLoading = ref(true)
const activeFilter = ref<'all' | 'milestones' | 'achievements' | 'reviews'>('all')

async function fetchFeed() {
  isLoading.value = true
  try {
    const [feedRes, usersRes] = await Promise.all([
      capyGamesApi.getFeed(40),
      capyGamesApi.getUsers()
    ])
    activities.value = feedRes.data.data
    houseUsers.value = usersRes.data.data || []
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
  <div class="community-page">
    <header class="page-header">
      <div class="container">
        <div class="header-top">
          <div>
            <h1 class="header-title mono">Atividades da CapyGames</h1>
            <p class="header-subtitle">O que os amigos da capihouse estão jogando</p>
          </div>
          <button
            type="button"
            class="refresh-btn"
            :class="{ spinning: isLoading }"
            :disabled="isLoading"
            title="Recarregar atividades"
            @click="fetchFeed"
          >
            <RotateCw :size="18" />
          </button>
        </div>

        <!-- Filtros em Pílula -->
        <div class="filters-bar">
          <button
            type="button"
            class="filter-pill"
            :class="{ active: activeFilter === 'all' }"
            @click="activeFilter = 'all'"
          >
            Todas
          </button>
          <button
            type="button"
            class="filter-pill"
            :class="{ active: activeFilter === 'milestones' }"
            @click="activeFilter = 'milestones'"
          >
            🏆 Zeramentos & Platinas
          </button>
          <button
            type="button"
            class="filter-pill"
            :class="{ active: activeFilter === 'achievements' }"
            @click="activeFilter = 'achievements'"
          >
            🎮 Conquistas
          </button>
          <button
            type="button"
            class="filter-pill"
            :class="{ active: activeFilter === 'reviews' }"
            @click="activeFilter = 'reviews'"
          >
            📝 Análises
          </button>
        </div>
      </div>
    </header>

    <main class="container page-body">
      <!-- Amigos da Casa (estilo CapyShowTime) -->
      <section v-if="houseUsers.length > 0" class="friends-section fade-in">
        <h2 class="section-heading mono">Amigos da Casa</h2>
        <div class="friends-scroll">
          <div
            v-for="u in houseUsers"
            :key="u.id"
            class="friend-chip"
            @click="router.push(`/user/${u.id}`)"
          >
            <img
              :src="u.avatar_url || 'https://api.dicebear.com/7.x/bottts/svg?seed=' + u.username"
              :alt="u.name"
              class="friend-avatar"
            />
            <span class="friend-name">{{ u.name.split(' ')[0] }}</span>
          </div>
        </div>
      </section>

      <!-- Feed Content -->
      <div v-if="isLoading && activities.length === 0" class="loading-state">
        <div class="spinner"></div>
        <p>Carregando atividades...</p>
      </div>

      <div v-else-if="filteredActivities.length === 0" class="empty-state fade-in">
        <Users :size="48" class="empty-icon" />
        <h3 class="empty-title">Nenhuma atividade recente</h3>
        <p class="empty-desc">As conquistas, zeramentos e análises dos amigos da Capihouse aparecerão aqui!</p>
      </div>

      <div v-else class="activities-list fade-in">
        <h2 class="section-heading mono">Destaques da Casa</h2>
        <article
          v-for="act in filteredActivities"
          :key="act.id"
          class="activity-card"
          :class="{
            'card-mastered': act.metadata?.status === 'mastered',
            'card-completed': act.metadata?.status === 'completed'
          }"
        >
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

            <div v-if="act.metadata?.rating" class="badge-rating mono">
              <Star :size="12" fill="currentColor" />
              <span>{{ act.metadata.rating.toFixed(1) }}</span>
            </div>
            <div v-else-if="act.metadata?.status === 'mastered'" class="badge-mastered mono">
              <Trophy :size="12" />
              <span>Platina</span>
            </div>
          </div>

          <div class="activity-content">
            <h3 class="headline-text">{{ act.title }}</h3>

            <div v-if="act.content" class="review-quote">
              <p>"{{ act.content }}"</p>
            </div>

            <div class="game-preview" @click="router.push(`/game/${act.game.id}`)">
              <img
                :src="act.game.cover_url || act.metadata?.cover_url || 'https://images.unsplash.com/photo-1550745165-9bc0b252726f?auto=format&fit=crop&w=400&q=80'"
                :alt="act.game.title"
                class="game-thumb"
              />
              <div class="game-meta">
                <span class="game-title">{{ act.game.title }}</span>
                <div class="tags-row">
                  <span v-if="act.metadata?.platform" class="badge-tag">{{ act.metadata.platform }}</span>
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
    </main>
  </div>
</template>

<style scoped>
.community-page {
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
  margin-bottom: 14px;
}

.header-title {
  font-size: 1.35rem;
  font-weight: 700;
}

.header-subtitle {
  font-size: 0.84rem;
  color: var(--text-muted);
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

.filters-bar {
  display: flex;
  gap: 8px;
  overflow-x: auto;
  padding-bottom: 4px;
  scrollbar-width: none;
}

.filters-bar::-webkit-scrollbar {
  display: none;
}

.filter-pill {
  padding: 8px 16px;
  border-radius: var(--radius-full);
  background: var(--bg-surface-elevated);
  border: 1px solid var(--color-border);
  color: var(--text-muted);
  font-size: 0.82rem;
  font-weight: 500;
  white-space: nowrap;
  transition: all 0.2s ease;
}

.filter-pill:hover {
  color: var(--text-main);
}

.filter-pill.active {
  background: var(--color-accent);
  border-color: var(--color-accent);
  color: #0c0a14;
  font-weight: 700;
}

.page-body {
  padding-top: 20px;
}

.friends-section {
  margin-bottom: 24px;
}

.section-heading {
  font-size: 0.88rem;
  font-weight: 700;
  color: var(--text-muted);
  text-transform: uppercase;
  letter-spacing: 0.04em;
  margin-bottom: 12px;
}

.friends-scroll {
  display: flex;
  gap: 10px;
  overflow-x: auto;
  padding-bottom: 6px;
  scrollbar-width: none;
}

.friends-scroll::-webkit-scrollbar {
  display: none;
}

.friend-chip {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 6px 14px 6px 6px;
  background-color: var(--bg-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-full);
  cursor: pointer;
  white-space: nowrap;
  transition: all 0.2s ease;
}

.friend-chip:hover {
  border-color: var(--color-accent);
  background-color: var(--bg-surface-elevated);
  transform: translateY(-2px);
}

.friend-avatar {
  width: 28px;
  height: 28px;
  border-radius: 50%;
  object-fit: cover;
}

.friend-name {
  font-size: 0.82rem;
  font-weight: 600;
  color: var(--text-main);
}

.activities-list {
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.activity-card {
  background: var(--bg-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg);
  padding: 18px;
  display: flex;
  flex-direction: column;
  gap: 12px;
  transition: border-color 0.2s ease;
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
  width: 38px;
  height: 38px;
  border-radius: 50%;
  object-fit: cover;
  border: 1px solid var(--color-border);
}

.user-meta {
  display: flex;
  flex-direction: column;
}

.user-name {
  font-size: 0.9rem;
  font-weight: 700;
  color: var(--text-main);
}

.time-ago {
  font-size: 0.74rem;
  color: var(--text-muted);
}

.headline-text {
  font-size: 0.94rem;
  font-weight: 600;
  color: var(--text-main);
}

.review-quote {
  background: var(--bg-surface-elevated);
  border-left: 3px solid var(--color-accent);
  padding: 12px 16px;
  border-radius: 0 var(--radius-md) var(--radius-md) 0;
  font-size: 0.88rem;
  color: #e2d9f3;
  font-style: italic;
  margin-top: 6px;
}

.game-preview {
  display: flex;
  align-items: center;
  gap: 12px;
  background: var(--bg-surface-elevated);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  padding: 10px 14px;
  cursor: pointer;
  transition: background 0.2s ease, border-color 0.2s ease;
  margin-top: 8px;
}

.game-preview:hover {
  background: var(--bg-surface-hover);
  border-color: var(--color-accent);
}

.game-thumb {
  width: 44px;
  height: 62px;
  border-radius: var(--radius-sm);
  object-fit: cover;
}

.game-meta {
  display: flex;
  flex-direction: column;
  gap: 6px;
  overflow: hidden;
}

.game-title {
  font-size: 0.9rem;
  font-weight: 700;
  color: var(--text-main);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.tags-row {
  display: flex;
  align-items: center;
  gap: 8px;
}

.tag {
  font-size: 0.72rem;
  padding: 3px 9px;
  border-radius: var(--radius-full);
}

.tag.hours {
  color: var(--color-accent);
  background: var(--color-accent-dim);
  display: inline-flex;
  align-items: center;
  gap: 3px;
  font-weight: 600;
}

.tag.gamerscore {
  background: rgba(34, 197, 94, 0.15);
  color: #4ade80;
  font-weight: 700;
}

.loading-state,
.empty-state {
  text-align: center;
  padding: 60px 20px;
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
}

@keyframes spin {
  to { transform: rotate(360deg); }
}
</style>
