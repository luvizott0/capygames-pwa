<template>
  <div class="community-page">
    <header class="page-header">
      <div class="container">
        <div class="header-top">
          <div>
            <h1 class="header-title mono">Atividades da CapyGames</h1>
            <p class="header-subtitle">O que os amigos da capihouse estão jogando</p>
          </div>
          <RefreshButton
            :is-refreshing="gamesStore.isRefreshingCommunity"
            @refresh="onForceRefresh"
          />
        </div>
      </div>
    </header>

    <main class="container page-body">
      <!-- Amigos da Casa (acesso rápido aos perfis e listas) -->
      <section v-if="houseUsers.length > 0" class="friends-section fade-in">
        <h2 class="section-heading mono">Amigos da Casa</h2>
        <div class="friends-scroll">
          <div
            v-for="u in houseUsers"
            :key="u.id"
            class="friend-chip"
            @click="goToProfile(u.id)"
          >
            <img
              v-if="u.avatar_url && !failedAvatars[`friend_${u.id}`]"
              :src="u.avatar_url"
              :alt="u.name"
              class="friend-avatar"
              @error="failedAvatars[`friend_${u.id}`] = true"
            />
            <div v-else class="friend-avatar-placeholder">
              {{ u.name.charAt(0) }}
            </div>
            <span class="friend-name">{{ u.name.split(' ')[0] }}</span>
          </div>
        </div>
      </section>

      <div v-if="gamesStore.isRefreshingCommunity && !gamesStore.communityLoaded" class="loading-state">
        <div class="spinner"></div>
        <p>Carregando atividades...</p>
      </div>

      <div v-else-if="gamesStore.communityActivities.length === 0" class="empty-state fade-in">
        <Users :size="48" class="empty-icon" />
        <h3 class="empty-title">Nenhuma atividade recente</h3>
        <p class="empty-desc">Assim que algum amigo avaliar jogos, publicar análises ou zerar títulos, as novidades aparecerão aqui!</p>
      </div>

      <div v-else class="activities-list fade-in">
        <h2 class="section-heading mono">Destaques da Casa</h2>
        <div
          v-for="act in gamesStore.communityActivities"
          :key="act.id"
          class="activity-card"
        >
          <div class="user-row" @click="goToProfile(act.user.id)">
            <div class="user-main">
              <img
                v-if="act.user.avatar_url && !failedAvatars[`act_${act.id}`]"
                :src="act.user.avatar_url"
                :alt="act.user.name"
                class="user-avatar"
                @error="failedAvatars[`act_${act.id}`] = true"
              />
              <div v-else class="user-avatar-placeholder">
                {{ act.user.name.charAt(0) }}
              </div>
              <div class="user-meta">
                <span class="user-name">{{ act.user.name }}</span>
                <span class="activity-time">{{ formatRelativeDate(act.created_at) }}</span>
              </div>
            </div>

            <!-- Badge do tipo de atividade relevante -->
            <div class="activity-type-badge" :class="getActivityClass(act)">
              <Trophy v-if="isCompletedActivity(act)" :size="13" />
              <MessageSquare v-else-if="act.content" :size="13" />
              <Star v-else :size="13" fill="currentColor" />
              <span>
                {{ getActivityBadgeLabel(act) }}
              </span>
            </div>
          </div>

          <div class="activity-content" @click="goToGame(act.game?.id || act.game_id)">
            <img
              v-if="act.game?.cover_url || act.metadata?.cover_url"
              :src="act.game?.cover_url || act.metadata?.cover_url"
              :alt="act.game?.title || act.metadata?.game_title"
              class="series-poster"
            />
            <div class="content-details">
              <h4 class="series-name">{{ act.game?.title || act.metadata?.game_title }}</h4>

              <!-- Jogo Zerado ou Platinado -->
              <div v-if="isCompletedActivity(act)" class="completion-box">
                <span class="completion-pill">
                  {{ act.metadata?.status === 'mastered' ? '🏆 Platinou / 100%!' : '🏁 Zerou o jogo!' }}
                </span>
                <span v-if="act.metadata?.hours_played" class="seasons-total mono">
                  {{ act.metadata.hours_played }}h
                </span>
              </div>

              <!-- Info de Plataforma / Status -->
              <p v-else class="ep-info">
                <span v-if="act.metadata?.platform" class="mono ep-code">{{ act.metadata.platform }}</span>
                <span class="ep-title">{{ act.title }}</span>
              </p>

              <!-- Avaliação com Nota -->
              <div v-if="act.metadata?.rating" class="rating-badge-row">
                <div class="badge-rating mono">
                  <Star :size="14" fill="currentColor" />
                  <span>{{ Number(act.metadata.rating).toFixed(1) }} ★</span>
                </div>
              </div>

              <!-- Análise / Review -->
              <div v-if="act.content" class="comment-box" @click.stop>
                <div class="comment-text-wrapper">
                  <p class="comment-text">
                    "{{ act.content }}"
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { Users, Star, MessageSquare, Trophy } from 'lucide-vue-next'
import { capyGamesApi, type GameActivity } from '@/api/capygames'
import { useGamesStore } from '@/stores/games'
import RefreshButton from '@/components/RefreshButton.vue'

const router = useRouter()
const gamesStore = useGamesStore()
const houseUsers = ref<any[]>([])
const failedAvatars = reactive<Record<string, boolean>>({})

async function fetchUsers() {
  try {
    const res = await capyGamesApi.getUsers()
    houseUsers.value = res.data.data || []
  } catch (err) {
    console.error('Erro ao buscar amigos:', err)
  }
}

function onForceRefresh() {
  gamesStore.fetchCommunity(true)
  fetchUsers()
}

function isCompletedActivity(act: GameActivity): boolean {
  const st = act.metadata?.status
  return st === 'completed' || st === 'mastered' || act.type === 'achievement'
}

function getActivityClass(act: GameActivity): string {
  if (isCompletedActivity(act)) return 'completed'
  if (act.content) return 'comment'
  return 'rating'
}

function getActivityBadgeLabel(act: GameActivity): string {
  if (act.metadata?.status === 'mastered') return 'Platinou'
  if (act.metadata?.status === 'completed') return 'Zerou'
  if (act.content) return 'Analisou'
  if (act.metadata?.rating) return 'Avaliou'
  return 'Jogando'
}

function formatRelativeDate(dateStr: string): string {
  const d = new Date(dateStr)
  const diffMs = Date.now() - d.getTime()
  const mins = Math.floor(diffMs / 60000)
  if (mins < 1) return 'Agora mesmo'
  if (mins < 60) return `há ${mins} min`
  const hours = Math.floor(mins / 60)
  if (hours < 24) return `há ${hours}h`
  const days = Math.floor(hours / 24)
  if (days < 7) return `há ${days}d`
  return d.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })
}

function goToProfile(userId: number) {
  router.push(`/profile/${userId}`)
}

function goToGame(gameId: number) {
  if (gameId) {
    router.push(`/game/${gameId}`)
  }
}

onMounted(() => {
  gamesStore.fetchCommunity(false)
  fetchUsers()
})
</script>

<style scoped>
.community-page {
  padding-bottom: 90px;
}

.page-header {
  padding: calc(var(--safe-top) + 16px) 0 16px;
  background-color: var(--bg-surface);
  border-bottom: 1px solid var(--color-border);
}

.header-top {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.header-title {
  font-size: 1.4rem;
  font-weight: 700;
}

.header-subtitle {
  font-size: 0.85rem;
  color: var(--text-muted);
}

.page-body {
  padding-top: 20px;
}

.friends-section {
  margin-bottom: 24px;
}

.section-heading {
  font-size: 0.9rem;
  font-weight: 700;
  color: var(--text-muted);
  text-transform: uppercase;
  letter-spacing: 0.04em;
  margin-bottom: 12px;
}

.friends-scroll {
  display: flex;
  gap: 14px;
  overflow-x: auto;
  padding: 4px 2px 8px;
  scrollbar-width: none;
}

.friends-scroll::-webkit-scrollbar {
  display: none;
}

.friend-chip {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 6px;
  cursor: pointer;
  flex-shrink: 0;
  transition: transform 0.15s ease;
}

.friend-chip:hover {
  transform: translateY(-2px);
}

.friend-avatar {
  width: 48px;
  height: 48px;
  border-radius: 50%;
  object-fit: cover;
  border: 2px solid var(--color-border);
  transition: border-color 0.2s;
}

.friend-chip:hover .friend-avatar {
  border-color: var(--color-accent);
}

.friend-avatar-placeholder {
  width: 48px;
  height: 48px;
  border-radius: 50%;
  background-color: var(--color-primary);
  color: #fff;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 700;
  font-size: 1rem;
  border: 2px solid var(--color-border);
}

.friend-name {
  font-size: 0.75rem;
  color: var(--text-main);
  font-weight: 500;
  max-width: 64px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.activities-list {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.activity-card {
  background-color: var(--bg-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg);
  padding: 16px;
}

.user-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  margin-bottom: 12px;
  cursor: pointer;
}

.user-main {
  display: flex;
  align-items: center;
  gap: 10px;
}

.activity-type-badge {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  font-size: 0.72rem;
  font-weight: 700;
  padding: 3px 8px;
  border-radius: var(--radius-full);
}

.activity-type-badge.rating {
  background: rgba(245, 197, 24, 0.15);
  color: var(--color-accent);
  border: 1px solid rgba(245, 197, 24, 0.3);
}

.activity-type-badge.comment {
  background: rgba(59, 130, 246, 0.15);
  color: #60a5fa;
  border: 1px solid rgba(59, 130, 246, 0.3);
}

.activity-type-badge.completed {
  background: rgba(34, 197, 94, 0.15);
  color: var(--color-success);
  border: 1px solid rgba(34, 197, 94, 0.3);
}

.completion-box {
  display: flex;
  align-items: center;
  gap: 8px;
  margin: 6px 0;
  flex-wrap: wrap;
}

.completion-pill {
  font-size: 0.78rem;
  font-weight: 700;
  color: var(--color-success);
  background: rgba(34, 197, 94, 0.12);
  border: 1px solid rgba(34, 197, 94, 0.25);
  padding: 2px 8px;
  border-radius: var(--radius-sm);
}

.seasons-total {
  font-size: 0.75rem;
  color: var(--text-dim);
}

.comment-box {
  margin-top: 8px;
  background-color: var(--bg-surface);
  border-left: 3px solid var(--color-primary);
  border-radius: 0 var(--radius-sm) var(--radius-sm) 0;
  padding: 8px 10px;
}

.comment-text {
  font-size: 0.82rem;
  color: var(--text-main);
  font-style: italic;
  line-height: 1.4;
  margin: 0;
}

.comment-text-wrapper {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 8px;
}

.user-avatar {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  object-fit: cover;
}

.user-avatar-placeholder {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  background-color: var(--color-primary);
  color: #fff;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 700;
  font-size: 0.85rem;
}

.user-meta {
  display: flex;
  flex-direction: column;
}

.user-name {
  font-size: 0.9rem;
  font-weight: 600;
  color: var(--text-main);
}

.activity-time {
  font-size: 0.72rem;
  color: var(--text-dim);
}

.activity-content {
  display: flex;
  gap: 14px;
  background-color: var(--bg-surface-elevated);
  border-radius: var(--radius-md);
  padding: 10px;
  cursor: pointer;
  border: 1px solid var(--color-border-subtle);
}

.series-poster {
  width: 50px;
  height: 75px;
  border-radius: var(--radius-sm);
  object-fit: cover;
  flex-shrink: 0;
}

.content-details {
  flex: 1;
  display: flex;
  flex-direction: column;
  justify-content: center;
  min-width: 0;
}

.series-name {
  font-size: 0.95rem;
  font-weight: 700;
  color: var(--text-main);
}

.ep-info {
  font-size: 0.8rem;
  color: var(--text-muted);
  display: flex;
  align-items: center;
  gap: 6px;
  margin: 2px 0 6px;
}

.ep-code {
  color: var(--color-accent);
  font-weight: 700;
}

.rating-badge-row {
  display: flex;
}

.loading-state, .empty-state {
  text-align: center;
  padding: 60px 0;
  color: var(--text-muted);
}

.empty-icon {
  color: var(--color-accent);
  margin-bottom: 12px;
}

.empty-title {
  font-size: 1.15rem;
  font-weight: 700;
  color: var(--text-main);
  margin-bottom: 4px;
}

.empty-desc {
  font-size: 0.85rem;
}

.spinner {
  width: 32px;
  height: 32px;
  border: 3px solid var(--color-border);
  border-top-color: var(--color-accent);
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
  margin: 0 auto 12px;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}
</style>
