import { useEffect, useState } from 'react'
import { CheckCircle, CreditCard, Zap, ExternalLink, ShieldCheck, Users } from 'lucide-react'
import { useOrganization, PRODUCT } from '../context/OrganizationContext'
import { useToast } from '../context/ToastContext'
import { supabase } from '../lib/supabase'
import { getAllUsers } from '../services/users'
import { Card, CardHeader } from '../components/ui/Card'
import { Button } from '../components/ui/Button'
import { Badge } from '../components/ui/Badge'
import { PageHeader } from '../components/ui/PageHeader'

export function BillingPage() {
  const { organization, isSubscribed, pricePerEmployee, refreshOrganization } = useOrganization()
  const toast = useToast()
  const [employeeCount, setEmployeeCount] = useState(1)
  const [checkoutLoading, setCheckoutLoading] = useState(false)
  const [portalLoading, setPortalLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    getAllUsers().then((users) => setEmployeeCount(Math.max(1, users.length)))
  }, [])

  const monthlyTotal = employeeCount * pricePerEmployee

  const handleRefresh = async () => {
    await refreshOrganization()
    toast.success('Abonnementsgegevens ververst')
  }

  const handleSubscribe = async () => {
    setError('')
    setCheckoutLoading(true)
    try {
      const { data, error: fnError } = await supabase.functions.invoke('create-checkout', {
        body: {
          organizationId: organization?.id,
          employeeCount,
          returnUrl: window.location.origin + '/app/abonnement',
        },
      })
      if (fnError) throw fnError
      if (data?.error) throw new Error(data.error)
      if (data?.url) window.location.href = data.url
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Kon geen betaalsessie starten.')
    } finally {
      setCheckoutLoading(false)
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
    <div className="mx-auto max-w-3xl space-y-6">
      <PageHeader
        title="Abonnement"
        subtitle={`${PRODUCT.name} — één pakket met alles inbegrepen`}
      />

      <Card>
        <CardHeader title="Huidig abonnement" />
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-brand-500/15">
              <Zap className="h-6 w-6 text-brand-400" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <p className="text-lg font-bold" style={{ color: 'var(--text-primary)' }}>{PRODUCT.label}</p>
                <Badge variant={isSubscribed ? 'active' : 'pending'}>
                  {isSubscribed ? 'Actief' : 'Nog niet actief'}
                </Badge>
              </div>
              <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
                €{pricePerEmployee} per medewerker per maand
              </p>
            </div>
          </div>
          <div className="flex gap-2">
            <Button variant="secondary" size="sm" onClick={handleRefresh}>Verversen</Button>
            {isSubscribed && (
              <Button variant="secondary" size="sm" onClick={handlePortal} loading={portalLoading}>
                <ExternalLink className="h-4 w-4" />
                Facturen & betaalgegevens
              </Button>
            )}
          </div>
        </div>
      </Card>

      {error && (
        <div className="rounded-xl px-4 py-3 text-sm text-red-600" style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)' }}>
          <strong>Fout:</strong> {error}
        </div>
      )}

      <Card className="overflow-hidden">
        <div className="p-6 sm:p-8">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <h2 className="text-xl font-bold" style={{ color: 'var(--text-primary)' }}>Alles in één pakket</h2>
              <p className="mt-1 text-sm" style={{ color: 'var(--text-muted)' }}>
                Geen Pro of Business — alle functies zitten standaard inbegrepen.
              </p>
            </div>
            <div className="text-right">
              <p className="text-4xl font-bold tracking-tight" style={{ color: 'var(--text-primary)' }}>
                €{pricePerEmployee}
              </p>
              <p className="text-sm" style={{ color: 'var(--text-muted)' }}>per medewerker / maand</p>
            </div>
          </div>

          <ul className="mt-8 grid gap-2.5 sm:grid-cols-2">
            {PRODUCT.features.map((f) => (
              <li key={f} className="flex items-start gap-2 text-sm" style={{ color: 'var(--text-secondary)' }}>
                <CheckCircle className="mt-0.5 h-4 w-4 shrink-0 text-brand-600" />
                {f}
              </li>
            ))}
          </ul>

          <div
            className="mt-8 flex flex-wrap items-center justify-between gap-4 rounded-xl px-5 py-4"
            style={{ background: 'var(--surface-subtle)', border: '1px solid var(--border)' }}
          >
            <div className="flex items-center gap-3">
              <Users className="h-5 w-5" style={{ color: 'var(--brand)' }} />
              <div>
                <p className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
                  {employeeCount} medewerker{employeeCount !== 1 ? 's' : ''} in je team
                </p>
                <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
                  {employeeCount} × €{pricePerEmployee} = <strong>€{monthlyTotal}/maand</strong>
                </p>
              </div>
            </div>
            {!isSubscribed ? (
              <Button onClick={handleSubscribe} loading={checkoutLoading}>
                <CreditCard className="h-4 w-4" />
                Abonnement starten
              </Button>
            ) : (
              <Button variant="secondary" onClick={handlePortal} loading={portalLoading}>
                Abonnement beheren
              </Button>
            )}
          </div>
        </div>
      </Card>

      <Card>
        <div className="flex items-start gap-3">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl" style={{ background: 'rgba(16,185,129,0.12)' }}>
            <ShieldCheck className="h-5 w-5" style={{ color: '#10B981' }} />
          </div>
          <p className="text-sm leading-relaxed" style={{ color: 'var(--text-muted)' }}>
            Betalingen worden veilig verwerkt via Stripe. Je betaalt alleen voor het aantal medewerkers in je team.
            Opzeggen kan op elk moment via het klantportaal.
          </p>
        </div>
      </Card>
    </div>
  )
}
