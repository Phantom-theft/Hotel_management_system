import { cleanup, render, screen } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { ProtectedRoute } from './ProtectedRoute'
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

describe('ProtectedRoute extended RBAC', () => {
  it('redirects logged-out users from /admin to /login', () => {
    render(
      <MemoryRouter initialEntries={['/admin']}>
        <Routes>
          <Route path="/login" element={<div>Login page</div>} />
          <Route element={<ProtectedRoute allowedRoles={['admin']} />}>
            <Route path="/admin" element={<div>Admin dashboard</div>} />
          </Route>
        </Routes>
      </MemoryRouter>,
    )
    expect(screen.getByText('Login page')).toBeInTheDocument()
    expect(screen.queryByText('Admin dashboard')).not.toBeInTheDocument()
  })

  it('blocks customer from /admin', () => {
    useAuthStore.setState({
      user: customerUser,
      accessToken: 'token',
      isAuthenticated: true,
    })
    render(
      <MemoryRouter initialEntries={['/admin']}>
        <Routes>
          <Route path="/rooms" element={<div>Rooms page</div>} />
          <Route element={<ProtectedRoute allowedRoles={['admin']} />}>
            <Route path="/admin" element={<div>Admin dashboard</div>} />
          </Route>
        </Routes>
      </MemoryRouter>,
    )
    expect(screen.getByText('Rooms page')).toBeInTheDocument()
    expect(screen.queryByText('Admin dashboard')).not.toBeInTheDocument()
  })

  it('blocks admin from /staff', () => {
    useAuthStore.setState({
      user: adminUser,
      accessToken: 'token',
      isAuthenticated: true,
    })
    render(
      <MemoryRouter initialEntries={['/staff']}>
        <Routes>
          <Route path="/admin" element={<div>Admin dashboard</div>} />
          <Route element={<ProtectedRoute allowedRoles={['staff']} />}>
            <Route path="/staff" element={<div>Staff dashboard</div>} />
          </Route>
        </Routes>
      </MemoryRouter>,
    )
    expect(screen.getByText('Admin dashboard')).toBeInTheDocument()
    expect(screen.queryByText('Staff dashboard')).not.toBeInTheDocument()
  })
})
