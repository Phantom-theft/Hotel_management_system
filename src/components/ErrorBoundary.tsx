import { Component, type ErrorInfo, type ReactNode } from 'react'
import { Link } from 'react-router-dom'

interface Props {
  children: ReactNode
}

interface State {
  error: Error | null
}

export class ErrorBoundary extends Component<Props, State> {
  state: State = { error: null }

  static getDerivedStateFromError(error: Error): State {
    return { error }
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('UI error boundary caught:', error, info.componentStack)
  }

  render() {
    if (this.state.error) {
      return (
        <div className="mx-auto max-w-lg rounded-xl border border-danger/20 bg-white p-8 text-center shadow-card">
          <h1 className="font-display text-2xl font-extrabold text-primary">Something went wrong</h1>
          <p className="mt-2 text-sm text-neutral-600">
            An unexpected error occurred. Try refreshing the page or return home.
          </p>
          <div className="mt-6 flex flex-wrap justify-center gap-3">
            <button
              type="button"
              onClick={() => window.location.reload()}
              className="rounded-full bg-primary px-4 py-2 text-sm font-semibold text-white transition hover:bg-primary-light"
            >
              Refresh page
            </button>
            <Link
              to="/"
              className="rounded-md border border-neutral-300 px-4 py-2 text-sm text-neutral-700 hover:bg-neutral-50"
            >
              Go home
            </Link>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}
