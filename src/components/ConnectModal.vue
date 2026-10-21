<script setup lang="ts">
import { ref } from 'vue'
import { capyGamesApi } from '@/api/capygames'
import { useAuthStore } from '@/stores/auth'
import { X, Check, RefreshCw } from 'lucide-vue-next'

const props = defineProps<{
  isOpen: boolean
  provider: 'steam' | 'xbox'
}>()

const emit = defineEmits<{
  (e: 'close'): void
  (e: 'connected'): void
}>()

const authStore = useAuthStore()

const inputVal = ref('')
const isSubmitting = ref(false)
const errorMsg = ref('')
const successMsg = ref('')

async function handleSubmit() {
  if (!inputVal.value.trim()) return

  isSubmitting.value = true
  errorMsg.value = ''
  successMsg.value = ''

  try {
    if (props.provider === 'steam') {
      const res = await capyGamesApi.connectSteam(inputVal.value.trim())
      successMsg.value = res.data.message
    } else {
      const res = await capyGamesApi.connectXbox(inputVal.value.trim())
      successMsg.value = res.data.message
    }

    await authStore.checkAuth()
    emit('connected')
    setTimeout(() => {
      emit('close')
    }, 1200)
  } catch (err: any) {
    errorMsg.value = err.response?.data?.message || 'Erro ao conectar conta.'
  } finally {
    isSubmitting.value = false
  }
}
</script>

<template>
  <div v-if="isOpen" class="modal-backdrop" @click.self="emit('close')">
    <div class="modal-container fade-in">
      <div class="modal-header">
        <div class="header-title">
          <span class="provider-badge" :class="provider">
            {{ provider === 'steam' ? 'Steam' : 'Xbox Live' }}
          </span>
          <h3>Conectar Conta</h3>
        </div>
        <button class="close-btn" @click="emit('close')">
          <X :size="20" />
        </button>
      </div>

      <div class="modal-body">
        <div v-if="errorMsg" class="alert alert-error">
          {{ errorMsg }}
        </div>
        <div v-if="successMsg" class="alert alert-success">
          {{ successMsg }}
        </div>

        <p class="description">
          <template v-if="provider === 'steam'">
            Informe seu <strong>Steam ID (17 dígitos)</strong>, seu <strong>apelido personalizado</strong> ou o link do seu perfil público (ex: <code>steamcommunity.com/id/seu-nome</code>).
          </template>
          <template v-else>
            Informe a sua <strong>Gamertag do Xbox Live</strong>. Seus jogos, Gamerscore e conquistas serão sincronizados automaticamente com o CapyGames.
          </template>
        </p>

        <div class="form-group">
          <label class="form-label">
            {{ provider === 'steam' ? 'Steam ID / URL ou Usuário' : 'Gamertag do Xbox' }}
          </label>
          <input
            v-model="inputVal"
            type="text"
            class="form-input"
            :placeholder="provider === 'steam' ? 'ex: alvim ou 76561198...' : 'ex: MasterChief117'"
            @keyup.enter="handleSubmit"
          />
        </div>
      </div>

      <div class="modal-footer">
        <button type="button" class="btn-cancel" @click="emit('close')">Cancelar</button>
        <button
          type="button"
          class="btn-submit"
          :class="provider"
          :disabled="isSubmitting || !inputVal.trim()"
          @click="handleSubmit"
        >
          <RefreshCw v-if="isSubmitting" :size="16" class="spin" />
          <Check v-else :size="16" />
          <span>{{ isSubmitting ? 'Conectando...' : 'Conectar' }}</span>
        </button>
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
  max-width: 440px;
  overflow: hidden;
  box-shadow: 0 16px 40px rgba(0, 0, 0, 0.6);
}

.modal-header {
  padding: 16px 20px;
  background: var(--bg-surface-elevated);
  border-bottom: 1px solid var(--color-border);
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.header-title {
  display: flex;
  align-items: center;
  gap: 10px;
}

.header-title h3 {
  font-size: 1.05rem;
  font-weight: 700;
  color: var(--text-main);
}

.provider-badge {
  font-size: 0.72rem;
  font-weight: 700;
  padding: 3px 10px;
  border-radius: var(--radius-full);
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.provider-badge.steam {
  background: rgba(59, 130, 246, 0.2);
  color: #60a5fa;
  border: 1px solid rgba(59, 130, 246, 0.4);
}

.provider-badge.xbox {
  background: rgba(34, 197, 94, 0.2);
  color: #4ade80;
  border: 1px solid rgba(34, 197, 94, 0.4);
}

.close-btn {
  color: var(--text-muted);
  padding: 6px;
  border-radius: var(--radius-full);
  display: flex;
  align-items: center;
  justify-content: center;
}

.modal-body {
  padding: 20px;
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.description {
  font-size: 0.85rem;
  color: var(--text-muted);
  line-height: 1.5;
}

.description code {
  background: var(--bg-surface-elevated);
  padding: 2px 6px;
  border-radius: 6px;
  color: var(--color-accent);
  font-size: 0.8rem;
}

.alert {
  padding: 10px 14px;
  border-radius: var(--radius-md);
  font-size: 0.85rem;
}

.alert-error {
  background: rgba(239, 68, 68, 0.15);
  border: 1px solid var(--color-danger);
  color: var(--color-danger);
}

.alert-success {
  background: rgba(34, 197, 94, 0.15);
  border: 1px solid var(--color-success);
  color: var(--color-success);
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.form-label {
  font-size: 0.82rem;
  font-weight: 600;
  color: var(--text-muted);
}

.form-input {
  background: var(--bg-surface-elevated);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-full);
  padding: 11px 16px;
  color: var(--text-main);
  font-size: 0.9rem;
  outline: none;
}

.form-input:focus {
  border-color: var(--color-accent);
}

.modal-footer {
  padding: 14px 20px;
  background: var(--bg-surface-elevated);
  border-top: 1px solid var(--color-border);
  display: flex;
  justify-content: flex-end;
  gap: 10px;
}

.btn-cancel {
  padding: 9px 18px;
  color: var(--text-muted);
  font-size: 0.88rem;
  font-weight: 600;
  border-radius: var(--radius-full);
  background: var(--bg-surface);
  border: 1px solid var(--color-border);
}

.btn-submit {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 9px 20px;
  color: #fff;
  font-size: 0.88rem;
  font-weight: 600;
  border-radius: var(--radius-full);
  transition: opacity 0.2s ease;
}

.btn-submit.steam {
  background: #2563eb;
}

.btn-submit.xbox {
  background: #16a34a;
}

.btn-submit:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.spin {
  animation: spin 1s linear infinite;
}

@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}
</style>
