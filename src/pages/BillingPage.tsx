import { useState } from 'react'
import { CheckCircle, CreditCard, Zap, Star, ExternalLink, ShieldCheck } from 'lucide-react'
import { useOrganization } from '../context/OrganizationContext'
import { useToast } from '../context/ToastContext'
import { supabase } from '../lib/supabase'
import { Card, CardHeader } from '../components/ui/Card'
import { Button } from '../components/ui/Button'
import { Badge } from '../components/ui/Badge'
import { PLAN_LIMITS } from '../types/database'
import type { OrgPlan } from '../types/database'

const plans: {
  id: OrgPlan
  name: string
  price: string
  period: string
  features: string[]
  highlighted: boolean
}[] = [
  {
    id: 'free',
    name: 'Free',
    price: '€0',
    period: 'per maand',
    features: ['Tot 5 medewerkers', 'Roosterplanning', 'Tijdregistratie', 'Verlofbeheer'],
    highlighted: false,
  },
  {
    id: 'pro',
    name: 'Pro',
    price: '€29',
    period: 'per maand',
    features: ['Tot 25 medewerkers', 'Maandplanner', 'PDF & Excel export', 'Prioriteit support'],
    highlighted: true,
  },
  {
    id: 'business',
    name: 'Business',
    price: '€79',
    period: 'per maand',
    features: ['Onbeperkt medewerkers', 'E-mailnotificaties', 'Geavanceerde rapporten', 'Persoonlijke onboarding'],
    highlighted: false,
  },
]

export function BillingPage() {
  const { organization, plan, refreshOrganization } = useOrganization()
  const toast = useToast()
  const [loading, setLoading] = useState<OrgPlan | null>(null)
  const [portalLoading, setPortalLoading] = useState(false)
  const [error, setError] = useState('')

  const handleRefresh = async () => {
    await refreshOrganization()
    toast.success('Abonnementsgegevens ververst')
  }

  const handleUpgrade = async (targetPlan: OrgPlan) => {
    if (targetPlan === plan) return
    setError('')
    setLoading(targetPlan)
    try {
      const { data, error: fnError } = await supabase.functions.invoke('create-checkout', {
        body: { plan: targetPlan, organizationId: organization?.id, returnUrl: window.location.origin + '/app/abonnement' },
      })
      if (fnError) throw fnError
      if (data?.url) window.location.href = data.url
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Kon geen betaalsessie starten. Controleer of de Stripe Edge Function is gedeployed.')
    } finally {
      setLoading(null)
    }
  }

  const handlePortal = async () => {
    setPortalLoading(true)
    setError('')
    try {
      const { data, error: fnError } = await supabase.functions.invoke('create-checkout', {
        body: { portal: true, organizationId: organization?.id, returnUrl: window.location.origin + '/app/abonnement' },
      })
      if (fnError) throw fnError
      if (data?.url) window.location.href = data.url
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Kon het klantportaal niet openen.')
    } finally {
      setPortalLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-zinc-100">Abonnement</h1>
        <p className="mt-1 text-sm text-zinc-500">Beheer je plan en factuurgegevens.</p>
      </div>

      {/* Current plan */}
      <Card>
        <CardHeader title="Huidig abonnement" />
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-brand-500/15">
              <Zap className="h-6 w-6 text-brand-400" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <p className="text-lg font-bold text-zinc-100">{PLAN_LIMITS[plan].label}</p>
                <Badge variant={plan === 'free' ? 'default' : 'active'}>
                  {plan === 'free' ? 'Gratis' : 'Actief'}
                </Badge>
              </div>
              <p className="text-sm text-zinc-500">
                {plan === 'free' ? 'Tot 5 medewerkers' : plan === 'pro' ? 'Tot 25 medewerkers' : 'Onbeperkt medewerkers'}
              </p>
            </div>
          </div>
          <div className="flex gap-2">
            <Button variant="secondary" size="sm" onClick={handleRefresh}>Verversen</Button>
            {plan !== 'free' && (
              <Button variant="secondary" size="sm" onClick={handlePortal} loading={portalLoading}>
                <ExternalLink className="h-4 w-4" />
                Facturen & betaalgegevens
              </Button>
            )}
          </div>
        </div>
      </Card>

      {error && (
        <div className="rounded-xl px-4 py-3 text-sm text-red-400" style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)' }}>
          <strong>Fout:</strong> {error}
        </div>
      )}

      {/* Plan selection */}
      <div>
        <h2 className="mb-4 text-base font-semibold text-zinc-100">Kies een plan</h2>
        <div className="grid gap-4 sm:grid-cols-3">
          {plans.map((p) => {
            const isCurrent = p.id === plan
            return (
              <div
                key={p.id}
                className="relative flex flex-col rounded-2xl p-6 transition-all"
                style={
                  isCurrent
                    ? { background: 'rgba(59,130,246,0.08)', border: '2px solid rgba(59,130,246,0.35)' }
                    : { background: 'var(--surface-subtle)', border: '1px solid var(--border)' }
                }
              >
                {p.highlighted && !isCurrent && (
                  <div className="mb-3 inline-flex items-center gap-1 rounded-full bg-brand-500/15 px-2.5 py-1 text-xs font-semibold text-brand-400">
                    <Star className="h-3 w-3" />
                    Populair
                  </div>
                )}
                {isCurrent && (
                  <div className="mb-3 inline-flex items-center gap-1 rounded-full bg-brand-600 px-2.5 py-1 text-xs font-semibold text-white">
                    <CheckCircle className="h-3 w-3" />
                    Huidig plan
                  </div>
                )}
                <h3 className="font-bold text-zinc-100">{p.name}</h3>
                <div className="mt-2 flex items-end gap-1">
                  <span className="text-3xl font-bold text-zinc-100">{p.price}</span>
                  <span className="mb-0.5 text-sm text-zinc-500">{p.period}</span>
                </div>
                <ul className="mt-4 flex-1 space-y-2">
                  {p.features.map((f) => (
                    <li key={f} className="flex items-center gap-2 text-sm text-zinc-400">
                      <CheckCircle className="h-4 w-4 shrink-0 text-brand-500" />
                      {f}
                    </li>
                  ))}
                </ul>
                <div className="mt-5">
                  {isCurrent ? (
                    <div className="flex w-full items-center justify-center rounded-xl py-2.5 text-sm font-medium text-brand-400" style={{ border: '1px solid rgba(37,99,235,0.3)' }}>
                      <CheckCircle className="mr-2 h-4 w-4" />
                      Actief
                    </div>
                  ) : (
                    <Button onClick={() => handleUpgrade(p.id)} loading={loading === p.id} className="w-full" variant={p.highlighted ? 'primary' : 'secondary'}>
                      <CreditCard className="h-4 w-4" />
                      {p.id === 'free' ? 'Downgraden' : 'Upgraden'}
                    </Button>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      </div>

      <Card>
        <div className="flex items-start gap-3">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl" style={{ background: 'rgba(16,185,129,0.12)' }}>
            <ShieldCheck className="h-5 w-5" style={{ color: '#10B981' }} />
          </div>
          <p className="text-sm leading-relaxed text-zinc-500">
            Betalingen worden veilig verwerkt via <span className="text-zinc-300 font-medium">Stripe</span>. Je kunt je abonnement op elk moment wijzigen of opzeggen.
            Voor vragen:{' '}
            <a href="mailto:support@shiftsync.nl" className="text-brand-400 hover:text-brand-300 transition-colors">
              support@shiftsync.nl
            </a>
          </p>
        </div>
      </Card>
    </div>
  )
}
