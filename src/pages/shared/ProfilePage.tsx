import { useEffect, useRef, useState, type ChangeEvent, type FormEvent } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Camera, KeyRound, Pencil, Trash2 } from 'lucide-react'
import {
  changePassword,
  getMyProfile,
  removeMyAvatar,
  updateMyProfile,
  uploadMyAvatar,
} from '../../api/hotel'
import { UserAvatar } from '../../components/ui/UserAvatar'
import { useAuthStore } from '../../store/authStore'
import { toast } from '../../store/toastStore'
import type { UserRole } from '../../types/api'

const ROLE_BADGE: Record<UserRole, string> = {
  customer: 'bg-sky-50 text-sky-800 ring-sky-200/80',
  staff: 'bg-emerald-50 text-emerald-800 ring-emerald-200/80',
  admin: 'bg-violet-50 text-violet-800 ring-violet-200/80',
}

const ROLE_LABEL: Record<UserRole, string> = {
  customer: 'Guest',
  staff: 'Staff',
  admin: 'Admin',
}

function formatMemberSince(iso: string) {
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return '—'
  return d.toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' })
}

function apiErrorMessage(err: unknown, fallback: string) {
  return (
    (err as { response?: { data?: { error?: string } } })?.response?.data?.error ?? fallback
  )
}

export function ProfilePage() {
  const queryClient = useQueryClient()
  const setAuth = useAuthStore((s) => s.setAuth)
  const accessToken = useAuthStore((s) => s.accessToken)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const profileQuery = useQuery({
    queryKey: ['users-me'],
    queryFn: getMyProfile,
  })

  const user = profileQuery.data?.user

  const [editing, setEditing] = useState(false)
  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')

  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [passwordFormError, setPasswordFormError] = useState<string | null>(null)

  useEffect(() => {
    if (!user || editing) return
    setName(user.name)
    setPhone(user.phone ?? '')
  }, [user, editing])

  function syncAuthUser(updated: typeof user) {
    if (updated && accessToken) setAuth(updated, accessToken)
    void queryClient.invalidateQueries({ queryKey: ['users-me'] })
  }

  const saveProfileMut = useMutation({
    mutationFn: () =>
      updateMyProfile({
        name: name.trim(),
        phone: phone.trim() ? phone.trim() : null,
      }),
    onSuccess: ({ user: updated }) => {
      syncAuthUser(updated)
      setEditing(false)
      toast('Profile updated', 'success')
    },
    onError: (err: unknown) => toast(apiErrorMessage(err, 'Could not update profile'), 'error'),
  })

  const avatarMut = useMutation({
    mutationFn: (file: File) => uploadMyAvatar(file),
    onSuccess: ({ user: updated }) => {
      syncAuthUser(updated)
      toast('Profile photo updated', 'success')
    },
    onError: (err: unknown) => toast(apiErrorMessage(err, 'Could not upload photo'), 'error'),
  })

  const removeAvatarMut = useMutation({
    mutationFn: () => removeMyAvatar(),
    onSuccess: ({ user: updated }) => {
      syncAuthUser(updated)
      toast('Profile photo removed', 'success')
    },
    onError: (err: unknown) => toast(apiErrorMessage(err, 'Could not remove photo'), 'error'),
  })

  const changePasswordMut = useMutation({
    mutationFn: () =>
      changePassword({
        currentPassword,
        newPassword,
      }),
    onSuccess: () => {
      setCurrentPassword('')
      setNewPassword('')
      setConfirmPassword('')
      setPasswordFormError(null)
      toast('Password changed successfully', 'success')
    },
    onError: (err: unknown) => {
      setPasswordFormError(apiErrorMessage(err, 'Could not change password'))
    },
  })

  function onSaveProfile(e: FormEvent) {
    e.preventDefault()
    if (name.trim().length < 2) {
      toast('Name must be at least 2 characters', 'error')
      return
    }
    if (phone.trim() && phone.trim().length < 5) {
      toast('Phone must be at least 5 characters', 'error')
      return
    }
    saveProfileMut.mutate()
  }

  function onAvatarPick(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file) return
    if (!file.type.match(/^image\/(jpeg|jpg|png|webp)$/i)) {
      toast('Only jpg, jpeg, png, or webp images are allowed', 'error')
      return
    }
    if (file.size > 5 * 1024 * 1024) {
      toast('Image must be 5MB or smaller', 'error')
      return
    }
    avatarMut.mutate(file)
  }

  function onChangePassword(e: FormEvent) {
    e.preventDefault()
    setPasswordFormError(null)

    if (!currentPassword) {
      setPasswordFormError('Current password is required')
      return
    }
    if (newPassword.length < 8) {
      setPasswordFormError('New password must be at least 8 characters')
      return
    }
    if (newPassword !== confirmPassword) {
      setPasswordFormError('New passwords do not match')
      return
    }
    if (currentPassword === newPassword) {
      setPasswordFormError('New password must be different from the current password')
      return
    }

    changePasswordMut.mutate()
  }

  function cancelEdit() {
    if (user) {
      setName(user.name)
      setPhone(user.phone ?? '')
    }
    setEditing(false)
  }

  if (profileQuery.isLoading) {
    return <p className="text-sm text-neutral-500">Loading profile…</p>
  }

  if (profileQuery.isError || !user) {
    return (
      <p className="rounded-xl border border-danger/20 bg-danger/5 px-4 py-3 text-sm text-danger" role="alert">
        {apiErrorMessage(profileQuery.error, 'Failed to load profile')}
      </p>
    )
  }

  const avatarBusy = avatarMut.isPending || removeAvatarMut.isPending

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold text-neutral-900 sm:text-3xl">Profile</h1>
        <p className="mt-1 text-sm text-neutral-500">
          View and update your account details, photo, or password.
        </p>
      </div>

      {/* Photo */}
      <section className="rounded-xl border border-neutral-200/80 bg-white p-5 shadow-sm sm:p-6">
        <h2 className="text-base font-bold text-neutral-900">Profile photo</h2>
        <p className="mt-0.5 text-xs text-neutral-500">JPG, PNG, or WebP · max 5MB</p>

        <div className="mt-4 flex flex-wrap items-center gap-4">
          <UserAvatar
            name={user.name}
            avatarUrl={user.avatarUrl}
            className="h-20 w-20 rounded-full bg-primary/10 text-lg text-primary ring-2 ring-neutral-100"
            alt={`${user.name}'s profile photo`}
          />

          <div className="flex flex-wrap gap-2">
            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/jpg,image/png,image/webp"
              className="hidden"
              onChange={onAvatarPick}
              disabled={avatarBusy}
            />
            <button
              type="button"
              disabled={avatarBusy}
              onClick={() => fileInputRef.current?.click()}
              className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-3.5 py-2 text-xs font-semibold text-white transition hover:bg-primary-light disabled:opacity-60"
            >
              <Camera className="h-3.5 w-3.5" aria-hidden />
              {avatarMut.isPending ? 'Uploading…' : user.avatarUrl ? 'Change photo' : 'Upload photo'}
            </button>
            {user.avatarUrl && (
              <button
                type="button"
                disabled={avatarBusy}
                onClick={() => removeAvatarMut.mutate()}
                className="inline-flex items-center gap-1.5 rounded-lg border border-neutral-200 bg-white px-3.5 py-2 text-xs font-semibold text-neutral-700 transition hover:bg-neutral-50 disabled:opacity-60"
              >
                <Trash2 className="h-3.5 w-3.5" aria-hidden />
                {removeAvatarMut.isPending ? 'Removing…' : 'Remove'}
              </button>
            )}
          </div>
        </div>
      </section>

      {/* Account info */}
      <section className="rounded-xl border border-neutral-200/80 bg-white p-5 shadow-sm sm:p-6">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h2 className="text-base font-bold text-neutral-900">Account</h2>
            <p className="text-xs text-neutral-500">Your personal information</p>
          </div>
          {!editing && (
            <button
              type="button"
              onClick={() => setEditing(true)}
              className="inline-flex items-center gap-1.5 rounded-lg border border-neutral-200 bg-white px-3 py-1.5 text-xs font-semibold text-neutral-700 transition hover:bg-neutral-50"
            >
              <Pencil className="h-3.5 w-3.5" aria-hidden />
              Edit
            </button>
          )}
        </div>

        {editing ? (
          <form onSubmit={onSaveProfile} className="mt-5 space-y-4">
            <label className="block text-sm">
              <span className="mb-1.5 block text-xs font-medium text-neutral-500">Name</span>
              <input
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full rounded-lg border border-neutral-200 px-3.5 py-2.5 text-sm text-neutral-900 outline-none focus:border-primary focus:ring-1 focus:ring-primary"
              />
            </label>
            <label className="block text-sm">
              <span className="mb-1.5 block text-xs font-medium text-neutral-500">Email</span>
              <input
                value={user.email}
                readOnly
                disabled
                className="w-full cursor-not-allowed rounded-lg border border-neutral-200 bg-neutral-50 px-3.5 py-2.5 text-sm text-neutral-500"
              />
              <span className="mt-1 block text-[11px] text-neutral-400">Email cannot be changed here</span>
            </label>
            <label className="block text-sm">
              <span className="mb-1.5 block text-xs font-medium text-neutral-500">Phone</span>
              <input
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="Optional"
                className="w-full rounded-lg border border-neutral-200 px-3.5 py-2.5 text-sm text-neutral-900 outline-none focus:border-primary focus:ring-1 focus:ring-primary"
              />
            </label>
            <div className="flex items-center justify-end gap-2 pt-1">
              <button
                type="button"
                onClick={cancelEdit}
                className="rounded-lg border border-neutral-200 px-4 py-2 text-sm font-medium text-neutral-700 transition hover:bg-neutral-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={saveProfileMut.isPending}
                className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-white transition hover:bg-primary-light disabled:opacity-60"
              >
                {saveProfileMut.isPending ? 'Saving…' : 'Save'}
              </button>
            </div>
          </form>
        ) : (
          <dl className="mt-5 grid gap-4 sm:grid-cols-2">
            <div>
              <dt className="text-xs font-medium uppercase tracking-wider text-neutral-400">Name</dt>
              <dd className="mt-1 text-sm font-semibold text-neutral-900">{user.name}</dd>
            </div>
            <div>
              <dt className="text-xs font-medium uppercase tracking-wider text-neutral-400">Email</dt>
              <dd className="mt-1 break-all text-sm font-medium text-neutral-700">{user.email}</dd>
            </div>
            <div>
              <dt className="text-xs font-medium uppercase tracking-wider text-neutral-400">Phone</dt>
              <dd className="mt-1 text-sm font-medium text-neutral-700">{user.phone || '—'}</dd>
            </div>
            <div>
              <dt className="text-xs font-medium uppercase tracking-wider text-neutral-400">Role</dt>
              <dd className="mt-1.5">
                <span
                  className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold ring-1 ${ROLE_BADGE[user.role]}`}
                >
                  {ROLE_LABEL[user.role]}
                </span>
              </dd>
            </div>
            <div className="sm:col-span-2">
              <dt className="text-xs font-medium uppercase tracking-wider text-neutral-400">
                Member since
              </dt>
              <dd className="mt-1 text-sm font-medium text-neutral-700">
                {formatMemberSince(user.createdAt)}
              </dd>
            </div>
          </dl>
        )}
      </section>

      {/* Change password */}
      <section className="rounded-xl border border-neutral-200/80 bg-white p-5 shadow-sm sm:p-6">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-orange-50 text-orange-600">
            <KeyRound className="h-5 w-5" aria-hidden />
          </div>
          <div>
            <h2 className="text-base font-bold text-neutral-900">Change password</h2>
            <p className="text-xs text-neutral-500">Use a strong password you do not reuse elsewhere</p>
          </div>
        </div>

        <form onSubmit={onChangePassword} className="mt-5 space-y-4">
          <label className="block text-sm">
            <span className="mb-1.5 block text-xs font-medium text-neutral-500">Current password</span>
            <input
              type="password"
              autoComplete="current-password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              className="w-full rounded-lg border border-neutral-200 px-3.5 py-2.5 text-sm text-neutral-900 outline-none focus:border-primary focus:ring-1 focus:ring-primary"
            />
          </label>
          <label className="block text-sm">
            <span className="mb-1.5 block text-xs font-medium text-neutral-500">New password</span>
            <input
              type="password"
              autoComplete="new-password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className="w-full rounded-lg border border-neutral-200 px-3.5 py-2.5 text-sm text-neutral-900 outline-none focus:border-primary focus:ring-1 focus:ring-primary"
            />
          </label>
          <label className="block text-sm">
            <span className="mb-1.5 block text-xs font-medium text-neutral-500">
              Confirm new password
            </span>
            <input
              type="password"
              autoComplete="new-password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="w-full rounded-lg border border-neutral-200 px-3.5 py-2.5 text-sm text-neutral-900 outline-none focus:border-primary focus:ring-1 focus:ring-primary"
            />
          </label>

          {passwordFormError && (
            <p className="rounded-lg border border-danger/20 bg-danger/5 px-3 py-2 text-sm text-danger" role="alert">
              {passwordFormError}
            </p>
          )}

          <div className="flex justify-end pt-1">
            <button
              type="submit"
              disabled={changePasswordMut.isPending}
              className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-white transition hover:bg-primary-light disabled:opacity-60"
            >
              {changePasswordMut.isPending ? 'Updating…' : 'Update password'}
            </button>
          </div>
        </form>
      </section>
    </div>
  )
}
