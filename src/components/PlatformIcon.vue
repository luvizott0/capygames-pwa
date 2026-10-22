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
      <path d="M11.979 0C5.678 0 .511 4.86.022 11.037l6.432 2.658c.545-.371 1.203-.59 1.912-.59.063 0 .125.004.188.006l2.861-4.142V8.91c0-2.495 2.028-4.524 4.524-4.524 2.494 0 4.524 2.031 4.524 4.527s-2.03 4.525-4.524 4.525h-.105l-4.076 2.911c0 .052.005.105.005.159 0 1.875-1.515 3.396-3.39 3.396-1.635 0-3.016-1.173-3.331-2.727L.436 15.27C1.862 20.307 6.486 24 11.979 24c6.627 0 12-5.373 12-12S18.605 0 11.979 0zM7.54 18.216c-.431-.178-.797-.487-1.047-.887L4.76 16.61c.489 1.151 1.579 1.968 2.868 2.062l-.088-.456zm8.402-11.458c-1.189 0-2.155.966-2.155 2.155 0 1.189.966 2.155 2.155 2.155 1.189 0 2.155-.966 2.155-2.155 0-1.189-.966-2.155-2.155-2.155zm-7.575 10.35a1.884 1.884 0 1 0 0-3.768 1.884 1.884 0 0 0 0 3.768z" />
    </svg>

    <!-- PlayStation -->
    <svg
      v-else-if="iconType === 'playstation'"
      :width="size"
      :height="size"
      viewBox="0 0 24 24"
      fill="currentColor"
      class="plat-icon playstation"
    >
      <path d="M8.948 13.364c-.453.25-.97.453-1.547.608-.577.156-1.134.234-1.671.234-.734 0-1.343-.156-1.827-.468-.484-.312-.726-.78-.726-1.405 0-.5.172-.945.515-1.335.344-.39.813-.726 1.406-1.007.593-.281 1.258-.507 1.991-.679.734-.171 1.477-.28 2.227-.327v1.898c-.468.031-.952.093-1.452.187-.5.093-.952.226-1.359.398-.218.093-.374.203-.468.328-.094.125-.141.265-.141.421 0 .234.11.414.328.539.219.125.563.187 1.031.187.39 0 .805-.054 1.242-.164.437-.109.898-.273 1.382-.492v1.678h.07zM24 16.539c-.578.438-1.297.742-2.156.914-.859.172-1.781.258-2.765.258-1.453 0-2.671-.234-3.655-.703-.984-.469-1.68-1.156-2.086-2.062l-.375-1.078v-4.148l3.187 1.148v2.602c0 .406.18.734.539.984.359.25.867.375 1.523.375.469 0 .969-.062 1.5-.187.531-.125 1.055-.312 1.57-.562v1.547c-.437.266-.883.477-1.336.633l1.898.812c.703-.312 1.36-.695 1.969-1.148L24 16.539zM12.796 3.141v9.234l-3.359-1.195V2l3.359 1.141zM2.812 16.148c.844.312 1.836.5 2.977.562.406.016.828.023 1.265.023.672 0 1.328-.047 1.969-.141v1.64c-.75.094-1.508.141-2.273.141-.547 0-1.078-.016-1.594-.047-1.422-.094-2.656-.375-3.703-.844l1.359-1.334z" />
    </svg>

    <!-- Xbox -->
    <svg
      v-else-if="iconType === 'xbox'"
      :width="size"
      :height="size"
      viewBox="0 0 24 24"
      fill="currentColor"
      class="plat-icon xbox"
    >
      <path d="M12 0C5.373 0 0 5.373 0 12c0 6.627 5.373 12 12 12s12-5.373 12-12C24 5.373 18.627 0 12 0zm-1.077 3.518c.365-.027.728-.037 1.077-.037.352 0 .713.01 1.08.037.942.068 2.052.28 3.255.673-.61 1.036-1.554 2.441-2.613 3.96-1.096 1.574-2.185 3.003-3.14 4.148-.954-1.145-2.043-2.574-3.14-4.148-1.06-1.52-2.003-2.924-2.613-3.96 1.203-.393 2.313-.605 3.255-.673h.039zm-5.46 2.29c.677 1.156 1.636 2.585 2.68 4.078 1.144 1.637 2.33 3.167 3.44 4.47-1.464 1.656-3.036 3.197-4.606 4.492-2.556-1.874-4.22-4.9-4.22-8.318 0-1.802.463-3.498 1.275-4.978l1.431.256zm17.074.256c.812 1.48 1.275 3.176 1.275 4.978 0 3.418-1.664 6.444-4.22 8.318-1.57-1.295-3.142-2.836-4.606-4.492 1.11-1.303 2.296-2.833 3.44-4.47 1.044-1.493 2.003-2.922 2.68-4.078l1.431-.256zM8.307 19.332c1.378-1.098 2.76-2.38 4.072-3.766 1.312 1.386 2.694 2.668 4.072 3.766-1.332.748-2.85 1.186-4.451 1.186-1.6 0-3.119-.438-4.451-1.186z" />
    </svg>

    <!-- Nintendo -->
    <svg
      v-else-if="iconType === 'nintendo'"
      :width="size"
      :height="size"
      viewBox="0 0 24 24"
      fill="currentColor"
      class="plat-icon nintendo"
    >
      <path d="M0 4.172C0 1.868 1.868 0 4.172 0H8.38v24H4.172C1.868 24 0 22.132 0 19.828V4.172zm5.72 4.41a1.86 1.86 0 1 0 0-3.72 1.86 1.86 0 0 0 0 3.72zm5.405-8.582h8.703C22.132 0 24 1.868 24 4.172v15.656C24 22.132 22.132 24 19.828 24h-8.703V0zm4.27 15.63a1.86 1.86 0 1 0 0-3.72 1.86 1.86 0 0 0 0 3.72z" />
    </svg>

    <!-- Retro (Arcade / 8-bit / SNES / Mega Drive / Classic) -->
    <svg
      v-else-if="iconType === 'retro'"
      :width="size"
      :height="size"
      viewBox="0 0 24 24"
      fill="none"
      class="plat-icon retro"
    >
      <rect x="2" y="6" width="20" height="12" rx="3" fill="#2d1b4e" stroke="#a855f7" stroke-width="1.8" />
      <path d="M6 12h4M8 10v4" stroke="#ffffff" stroke-width="1.6" stroke-linecap="round" />
      <circle cx="15.5" cy="13.5" r="1.3" fill="#ef4444" />
      <circle cx="18" cy="10.5" r="1.3" fill="#fbbf24" />
      <rect x="10.5" y="14" width="3" height="1" rx="0.5" fill="#a855f7" />
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
  color: #a855f7;
}

.plat-icon.default {
  color: var(--color-accent);
}
</style>
