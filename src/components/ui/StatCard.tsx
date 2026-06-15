import { Link } from 'react-router-dom'
import type { LucideIcon } from 'lucide-react'
import { cn } from '../../lib/utils'

interface StatCardProps {
  label: string
  value: string | number
  icon: LucideIcon
  to?: string
  trend?: string
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

export function StatCard({ label, value, icon: Icon, to, trend, accent = 'brand' }: StatCardProps) {
  const style = accentStyles[accent]
  const inner = (
    <div
      className={cn('rounded-xl p-4', to && 'cursor-pointer hover:opacity-90')}
      style={{
        background: 'var(--surface-card)',
        border: '1px solid var(--border)',
      }}
    >
      <div className="flex items-center justify-between gap-3">
        <div className="min-w-0">
          <p className="text-xs" style={{ color: 'var(--text-muted)' }}>{label}</p>
          <p className="mt-1 text-2xl font-semibold" style={{ color: 'var(--text-primary)' }}>{value}</p>
          {trend && <p className="mt-0.5 text-xs" style={{ color: 'var(--text-muted)' }}>{trend}</p>}
        </div>
        <Icon className="h-5 w-5 shrink-0 opacity-40" style={{ color: style.icon }} />
      </div>
    </div>
  )

  if (to) return <Link to={to}>{inner}</Link>
  return inner
}
