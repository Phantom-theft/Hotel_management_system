import { cleanup, render, screen } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { ProtectedRoute } from '../components/ProtectedRoute'
import { useAuthStore } from '../store/authStore'
import type { User } from '../types/api'

vi.mock('../hooks/useAuthHydrated', () => ({
  useAuthHydrated: () => true,
}))

const staffUser: User = {
  id: 'staff-1',
  name: 'Staff User',
  email: 'staff@test.local',
  role: 'staff',
  phone: null,
  isActive: true,
  createdAt: '2026-01-01T00:00:00.000Z',
}

const customerUser: User = {
  id: 'customer-1',
  name: 'Guest User',
  email: 'guest@test.local',
  role: 'customer',
  phone: null,
  isActive: true,
  createdAt: '2026-01-01T00:00:00.000Z',
}

const adminUser: User = {
  id: 'admin-1',
  name: 'Admin User',
  email: 'admin@test.local',
  role: 'admin',
  phone: null,
  isActive: true,
  createdAt: '2026-01-01T00:00:00.000Z',
}

function renderStaffRoute() {
  return render(
    <MemoryRouter initialEntries={['/staff']}>
      <Routes>
        <Route path="/login" element={<div>Login page</div>} />
        <Route path="/rooms" element={<div>Rooms page</div>} />
        <Route path="/admin" element={<div>Admin page</div>} />
        <Route element={<ProtectedRoute allowedRoles={['staff', 'admin']} />}>
          <Route path="/staff" element={<div>Staff dashboard</div>} />
        </Route>
      </Routes>
    </MemoryRouter>,
  )
}

function renderAdminRoute() {
  return render(
    <MemoryRouter initialEntries={['/admin']}>
      <Routes>
        <Route path="/login" element={<div>Login page</div>} />
        <Route path="/staff" element={<div>Staff page</div>} />
        <Route path="/rooms" element={<div>Rooms page</div>} />
        <Route element={<ProtectedRoute allowedRoles={['admin']} />}>
          <Route path="/admin" element={<div>Admin dashboard</div>} />
        </Route>
      </Routes>
    </MemoryRouter>,
  )
}

beforeEach(() => {
  localStorage.clear()
  useAuthStore.persist.clearStorage()
  useAuthStore.setState({
    user: null,
    accessToken: null,
    isAuthenticated: false,
  })
})

afterEach(() => {
  cleanup()
})

function expectSingleText(text: string) {
  expect(screen.getAllByText(text)).toHaveLength(1)
}

describe('ProtectedRoute', () => {
  it('redirects logged-out users to /login', () => {
    renderStaffRoute()
    expectSingleText('Login page')
    expect(screen.queryByText('Staff dashboard')).not.toBeInTheDocument()
  })

  it('rejects isAuthenticated without access token', () => {
    useAuthStore.setState({
      user: staffUser,
      accessToken: null,
      isAuthenticated: true,
    })
    renderStaffRoute()
    expectSingleText('Login page')
  })

  it('allows staff on /staff', () => {
    useAuthStore.setState({
      user: staffUser,
      accessToken: 'token',
      isAuthenticated: true,
    })
    renderStaffRoute()
    expectSingleText('Staff dashboard')
  })

  it('blocks customers from /staff', () => {
    useAuthStore.setState({
      user: customerUser,
      accessToken: 'token',
      isAuthenticated: true,
    })
    renderStaffRoute()
    expectSingleText('Rooms page')
    expect(screen.queryByText('Staff dashboard')).not.toBeInTheDocument()
  })

  it('blocks staff from /admin', () => {
    useAuthStore.setState({
      user: staffUser,
      accessToken: 'token',
      isAuthenticated: true,
    })
    renderAdminRoute()
    expectSingleText('Staff page')
    expect(screen.queryByText('Admin dashboard')).not.toBeInTheDocument()
  })

  it('allows admin on /admin', () => {
    useAuthStore.setState({
      user: adminUser,
      accessToken: 'token',
      isAuthenticated: true,
    })
    renderAdminRoute()
    expectSingleText('Admin dashboard')
  })
})
