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

export type DaySelectAnchor = { date: string; rect: DOMRect }

interface MonthCalendarProps {
  monthAnchor: Date
  selectedDate?: string | null
  onSelectDate?: (dateStr: string, anchor: DOMRect, point: { x: number; y: number }) => void
  hasMarker?: (dateStr: string) => boolean
  getDayMeta?: (dateStr: string) => DayMeta | undefined
  getDayShifts?: (dateStr: string) => Shift[]
  variant?: 'default' | 'compact'
}

export function MonthCalendar({
  monthAnchor,
  selectedDate,
  onSelectDate,
  getDayMeta,
  getDayShifts,
  variant = 'default',
}: MonthCalendarProps) {
  const grid = getCalendarGrid(monthAnchor)
  const compact = variant === 'compact'

  if (compact) {
    return (
      <div className="w-full">
        <div className="mb-2 grid grid-cols-7 gap-1">
          {WEEKDAYS.map((d) => (
            <div
              key={d}
              className="py-1 text-center text-[10px] font-semibold uppercase tracking-wide"
              style={{ color: 'var(--text-muted)' }}
            >
              {d}
            </div>
          ))}
        </div>

        <div className="grid grid-cols-7 gap-x-1 gap-y-2">
          {grid.map((day) => {
            const dateStr = format(day, 'yyyy-MM-dd')
            const inMonth = isSameMonth(day, monthAnchor)
            const selected = selectedDate === dateStr
            const today = isToday(day)
            const dayShifts = getDayShifts?.(dateStr) ?? []
            const hasShift = inMonth && dayShifts.length > 0
            const shiftColor = hasShift ? getPositionColor(dayShifts[0].position) : null

            return (
              <button
                key={dateStr}
                type="button"
                data-calendar-day={dateStr}
                disabled={!inMonth || !onSelectDate}
                onClick={(e) => {
                  if (!inMonth || !onSelectDate) return
                  onSelectDate(dateStr, e.currentTarget.getBoundingClientRect(), {
                    x: e.clientX,
                    y: e.clientY,
                  })
                }}
                className={cn(
                  'mx-auto flex w-full max-w-[44px] flex-col items-center gap-1',
                  inMonth && onSelectDate && 'cursor-pointer',
                  !inMonth && 'pointer-events-none opacity-25'
                )}
                aria-label={
                  inMonth
                    ? `${format(day, 'd MMMM', { locale: nl })}${hasShift ? `, ${dayShifts.length} dienst${dayShifts.length > 1 ? 'en' : ''}` : ', geen diensten'}`
                    : undefined
                }
                aria-pressed={selected}
              >
                <span
                  className={cn(
                    'flex h-10 w-10 items-center justify-center rounded-full text-sm font-semibold transition-all',
                    selected && 'scale-105 shadow-md shadow-brand-600/25',
                    !selected && inMonth && onSelectDate && 'hover:scale-105'
                  )}
                  style={{
                    background: selected
                      ? '#2563EB'
                      : today
                        ? 'rgba(59,130,246,0.12)'
                        : 'var(--surface-subtle)',
                    color: selected ? '#fff' : today ? '#2563EB' : 'var(--text-primary)',
                    border: selected
                      ? '2px solid #2563EB'
                      : today
                        ? '2px solid rgba(59,130,246,0.35)'
                        : '1px solid var(--border)',
                  }}
                >
                  {format(day, 'd')}
                </span>
                <span
                  className="flex h-1.5 w-1.5 items-center justify-center"
                  aria-hidden="true"
                >
                  {hasShift && shiftColor && (
                    <span
                      className="h-1.5 w-1.5 rounded-full"
                      style={{ background: shiftColor.accent }}
                    />
                  )}
                </span>
              </button>
            )
          })}
        </div>
      </div>
    )
  }

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
              data-calendar-day={dateStr}
              disabled={!inMonth || !onSelectDate}
              onClick={(e) => {
                if (!inMonth || !onSelectDate) return
                onSelectDate(dateStr, e.currentTarget.getBoundingClientRect(), {
                  x: e.clientX,
                  y: e.clientY,
                })
              }}
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

              {inMonth && dayShifts.length === 0 && onSelectDate && getDayMeta && (
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
