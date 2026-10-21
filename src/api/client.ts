import axios from 'axios'

const apiClient = axios.create({
  baseURL: '/api',
  headers: {
    'Accept': 'application/json',
    'Content-Type': 'application/json',
    'X-Requested-With': 'XMLHttpRequest'
  }
})

// Adiciona o token Sanctum a cada requisição
apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('capygames_token') 
    || localStorage.getItem('capyshowtime_token') 
    || localStorage.getItem('capihouse_token')

  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

// Tratamento de sessão expirada
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('capygames_token')
      if (window.location.pathname !== '/login') {
        window.location.href = '/login'
      }
    }
    return Promise.reject(error)
  }
)

export default apiClient
