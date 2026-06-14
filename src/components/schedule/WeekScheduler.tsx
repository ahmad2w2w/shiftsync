import { useMemo } from 'react'
import { format, addDays, startOfWeek } from 'date-fns'
import { nl } from 'date-fns/locale'
import { useDroppable } from '@dnd-kit/core'
import { Plus } from 'lucide-react'
import type { Shift, User } from '../../types/database'
import { ScheduleShiftCard } from './ScheduleShiftCard'
import { getPositionColor, cn } from '../../lib/utils'

interface WeekSchedulerProps {
  weekAnchor: Date
  shifts: Shift[]
  employees: User[]
  onDayClick: (date: string) => void
  onShiftClick: (shift: Shift) => void
  onAddShift: (date: string) => void
}

function DayColumn({
  date,
  shifts,
  onDayClick,
  onShiftClick,
  onAddShift,
}: {
  date: string
  shifts: Shift[]
  onDayClick: (d: string) => void
  onShiftClick: (s: Shift) => void
  onAddShift: (d: string) => void
}) {
  const { setNodeRef, isOver } = useDroppable({ id: `week-day-${date}` })
  const d = new Date(date + 'T12:00:00')
  const filled = shifts.filter((s) => s.user_id).length
  const open = shifts.filter((s) => !s.user_id).length

  return (
    <div
      ref={setNodeRef}
      className={cn(
        'flex min-h-[320px] min-w-[140px] flex-1 flex-col rounded-2xl transition-all',
        isOver && 'ring-2 ring-brand-500'
      )}
      style={{
        background: isOver ? 'rgba(59,130,246,0.06)' : 'var(--surface-subtle)',
        border: '1px solid var(--border)',
      }}
    >
      <button
        type="button"
        onClick={() => onDayClick(date)}
        className="border-b px-3 py-3 text-left transition-colors hover:bg-black/[0.02]"
        style={{ borderColor: 'var(--border)' }}
      >
        <p className="text-[10px] font-semibold uppercase tracking-wider capitalize" style={{ color: 'var(--text-muted)' }}>
          {format(d, 'EEE', { locale: nl })}
        </p>
        <p className="text-lg font-bold" style={{ color: 'var(--text-primary)' }}>{format(d, 'd')}</p>
        <div className="mt-1 flex gap-2 text-[10px] font-medium">
          {filled > 0 && <span style={{ color: '#2563EB' }}>{filled} ingepland</span>}
          {open > 0 && <span style={{ color: '#D97706' }}>{open} open</span>}
        </div>
      </button>

      <div className="flex-1 space-y-2 overflow-y-auto p-2">
        {shifts
          .sort((a, b) => a.start_time.localeCompare(b.start_time))
          .map((shift) => (
            <button key={shift.id} type="button" onClick={() => onShiftClick(shift)} className="block w-full text-left">
              <ScheduleShiftCard shift={shift} compact admin />
            </button>
          ))}
      </div>

      <button
        type="button"
        onClick={() => onAddShift(date)}
        className="m-2 flex items-center justify-center gap-1 rounded-xl py-2 text-xs font-semibold transition-all hover:shadow-sm"
        style={{ background: 'var(--surface-card)', border: '1px dashed var(--border-strong)', color: 'var(--brand-strong)' }}
      >
        <Plus className="h-3.5 w-3.5" /> Dienst
      </button>
    </div>
  )
}

export function WeekScheduler({
  weekAnchor,
  shifts,
  onDayClick,
  onShiftClick,
  onAddShift,
}: WeekSchedulerProps) {
  const weekStart = startOfWeek(weekAnchor, { weekStartsOn: 1 })
  const days = useMemo(
    () => Array.from({ length: 7 }, (_, i) => format(addDays(weekStart, i), 'yyyy-MM-dd')),
    [weekStart]
  )

  const shiftsByDay = useMemo(() => {
    const map = new Map<string, Shift[]>()
    for (const d of days) map.set(d, [])
    for (const s of shifts) {
      if (map.has(s.date)) map.get(s.date)!.push(s)
    }
    return map
  }, [days, shifts])

  const totalHours = shifts.reduce((sum, s) => {
    const [sh, sm] = s.start_time.slice(0, 5).split(':').map(Number)
    const [eh, em] = s.end_time.slice(0, 5).split(':').map(Number)
    return sum + (eh + em / 60 - (sh + sm / 60))
  }, 0)

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-3">
        {[
          { label: 'Geplande uren', value: `${totalHours.toFixed(0)}u`, color: '#3B82F6' },
          { label: 'Diensten', value: shifts.length, color: '#64748B' },
          { label: 'Open', value: shifts.filter((s) => !s.user_id).length, color: '#F59E0B' },
        ].map(({ label, value, color }) => (
          <div key={label} className="rounded-xl px-4 py-2" style={{ background: 'var(--surface-card)', border: '1px solid var(--border)' }}>
            <p className="text-[10px] font-medium uppercase" style={{ color: 'var(--text-muted)' }}>{label}</p>
            <p className="text-lg font-bold" style={{ color }}>{value}</p>
          </div>
        ))}
      </div>

      <div className="flex gap-3 overflow-x-auto pb-2">
        {days.map((date) => (
          <DayColumn
            key={date}
            date={date}
            shifts={shiftsByDay.get(date) ?? []}
            onDayClick={onDayClick}
            onShiftClick={onShiftClick}
            onAddShift={onAddShift}
          />
        ))}
      </div>

      <div className="flex flex-wrap gap-3 text-xs" style={{ color: 'var(--text-muted)' }}>
        {['Bediening', 'Keuken', 'Bezorging', 'Kassa'].map((pos) => {
          const c = getPositionColor(pos)
          return (
            <span key={pos} className="flex items-center gap-1.5">
              <span className="h-2.5 w-2.5 rounded-full" style={{ background: c.accent }} />
              {pos}
            </span>
          )
        })}
      </div>
    </div>
  )
}
