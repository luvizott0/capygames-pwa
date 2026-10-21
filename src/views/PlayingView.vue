<template>
  <div class="up-next-page">
    <header class="page-header">
      <div class="container">
        <div class="header-content">
          <div class="header-title-box">
            <h1 class="header-title mono">Para Jogar</h1>
            <p class="header-subtitle">Seus próximos jogos na fila e jogatina atual</p>
          </div>
          <div class="header-actions">
            <!-- Botão de Recarregamento Forçado (Cache bypass) -->
            <RefreshButton
              :is-refreshing="gamesStore.isRefreshingMyList"
              @refresh="onForceRefresh"
            />
            <router-link to="/discover" class="btn-icon-link" title="Buscar Jogos">
              <Plus :size="20" />
            </router-link>
          </div>
        </div>
      </div>
    </header>

    <main class="container page-body">
      <!-- Loading State Inicial -->
      <div v-if="gamesStore.isRefreshingMyList && upNextGames.length === 0" class="loading-state">
        <div class="spinner"></div>
        <p>Carregando sua fila...</p>
      </div>

      <!-- Empty State -->
      <div v-else-if="!gamesStore.isRefreshingMyList && upNextGames.length === 0" class="empty-state fade-in">
        <div class="empty-icon-box">
          <Gamepad2 :size="48" class="empty-icon" />
        </div>
        <h3 class="empty-title">Nenhum jogo pendente!</h3>
        <p class="empty-desc">
          Você está em dia com seu backlog ou ainda não adicionou nenhum jogo para jogar.
        </p>
        <router-link to="/discover" class="btn-primary">
          <Search :size="18" />
          <span>Explorar Jogos</span>
        </router-link>
      </div>

      <!-- Up Next List (carregamento instantâneo do cache) -->
      <div v-else class="up-next-grid fade-in">
        <div
          v-for="item in upNextGames"
          :key="item.id"
          class="up-next-card"
        >
          <div class="card-poster" @click="goToGame(item.game.id)">
            <img
              v-if="item.game.cover_url"
              :src="item.game.cover_url"
              :alt="item.game.title"
              class="poster-img"
              loading="lazy"
            />
            <div v-else class="poster-placeholder">
              <Gamepad2 :size="32" />
            </div>
          </div>

          <div class="card-details">
            <div class="series-name" @click="goToGame(item.game.id)">
              {{ item.game.title }}
            </div>

            <div class="next-ep-box" @click="openEditModal(item)">
              <span class="mono ep-tag">
                {{ item.status === 'playing' ? '▶ JOGANDO' : '📌 NA FILA' }}
              </span>
              <span class="ep-title">
                {{ item.platform || 'PC' }}
                <template v-if="item.hours_played > 0"> • {{ item.hours_played }}h jogadas</template>
              </span>
            </div>

            <div class="progress-container">
              <div class="progress-bar-bg">
                <div
                  class="progress-bar-fill"
                  :style="{ width: `${getProgressPercent(item)}%` }"
                ></div>
              </div>
              <div class="progress-labels mono">
                <span v-if="item.achievements_total && item.achievements_total > 0">
                  {{ item.achievements_earned || 0 }}/{{ item.achievements_total }} conquistas
                </span>
                <span v-else>{{ item.hours_played || 0 }}h registradas</span>
                <span>{{ getProgressPercent(item) }}%</span>
              </div>
            </div>

            <div class="card-actions">
              <button
                class="check-action-btn"
                @click="openEditModal(item)"
                title="Atualizar progresso ou marcar como zerado"
              >
                <Check :size="18" stroke-width="3" />
                <span>{{ item.status === 'playing' ? 'Zerei / Avaliar' : 'Jogar' }}</span>
              </button>

              <button
                class="details-btn"
                @click="goToGame(item.game.id)"
              >
                <span>Ver Jogo</span>
                <ChevronRight :size="16" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </main>

    <!-- Modal de Edição / Avaliação Rápida -->
    <GameStatusModal
      :is-open="isModalOpen"
      :user-game="selectedUserGame"
      @close="isModalOpen = false"
      @updated="handleUpdated"
      @removed="handleRemoved"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { Gamepad2, Plus, Search, Check, ChevronRight } from 'lucide-vue-next'
import { type CapyUserGame } from '@/api/capygames'
import { useGamesStore } from '@/stores/games'
import GameStatusModal from '@/components/GameStatusModal.vue'
import RefreshButton from '@/components/RefreshButton.vue'

const router = useRouter()
const gamesStore = useGamesStore()

const isModalOpen = ref(false)
const selectedUserGame = ref<CapyUserGame | null>(null)

const upNextGames = computed(() => {
  const playing = gamesStore.myList.filter(i => i.status === 'playing')
  const plan = gamesStore.myList.filter(i => i.status === 'plan_to_play')
  return [...playing, ...plan]
})

function getProgressPercent(item: CapyUserGame): number {
  if (item.achievements_total && item.achievements_total > 0) {
    return Math.min(100, Math.round(((item.achievements_earned || 0) / item.achievements_total) * 100))
  }
  if (item.status === 'playing') {
    return item.hours_played > 0 ? Math.min(95, Math.max(15, Math.round(item.hours_played * 2))) : 15
  }
  return 0
}

function onForceRefresh() {
  gamesStore.fetchMyList(true)
}

function goToGame(gameId: number) {
  router.push(`/game/${gameId}`)
}

function openEditModal(item: CapyUserGame) {
  selectedUserGame.value = item
  isModalOpen.value = true
}

function handleUpdated() {
  gamesStore.invalidateAllCache()
  gamesStore.fetchMyList(true)
}

function handleRemoved() {
  gamesStore.invalidateAllCache()
  gamesStore.fetchMyList(true)
}

onMounted(() => {
  gamesStore.fetchMyList(false)
})
</script>

<style scoped>
.up-next-page {
  padding-bottom: 90px;
}

.page-header {
  padding: calc(var(--safe-top) + 16px) 0 16px;
  border-bottom: 1px solid var(--color-border);
  background-color: var(--bg-surface);
}

.header-content {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.header-actions {
  display: flex;
  align-items: center;
  gap: 10px;
}

.header-title {
  font-size: 1.5rem;
  font-weight: 700;
  color: var(--text-main);
}

.header-subtitle {
  font-size: 0.85rem;
  color: var(--text-muted);
}

.btn-icon-link {
  width: 38px;
  height: 38px;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: var(--bg-surface-elevated);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-full);
  color: var(--text-main);
  transition: all 0.2s;
}

.btn-icon-link:hover {
  border-color: var(--color-accent);
  color: var(--color-accent);
}

.page-body {
  padding-top: 20px;
}

.loading-state {
  text-align: center;
  padding: 60px 0;
  color: var(--text-muted);
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

.empty-state {
  text-align: center;
  padding: 60px 20px;
}

.empty-icon-box {
  width: 80px;
  height: 80px;
  background-color: var(--bg-surface-elevated);
  border-radius: var(--radius-full);
  display: inline-flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 16px;
}

.empty-icon {
  color: var(--color-accent);
}

.empty-title {
  font-size: 1.2rem;
  font-weight: 700;
  margin-bottom: 8px;
}

.empty-desc {
  color: var(--text-muted);
  font-size: 0.9rem;
  max-width: 380px;
  margin: 0 auto 24px;
}

.up-next-grid {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.up-next-card {
  display: flex;
  gap: 16px;
  background-color: var(--bg-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg);
  padding: 14px;
  transition: all 0.2s;
}

.card-poster {
  width: 90px;
  height: 130px;
  border-radius: var(--radius-sm);
  overflow: hidden;
  flex-shrink: 0;
  background-color: var(--bg-surface-elevated);
  cursor: pointer;
}

.poster-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.poster-placeholder {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--text-dim);
}

.card-details {
  flex: 1;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  min-width: 0;
}

.series-name {
  font-size: 1.05rem;
  font-weight: 700;
  color: var(--text-main);
  cursor: pointer;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.next-ep-box {
  background-color: var(--bg-surface-elevated);
  border: 1px solid var(--color-border-subtle);
  border-radius: var(--radius-sm);
  padding: 6px 10px;
  display: flex;
  align-items: center;
  gap: 8px;
  margin: 6px 0;
  cursor: pointer;
}

.ep-tag {
  color: var(--color-accent);
  font-size: 0.75rem;
  font-weight: 700;
  flex-shrink: 0;
}

.ep-title {
  font-size: 0.85rem;
  color: var(--text-muted);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.progress-container {
  margin: 4px 0 10px;
}

.progress-bar-bg {
  width: 100%;
  height: 6px;
  background-color: var(--bg-surface-elevated);
  border-radius: 3px;
  overflow: hidden;
}

.progress-bar-fill {
  height: 100%;
  background-color: var(--color-accent);
  border-radius: 3px;
  transition: width 0.3s;
}

.progress-labels {
  display: flex;
  justify-content: space-between;
  font-size: 0.7rem;
  color: var(--text-dim);
  margin-top: 3px;
}

.card-actions {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
}

.check-action-btn {
  display: flex;
  align-items: center;
  gap: 6px;
  background-color: var(--color-accent);
  color: #0f0d15;
  font-weight: 700;
  font-size: 0.85rem;
  padding: 8px 16px;
  border-radius: var(--radius-full);
  transition: all 0.2s;
}

.check-action-btn:hover {
  background-color: var(--color-accent-hover);
  transform: scale(1.02);
}

.details-btn {
  display: flex;
  align-items: center;
  gap: 2px;
  color: var(--text-muted);
  font-size: 0.8rem;
  padding: 6px 8px;
}
</style>
