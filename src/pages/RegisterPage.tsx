import { useState, type FormEvent } from 'react'
import { Link, Navigate, useNavigate } from 'react-router-dom'
import { Zap, CheckCircle } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { supabase } from '../lib/supabase'
import { Button } from '../components/ui/Button'
import { Input } from '../components/ui/Input'
import { PRICE_PER_EMPLOYEE } from '../types/database'

export function RegisterPage() {
  const { session, loading } = useAuth()
  const navigate = useNavigate()
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
      navigate('/onboarding')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Registratie mislukt. Probeer het opnieuw.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="flex min-h-screen" style={{ background: 'var(--surface-page)' }}>
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
            {[
              `€${PRICE_PER_EMPLOYEE} per medewerker per maand`,
              'Alle functies inbegrepen',
              'Direct toegang',
              'Opzegbaar per maand',
            ].map((item) => (
              <div key={item} className="flex items-center gap-3 text-sm text-white/70">
                <CheckCircle className="h-4 w-4 text-brand-400 shrink-0" />
                {item}
              </div>
            ))}
          </div>
          <p className="text-xs text-white/30">© {new Date().getFullYear()} ShiftSync</p>
        </div>
      </div>

      <div className="flex flex-1 flex-col items-center justify-center px-5 py-12">
        <div className="w-full max-w-sm">
          <div className="mb-8 lg:hidden flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand-500">
              <Zap className="h-5 w-5 text-white" />
            </div>
            <span className="text-base font-bold" style={{ color: 'var(--text-primary)' }}>ShiftSync</span>
          </div>

          <h1 className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>Account aanmaken</h1>
          <p className="mt-1.5 text-sm" style={{ color: 'var(--text-muted)' }}>
            Start gratis — daarna €{PRICE_PER_EMPLOYEE} per medewerker per maand
          </p>

          <form onSubmit={handleSubmit} className="mt-8 space-y-4">
            <Input label="Volledige naam" value={fullName} onChange={(e) => setFullName(e.target.value)} required autoComplete="name" />
            <Input label="E-mail" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required autoComplete="email" />
            <Input label="Wachtwoord" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required minLength={8} autoComplete="new-password" />
            {error && (
              <div className="rounded-xl px-4 py-3 text-sm text-red-600" style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)' }}>
                {error}
              </div>
            )}
            <Button type="submit" className="w-full" size="lg" loading={submitting}>Account aanmaken</Button>
          </form>

          <p className="mt-6 text-center text-sm" style={{ color: 'var(--text-muted)' }}>
            Al een account?{' '}
            <Link to="/login" className="font-medium text-brand-600 hover:text-brand-700">Inloggen</Link>
          </p>
        </div>
      </div>
    </div>
  )
}
