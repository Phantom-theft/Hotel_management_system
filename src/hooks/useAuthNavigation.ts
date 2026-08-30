import { useCallback } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { type AuthPath, useAuthTransitionStore } from '../store/authTransitionStore'

export function useAuthNavigation() {
  const navigate = useNavigate()
  const location = useLocation()
  const { startEnter, startExit } = useAuthTransitionStore()

  const openAuth = useCallback(
    (path: AuthPath) => {
      if (location.pathname === '/') {
        startEnter(path)
        return
      }
      navigate(path)
    },
    [location.pathname, navigate, startEnter],
  )

  const closeAuth = useCallback(() => {
    const { phase } = useAuthTransitionStore.getState()
    const isAuthRoute = location.pathname === '/login' || location.pathname === '/register'
    const panelActive = phase === 'entering' || phase === 'open'

    if (isAuthRoute || (location.pathname === '/' && panelActive)) {
      startExit()
      return
    }
    navigate('/')
  }, [location.pathname, navigate, startExit])

  const switchAuth = useCallback(
    (path: AuthPath) => {
      navigate(path)
    },
    [navigate],
  )

  return { openAuth, closeAuth, switchAuth }
}
