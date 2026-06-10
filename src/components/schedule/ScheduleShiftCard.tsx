import { Clock, Briefcase } from 'lucide-react'
import type { Shift } from '../../types/database'
import { Badge } from '../ui/Badge'
import { formatTime, POSITION_STYLES, shiftStatusLabel, cn } from '../../lib/utils'

interface ScheduleShiftCardProps {
  shift: Shift
  showEmployee?: boolean
}

export function ScheduleShiftCard({ shift, showEmployee }: ScheduleShiftCardProps) {
  const name = (shift.user as { full_name?: string } | undefined)?.full_name
  const posStyle = POSITION_STYLES[shift.position] ?? 'bg-navy-50 text-navy-900 border-navy-200'

  return (
    <div
      className={cn(
        'flex items-start justify-between gap-3 rounded-xl border p-4',
        posStyle
      )}
    >
      <div className="min-w-0 flex-1 space-y-1">
        <div className="flex flex-wrap items-center gap-2">
          <span className="font-semibold">{shift.position}</span>
          {!shift.published && (
            <Badge variant="pending" className="text-[10px]">
              Concept
            </Badge>
          )}
        </div>
        {showEmployee && name && (
          <p className="text-sm opacity-90">{name}</p>
        )}
        <p className="flex items-center gap-1.5 text-sm opacity-80">
          <Clock className="h-3.5 w-3.5 shrink-0" />
          {formatTime(shift.start_time)} – {formatTime(shift.end_time)}
        </p>
      </div>
      <div className="flex shrink-0 flex-col items-end gap-1">
        <Briefcase className="h-4 w-4 opacity-40" />
        <Badge variant={shift.status} className="text-[10px]">
          {shiftStatusLabel[shift.status] ?? shift.status}
        </Badge>
      </div>
    </div>
  )
}
