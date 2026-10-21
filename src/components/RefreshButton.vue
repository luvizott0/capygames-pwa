<template>
  <button
    class="refresh-btn"
    :class="{ spinning: isRefreshing }"
    :disabled="isRefreshing"
    @click="$emit('refresh')"
    title="Recarregar dados"
  >
    <RotateCw :size="18" />
  </button>
</template>

<script setup lang="ts">
import { RotateCw } from 'lucide-vue-next'

defineProps<{
  isRefreshing: boolean
}>()

defineEmits<{
  (e: 'refresh'): void
}>()
</script>

<style scoped>
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
  cursor: pointer;
}

.refresh-btn:hover {
  color: var(--color-accent);
  border-color: var(--color-accent);
}

.refresh-btn.spinning svg {
  animation: spin 0.8s linear infinite;
  color: var(--color-accent);
}

@keyframes spin {
  to { transform: rotate(360deg); }
}
</style>
