<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { Gamepad2, ArrowRight, Lock, User, RefreshCw, Sparkles } from 'lucide-vue-next'

const router = useRouter()
const authStore = useAuthStore()

const loginInput = ref('')
const passwordInput = ref('')
const errorMessage = ref('')
const devUsers = ref<any[]>([])
const isLoadingDev = ref(false)

async function handleLogin() {
  if (!loginInput.value || !passwordInput.value) {
    errorMessage.value = 'Preencha o usuário/e-mail e a senha.'
    return
  }

  errorMessage.value = ''
  const result = await authStore.login(loginInput.value, passwordInput.value)

  if (result.success) {
    router.push('/')
  } else {
    errorMessage.value = result.message || 'Credenciais inválidas.'
  }
}

async function handleDevLogin(userId: number) {
  errorMessage.value = ''
  const result = await authStore.impersonate(userId)

  if (result.success) {
    router.push('/')
  } else {
    errorMessage.value = result.message || 'Erro ao conectar como usuário.'
  }
}

onMounted(async () => {
  try {
    isLoadingDev.value = true
    const res = await authStore.getDevUsers()
    devUsers.value = res.data
  } catch {
    // ignore se em prod
  } finally {
    isLoadingDev.value = false
  }
})
</script>

<template>
  <div class="login-view">
    <div class="login-card fade-in">
      <div class="logo-box">
        <div class="capy-badge">
          <Gamepad2 :size="36" class="capy-icon" />
        </div>
        <h1 class="brand-title">CapyGames</h1>
        <p class="brand-tagline">Biblioteca & Games da Capihouse</p>
      </div>

      <div v-if="errorMessage" class="error-banner">
        {{ errorMessage }}
      </div>

      <form class="login-form" @submit.prevent="handleLogin">
        <div class="form-group">
          <label class="form-label">Usuário ou E-mail</label>
          <div class="input-wrapper">
            <User :size="18" class="input-icon" />
            <input
              v-model="loginInput"
              type="text"
              class="form-input"
              placeholder="seu_usuario"
              autocomplete="username"
              required
            />
          </div>
        </div>

        <div class="form-group">
          <label class="form-label">Senha</label>
          <div class="input-wrapper">
            <Lock :size="18" class="input-icon" />
            <input
              v-model="passwordInput"
              type="password"
              class="form-input"
              placeholder="••••••••"
              autocomplete="current-password"
              required
            />
          </div>
        </div>

        <button
          type="submit"
          class="btn-submit-login"
          :disabled="authStore.isLoading"
        >
          <RefreshCw v-if="authStore.isLoading" :size="18" class="spin" />
          <template v-else>
            <span>Entrar no CapyGames</span>
            <ArrowRight :size="18" />
          </template>
        </button>
      </form>

      <!-- Moradores / Dev Users para troca rápida -->
      <div v-if="devUsers.length > 0" class="dev-section">
        <div class="dev-divider">
          <span>Moradores da Casa (1 clique)</span>
        </div>

        <div class="dev-users-grid">
          <button
            v-for="u in devUsers"
            :key="u.id"
            type="button"
            class="dev-user-btn"
            :disabled="authStore.isLoading"
            @click="handleDevLogin(u.id)"
          >
            <img
              :src="u.avatar_url || 'https://api.dicebear.com/7.x/bottts/svg?seed=' + u.username"
              class="dev-avatar"
            />
            <span class="dev-name">{{ u.name }}</span>
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.login-view {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px;
  background: radial-gradient(circle at 50% 20%, rgba(124, 58, 237, 0.15) 0%, var(--bg-app) 70%);
}

.login-card {
  width: 100%;
  max-width: 420px;
  background: var(--bg-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg);
  padding: 32px 24px;
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.6), 0 0 40px rgba(124, 58, 237, 0.15);
}

.logo-box {
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  margin-bottom: 24px;
}

.capy-badge {
  width: 72px;
  height: 72px;
  border-radius: 50%;
  background: rgba(124, 58, 237, 0.15);
  border: 2px solid var(--color-accent);
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 12px;
  box-shadow: 0 0 24px rgba(124, 58, 237, 0.4);
}

.capy-icon {
  color: #c084fc;
}

.brand-title {
  font-size: 1.6rem;
  font-weight: 800;
  letter-spacing: -0.02em;
  background: linear-gradient(135deg, #f5f3ff 0%, #c084fc 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
}

.brand-tagline {
  font-size: 0.85rem;
  color: var(--text-muted);
  margin-top: 2px;
}

.error-banner {
  background: rgba(239, 68, 68, 0.15);
  border: 1px solid var(--color-danger);
  color: var(--color-danger);
  padding: 10px 14px;
  border-radius: var(--radius-sm);
  font-size: 0.85rem;
  margin-bottom: 16px;
  text-align: center;
}

.login-form {
  display: flex;
  flex-direction: column;
  gap: 16px;
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
  text-transform: uppercase;
  letter-spacing: 0.03em;
}

.input-wrapper {
  position: relative;
  display: flex;
  align-items: center;
}

.input-icon {
  position: absolute;
  left: 14px;
  color: var(--text-dim);
}

.form-input {
  width: 100%;
  background: var(--bg-surface-elevated);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  padding: 12px 14px 12px 42px;
  color: var(--text-main);
  font-size: 0.95rem;
  outline: none;
  transition: border-color 0.2s ease;
}

.form-input:focus {
  border-color: var(--color-accent);
}

.btn-submit-login {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  background: var(--color-primary);
  color: #fff;
  padding: 12px 20px;
  border-radius: var(--radius-md);
  font-size: 0.95rem;
  font-weight: 700;
  margin-top: 8px;
  box-shadow: 0 4px 16px rgba(124, 58, 237, 0.4);
  transition: all 0.2s ease;
}

.btn-submit-login:hover:not(:disabled) {
  background: var(--color-primary-light);
  transform: translateY(-1px);
}

.btn-submit-login:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.dev-section {
  margin-top: 24px;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.dev-divider {
  display: flex;
  align-items: center;
  text-align: center;
  font-size: 0.75rem;
  color: var(--text-dim);
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.dev-divider::before,
.dev-divider::after {
  content: '';
  flex: 1;
  border-bottom: 1px solid var(--color-border);
}

.dev-divider span {
  padding: 0 10px;
}

.dev-users-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 8px;
}

.dev-user-btn {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 10px;
  background: var(--bg-surface-elevated);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-sm);
  color: var(--text-main);
  font-size: 0.82rem;
  font-weight: 600;
  transition: all 0.2s ease;
  overflow: hidden;
}

.dev-user-btn:hover {
  background: var(--bg-surface-hover);
  border-color: var(--color-accent);
}

.dev-avatar {
  width: 24px;
  height: 24px;
  border-radius: 50%;
  object-fit: cover;
}

.dev-name {
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.spin {
  animation: spin 1s linear infinite;
}

@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}
</style>
