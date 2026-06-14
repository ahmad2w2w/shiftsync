import { Link } from 'react-router-dom'
import { Sparkles, AlertTriangle } from 'lucide-react'
import { useOrganization } from '../../context/OrganizationContext'
import { useAuth } from '../../context/AuthContext'

export function TrialBanner() {
  const { isAdmin } = useAuth()
  const { isSubscribed, isTrialActive, trialDaysLeft } = useOrganization()

  if (!isAdmin || isSubscribed) return null

  const expired = !isTrialActive

  return (
    <div
      className="flex flex-wrap items-center justify-between gap-3 px-4 py-2.5 text-sm"
      style={{
        background: expired ? 'rgba(245,158,11,0.1)' : 'rgba(59,130,246,0.08)',
        borderBottom: `1px solid ${expired ? 'rgba(245,158,11,0.25)' : 'rgba(59,130,246,0.2)'}`,
      }}
    >
      <div className="flex items-center gap-2 min-w-0">
        {expired ? (
          <AlertTriangle className="h-4 w-4 shrink-0" style={{ color: '#F59E0B' }} />
        ) : (
          <Sparkles className="h-4 w-4 shrink-0" style={{ color: 'var(--brand-strong)' }} />
        )}
        <span style={{ color: 'var(--text-primary)' }}>
          {expired
            ? 'Je proefperiode is verlopen. Activeer je abonnement om door te gaan.'
            : `Proefperiode — nog ${trialDaysLeft} dag${trialDaysLeft !== 1 ? 'en' : ''} gratis`}
        </span>
      </div>
      <Link
        to="/app/abonnement"
        className="shrink-0 rounded-lg px-3 py-1.5 text-xs font-semibold text-white transition-opacity hover:opacity-90"
        style={{ background: expired ? '#F59E0B' : 'var(--brand-strong)' }}
      >
        {expired ? 'Abonnement activeren' : 'Bekijk abonnement'}
      </Link>
    </div>
  )
}
