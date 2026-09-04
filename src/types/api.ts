export type UserRole = 'customer' | 'staff' | 'admin'

export type BookingStatus =
  | 'pending'
  | 'confirmed'
  | 'checked_in'
  | 'checked_out'
  | 'cancelled'

export type RoomStatus = 'available' | 'occupied' | 'maintenance'

export interface User {
  id: string
  name: string
  email: string
  role: UserRole
  phone: string | null
  isActive?: boolean
  createdAt: string
}

export interface RoomType {
  id: string
  name: string
  basePrice: number
  capacity: number
  amenities: string[]
  images: string[]
  description: string | null
}

export interface Room {
  id: string
  roomTypeId: string
  roomNumber: string
  floor: number
  status: RoomStatus
  roomType?: RoomType
}

export interface Booking {
  id: string
  userId: string
  roomId: string
  checkIn: string
  checkOut: string
  status: BookingStatus
  totalPrice: number
  guestsCount: number
  expiresAt: string | null
  createdAt: string
  room?: Room
  guest?: {
    name: string
    email: string
  }
}

export interface AuthResponse {
  user: User
  accessToken: string
}

export interface RoomsSearchResponse {
  rooms: Room[]
}

export interface BookingsResponse {
  bookings: Booking[]
}

export interface TodaysBookingsResponse {
  date: string
  checkIns: Booking[]
  checkOuts: Booking[]
}

export interface CreateBookingResponse {
  booking: Booking
}

export interface PaymentIntentResponse {
  clientSecret: string
  paymentIntentId: string
  amount: number
  currency: string
}

export interface OccupancyReport {
  from: string
  to: string
  totalRooms: number
  overallOccupancyRate: number
  days: Array<{
    date: string
    occupiedRooms: number
    totalRooms: number
    occupancyRate: number
  }>
}

export interface RevenueReport {
  from: string
  to: string
  totalRevenue: number
  roomNightsSold: number
  newBookings: number
  checkIns: number
  checkOuts: number
  previousPeriod: {
    from: string
    to: string
    totalRevenue: number
    newBookings: number
    checkIns: number
    checkOuts: number
  }
  changes: {
    totalRevenuePercent: number | null
    newBookingsPercent: number | null
    checkInsPercent: number | null
    checkOutsPercent: number | null
  }
  byPeriod: Array<{ date: string; revenue: number }>
  byRoomType: Array<{ roomTypeId: string; roomTypeName: string; revenue: number }>
  bookingsByRoomType: Array<{ roomTypeId: string; roomTypeName: string; bookings: number }>
}

export interface CancellationsReport {
  from: string
  to: string
  totalBookings: number
  cancelledBookings: number
  cancellationRate: number
  byPeriod: Array<{
    date: string
    total: number
    cancelled: number
    cancellationRate: number
  }>
}

export interface ReviewsResponse {
  page: number
  limit: number
  total: number
  averageRating: number
  reviews: Array<{
    id: string
    rating: number
    comment: string | null
    createdAt: string
    user: { id: string; name: string }
  }>
}

export interface PromoCode {
  id: string
  code: string
  discountPercent: number
  validFrom: string
  validTo: string
  maxUses: number
  usedCount: number
}

