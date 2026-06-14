import { AlertCircle, RefreshCw } from 'lucide-react'
import { Button } from './Button'

interface LoadErrorProps {
  message?: string
  onRetry?: () => void
}

export function LoadError({
  message = 'Gegevens laden mislukt. Controleer je verbinding en probeer opnieuw.',
  onRetry,
}: LoadErrorProps) {
  return (
    <div
      className="flex flex-col items-center justify-center rounded-2xl px-6 py-12 text-center"
      style={{ background: 'var(--surface-card)', border: '1px solid var(--border)' }}
      role="alert"
    >
      <div
        className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl"
        style={{ background: 'rgba(239,68,68,0.1)' }}
      >
        <AlertCircle className="h-6 w-6" style={{ color: '#EF4444' }} />
      </div>
      <p className="max-w-sm text-sm leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
        {message}
      </p>
      {onRetry && (
        <Button className="mt-5" variant="secondary" size="sm" onClick={onRetry}>
          <RefreshCw className="h-4 w-4" />
          Opnieuw proberen
        </Button>
      )}
    </div>
  )
}
