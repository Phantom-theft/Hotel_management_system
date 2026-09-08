import { describe, expect, it } from 'vitest'
import { homeForRole, readReturnPath, resolvePostLoginPath } from './authRedirect'

describe('resolvePostLoginPath', () => {
  it('sends each role to its home when there is no return path', () => {
    expect(resolvePostLoginPath('admin', undefined)).toBe('/admin')
    expect(resolvePostLoginPath('staff', undefined)).toBe('/staff')
    expect(resolvePostLoginPath('customer', undefined)).toBe('/rooms')
  })

  it('does not send admin to a leftover customer rooms path', () => {
    expect(resolvePostLoginPath('admin', '/rooms')).toBe('/admin')
    expect(resolvePostLoginPath('admin', '/my-bookings')).toBe('/admin')
    expect(resolvePostLoginPath('admin', '/profile')).toBe('/admin')
  })

  it('honors admin return paths under /admin', () => {
    expect(resolvePostLoginPath('admin', '/admin/rooms')).toBe('/admin/rooms')
  })

  it('does not send staff to a leftover customer rooms path', () => {
    expect(resolvePostLoginPath('staff', '/rooms')).toBe('/staff')
    expect(resolvePostLoginPath('staff', '/rooms?checkIn=2026-01-01')).toBe('/staff')
    expect(resolvePostLoginPath('staff', '/book')).toBe('/staff')
    expect(resolvePostLoginPath('staff', '/my-bookings')).toBe('/staff')
    expect(resolvePostLoginPath('staff', '/profile')).toBe('/staff/profile')
    expect(resolvePostLoginPath('staff', '/admin')).toBe('/staff')
  })

  it('honors staff return paths under /staff', () => {
    expect(resolvePostLoginPath('staff', '/staff/rooms')).toBe('/staff/rooms')
    expect(resolvePostLoginPath('staff', '/staff/profile')).toBe('/staff/profile')
  })

  it('keeps customers out of staff/admin shells', () => {
    expect(resolvePostLoginPath('customer', '/admin')).toBe('/rooms')
    expect(resolvePostLoginPath('customer', '/staff')).toBe('/rooms')
    expect(resolvePostLoginPath('customer', '/my-bookings')).toBe('/my-bookings')
  })
})

describe('readReturnPath / homeForRole', () => {
  it('reads valid from state', () => {
    expect(readReturnPath({ from: '/rooms' })).toBe('/rooms')
    expect(readReturnPath({ from: '/login' })).toBeUndefined()
    expect(readReturnPath(null)).toBeUndefined()
  })

  it('maps roles to homes', () => {
    expect(homeForRole('admin')).toBe('/admin')
    expect(homeForRole('staff')).toBe('/staff')
    expect(homeForRole('customer')).toBe('/rooms')
  })
})
