import { describe, expect, it } from 'vitest'
import { AxiosError } from 'axios'
import { getApiErrorMessage } from './apiError'

function axiosError(status: number, error?: string) {
  return new AxiosError('Request failed', String(status), undefined, undefined, {
    status,
    data: error ? { error } : {},
    headers: {},
    config: {} as never,
    statusText: '',
  })
}

describe('getApiErrorMessage', () => {
  it('returns friendly conflict message for walk-in availability', () => {
    const err = axiosError(409, 'Room is not available for the selected dates')
    expect(
      getApiErrorMessage(err, {
        conflict:
          "This room isn't available for the selected dates — please choose different dates or another room.",
      }),
    ).toBe(
      "This room isn't available for the selected dates — please choose different dates or another room.",
    )
  })

  it('returns server message for check-in conflicts when no override', () => {
    const err = axiosError(409, 'Only confirmed bookings can be checked in')
    expect(getApiErrorMessage(err)).toBe('Only confirmed bookings can be checked in')
  })

  it('returns validation message for 400', () => {
    const err = axiosError(400, 'Invalid date range')
    expect(getApiErrorMessage(err)).toBe('Invalid date range')
  })

  it('returns server error message for 500', () => {
    const err = axiosError(500)
    expect(getApiErrorMessage(err)).toBe('Something went wrong on our side. Please try again later.')
  })

  it('returns fallback for unknown errors', () => {
    expect(getApiErrorMessage(new Error('boom'), { fallback: 'Nope' })).toBe('Nope')
  })
})
