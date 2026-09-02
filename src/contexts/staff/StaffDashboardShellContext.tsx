import { createContext, useContext, useMemo, useState, type ReactNode } from 'react'

interface StaffDashboardShellContextValue {
  sidebarOpen: boolean
  setSidebarOpen: (open: boolean) => void
}

const StaffDashboardShellContext = createContext<StaffDashboardShellContextValue | null>(null)

export function StaffDashboardShellProvider({ children }: { children: ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(false)

  const value = useMemo(() => ({ sidebarOpen, setSidebarOpen }), [sidebarOpen])

  return (
    <StaffDashboardShellContext.Provider value={value}>{children}</StaffDashboardShellContext.Provider>
  )
}

export function useStaffDashboardShell() {
  const ctx = useContext(StaffDashboardShellContext)
  if (!ctx) {
    throw new Error('useStaffDashboardShell must be used within StaffDashboardShellProvider')
  }
  return ctx
}
