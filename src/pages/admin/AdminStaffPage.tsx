import { useState, type FormEvent } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  assignStaffRole,
  deactivateStaff,
  inviteStaff,
  listStaff,
  reactivateStaff,
} from '../../api/hotel'
import { BookingListSkeleton } from '../../components/Skeletons'
import { toast } from '../../store/toastStore'
import type { User, UserRole } from '../../types/api'

export function AdminStaffPage() {
  const queryClient = useQueryClient()
  const staffQuery = useQuery({ queryKey: ['staff-list'], queryFn: listStaff })

  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [role, setRole] = useState<'staff' | 'admin'>('staff')
  const [lastTempPassword, setLastTempPassword] = useState<string | null>(null)

  const inviteMut = useMutation({
    mutationFn: () =>
      inviteStaff({
        name,
        email,
        role,
        phone: phone || undefined,
      }),
    onSuccess: (data) => {
      toast(`Invited ${data.user.email}`, 'success')
      setLastTempPassword(data.tempPassword)
      setName('')
      setEmail('')
      setPhone('')
      setRole('staff')
      void queryClient.invalidateQueries({ queryKey: ['staff-list'] })
    },
    onError: (err: unknown) =>
      toast(
        (err as { response?: { data?: { error?: string } } })?.response?.data?.error ??
          'Invite failed',
        'error',
      ),
  })

  const roleMut = useMutation({
    mutationFn: ({ id, role }: { id: string; role: UserRole }) => assignStaffRole(id, role),
    onSuccess: () => {
      toast('Role updated', 'success')
      void queryClient.invalidateQueries({ queryKey: ['staff-list'] })
    },
    onError: (err: unknown) =>
      toast(
        (err as { response?: { data?: { error?: string } } })?.response?.data?.error ??
          'Role update failed',
        'error',
      ),
  })

  function patchStaffInCache(updated: User) {
    queryClient.setQueryData<{ staff: User[] }>(['staff-list'], (prev) => {
      if (!prev) return prev
      return {
        staff: prev.staff.map((s) => (s.id === updated.id ? { ...s, ...updated } : s)),
      }
    })
  }

  const deactivateMut = useMutation({
    mutationFn: (id: string) => deactivateStaff(id),
    onSuccess: (data) => {
      toast('Staff deactivated', 'success')
      patchStaffInCache(data.user)
      void queryClient.invalidateQueries({ queryKey: ['staff-list'] })
    },
    onError: (err: unknown) =>
      toast(
        (err as { response?: { data?: { error?: string } } })?.response?.data?.error ??
          'Deactivate failed',
        'error',
      ),
  })

  const reactivateMut = useMutation({
    mutationFn: (id: string) => reactivateStaff(id),
    onSuccess: (data) => {
      toast('Staff reactivated', 'success')
      patchStaffInCache(data.user)
      void queryClient.invalidateQueries({ queryKey: ['staff-list'] })
    },
    onError: (err: unknown) =>
      toast(
        (err as { response?: { data?: { error?: string } } })?.response?.data?.error ??
          'Reactivate failed',
        'error',
      ),
  })

  const statusBusy = deactivateMut.isPending || reactivateMut.isPending

  return (
    <div className="space-y-8">
      <section className="space-y-4">
        <h2 className="font-display text-2xl">Team</h2>
        {staffQuery.isLoading && <BookingListSkeleton count={3} />}
        <div className="overflow-x-auto rounded-xl border border-neutral-100 bg-white shadow-card">
          <table className="min-w-full text-left text-sm">
            <thead className="border-b border-neutral-100 text-neutral-500">
              <tr>
                <th className="px-3 py-2 font-medium">Name</th>
                <th className="px-3 py-2 font-medium">Email</th>
                <th className="px-3 py-2 font-medium">Role</th>
                <th className="px-3 py-2 font-medium">Status</th>
                <th className="px-3 py-2 font-medium" />
              </tr>
            </thead>
            <tbody>
              {(staffQuery.data?.staff ?? []).map((u: User) => (
                <tr key={u.id} className="border-b border-neutral-50">
                  <td className="px-3 py-2">{u.name}</td>
                  <td className="px-3 py-2">{u.email}</td>
                  <td className="px-3 py-2">
                    <select
                      value={u.role}
                      disabled={u.role === 'customer' || !u.isActive}
                      onChange={(e) =>
                        roleMut.mutate({ id: u.id, role: e.target.value as UserRole })
                      }
                      className="rounded border border-neutral-300 px-2 py-1 disabled:opacity-50"
                    >
                      <option value="staff">staff</option>
                      <option value="admin">admin</option>
                    </select>
                  </td>
                  <td className="px-3 py-2">
                    <span
                      className={`inline-flex rounded-md px-2 py-0.5 text-xs font-medium ${
                        u.isActive
                          ? 'bg-surface-tint text-accent'
                          : 'bg-neutral-100 text-neutral-500'
                      }`}
                    >
                      {u.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="px-3 py-2 text-right">
                    {u.isActive ? (
                      <button
                        type="button"
                        onClick={() => deactivateMut.mutate(u.id)}
                        disabled={statusBusy}
                        className="text-danger hover:underline disabled:opacity-50"
                      >
                        Deactivate
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={() => reactivateMut.mutate(u.id)}
                        disabled={statusBusy}
                        className="text-accent hover:underline disabled:opacity-50"
                      >
                        Reactivate
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="space-y-3 rounded-xl border border-neutral-100 bg-white shadow-card p-4">
        <h2 className="font-display text-xl">Invite staff</h2>
        <form
          onSubmit={(e: FormEvent) => {
            e.preventDefault()
            inviteMut.mutate()
          }}
          className="grid gap-3 sm:grid-cols-2"
        >
          <input
            required
            placeholder="Full name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="rounded-md border border-neutral-300 px-3 py-2"
          />
          <input
            required
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="rounded-md border border-neutral-300 px-3 py-2"
          />
          <input
            placeholder="Phone (optional)"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            className="rounded-md border border-neutral-300 px-3 py-2"
          />
          <select
            value={role}
            onChange={(e) => setRole(e.target.value as 'staff' | 'admin')}
            className="rounded-md border border-neutral-300 px-3 py-2"
          >
            <option value="staff">staff</option>
            <option value="admin">admin</option>
          </select>
          <button
            type="submit"
            disabled={inviteMut.isPending}
            className="rounded-full bg-primary px-4 py-2 font-semibold text-white transition hover:bg-primary-light sm:col-span-2 disabled:opacity-60"
          >
            {inviteMut.isPending ? 'Sending…' : 'Send invite'}
          </button>
        </form>
        {lastTempPassword && (
          <p className="rounded-md bg-amber-50 px-3 py-2 text-sm text-amber-950">
            Temporary password (share securely): <code className="font-mono">{lastTempPassword}</code>
          </p>
        )}
      </section>
    </div>
  )
}
