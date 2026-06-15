import { Clock, CheckCircle2, XCircle, Ban, CalendarCheck, Activity, HeartPulse } from 'lucide-react'
import { Badge } from './Badge'
import {
  leaveStatusLabel,
  shiftStatusLabel,
  sickStatusLabel,
  shiftSwapStatusLabel,
} from '../../lib/utils'

type Domain = 'leave' | 'shift' | 'sick' | 'swap'

const ICONS: Record<string, typeof Clock> = {
  pending: Clock,
  approved: CheckCircle2,
  rejected: XCircle,
  cancelled: Ban,
  scheduled: CalendarCheck,
  completed: CheckCircle2,
  accepted: CheckCircle2,
  offered: Clock,
  active: HeartPulse,
  resolved: CheckCircle2,
}

const LABELS: Record<Domain, Record<string, string>> = {
  leave: leaveStatusLabel,
  shift: shiftStatusLabel,
  sick: sickStatusLabel,
  swap: shiftSwapStatusLabel,
}

/** Accessible status pill: colour + icon + text (not colour alone). */
export function StatusBadge({ domain, status }: { domain: Domain; status: string }) {
  const Icon = ICONS[status] ?? Activity
  const label = LABELS[domain]?.[status] ?? status
  return (
    <Badge variant={status}>
      <Icon className="h-3 w-3" aria-hidden="true" />
      {label}
    </Badge>
  )
}
