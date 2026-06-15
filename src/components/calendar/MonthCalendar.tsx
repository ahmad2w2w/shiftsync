import { format, isToday } from 'date-fns'
import { nl } from 'date-fns/locale'
import { cn, getCalendarGrid, getPositionColor, isSameMonth } from '../../lib/utils'
import type { Shift } from '../../types/database'

const WEEKDAYS = ['Ma', 'Di', 'Wo', 'Do', 'Vr', 'Za', 'Zo']

export interface DayMeta {
  filled: number
  open: number
  available: number
}

interface MonthCalendarProps {
  monthAnchor: Date
  selectedDate?: string | null
  onSelectDate?: (dateStr: string) => void
  hasMarker?: (dateStr: string) => boolean
  getDayMeta?: (dateStr: string) => DayMeta | undefined
  getDayShifts?: (dateStr: string) => Shift[]
  size?: 'default' | 'large'
}

export function MonthCalendar({
  monthAnchor,
  selectedDate,
  onSelectDate,
  getDayMeta,
  getDayShifts,
}: MonthCalendarProps) {
  const grid = getCalendarGrid(monthAnchor)

  return (
    <div className="w-full">
      <div className={cn('mb-3 grid grid-cols-7 gap-2 sm:gap-3')}>
        {WEEKDAYS.map((d) => (
          <div
            key={d}
            className="py-2 text-center text-xs font-semibold uppercase tracking-widest"
            style={{ color: 'var(--text-muted)' }}
          >
            {d}
          </div>
        ))}
      </div>

      <div className={cn('grid grid-cols-7 gap-2 sm:gap-3')}>
        {grid.map((day) => {
          const dateStr = format(day, 'yyyy-MM-dd')
          const inMonth = isSameMonth(day, monthAnchor)
          const selected = selectedDate === dateStr
          const today = isToday(day)
          const meta = getDayMeta?.(dateStr)
          const dayShifts = getDayShifts?.(dateStr) ?? []
          const total = (meta?.filled ?? 0) + (meta?.open ?? 0)

          return (
            <button
              key={dateStr}
              type="button"
              disabled={!inMonth || !onSelectDate}
              onClick={() => onSelectDate?.(dateStr)}
              className={cn(
                'group relative flex min-h-[88px] w-full flex-col rounded-2xl p-3 text-left transition-all duration-200 sm:min-h-[104px] sm:p-4',
                inMonth && onSelectDate && 'cursor-pointer',
                !inMonth && 'pointer-events-none opacity-20',
                selected && 'scale-[1.02] z-10',
                !selected && inMonth && onSelectDate && 'hover:scale-[1.01]'
              )}
              style={{
                background: selected
                  ? 'linear-gradient(145deg, rgba(59,130,246,0.14) 0%, rgba(59,130,246,0.04) 100%)'
                  : today
                    ? 'rgba(59,130,246,0.04)'
                    : 'var(--surface-subtle)',
                border: selected
                  ? '2px solid rgba(59,130,246,0.5)'
                  : today
                    ? '1px solid rgba(59,130,246,0.25)'
                    : '1px solid var(--border)',
                boxShadow: selected ? '0 4px 20px rgba(59,130,246,0.15)' : undefined,
              }}
            >
              <div className="flex items-start justify-between">
                <span
                  className={cn(
                    'flex h-8 w-8 items-center justify-center rounded-xl text-sm font-bold sm:h-9 sm:w-9',
                    selected && 'bg-brand-600 text-white shadow-md shadow-brand-600/30',
                    today && !selected && 'text-brand-600'
                  )}
                  style={!selected ? { color: 'var(--text-primary)' } : undefined}
                >
                  {format(day, 'd')}
                </span>
                {total > 0 && (
                  <span
                    className="rounded-lg px-2 py-0.5 text-[10px] font-bold tabular-nums"
                    style={{ background: 'rgba(59,130,246,0.12)', color: '#2563EB' }}
                  >
                    {total}
                  </span>
                )}
              </div>

              {/* Shift preview bars */}
              {inMonth && dayShifts.length > 0 && (
                <div className="mt-auto flex flex-col gap-1 pt-2">
                  {dayShifts.slice(0, 3).map((s) => {
                    const c = getPositionColor(s.position)
                    return (
                      <div
                        key={s.id}
                        className="flex items-center gap-1.5 truncate rounded-md px-1.5 py-0.5 text-[10px] font-medium sm:text-[11px]"
                        style={{ background: c.bg, color: c.text }}
                      >
                        <span className="h-1.5 w-1.5 shrink-0 rounded-full" style={{ background: c.accent }} />
                        <span className="truncate">
                          {s.start_time.slice(0, 5)} {s.position}
                        </span>
                      </div>
                    )
                  })}
                  {dayShifts.length > 3 && (
                    <span className="text-[10px] font-medium" style={{ color: 'var(--text-muted)' }}>
                      +{dayShifts.length - 3} meer
                    </span>
                  )}
                </div>
              )}

              {inMonth && dayShifts.length === 0 && onSelectDate && (
                <span
                  className="mt-auto pt-2 text-[10px] font-medium opacity-0 transition-opacity group-hover:opacity-100"
                  style={{ color: 'var(--brand-strong)' }}
                >
                  + Plannen
                </span>
              )}
            </button>
          )
        })}
      </div>
    </div>
  )
}

export function formatDayHeader(dateStr: string) {
  return format(new Date(dateStr + 'T12:00:00'), 'EEEE d MMMM', { locale: nl })
}
