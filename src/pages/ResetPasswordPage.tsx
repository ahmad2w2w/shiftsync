import { useEffect, useState, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Zap } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { getAuthHashError, authHashErrorMessage, clearAuthHash } from '../lib/authHash'
import { Button } from '../components/ui/Button'
import { Input } from '../components/ui/Input'

export function ResetPasswordPage() {
  const navigate = useNavigate()
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [ready, setReady] = useState(false)
  const [checking, setChecking] = useState(true)
  const [hashExpired, setHashExpired] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    const hashError = getAuthHashError()
    if (hashError) {
      setHashExpired(true)
      setError(authHashErrorMessage(hashError))
      clearAuthHash()
      setChecking(false)
      return
    }

    const finish = (hasSession: boolean) => {
      setReady(hasSession)
      setChecking(false)
    }

    supabase.auth.getSession().then(({ data: { session } }) => {
      finish(!!session)
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'PASSWORD_RECOVERY' || event === 'SIGNED_IN') {
        finish(!!session)
        clearAuthHash()
      }
    })

    const timeout = window.setTimeout(() => {
      supabase.auth.getSession().then(({ data: { session } }) => {
        setReady(!!session)
        setChecking(false)
      })
    }, 4000)

    return () => {
      subscription.unsubscribe()
      window.clearTimeout(timeout)
    }
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

  if (checking) {
    return (
      <div className="flex min-h-screen items-center justify-center px-5" style={{ background: 'var(--surface-page)' }}>
        <p className="text-sm" style={{ color: 'var(--text-muted)' }}>Link valideren…</p>
      </div>
    )
  }

  if (hashExpired || (!ready && !checking)) {
    return (
      <div className="flex min-h-screen items-center justify-center px-5 py-12" style={{ background: 'var(--surface-page)' }}>
        <div className="w-full max-w-sm text-center">
          <h1 className="text-xl font-bold" style={{ color: 'var(--text-primary)' }}>
            {hashExpired ? 'Link verlopen' : 'Link ongeldig'}
          </h1>
          <p className="mt-2 text-sm" style={{ color: 'var(--text-muted)' }}>
            {error || 'Deze link werkt niet meer. Vraag een nieuwe uitnodiging of resetlink aan.'}
          </p>
          <div className="mt-6 flex flex-col gap-2">
            <Link to="/wachtwoord-vergeten">
              <Button className="w-full">Nieuwe resetlink aanvragen</Button>
            </Link>
            <Link to="/login">
              <Button className="w-full" variant="secondary">Naar login</Button>
            </Link>
          </div>
        </div>
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
        <p className="mt-1.5 text-sm" style={{ color: 'var(--text-muted)' }}>Kies een wachtwoord voor je account.</p>
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
