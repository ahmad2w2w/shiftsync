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
    if (!companyName.trim()) {
      setError('Voer een bedrijfsnaam in.')
      return
    }
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
    <div className="flex min-h-screen flex-col items-center justify-center bg-navy-950 p-4">
      <div className="w-full max-w-lg">
        {/* Logo */}
        <div className="mb-10 text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-brand-600">
            <Zap className="h-7 w-7 text-white" />
          </div>
          <p className="text-navy-300 text-sm">ShiftSync</p>
        </div>

        {/* Step indicators */}
        <div className="mb-8 flex items-center justify-center gap-3">
          {steps.map((s, i) => (
            <div key={s.id} className="flex items-center gap-3">
              <div className={`flex h-8 w-8 items-center justify-center rounded-full text-sm font-medium transition-all ${
                step > s.id
                  ? 'bg-brand-600 text-white'
                  : step === s.id
                  ? 'bg-white text-navy-900'
                  : 'bg-white/10 text-navy-400'
              }`}>
                {step > s.id ? <Check className="h-4 w-4" /> : s.id}
              </div>
              <span className={`text-sm ${step === s.id ? 'text-white' : 'text-navy-500'}`}>
                {s.label}
              </span>
              {i < steps.length - 1 && (
                <div className={`h-px w-12 ${step > s.id ? 'bg-brand-600' : 'bg-white/10'}`} />
              )}
            </div>
          ))}
        </div>

        {step === 1 && (
          <div className="rounded-2xl bg-white p-8 shadow-2xl">
            <div className="mb-6 flex h-12 w-12 items-center justify-center rounded-xl bg-brand-100">
              <Building2 className="h-6 w-6 text-brand-600" />
            </div>
            <h1 className="text-2xl font-bold text-navy-900">
              Welkom, {profile?.full_name?.split(' ')[0]}!
            </h1>
            <p className="mt-2 text-gray-500">
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
                <div className="rounded-lg bg-red-50 px-3 py-2.5 text-sm text-red-700">
                  {error}
                </div>
              )}
              <Button type="submit" className="w-full" size="lg" loading={loading}>
                Organisatie aanmaken
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </form>
          </div>
        )}

        {step === 2 && (
          <div className="rounded-2xl bg-white p-8 shadow-2xl text-center">
            <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100">
              <Check className="h-8 w-8 text-emerald-600" />
            </div>
            <h1 className="text-2xl font-bold text-navy-900">Je bent klaar!</h1>
            <p className="mt-3 text-gray-500">
              <strong className="text-navy-900">{companyName}</strong> is aangemaakt.
              Je kunt nu beginnen met het plannen van je team.
            </p>

            <div className="mt-8 space-y-3">
              <Button
                onClick={() => navigate('/app/medewerkers')}
                className="w-full"
                size="lg"
              >
                Medewerkers toevoegen
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
              <Button
                onClick={() => navigate('/app/dashboard')}
                variant="secondary"
                className="w-full"
                size="lg"
              >
                Ga naar dashboard
              </Button>
            </div>

            <p className="mt-6 text-xs text-gray-400">
              Je kunt medewerkers ook later toevoegen via het menu.
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
