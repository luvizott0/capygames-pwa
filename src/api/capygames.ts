import apiClient from './client'

export interface CapyGame {
  id: number
  title: string
  slug: string
  external_source: string
  external_id: string
  cover_url?: string
  banner_url?: string
  summary?: string
  developer?: string
  publisher?: string
  platforms?: string[]
  genres?: string[]
  release_date?: string
  raw_data?: {
    screenshots?: Array<{ id?: number; thumbnail?: string; full?: string }>
    categories?: string[]
    achievements_count?: number
    release_date?: string
    metacritic?: number
    website?: string
  }
}

export type GameStatus = 'plan_to_play' | 'playing' | 'completed' | 'mastered' | 'dropped' | 'on_hold'

export interface GameAspectRatings {
  gameplay?: number | null
  story?: number | null
  graphics?: number | null
  sound?: number | null
  performance?: number | null
  replay?: number | null
  level_design?: number | null
  innovation?: number | null
}

export interface CapyUserGame {
  id: number
  user_id: number
  game_id: number
  status: GameStatus
  in_list?: boolean
  list_order?: number
  platform?: string
  hours_played: number
  platform_hours?: Record<string, number>
  rating?: number | null
  aspect_ratings?: GameAspectRatings | null
  review?: string | null
  achievements_earned?: number
  achievements_total?: number
  gamerscore_earned?: number
  gamerscore_total?: number
  progress_percentage?: number
  is_favorite: boolean
  source?: string
  started_at?: string
  completed_at?: string
  created_at: string
  updated_at: string
  game: CapyGame
}

export interface GameSearchResult {
  id?: number | null
  slug?: string
  external_id: string
  external_source: string
  title: string
  cover_url?: string
  banner_url?: string
  summary?: string
  developer?: string
  publisher?: string
  platforms?: string[]
  genres?: string[]
}

export interface GameActivity {
  id: number
  user_id: number
  game_id: number
  type: string
  title: string
  content?: string
  metadata?: any
  created_at: string
  user: {
    id: number
    name: string
    username: string
    avatar_url?: string
  }
  game: {
    id: number
    title: string
    cover_url?: string
    banner_url?: string
  }
}

export interface GamerProfile {
  user: {
    id: number
    name: string
    username: string
    avatar_url?: string
    banner_url?: string
    xbox_gamertag?: string
    steam_username?: string
  }
  stats: {
    total_games: number
    completed: number
    mastered: number
    playing: number
    backlog: number
    dropped: number
    total_hours: number
    avg_rating?: number | null
  }
  recent_games: CapyUserGame[]
}

export interface SetGameStatusPayload {
  game_id?: number
  external_id?: string
  external_source?: string
  title?: string
  cover_url?: string
  status?: GameStatus
  platform?: string
  hours_played?: number
  rating?: number | null
  aspect_ratings?: GameAspectRatings | null
  review?: string | null
  is_favorite?: boolean
  in_list?: boolean
}

export const capyGamesApi = {
  search(query: string) {
    return apiClient.get<{ data: GameSearchResult[] }>('/capygames/search', { params: { q: query } })
  },

  popular(page = 1, perPage = 24) {
    return apiClient.get<{
      data: GameSearchResult[]
      page: number
      per_page: number
      total: number
      has_more: boolean
    }>('/capygames/popular', { params: { page, per_page: perPage } })
  },

  getGame(id: number) {
    return apiClient.get(`/capygames/games/${id}`)
  },

  ensureGame(gameData: Partial<GameSearchResult>) {
    return apiClient.post<{ data: CapyGame }>('/capygames/games/ensure', gameData)
  },

  getMyLibrary(status?: string, platform?: string) {
    return apiClient.get<{ data: CapyUserGame[] }>('/capygames/my-library', {
      params: { status, platform }
    })
  },

  setStatus(payload: SetGameStatusPayload) {
    return apiClient.post('/capygames/library/status', payload)
  },

  toggleList(gameId: number) {
    return apiClient.post<{ message: string; user_game: CapyUserGame; in_list: boolean }>('/capygames/library/toggle-list', {
      game_id: gameId
    })
  },

  reorderList(gameIds: number[]) {
    return apiClient.post<{ message: string; data: CapyUserGame[] }>('/capygames/library/reorder', {
      game_ids: gameIds
    })
  },

  removeGame(id: number) {
    return apiClient.delete(`/capygames/library/${id}`)
  },

  getFeed(limit = 30) {
    return apiClient.get<{ data: GameActivity[] }>('/capygames/feed', { params: { limit } })
  },

  getUsers() {
    return apiClient.get<{ data: any[] }>('/capygames/users')
  },

  getUserProfile(userId: number) {
    return apiClient.get<GamerProfile>(`/capygames/users/${userId}`)
  },

  // Integrações
  connectSteam(steam: string) {
    return apiClient.post('/capygames/connect/steam', { steam })
  },

  disconnectSteam() {
    return apiClient.post('/capygames/disconnect/steam')
  },

  syncSteam() {
    return apiClient.post('/capygames/sync/steam')
  },

  connectXbox(gamertag: string) {
    return apiClient.post('/profile/xbox/connect', { gamertag })
  },

  disconnectXbox() {
    return apiClient.post('/profile/xbox/disconnect')
  },

  syncXbox() {
    return apiClient.post('/capygames/sync/xbox')
  }
}
