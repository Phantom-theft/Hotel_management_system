import { useState, type FormEvent } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  ChevronDown,
  Copy,
  KeyRound,
  Plus,
  X,
} from 'lucide-react'
import {
  assignStaffRole,
  deactivateStaff,
  inviteStaff,
  listStaff,
  reactivateStaff,
} from '../../api/hotel'
import { BookingListSkeleton } from '../../components/ui/Skeletons'
import { toast } from '../../store/toastStore'
import type { User, UserRole } from '../../types/api'

export function AdminStaffPage() {
  const queryClient = useQueryClient()
  const staffQuery = useQuery({ queryKey: ['staff-list'], queryFn: listStaff })

  const [isInviteOpen, setIsInviteOpen] = useState(false)
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [role, setRole] = useState<'staff' | 'admin'>('staff')
  const [lastTempPassword, setLastTempPassword] = useState<string | null>(null)

  const resetInviteForm = () => {
    setName('')
    setEmail('')
    setPhone('')
    setRole('staff')
  }

  const handleCloseInvite = () => {
    resetInviteForm()
    setIsInviteOpen(false)
  }

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
      resetInviteForm()
      setIsInviteOpen(false)
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
    <div className="space-y-6">
      {/* Header with Title and "New Staff" button */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-lg font-bold text-neutral-900">Staff members</h2>
          <p className="mt-0.5 text-xs text-neutral-500">
            Manage staff accounts, assign administrative roles, and handle access.
          </p>
        </div>

        <button
          type="button"
          onClick={() => {
            setLastTempPassword(null)
            setIsInviteOpen(true)
          }}
          className="inline-flex items-center justify-center gap-1.5 rounded-lg bg-primary px-4 py-2 text-xs font-semibold text-white shadow-sm transition hover:bg-primary-light"
        >
          <Plus className="h-4 w-4" />
          <span>New Staff</span>
        </button>
      </div>

      {/* Temporary Password Notification Banner */}
      {lastTempPassword && (
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-xl border border-amber-200 bg-amber-50/90 p-4 text-sm text-amber-950 shadow-2xs">
          <div className="flex items-start sm:items-center gap-3">
            <KeyRound className="h-5 w-5 shrink-0 text-amber-600 mt-0.5 sm:mt-0" />
            <div>
              <p className="font-semibold text-amber-900 text-xs sm:text-sm">
                Staff member invited successfully!
              </p>
              <p className="text-xs text-amber-800 mt-0.5">
                Temporary password (share securely):{' '}
                <code className="rounded bg-white px-2 py-0.5 font-mono text-xs font-bold border border-amber-300">
                  {lastTempPassword}
                </code>
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 self-end sm:self-center">
            <button
              type="button"
              onClick={() => {
                void navigator.clipboard.writeText(lastTempPassword)
                toast('Temporary password copied to clipboard', 'success')
              }}
              className="inline-flex items-center gap-1.5 rounded-lg border border-amber-300 bg-white px-3 py-1.5 text-xs font-semibold text-amber-900 hover:bg-amber-100 transition shadow-2xs"
            >
              <Copy className="h-3.5 w-3.5" />
              Copy
            </button>
            <button
              type="button"
              onClick={() => setLastTempPassword(null)}
              className="rounded-lg p-1.5 text-amber-700 hover:bg-amber-100 hover:text-amber-950 transition"
              title="Dismiss"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}

      {/* Staff List Table */}
      <section className="space-y-4">
        {staffQuery.isLoading && <BookingListSkeleton count={3} />}

        {!staffQuery.isLoading && (
          <div className="overflow-x-auto rounded-xl border border-neutral-200/80 bg-white shadow-sm">
            <table className="min-w-full text-left text-sm">
              <thead className="border-b border-neutral-100 bg-neutral-50/60 text-[11px] font-bold uppercase tracking-wider text-neutral-400">
                <tr>
                  <th className="px-4 py-3 font-semibold">Name</th>
                  <th className="px-4 py-3 font-semibold">Email</th>
                  <th className="px-4 py-3 font-semibold">Role</th>
                  <th className="px-4 py-3 font-semibold">Status</th>
                  <th className="px-4 py-3 text-right font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100">
                {(staffQuery.data?.staff ?? []).length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-8 text-center text-xs text-neutral-400">
                      No staff members found.
                    </td>
                  </tr>
                ) : (
                  (staffQuery.data?.staff ?? []).map((u: User) => (
                    <tr key={u.id} className="transition hover:bg-neutral-50/50">
                      <td className="px-4 py-3.5 font-semibold text-neutral-900">
                        <div className="flex items-center gap-2.5">
                          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-neutral-100 text-xs font-bold text-neutral-600">
                            {u.name ? u.name.charAt(0).toUpperCase() : 'S'}
                          </div>
                          <span>{u.name}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3.5 text-xs text-neutral-600">{u.email}</td>
                      <td className="px-4 py-3.5">
                        <div className="relative inline-block min-w-[110px]">
                          <select
                            value={u.role}
                            disabled={u.role === 'customer' || !u.isActive}
                            onChange={(e) =>
                              roleMut.mutate({ id: u.id, role: e.target.value as UserRole })
                            }
                            className="w-full cursor-pointer appearance-none rounded-lg border border-neutral-200 bg-white py-1.5 pl-2.5 pr-7 text-xs font-semibold capitalize text-neutral-700 shadow-2xs transition focus:border-primary focus:outline-none disabled:cursor-not-allowed disabled:opacity-50"
                          >
                            <option value="staff">Staff</option>
                            <option value="admin">Admin</option>
                          </select>
                          <ChevronDown className="pointer-events-none absolute right-2 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-neutral-400" />
                        </div>
                      </td>
                      <td className="px-4 py-3.5">
                        <span
                          className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                            u.isActive
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200/60'
                              : 'bg-neutral-100 text-neutral-500 border border-neutral-200/60'
                          }`}
                        >
                          <span
                            className={`h-1.5 w-1.5 rounded-full ${u.isActive ? 'bg-emerald-500' : 'bg-neutral-400'}`}
                          />
                          {u.isActive ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td className="px-4 py-3.5 text-right">
                        {u.isActive ? (
                          <button
                            type="button"
                            onClick={() => deactivateMut.mutate(u.id)}
                            disabled={statusBusy}
                            className="rounded-lg px-2.5 py-1 text-xs font-medium text-danger hover:bg-red-50 transition disabled:opacity-50"
                          >
                            Deactivate
                          </button>
                        ) : (
                          <button
                            type="button"
                            onClick={() => reactivateMut.mutate(u.id)}
                            disabled={statusBusy}
                            className="rounded-lg px-2.5 py-1 text-xs font-medium text-accent hover:bg-blue-50 transition disabled:opacity-50"
                          >
                            Reactivate
                          </button>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* New Staff / Invite Staff Modal */}
      {isInviteOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-xs"
          onClick={(e) => {
            if (e.target === e.currentTarget) handleCloseInvite()
          }}
        >
          <div className="relative w-full max-w-md rounded-2xl bg-white p-6 shadow-xl border border-neutral-200">
            <div className="flex items-center justify-between border-b border-neutral-100 pb-3">
              <div>
                <h3 className="text-base sm:text-lg font-bold text-neutral-900">New Staff</h3>
                <p className="mt-0.5 text-xs text-neutral-500">
                  Send an invitation to create a new staff or admin account.
                </p>
              </div>
              <button
                type="button"
                onClick={handleCloseInvite}
                className="rounded-full p-1 text-neutral-400 hover:bg-neutral-100 hover:text-neutral-700 transition"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form
              onSubmit={(e: FormEvent) => {
                e.preventDefault()
                inviteMut.mutate()
              }}
              className="mt-4 space-y-4"
            >
              <div>
                <label className="mb-1.5 block text-xs font-medium text-neutral-500">Full Name</label>
                <input
                  required
                  placeholder="e.g. Jane Doe"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full rounded-lg border border-neutral-200 bg-white px-3.5 py-2.5 text-sm text-neutral-800 placeholder:text-neutral-400 transition focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary shadow-2xs"
                />
              </div>

              <div>
                <label className="mb-1.5 block text-xs font-medium text-neutral-500">Email Address</label>
                <input
                  required
                  type="email"
                  placeholder="e.g. jane.doe@hotel.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full rounded-lg border border-neutral-200 bg-white px-3.5 py-2.5 text-sm text-neutral-800 placeholder:text-neutral-400 transition focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary shadow-2xs"
                />
              </div>

              <div>
                <label className="mb-1.5 block text-xs font-medium text-neutral-500">Phone (optional)</label>
                <input
                  placeholder="e.g. +1 555-0199"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full rounded-lg border border-neutral-200 bg-white px-3.5 py-2.5 text-sm text-neutral-800 placeholder:text-neutral-400 transition focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary shadow-2xs"
                />
              </div>

              <div>
                <label className="mb-1.5 block text-xs font-medium text-neutral-500">Role</label>
                <div className="relative">
                  <select
                    value={role}
                    onChange={(e) => setRole(e.target.value as 'staff' | 'admin')}
                    className="w-full appearance-none rounded-lg border border-neutral-200 bg-white px-3.5 py-2.5 pr-8 text-sm capitalize text-neutral-800 transition focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary shadow-2xs"
                  >
                    <option value="staff">Staff — Front desk and operations</option>
                    <option value="admin">Admin — Full management access</option>
                  </select>
                  <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-400" />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 border-t border-neutral-100 pt-4">
                <button
                  type="button"
                  onClick={handleCloseInvite}
                  className="rounded-lg border border-neutral-200 bg-white px-4 py-2 text-sm font-medium text-neutral-700 transition hover:bg-neutral-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={inviteMut.isPending}
                  className="inline-flex items-center justify-center gap-1.5 rounded-lg bg-primary px-5 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-primary-light disabled:opacity-60"
                >
                  <Plus className="h-4 w-4" />
                  <span>{inviteMut.isPending ? 'Sending…' : 'Send Invite'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
