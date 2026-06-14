import { Component, type ErrorInfo, type ReactNode } from 'react'

interface Props {
  children: ReactNode
  fallback?: ReactNode
}

interface State {
  hasError: boolean
  error: Error | null
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('ErrorBoundary caught:', error, info)
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) return this.props.fallback
      return (
        <div
          className="flex min-h-screen flex-col items-center justify-center p-4 text-center"
          style={{ background: 'var(--surface-page)' }}
        >
          <div
            className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl"
            style={{ background: 'rgba(239,68,68,0.12)' }}
          >
            <svg className="h-8 w-8" style={{ color: '#EF4444' }} fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
            </svg>
          </div>
          <h1 className="text-xl font-semibold" style={{ color: 'var(--text-primary)' }}>Er is iets misgegaan</h1>
          <p className="mt-2 text-sm" style={{ color: 'var(--text-muted)' }}>
            {this.state.error?.message ?? 'Er trad een onverwachte fout op.'}
          </p>
          <button
            onClick={() => window.location.reload()}
            className="mt-6 rounded-lg px-6 py-2.5 text-sm font-medium text-white transition-colors hover:opacity-90"
            style={{ background: 'var(--brand-strong)' }}
          >
            Pagina herladen
          </button>
        </div>
      )
    }

    return this.props.children
  }
}
