import type { Shift } from '../../types/database'
import { formatTime, getPositionColor, cn } from '../../lib/utils'

interface ScheduleTimelineProps {
  shifts: Shift[]
  className?: string
}

function toMinutes(t: string) {
  const [h, m] = t.slice(0, 5).split(':').map(Number)
  return h * 60 + m
}

export function ScheduleTimeline({ shifts, className }: ScheduleTimelineProps) {
  const sorted = [...shifts].sort((a, b) => a.start_time.localeCompare(b.start_time))
  if (sorted.length === 0) return null

  const minM = Math.max(0, Math.min(...sorted.map((s) => toMinutes(s.start_time))) - 30)
  const maxM = Math.min(24 * 60, Math.max(...sorted.map((s) => toMinutes(s.end_time))) + 30)
  const span = Math.max(maxM - minM, 60)

  return (
    <div className={cn('rounded-2xl p-4', className)} style={{ background: 'var(--surface-subtle)', border: '1px solid var(--border)' }}>
      <p className="mb-3 text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>
        Dagoverzicht
      </p>
      <div className="relative h-16">
        {sorted.map((shift) => {
          const left = ((toMinutes(shift.start_time) - minM) / span) * 100
          const width = Math.max(((toMinutes(shift.end_time) - toMinutes(shift.start_time)) / span) * 100, 4)
          const colors = getPositionColor(shift.position)
          const name = (shift.user as { full_name?: string } | undefined)?.full_name

          return (
            <div
              key={shift.id}
              className="absolute top-2 flex h-10 min-w-[48px] flex-col justify-center rounded-lg px-2 text-[10px] font-medium shadow-sm transition-transform hover:scale-[1.02] hover:z-10 sm:text-xs"
              style={{
                left: `${left}%`,
                width: `${width}%`,
                background: colors.bg,
                border: `1px solid ${colors.border}`,
                color: colors.text,
              }}
              title={`${shift.position} ${formatTime(shift.start_time)}–${formatTime(shift.end_time)}${name ? ` · ${name}` : ''}`}
            >
              <span className="truncate font-semibold">{shift.position}</span>
              <span className="truncate opacity-80">{name ?? 'Open'}</span>
            </div>
          )
        })}
      </div>
      <div className="mt-2 flex justify-between text-[10px]" style={{ color: 'var(--text-disabled)' }}>
        <span>{formatTime(`${String(Math.floor(minM / 60)).padStart(2, '0')}:${String(minM % 60).padStart(2, '0')}`)}</span>
        <span>{formatTime(`${String(Math.floor(maxM / 60)).padStart(2, '0')}:${String(maxM % 60).padStart(2, '0')}`)}</span>
      </div>
    </div>
  )
}
