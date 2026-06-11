import { useState, type FormEvent } from 'react'
import { Link, Navigate, useNavigate } from 'react-router-dom'
import { Zap, CheckCircle } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { supabase } from '../lib/supabase'
import { Button } from '../components/ui/Button'

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
    <div className="flex min-h-screen" style={{ background: '#09090b' }}>
      {/* Left branding panel */}
      <div className="gradient-hero hidden flex-col justify-between p-10 lg:flex lg:w-[420px]">
        <div className="flex items-center gap-2.5">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand-600 shadow-md shadow-brand-600/40">
            <Zap className="h-5 w-5 text-white" />
          </div>
          <span className="text-base font-bold text-white">ShiftSync</span>
        </div>
        <div>
          <div className="space-y-4 mb-8">
            {['Gratis tot 5 medewerkers', 'Geen creditcard nodig', 'Direct toegang', 'Opzegbaar per maand'].map((item) => (
              <div key={item} className="flex items-center gap-3 text-sm text-zinc-300">
                <CheckCircle className="h-4 w-4 text-brand-400 shrink-0" />
                {item}
              </div>
            ))}
          </div>
          <p className="text-xs text-zinc-600">© {new Date().getFullYear()} ShiftSync</p>
        </div>
      </div>

      {/* Right: form */}
      <div className="flex flex-1 flex-col items-center justify-center px-5 py-12">
        <div className="w-full max-w-sm">
          <div className="mb-8 lg:hidden flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand-600">
              <Zap className="h-5 w-5 text-white" />
            </div>
            <span className="text-base font-bold text-white">ShiftSync</span>
          </div>

          <h1 className="text-2xl font-bold text-white">Account aanmaken</h1>
          <p className="mt-1.5 text-sm text-zinc-500">Gratis beginnen, geen creditcard nodig</p>

          <form onSubmit={handleSubmit} className="mt-8 space-y-4">
            <div className="space-y-1.5">
              <label className="block text-sm font-medium text-zinc-300">Volledige naam</label>
              <input
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="Jan de Vries"
                required
                autoComplete="name"
                autoFocus
                className="w-full rounded-xl border border-white/8 bg-zinc-900 px-3.5 py-2.5 text-sm text-zinc-100 placeholder:text-zinc-600 focus:border-brand-500/70 focus:outline-none focus:ring-2 focus:ring-brand-500/20 transition-all hover:border-white/15"
              />
            </div>
            <div className="space-y-1.5">
              <label className="block text-sm font-medium text-zinc-300">E-mailadres</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="jan@bedrijf.nl"
                required
                autoComplete="email"
                className="w-full rounded-xl border border-white/8 bg-zinc-900 px-3.5 py-2.5 text-sm text-zinc-100 placeholder:text-zinc-600 focus:border-brand-500/70 focus:outline-none focus:ring-2 focus:ring-brand-500/20 transition-all hover:border-white/15"
              />
            </div>
            <div className="space-y-1.5">
              <label className="block text-sm font-medium text-zinc-300">Wachtwoord</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Minimaal 8 tekens"
                required
                autoComplete="new-password"
                className="w-full rounded-xl border border-white/8 bg-zinc-900 px-3.5 py-2.5 text-sm text-zinc-100 placeholder:text-zinc-600 focus:border-brand-500/70 focus:outline-none focus:ring-2 focus:ring-brand-500/20 transition-all hover:border-white/15"
              />
            </div>

            {error && (
              <div className="rounded-xl px-4 py-3 text-sm text-red-400" style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)' }}>
                {error}
              </div>
            )}

            <Button type="submit" className="w-full mt-2" size="lg" loading={submitting}>
              Account aanmaken
            </Button>
          </form>

          <p className="mt-6 text-center text-sm text-zinc-600">
            Al een account?{' '}
            <Link to="/login" className="font-semibold text-brand-400 hover:text-brand-300 transition-colors">
              Inloggen
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
