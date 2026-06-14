import { useState, type FormEvent } from 'react'
import { Link, Navigate, useNavigate } from 'react-router-dom'
import { Zap, Calendar, Clock, Users } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { Button } from '../components/ui/Button'
import { Input } from '../components/ui/Input'

const highlights = [
  { icon: Calendar, text: 'Roosterplanning in minuten' },
  { icon: Clock, text: 'Automatische urenregistratie' },
  { icon: Users, text: 'Teambeheer op één plek' },
]

export function LoginPage() {
  const { session, signIn, loading, needsOnboarding } = useAuth()
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  if (!loading && session) {
    return <Navigate to={needsOnboarding ? '/onboarding' : '/app/dashboard'} replace />
  }

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setError('')
    setSubmitting(true)
    try {
      await signIn(email, password)
      navigate('/app/dashboard')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Inloggen mislukt. Controleer je gegevens.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="flex min-h-screen" style={{ background: 'var(--surface-page)' }}>
      <div
        className="hidden flex-col justify-between p-10 lg:flex lg:w-[420px] xl:w-[480px]"
        style={{ background: 'linear-gradient(160deg, #0F172A 0%, #1e3a8a 100%)' }}
      >
        <div className="flex items-center gap-2.5">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand-500 shadow-md shadow-brand-500/40">
            <Zap className="h-5 w-5 text-white" />
          </div>
          <span className="text-base font-bold text-white">ShiftSync</span>
        </div>
        <div>
          <h2 className="text-xl font-semibold leading-relaxed text-white">
            Personeelsplanning zonder spreadsheet-stress
          </h2>
          <ul className="mt-6 space-y-4">
            {highlights.map(({ icon: Icon, text }) => (
              <li key={text} className="flex items-center gap-3 text-sm text-white/80">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/10">
                  <Icon className="h-4 w-4 text-brand-300" />
                </div>
                {text}
              </li>
            ))}
          </ul>
        </div>
        <p className="text-xs text-white/40">© {new Date().getFullYear()} ShiftSync</p>
      </div>

      <div className="flex flex-1 flex-col items-center justify-center px-5 py-12">
        <div className="w-full max-w-sm">
          <div className="mb-8 flex items-center gap-2.5 lg:hidden">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand-500">
              <Zap className="h-5 w-5 text-white" />
            </div>
            <span className="text-base font-bold" style={{ color: 'var(--text-primary)' }}>ShiftSync</span>
          </div>

          <h1 className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>Welkom terug</h1>
          <p className="mt-1.5 text-sm" style={{ color: 'var(--text-muted)' }}>Log in op je account</p>

          <form onSubmit={handleSubmit} className="mt-8 space-y-4">
            <Input
              label="E-mailadres"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="naam@bedrijf.nl"
              required
              autoComplete="email"
              autoFocus
            />
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="block text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>
                  Wachtwoord
                </label>
                <Link to="/wachtwoord-vergeten" className="text-xs font-semibold text-brand-500 hover:text-brand-600">
                  Vergeten?
                </Link>
              </div>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                autoComplete="current-password"
                placeholder="••••••••"
                className="w-full rounded-xl border px-3.5 py-2.5 text-sm transition-all focus:outline-none focus:ring-2 focus:ring-brand-500/30 focus:border-brand-500"
                style={{
                  background: 'var(--surface-input)',
                  color: 'var(--text-primary)',
                  borderColor: 'var(--border-input)',
                }}
              />
            </div>

            {error && (
              <div className="rounded-xl px-4 py-3 text-sm text-red-500" style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)' }}>
                {error}
              </div>
            )}

            <Button type="submit" className="w-full mt-2" size="lg" loading={submitting}>
              Inloggen
            </Button>
          </form>

          <p className="mt-6 text-center text-sm" style={{ color: 'var(--text-muted)' }}>
            Nog geen account?{' '}
            <Link to="/register" className="font-semibold text-brand-500 hover:text-brand-600 transition-colors">
              Gratis aanmaken
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
