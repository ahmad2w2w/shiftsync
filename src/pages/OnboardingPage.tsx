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
    <div className="flex min-h-screen flex-col items-center justify-center px-5 py-12" style={{ background: 'var(--surface-page)' }}>
      <div className="mb-8 flex items-center gap-2.5">
        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand-500">
          <Zap className="h-5 w-5 text-white" />
        </div>
        <span className="text-base font-bold" style={{ color: 'var(--text-primary)' }}>ShiftSync</span>
      </div>

      <div className="mb-8 flex gap-2">
        {steps.map((s) => (
          <div
            key={s.id}
            className="flex items-center gap-2 rounded-full px-3 py-1 text-xs font-medium"
            style={{
              background: step >= s.id ? 'rgba(59,130,246,0.12)' : 'var(--surface-subtle)',
              color: step >= s.id ? 'var(--brand-strong)' : 'var(--text-muted)',
              border: '1px solid var(--border)',
            }}
          >
            {step > s.id ? <Check className="h-3 w-3" /> : s.id}
            {s.label}
          </div>
        ))}
      </div>

      <div className="w-full max-w-md">
        {step === 1 && (
          <div className="rounded-2xl p-8" style={{ background: 'var(--surface-card)', border: '1px solid var(--border)', boxShadow: 'var(--shadow-card)' }}>
            <div className="mb-6 flex h-12 w-12 items-center justify-center rounded-xl" style={{ background: 'var(--brand-muted)' }}>
              <Building2 className="h-6 w-6" style={{ color: 'var(--brand-strong)' }} />
            </div>
            <h1 className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>Welkom{profile?.full_name ? `, ${profile.full_name.split(' ')[0]}` : ''}!</h1>
            <p className="mt-2 text-sm" style={{ color: 'var(--text-muted)' }}>Hoe heet je bedrijf of team?</p>
            <form onSubmit={handleCreate} className="mt-6 space-y-4">
              <Input label="Bedrijfsnaam" value={companyName} onChange={(e) => setCompanyName(e.target.value)} placeholder="Bijv. Café De Horizon" required autoFocus />
              {error && (
                <div className="rounded-xl px-4 py-3 text-sm text-red-500" style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)' }}>
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
          <div className="rounded-2xl p-8 text-center" style={{ background: 'var(--surface-card)', border: '1px solid var(--border)', boxShadow: 'var(--shadow-card)' }}>
            <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full" style={{ background: 'rgba(16,185,129,0.12)', border: '1px solid rgba(16,185,129,0.25)' }}>
              <Check className="h-8 w-8 text-emerald-500" />
            </div>
            <h1 className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>Je bent klaar!</h1>
            <p className="mt-3" style={{ color: 'var(--text-secondary)' }}>
              <span className="font-semibold" style={{ color: 'var(--text-primary)' }}>{companyName}</span> is aangemaakt.
              Voeg medewerkers toe en start met plannen.
            </p>
            <div className="mt-8 space-y-3">
              <Button onClick={() => navigate('/app/medewerkers')} className="w-full" size="lg">
                Medewerkers toevoegen
                <ArrowRight className="h-4 w-4" />
              </Button>
              <Button onClick={() => navigate('/app/abonnement')} variant="secondary" className="w-full" size="lg">
                Abonnement instellen
              </Button>
              <Button onClick={() => navigate('/app/dashboard')} variant="ghost" className="w-full" size="lg">
                Ga naar dashboard
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
