import { useEffect, useState, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Zap } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { Button } from '../components/ui/Button'
import { Input } from '../components/ui/Input'

export function ResetPasswordPage() {
  const navigate = useNavigate()
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [ready, setReady] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setReady(!!session)
    })
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setReady(!!session)
    })
    return () => subscription.unsubscribe()
  }, [])

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setError('')
    if (password.length < 6) {
      setError('Wachtwoord moet minimaal 6 tekens zijn')
      return
    }
    if (password !== confirm) {
      setError('Wachtwoorden komen niet overeen')
      return
    }
    setLoading(true)
    try {
      const { error: updateError } = await supabase.auth.updateUser({ password })
      if (updateError) throw updateError
      navigate('/app/dashboard')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Wachtwoord wijzigen mislukt')
    } finally {
      setLoading(false)
    }
  }

  if (!ready) {
    return (
      <div className="flex min-h-screen items-center justify-center px-5" style={{ background: 'var(--surface-page)' }}>
        <p className="text-sm" style={{ color: 'var(--text-muted)' }}>Link valideren…</p>
      </div>
    )
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
        <h1 className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>Nieuw wachtwoord</h1>
        <p className="mt-1.5 text-sm" style={{ color: 'var(--text-muted)' }}>Kies een sterk wachtwoord voor je account.</p>
        <form onSubmit={handleSubmit} className="mt-8 space-y-4">
          <Input
            label="Nieuw wachtwoord"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            minLength={6}
            autoComplete="new-password"
            autoFocus
          />
          <Input
            label="Bevestig wachtwoord"
            type="password"
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            required
            minLength={6}
            autoComplete="new-password"
          />
          {error && (
            <div className="rounded-xl px-4 py-3 text-sm text-red-500" style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)' }}>
              {error}
            </div>
          )}
          <Button type="submit" className="w-full" size="lg" loading={loading}>
            Wachtwoord opslaan
          </Button>
        </form>
        <p className="mt-6 text-center text-sm" style={{ color: 'var(--text-muted)' }}>
          <Link to="/login" className="font-semibold text-brand-500 hover:text-brand-600">Naar inloggen</Link>
        </p>
      </div>
    </div>
  )
}
