import { createContext, useContext, useMemo, useState, type ReactNode } from 'react'

export interface AdminDateRange {
  from: string
  to: string
}

interface AdminDashboardShellContextValue {
  dateRange: AdminDateRange
  setDateRange: (range: AdminDateRange) => void
  sidebarOpen: boolean
  setSidebarOpen: (open: boolean) => void
}

const AdminDashboardShellContext = createContext<AdminDashboardShellContextValue | null>(null)

function defaultDateRange(): AdminDateRange {
  const to = new Date()
  const from = new Date()
  from.setDate(to.getDate() - 30)
  return {
    from: from.toISOString().slice(0, 10),
    to: to.toISOString().slice(0, 10),
  }
}

export function AdminDashboardShellProvider({ children }: { children: ReactNode }) {
  const [dateRange, setDateRange] = useState<AdminDateRange>(defaultDateRange)
  const [sidebarOpen, setSidebarOpen] = useState(false)

  const value = useMemo(
    () => ({ dateRange, setDateRange, sidebarOpen, setSidebarOpen }),
    [dateRange, sidebarOpen],
  )

  return (
    <AdminDashboardShellContext.Provider value={value}>{children}</AdminDashboardShellContext.Provider>
  )
}

export function useAdminDashboardShell() {
  const ctx = useContext(AdminDashboardShellContext)
  if (!ctx) {
    throw new Error('useAdminDashboardShell must be used within AdminDashboardShellProvider')
  }
  return ctx
}
