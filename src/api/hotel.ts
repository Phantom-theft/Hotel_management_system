import { api } from './client'
import type {
  AuthResponse,
  BookingsResponse,
  CancellationsReport,
  CreateBookingResponse,
  OccupancyReport,
  PaymentIntentResponse,
  PromoCode,
  RevenueReport,
  ReviewsResponse,
  Room,
  RoomStatus,
  RoomType,
  RoomsSearchResponse,
  TodaysBookingsResponse,
  User,
  UserRole,
} from '../types/api'

export async function login(email: string, password: string): Promise<AuthResponse> {
  const { data } = await api.post<AuthResponse>('/auth/login', { email, password })
  return data
}

export async function register(input: {
  name: string
  email: string
  password: string
  phone?: string
}): Promise<AuthResponse> {
  const { data } = await api.post<AuthResponse>('/auth/register', input)
  return data
}

export async function logout(): Promise<void> {
  await api.post('/auth/logout')
}

export async function refreshSession(): Promise<AuthResponse> {
  const { data } = await api.post<AuthResponse>('/auth/refresh')
  return data
}

export async function searchRooms(params: {
  checkIn: string
  checkOut: string
  guests?: number
  type?: string
}): Promise<RoomsSearchResponse> {
  const { data } = await api.get<RoomsSearchResponse>('/rooms', { params })
  return data
}

export async function getRoomTypeReviews(
  roomTypeId: string,
  page = 1,
  limit = 10,
): Promise<ReviewsResponse> {
  const { data } = await api.get<ReviewsResponse>(`/roomtypes/${roomTypeId}/reviews`, {
    params: { page, limit },
  })
  return data
}

export async function createReview(input: {
  roomTypeId: string
  rating: number
  comment?: string
}): Promise<{ review: ReviewsResponse['reviews'][number] }> {
  const { data } = await api.post<{ review: ReviewsResponse['reviews'][number] }>(
    '/reviews',
    input,
  )
  return data
}

export async function validatePromoCode(
  code: string,
): Promise<{ valid: true; discountPercent: number } | { valid: false }> {
  const { data } = await api.get<{ valid: true; discountPercent: number } | { valid: false }>(
    '/promo-codes/validate',
    { params: { code } },
  )
  return data
}

export async function createBooking(input: {
  roomId: string
  checkIn: string
  checkOut: string
  guestsCount: number
  promoCode?: string
}): Promise<CreateBookingResponse> {
  const { data } = await api.post<CreateBookingResponse>('/bookings', input)
  return data
}

export async function getMyBookings(): Promise<BookingsResponse> {
  const { data } = await api.get<BookingsResponse>('/bookings/me')
  return data
}

export async function listAllBookings(): Promise<BookingsResponse> {
  const { data } = await api.get<BookingsResponse>('/bookings/admin/all')
  return data
}

export async function cancelBooking(id: string): Promise<CreateBookingResponse> {
  const { data } = await api.patch<CreateBookingResponse>(`/bookings/${id}/cancel`)
  return data
}

export async function staffCancelBooking(id: string): Promise<CreateBookingResponse> {
  const { data } = await api.patch<CreateBookingResponse>(`/bookings/${id}/staff-cancel`)
  return data
}

export async function createPaymentIntent(bookingId: string): Promise<PaymentIntentResponse> {
  const { data } = await api.post<PaymentIntentResponse>('/payments/create-intent', {
    bookingId,
  })
  return data
}

// --- Staff ---

export async function getTodaysBookings(): Promise<TodaysBookingsResponse> {
  const { data } = await api.get<TodaysBookingsResponse>('/bookings/today')
  return data
}

export async function checkInBooking(id: string): Promise<CreateBookingResponse> {
  const { data } = await api.patch<CreateBookingResponse>(`/bookings/${id}/check-in`)
  return data
}

export async function checkOutBooking(id: string): Promise<CreateBookingResponse> {
  const { data } = await api.patch<CreateBookingResponse>(`/bookings/${id}/check-out`)
  return data
}

export async function createWalkIn(input: {
  roomId: string
  checkIn: string
  checkOut: string
  guestsCount: number
  guestName: string
  guestEmail: string
  guestPhone?: string
  promoCode?: string
}): Promise<CreateBookingResponse> {
  const { data } = await api.post<CreateBookingResponse>('/bookings/walk-in', input)
  return data
}

// --- Admin rooms / room types ---

export async function listRoomTypes(): Promise<{ roomTypes: RoomType[] }> {
  const { data } = await api.get<{ roomTypes: RoomType[] }>('/room-types')
  return data
}

export async function createRoomType(input: {
  name: string
  basePrice: number
  capacity: number
  amenities?: string[]
  /** Pasted / existing image URLs */
  images?: string[]
  /** New files sent as multipart (Multer → Cloudinary on the server) */
  imageFiles?: File[]
  description?: string
}): Promise<{ roomType: RoomType }> {
  const { imageFiles, ...rest } = input
  if (imageFiles?.length) {
    const form = new FormData()
    form.append('name', rest.name)
    form.append('basePrice', String(rest.basePrice))
    form.append('capacity', String(rest.capacity))
    if (rest.description) form.append('description', rest.description)
    if (rest.amenities?.length) form.append('amenities', JSON.stringify(rest.amenities))
    if (rest.images?.length) form.append('imageUrls', JSON.stringify(rest.images))
    for (const file of imageFiles) {
      form.append('images', file)
    }
    const { data } = await api.post<{ roomType: RoomType }>('/room-types', form)
    return data
  }

  const { data } = await api.post<{ roomType: RoomType }>('/room-types', {
    name: rest.name,
    basePrice: rest.basePrice,
    capacity: rest.capacity,
    amenities: rest.amenities,
    images: rest.images,
    description: rest.description,
  })
  return data
}

export async function updateRoomType(
  id: string,
  input: Partial<{
    name: string
    basePrice: number
    capacity: number
    amenities: string[]
    images: string[]
    imageFiles: File[]
    description: string | null
  }>,
): Promise<{ roomType: RoomType }> {
  const { imageFiles, ...rest } = input
  if (imageFiles?.length) {
    const form = new FormData()
    if (rest.name != null) form.append('name', rest.name)
    if (rest.basePrice != null) form.append('basePrice', String(rest.basePrice))
    if (rest.capacity != null) form.append('capacity', String(rest.capacity))
    if (rest.description !== undefined) {
      form.append('description', rest.description ?? '')
    }
    if (rest.amenities) form.append('amenities', JSON.stringify(rest.amenities))
    if (rest.images) form.append('imageUrls', JSON.stringify(rest.images))
    for (const file of imageFiles) {
      form.append('images', file)
    }
    const { data } = await api.patch<{ roomType: RoomType }>(`/room-types/${id}`, form)
    return data
  }

  const { data } = await api.patch<{ roomType: RoomType }>(`/room-types/${id}`, rest)
  return data
}

export async function deleteRoomType(id: string): Promise<void> {
  await api.delete(`/room-types/${id}`)
}

export async function listAllRooms(): Promise<{ rooms: Room[] }> {
  const { data } = await api.get<{ rooms: Room[] }>('/rooms/admin/all')
  return data
}

export async function createRoom(input: {
  roomTypeId: string
  roomNumber: string
  floor: number
  status?: RoomStatus
}): Promise<{ room: Room }> {
  const { data } = await api.post<{ room: Room }>('/rooms', input)
  return data
}

export async function updateRoom(
  id: string,
  input: Partial<{
    roomTypeId: string
    roomNumber: string
    floor: number
    status: RoomStatus
  }>,
): Promise<{ room: Room }> {
  const { data } = await api.patch<{ room: Room }>(`/rooms/${id}`, input)
  return data
}

export async function deleteRoom(id: string): Promise<void> {
  await api.delete(`/rooms/${id}`)
}

// --- Reports ---

export async function getOccupancyReport(from: string, to: string): Promise<OccupancyReport> {
  const { data } = await api.get<OccupancyReport>('/reports/occupancy', { params: { from, to } })
  return data
}

export async function getRevenueReport(from: string, to: string): Promise<RevenueReport> {
  const { data } = await api.get<RevenueReport>('/reports/revenue', { params: { from, to } })
  return data
}

export async function getCancellationsReport(
  from: string,
  to: string,
): Promise<CancellationsReport> {
  const { data } = await api.get<CancellationsReport>('/reports/cancellations', {
    params: { from, to },
  })
  return data
}

// --- Staff management ---

export async function listStaff(): Promise<{ staff: User[] }> {
  const { data } = await api.get<{ staff: User[] }>('/staff')
  return data
}

export async function inviteStaff(input: {
  name: string
  email: string
  role: 'staff' | 'admin'
  phone?: string
}): Promise<{ user: User; tempPassword: string }> {
  const { data } = await api.post<{ user: User; tempPassword: string }>('/staff/invite', input)
  return data
}

export async function assignStaffRole(
  id: string,
  role: UserRole,
): Promise<{ user: User }> {
  const { data } = await api.patch<{ user: User }>(`/staff/${id}/role`, { role })
  return data
}

export async function deactivateStaff(id: string): Promise<{ user: User }> {
  const { data } = await api.patch<{ user: User }>(`/staff/${id}/deactivate`)
  return data
}

export async function reactivateStaff(id: string): Promise<{ user: User }> {
  const { data } = await api.patch<{ user: User }>(`/staff/${id}/reactivate`)
  return data
}

// --- Promo codes management ---

export async function listPromoCodes(): Promise<{ promoCodes: PromoCode[] }> {
  const { data } = await api.get<{ promoCodes: PromoCode[] }>('/promo-codes')
  return data
}

export async function createPromoCode(input: {
  code: string
  discountPercent: number
  validFrom: string
  validTo: string
  maxUses: number
}): Promise<{ promoCode: PromoCode }> {
  const { data } = await api.post<{ promoCode: PromoCode }>('/promo-codes', input)
  return data
}

export async function deletePromoCode(id: string): Promise<void> {
  await api.delete(`/promo-codes/${id}`)
}

export type { User }

