import { useState, type FormEvent } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  createRoom,
  createRoomType,
  deleteRoom,
  deleteRoomType,
  listAllRooms,
  listRoomTypes,
  updateRoom,
  updateRoomType,
} from '../../api/hotel'
import { AdminImageField } from '../../components/admin/AdminImageField'
import { Modal } from '../../components/ui/Modal'
import { BookingListSkeleton } from '../../components/ui/Skeletons'
import { toast } from '../../store/toastStore'
import type { Room, RoomStatus, RoomType } from '../../types/api'

export function AdminRoomsPage() {
  const queryClient = useQueryClient()
  const typesQuery = useQuery({ queryKey: ['room-types'], queryFn: listRoomTypes })
  const roomsQuery = useQuery({ queryKey: ['rooms-admin-all'], queryFn: listAllRooms })

  const [deleteType, setDeleteType] = useState<RoomType | null>(null)
  const [deleteRoomTarget, setDeleteRoomTarget] = useState<Room | null>(null)
  const [editingType, setEditingType] = useState<RoomType | null>(null)

  const invalidate = () => {
    void queryClient.invalidateQueries({ queryKey: ['room-types'] })
    void queryClient.invalidateQueries({ queryKey: ['rooms-admin-all'] })
  }

  const deleteTypeMut = useMutation({
    mutationFn: (id: string) => deleteRoomType(id),
    onSuccess: () => {
      toast('Room type deleted', 'success')
      setDeleteType(null)
      invalidate()
    },
    onError: (err: unknown) =>
      toast(
        (err as { response?: { data?: { error?: string } } })?.response?.data?.error ??
          'Delete failed',
        'error',
      ),
  })

  const deleteRoomMut = useMutation({
    mutationFn: (id: string) => deleteRoom(id),
    onSuccess: () => {
      toast('Room deleted', 'success')
      setDeleteRoomTarget(null)
      invalidate()
    },
    onError: (err: unknown) =>
      toast(
        (err as { response?: { data?: { error?: string } } })?.response?.data?.error ??
          'Delete failed',
        'error',
      ),
  })

  return (
    <div className="space-y-10">
      <RoomTypeSection
        types={typesQuery.data?.roomTypes ?? []}
        loading={typesQuery.isLoading}
        editing={editingType}
        onEdit={setEditingType}
        onAskDelete={setDeleteType}
        onSaved={() => {
          setEditingType(null)
          invalidate()
        }}
      />

      <RoomSection
        rooms={roomsQuery.data?.rooms ?? []}
        types={typesQuery.data?.roomTypes ?? []}
        loading={roomsQuery.isLoading}
        onAskDelete={setDeleteRoomTarget}
        onSaved={invalidate}
      />

      <Modal
        open={!!deleteType}
        title="Delete room type?"
        danger
        confirmLabel="Delete"
        confirming={deleteTypeMut.isPending}
        onClose={() => setDeleteType(null)}
        onConfirm={() => deleteType && deleteTypeMut.mutate(deleteType.id)}
      >
        {deleteType && (
          <p>
            Delete <strong>{deleteType.name}</strong>? This fails if rooms still use this type.
          </p>
        )}
      </Modal>

      <Modal
        open={!!deleteRoomTarget}
        title="Delete room?"
        danger
        confirmLabel="Delete"
        confirming={deleteRoomMut.isPending}
        onClose={() => setDeleteRoomTarget(null)}
        onConfirm={() => deleteRoomTarget && deleteRoomMut.mutate(deleteRoomTarget.id)}
      >
        {deleteRoomTarget && (
          <p>
            Delete room <strong>#{deleteRoomTarget.roomNumber}</strong>? Active bookings may block
            this.
          </p>
        )}
      </Modal>
    </div>
  )
}

function RoomTypeSection({
  types,
  loading,
  editing,
  onEdit,
  onAskDelete,
  onSaved,
}: {
  types: RoomType[]
  loading: boolean
  editing: RoomType | null
  onEdit: (t: RoomType | null) => void
  onAskDelete: (t: RoomType) => void
  onSaved: () => void
}) {
  const [name, setName] = useState('')
  const [basePrice, setBasePrice] = useState(100)
  const [capacity, setCapacity] = useState(2)
  const [description, setDescription] = useState('')
  const [amenities, setAmenities] = useState('')
  const [images, setImages] = useState<string[]>([])

  function loadEdit(t: RoomType) {
    onEdit(t)
    setName(t.name)
    setBasePrice(t.basePrice)
    setCapacity(t.capacity)
    setDescription(t.description ?? '')
    setAmenities(t.amenities.join(', '))
    setImages(t.images)
  }

  function resetForm() {
    onEdit(null)
    setName('')
    setBasePrice(100)
    setCapacity(2)
    setDescription('')
    setAmenities('')
    setImages([])
  }

  const saveMut = useMutation({
    mutationFn: async () => {
      const payload = {
        name,
        basePrice,
        capacity,
        description: description || undefined,
        amenities: amenities
          .split(',')
          .map((s) => s.trim())
          .filter(Boolean),
        images,
      }
      if (editing) return updateRoomType(editing.id, payload)
      return createRoomType(payload)
    },
    onSuccess: () => {
      toast(editing ? 'Room type updated' : 'Room type created', 'success')
      resetForm()
      onSaved()
    },
    onError: (err: unknown) =>
      toast(
        (err as { response?: { data?: { error?: string } } })?.response?.data?.error ?? 'Save failed',
        'error',
      ),
  })

  return (
    <section className="space-y-4">
      <h2 className="font-display text-2xl">Room types</h2>
      {loading && <BookingListSkeleton count={2} />}
      <div className="overflow-x-auto rounded-xl border border-neutral-100 bg-white shadow-card">
        <table className="min-w-full text-left text-sm">
          <thead className="border-b border-neutral-100 text-neutral-500">
            <tr>
              <th className="px-3 py-2 font-medium">Name</th>
              <th className="px-3 py-2 font-medium">Price</th>
              <th className="px-3 py-2 font-medium">Capacity</th>
              <th className="px-3 py-2 font-medium" />
            </tr>
          </thead>
          <tbody>
            {types.map((t) => (
              <tr key={t.id} className="border-b border-neutral-50">
                <td className="px-3 py-2">{t.name}</td>
                <td className="px-3 py-2">${t.basePrice.toFixed(2)}</td>
                <td className="px-3 py-2">{t.capacity}</td>
                <td className="space-x-2 px-3 py-2 text-right">
                  <button type="button" className="text-accent hover:underline" onClick={() => loadEdit(t)}>
                    Edit
                  </button>
                  <button type="button" className="text-danger hover:underline" onClick={() => onAskDelete(t)}>
                    Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <form
        onSubmit={(e: FormEvent) => {
          e.preventDefault()
          saveMut.mutate()
        }}
        className="space-y-3 rounded-xl border border-neutral-100 bg-white shadow-card p-4"
      >
        <h3 className="font-medium">{editing ? `Edit ${editing.name}` : 'Create room type'}</h3>
        <div className="grid gap-3 sm:grid-cols-2">
          <input required placeholder="Name" value={name} onChange={(e) => setName(e.target.value)} className="rounded-md border border-neutral-300 px-3 py-2" />
          <input type="number" min={0} step="0.01" required value={basePrice} onChange={(e) => setBasePrice(Number(e.target.value))} className="rounded-md border border-neutral-300 px-3 py-2" />
          <input type="number" min={1} required value={capacity} onChange={(e) => setCapacity(Number(e.target.value))} className="rounded-md border border-neutral-300 px-3 py-2" />
          <input placeholder="Amenities (comma-separated)" value={amenities} onChange={(e) => setAmenities(e.target.value)} className="rounded-md border border-neutral-300 px-3 py-2" />
          <textarea placeholder="Description" value={description} onChange={(e) => setDescription(e.target.value)} className="rounded-md border border-neutral-300 px-3 py-2 sm:col-span-2" rows={2} />
        </div>
        <AdminImageField images={images} onChange={setImages} />
        <div className="flex gap-2">
          <button type="submit" disabled={saveMut.isPending} className="rounded-full bg-primary px-4 py-2 text-sm font-semibold text-white transition hover:bg-primary-light disabled:opacity-60">
            {saveMut.isPending ? 'Saving…' : editing ? 'Update type' : 'Create type'}
          </button>
          {editing && (
            <button type="button" onClick={resetForm} className="rounded-md border border-neutral-300 px-4 py-2 text-sm">
              Cancel edit
            </button>
          )}
        </div>
      </form>
    </section>
  )
}

function RoomSection({
  rooms,
  types,
  loading,
  onAskDelete,
  onSaved,
}: {
  rooms: Room[]
  types: RoomType[]
  loading: boolean
  onAskDelete: (r: Room) => void
  onSaved: () => void
}) {
  const [roomTypeId, setRoomTypeId] = useState('')
  const [roomNumber, setRoomNumber] = useState('')
  const [floor, setFloor] = useState(1)
  const [status, setStatus] = useState<RoomStatus>('available')

  const createMut = useMutation({
    mutationFn: () => createRoom({ roomTypeId, roomNumber, floor, status }),
    onSuccess: () => {
      toast('Room created', 'success')
      setRoomNumber('')
      onSaved()
    },
    onError: (err: unknown) =>
      toast(
        (err as { response?: { data?: { error?: string } } })?.response?.data?.error ?? 'Create failed',
        'error',
      ),
  })

  const statusMut = useMutation({
    mutationFn: ({ id, status }: { id: string; status: RoomStatus }) => updateRoom(id, { status }),
    onSuccess: () => {
      toast('Room status updated', 'success')
      onSaved()
    },
    onError: (err: unknown) =>
      toast(
        (err as { response?: { data?: { error?: string } } })?.response?.data?.error ?? 'Update failed',
        'error',
      ),
  })

  return (
    <section className="space-y-4">
      <h2 className="font-display text-2xl">Rooms</h2>
      {loading && <BookingListSkeleton count={3} />}
      <div className="overflow-x-auto rounded-xl border border-neutral-100 bg-white shadow-card">
        <table className="min-w-full text-left text-sm">
          <thead className="border-b border-neutral-100 text-neutral-500">
            <tr>
              <th className="px-3 py-2 font-medium">Number</th>
              <th className="px-3 py-2 font-medium">Type</th>
              <th className="px-3 py-2 font-medium">Floor</th>
              <th className="px-3 py-2 font-medium">Status</th>
              <th className="px-3 py-2 font-medium" />
            </tr>
          </thead>
          <tbody>
            {rooms.map((r) => (
              <tr key={r.id} className="border-b border-neutral-50">
                <td className="px-3 py-2">#{r.roomNumber}</td>
                <td className="px-3 py-2">{r.roomType?.name ?? r.roomTypeId}</td>
                <td className="px-3 py-2">{r.floor}</td>
                <td className="px-3 py-2">
                  <select
                    value={r.status}
                    onChange={(e) =>
                      statusMut.mutate({ id: r.id, status: e.target.value as RoomStatus })
                    }
                    className="rounded border border-neutral-300 px-2 py-1"
                  >
                    <option value="available">available</option>
                    <option value="occupied">occupied</option>
                    <option value="maintenance">maintenance</option>
                  </select>
                </td>
                <td className="px-3 py-2 text-right">
                  <button type="button" className="text-danger hover:underline" onClick={() => onAskDelete(r)}>
                    Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <form
        onSubmit={(e) => {
          e.preventDefault()
          createMut.mutate()
        }}
        className="grid gap-3 rounded-xl border border-neutral-100 bg-white shadow-card p-4 sm:grid-cols-2 lg:grid-cols-5"
      >
        <select
          required
          value={roomTypeId}
          onChange={(e) => setRoomTypeId(e.target.value)}
          className="rounded-md border border-neutral-300 px-3 py-2"
        >
          <option value="">Room type</option>
          {types.map((t) => (
            <option key={t.id} value={t.id}>
              {t.name}
            </option>
          ))}
        </select>
        <input required placeholder="Room number" value={roomNumber} onChange={(e) => setRoomNumber(e.target.value)} className="rounded-md border border-neutral-300 px-3 py-2" />
        <input type="number" required value={floor} onChange={(e) => setFloor(Number(e.target.value))} className="rounded-md border border-neutral-300 px-3 py-2" />
        <select value={status} onChange={(e) => setStatus(e.target.value as RoomStatus)} className="rounded-md border border-neutral-300 px-3 py-2">
          <option value="available">available</option>
          <option value="occupied">occupied</option>
          <option value="maintenance">maintenance</option>
        </select>
        <button type="submit" disabled={createMut.isPending} className="rounded-full bg-primary px-4 py-2 font-semibold text-white transition hover:bg-primary-light disabled:opacity-60">
          {createMut.isPending ? 'Creating…' : 'Add room'}
        </button>
      </form>
    </section>
  )
}
