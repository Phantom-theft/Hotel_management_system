import { describe, expect, it } from 'vitest'
import {
  aggregateOverallReviews,
  bookingSharePercent,
  ratingQualitativeLabel,
} from './reviewAggregates'

describe('aggregateOverallReviews', () => {
  it('matches weighted average used on Reviews page', () => {
    // 10 reviews @ 5.0 and 5 reviews @ 2.0 → (50 + 10) / 15 = 4.0
    const result = aggregateOverallReviews([
      { total: 10, averageRating: 5 },
      { total: 5, averageRating: 2 },
      { total: 0, averageRating: 0 },
    ])
    expect(result.totalReviews).toBe(15)
    expect(result.avgRating).toBe(4)
  })

  it('returns zeros when there are no reviews', () => {
    expect(aggregateOverallReviews([])).toEqual({ avgRating: 0, totalReviews: 0 })
  })
})

describe('ratingQualitativeLabel', () => {
  it('maps score bands to labels', () => {
    expect(ratingQualitativeLabel(4.6)).toBe('Excellent')
    expect(ratingQualitativeLabel(4.3)).toBe('Very good')
    expect(ratingQualitativeLabel(3.7)).toBe('Good')
    expect(ratingQualitativeLabel(0)).toBe('No ratings yet')
  })
})

describe('bookingSharePercent', () => {
  it('computes one-decimal percentages that sum correctly for known splits', () => {
    expect(bookingSharePercent(2, 3)).toBe(66.7)
    expect(bookingSharePercent(1, 3)).toBe(33.3)
    expect(bookingSharePercent(0, 3)).toBe(0)
    expect(bookingSharePercent(1, 0)).toBe(0)
  })
})
