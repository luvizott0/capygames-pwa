<template>
  <div v-if="isOpen" class="image-viewer-modal-overlay" @click.self="closeModal">
    <div class="image-viewer-modal-content">
      <button class="close-btn" @click="closeModal">
        <X :size="24" />
      </button>
      <img :src="imageUrl" alt="Visualização da Imagem" class="viewer-image" />
    </div>
  </div>
</template>

<script setup lang="ts">
import { X } from 'lucide-vue-next'

defineProps<{
  isOpen: boolean
  imageUrl: string
}>()

const emit = defineEmits(['close'])

function closeModal() {
  emit('close')
}
</script>

<style scoped>
.image-viewer-modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: rgba(0, 0, 0, 0.9);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  backdrop-filter: blur(5px);
}

.image-viewer-modal-content {
  position: relative;
  max-width: 90%;
  max-height: 90%;
  display: flex;
  align-items: center;
  justify-content: center;
}

.viewer-image {
  max-width: 100%;
  max-height: 100%;
  object-fit: contain;
  border-radius: var(--radius-md);
  box-shadow: 0 5px 15px rgba(0, 0, 0, 0.5);
}

.close-btn {
  position: absolute;
  top: -40px;
  right: -40px;
  background-color: rgba(255, 255, 255, 0.2);
  border: none;
  border-radius: var(--radius-full);
  width: 40px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  cursor: pointer;
  transition: background-color 0.2s;
  z-index: 1001;
}

.close-btn:hover {
  background-color: rgba(255, 255, 255, 0.3);
}

@media (max-width: 768px) {
  .close-btn {
    top: 10px;
    right: 10px;
    background-color: rgba(0, 0, 0, 0.6);
  }
}
</style>
