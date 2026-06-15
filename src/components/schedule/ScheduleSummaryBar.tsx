import { Clock, Euro, Calendar, AlertCircle } from 'lucide-react'

interface ScheduleSummaryBarProps {
  hours: number
  cost: number
  shiftCount: number
  openCount: number
}

export function ScheduleSummaryBar({ hours, cost, shiftCount, openCount }: ScheduleSummaryBarProps) {
  const items = [
    { icon: Calendar, label: 'Diensten', value: String(shiftCount), color: 'var(--brand-strong)' },
    { icon: Clock, label: 'Uren', value: `${Math.round(hours)}u`, color: 'var(--color-success)' },
    { icon: Euro, label: 'Loonkosten', value: `€${Math.round(cost).toLocaleString('nl-NL')}`, color: 'var(--text-primary)' },
    { icon: AlertCircle, label: 'Open', value: String(openCount), color: openCount > 0 ? 'var(--color-warning)' : 'var(--text-muted)' },
  ]
  return (
    <div
      className="grid grid-cols-2 gap-3 rounded-2xl p-3 sm:grid-cols-4"
      style={{ background: 'var(--surface-card)', border: '1px solid var(--border)', boxShadow: 'var(--shadow-1)' }}
    >
      {items.map(({ icon: Icon, label, value, color }) => (
        <div key={label} className="flex items-center gap-2.5 px-2">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl" style={{ background: 'var(--surface-subtle)' }}>
            <Icon className="h-4 w-4" style={{ color }} />
          </span>
          <div className="min-w-0">
            <p className="text-base font-bold tabular-nums leading-tight" style={{ color: 'var(--text-primary)' }}>{value}</p>
            <p className="text-[11px]" style={{ color: 'var(--text-muted)' }}>{label}</p>
          </div>
        </div>
      ))}
    </div>
  )
}
