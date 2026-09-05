import { useState, useMemo, useEffect, type FormEvent } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  BedDouble,
  ChevronDown,
  LayoutGrid,
  Pencil,
  Plus,
  Search,
  Snowflake,
  Sparkles,
  Table,
  Trash2,
  Tv,
  Users,
  Wifi,
  X,
} from 'lucide-react'
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
  const [isCreateTypeOpen, setIsCreateTypeOpen] = useState(false)
  const [isAddRoomOpen, setIsAddRoomOpen] = useState(false)

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

  const types = typesQuery.data?.roomTypes ?? []
  const rooms = roomsQuery.data?.rooms ?? []

  return (
    <div className="space-y-6">
      {/* SECTION 1: Room types */}
      <RoomTypesSection
        types={types}
        loading={typesQuery.isLoading}
        onCreate={() => {
          setEditingType(null)
          setIsCreateTypeOpen(true)
          toast('Upload a room photo from your device, or paste an image URL.', 'info')
        }}
        onEdit={(t) => {
          setEditingType(t)
          setIsCreateTypeOpen(true)
        }}
        onAskDelete={setDeleteType}
      />

      {/* SECTION 2: Rooms inventory & matrix (Left) & Room status overview (Right) side-by-side */}
      <div className="grid grid-cols-1 gap-6 lg:h-[512px] lg:grid-cols-[1fr_340px] lg:items-stretch xl:grid-cols-[1fr_360px]">
        <RoomsInventorySection
          rooms={rooms}
          types={types}
          loading={roomsQuery.isLoading}
          onAskDelete={setDeleteRoomTarget}
          onSaved={invalidate}
          onAddRoom={() => setIsAddRoomOpen(true)}
        />
        <RoomStatusOverviewSection rooms={rooms} />
      </div>

      {/* Create / Edit Room Type Modal */}
      <CreateOrEditRoomTypeModal
        open={isCreateTypeOpen}
        editing={editingType}
        onClose={() => {
          setIsCreateTypeOpen(false)
          setEditingType(null)
        }}
        onSaved={() => {
          setIsCreateTypeOpen(false)
          setEditingType(null)
          invalidate()
        }}
      />

      {/* Add Room Modal */}
      <CreateRoomModal
        open={isAddRoomOpen}
        types={types}
        onClose={() => setIsAddRoomOpen(false)}
        onSaved={() => {
          setIsAddRoomOpen(false)
          invalidate()
        }}
      />

      {/* Delete Confirmation Modals */}
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

function getAmenityIcon(name: string) {
  const lower = name.toLowerCase()
  if (lower.includes('wifi') || lower.includes('internet')) {
    return <Wifi className="h-3.5 w-3.5" />
  }
  if (
    lower.includes('ac') ||
    lower.includes('air') ||
    lower.includes('cool') ||
    lower.includes('snowflake')
  ) {
    return <Snowflake className="h-3.5 w-3.5" />
  }
  if (lower.includes('tv') || lower.includes('television') || lower.includes('screen')) {
    return <Tv className="h-3.5 w-3.5" />
  }
  return <Sparkles className="h-3.5 w-3.5" />
}

function RoomTypesSection({
  types,
  loading,
  onCreate,
  onEdit,
  onAskDelete,
}: {
  types: RoomType[]
  loading: boolean
  onCreate: () => void
  onEdit: (t: RoomType) => void
  onAskDelete: (t: RoomType) => void
}) {
  const filteredTypes = types

  return (
    <section className="rounded-xl border border-neutral-200/80 bg-white p-6 shadow-sm">
      {/* Header row */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-lg font-bold text-neutral-900">Room types</h2>
          <p className="mt-0.5 text-xs text-neutral-500">
            Manage room categories, pricing, capacity and amenities.
          </p>
        </div>

        <button
          type="button"
          onClick={onCreate}
          className="inline-flex items-center justify-center gap-1.5 rounded-lg bg-primary px-4 py-2 text-xs font-semibold text-white shadow-sm transition hover:bg-primary-light"
        >
          <Plus className="h-3.5 w-3.5" />
          <span>+ Create room type</span>
        </button>
      </div>

      {loading && (
        <div className="mt-4">
          <BookingListSkeleton count={2} />
        </div>
      )}

      {!loading && (
        <div className="mt-4 overflow-x-auto">
          <table className="min-w-full text-left text-sm">
            <thead className="border-b border-neutral-100 text-[11px] font-bold uppercase tracking-wider text-neutral-400">
              <tr>
                <th className="pb-3 pr-4 text-left">TYPE NAME</th>
                <th className="pb-3 px-4 text-left">PRICE / NIGHT</th>
                <th className="pb-3 px-4 text-left">CAPACITY</th>
                <th className="pb-3 px-4 text-left">AMENITIES</th>
                <th className="pb-3 pl-4 text-right">ACTIONS</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100">
              {filteredTypes.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-xs text-neutral-400">
                    No room types found.
                  </td>
                </tr>
              ) : (
                filteredTypes.map((t) => (
                  <tr key={t.id} className="transition hover:bg-neutral-50/50">
                    {/* TYPE NAME */}
                    <td className="py-4 pr-4">
                      <div className="flex items-center gap-4">
                        {t.images && t.images[0] ? (
                          <img
                            src={t.images[0]}
                            alt={t.name}
                            className="h-28 w-44 sm:h-32 sm:w-52 shrink-0 rounded-xl border border-neutral-200 object-cover shadow-sm transition duration-200 hover:scale-[1.02]"
                          />
                        ) : (
                          <div className="flex h-28 w-44 sm:h-32 sm:w-52 shrink-0 items-center justify-center rounded-xl border border-neutral-200 bg-neutral-100 text-neutral-400 shadow-sm">
                            <BedDouble className="h-8 w-8" />
                          </div>
                        )}
                        <div className="min-w-0">
                          <p className="font-bold text-neutral-900 text-base">{t.name}</p>
                          <p className="mt-1 line-clamp-2 max-w-sm text-xs text-neutral-500 leading-relaxed">
                            {t.description || 'Spacious and comfortable room with quality amenities.'}
                          </p>
                        </div>
                      </div>
                    </td>

                    {/* PRICE / NIGHT */}
                    <td className="py-4 px-4 font-bold text-neutral-900 text-sm whitespace-nowrap">
                      ${t.basePrice.toFixed(2)}
                    </td>

                    {/* CAPACITY */}
                    <td className="py-4 px-4 text-xs font-medium text-neutral-700 whitespace-nowrap">
                      <div className="inline-flex items-center gap-1.5">
                        <Users className="h-3.5 w-3.5 text-neutral-400" />
                        <span>{t.capacity} Guests</span>
                      </div>
                    </td>

                    {/* AMENITIES */}
                    <td className="py-4 px-4">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        {t.amenities.slice(0, 3).map((amenity, i) => (
                          <span
                            key={i}
                            className="inline-flex h-7 w-7 items-center justify-center rounded-md border border-neutral-200 bg-neutral-50 text-neutral-600"
                            title={amenity}
                          >
                            {getAmenityIcon(amenity)}
                          </span>
                        ))}
                        {t.amenities.length > 3 && (
                          <span className="inline-flex h-7 items-center justify-center rounded-full bg-neutral-100 px-2 text-[11px] font-semibold text-neutral-600">
                            +{t.amenities.length - 3}
                          </span>
                        )}
                      </div>
                    </td>

                    {/* ACTIONS */}
                    <td className="py-4 pl-4 text-right whitespace-nowrap">
                      <div className="inline-flex items-center justify-end gap-2">
                        <button
                          type="button"
                          onClick={() => onEdit(t)}
                          className="flex h-8 w-8 items-center justify-center rounded-lg border border-neutral-200 bg-white text-neutral-600 shadow-2xs transition hover:border-neutral-300 hover:bg-neutral-50 hover:text-neutral-900"
                          aria-label="Edit room type"
                          title="Edit room type"
                        >
                          <Pencil className="h-3.5 w-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => onAskDelete(t)}
                          className="flex h-8 w-8 items-center justify-center rounded-lg bg-red-50 text-red-600 shadow-2xs transition hover:bg-red-100 hover:text-red-700"
                          aria-label="Delete room type"
                          title="Delete room type"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}
    </section>
  )
}

function CreateOrEditRoomTypeModal({
  open,
  editing,
  onClose,
  onSaved,
}: {
  open: boolean
  editing: RoomType | null
  onClose: () => void
  onSaved: () => void
}) {
  const [name, setName] = useState('')
  const [basePrice, setBasePrice] = useState(100)
  const [capacity, setCapacity] = useState(2)
  const [description, setDescription] = useState('')
  const [amenities, setAmenities] = useState('')
  const [imageUrls, setImageUrls] = useState<string[]>([])
  const [imageFiles, setImageFiles] = useState<File[]>([])

  // Sync state with editing prop
  useEffect(() => {
    if (!open) return
    if (editing) {
      setName(editing.name)
      setBasePrice(editing.basePrice)
      setCapacity(editing.capacity)
      setDescription(editing.description ?? '')
      setAmenities(editing.amenities.join(', '))
      setImageUrls(editing.images ?? [])
    } else {
      setName('')
      setBasePrice(100)
      setCapacity(2)
      setDescription('')
      setAmenities('')
      setImageUrls([])
    }
    setImageFiles([])
  }, [editing, open])

  const saveMut = useMutation({
    mutationFn: async () => {
      const amenitiesList = amenities
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean)
      const payload = {
        name,
        basePrice,
        capacity,
        description: description || undefined,
        amenities: amenitiesList,
        images: imageUrls,
        imageFiles: imageFiles.length ? imageFiles : undefined,
      }
      if (editing) {
        return updateRoomType(editing.id, {
          ...payload,
          description: description || null,
        })
      }
      return createRoomType(payload)
    },
    onSuccess: () => {
      toast(editing ? 'Room type updated' : 'Room type created', 'success')
      onSaved()
    },
    onError: (err: unknown) =>
      toast(
        (err as { response?: { data?: { error?: string } } })?.response?.data?.error ?? 'Save failed',
        'error',
      ),
  })

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-xs">
      <div className="relative w-full max-w-xl max-h-[90vh] overflow-y-auto rounded-2xl bg-white p-6 shadow-xl border border-neutral-200">
        <div className="flex items-center justify-between border-b border-neutral-100 pb-3">
          <h3 className="text-lg font-bold text-neutral-900">
            {editing ? `Edit ${editing.name}` : 'Create room type'}
          </h3>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full p-1 text-neutral-400 hover:bg-neutral-100 hover:text-neutral-700"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        
        <form
          onSubmit={(e: FormEvent) => {
            e.preventDefault()
            saveMut.mutate()
          }}
          className="mt-4 space-y-4"
        >
          <div className="grid gap-4 sm:grid-cols-2">
            {/* Row 1: Name | Price */}
            <div>
              <label className="mb-1.5 block text-xs font-medium text-neutral-500">Name</label>
              <input
                required
                placeholder="Name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full rounded-lg border border-neutral-200 bg-white px-3.5 py-2.5 text-sm text-neutral-900 placeholder:text-neutral-400 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
              />
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-medium text-neutral-500">Price</label>
              <input
                type="number"
                min={0}
                step="0.01"
                required
                placeholder="Price"
                value={basePrice}
                onChange={(e) => setBasePrice(Number(e.target.value))}
                className="w-full rounded-lg border border-neutral-200 bg-white px-3.5 py-2.5 text-sm text-neutral-900 placeholder:text-neutral-400 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
              />
            </div>

            {/* Row 2: Capacity | Amenities */}
            <div>
              <label className="mb-1.5 block text-xs font-medium text-neutral-500">Capacity</label>
              <input
                type="number"
                min={1}
                required
                placeholder="Capacity"
                value={capacity}
                onChange={(e) => setCapacity(Number(e.target.value))}
                className="w-full rounded-lg border border-neutral-200 bg-white px-3.5 py-2.5 text-sm text-neutral-900 placeholder:text-neutral-400 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
              />
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-medium text-neutral-500">
                Amenities (comma-separated)
              </label>
              <input
                placeholder="Amenities (comma-separated)"
                value={amenities}
                onChange={(e) => setAmenities(e.target.value)}
                className="w-full rounded-lg border border-neutral-200 bg-white px-3.5 py-2.5 text-sm text-neutral-900 placeholder:text-neutral-400 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
              />
            </div>

            {/* Row 3: Description */}
            <div className="sm:col-span-2">
              <label className="mb-1.5 block text-xs font-medium text-neutral-500">Description</label>
              <textarea
                placeholder="Description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={3}
                className="w-full resize-y rounded-lg border border-neutral-200 bg-white px-3.5 py-2.5 text-sm text-neutral-900 placeholder:text-neutral-400 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
              />
            </div>

            {/* Row 4: Images — multipart file upload + URL fallback */}
            <div className="sm:col-span-2">
              <AdminImageField
                imageUrls={imageUrls}
                onUrlsChange={setImageUrls}
                imageFiles={imageFiles}
                onFilesChange={setImageFiles}
              />
            </div>
          </div>

          <div className="flex items-center justify-end gap-2 border-t border-neutral-100 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg border border-neutral-200 bg-white px-4 py-2.5 text-sm font-medium text-neutral-700 transition hover:bg-neutral-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saveMut.isPending}
              className="inline-flex items-center justify-center rounded-lg bg-primary px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-primary-light disabled:opacity-60"
            >
              {saveMut.isPending ? 'Saving…' : editing ? 'Update type' : 'Create type'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

function RoomsInventorySection({
  rooms,
  types,
  loading,
  onAskDelete,
  onSaved,
  onAddRoom,
}: {
  rooms: Room[]
  types: RoomType[]
  loading: boolean
  onAskDelete: (r: Room) => void
  onSaved: () => void
  onAddRoom: () => void
}) {
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid')
  const [floorFilter, setFloorFilter] = useState<string>('all')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [typeFilter, setTypeFilter] = useState<string>('all')
  const [roomSearch, setRoomSearch] = useState('')

  const statusMut = useMutation({
    mutationFn: ({ id, status }: { id: string; status: RoomStatus }) => updateRoom(id, { status }),
    onSuccess: () => {
      toast('Room status updated', 'success')
      onSaved()
    },
    onError: (err: unknown) =>
      toast(
        (err as { response?: { data?: { error?: string } } })?.response?.data?.error ??
          'Update failed',
        'error',
      ),
  })

  // Distinct floors sorted
  const floors = useMemo(
    () => Array.from(new Set(rooms.map((r) => r.floor))).sort((a, b) => a - b),
    [rooms],
  )

  const filteredRooms = useMemo(() => {
    return rooms.filter((r) => {
      if (floorFilter !== 'all' && r.floor !== Number(floorFilter)) return false
      if (statusFilter !== 'all' && r.status !== statusFilter) return false
      if (typeFilter !== 'all' && r.roomTypeId !== typeFilter) return false
      if (roomSearch.trim()) {
        const q = roomSearch.trim().toLowerCase()
        const matchesNum = r.roomNumber.toLowerCase().includes(q)
        const matchesType = (r.roomType?.name ?? '').toLowerCase().includes(q)
        if (!matchesNum && !matchesType) return false
      }
      return true
    })
  }, [rooms, floorFilter, statusFilter, typeFilter, roomSearch])

  // Group filtered rooms by floor
  const roomsByFloor = useMemo(() => {
    return floors.reduce<Record<number, Room[]>>((acc, f) => {
      const matching = filteredRooms.filter((r) => r.floor === f)
      if (matching.length > 0) acc[f] = matching
      return acc
    }, {})
  }, [floors, filteredRooms])


  const statusDotClass: Record<RoomStatus, string> = {
    available: 'bg-green-500',
    occupied: 'bg-blue-500',
    maintenance: 'bg-yellow-500',
  }

  const statusPillClass: Record<RoomStatus, string> = {
    available: 'bg-green-50 text-green-700 border-green-200/60',
    occupied: 'bg-blue-50 text-blue-700 border-blue-200/60',
    maintenance: 'bg-yellow-50 text-yellow-700 border-yellow-200/60',
  }

  return (
    <section className="flex h-full min-h-0 flex-col rounded-xl border border-neutral-200/80 bg-white p-6 shadow-sm">
      {/* Header row */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-lg font-bold text-neutral-900">Rooms inventory & matrix</h2>
          <p className="mt-0.5 text-xs text-neutral-500">
            Monitor physical rooms, floor occupancy, and maintenance states.
          </p>
        </div>

        {/* View toggles & Add room */}
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => setViewMode('grid')}
              className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition ${
                viewMode === 'grid'
                  ? 'bg-primary text-white shadow-sm'
                  : 'border border-neutral-200 bg-white text-neutral-600 hover:bg-neutral-50'
              }`}
            >
              <LayoutGrid className="h-3.5 w-3.5" />
              <span>Grid</span>
            </button>
            <button
              type="button"
              onClick={() => setViewMode('table')}
              className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition ${
                viewMode === 'table'
                  ? 'bg-primary text-white shadow-sm'
                  : 'border border-neutral-200 bg-white text-neutral-600 hover:bg-neutral-50'
              }`}
            >
              <Table className="h-3.5 w-3.5" />
              <span>Table</span>
            </button>
          </div>

          <button
            type="button"
            onClick={onAddRoom}
            className="inline-flex items-center justify-center gap-1.5 rounded-lg bg-primary px-3.5 py-1.5 text-xs font-semibold text-white shadow-sm transition hover:bg-primary-light"
          >
            <Plus className="h-3.5 w-3.5" />
            <span>+ Add room</span>
          </button>
        </div>
      </div>

      {/* Filter row */}
      <div className="mt-5 flex flex-wrap items-end justify-between gap-4 border-b border-neutral-100 pb-4">
        <div className="flex flex-wrap items-center gap-4">
          {/* Floor */}
          <div>
            <label className="mb-1 block text-xs font-medium text-neutral-500">Floor</label>
            <div className="relative">
              <select
                value={floorFilter}
                onChange={(e) => setFloorFilter(e.target.value)}
                className="appearance-none rounded-lg border border-neutral-200 bg-white py-1.5 pl-3 pr-8 text-xs font-medium text-neutral-700 shadow-2xs focus:border-primary focus:outline-none"
              >
                <option value="all">All Floors</option>
                {floors.map((f) => (
                  <option key={f} value={f}>
                    Floor {f}
                  </option>
                ))}
              </select>
              <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-neutral-400" />
            </div>
          </div>

          {/* Status */}
          <div>
            <label className="mb-1 block text-xs font-medium text-neutral-500">Status</label>
            <div className="relative">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="appearance-none rounded-lg border border-neutral-200 bg-white py-1.5 pl-3 pr-8 text-xs font-medium text-neutral-700 shadow-2xs focus:border-primary focus:outline-none"
              >
                <option value="all">All Status</option>
                <option value="available">Available</option>
                <option value="occupied">Occupied</option>
                <option value="maintenance">Maintenance</option>
              </select>
              <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-neutral-400" />
            </div>
          </div>

          {/* Room Type */}
          <div>
            <label className="mb-1 block text-xs font-medium text-neutral-500">Room Type</label>
            <div className="relative">
              <select
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value)}
                className="appearance-none rounded-lg border border-neutral-200 bg-white py-1.5 pl-3 pr-8 text-xs font-medium text-neutral-700 shadow-2xs focus:border-primary focus:outline-none"
              >
                <option value="all">All Types</option>
                {types.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.name}
                  </option>
                ))}
              </select>
              <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-neutral-400" />
            </div>
          </div>
        </div>

        {/* Search room number on right */}
        <div className="relative w-full sm:w-auto">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-neutral-400" />
          <input
            type="text"
            value={roomSearch}
            onChange={(e) => setRoomSearch(e.target.value)}
            placeholder="Search room number..."
            className="w-full sm:w-52 rounded-lg border border-neutral-200 bg-white py-1.5 pl-8 pr-3 text-xs text-neutral-800 placeholder:text-neutral-400 shadow-2xs focus:border-primary focus:outline-none"
          />
        </div>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto pr-1">
        {loading && (
          <div className="mt-6">
            <BookingListSkeleton count={3} />
          </div>
        )}

        {/* Main Content: Floor Plan Grid */}
        {viewMode === 'grid' && !loading && (
          <div className="mt-6 space-y-6">
          {Object.keys(roomsByFloor).length === 0 ? (
            <div className="rounded-xl border border-dashed border-neutral-200 p-8 text-center text-xs text-neutral-400">
              No rooms match the selected filters.
            </div>
          ) : (
            Object.entries(roomsByFloor).map(([floorNum, floorRooms], idx) => (
              <div
                key={floorNum}
                className={`flex flex-col gap-4 sm:flex-row sm:items-start ${
                  idx !== 0 ? 'border-t border-neutral-100 pt-6' : ''
                }`}
              >
                {/* Left: Floor label bold + room count */}
                <div className="w-full sm:w-32 shrink-0">
                  <h4 className="text-sm font-bold uppercase tracking-wider text-neutral-900">
                    FLOOR {floorNum}
                  </h4>
                  <p className="mt-0.5 text-xs text-neutral-400">
                    {floorRooms.length} {floorRooms.length === 1 ? 'room' : 'rooms'}
                  </p>
                </div>

                {/* Right: Room cards flex/grid row */}
                <div className="flex flex-1 flex-wrap gap-3">
                  {floorRooms.map((r) => (
                    <div
                      key={r.id}
                      className="w-full sm:w-[155px] min-w-[140px] rounded-xl border border-neutral-200/80 bg-white p-3 shadow-2xs transition hover:border-neutral-300"
                    >
                      {/* Top row: room number + status dot */}
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-neutral-900 text-sm">
                          #{r.roomNumber}
                        </span>
                        <span
                          className={`h-2 w-2 rounded-full ${statusDotClass[r.status]}`}
                          title={`Status: ${r.status}`}
                        />
                      </div>

                      {/* Room type name */}
                      <p className="mt-1 truncate text-xs text-neutral-500 font-medium">
                        {r.roomType?.name ?? 'Standard Room'}
                      </p>

                      {/* Status pill badge with select for status updating */}
                      <div className="relative mt-3">
                        <select
                          value={r.status}
                          disabled={statusMut.isPending}
                          onChange={(e) =>
                            statusMut.mutate({ id: r.id, status: e.target.value as RoomStatus })
                          }
                          className={`w-full cursor-pointer appearance-none rounded-full border px-2.5 py-1 pr-6 text-center text-xs font-semibold capitalize transition ${statusPillClass[r.status]}`}
                        >
                          <option value="available">Available</option>
                          <option value="occupied">Occupied</option>
                          <option value="maintenance">Maintenance</option>
                        </select>
                        <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 h-3 w-3 -translate-y-1/2 opacity-60" />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))
          )}
          </div>
        )}

        {/* Table View */}
        {viewMode === 'table' && !loading && (
          <div className="mt-6 overflow-x-auto">
          <table className="min-w-full text-left text-sm">
            <thead className="border-b border-neutral-100 text-[11px] font-bold uppercase tracking-wider text-neutral-400">
              <tr>
                <th className="pb-3 pr-4 font-semibold">NUMBER</th>
                <th className="pb-3 px-4 font-semibold">TYPE</th>
                <th className="pb-3 px-4 font-semibold">FLOOR</th>
                <th className="pb-3 px-4 font-semibold">STATUS</th>
                <th className="pb-3 pl-4 text-right font-semibold">ACTIONS</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100">
              {filteredRooms.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-xs text-neutral-400">
                    No rooms match the selected filters.
                  </td>
                </tr>
              ) : (
                filteredRooms.map((r) => (
                  <tr key={r.id} className="transition hover:bg-neutral-50/50">
                    <td className="py-3.5 pr-4 font-bold text-neutral-900">#{r.roomNumber}</td>
                    <td className="py-3.5 px-4 text-neutral-600">
                      {r.roomType?.name ?? r.roomTypeId}
                    </td>
                    <td className="py-3.5 px-4 text-neutral-600">Floor {r.floor}</td>
                    <td className="py-3.5 px-4">
                      <div className="relative inline-block min-w-[130px]">
                        <select
                          value={r.status}
                          disabled={statusMut.isPending}
                          onChange={(e) =>
                            statusMut.mutate({ id: r.id, status: e.target.value as RoomStatus })
                          }
                          className={`w-full appearance-none rounded-full border py-1 pl-3 pr-7 text-xs font-semibold capitalize transition ${statusPillClass[r.status]}`}
                        >
                          <option value="available">Available</option>
                          <option value="occupied">Occupied</option>
                          <option value="maintenance">Maintenance</option>
                        </select>
                        <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 h-3 w-3 -translate-y-1/2 opacity-60" />
                      </div>
                    </td>
                    <td className="py-3.5 pl-4 text-right">
                      <button
                        type="button"
                        className="flex h-8 w-8 items-center justify-center rounded-lg bg-red-50 text-red-600 shadow-2xs transition hover:bg-red-100 hover:text-red-700 ml-auto"
                        aria-label="Delete room"
                        title="Delete room"
                        onClick={() => onAskDelete(r)}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
          </div>
        )}
      </div>
    </section>
  )
}

function CreateRoomModal({
  open,
  types,
  onClose,
  onSaved,
}: {
  open: boolean
  types: RoomType[]
  onClose: () => void
  onSaved: () => void
}) {
  const [roomTypeId, setRoomTypeId] = useState('')
  const [roomNumber, setRoomNumber] = useState('')
  const [floor, setFloor] = useState(1)
  const [status, setStatus] = useState<RoomStatus>('available')

  const resetForm = () => {
    setRoomTypeId('')
    setRoomNumber('')
    setFloor(1)
    setStatus('available')
  }

  const handleClose = () => {
    resetForm()
    onClose()
  }

  const createMut = useMutation({
    mutationFn: () => createRoom({ roomTypeId, roomNumber, floor, status }),
    onSuccess: () => {
      toast('Room created', 'success')
      resetForm()
      onSaved()
    },
    onError: (err: unknown) =>
      toast(
        (err as { response?: { data?: { error?: string } } })?.response?.data?.error ??
          'Create failed',
        'error',
      ),
  })

  if (!open) return null

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-xs"
      onClick={(e) => {
        if (e.target === e.currentTarget) handleClose()
      }}
    >
      <div className="relative w-full max-w-md max-h-[90vh] overflow-y-auto rounded-2xl bg-white p-6 shadow-xl border border-neutral-200">
        <div className="flex items-center justify-between border-b border-neutral-100 pb-3">
          <div>
            <h3 className="text-base sm:text-lg font-bold text-neutral-900">Add room</h3>
            <p className="mt-0.5 text-xs text-neutral-500">
              Add a new room to your hotel inventory.
            </p>
          </div>
          <button
            type="button"
            onClick={handleClose}
            className="rounded-full p-1 text-neutral-400 hover:bg-neutral-100 hover:text-neutral-700 transition"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <form
          onSubmit={(e: FormEvent) => {
            e.preventDefault()
            createMut.mutate()
          }}
          className="mt-4 space-y-4"
        >
          {/* 1. Room Type */}
          <div>
            <label className="mb-1.5 block text-xs font-medium text-neutral-500">Room Type</label>
            <div className="relative">
              <select
                required
                value={roomTypeId}
                onChange={(e) => setRoomTypeId(e.target.value)}
                className="w-full appearance-none rounded-lg border border-neutral-200 bg-white px-3.5 py-2.5 pr-8 text-sm text-neutral-800 transition focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary shadow-2xs"
              >
                <option value="">Select room type</option>
                {types.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.name}
                  </option>
                ))}
              </select>
              <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-400" />
            </div>
          </div>

          {/* 2. Room Number & Floor */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1.5 block text-xs font-medium text-neutral-500">Room Number</label>
              <input
                required
                placeholder="e.g. 101"
                value={roomNumber}
                onChange={(e) => setRoomNumber(e.target.value)}
                className="w-full rounded-lg border border-neutral-200 bg-white px-3.5 py-2.5 text-sm text-neutral-800 placeholder:text-neutral-400 transition focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary shadow-2xs"
              />
            </div>

            <div>
              <label className="mb-1.5 block text-xs font-medium text-neutral-500">Floor</label>
              <input
                type="number"
                min={1}
                required
                placeholder="e.g. 1"
                value={floor}
                onChange={(e) => setFloor(Number(e.target.value))}
                className="w-full rounded-lg border border-neutral-200 bg-white px-3.5 py-2.5 text-sm text-neutral-800 placeholder:text-neutral-400 transition focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary shadow-2xs"
              />
            </div>
          </div>

          {/* 3. Status */}
          <div>
            <label className="mb-1.5 block text-xs font-medium text-neutral-500">Status</label>
            <div className="relative">
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as RoomStatus)}
                className="w-full appearance-none rounded-lg border border-neutral-200 bg-white px-3.5 py-2.5 pr-8 text-sm capitalize text-neutral-800 transition focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary shadow-2xs"
              >
                <option value="available">Available</option>
                <option value="occupied">Occupied</option>
                <option value="maintenance">Maintenance</option>
              </select>
              <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-400" />
            </div>
          </div>

          <div className="flex items-center justify-end gap-2 border-t border-neutral-100 pt-4">
            <button
              type="button"
              onClick={handleClose}
              className="rounded-lg border border-neutral-200 bg-white px-4 py-2 text-sm font-medium text-neutral-700 transition hover:bg-neutral-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={createMut.isPending}
              className="inline-flex items-center justify-center gap-1.5 rounded-lg bg-primary px-5 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-primary-light disabled:opacity-60"
            >
              <Plus className="h-4 w-4" />
              <span>{createMut.isPending ? 'Adding…' : 'Add Room'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

function RoomStatusOverviewSection({ rooms }: { rooms: Room[] }) {
  const countAvailable = useMemo(
    () => rooms.filter((r) => r.status === 'available').length,
    [rooms],
  )
  const countOccupied = useMemo(
    () => rooms.filter((r) => r.status === 'occupied').length,
    [rooms],
  )
  const countMaintenance = useMemo(
    () => rooms.filter((r) => r.status === 'maintenance').length,
    [rooms],
  )
  const totalRooms = rooms.length

  const availablePercent = totalRooms > 0 ? Math.round((countAvailable / totalRooms) * 100) : 0
  const occupiedPercent = totalRooms > 0 ? Math.round((countOccupied / totalRooms) * 100) : 0
  const maintenancePercent = totalRooms > 0 ? Math.round((countMaintenance / totalRooms) * 100) : 0

  return (
    <section className="h-full rounded-xl border border-neutral-200/80 bg-white p-5 shadow-sm">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-base font-bold text-neutral-900">Room status overview</h2>
          <p className="mt-0.5 text-xs text-neutral-500">Live occupancy breakdown.</p>
        </div>
        <span className="rounded-full bg-neutral-100 px-2.5 py-0.5 text-xs font-bold text-neutral-800">
          {totalRooms} {totalRooms === 1 ? 'Room' : 'Rooms'}
        </span>
      </div>

      {/* 4 Stat Cards in 2x2 grid */}
      <div className="mt-4 grid grid-cols-2 gap-2.5">
        {/* Available */}
        <div className="rounded-xl border border-green-100 bg-green-50/50 p-3 transition">
          <div className="flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full bg-green-500" />
            <span className="text-[11px] font-semibold text-green-800">Available</span>
          </div>
          <p className="mt-1.5 text-xl font-bold text-neutral-900">{countAvailable}</p>
          <p className="mt-0.5 text-[10px] text-green-700 font-medium">
            {availablePercent}% of total
          </p>
        </div>

        {/* Occupied */}
        <div className="rounded-xl border border-blue-100 bg-blue-50/50 p-3 transition">
          <div className="flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full bg-blue-500" />
            <span className="text-[11px] font-semibold text-blue-800">Occupied</span>
          </div>
          <p className="mt-1.5 text-xl font-bold text-neutral-900">{countOccupied}</p>
          <p className="mt-0.5 text-[10px] text-blue-700 font-medium">
            {occupiedPercent}% of total
          </p>
        </div>

        {/* Maintenance */}
        <div className="rounded-xl border border-yellow-100 bg-yellow-50/50 p-3 transition">
          <div className="flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full bg-yellow-500" />
            <span className="text-[11px] font-semibold text-yellow-800">Maintenance</span>
          </div>
          <p className="mt-1.5 text-xl font-bold text-neutral-900">{countMaintenance}</p>
          <p className="mt-0.5 text-[10px] text-yellow-700 font-medium">
            {maintenancePercent}% of total
          </p>
        </div>

        {/* Out of Service */}
        <div className="rounded-xl border border-red-100 bg-red-50/50 p-3 transition">
          <div className="flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full bg-red-500" />
            <span className="text-[11px] font-semibold text-red-800">Out of Service</span>
          </div>
          <p className="mt-1.5 text-xl font-bold text-neutral-900">0</p>
          <p className="mt-0.5 text-[10px] text-neutral-400 font-medium">0% of total</p>
        </div>
      </div>

      {/* Detailed status list */}
      <div className="mt-4 space-y-2">
        <div className="flex items-center justify-between rounded-lg border border-neutral-100 bg-[#f8fafc] px-3 py-2 text-xs">
          <div className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-green-500" />
            <span className="font-medium text-neutral-700">Available</span>
          </div>
          <span className="font-bold text-neutral-900">{countAvailable} rooms</span>
        </div>

        <div className="flex items-center justify-between rounded-lg border border-neutral-100 bg-[#f8fafc] px-3 py-2 text-xs">
          <div className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-blue-500" />
            <span className="font-medium text-neutral-700">Occupied</span>
          </div>
          <span className="font-bold text-neutral-900">{countOccupied} rooms</span>
        </div>

        <div className="flex items-center justify-between rounded-lg border border-neutral-100 bg-[#f8fafc] px-3 py-2 text-xs">
          <div className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-yellow-500" />
            <span className="font-medium text-neutral-700">Maintenance</span>
          </div>
          <span className="font-bold text-neutral-900">{countMaintenance} rooms</span>
        </div>

        <div className="flex items-center justify-between rounded-lg border border-neutral-100 bg-[#f8fafc] px-3 py-2 text-xs">
          <div className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-red-500" />
            <span className="font-medium text-neutral-700">Out of Service</span>
          </div>
          <span className="font-bold text-neutral-900">0 rooms</span>
        </div>
      </div>

      <div className="mt-4 border-t border-neutral-100 pt-3">
        <div className="flex items-center justify-between text-xs font-bold text-neutral-900">
          <span>Total Rooms</span>
          <span className="text-xs font-bold text-neutral-900">{totalRooms} rooms</span>
        </div>
      </div>
    </section>
  )
}

