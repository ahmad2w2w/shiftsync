import { useState, type FormEvent } from 'react'
import { Link, Navigate, useNavigate } from 'react-router-dom'
import { Zap } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { Button } from '../components/ui/Button'
import { Input } from '../components/ui/Input'

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
    <div className="flex min-h-screen bg-navy-950">
      {/* Left: branding panel (desktop) */}
      <div className="gradient-hero hidden flex-col justify-between p-10 lg:flex lg:w-[420px] xl:w-[480px]">
        <div className="flex items-center gap-2.5">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand-600 shadow-md shadow-brand-600/40">
            <Zap className="h-5 w-5 text-white" />
          </div>
          <span className="text-base font-bold text-white">ShiftSync</span>
        </div>
        <div>
          <blockquote className="text-xl font-medium leading-relaxed text-white">
            "ShiftSync heeft ons roosterproces compleet getransformeerd."
          </blockquote>
          <div className="mt-4 flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-brand-600/20 text-sm font-bold text-brand-400">S</div>
            <div>
              <p className="text-sm font-semibold text-white">Sarah van den Berg</p>
              <p className="text-xs text-navy-400">Eigenaar, Bistro de Linde</p>
            </div>
          </div>
        </div>
      </div>

      {/* Right: login form */}
      <div className="flex flex-1 flex-col items-center justify-center px-5 py-12">
        <div className="w-full max-w-sm">
          {/* Mobile logo */}
          <div className="mb-8 flex items-center gap-2.5 lg:hidden">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand-600">
              <Zap className="h-5 w-5 text-white" />
            </div>
            <span className="text-base font-bold text-white">ShiftSync</span>
          </div>

          <h1 className="text-2xl font-bold text-white">Welkom terug</h1>
          <p className="mt-1.5 text-sm text-navy-400">Log in op je account</p>

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
              className="bg-navy-800 border-navy-700 text-white placeholder:text-navy-500 focus:border-brand-500"
            />
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="block text-sm font-medium text-navy-300">Wachtwoord</label>
              </div>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                autoComplete="current-password"
                placeholder="••••••••"
                className="w-full rounded-xl border border-navy-700 bg-navy-800 px-3.5 py-2.5 text-sm text-white placeholder:text-navy-500 focus:border-brand-500 focus:outline-none focus:ring-3 focus:ring-brand-500/15 transition-shadow"
              />
            </div>

            {error && (
              <div className="rounded-xl border border-red-900/50 bg-red-950/50 px-4 py-3 text-sm text-red-400">
                {error}
              </div>
            )}

            <Button type="submit" className="w-full mt-2" size="lg" loading={submitting}>
              Inloggen
            </Button>
          </form>

          <p className="mt-6 text-center text-sm text-navy-500">
            Nog geen account?{' '}
            <Link to="/register" className="font-semibold text-brand-400 hover:text-brand-300 transition-colors">
              Gratis aanmaken
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
