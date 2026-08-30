import { Outlet } from 'react-router-dom'
import { ToastViewport } from './ToastViewport'

/** Bare layout for /login and /register — no site header or footer */
export function AuthLayout() {
  return (
    <div className="h-dvh w-screen overflow-hidden bg-transparent text-neutral-900">
      <ToastViewport />
      <Outlet />
    </div>
  )
}
