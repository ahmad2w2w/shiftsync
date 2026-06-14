import { useState, type FormEvent } from 'react'
import { Link, Navigate, useNavigate, useSearchParams } from 'react-router-dom'
import { Zap, CheckCircle } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { supabase } from '../lib/supabase'
import { Button } from '../components/ui/Button'
import { Input } from '../components/ui/Input'

const PLAN_LABELS: Record<string, string> = { pro: 'Pro', business: 'Business' }

export function RegisterPage() {
  const { session, loading } = useAuth()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const intendedPlan = searchParams.get('plan')
  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  if (!loading && session) return <Navigate to="/onboarding" replace />

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setError('')
    if (password.length < 8) {
      setError('Wachtwoord moet minimaal 8 tekens lang zijn.')
      return
    }
    setSubmitting(true)
    try {
      const { error: signUpError } = await supabase.auth.signUp({
        email,
        password,
        options: { data: { full_name: fullName, role: 'admin' } },
      })
      if (signUpError) throw signUpError
      if (intendedPlan === 'pro' || intendedPlan === 'business') {
        sessionStorage.setItem('shiftsync-intended-plan', intendedPlan)
      }
      navigate('/onboarding')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Registratie mislukt. Probeer het opnieuw.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="flex min-h-screen" style={{ background: 'var(--surface-page)' }}>
      {/* Left branding panel — always dark */}
      <div
        className="hidden flex-col justify-between p-10 lg:flex lg:w-[420px]"
        style={{ background: 'linear-gradient(160deg, #0F172A 0%, #1e3a8a 100%)' }}
      >
        <div className="flex items-center gap-2.5">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand-500 shadow-md shadow-brand-500/40">
            <Zap className="h-5 w-5 text-white" />
          </div>
          <span className="text-base font-bold text-white">ShiftSync</span>
        </div>
        <div>
          <div className="space-y-4 mb-8">
            {['Gratis tot 5 medewerkers', 'Geen creditcard nodig', 'Direct toegang', 'Opzegbaar per maand'].map((item) => (
              <div key={item} className="flex items-center gap-3 text-sm text-white/70">
                <CheckCircle className="h-4 w-4 text-brand-400 shrink-0" />
                {item}
              </div>
            ))}
          </div>
          <p className="text-xs text-white/30">© {new Date().getFullYear()} ShiftSync</p>
        </div>
      </div>

      {/* Right: form */}
      <div className="flex flex-1 flex-col items-center justify-center px-5 py-12">
        <div className="w-full max-w-sm">
          <div className="mb-8 lg:hidden flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand-500">
              <Zap className="h-5 w-5 text-white" />
            </div>
            <span className="text-base font-bold" style={{ color: 'var(--text-primary)' }}>ShiftSync</span>
          </div>

          <h1 className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>Account aanmaken</h1>
          <p className="mt-1.5 text-sm" style={{ color: 'var(--text-muted)' }}>Gratis beginnen, geen creditcard nodig</p>

          {PLAN_LABELS[intendedPlan ?? ''] && (
            <div
              className="mt-5 flex items-center gap-2 rounded-xl px-4 py-3 text-sm"
              style={{ background: 'rgba(59,130,246,0.1)', border: '1px solid rgba(59,130,246,0.25)', color: 'var(--brand-strong)' }}
            >
              <CheckCircle className="h-4 w-4 shrink-0" />
              Je kiest het <strong>{PLAN_LABELS[intendedPlan ?? '']}</strong>-plan. Maak eerst je account aan, daarna reken je af.
            </div>
          )}

          <form onSubmit={handleSubmit} className="mt-8 space-y-4">
            <Input
              label="Volledige naam"
              type="text"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="Jan de Vries"
              required
              autoComplete="name"
              autoFocus
            />
            <Input
              label="E-mailadres"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="jan@bedrijf.nl"
              required
              autoComplete="email"
            />
            <Input
              label="Wachtwoord"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Minimaal 8 tekens"
              required
              autoComplete="new-password"
            />

            {error && (
              <div className="rounded-xl px-4 py-3 text-sm text-red-500 dark:text-red-400" style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)' }}>
                {error}
              </div>
            )}

            <Button type="submit" className="w-full mt-2" size="lg" loading={submitting}>
              Account aanmaken
            </Button>
          </form>

          <p className="mt-6 text-center text-sm" style={{ color: 'var(--text-muted)' }}>
            Al een account?{' '}
            <Link to="/login" className="font-semibold text-brand-500 hover:text-brand-600 transition-colors">
              Inloggen
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
