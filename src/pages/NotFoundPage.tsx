import { Link } from 'react-router-dom'
import { Home, ArrowLeft } from 'lucide-react'
import { Button } from '../components/ui/Button'

export function NotFoundPage() {
  return (
    <div
      className="flex min-h-screen flex-col items-center justify-center px-5 py-16"
      style={{ background: 'var(--surface-page)' }}
    >
      <p className="text-8xl font-bold tabular-nums" style={{ color: 'var(--brand-muted)' }}>404</p>
      <h1 className="mt-4 text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>Pagina niet gevonden</h1>
      <p className="mt-2 max-w-md text-center text-sm" style={{ color: 'var(--text-muted)' }}>
        De pagina die je zoekt bestaat niet of is verplaatst.
      </p>
      <div className="mt-8 flex flex-wrap justify-center gap-3">
        <Link to="/">
          <Button size="lg">
            <Home className="h-4 w-4" /> Naar home
          </Button>
        </Link>
        <Link to="/app/dashboard">
          <Button size="lg" variant="secondary">
            <ArrowLeft className="h-4 w-4" /> Naar dashboard
          </Button>
        </Link>
      </div>
    </div>
  )
}
