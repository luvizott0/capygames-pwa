<template>
  <span class="platform-icon-wrapper" :title="platformName">
    <!-- Steam / PC -->
    <svg
      v-if="iconType === 'steam'"
      :width="size"
      :height="size"
      viewBox="0 0 32 32"
      fill="currentColor"
      class="plat-icon steam"
    >
      <path d="M18.102 12.129c0-0 0-0 0-0.001 0-1.564 1.268-2.831 2.831-2.831s2.831 1.268 2.831 2.831c0 1.564-1.267 2.831-2.831 2.831-0 0-0 0-0.001 0h0c-0 0-0 0-0.001 0-1.563 0-2.83-1.267-2.83-2.83 0-0 0-0 0-0.001v0zM24.691 12.135c0-2.081-1.687-3.768-3.768-3.768s-3.768 1.687-3.768 3.768c0 2.081 1.687 3.768 3.768 3.768v0c2.080-0.003 3.765-1.688 3.768-3.767v-0zM10.427 23.76l-1.841-0.762c0.524 1.078 1.611 1.808 2.868 1.808 1.317 0 2.448-0.801 2.93-1.943l0.008-0.021c0.155-0.362 0.246-0.784 0.246-1.226 0-1.757-1.424-3.181-3.181-3.181-0.405 0-0.792 0.076-1.148 0.213l0.022-0.007 1.903 0.787c0.852 0.364 1.439 1.196 1.439 2.164 0 1.296-1.051 2.347-2.347 2.347-0.324 0-0.632-0.066-0.913-0.184l0.015 0.006zM15.974 1.004c-7.857 0.001-14.301 6.046-14.938 13.738l-0.004 0.054 8.038 3.322c0.668-0.462 1.495-0.737 2.387-0.737 0.001 0 0.002 0 0.002 0h-0c0.079 0 0.156 0.005 0.235 0.008l3.575-5.176v-0.074c0.003-3.12 2.533-5.648 5.653-5.648 3.122 0 5.653 2.531 5.653 5.653s-2.531 5.653-5.653 5.653h-0.131l-5.094 3.638c0 0.065 0.005 0.131 0.005 0.199 0 0.001 0 0.002 0 0.003 0 2.342-1.899 4.241-4.241 4.241-2.047 0-3.756-1.451-4.153-3.38l-0.005-0.027-5.755-2.383c1.841 6.345 7.601 10.905 14.425 10.905 8.281 0 14.994-6.713 14.994-14.994s-6.713-14.994-14.994-14.994c-0 0-0.001 0-0.001 0h0z" />
    </svg>

    <!-- PlayStation -->
    <svg
      v-else-if="iconType === 'playstation'"
      :width="size"
      :height="size"
      viewBox="0 0 32 32"
      fill="currentColor"
      class="plat-icon playstation"
    >
      <path d="M3.262 24.248c-2.374-0.681-2.767-2.084-1.69-2.899 0.776-0.51 1.668-0.954 2.612-1.288l0.087-0.027 7.017-2.516v2.89l-5.030 1.839c-0.881 0.339-1.031 0.79-0.299 1.032 0.365 0.093 0.783 0.147 1.214 0.147 0.615 0 1.204-0.109 1.749-0.308l-0.035 0.011 2.422-0.882v2.592c-0.15 0.037-0.32 0.055-0.487 0.091-0.775 0.136-1.667 0.214-2.577 0.214-1.778 0-3.486-0.298-5.078-0.846l0.11 0.033zM18.049 24.544l7.868-2.843c0.893-0.322 1.032-0.781 0.307-1.022-0.363-0.089-0.779-0.14-1.208-0.14-0.622 0-1.22 0.108-1.774 0.305l0.037-0.011-5.255 1.874v-2.983l0.3-0.106c1.050-0.349 2.284-0.62 3.557-0.761l0.083-0.008c0.468-0.050 1.010-0.078 1.559-0.078 1.877 0 3.677 0.331 5.343 0.939l-0.108-0.035c2.309 0.751 2.549 1.839 1.969 2.589-0.559 0.557-1.235 0.998-1.988 1.282l-0.039 0.013-10.677 3.883v-2.869zM12.231 4.248v21.927l4.892 1.576v-18.39c0-0.862 0.38-1.438 0.992-1.238 0.795 0.225 0.95 1.017 0.95 1.881v7.342c3.050 1.491 5.451-0.003 5.451-3.939 0-4.045-1.407-5.842-5.546-7.282-1.785-0.648-4.040-1.294-6.347-1.805l-0.389-0.072z" />
    </svg>

    <!-- Xbox -->
    <svg
      v-else-if="iconType === 'xbox'"
      :width="size"
      :height="size"
      viewBox="0 0 32 32"
      fill="currentColor"
      class="plat-icon xbox"
    >
      <path d="M16 5.425c-1.888-1.125-4.106-1.922-6.473-2.249l-0.092-0.010c-0.070-0.005-0.152-0.008-0.234-0.008-0.613 0-1.188 0.16-1.687 0.441l0.017-0.009c2.357-1.634 5.277-2.61 8.426-2.61 0.008 0 0.016 0 0.024 0h0.019c0.005 0 0.011 0 0.018 0 3.157 0 6.086 0.976 8.501 2.642l-0.050-0.033c-0.478-0.272-1.051-0.433-1.662-0.433-0.085 0-0.169 0.003-0.252 0.009l0.011-0.001c-2.459 0.336-4.677 1.13-6.648 2.297l0.082-0.045zM5.554 5.268c-0.041 0.014-0.077 0.032-0.11 0.054l0.002-0.001c-2.758 2.723-4.466 6.504-4.466 10.684 0 3.584 1.256 6.875 3.353 9.457l-0.022-0.028c-1.754-3.261 4.48-12.455 7.61-16.159-3.53-3.521-5.277-4.062-6.015-4.062-0.010-0-0.021-0.001-0.032-0.001-0.115 0-0.225 0.021-0.326 0.060l0.006-0.002zM20.083 9.275c3.129 3.706 9.367 12.908 7.605 16.161 2.075-2.554 3.332-5.845 3.332-9.43 0-4.181-1.709-7.962-4.467-10.684l-0.002-0.002c-0.029-0.021-0.063-0.039-0.1-0.052l-0.003-0.001c-0.1-0.036-0.216-0.056-0.336-0.056-0.005 0-0.011 0-0.016 0h0.001c-0.741-0-2.485 0.543-6.014 4.063zM6.114 27.306c2.627 2.306 6.093 3.714 9.888 3.714s7.261-1.407 9.905-3.728l-0.017 0.015c2.349-2.393-5.402-10.901-9.89-14.29-4.483 3.39-12.24 11.897-9.886 14.29z" />
    </svg>

    <!-- Nintendo Switch -->
    <svg
      v-else-if="iconType === 'nintendo'"
      :width="size"
      :height="size"
      viewBox="0 0 32 32"
      fill="currentColor"
      class="plat-icon nintendo"
    >
      <path d="M18.901 32h4.901c4.5 0 8.198-3.698 8.198-8.198v-15.604c0-4.5-3.698-8.198-8.198-8.198h-5c-0.099 0-0.203 0.099-0.203 0.198v31.604c0 0.099 0.099 0.198 0.302 0.198zM25 14.401c1.802 0 3.198 1.5 3.198 3.198 0 1.802-1.5 3.198-3.198 3.198-1.802 0-3.198-1.396-3.198-3.198-0.104-1.797 1.396-3.198 3.198-3.198zM15.198 0h-7c-4.5 0-8.198 3.698-8.198 8.198v15.604c0 4.5 3.698 8.198 8.198 8.198h7c0.099 0 0.203-0.099 0.203-0.198v-31.604c0-0.099-0.099-0.198-0.203-0.198zM12.901 29.401h-4.703c-3.099 0-5.599-2.5-5.599-5.599v-15.604c0-3.099 2.5-5.599 5.599-5.599h4.604zM5 9.599c0 1.698 1.302 3 3 3s3-1.302 3-3c0-1.698-1.302-3-3-3s-3 1.302-3 3z" />
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

const platformName = computed(() => {
  const p = (props.platform || '').trim()
  if (!p) return 'Multiplataforma'
  if (/^(pc|windows|win32|pc\s*\((steam|windows)\))$/i.test(p)) {
    return 'Steam'
  }
  return p
})

const iconType = computed(() => {
  const p = (props.platform || '').toLowerCase()

  if (/xbox|series|xbl|microsoft/i.test(p)) {
    return 'xbox'
  }
  if (/playstation|ps5|ps4|ps3|ps2|ps1|psp|vita|sony/i.test(p)) {
    return 'playstation'
  }
  if (/nintendo|switch|wii|ds|3ds|gamecube|n64/i.test(p)) {
    return 'nintendo'
  }
  if (/retro|snes|nes|super nintendo|mega drive|genesis|game boy|gba|arcade|mame|atari|master system|sega|neogeo/i.test(p)) {
    return 'retro'
  }
  if (/steam|pc|windows|computer|computador|epic|gog|battlenet/i.test(p)) {
    return 'steam'
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
