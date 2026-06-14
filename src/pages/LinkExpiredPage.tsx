import { Link } from 'react-router-dom'
import { Zap, Clock, Mail } from 'lucide-react'
import { Button } from '../components/ui/Button'

export function LinkExpiredPage() {
  return (
    <div className="flex min-h-screen items-center justify-center px-5 py-12" style={{ background: 'var(--surface-page)' }}>
      <div className="w-full max-w-md">
        <div className="mb-8 flex items-center gap-2.5">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand-500">
            <Zap className="h-5 w-5 text-white" />
          </div>
          <span className="text-base font-bold" style={{ color: 'var(--text-primary)' }}>ShiftSync</span>
        </div>

        <div
          className="rounded-2xl p-6"
          style={{ background: 'var(--surface-card)', border: '1px solid var(--border)', boxShadow: 'var(--shadow-card)' }}
        >
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full" style={{ background: 'rgba(245,158,11,0.12)' }}>
            <Clock className="h-6 w-6" style={{ color: '#F59E0B' }} />
          </div>
          <h1 className="text-xl font-bold" style={{ color: 'var(--text-primary)' }}>Link verlopen</h1>
          <p className="mt-2 text-sm leading-relaxed" style={{ color: 'var(--text-muted)' }}>
            De uitnodigings- of resetlink is niet meer geldig. Dat gebeurt als de link ouder is dan ongeveer 1 uur,
            al eerder is gebruikt, of als je de nieuwste e-mail niet hebt geopend.
          </p>

          <div className="mt-6 space-y-3">
            <p className="text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>Medewerker?</p>
            <ul className="space-y-2 text-sm" style={{ color: 'var(--text-muted)' }}>
              <li>• Vraag je manager om <strong>opnieuw uit te nodigen</strong></li>
              <li>• Of gebruik <strong>Wachtwoord vergeten</strong> op de loginpagina</li>
            </ul>
          </div>

          <div className="mt-6 flex flex-col gap-2 sm:flex-row">
            <Link to="/wachtwoord-vergeten" className="flex-1">
              <Button className="w-full" variant="primary">
                <Mail className="h-4 w-4" /> Nieuwe resetlink
              </Button>
            </Link>
            <Link to="/login" className="flex-1">
              <Button className="w-full" variant="secondary">Naar login</Button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
