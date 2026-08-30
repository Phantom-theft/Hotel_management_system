import axios, { type AxiosError, type InternalAxiosRequestConfig } from 'axios'
import { useAuthStore } from '../store/authStore'
import { clearSessionCache } from '../queryClient'

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:3001/api'

/** Routes that should never force a login redirect when a session expires */
function isPublicRoute(pathname: string): boolean {
  if (pathname === '/') return true
  if (pathname.startsWith('/login') || pathname.startsWith('/register')) return true
  return false
}

export const api = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
})

api.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  const token = useAuthStore.getState().accessToken
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

let refreshPromise: Promise<string | null> | null = null

async function refreshAccessToken(): Promise<string | null> {
  try {
    const { data } = await axios.post(
      `${API_BASE_URL}/auth/refresh`,
      {},
      { withCredentials: true },
    )
    const { accessToken, user } = data
    useAuthStore.getState().setAuth(user, accessToken)
    return accessToken as string
  } catch {
    clearSessionCache()
    useAuthStore.getState().clearAuth()
    return null
  }
}

api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const original = error.config as (InternalAxiosRequestConfig & { _retry?: boolean }) | undefined

    if (!original || error.response?.status !== 401 || original._retry) {
      return Promise.reject(error)
    }

    // Do not try to refresh the refresh/login/register endpoints themselves
    const url = original.url ?? ''
    if (url.includes('/auth/refresh') || url.includes('/auth/login') || url.includes('/auth/register')) {
      return Promise.reject(error)
    }

    original._retry = true

    if (!refreshPromise) {
      refreshPromise = refreshAccessToken().finally(() => {
        refreshPromise = null
      })
    }

    const newToken = await refreshPromise
    if (!newToken) {
      const path = typeof window !== 'undefined' ? window.location.pathname : ''
      if (path && !path.startsWith('/login') && !isPublicRoute(path)) {
        window.location.assign('/login')
      }
      return Promise.reject(error)
    }

    original.headers.Authorization = `Bearer ${newToken}`
    return api(original)
  },
)
