import { createContext, useContext, useMemo, useState, type ReactNode } from 'react'

export interface DashboardDateRange {
  from: string
  to: string
}

interface DashboardShellContextValue {
  dateRange: DashboardDateRange
  setDateRange: (range: DashboardDateRange) => void
  sidebarOpen: boolean
  setSidebarOpen: (open: boolean) => void
}

const DashboardShellContext = createContext<DashboardShellContextValue | null>(null)

function defaultDateRange(): DashboardDateRange {
  const to = new Date()
  const from = new Date()
  from.setDate(to.getDate() - 30)
  return {
    from: from.toISOString().slice(0, 10),
    to: to.toISOString().slice(0, 10),
  }
}

export function DashboardShellProvider({ children }: { children: ReactNode }) {
  const [dateRange, setDateRange] = useState<DashboardDateRange>(defaultDateRange)
  const [sidebarOpen, setSidebarOpen] = useState(false)

  const value = useMemo(
    () => ({ dateRange, setDateRange, sidebarOpen, setSidebarOpen }),
    [dateRange, sidebarOpen],
  )

  return (
    <DashboardShellContext.Provider value={value}>{children}</DashboardShellContext.Provider>
  )
}

export function useDashboardShell() {
  const ctx = useContext(DashboardShellContext)
  if (!ctx) {
    throw new Error('useDashboardShell must be used within DashboardShellProvider')
  }
  return ctx
}
