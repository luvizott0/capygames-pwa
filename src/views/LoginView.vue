<template>
  <div class="login-page">
    <div class="login-card fade-in">
      <div class="logo-container">
        <div class="tv-icon-badge">
          <Gamepad2 :size="40" class="tv-icon" />
          <div class="capy-ears"></div>
        </div>
        <h1 class="app-title mono">CapyGames</h1>
        <p class="app-subtitle">O Backlog & Tracker de Jogos da Capihouse</p>
      </div>

      <form @submit.prevent="handleLogin" class="login-form">
        <div v-if="errorMessage" class="error-banner">
          {{ errorMessage }}
        </div>

        <div class="input-group">
          <label for="login" class="input-label">E-mail ou Usuário da Capihouse</label>
          <input
            id="login"
            v-model="loginInput"
            type="text"
            required
            autocomplete="username"
            placeholder="bento ou bento@capihouse.com"
            class="form-input"
          />
        </div>

        <div class="input-group">
          <label for="password" class="input-label">Senha</label>
          <input
            id="password"
            v-model="passwordInput"
            type="password"
            required
            autocomplete="current-password"
            placeholder="••••••••"
            class="form-input"
          />
        </div>

        <button type="submit" :disabled="authStore.isLoading" class="btn-primary submit-btn">
          <span v-if="authStore.isLoading">Entrando...</span>
          <span v-else>Entrar com Capihouse</span>
        </button>

        <p class="login-hint">
          Sua conta é a mesma que você já utiliza no <strong>Capihouse</strong>.
        </p>
      </form>

      <!-- Card de Login Rápido em Ambiente Local / Dev -->
      <div v-if="devUsers.length > 0" class="dev-login-box">
        <div class="dev-header mono">
          ⚡ Teste Local ({{ devUsers.length }} contas)
        </div>
        <p class="dev-desc">
          Selecione um morador para entrar sem digitar senha:
        </p>
        <select v-model="selectedDevUserId" class="form-input dev-select">
          <option v-for="u in devUsers" :key="u.id" :value="u.id">
            {{ u.name }} (@{{ u.username }}) — {{ u.status.toUpperCase() }}
          </option>
        </select>
        <button
          type="button"
          class="btn-secondary dev-submit-btn"
          :disabled="authStore.isLoading || !selectedDevUserId"
          @click="handleDevLogin"
        >
          <span>🎭 Entrar como Selecionado</span>
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { Gamepad2 } from 'lucide-vue-next'
import { useAuthStore } from '@/stores/auth'

const router = useRouter()
const authStore = useAuthStore()

const loginInput = ref('')
const passwordInput = ref('')
const errorMessage = ref('')

const devUsers = ref<any[]>([])
const selectedDevUserId = ref<number | ''>('')

async function handleLogin() {
  errorMessage.value = ''
  const result = await authStore.login(loginInput.value.trim(), passwordInput.value)
  if (result.success) {
    router.push('/')
  } else {
    errorMessage.value = result.message || 'Erro ao realizar login'
  }
}

async function handleDevLogin() {
  if (!selectedDevUserId.value) return
  errorMessage.value = ''
  const result = await authStore.impersonate(Number(selectedDevUserId.value))
  if (result.success) {
    router.push('/')
  } else {
    errorMessage.value = result.message || 'Erro ao entrar com usuário de teste'
  }
}

onMounted(async () => {
  try {
    const res = await authStore.getDevUsers()
    if (res.data?.users) {
      devUsers.value = res.data.users.filter((u: any) => u.status === 'approved')
      if (devUsers.value.length > 0) {
        selectedDevUserId.value = devUsers.value[0].id
      }
    }
  } catch {
    // Ignorar se não estiver em ambiente local
  }
})
</script>

<style scoped>
.login-page {
  min-height: 100vh;
  min-height: 100dvh;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: calc(var(--safe-top) + 20px) 20px calc(var(--safe-bottom) + 20px);
  background: radial-gradient(circle at top, #26211c 0%, #12100e 70%);
}

.login-card {
  width: 100%;
  max-width: 380px;
  background-color: var(--bg-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  padding: 32px 24px;
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.7);
}

.logo-container {
  text-align: center;
  margin-bottom: 28px;
}

.tv-icon-badge {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 72px;
  height: 72px;
  background-color: var(--color-accent);
  color: #12100e;
  border-radius: var(--radius-sm);
  margin-bottom: 16px;
  box-shadow: 0 0 24px rgba(245, 197, 24, 0.35);
}

.app-title {
  font-size: 1.6rem;
  font-weight: 700;
  color: var(--text-main);
  letter-spacing: -0.5px;
}

.app-subtitle {
  color: var(--text-muted);
  font-size: 0.85rem;
  margin-top: 4px;
}

.login-form {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.error-banner {
  background-color: rgba(248, 113, 113, 0.15);
  border: 1px solid var(--color-danger);
  color: var(--color-danger);
  padding: 10px 14px;
  border-radius: var(--radius-sm);
  font-size: 0.85rem;
}

.input-group {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.input-label {
  font-size: 0.8rem;
  font-weight: 500;
  color: var(--text-muted);
}

.form-input {
  background-color: var(--bg-surface-elevated);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-sm);
  padding: 12px 14px;
  color: var(--text-main);
  font-size: 0.95rem;
  outline: none;
  transition: border-color 0.2s;
}

.form-input:focus {
  border-color: var(--color-accent);
}

.submit-btn {
  width: 100%;
  margin-top: 8px;
}

.login-hint {
  text-align: center;
  font-size: 0.75rem;
  color: var(--text-dim);
  margin-top: 8px;
}

.dev-login-box {
  margin-top: 20px;
  padding-top: 18px;
  border-top: 1px dashed var(--color-border);
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.dev-header {
  font-size: 0.8rem;
  font-weight: 700;
  color: var(--color-accent);
  text-transform: uppercase;
}

.dev-desc {
  font-size: 0.78rem;
  color: var(--text-muted);
}

.dev-select {
  font-size: 0.85rem;
  padding: 10px 12px;
}

.dev-submit-btn {
  width: 100%;
  border-color: rgba(245, 197, 24, 0.35);
  color: var(--color-accent);
}
</style>
