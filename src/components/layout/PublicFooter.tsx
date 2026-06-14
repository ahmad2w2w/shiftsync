import { Link } from 'react-router-dom'
import { Zap } from 'lucide-react'

export function PublicFooter() {
  return (
    <footer className="px-5 py-12" style={{ background: '#0F172A' }}>
      <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-6 sm:flex-row">
        <div className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-600">
            <Zap className="h-4 w-4 text-white" />
          </div>
          <span className="font-bold text-white">ShiftSync</span>
        </div>
        <nav className="flex flex-wrap justify-center gap-6 text-sm text-slate-400" aria-label="Footer">
          <Link to="/pricing" className="hover:text-white transition-colors">Prijzen</Link>
          <Link to="/login" className="hover:text-white transition-colors">Inloggen</Link>
          <Link to="/register" className="hover:text-white transition-colors">Registreren</Link>
          <Link to="/privacy" className="hover:text-white transition-colors">Privacy</Link>
          <Link to="/voorwaarden" className="hover:text-white transition-colors">Voorwaarden</Link>
          <a href="mailto:support@shiftsync.nl" className="hover:text-white transition-colors">Support</a>
        </nav>
      </div>
      <p className="mx-auto mt-8 max-w-6xl border-t border-white/10 pt-8 text-center text-xs text-slate-600">
        © {new Date().getFullYear()} ShiftSync. Alle rechten voorbehouden.
      </p>
    </footer>
  )
}
