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
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid')
  const [floorFilter, setFloorFilter] = useState<string>('all')
  const [statusFilter, setStatusFilter] = useState<string>('all')
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

  // Distinct floors sorted
  const floors = Array.from(new Set(rooms.map((r) => r.floor))).sort((a, b) => a - b)

  const filteredRooms = rooms.filter((r) => {
    if (floorFilter !== 'all' && r.floor !== Number(floorFilter)) return false
    if (statusFilter !== 'all' && r.status !== statusFilter) return false
    return true
  })

  // Group filtered rooms by floor
  const roomsByFloor = floors.reduce<Record<number, Room[]>>((acc, f) => {
    const matching = filteredRooms.filter((r) => r.floor === f)
    if (matching.length > 0) acc[f] = matching
    return acc
  }, {})

  const statusBorderClass: Record<RoomStatus, string> = {
    available: 'border-emerald-200 bg-emerald-50/30 hover:border-emerald-400',
    occupied: 'border-blue-200 bg-blue-50/30 hover:border-blue-400',
    maintenance: 'border-amber-200 bg-amber-50/30 hover:border-amber-400',
  }

  const statusDotClass: Record<RoomStatus, string> = {
    available: 'bg-emerald-500',
    occupied: 'bg-blue-600',
    maintenance: 'bg-amber-500',
  }

  return (
    <section className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="font-display text-2xl font-bold text-primary">Rooms Inventory & Matrix</h2>
          <p className="text-xs text-neutral-500">Monitor physical rooms, floor occupancy, and maintenance states.</p>
        </div>
        <div className="flex items-center gap-2">
          {/* View switcher */}
          <div className="flex rounded-lg border border-neutral-200 bg-neutral-100 p-0.5 text-xs font-semibold">
            <button
              type="button"
              onClick={() => setViewMode('grid')}
              className={`rounded-md px-3 py-1.5 transition ${
                viewMode === 'grid' ? 'bg-white text-primary shadow-sm' : 'text-neutral-600 hover:text-primary'
              }`}
            >
              Floor Plan Grid
            </button>
            <button
              type="button"
              onClick={() => setViewMode('table')}
              className={`rounded-md px-3 py-1.5 transition ${
                viewMode === 'table' ? 'bg-white text-primary shadow-sm' : 'text-neutral-600 hover:text-primary'
              }`}
            >
              Table View
            </button>
          </div>
        </div>
      </div>

      {/* Filter Toolbar */}
      <div className="flex flex-wrap items-center gap-3 rounded-xl border border-neutral-100 bg-white p-3 shadow-sm">
        <div className="flex items-center gap-2">
          <label className="text-xs font-medium text-neutral-500">Floor:</label>
          <select
            value={floorFilter}
            onChange={(e) => setFloorFilter(e.target.value)}
            className="rounded-lg border border-neutral-200 px-2.5 py-1 text-xs text-neutral-700"
          >
            <option value="all">All Floors</option>
            {floors.map((f) => (
              <option key={f} value={f}>
                Floor {f}
              </option>
            ))}
          </select>
        </div>

        <div className="flex items-center gap-2">
          <label className="text-xs font-medium text-neutral-500">Status:</label>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="rounded-lg border border-neutral-200 px-2.5 py-1 text-xs text-neutral-700"
          >
            <option value="all">All Statuses</option>
            <option value="available">Available</option>
            <option value="occupied">Occupied</option>
            <option value="maintenance">Maintenance</option>
          </select>
        </div>

        <div className="ml-auto text-xs text-neutral-500 font-medium">
          Showing {filteredRooms.length} of {rooms.length} rooms
        </div>
      </div>

      {loading && <BookingListSkeleton count={3} />}

      {/* Grid Mode */}
      {viewMode === 'grid' && !loading && (
        <div className="space-y-6">
          {Object.keys(roomsByFloor).length === 0 ? (
            <div className="rounded-xl border border-neutral-100 bg-white p-8 text-center text-sm text-neutral-500">
              No rooms match the selected filters.
            </div>
          ) : (
            Object.entries(roomsByFloor).map(([floorNum, floorRooms]) => (
              <div key={floorNum} className="rounded-2xl border border-neutral-200/80 bg-white p-4 shadow-sm">
                <div className="mb-3 flex items-center justify-between border-b border-neutral-100 pb-2">
                  <h3 className="font-display text-sm font-bold uppercase tracking-wider text-primary">
                    Floor {floorNum}
                  </h3>
                  <span className="text-xs text-neutral-400 font-medium">
                    {floorRooms.length} room{floorRooms.length === 1 ? '' : 's'}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
                  {floorRooms.map((r) => (
                    <div
                      key={r.id}
                      className={`relative flex flex-col justify-between rounded-xl border p-3 transition shadow-xs ${statusBorderClass[r.status]}`}
                    >
                      <div className="flex items-start justify-between">
                        <div>
                          <p className="font-display text-lg font-extrabold text-primary">#{r.roomNumber}</p>
                          <p className="truncate text-xs font-medium text-neutral-600">
                            {r.roomType?.name ?? 'Room'}
                          </p>
                        </div>
                        <span
                          className={`mt-1.5 h-2.5 w-2.5 shrink-0 rounded-full ${statusDotClass[r.status]}`}
                          title={`Status: ${r.status}`}
                        />
                      </div>

                      <div className="mt-3 flex items-center justify-between pt-2 border-t border-black/5">
                        <select
                          value={r.status}
                          disabled={statusMut.isPending}
                          onChange={(e) =>
                            statusMut.mutate({ id: r.id, status: e.target.value as RoomStatus })
                          }
                          className="w-full rounded border border-neutral-300 bg-white/90 px-1.5 py-0.5 text-xs capitalize text-neutral-700 font-medium"
                        >
                          <option value="available">Available</option>
                          <option value="occupied">Occupied</option>
                          <option value="maintenance">Maintenance</option>
                        </select>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* Table Mode */}
      {viewMode === 'table' && !loading && (
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
              {filteredRooms.map((r) => (
                <tr key={r.id} className="border-b border-neutral-50">
                  <td className="px-3 py-2 font-bold text-primary">#{r.roomNumber}</td>
                  <td className="px-3 py-2">{r.roomType?.name ?? r.roomTypeId}</td>
                  <td className="px-3 py-2">{r.floor}</td>
                  <td className="px-3 py-2">
                    <select
                      value={r.status}
                      onChange={(e) =>
                        statusMut.mutate({ id: r.id, status: e.target.value as RoomStatus })
                      }
                      className="rounded border border-neutral-300 px-2 py-1 text-xs capitalize"
                    >
                      <option value="available">available</option>
                      <option value="occupied">occupied</option>
                      <option value="maintenance">maintenance</option>
                    </select>
                  </td>
                  <td className="px-3 py-2 text-right">
                    <button
                      type="button"
                      className="text-danger hover:underline text-xs"
                      onClick={() => onAskDelete(r)}
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Add Room Form */}
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
          className="rounded-md border border-neutral-300 px-3 py-2 text-sm"
        >
          <option value="">Select Room Type</option>
          {types.map((t) => (
            <option key={t.id} value={t.id}>
              {t.name}
            </option>
          ))}
        </select>
        <input
          required
          placeholder="Room number (e.g. 101)"
          value={roomNumber}
          onChange={(e) => setRoomNumber(e.target.value)}
          className="rounded-md border border-neutral-300 px-3 py-2 text-sm"
        />
        <input
          type="number"
          required
          placeholder="Floor"
          value={floor}
          onChange={(e) => setFloor(Number(e.target.value))}
          className="rounded-md border border-neutral-300 px-3 py-2 text-sm"
        />
        <select
          value={status}
          onChange={(e) => setStatus(e.target.value as RoomStatus)}
          className="rounded-md border border-neutral-300 px-3 py-2 text-sm"
        >
          <option value="available">available</option>
          <option value="occupied">occupied</option>
          <option value="maintenance">maintenance</option>
        </select>
        <button
          type="submit"
          disabled={createMut.isPending}
          className="rounded-full bg-primary px-4 py-2 font-semibold text-white transition hover:bg-primary-light disabled:opacity-60 text-sm"
        >
          {createMut.isPending ? 'Creating…' : '+ Add Room'}
        </button>
      </form>
    </section>
  )
}

