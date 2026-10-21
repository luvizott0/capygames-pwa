<script setup lang="ts">
import { ref, watch } from 'vue'
import { capyGamesApi, type CapyUserGame, type GameStatus, type GameSearchResult } from '@/api/capygames'
import { X, Star, Trash2, Check, Clock } from 'lucide-vue-next'

const props = defineProps<{
  isOpen: boolean
  userGame?: CapyUserGame | null
  gameCandidate?: GameSearchResult | null
}>()

const emit = defineEmits<{
  (e: 'close'): void
  (e: 'updated', userGame: any): void
  (e: 'removed', id: number): void
}>()

const status = ref<GameStatus>('playing')
const platform = ref('PC')
const hoursPlayed = ref<number>(0)
const rating = ref<number | null>(null)
const review = ref('')
const isFavorite = ref(false)
const isSubmitting = ref(false)
const errorMsg = ref('')

const platformsList = [
  'PC',
  'Xbox Series X|S',
  'Xbox One',
  'PlayStation 5',
  'PlayStation 4',
  'Nintendo Switch',
  'Steam Deck',
  'Retro / Emulador',
  'Mobile'
]

const statusOptions: { value: GameStatus; label: string; icon: string }[] = [
  { value: 'playing', label: 'Jogando', icon: '🎮' },
  { value: 'plan_to_play', label: 'A Jogar', icon: '📌' },
  { value: 'completed', label: 'Zerado', icon: '🏁' },
  { value: 'mastered', label: 'Platinado', icon: '🏆' },
  { value: 'on_hold', label: 'Em Pausa', icon: '⏸️' },
  { value: 'dropped', label: 'Abandonado', icon: '🛑' }
]

watch(
  () => [props.isOpen, props.userGame, props.gameCandidate],
  () => {
    if (props.isOpen) {
      errorMsg.value = ''
      if (props.userGame) {
        status.value = props.userGame.status
        platform.value = props.userGame.platform || 'PC'
        hoursPlayed.value = props.userGame.hours_played || 0
        rating.value = props.userGame.rating ?? null
        review.value = props.userGame.review || ''
        isFavorite.value = props.userGame.is_favorite || false
      } else if (props.gameCandidate) {
        status.value = 'plan_to_play'
        platform.value = props.gameCandidate.platforms?.[0] || 'PC'
        hoursPlayed.value = 0
        rating.value = null
        review.value = ''
        isFavorite.value = false
      }
    }
  },
  { immediate: true }
)

const title = () => {
  return props.userGame?.game?.title || props.gameCandidate?.title || 'Detalhes do Jogo'
}

const coverUrl = () => {
  return props.userGame?.game?.cover_url || props.gameCandidate?.cover_url
}

async function handleSave() {
  isSubmitting.value = true
  errorMsg.value = ''

  try {
    const payload = {
      game_id: props.userGame?.game_id,
      external_id: props.gameCandidate?.external_id,
      external_source: props.gameCandidate?.external_source,
      title: title(),
      cover_url: coverUrl(),
      status: status.value,
      platform: platform.value,
      hours_played: Number(hoursPlayed.value) || 0,
      rating: rating.value !== null ? Number(rating.value) : null,
      review: review.value.trim() ? review.value.trim() : null,
      is_favorite: isFavorite.value
    }

    const res = await capyGamesApi.setStatus(payload)
    emit('updated', res.data.user_game)
    emit('close')
  } catch (err: any) {
    errorMsg.value = err.response?.data?.message || 'Erro ao salvar jogo na biblioteca.'
  } finally {
    isSubmitting.value = false
  }
}

async function handleRemove() {
  if (!props.userGame) return
  if (!confirm(`Remover "${props.userGame.game.title}" da sua biblioteca?`)) return

  isSubmitting.value = true
  try {
    await capyGamesApi.removeGame(props.userGame.id)
    emit('removed', props.userGame.id)
    emit('close')
  } catch (err: any) {
    errorMsg.value = err.response?.data?.message || 'Erro ao remover jogo.'
  } finally {
    isSubmitting.value = false
  }
}

function setScore(score: number) {
  if (rating.value === score) {
    rating.value = null
  } else {
    rating.value = score
  }
}
</script>

<template>
  <div v-if="isOpen" class="modal-backdrop" @click.self="emit('close')">
    <div class="modal-container fade-in">
      <div class="modal-header">
        <div class="header-info">
          <img v-if="coverUrl()" :src="coverUrl()" class="mini-cover" />
          <div>
            <h2 class="game-title">{{ title() }}</h2>
            <p class="subtitle">Organize e avalie sua jogatina</p>
          </div>
        </div>
        <button class="close-btn" @click="emit('close')">
          <X :size="20" />
        </button>
      </div>

      <div class="modal-body">
        <div v-if="errorMsg" class="error-banner">
          {{ errorMsg }}
        </div>

        <!-- Status selector -->
        <div class="form-group">
          <label class="form-label">Status no Jogo</label>
          <div class="status-grid">
            <button
              v-for="opt in statusOptions"
              :key="opt.value"
              type="button"
              class="status-btn"
              :class="{ active: status === opt.value, [`btn-${opt.value}`]: status === opt.value }"
              @click="status = opt.value"
            >
              <span class="status-icon">{{ opt.icon }}</span>
              <span class="status-name">{{ opt.label }}</span>
            </button>
          </div>
        </div>

        <!-- Plataforma & Horas -->
        <div class="form-row">
          <div class="form-group flex-1">
            <label class="form-label">Plataforma</label>
            <select v-model="platform" class="form-input">
              <option v-for="p in platformsList" :key="p" :value="p">{{ p }}</option>
            </select>
          </div>

          <div class="form-group flex-1">
            <label class="form-label">Horas Jogadas</label>
            <div class="input-with-icon">
              <Clock :size="16" class="field-icon" />
              <input
                v-model="hoursPlayed"
                type="number"
                step="0.5"
                min="0"
                max="9999"
                class="form-input with-left-icon mono"
                placeholder="0"
              />
            </div>
          </div>
        </div>

        <!-- Avaliação / Nota de 1 a 10 -->
        <div class="form-group">
          <div class="label-with-val">
            <label class="form-label">Nota Pessoal (1 a 10)</label>
            <span v-if="rating" class="rating-display mono">
              <Star :size="14" fill="#fbbf24" color="#fbbf24" />
              {{ rating.toFixed(1) }} / 10
            </span>
            <span v-else class="text-muted text-xs">Sem nota</span>
          </div>

          <div class="ratings-bar">
            <button
              v-for="val in 10"
              :key="val"
              type="button"
              class="rating-box mono"
              :class="{
                selected: rating !== null && rating >= val,
                exact: rating === val
              }"
              @click="setScore(val)"
            >
              {{ val }}
            </button>
          </div>
        </div>

        <!-- Análise / Review -->
        <div class="form-group">
          <label class="form-label">Sua Análise / Opinião (opcional)</label>
          <textarea
            v-model="review"
            rows="3"
            class="form-input form-textarea"
            placeholder="O que achou da história, jogabilidade, gráficos e trilha sonora? Não se preocupe, sem spoilers!"
          ></textarea>
        </div>
      </div>

      <div class="modal-footer">
        <button
          v-if="userGame"
          type="button"
          class="btn-delete"
          :disabled="isSubmitting"
          @click="handleRemove"
          title="Remover da biblioteca"
        >
          <Trash2 :size="18" />
        </button>

        <div class="footer-actions">
          <button type="button" class="btn-cancel" @click="emit('close')">
            Cancelar
          </button>
          <button
            type="button"
            class="btn-save"
            :disabled="isSubmitting"
            @click="handleSave"
          >
            <Check :size="18" />
            <span>{{ isSubmitting ? 'Salvando...' : 'Salvar' }}</span>
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.modal-backdrop {
  position: fixed;
  inset: 0;
  background: rgba(18, 16, 14, 0.85);
  backdrop-filter: blur(8px);
  -webkit-backdrop-filter: blur(8px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 100;
  padding: 16px;
}

.modal-container {
  background: var(--bg-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  width: 100%;
  max-width: 520px;
  max-height: 90vh;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  box-shadow: 0 16px 40px rgba(0, 0, 0, 0.7);
}

.modal-header {
  padding: 16px 20px;
  background: var(--bg-surface-elevated);
  border-bottom: 1px solid var(--color-border);
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}

.header-info {
  display: flex;
  align-items: center;
  gap: 12px;
  overflow: hidden;
}

.mini-cover {
  width: 36px;
  height: 48px;
  border-radius: 6px;
  object-fit: cover;
  border: 1px solid var(--color-border);
}

.game-title {
  font-size: 1.05rem;
  font-weight: 700;
  color: var(--text-main);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.subtitle {
  font-size: 0.78rem;
  color: var(--text-muted);
}

.close-btn {
  color: var(--text-muted);
  padding: 6px;
  border-radius: var(--radius-sm);
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s ease;
}

.close-btn:hover {
  color: var(--text-main);
  background: var(--bg-surface-hover);
}

.modal-body {
  padding: 20px;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.error-banner {
  background: rgba(239, 68, 68, 0.15);
  border: 1px solid var(--color-danger);
  color: var(--color-danger);
  padding: 10px 14px;
  border-radius: var(--radius-sm);
  font-size: 0.85rem;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.form-row {
  display: flex;
  gap: 12px;
}

.flex-1 {
  flex: 1;
}

.form-label {
  font-size: 0.82rem;
  font-weight: 600;
  color: var(--text-muted);
  text-transform: uppercase;
  letter-spacing: 0.03em;
}

.label-with-val {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.status-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 8px;
}

.status-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  padding: 10px 10px;
  background: var(--bg-surface-elevated);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-full);
  color: var(--text-muted);
  font-size: 0.82rem;
  font-weight: 600;
  transition: all 0.2s ease;
}

.status-btn:hover {
  background: var(--bg-surface-hover);
  color: var(--text-main);
}

.status-btn.btn-mastered {
  background: rgba(245, 158, 11, 0.2);
  border-color: #f59e0b;
  color: #fbbf24;
}

.status-btn.btn-completed {
  background: rgba(16, 185, 129, 0.2);
  border-color: #10b981;
  color: #34d399;
}

.status-btn.btn-playing {
  background: rgba(59, 130, 246, 0.2);
  border-color: #3b82f6;
  color: #60a5fa;
}

.status-btn.btn-plan_to_play {
  background: rgba(245, 197, 24, 0.15);
  border-color: rgba(245, 197, 24, 0.4);
  color: var(--color-accent);
}

.status-btn.btn-on_hold {
  background: rgba(107, 114, 128, 0.2);
  border-color: #6b7280;
  color: #9ca3af;
}

.status-btn.btn-dropped {
  background: rgba(239, 68, 68, 0.2);
  border-color: #ef4444;
  color: #f87171;
}

.form-input {
  background: var(--bg-surface-elevated);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  padding: 11px 16px;
  color: var(--text-main);
  font-size: 0.9rem;
  outline: none;
  transition: border-color 0.2s ease;
}

.form-input:focus {
  border-color: var(--color-accent);
}

.input-with-icon {
  position: relative;
  display: flex;
  align-items: center;
}

.field-icon {
  position: absolute;
  left: 14px;
  color: var(--text-dim);
  pointer-events: none;
}

.with-left-icon {
  padding-left: 38px;
  width: 100%;
}

.form-textarea {
  resize: vertical;
  line-height: 1.4;
}

.rating-display {
  display: flex;
  align-items: center;
  gap: 4px;
  color: #fbbf24;
  font-weight: 700;
  font-size: 0.85rem;
}

.ratings-bar {
  display: grid;
  grid-template-columns: repeat(10, 1fr);
  gap: 5px;
}

.rating-box {
  padding: 9px 0;
  text-align: center;
  background: var(--bg-surface-elevated);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-sm);
  color: var(--text-muted);
  font-size: 0.82rem;
  font-weight: 700;
  transition: all 0.15s ease;
}

.rating-box:hover {
  border-color: var(--color-accent);
  color: var(--text-main);
}

.rating-box.selected {
  background: rgba(245, 197, 24, 0.15);
  border-color: rgba(245, 197, 24, 0.4);
  color: var(--color-accent);
}

.rating-box.exact {
  background: var(--color-accent);
  border-color: var(--color-accent);
  color: #12100e;
  box-shadow: 0 0 12px rgba(245, 197, 24, 0.4);
}

.modal-footer {
  padding: 14px 20px;
  background: var(--bg-surface-elevated);
  border-top: 1px solid var(--color-border);
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.footer-actions {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-left: auto;
}

.btn-delete {
  color: var(--color-danger);
  width: 38px;
  height: 38px;
  border-radius: var(--radius-sm);
  background: rgba(248, 113, 113, 0.1);
  display: flex;
  align-items: center;
  justify-content: center;
  transition: background 0.2s ease;
}

.btn-delete:hover {
  background: rgba(248, 113, 113, 0.2);
}

.btn-cancel {
  padding: 10px 18px;
  color: var(--text-muted);
  font-size: 0.88rem;
  font-weight: 600;
  border-radius: var(--radius-sm);
  background: var(--bg-surface);
  border: 1px solid var(--color-border);
  transition: all 0.2s ease;
}

.btn-cancel:hover {
  color: var(--text-main);
  border-color: var(--color-accent);
}

.btn-save {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 10px 22px;
  background: var(--color-accent);
  color: #12100e;
  font-size: 0.88rem;
  font-weight: 700;
  border-radius: var(--radius-sm);
  transition: all 0.2s ease;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.35);
}

.btn-save:hover:not(:disabled) {
  background: var(--color-accent-hover);
  transform: translateY(-1px);
}

.btn-save:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.text-muted {
  color: var(--text-muted);
}

.text-xs {
  font-size: 0.75rem;
}
</style>
