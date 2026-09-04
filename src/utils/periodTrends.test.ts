import { describe, expect, it } from 'vitest'
import { previousPeriodChangeSuffix } from './periodTrends'

describe('previousPeriodChangeSuffix', () => {
  it('labels common window lengths', () => {
    expect(previousPeriodChangeSuffix('2026-02-01', '2026-02-01')).toBe('from yesterday')
    expect(previousPeriodChangeSuffix('2026-02-01', '2026-02-07')).toBe('from last week')
    expect(previousPeriodChangeSuffix('2026-01-01', '2026-01-30')).toBe('from last 30 days')
    expect(previousPeriodChangeSuffix('2026-01-01', '2026-01-15')).toBe('from previous period')
  })
})
