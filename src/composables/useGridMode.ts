import { ref, watch } from 'vue'

export type GridColumns = 2 | 4

const STORAGE_KEY = 'capygames_grid_cols'

function loadInitialCols(): GridColumns {
  try {
    const saved = localStorage.getItem(STORAGE_KEY)
    if (saved === '4') return 4
    if (saved === '2') return 2
  } catch {
    // ignore storage errors
  }
  return 2
}

const gridCols = ref<GridColumns>(loadInitialCols())

watch(gridCols, (val) => {
  try {
    localStorage.setItem(STORAGE_KEY, String(val))
  } catch {
    // ignore storage errors
  }
})

export function useGridMode() {
  function setGridCols(cols: GridColumns) {
    gridCols.value = cols
  }

  function toggleGridCols() {
    gridCols.value = gridCols.value === 2 ? 4 : 2
  }

  return {
    gridCols,
    setGridCols,
    toggleGridCols
  }
}
