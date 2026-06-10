import { useState } from 'react'
import { CheckCircle, CreditCard, Zap, Star, ExternalLink } from 'lucide-react'
import { useOrganization } from '../context/OrganizationContext'
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
  const [loading, setLoading] = useState<OrgPlan | null>(null)
  const [portalLoading, setPortalLoading] = useState(false)
  const [error, setError] = useState('')

  const handleUpgrade = async (targetPlan: OrgPlan) => {
    if (targetPlan === plan) return
    setError('')
    setLoading(targetPlan)
    try {
      const { data, error: fnError } = await supabase.functions.invoke('create-checkout', {
        body: {
          plan: targetPlan,
          organizationId: organization?.id,
          returnUrl: window.location.origin + '/app/abonnement',
        },
      })
      if (fnError) throw fnError
      if (data?.url) window.location.href = data.url
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'Kon geen betaalsessie starten. Controleer of de Stripe Edge Function is gedeployed.'
      )
    } finally {
      setLoading(null)
    }
  }

  const handlePortal = async () => {
    setPortalLoading(true)
    setError('')
    try {
      const { data, error: fnError } = await supabase.functions.invoke('create-checkout', {
        body: {
          portal: true,
          organizationId: organization?.id,
          returnUrl: window.location.origin + '/app/abonnement',
        },
      })
      if (fnError) throw fnError
      if (data?.url) window.location.href = data.url
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Kon het klantportaal niet openen.')
    } finally {
      setPortalLoading(false)
    }
  }

  const refresh = async () => {
    await refreshOrganization()
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-navy-900">Abonnement</h1>
        <p className="mt-1 text-sm text-gray-500">Beheer je plan en factuurgegevens.</p>
      </div>

      {/* Current plan */}
      <Card>
        <CardHeader title="Huidig abonnement" />
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-brand-100">
              <Zap className="h-6 w-6 text-brand-600" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <p className="text-lg font-bold text-navy-900">
                  {PLAN_LIMITS[plan].label}
                </p>
                <Badge variant={plan === 'free' ? 'default' : 'active'}>
                  {plan === 'free' ? 'Gratis' : 'Actief'}
                </Badge>
              </div>
              <p className="text-sm text-gray-500">
                {plan === 'free'
                  ? 'Tot 5 medewerkers'
                  : plan === 'pro'
                  ? 'Tot 25 medewerkers'
                  : 'Onbeperkt medewerkers'}
              </p>
            </div>
          </div>
          <div className="flex gap-2">
            <Button variant="secondary" size="sm" onClick={refresh}>
              Verversen
            </Button>
            {plan !== 'free' && (
              <Button
                variant="secondary"
                size="sm"
                onClick={handlePortal}
                loading={portalLoading}
              >
                <ExternalLink className="mr-1.5 h-4 w-4" />
                Facturen & betaalgegevens
              </Button>
            )}
          </div>
        </div>
      </Card>

      {error && (
        <div className="rounded-xl bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
          <strong>Fout:</strong> {error}
        </div>
      )}

      {/* Plan selection */}
      <div>
        <h2 className="text-lg font-semibold text-navy-900 mb-4">Kies een plan</h2>
        <div className="grid gap-6 sm:grid-cols-3">
          {plans.map((p) => {
            const isCurrent = p.id === plan
            return (
              <div
                key={p.id}
                className={`rounded-2xl p-6 border-2 transition-all ${
                  isCurrent
                    ? 'border-brand-500 bg-brand-50'
                    : p.highlighted
                    ? 'border-navy-200 bg-white hover:border-brand-300'
                    : 'border-gray-200 bg-white hover:border-gray-300'
                }`}
              >
                {p.highlighted && !isCurrent && (
                  <div className="mb-3 inline-flex items-center gap-1 rounded-full bg-brand-100 px-2.5 py-1 text-xs font-semibold text-brand-700">
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
                <h3 className="font-bold text-navy-900">{p.name}</h3>
                <div className="mt-2 flex items-end gap-1">
                  <span className="text-3xl font-bold text-navy-900">{p.price}</span>
                  <span className="mb-0.5 text-sm text-gray-500">{p.period}</span>
                </div>
                <ul className="mt-4 space-y-2">
                  {p.features.map((f) => (
                    <li key={f} className="flex items-center gap-2 text-sm text-gray-600">
                      <CheckCircle className="h-4 w-4 shrink-0 text-brand-600" />
                      {f}
                    </li>
                  ))}
                </ul>
                <div className="mt-6">
                  {isCurrent ? (
                    <div className="flex w-full items-center justify-center rounded-xl border-2 border-brand-300 py-2.5 text-sm font-medium text-brand-700">
                      <CheckCircle className="mr-2 h-4 w-4" />
                      Actief
                    </div>
                  ) : (
                    <Button
                      onClick={() => handleUpgrade(p.id)}
                      loading={loading === p.id}
                      className="w-full"
                      variant={p.highlighted ? 'primary' : 'secondary'}
                    >
                      <CreditCard className="mr-2 h-4 w-4" />
                      {p.id === 'free' ? 'Downgraden' : 'Upgraden'}
                    </Button>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Info */}
      <Card>
        <p className="text-sm text-gray-500 leading-relaxed">
          Betalingen worden veilig verwerkt via <strong>Stripe</strong>. Je kunt je abonnement
          op elk moment wijzigen of opzeggen. Bij een upgrade ga je direct over naar het nieuwe plan.
          Bij een downgrade wordt dit verwerkt aan het einde van je huidige factuurperiode.
          Voor vragen: <a href="mailto:support@shiftsync.nl" className="text-brand-600 hover:underline">support@shiftsync.nl</a>
        </p>
      </Card>
    </div>
  )
}
