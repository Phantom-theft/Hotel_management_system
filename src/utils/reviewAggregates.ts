/** Qualitative label for an overall star rating (single score, no category breakdown). */
export function ratingQualitativeLabel(avg: number): string {
  if (!Number.isFinite(avg) || avg <= 0) return 'No ratings yet'
  if (avg >= 4.5) return 'Excellent'
  if (avg >= 4.0) return 'Very good'
  if (avg >= 3.5) return 'Good'
  if (avg >= 3.0) return 'Average'
  if (avg >= 2.0) return 'Poor'
  return 'Needs improvement'
}

export interface RoomTypeReviewSummary {
  total: number
  averageRating: number
}

/** Weighted overall average across room-type review summaries (same math as Admin Reviews page). */
export function aggregateOverallReviews(summaries: RoomTypeReviewSummary[]): {
  avgRating: number
  totalReviews: number
} {
  const totalReviews = summaries.reduce((sum, s) => sum + (s.total ?? 0), 0)
  if (totalReviews === 0) {
    return { avgRating: 0, totalReviews: 0 }
  }
  const weightedSum = summaries.reduce((sum, s) => {
    if (!s.total) return sum
    return sum + s.averageRating * s.total
  }, 0)
  return {
    avgRating: weightedSum / totalReviews,
    totalReviews,
  }
}

export function bookingSharePercent(count: number, total: number): number {
  if (total <= 0 || count <= 0) return 0
  return Number(((count / total) * 100).toFixed(1))
}
