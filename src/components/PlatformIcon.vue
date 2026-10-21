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
      <path d="M4.095 3.593c2.046-1.89 4.792-3.056 7.808-3.056 3.016 0 5.762 1.166 7.808 3.056l.097.09c.277.261.359.664.195 1.009-.434.912-1.258 2.503-2.648 4.604-1.638 2.476-3.486 4.887-5.452 7.086-1.966-2.199-3.814-4.61-5.452-7.086-1.39-2.101-2.214-3.692-2.648-4.604-.164-.345-.082-.748.195-1.009l.097-.09zM.536 7.587c-.34.19-.536.568-.536.96 0 5.485 3.698 10.111 8.761 11.589-2.482-1.942-4.646-4.225-6.398-6.723-.889-1.267-1.508-2.39-1.827-3.238l-.004-.012-.008-.021c-.053-.16-.017-.338.012-.555zm22.928 0c.029.217.065.395.012.555l-.008.021-.004.012c-.319.848-.938 1.971-1.827 3.238-1.752 2.498-3.916 4.781-6.398 6.723 5.063-1.478 8.761-6.104 8.761-11.589 0-.392-.196-.77-.536-.96zm-11.561 9.421c1.554-1.827 3.023-3.791 4.349-5.795 1.026-1.551 1.83-2.981 2.383-4.137-.962-.843-2.072-1.527-3.284-2.022-1.077.586-2.278.913-3.448.913-1.17 0-2.371-.327-3.448-.913-1.212.495-2.322 1.179-3.284 2.022.553 1.156 1.357 2.586 2.383 4.137 1.326 2.004 2.795 3.968 4.349 5.795z" />
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
      stroke="currentColor"
      stroke-width="2"
      stroke-linecap="round"
      stroke-linejoin="round"
      class="plat-icon retro"
    >
      <rect x="2" y="6" width="20" height="12" rx="3" />
      <path d="M6 12h4" />
      <path d="M8 10v4" />
      <circle cx="15" cy="13" r="1" fill="currentColor" />
      <circle cx="18" cy="11" r="1" fill="currentColor" />
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
  }>(),
  {
    platform: '',
    size: 16
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
}

.plat-icon {
  display: inline-block;
  vertical-align: middle;
  color: var(--text-muted);
  transition: color 0.2s ease;
}

.plat-icon.steam:hover {
  color: #66c0f4;
}

.plat-icon.playstation:hover {
  color: #0070d1;
}

.plat-icon.xbox:hover {
  color: #107c10;
}

.plat-icon.nintendo:hover {
  color: #e60012;
}

.plat-icon.retro:hover {
  color: var(--color-accent);
}
</style>
