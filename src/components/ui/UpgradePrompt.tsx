import { Link } from 'react-router-dom'
import { Sparkles, ArrowRight, Check } from 'lucide-react'

interface UpgradePromptProps {
  title: string
  description: string
  benefits?: string[]
  requiredPlan?: 'Pro' | 'Business'
}

export function UpgradePrompt({ title, description, benefits = [], requiredPlan = 'Pro' }: UpgradePromptProps) {
  return (
    <div className="flex min-h-[50vh] items-center justify-center p-4">
      <div
        className="w-full max-w-md rounded-2xl p-8 text-center"
        style={{ background: 'var(--surface-card)', border: '1px solid var(--border)', boxShadow: 'var(--shadow-card)' }}
      >
        <div
          className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-2xl"
          style={{ background: 'rgba(245,158,11,0.12)' }}
        >
          <Sparkles className="h-7 w-7" style={{ color: '#F59E0B' }} />
        </div>
        <span
          className="mb-3 inline-block rounded-full px-3 py-1 text-xs font-semibold"
          style={{ background: 'rgba(59,130,246,0.12)', color: 'var(--brand-strong)' }}
        >
          {requiredPlan}-functie
        </span>
        <h1 className="text-xl font-bold" style={{ color: 'var(--text-primary)' }}>{title}</h1>
        <p className="mt-2 text-sm" style={{ color: 'var(--text-muted)' }}>{description}</p>

        {benefits.length > 0 && (
          <ul className="mx-auto mt-5 max-w-xs space-y-2 text-left">
            {benefits.map((b) => (
              <li key={b} className="flex items-center gap-2.5 text-sm" style={{ color: 'var(--text-secondary)' }}>
                <Check className="h-4 w-4 shrink-0" style={{ color: '#10B981' }} />
                {b}
              </li>
            ))}
          </ul>
        )}

        <Link
          to="/app/abonnement"
          className="mt-7 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-brand-600 px-6 py-3 text-sm font-semibold text-white transition-all hover:bg-brand-700"
        >
          Upgrade naar {requiredPlan}
          <ArrowRight className="h-4 w-4" />
        </Link>
      </div>
    </div>
  )
}
