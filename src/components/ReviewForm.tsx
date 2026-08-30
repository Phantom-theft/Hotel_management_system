import { useState, type FormEvent } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { createReview, getRoomTypeReviews } from '../api/hotel'
import { StarRating } from './StarRating'
import { toast } from '../store/toastStore'
import type { Booking } from '../types/api'

interface ReviewFormProps {
  booking: Booking
  userId: string
  onSubmitted: () => void
}

export function ReviewForm({ booking, userId, onSubmitted }: ReviewFormProps) {
  const roomType = booking.room?.roomType
  const roomTypeId = roomType?.id
  const queryClient = useQueryClient()
  const [rating, setRating] = useState(5)
  const [comment, setComment] = useState('')

  const existingQuery = useQuery({
    queryKey: ['reviews', roomTypeId, 'mine', userId],
    enabled: !!roomTypeId,
    queryFn: async () => {
      const data = await getRoomTypeReviews(roomTypeId!, 1, 50)
      return data.reviews.some((r) => r.user.id === userId)
    },
  })

  const submitMut = useMutation({
    mutationFn: () =>
      createReview({
        roomTypeId: roomTypeId!,
        rating,
        comment: comment.trim() || undefined,
      }),
    onSuccess: () => {
      toast('Thank you for your review!', 'success')
      void queryClient.invalidateQueries({ queryKey: ['reviews', roomTypeId] })
      onSubmitted()
    },
    onError: (err: unknown) =>
      toast(
        (err as { response?: { data?: { error?: string } } })?.response?.data?.error ??
          'Could not submit review',
        'error',
      ),
  })

  if (!roomTypeId || !roomType) return null
  if (existingQuery.isLoading) {
    return <p className="text-sm text-neutral-500">Checking review eligibility…</p>
  }
  if (existingQuery.data) return null

  return (
    <form
      onSubmit={(e: FormEvent) => {
        e.preventDefault()
        submitMut.mutate()
      }}
      className="mt-3 space-y-3 rounded-lg border border-accent/20 bg-surface-tint/50 p-4"
    >
      <p className="text-sm font-medium text-neutral-800">
        Share your experience — {roomType.name}
      </p>
      <label className="block text-sm">
        <span className="mb-1 block text-neutral-600">Rating</span>
        <StarRating value={rating} onChange={setRating} label="Your rating" />
      </label>
      <label className="block text-sm">
        <span className="mb-1 block text-neutral-600">Comment (optional)</span>
        <textarea
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          rows={3}
          maxLength={1000}
          className="w-full rounded-md border border-neutral-300 px-3 py-2"
          placeholder="What did you enjoy about your stay?"
        />
      </label>
      <button
        type="submit"
        disabled={submitMut.isPending}
        className="rounded-full bg-primary px-3 py-1.5 text-sm font-semibold text-white transition hover:bg-primary-light disabled:opacity-60"
      >
        {submitMut.isPending ? 'Submitting…' : 'Submit review'}
      </button>
    </form>
  )
}
