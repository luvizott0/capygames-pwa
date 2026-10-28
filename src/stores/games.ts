import { defineStore } from 'pinia'
import { ref } from 'vue'
import { capyGamesApi, type CapyUserGame, type GameSearchResult, type GameActivity } from '@/api/capygames'

const MY_LIST_CACHE_KEY = 'capygames_my_list_cache'
const DISCOVER_CACHE_KEY = 'capygames_discover_cache_v2'
const COMMUNITY_CACHE_KEY = 'capygames_community_cache'
const PROFILES_CACHE_KEY = 'capygames_profiles_cache_v1'
const FRIENDS_RECENT_CACHE_KEY = 'capygames_friends_recent_cache_v1'
const TOP_RATED_CACHE_KEY = 'capygames_top_rated_cache_v1'

function loadFromStorage<T>(key: string, defaultValue: T): T {
  try {
    const raw = localStorage.getItem(key)
    if (raw) {
      return JSON.parse(raw) as T
    }
  } catch (e) {
    console.error(`Erro ao ler cache ${key}:`, e)
  }
  return defaultValue
}

function saveToStorage<T>(key: string, value: T) {
  try {
    localStorage.setItem(key, JSON.stringify(value))
  } catch (e) {
    console.error(`Erro ao salvar cache ${key}:`, e)
  }
}

export const useGamesStore = defineStore('games', () => {
  // 1. My List / Up Next State
  const myList = ref<CapyUserGame[]>(loadFromStorage(MY_LIST_CACHE_KEY, []))
  const myListLoaded = ref(myList.value.length > 0)
  const isRefreshingMyList = ref(false)

  // 2. Discover State
  const popularGames = ref<GameSearchResult[]>(loadFromStorage(DISCOVER_CACHE_KEY, []))
  const discoverLoaded = ref(popularGames.value.length > 0)
  const isRefreshingDiscover = ref(false)
  const discoverCurrentPage = ref(1)
  const discoverHasMore = ref(true)
  const isLoadingMoreDiscover = ref(false)

  // 3. Community State
  const communityActivities = ref<GameActivity[]>(loadFromStorage(COMMUNITY_CACHE_KEY, []))
  const communityLoaded = ref(communityActivities.value.length > 0)
  const isRefreshingCommunity = ref(false)

  // 4. Discover Filter & Search State (Persistente durante a sessão de navegação)
  const discoverSearchQuery = ref('')
  const discoverSearchResults = ref<GameSearchResult[]>([])
  const discoverSelectedGenre = ref('')
  const discoverGenreResults = ref<GameSearchResult[]>([])
  const discoverFilters = ref({
    platform: '',
    source: '',
    sortBy: 'popular'
  })
  const discoverShowFiltersPanel = ref(false)

  // 5. My List Active Tab
  const myListActiveTab = ref('all')

  // 6. Profile Cache por ID de usuário
  const profilesCache = ref<Record<number, any>>(loadFromStorage(PROFILES_CACHE_KEY, {}))
  // 7. Home Highlights (Top 10 Friends Recent & Top 10 Rated)
  const friendsRecentGames = ref<any[]>(loadFromStorage(FRIENDS_RECENT_CACHE_KEY, []))
  const topRatedGames = ref<any[]>(loadFromStorage(TOP_RATED_CACHE_KEY, []))
  const isRefreshingHomeHighlights = ref(false)


  // Actions
  async function fetchMyList(force = false) {
    if (!force && myListLoaded.value && myList.value.length > 0) {




      return
    }

    isRefreshingMyList.value = true
    try {
      const res = await capyGamesApi.getMyLibrary()
      myList.value = res.data.data || []
      myListLoaded.value = true
      saveToStorage(MY_LIST_CACHE_KEY, myList.value)
    } catch (err) {
      console.error('Erro ao buscar Minha Lista:', err)
    } finally {
      isRefreshingMyList.value = false
    }
  }

  async function fetchDiscover(force = false) {
    if (!force && discoverLoaded.value && popularGames.value.length > 0) {
      return
    }

    isRefreshingDiscover.value = true
    discoverCurrentPage.value = 1
    try {
      const res = await capyGamesApi.popular(1, 24)
      popularGames.value = res.data.data || []
      discoverHasMore.value = res.data.has_more ?? false
      discoverLoaded.value = true
      saveToStorage(DISCOVER_CACHE_KEY, popularGames.value)
    } catch (err) {
      console.error('Erro ao buscar Descobrir:', err)
    } finally {
      isRefreshingDiscover.value = false
    }
  }

  async function loadMorePopular() {
    if (isLoadingMoreDiscover.value || !discoverHasMore.value || isRefreshingDiscover.value) {
      return
    }

    isLoadingMoreDiscover.value = true
    try {
      const nextPage = discoverCurrentPage.value + 1
      const res = await capyGamesApi.popular(nextPage, 24)
      const newItems = res.data.data || []
      if (newItems.length > 0) {
        discoverCurrentPage.value = nextPage
        const existingKeys = new Set(popularGames.value.map(g => g.id || g.external_id))
        for (const item of newItems) {
          const key = item.id || item.external_id
          if (!existingKeys.has(key)) {
            popularGames.value.push(item)
            existingKeys.add(key)
          }
        }
        saveToStorage(DISCOVER_CACHE_KEY, popularGames.value)
      }
      discoverHasMore.value = res.data.has_more ?? false
    } catch (err) {
      console.error('Erro ao carregar mais jogos populares:', err)
    } finally {
      isLoadingMoreDiscover.value = false
    }
  }

  async function fetchCommunity(force = false) {
    if (!force && communityLoaded.value && communityActivities.value.length > 0) {
      return
    }

    isRefreshingCommunity.value = true
    try {
      const res = await capyGamesApi.getFeed()
      communityActivities.value = res.data.data || []
      communityLoaded.value = true
      saveToStorage(COMMUNITY_CACHE_KEY, communityActivities.value)
    } catch (err) {
      console.error('Erro ao buscar Atividade da Casa:', err)
    } finally {
      isRefreshingCommunity.value = false
    }
  }

  
  async function fetchHomeHighlights(force = false) {
    if (!force && friendsRecentGames.value.length > 0 && topRatedGames.value.length > 0) {
      return
    }

    isRefreshingHomeHighlights.value = true
    try {
      const [friendsRes, topRes] = await Promise.all([
        capyGamesApi.getFriendsRecentGames(10),
        capyGamesApi.getTopRatedGames(10)
      ])
      friendsRecentGames.value = friendsRes.data.data || []
      topRatedGames.value = topRes.data.data || []

      saveToStorage(FRIENDS_RECENT_CACHE_KEY, friendsRecentGames.value)
      saveToStorage(TOP_RATED_CACHE_KEY, topRatedGames.value)
    } catch (err) {
      console.error('Erro ao buscar destaques da home:', err)
    } finally {
      isRefreshingHomeHighlights.value = false
    }
  }

  function invalidateAllCache() {
    myListLoaded.value = false
    communityLoaded.value = false
  }

  function getCachedProfile(userId: number) {
    return profilesCache.value[userId] || null
  }

  function setCachedProfile(userId: number, data: any) {
    profilesCache.value[userId] = data
    saveToStorage(PROFILES_CACHE_KEY, profilesCache.value)
  }

  function resetDiscoverFilters() {
    discoverSelectedGenre.value = ''
    discoverGenreResults.value = []
    discoverFilters.value = {
      platform: '',
      source: '',
      sortBy: 'popular'
    }
  }

  async function toggleList(gameId: number) {
    try {
      const res = await capyGamesApi.toggleList(gameId)
      const updated = res.data.user_game
      const idx = myList.value.findIndex(ug => ug.game_id === gameId || ug.game?.id === gameId)
      if (idx !== -1) {
        myList.value[idx] = updated
      } else {
        myList.value.push(updated)
      }
      saveToStorage(MY_LIST_CACHE_KEY, myList.value)
      return res.data
    } catch (err) {
      console.error('Erro ao alternar jogo na lista:', err)
      throw err
    }
  }

  async function reorderList(gameIds: number[]) {
    try {
      const res = await capyGamesApi.reorderList(gameIds)
      const reordered = res.data.data
      if (reordered && reordered.length > 0) {
        // Atualiza a lista com a nova ordem
        const map = new Map<number, CapyUserGame>()
        for (const item of reordered) {
          map.set(item.game_id, item)
        }
        myList.value = myList.value.map(ug => map.get(ug.game_id) || ug)
        saveToStorage(MY_LIST_CACHE_KEY, myList.value)

      }
      return res.data
    } catch (err) {
      console.error('Erro ao salvar nova ordem da lista:', err)
      throw err
    }
  }

  function clearDiscoverSearch() {
    discoverSearchQuery.value = ''
    discoverSearchResults.value = []
  }

  return {
    myList,
    myListLoaded,
    isRefreshingMyList,
    fetchMyList,
    toggleList,
    reorderList,

    popularGames,
    discoverLoaded,
    isRefreshingDiscover,
    discoverCurrentPage,
    discoverHasMore,
    isLoadingMoreDiscover,
    fetchDiscover,
    loadMorePopular,

    communityActivities,
    communityLoaded,
    isRefreshingCommunity,
    fetchCommunity,

    discoverSearchQuery,
    discoverSearchResults,
    discoverSelectedGenre,
    discoverGenreResults,
    discoverFilters,
    discoverShowFiltersPanel,
    resetDiscoverFilters,
    clearDiscoverSearch,

    myListActiveTab,

    profilesCache,
    getCachedProfile,
    setCachedProfile,

    friendsRecentGames,
    topRatedGames,
    isRefreshingHomeHighlights,
    fetchHomeHighlights,
    invalidateAllCache
  }
})
