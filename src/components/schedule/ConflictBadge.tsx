import { AlertTriangle, Clock, Palmtree, UserX, Zap } from 'lucide-react'
import type { PlannerWarning } from '../../lib/plannerEngine'
import { cn } from '../../lib/utils'

const config: Record<PlannerWarning['type'], { icon: typeof AlertTriangle; color: string; bg: string }> = {
  unavailable: { icon: UserX, color: '#64748B', bg: 'rgba(100,116,139,0.12)' },
  leave: { icon: Palmtree, color: '#8B5CF6', bg: 'rgba(139,92,246,0.12)' },
  overlap: { icon: Zap, color: '#EF4444', bg: 'rgba(239,68,68,0.12)' },
  hours: { icon: Clock, color: '#F59E0B', bg: 'rgba(245,158,11,0.12)' },
}

interface ConflictBadgeProps {
  warning: PlannerWarning
  compact?: boolean
  className?: string
}

export function ConflictBadge({ warning, compact, className }: ConflictBadgeProps) {
  const c = config[warning.type]
  const Icon = c.icon
  return (
    <span
      className={cn('inline-flex items-center gap-1 rounded-full font-medium', compact ? 'px-2 py-0.5 text-[10px]' : 'px-2.5 py-1 text-xs', className)}
      style={{ background: c.bg, color: c.color, border: `1px solid ${c.color}33` }}
      title={warning.message}
    >
      <Icon className={compact ? 'h-3 w-3' : 'h-3.5 w-3.5'} />
      {!compact && warning.message}
    </span>
  )
}

export function ConflictList({ warnings, compact }: { warnings: PlannerWarning[]; compact?: boolean }) {
  if (warnings.length === 0) return null
  return (
    <div className="flex flex-wrap gap-1.5">
      {warnings.map((w, i) => (
        <ConflictBadge key={`${w.type}-${i}`} warning={w} compact={compact} />
      ))}
    </div>
  )
}
