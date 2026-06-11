import { useState, type FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { Zap, Building2, ArrowRight, Check } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { useOrganization } from '../context/OrganizationContext'
import { createOrganization } from '../services/organizations'
import { Button } from '../components/ui/Button'
import { Input } from '../components/ui/Input'

const steps = [
  { id: 1, label: 'Bedrijfsnaam' },
  { id: 2, label: 'Bevestiging' },
]

export function OnboardingPage() {
  const { profile, refreshProfile } = useAuth()
  const { refreshOrganization } = useOrganization()
  const navigate = useNavigate()
  const [step, setStep] = useState(1)
  const [companyName, setCompanyName] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleCreate = async (e: FormEvent) => {
    e.preventDefault()
    if (!companyName.trim()) { setError('Voer een bedrijfsnaam in.'); return }
    setError('')
    setLoading(true)
    try {
      await createOrganization(companyName.trim())
      await refreshProfile()
      await refreshOrganization()
      setStep(2)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Kon de organisatie niet aanmaken.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div
      className="flex min-h-screen flex-col items-center justify-center p-4"
      style={{ background: 'var(--surface-page)' }}
    >
      <div className="w-full max-w-lg">
        {/* Logo */}
        <div className="mb-10 text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-brand-500 shadow-lg shadow-brand-500/30">
            <Zap className="h-6 w-6 text-white" />
          </div>
          <p className="text-sm" style={{ color: 'var(--text-muted)' }}>ShiftSync</p>
        </div>

        {/* Steps */}
        <div className="mb-8 flex items-center justify-center gap-3">
          {steps.map((s, i) => (
            <div key={s.id} className="flex items-center gap-3">
              <div
                className="flex h-8 w-8 items-center justify-center rounded-full text-sm font-semibold transition-all"
                style={
                  step > s.id
                    ? { background: '#3B82F6', color: 'white' }
                    : step === s.id
                    ? { background: 'var(--text-primary)', color: 'var(--surface-page)' }
                    : { background: 'var(--border-strong)', color: 'var(--text-muted)' }
                }
              >
                {step > s.id ? <Check className="h-4 w-4" /> : s.id}
              </div>
              <span
                className="text-sm"
                style={{ color: step === s.id ? 'var(--text-primary)' : 'var(--text-muted)' }}
              >
                {s.label}
              </span>
              {i < steps.length - 1 && (
                <div
                  className="h-px w-12"
                  style={{ background: step > s.id ? '#3B82F6' : 'var(--border-strong)' }}
                />
              )}
            </div>
          ))}
        </div>

        {step === 1 && (
          <div
            className="rounded-2xl p-8"
            style={{ background: 'var(--surface-card)', border: '1px solid var(--border)', boxShadow: 'var(--shadow-card)' }}
          >
            <div className="mb-6 flex h-11 w-11 items-center justify-center rounded-xl bg-brand-500/15">
              <Building2 className="h-5 w-5 text-brand-500" />
            </div>
            <h1 className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>
              Welkom, {profile?.full_name?.split(' ')[0]}!
            </h1>
            <p className="mt-2" style={{ color: 'var(--text-muted)' }}>
              Geef je bedrijf of vestiging een naam om te beginnen.
            </p>
            <form onSubmit={handleCreate} className="mt-8 space-y-4">
              <Input
                label="Bedrijfsnaam"
                type="text"
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
                placeholder="bijv. Restaurant de Linde"
                required
                autoFocus
              />
              {error && (
                <div className="rounded-xl px-4 py-3 text-sm text-red-500 dark:text-red-400" style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)' }}>
                  {error}
                </div>
              )}
              <Button type="submit" className="w-full" size="lg" loading={loading}>
                Organisatie aanmaken
                <ArrowRight className="h-4 w-4" />
              </Button>
            </form>
          </div>
        )}

        {step === 2 && (
          <div
            className="rounded-2xl p-8 text-center"
            style={{ background: 'var(--surface-card)', border: '1px solid var(--border)', boxShadow: 'var(--shadow-card)' }}
          >
            <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full" style={{ background: 'rgba(16,185,129,0.12)', border: '1px solid rgba(16,185,129,0.25)' }}>
              <Check className="h-8 w-8 text-emerald-500" />
            </div>
            <h1 className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>Je bent klaar!</h1>
            <p className="mt-3" style={{ color: 'var(--text-secondary)' }}>
              <span className="font-semibold" style={{ color: 'var(--text-primary)' }}>{companyName}</span> is aangemaakt.
              Je kunt nu beginnen met het plannen van je team.
            </p>
            <div className="mt-8 space-y-3">
              <Button onClick={() => navigate('/app/medewerkers')} className="w-full" size="lg">
                Medewerkers toevoegen
                <ArrowRight className="h-4 w-4" />
              </Button>
              <Button onClick={() => navigate('/app/dashboard')} variant="secondary" className="w-full" size="lg">
                Ga naar dashboard
              </Button>
            </div>
            <p className="mt-6 text-xs" style={{ color: 'var(--text-disabled)' }}>
              Je kunt medewerkers ook later toevoegen via het menu.
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
