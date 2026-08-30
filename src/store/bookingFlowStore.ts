import { create } from 'zustand'
import type { Room } from '../types/api'

export interface BookingDraft {
  roomId: string
  checkIn: string
  checkOut: string
  guestsCount: number
  promoCode?: string
  guestName: string
  guestEmail: string
  guestPhone: string
  roomSnapshot?: Room
}

interface BookingFlowState {
  draft: BookingDraft | null
  bookingId: string | null
  setDraft: (draft: BookingDraft) => void
  patchDraft: (patch: Partial<BookingDraft>) => void
  setBookingId: (id: string | null) => void
  clear: () => void
}

export const useBookingFlowStore = create<BookingFlowState>((set) => ({
  draft: null,
  bookingId: null,
  setDraft: (draft) => set({ draft, bookingId: null }),
  patchDraft: (patch) =>
    set((s) => (s.draft ? { draft: { ...s.draft, ...patch } } : s)),
  setBookingId: (bookingId) => set({ bookingId }),
  clear: () => set({ draft: null, bookingId: null }),
}))
