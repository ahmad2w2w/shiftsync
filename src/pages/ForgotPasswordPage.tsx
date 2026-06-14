import { useState, type FormEvent } from 'react'
import { Link } from 'react-router-dom'
import { Zap, Mail } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { Button } from '../components/ui/Button'
import { Input } from '../components/ui/Input'

export function ForgotPasswordPage() {
  const [email, setEmail] = useState('')
  const [sent, setSent] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const redirectTo = `${window.location.origin}/reset-password`
      const { error: resetError } = await supabase.auth.resetPasswordForEmail(email, { redirectTo })
      if (resetError) throw resetError
      setSent(true)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Versturen mislukt')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center px-5 py-12" style={{ background: 'var(--surface-page)' }}>
      <div className="w-full max-w-sm">
        <div className="mb-8 flex items-center gap-2.5">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand-500">
            <Zap className="h-5 w-5 text-white" />
          </div>
          <span className="text-base font-bold" style={{ color: 'var(--text-primary)' }}>ShiftSync</span>
        </div>

        {sent ? (
          <div
            className="rounded-2xl p-6 text-center animate-fade-in"
            style={{ background: 'var(--surface-card)', border: '1px solid var(--border)', boxShadow: 'var(--shadow-card)' }}
          >
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full" style={{ background: 'var(--brand-muted)' }}>
              <Mail className="h-6 w-6" style={{ color: 'var(--brand-strong)' }} />
            </div>
            <h1 className="text-xl font-bold" style={{ color: 'var(--text-primary)' }}>Check je inbox</h1>
            <p className="mt-2 text-sm" style={{ color: 'var(--text-muted)' }}>
              Als er een account bestaat voor <strong>{email}</strong>, hebben we een resetlink gestuurd.
            </p>
            <Link to="/login" className="mt-6 inline-block text-sm font-semibold text-brand-600 hover:text-brand-700">
              Terug naar inloggen
            </Link>
          </div>
        ) : (
          <>
            <h1 className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>Wachtwoord vergeten?</h1>
            <p className="mt-1.5 text-sm" style={{ color: 'var(--text-muted)' }}>
              Vul je e-mailadres in. We sturen je een link om een nieuw wachtwoord in te stellen.
            </p>
            <form onSubmit={handleSubmit} className="mt-8 space-y-4">
              <Input
                label="E-mailadres"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoFocus
                autoComplete="email"
              />
              {error && (
                <div className="rounded-xl px-4 py-3 text-sm text-red-500" style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)' }}>
                  {error}
                </div>
              )}
              <Button type="submit" className="w-full" size="lg" loading={loading}>
                Resetlink versturen
              </Button>
            </form>
            <p className="mt-6 text-center text-sm" style={{ color: 'var(--text-muted)' }}>
              <Link to="/login" className="font-semibold text-brand-500 hover:text-brand-600">Terug naar inloggen</Link>
            </p>
          </>
        )}
      </div>
    </div>
  )
}
