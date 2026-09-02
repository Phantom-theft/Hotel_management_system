import { describe, expect, it } from 'vitest'
import { computeAdr, computeRevpar } from './hospitalityMetrics'

describe('hospitalityMetrics', () => {
  it('computes ADR as revenue divided by room-nights sold', () => {
    // $1020 revenue across 2+3=5 room-nights → $204 ADR
    expect(computeAdr(1020, 5)).toBe(204)
  })

  it('computes RevPAR as revenue divided by total room inventory', () => {
    // $1020 revenue across 10 rooms → $102 RevPAR
    expect(computeRevpar(1020, 10)).toBe(102)
  })

  it('returns null when inputs are zero or missing', () => {
    expect(computeAdr(0, 5)).toBeNull()
    expect(computeAdr(100, 0)).toBeNull()
    expect(computeRevpar(0, 10)).toBeNull()
    expect(computeRevpar(100, 0)).toBeNull()
  })
})
