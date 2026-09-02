import { isAxiosError } from 'axios'

export interface ApiErrorMessageOptions {
  conflict?: string
  validation?: string
  server?: string
  fallback?: string
}

export function getApiErrorMessage(err: unknown, options: ApiErrorMessageOptions = {}): string {
  if (isAxiosError(err)) {
    const status = err.response?.status
    const data = err.response?.data
    const serverMessage =
      typeof data === 'object' && data !== null && 'error' in data && typeof data.error === 'string'
        ? data.error
        : null

    if (status === 409) {
      return (
        options.conflict ??
        serverMessage ??
        "This room isn't available for the selected dates — please choose different dates or another room."
      )
    }
    if (status === 400) {
      return options.validation ?? serverMessage ?? 'Please check your input and try again.'
    }
    if (status && status >= 500) {
      return (
        options.server ?? serverMessage ?? 'Something went wrong on our side. Please try again later.'
      )
    }
    if (serverMessage) return serverMessage
  }

  return options.fallback ?? 'Something went wrong. Please try again.'
}
