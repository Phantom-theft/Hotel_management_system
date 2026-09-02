/**
 * Smoke tests for post-refactor page/layout mounting.
 * Verifies split guest/staff/admin modules import and render without crashing.
 */
import { type ReactNode } from 'react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { cleanup, render, screen } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { AdminDashboardShellProvider } from './contexts/admin/AdminDashboardShellContext'
import { StaffDashboardShellProvider } from './contexts/staff/StaffDashboardShellContext'
import { GuestRoomsPage } from './pages/guest/GuestRoomsPage'
import { StaffRoomsPage } from './pages/staff/StaffRoomsPage'
import { StaffDashboardPage } from './pages/staff/StaffDashboardPage'
import { AdminOverviewPage } from './pages/admin/AdminOverviewPage'
import { useAuthStore } from './store/authStore'
import type { User } from './types/api'

vi.mock('./hooks/useAuthHydrated', () => ({ useAuthHydrated: () => true }))

vi.mock('./api/hotel', async (importOriginal) => {
  const actual = await importOriginal<typeof import('./api/hotel')>()
  return {
    ...actual,
    searchRooms: vi.fn().mockResolvedValue({ rooms: [] }),
    getTodaysBookings: vi.fn().mockResolvedValue({ checkIns: [], checkOuts: [] }),
    listAllRooms: vi.fn().mockResolvedValue({ rooms: [] }),
    getOccupancyReport: vi.fn().mockResolvedValue({
      overallOccupancyRate: 0,
      totalRooms: 5,
      daily: [],
    }),
    getRevenueReport: vi.fn().mockResolvedValue({ totalRevenue: 0, roomNightsSold: 0, daily: [] }),
    getCancellationsReport: vi.fn().mockResolvedValue({
      totalBookings: 0,
      cancelledBookings: 0,
      daily: [],
    }),
    checkInBooking: vi.fn(),
    checkOutBooking: vi.fn(),
    createWalkIn: vi.fn(),
  }
})

const staffUser: User = {
  id: 'staff-1',
  name: 'Staff',
  email: 'staff@test.local',
  role: 'staff',
  phone: null,
  isActive: true,
  createdAt: '2026-01-01T00:00:00.000Z',
}

const adminUser: User = {
  id: 'admin-1',
  name: 'Admin',
  email: 'admin@test.local',
  role: 'admin',
  phone: null,
  isActive: true,
  createdAt: '2026-01-01T00:00:00.000Z',
}

function wrap(ui: ReactNode, user: User) {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  useAuthStore.setState({ user, accessToken: 'token', isAuthenticated: true })
  return (
    <QueryClientProvider client={qc}>
      <MemoryRouter>{ui}</MemoryRouter>
    </QueryClientProvider>
  )
}

beforeEach(() => {
  localStorage.clear()
  useAuthStore.persist.clearStorage()
})

afterEach(() => {
  cleanup()
  vi.clearAllMocks()
})

describe('refactor smoke — pages mount', () => {
  it('GuestRoomsPage renders search form', () => {
    render(wrap(<GuestRoomsPage />, staffUser))
    expect(screen.getByRole('form', { name: /search rooms/i })).toBeInTheDocument()
    expect(screen.getByText(/find a room/i)).toBeInTheDocument()
  })

  it('StaffRoomsPage renders search form without guest marketing header', () => {
    render(wrap(<StaffRoomsPage />, staffUser))
    expect(screen.getByRole('form', { name: /search rooms/i })).toBeInTheDocument()
    expect(screen.queryByText(/find a room/i)).not.toBeInTheDocument()
  })

  it('StaffDashboardPage renders desk sections', async () => {
    render(
      wrap(
        <StaffDashboardShellProvider>
          <StaffDashboardPage />
        </StaffDashboardShellProvider>,
        staffUser,
      ),
    )
    expect(await screen.findByText(/today's check-ins/i)).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Walk-in booking' })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Room status board' })).toBeInTheDocument()
  })

  it('AdminOverviewPage renders stat cards shell', async () => {
    render(
      wrap(
        <AdminDashboardShellProvider>
          <AdminOverviewPage />
        </AdminDashboardShellProvider>,
        adminUser,
      ),
    )
    expect(await screen.findByText('Total Revenue')).toBeInTheDocument()
  })
})

describe('refactor smoke — route wiring', () => {
  it('logged-out /rooms redirects to login', async () => {
    const { ProtectedRoute } = await import('./components/ProtectedRoute')
    useAuthStore.setState({ user: null, accessToken: null, isAuthenticated: false })
    render(
      <MemoryRouter initialEntries={['/rooms']}>
        <Routes>
          <Route path="/login" element={<div>Login page</div>} />
          <Route element={<ProtectedRoute allowedRoles={['customer', 'staff', 'admin']} />}>
            <Route path="/rooms" element={<div>Rooms page</div>} />
          </Route>
        </Routes>
      </MemoryRouter>,
    )
    expect(screen.getByText('Login page')).toBeInTheDocument()
  })
})
