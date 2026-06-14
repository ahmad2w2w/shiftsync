import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { X, Users, MapPin, Calendar, CheckCircle2 } from 'lucide-react'
import { Button } from '../ui/Button'

const STORAGE_KEY = 'shiftsync_manager_tour_done'

const steps = [
  {
    icon: Users,
    title: 'Voeg medewerkers toe',
    desc: 'Nodig je team uit per e-mail. Zij ontvangen een link om hun account te activeren.',
    to: '/app/medewerkers',
    cta: 'Naar medewerkers',
  },
  {
    icon: MapPin,
    title: 'Stel je werkplek in',
    desc: 'Voeg een locatie toe en schakel GPS in voor betrouwbare in- en uitklokken op locatie.',
    to: '/app/instellingen',
    cta: 'Naar instellingen',
  },
  {
    icon: Calendar,
    title: 'Maak je eerste rooster',
    desc: 'Gebruik templates en de maandplanner om diensten in te plannen en te publiceren.',
    to: '/app/maandplanner',
    cta: 'Naar maandplanner',
  },
]

export function ManagerOnboardingTour() {
  const [visible, setVisible] = useState(false)
  const [step, setStep] = useState(0)

  useEffect(() => {
    if (localStorage.getItem(STORAGE_KEY) === '1') return
    const t = setTimeout(() => setVisible(true), 800)
    return () => clearTimeout(t)
  }, [])

  const dismiss = () => {
    localStorage.setItem(STORAGE_KEY, '1')
    setVisible(false)
  }

  if (!visible) return null

  const current = steps[step]
  const Icon = current.icon
  const isLast = step === steps.length - 1

  return (
    <div
      className="fixed bottom-4 left-4 right-4 z-[90] mx-auto max-w-md animate-slide-up sm:left-auto sm:right-6"
      role="region"
      aria-label="Onboarding checklist"
    >
      <div
        className="rounded-2xl p-5 shadow-xl"
        style={{ background: 'var(--surface-card)', border: '1px solid var(--border)', boxShadow: 'var(--shadow-card-md)' }}
      >
        <div className="mb-4 flex items-start justify-between gap-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide" style={{ color: 'var(--brand-strong)' }}>
              Aan de slag · {step + 1}/{steps.length}
            </p>
            <h3 className="mt-1 font-semibold" style={{ color: 'var(--text-primary)' }}>{current.title}</h3>
          </div>
          <button
            type="button"
            onClick={dismiss}
            className="rounded-lg p-1 transition-colors hover:bg-black/5"
            style={{ color: 'var(--text-muted)' }}
            aria-label="Tour sluiten"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
        <div className="flex gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl" style={{ background: 'var(--brand-muted)' }}>
            <Icon className="h-5 w-5" style={{ color: 'var(--brand-strong)' }} />
          </div>
          <p className="text-sm leading-relaxed" style={{ color: 'var(--text-muted)' }}>{current.desc}</p>
        </div>
        <div className="mt-4 flex flex-wrap gap-2">
          {step > 0 && (
            <Button size="sm" variant="secondary" onClick={() => setStep((s) => s - 1)}>
              Vorige
            </Button>
          )}
          {!isLast ? (
            <Button size="sm" onClick={() => setStep((s) => s + 1)}>
              Volgende
            </Button>
          ) : (
            <Button size="sm" onClick={dismiss}>
              <CheckCircle2 className="h-4 w-4" /> Klaar
            </Button>
          )}
          <Link to={current.to} onClick={dismiss}>
            <Button size="sm" variant="ghost">{current.cta}</Button>
          </Link>
        </div>
        <div className="mt-3 flex gap-1">
          {steps.map((_, i) => (
            <div
              key={i}
              className="h-1 flex-1 rounded-full transition-colors"
              style={{ background: i <= step ? 'var(--brand)' : 'var(--border)' }}
            />
          ))}
        </div>
      </div>
    </div>
  )
}

export function resetManagerTour() {
  localStorage.removeItem(STORAGE_KEY)
}
