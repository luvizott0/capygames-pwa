<script setup lang="ts">
import { ref, watch, computed } from 'vue'
import {
  capyGamesApi,
  type CapyUserGame,
  type GameStatus,
  type GameSearchResult,
  type GameAspectRatings
} from '@/api/capygames'
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

export interface ReviewAspectConfig {
  key: keyof GameAspectRatings
  label: string
  icon: string
  description: string
}

const REVIEW_ASPECTS: ReviewAspectConfig[] = [
  { key: 'gameplay', label: 'Jogabilidade', icon: '🎮', description: 'Controles, fluidez e mecânicas' },
  { key: 'story', label: 'Narrativa', icon: '📖', description: 'História, roteiro e personagens' },
  { key: 'graphics', label: 'Gráficos', icon: '🎨', description: 'Fidelidade visual, arte e estética' },
  { key: 'sound', label: 'Trilha Sonora', icon: '🎵', description: 'Música, dublagem e áudio' },
  { key: 'performance', label: 'Desempenho', icon: '⚡', description: 'FPS estável, bugs e polimento' },
  { key: 'replay', label: 'Fator Replay', icon: '🔁', description: 'Conteúdo, longevidade e endgame' },
  { key: 'level_design', label: 'Level Design', icon: '🗺️', description: 'Design de fases, mapas e exploração' },
  { key: 'innovation', label: 'Inovação', icon: '💡', description: 'Originalidade e criatividade' }
]

const status = ref<GameStatus>('playing')
const platform = ref('Steam')
const hoursPlayed = ref<number>(0)
const rating = ref<number | null>(null)
const review = ref('')
const isFavorite = ref(false)
const isSubmitting = ref(false)
const errorMsg = ref('')

const aspectRatings = ref<GameAspectRatings>({
  gameplay: null,
  story: null,
  graphics: null,
  sound: null,
  performance: null,
  replay: null,
  level_design: null,
  innovation: null
})

const calculatedAverage = computed<number | null>(() => {
  const scores: number[] = []
  for (const item of REVIEW_ASPECTS) {
    const val = aspectRatings.value[item.key]
    if (val !== null && val !== undefined && !isNaN(Number(val))) {
      scores.push(Number(val))
    }
  }
  if (scores.length === 0) {
    return rating.value ?? null
  }
  const sum = scores.reduce((acc, curr) => acc + curr, 0)
  return Number((sum / scores.length).toFixed(1))
})

const ratedAspectsCount = computed(() => {
  return REVIEW_ASPECTS.filter(a => {
    const val = aspectRatings.value[a.key]
    return val !== null && val !== undefined && !isNaN(Number(val))
  }).length
})

function normalizePlatformName(name?: string | null): string {
  if (!name) return 'Steam'
  const p = name.trim()
  if (/^(pc|windows|win32|pc\s*\((steam|windows)\))$/i.test(p)) {
    return 'Steam'
  }
  return p
}

const platformsList = [
  'Steam',
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
  { value: 'completed', label: 'Zerado', icon: '🏁' },
  { value: 'dropped', label: 'Abandonado', icon: '🛑' }
]

watch(
  () => [props.isOpen, props.userGame, props.gameCandidate],
  () => {
    if (props.isOpen) {
      errorMsg.value = ''
      if (props.userGame) {
        // Se for mastered, mantém; se for on_hold ou plan_to_play, converte para playing ao editar
        if (props.userGame.status === 'on_hold' || props.userGame.status === 'plan_to_play') {
          status.value = 'playing'
        } else {
          status.value = props.userGame.status
        }
        platform.value = normalizePlatformName(props.userGame.platform)
        hoursPlayed.value = props.userGame.hours_played || 0
        rating.value = props.userGame.rating ?? null

        const ar = props.userGame.aspect_ratings || {}
        aspectRatings.value = {
          gameplay: ar.gameplay ?? null,
          story: ar.story ?? null,
          graphics: ar.graphics ?? null,
          sound: ar.sound ?? null,
          performance: ar.performance ?? null,
          replay: ar.replay ?? null,
          level_design: ar.level_design ?? null,
          innovation: ar.innovation ?? null
        }

        review.value = props.userGame.review || ''
        isFavorite.value = props.userGame.is_favorite || false
      } else if (props.gameCandidate) {
        status.value = 'playing'
        platform.value = normalizePlatformName(props.gameCandidate.platforms?.[0])
        hoursPlayed.value = 0
        rating.value = null
        aspectRatings.value = {
          gameplay: null,
          story: null,
          graphics: null,
          sound: null,
          performance: null,
          replay: null,
          level_design: null,
          innovation: null
        }
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
      rating: calculatedAverage.value !== null ? Number(calculatedAverage.value) : null,
      aspect_ratings: aspectRatings.value,
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

function setAspectScore(key: keyof GameAspectRatings, score: number) {
  if (aspectRatings.value[key] === score) {
    aspectRatings.value[key] = null
  } else {
    aspectRatings.value[key] = score
  }
}

function clearAspectScore(key: keyof GameAspectRatings) {
  aspectRatings.value[key] = null
}
</script>

<template>
  <Teleport to="body">
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

        <!-- Avaliação por Aspectos (Nota Média de 1 a 10) -->
        <div class="form-group review-aspects-group">
          <div class="review-aspects-header">
            <div>
              <label class="form-label mb-0">Avaliação por Aspectos</label>
              <p class="form-hint-text">Avalie de 1 a 10 cada aspecto. A nota final é calculada automaticamente pela média.</p>
            </div>
            <!-- Placar da Média Final -->
            <div class="final-score-card mono" :class="{ 'has-score': calculatedAverage !== null }">
              <Star :size="16" fill="currentColor" class="star-icon" />
              <div class="final-score-info">
                <span class="final-score-val">
                  {{ calculatedAverage !== null ? calculatedAverage.toFixed(1) : '--' }}
                  <span class="final-score-max">/10</span>
                </span>
                <span class="final-score-count">
                  {{ ratedAspectsCount > 0 ? `${ratedAspectsCount} ${ratedAspectsCount === 1 ? 'aspecto' : 'aspectos'}` : 'Sem nota' }}
                </span>
              </div>
            </div>
          </div>

          <!-- Grade de Aspectos -->
          <div class="aspects-list">
            <div
              v-for="aspect in REVIEW_ASPECTS"
              :key="aspect.key"
              class="aspect-card"
              :class="{ 'aspect-rated': aspectRatings[aspect.key] !== null }"
            >
              <div class="aspect-header">
                <div class="aspect-info">
                  <span class="aspect-icon">{{ aspect.icon }}</span>
                  <span class="aspect-label">{{ aspect.label }}</span>
                  <span class="aspect-desc">{{ aspect.description }}</span>
                </div>
                <div class="aspect-score-badge">
                  <span v-if="aspectRatings[aspect.key] !== null" class="score-pill mono">
                    {{ aspectRatings[aspect.key] }}/10
                  </span>
                  <span v-else class="score-pill-na">
                    N/A
                  </span>
                  <button
                    v-if="aspectRatings[aspect.key] !== null"
                    type="button"
                    class="btn-clear-aspect"
                    title="Remover nota deste aspecto"
                    @click="clearAspectScore(aspect.key)"
                  >
                    <X :size="12" />
                  </button>
                </div>
              </div>

              <!-- Seletor de Notas de 1 a 10 -->
              <div class="ratings-bar compact-bar">
                <button
                  v-for="val in 10"
                  :key="val"
                  type="button"
                  class="rating-box mono"
                  :class="{
                    selected: aspectRatings[aspect.key] !== null && (aspectRatings[aspect.key] as number) >= val,
                    exact: aspectRatings[aspect.key] === val
                  }"
                  @click="setAspectScore(aspect.key, val)"
                >
                  {{ val }}
                </button>
              </div>
            </div>
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
</Teleport>
</template>

<style scoped>
.modal-backdrop {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  width: 100vw;
  height: 100vh;
  background: rgba(15, 13, 21, 0.85);
  backdrop-filter: blur(8px);
  -webkit-backdrop-filter: blur(8px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 99999;
  padding: 16px;
  box-sizing: border-box;
}

.modal-container {
  background: var(--bg-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  width: 100%;
  max-width: 520px;
  max-height: 85vh;
  margin: auto;
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

.review-aspects-group {
  margin-top: 6px;
}

.review-aspects-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 12px;
  padding: 10px 14px;
  background: var(--bg-surface-elevated);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
}

.form-hint-text {
  font-size: 0.76rem;
  color: var(--text-muted);
  margin-top: 3px;
  margin-bottom: 0;
}

.final-score-card {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 6px 12px;
  background: var(--bg-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-sm);
  color: var(--text-muted);
  flex-shrink: 0;
}

.final-score-card.has-score {
  border-color: rgba(245, 197, 24, 0.5);
  background: rgba(245, 197, 24, 0.08);
  color: #fbbf24;
}

.final-score-card.has-score .star-icon {
  color: #fbbf24;
  fill: #fbbf24;
}

.final-score-info {
  display: flex;
  flex-direction: column;
}

.final-score-val {
  font-size: 1.05rem;
  font-weight: 800;
  line-height: 1.1;
  color: var(--text-main);
}

.final-score-card.has-score .final-score-val {
  color: #fbbf24;
}

.final-score-max {
  font-size: 0.72rem;
  font-weight: 500;
  color: var(--text-muted);
}

.final-score-count {
  font-size: 0.68rem;
  color: var(--text-muted);
}

.aspects-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.aspect-card {
  padding: 10px 12px;
  background: var(--bg-surface-elevated);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-sm);
  transition: all 0.2s ease;
}

.aspect-card:hover {
  border-color: rgba(245, 197, 24, 0.3);
}

.aspect-card.aspect-rated {
  border-color: rgba(245, 197, 24, 0.4);
  background: rgba(245, 197, 24, 0.03);
}

.aspect-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 8px;
  gap: 8px;
}

.aspect-info {
  display: flex;
  align-items: center;
  gap: 6px;
  flex-wrap: wrap;
}

.aspect-icon {
  font-size: 0.95rem;
}

.aspect-label {
  font-size: 0.82rem;
  font-weight: 700;
  color: var(--text-main);
}

.aspect-desc {
  font-size: 0.72rem;
  color: var(--text-muted);
  display: none;
}

@media (min-width: 500px) {
  .aspect-desc {
    display: inline;
  }
}

.aspect-score-badge {
  display: flex;
  align-items: center;
  gap: 6px;
  flex-shrink: 0;
}

.score-pill {
  font-size: 0.76rem;
  font-weight: 700;
  color: #fbbf24;
  background: rgba(245, 197, 24, 0.15);
  padding: 2px 7px;
  border-radius: var(--radius-full);
}

.score-pill-na {
  font-size: 0.72rem;
  color: var(--text-muted);
  background: var(--bg-surface);
  padding: 2px 6px;
  border-radius: var(--radius-full);
  border: 1px dashed var(--color-border);
}

.btn-clear-aspect {
  width: 20px;
  height: 20px;
  border-radius: var(--radius-full);
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--bg-surface);
  border: 1px solid var(--color-border);
  color: var(--text-muted);
  transition: all 0.15s;
}

.btn-clear-aspect:hover {
  color: var(--color-danger);
  border-color: var(--color-danger);
}

.compact-bar .rating-box {
  padding: 7px 0;
  font-size: 0.78rem;
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