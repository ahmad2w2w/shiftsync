import { useState, type FormEvent } from 'react'
import { Link, Navigate, useNavigate } from 'react-router-dom'
import { Zap, CheckCircle } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { supabase } from '../lib/supabase'
import { Button } from '../components/ui/Button'
import { Input } from '../components/ui/Input'
import { Card } from '../components/ui/Card'

export function RegisterPage() {
  const { session, loading } = useAuth()
  const navigate = useNavigate()
  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  if (!loading && session) {
    return <Navigate to="/onboarding" replace />
  }

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
        options: {
          data: { full_name: fullName, role: 'admin' },
        },
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
    <div className="flex min-h-screen items-center justify-center bg-navy-950 p-4">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <Link to="/" className="inline-flex items-center gap-2 mb-6">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-brand-600">
              <Zap className="h-6 w-6 text-white" />
            </div>
          </Link>
          <h1 className="text-2xl font-bold text-white">Account aanmaken</h1>
          <p className="mt-1 text-navy-300">Gratis beginnen, geen creditcard nodig</p>
        </div>

        <Card className="border-0 shadow-2xl">
          <form onSubmit={handleSubmit} className="space-y-4">
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
              <div className="rounded-lg bg-red-50 px-3 py-2.5 text-sm text-red-700">
                {error}
              </div>
            )}
            <Button type="submit" className="w-full" size="lg" loading={submitting}>
              Account aanmaken
            </Button>
          </form>

          <div className="mt-6 space-y-2 border-t border-gray-100 pt-6">
            {[
              'Gratis tot 5 medewerkers',
              'Geen creditcard nodig',
              'Direct toegang',
            ].map((item) => (
              <div key={item} className="flex items-center gap-2 text-sm text-gray-500">
                <CheckCircle className="h-4 w-4 text-brand-600 shrink-0" />
                {item}
              </div>
            ))}
          </div>
        </Card>

        <p className="mt-6 text-center text-sm text-navy-400">
          Al een account?{' '}
          <Link to="/login" className="font-medium text-brand-400 hover:text-brand-300">
            Inloggen
          </Link>
        </p>
        <p className="mt-3 text-center text-xs text-navy-600">
          Door te registreren ga je akkoord met onze{' '}
          <span className="text-navy-400">Algemene Voorwaarden</span> en{' '}
          <span className="text-navy-400">Privacybeleid</span>.
        </p>
      </div>
    </div>
  )
}
