import { Link } from 'react-router-dom'
import type { LucideIcon } from 'lucide-react'
import { ArrowUpRight, ArrowDownRight, ChevronRight } from 'lucide-react'
import { cn } from '../../lib/utils'

interface StatCardProps {
  label: string
  value: string | number
  icon: LucideIcon
  to?: string
  trend?: string
  delta?: { value: string; direction: 'up' | 'down' | 'flat'; good?: boolean }
  accent?: 'brand' | 'success' | 'warning' | 'error' | 'leave' | 'neutral'
}

const accentStyles = {
  brand:   { bg: 'rgba(59,130,246,0.12)',  icon: '#3B82F6' },
  success: { bg: 'rgba(16,185,129,0.12)',  icon: '#10B981' },
  warning: { bg: 'rgba(245,158,11,0.12)',  icon: '#F59E0B' },
  error:   { bg: 'rgba(239,68,68,0.12)',   icon: '#EF4444' },
  leave:   { bg: 'rgba(139,92,246,0.12)',  icon: '#8B5CF6' },
  neutral: { bg: 'var(--surface-subtle)',  icon: 'var(--text-muted)' },
}

export function StatCard({ label, value, icon: Icon, to, trend, delta, accent = 'brand' }: StatCardProps) {
  const style = accentStyles[accent]
  const deltaColor = delta
    ? delta.direction === 'flat'
      ? 'var(--text-muted)'
      : delta.good === false
        ? 'var(--color-error)'
        : 'var(--color-success)'
    : undefined

  const inner = (
    <div
      className={cn('group relative overflow-hidden rounded-2xl p-4 transition-all', to && 'press cursor-pointer hover:shadow-[var(--shadow-3)]')}
      style={{ background: 'var(--surface-card)', border: '1px solid var(--border)', boxShadow: 'var(--shadow-1)' }}
    >
      <div className="flex items-start justify-between gap-3">
        <span className="flex h-10 w-10 items-center justify-center rounded-xl" style={{ background: style.bg }}>
          <Icon className="h-5 w-5" style={{ color: style.icon }} />
        </span>
        {to && <ChevronRight className="h-4 w-4 shrink-0 opacity-0 transition-opacity group-hover:opacity-60" style={{ color: 'var(--text-muted)' }} />}
      </div>
      <p className="mt-3 text-2xl font-bold tabular-nums" style={{ color: 'var(--text-primary)' }}>{value}</p>
      <div className="mt-0.5 flex items-center gap-1.5">
        <p className="text-xs" style={{ color: 'var(--text-muted)' }}>{label}</p>
        {delta && (
          <span className="inline-flex items-center gap-0.5 text-[11px] font-semibold tabular-nums" style={{ color: deltaColor }}>
            {delta.direction === 'up' && <ArrowUpRight className="h-3 w-3" />}
            {delta.direction === 'down' && <ArrowDownRight className="h-3 w-3" />}
            {delta.value}
          </span>
        )}
      </div>
      {trend && <p className="mt-0.5 text-xs" style={{ color: 'var(--text-disabled)' }}>{trend}</p>}
    </div>
  )

  if (to) return <Link to={to}>{inner}</Link>
  return inner
}
