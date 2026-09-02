import { useState, type FormEvent } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Plus, Tag, Trash2 } from 'lucide-react'
import { createPromoCode, deletePromoCode, listPromoCodes } from '../../api/hotel'
import { Modal } from '../../components/ui/Modal'
import { BookingListSkeleton } from '../../components/ui/Skeletons'
import { toast } from '../../store/toastStore'
import { getApiErrorMessage } from '../../utils/apiError'
import type { PromoCode } from '../../types/api'

export function AdminPromotionsPage() {
  const queryClient = useQueryClient()
  const { data, isLoading } = useQuery({
    queryKey: ['admin-promo-codes'],
    queryFn: listPromoCodes,
  })

  const [deleteTarget, setDeleteTarget] = useState<PromoCode | null>(null)
  const [code, setCode] = useState('')
  const [discountPercent, setDiscountPercent] = useState(15)
  const [validFrom, setValidFrom] = useState(new Date().toISOString().slice(0, 10))
  const [validTo, setValidTo] = useState(() => {
    const d = new Date()
    d.setDate(d.getDate() + 60)
    return d.toISOString().slice(0, 10)
  })
  const [maxUses, setMaxUses] = useState(50)

  const promoCodes = data?.promoCodes ?? []

  const createMut = useMutation({
    mutationFn: () =>
      createPromoCode({
        code: code.trim().toUpperCase(),
        discountPercent: Number(discountPercent),
        validFrom: new Date(validFrom).toISOString(),
        validTo: new Date(validTo).toISOString(),
        maxUses: Number(maxUses),
      }),
    onSuccess: (res) => {
      toast(`Promo code ${res.promoCode.code} created!`, 'success')
      setCode('')
      setDiscountPercent(15)
      setMaxUses(50)
      void queryClient.invalidateQueries({ queryKey: ['admin-promo-codes'] })
    },
    onError: (err: unknown) => {
      toast(getApiErrorMessage(err, { fallback: 'Failed to create promo code' }), 'error')
    },
  })

  const deleteMut = useMutation({
    mutationFn: (id: string) => deletePromoCode(id),
    onSuccess: () => {
      toast('Promo code removed', 'success')
      setDeleteTarget(null)
      void queryClient.invalidateQueries({ queryKey: ['admin-promo-codes'] })
    },
    onError: (err: unknown) => {
      toast(getApiErrorMessage(err, { fallback: 'Failed to delete promo code' }), 'error')
    },
  })

  function getStatus(p: PromoCode) {
    const now = new Date()
    const from = new Date(p.validFrom)
    const to = new Date(p.validTo)

    if (p.usedCount >= p.maxUses) {
      return { label: 'Exhausted', color: 'bg-rose-100 text-rose-800' }
    }
    if (now > to) {
      return { label: 'Expired', color: 'bg-neutral-100 text-neutral-600' }
    }
    if (now < from) {
      return { label: 'Upcoming', color: 'bg-blue-100 text-blue-800' }
    }
    return { label: 'Active', color: 'bg-emerald-100 text-emerald-800' }
  }

  return (
    <div className="space-y-8">
      {/* Header & Stats Strip */}
      <div className="grid gap-4 sm:grid-cols-3">
        <div className="rounded-xl border border-neutral-200/80 bg-white p-4 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-wider text-neutral-500">Total Campaigns</p>
          <p className="mt-1 font-display text-2xl font-extrabold text-primary">{promoCodes.length}</p>
        </div>
        <div className="rounded-xl border border-neutral-200/80 bg-white p-4 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-wider text-neutral-500">Active Discounts</p>
          <p className="mt-1 font-display text-2xl font-extrabold text-emerald-600">
            {promoCodes.filter((p) => getStatus(p).label === 'Active').length}
          </p>
        </div>
        <div className="rounded-xl border border-neutral-200/80 bg-white p-4 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-wider text-neutral-500">Total Redemptions</p>
          <p className="mt-1 font-display text-2xl font-extrabold text-primary">
            {promoCodes.reduce((acc, p) => acc + p.usedCount, 0)}
          </p>
        </div>
      </div>

      {/* Promo Codes List */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="font-display text-xl font-bold text-primary">Promotions & Promo Codes</h2>
            <p className="text-xs text-neutral-500">
              Manage promotional campaign discounts, usage limits, and redemption validity.
            </p>
          </div>
        </div>

        {isLoading ? (
          <BookingListSkeleton count={3} />
        ) : (
          <div className="overflow-x-auto rounded-xl border border-neutral-100 bg-white shadow-card">
            <table className="min-w-full text-left text-sm">
              <thead className="border-b border-neutral-100 text-xs font-semibold uppercase tracking-wide text-neutral-500">
                <tr>
                  <th className="px-4 py-3">Code</th>
                  <th className="px-4 py-3">Discount</th>
                  <th className="px-4 py-3">Valid Dates</th>
                  <th className="px-4 py-3">Usage</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {promoCodes.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-8 text-center text-sm text-neutral-500">
                      No promo codes created yet. Add your first campaign below!
                    </td>
                  </tr>
                ) : (
                  promoCodes.map((p) => {
                    const st = getStatus(p)
                    const usagePercent = Math.min(100, Math.round((p.usedCount / p.maxUses) * 100))

                    return (
                      <tr key={p.id} className="border-b border-neutral-50 hover:bg-neutral-50/60">
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <Tag className="h-4 w-4 text-primary opacity-60" />
                            <span className="font-mono font-bold tracking-wider text-primary">{p.code}</span>
                          </div>
                        </td>
                        <td className="px-4 py-3 font-semibold text-emerald-700">{p.discountPercent}% OFF</td>
                        <td className="px-4 py-3 text-xs text-neutral-600">
                          {new Date(p.validFrom).toLocaleDateString()} – {new Date(p.validTo).toLocaleDateString()}
                        </td>
                        <td className="px-4 py-3">
                          <div className="w-32">
                            <div className="flex justify-between text-xs text-neutral-500 mb-1">
                              <span>
                                {p.usedCount} / {p.maxUses}
                              </span>
                              <span>{usagePercent}%</span>
                            </div>
                            <div className="h-1.5 w-full rounded-full bg-neutral-100">
                              <div
                                className="h-1.5 rounded-full bg-primary"
                                style={{ width: `${usagePercent}%` }}
                              />
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold ${st.color}`}>
                            {st.label}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-right">
                          <button
                            type="button"
                            onClick={() => setDeleteTarget(p)}
                            className="text-danger hover:text-danger/80 p-1.5 text-xs font-semibold"
                            title="Delete promo code"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </td>
                      </tr>
                    )
                  })
                )}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* Create Promo Code Form */}
      <section className="rounded-2xl border border-neutral-100 bg-white p-5 shadow-card space-y-4">
        <h3 className="font-display text-lg font-bold text-primary">Create New Promotion</h3>
        <form
          onSubmit={(e: FormEvent) => {
            e.preventDefault()
            createMut.mutate()
          }}
          className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4"
        >
          <div>
            <label className="mb-1 block text-xs font-semibold text-neutral-600">Promo Code</label>
            <input
              required
              placeholder="e.g. LUXURY25"
              value={code}
              onChange={(e) => setCode(e.target.value.toUpperCase())}
              className="w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm font-mono uppercase"
            />
          </div>

          <div>
            <label className="mb-1 block text-xs font-semibold text-neutral-600">Discount Percentage (%)</label>
            <input
              type="number"
              min={1}
              max={100}
              required
              value={discountPercent}
              onChange={(e) => setDiscountPercent(Number(e.target.value))}
              className="w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm"
            />
          </div>

          <div>
            <label className="mb-1 block text-xs font-semibold text-neutral-600">Valid From</label>
            <input
              type="date"
              required
              value={validFrom}
              onChange={(e) => setValidFrom(e.target.value)}
              className="w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm"
            />
          </div>

          <div>
            <label className="mb-1 block text-xs font-semibold text-neutral-600">Valid To</label>
            <input
              type="date"
              required
              value={validTo}
              onChange={(e) => setValidTo(e.target.value)}
              className="w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm"
            />
          </div>

          <div>
            <label className="mb-1 block text-xs font-semibold text-neutral-600">Max Redemptions</label>
            <input
              type="number"
              min={1}
              required
              value={maxUses}
              onChange={(e) => setMaxUses(Number(e.target.value))}
              className="w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm"
            />
          </div>

          <div className="flex items-end sm:col-span-2 lg:col-span-3">
            <button
              type="submit"
              disabled={createMut.isPending}
              className="inline-flex items-center gap-2 rounded-full bg-primary px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-primary-light disabled:opacity-60"
            >
              <Plus className="h-4 w-4" />
              {createMut.isPending ? 'Creating…' : 'Create Promotion'}
            </button>
          </div>
        </form>
      </section>

      {/* Delete Confirmation Modal */}
      <Modal
        open={!!deleteTarget}
        title="Delete Promo Code?"
        danger
        confirmLabel="Delete"
        confirming={deleteMut.isPending}
        onClose={() => setDeleteTarget(null)}
        onConfirm={() => deleteTarget && deleteMut.mutate(deleteTarget.id)}
      >
        {deleteTarget && (
          <p>
            Are you sure you want to delete promo code <strong>{deleteTarget.code}</strong>? Guests will no longer be able to redeem this discount.
          </p>
        )}
      </Modal>
    </div>
  )
}
