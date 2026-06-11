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
    <div className="flex min-h-screen flex-col items-center justify-center p-4" style={{ background: '#09090b' }}>
      <div className="w-full max-w-lg">
        {/* Logo */}
        <div className="mb-10 text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-brand-600 shadow-lg shadow-brand-600/30">
            <Zap className="h-6 w-6 text-white" />
          </div>
          <p className="text-sm text-zinc-500">ShiftSync</p>
        </div>

        {/* Steps */}
        <div className="mb-8 flex items-center justify-center gap-3">
          {steps.map((s, i) => (
            <div key={s.id} className="flex items-center gap-3">
              <div className={`flex h-8 w-8 items-center justify-center rounded-full text-sm font-semibold transition-all ${
                step > s.id ? 'bg-brand-600 text-white' : step === s.id ? 'bg-zinc-100 text-zinc-900' : 'bg-zinc-800 text-zinc-500'
              }`}>
                {step > s.id ? <Check className="h-4 w-4" /> : s.id}
              </div>
              <span className={`text-sm ${step === s.id ? 'text-zinc-100' : 'text-zinc-600'}`}>
                {s.label}
              </span>
              {i < steps.length - 1 && (
                <div className={`h-px w-12 ${step > s.id ? 'bg-brand-600' : 'bg-zinc-800'}`} />
              )}
            </div>
          ))}
        </div>

        {step === 1 && (
          <div className="rounded-2xl p-8" style={{ background: '#111113', border: '1px solid rgba(255,255,255,0.08)' }}>
            <div className="mb-6 flex h-11 w-11 items-center justify-center rounded-xl bg-brand-500/15">
              <Building2 className="h-5 w-5 text-brand-400" />
            </div>
            <h1 className="text-2xl font-bold text-zinc-100">
              Welkom, {profile?.full_name?.split(' ')[0]}!
            </h1>
            <p className="mt-2 text-zinc-500">
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
                <div className="rounded-xl px-4 py-3 text-sm text-red-400" style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)' }}>
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
          <div className="rounded-2xl p-8 text-center" style={{ background: '#111113', border: '1px solid rgba(255,255,255,0.08)' }}>
            <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full" style={{ background: 'rgba(16,185,129,0.15)' }}>
              <Check className="h-8 w-8 text-emerald-400" />
            </div>
            <h1 className="text-2xl font-bold text-zinc-100">Je bent klaar!</h1>
            <p className="mt-3 text-zinc-400">
              <span className="text-zinc-100 font-semibold">{companyName}</span> is aangemaakt.
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
            <p className="mt-6 text-xs text-zinc-700">
              Je kunt medewerkers ook later toevoegen via het menu.
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
