<template>
  <span class="platform-icon-wrapper" :title="platformName">
    <!-- Steam / PC -->
    <svg
      v-if="iconType === 'steam'"
      :width="size"
      :height="size"
      viewBox="0 0 24 24"
      fill="currentColor"
      class="plat-icon steam"
    >
      <path d="M11.979 0C5.678 0 .511 4.86.022 11.037l6.432 2.658c.545-.371 1.203-.59 1.912-.59.063 0 .125.004.188.006l2.861-4.142V8.91c0-2.495 2.028-4.524 4.524-4.524 2.494 0 4.524 2.031 4.524 4.527s-2.03 4.525-4.524 4.525h-.105l-4.076 2.911c0 .052.004.105.004.159 0 1.875-1.515 3.396-3.39 3.396-1.635 0-3.016-1.173-3.331-2.727L.31 16.51C2.08 20.73 6.279 24 11.979 24c6.627 0 12-5.373 12-12s-5.373-12-12-12zm3.329 17.519c1.407 0 2.548-1.141 2.548-2.548s-1.141-2.548-2.548-2.548-2.548 1.141-2.548 2.548 1.141 2.548 2.548 2.548z" />
    </svg>

    <!-- PlayStation (Official Monogram) -->
    <svg
      v-else-if="iconType === 'playstation'"
      :width="size"
      :height="size"
      viewBox="0 0 576 512"
      fill="currentColor"
      class="plat-icon playstation"
    >
      <path d="M570.9 372.3c-11.3 14.2-38.8 24.3-38.8 24.3L327 470.2v-54.3l150.9-53.8c17.1-6.1 19.8-14.8 5.8-19.4c-13.9-4.6-39.1-3.3-56.2 2.9L327 381.1v-56.4c23.2-7.8 47.1-13.6 75.7-16.8c40.9-4.5 90.9.6 130.2 15.5c44.2 14 49.2 34.7 38 48.9m-224.4-92.5v-139c0-16.3-3-31.3-18.3-35.6c-11.7-3.8-19 7.1-19 23.4v347.9l-93.8-29.8V32c39.9 7.4 98 24.9 129.2 35.4C424.1 94.7 451 128.7 451 205.2c0 74.5-46 102.8-104.5 74.6M43.2 410.2c-45.4-12.8-53-39.5-32.3-54.8c19.1-14.2 51.7-24.9 51.7-24.9l134.5-47.8v54.5l-96.8 34.6c-17.1 6.1-19.7 14.8-5.8 19.4s39.1 3.3 56.2-2.9l46.4-16.9v48.8c-51.6 9.3-101.4 7.3-153.9-10" />
    </svg>

    <!-- Xbox (Official Simple Icons with full spherical badge) -->
    <svg
      v-else-if="iconType === 'xbox'"
      :width="size"
      :height="size"
      viewBox="0 0 24 24"
      fill="currentColor"
      class="plat-icon xbox"
    >
      <path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12C24.002 5.375 18.632.002 12.007 0H12zm7.327 18.065s-.581-2.627-1.528-4.197c-.514-.857-1.308-1.553-2.368-1.532-.745 0-1.399.423-2.2 1.553-.469.77-.882 1.573-1.235 2.403 0 0-.29-.675-.63-1.343a8.038 8.038 0 0 0-.605-1.07c-.773-1.127-1.47-1.48-2.215-1.48-.999 0-1.854.722-2.368 1.532-.947 1.57-1.528 4.197-1.528 4.197a10.024 10.024 0 0 1-2.261-3.238c-1.01-2.073-1.248-3.957-.96-4.935.34-1.16 1.488-2.34 2.898-3.267.755-.494.818-.507 1.737-.312 1.117.234 2.311.751 4.148 1.808l1.077.622.587-.643c1.611-1.765 2.998-2.651 4.11-2.923.864-.212 1.538-.076 2.059.412.986.92 1.597 2.395 1.815 4.382.222 2.02-.27 4.108-2.261 6.168a10.027 10.027 0 0 1-2.26 3.238zm-7.32-11.733c-1.258-.638-3.197-1.321-4.272-1.503-.139-.023-.191-.01-.137.067.433.61 2.219 3.275 3.253 4.79.13.19.263.376.398.558.125-.175.253-.356.381-.54 1.034-1.515 2.82-4.18 3.253-4.79.054-.077.002-.09-.137-.067-1.075.182-3.014.865-4.272 1.503z" />
    </svg>

    <!-- Nintendo (Official Switch Silhouette) -->
    <svg
      v-else-if="iconType === 'nintendo'"
      :width="size"
      :height="size"
      viewBox="0 0 24 24"
      fill="currentColor"
      class="plat-icon nintendo"
    >
      <path d="M10.04 20.4H7.12c-.93 0-1.82-.4-2.48-1.04C4 18.7 3.6 17.81 3.6 16.88V7.12c0-.93.4-1.82 1.04-2.48C5.3 4 6.19 3.62 7.12 3.62h2.92zM7.12 2A5.12 5.12 0 0 0 2 7.12v9.76C2 19.71 4.29 22 7.12 22h4.53V2zM5.11 8c0 1.04.84 1.88 1.89 1.88c1.03 0 1.87-.84 1.87-1.88S8.03 6.12 7 6.12c-1.05 0-1.89.84-1.89 1.88m12.5 3c1.11 0 2.01.89 2.01 2c0 1.12-.9 2-2.01 2s-2.03-.88-2.03-2c0-1.11.92-2 2.03-2m-.73 11A5.12 5.12 0 0 0 22 16.88V7.12C22 4.29 19.71 2 16.88 2h-3.23v20z" />
    </svg>

    <!-- Retro (Arcade / 8-bit / Classic Gamepad) -->
    <svg
      v-else-if="iconType === 'retro'"
      :width="size"
      :height="size"
      viewBox="0 0 24 24"
      fill="none"
      class="plat-icon retro"
    >
      <rect x="2" y="5" width="20" height="14" rx="3" fill="#221538" stroke="#c084fc" stroke-width="1.8" />
      <path d="M6 12h4M8 10v4" stroke="#ffffff" stroke-width="1.8" stroke-linecap="round" />
      <circle cx="15.5" cy="13.5" r="1.3" fill="#ef4444" />
      <circle cx="18" cy="10.5" r="1.3" fill="#fbbf24" />
      <rect x="10.5" y="14" width="3" height="1.2" rx="0.5" fill="#c084fc" />
    </svg>

    <!-- Padrão (Gamepad) -->
    <Gamepad2 v-else :size="size" class="plat-icon default" />
  </span>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { Gamepad2 } from 'lucide-vue-next'

const props = withDefaults(
  defineProps<{
    platform?: string
    size?: number
    colored?: boolean
  }>(),
  {
    platform: '',
    size: 16,
    colored: true
  }
)

const platformName = computed(() => props.platform || 'Multiplataforma')

const iconType = computed(() => {
  const p = (props.platform || '').toLowerCase()

  if (/steam|pc|windows|computer|computador|epic|gog|battlenet/i.test(p)) {
    return 'steam'
  }
  if (/playstation|ps5|ps4|ps3|ps2|ps1|psp|vita|sony/i.test(p)) {
    return 'playstation'
  }
  if (/xbox|series|xbl|microsoft/i.test(p)) {
    return 'xbox'
  }
  if (/nintendo|switch|wii|ds|3ds|gamecube|n64/i.test(p)) {
    return 'nintendo'
  }
  if (/retro|snes|nes|super nintendo|mega drive|genesis|game boy|gba|arcade|mame|atari|master system|sega|neogeo/i.test(p)) {
    return 'retro'
  }
  return 'default'
})
</script>

<style scoped>
.platform-icon-wrapper {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  line-height: 1;
  vertical-align: middle;
}

.plat-icon {
  display: inline-block;
  vertical-align: middle;
  filter: drop-shadow(0 1px 2px rgba(0, 0, 0, 0.4));
  transition: transform 0.2s ease, filter 0.2s ease;
}

.plat-icon:hover {
  transform: scale(1.1);
}

/* Cores Oficiais de Cada Marca */
.plat-icon.steam {
  color: #66c0f4;
  fill: #66c0f4;
}

.plat-icon.playstation {
  color: #0070d1;
  fill: #0070d1;
}

.plat-icon.xbox {
  color: #107c10;
  fill: #107c10;
}

.plat-icon.nintendo {
  color: #e60012;
  fill: #e60012;
}

.plat-icon.retro {
  color: #c084fc;
}

.plat-icon.default {
  color: var(--color-accent);
}
</style>
