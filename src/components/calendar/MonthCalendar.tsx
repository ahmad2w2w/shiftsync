import { format, isToday } from 'date-fns'
import { nl } from 'date-fns/locale'
import { cn, getCalendarGrid, isSameMonth } from '../../lib/utils'

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
  renderDay?: (dateStr: string, inMonth: boolean) => React.ReactNode
  hasMarker?: (dateStr: string) => boolean
  getDayMeta?: (dateStr: string) => DayMeta | undefined
  size?: 'default' | 'large'
}

export function MonthCalendar({
  monthAnchor,
  selectedDate,
  onSelectDate,
  renderDay,
  hasMarker,
  getDayMeta,
  size = 'default',
}: MonthCalendarProps) {
  const grid = getCalendarGrid(monthAnchor)
  const large = size === 'large'

  return (
    <div className="w-full">
      <div className="w-full">
        <div className={cn('mb-2 grid grid-cols-7', large ? 'gap-2 sm:gap-3' : 'gap-1.5')}>
          {WEEKDAYS.map((d) => (
            <div
              key={d}
              className={cn('py-1 text-center font-semibold uppercase tracking-wider', large ? 'text-xs' : 'text-[10px]')}
              style={{ color: 'var(--text-muted)' }}
            >
              {d}
            </div>
          ))}
        </div>

        <div className={cn('grid grid-cols-7', large ? 'gap-2 sm:gap-3' : 'gap-1.5')}>
          {grid.map((day) => {
            const dateStr = format(day, 'yyyy-MM-dd')
            const inMonth = isSameMonth(day, monthAnchor)
            const selected = selectedDate === dateStr
            const today = isToday(day)
            const marker = hasMarker?.(dateStr)
            const meta = getDayMeta?.(dateStr)
            const total = (meta?.filled ?? 0) + (meta?.open ?? 0)

            let cellBg = 'transparent'
            if (inMonth && meta && total > 0) {
              const intensity = Math.min(total / 5, 1)
              cellBg = `rgba(59,130,246,${0.04 + intensity * 0.12})`
            } else if (inMonth && meta?.available) {
              cellBg = 'rgba(16,185,129,0.06)'
            }

            return (
              <button
                key={dateStr}
                type="button"
                disabled={!inMonth || !onSelectDate}
                onClick={() => onSelectDate?.(dateStr)}
                className={cn(
                  'relative flex w-full flex-col rounded-xl text-left transition-colors',
                  large
                    ? 'aspect-[4/3] min-h-[100px] p-3 sm:aspect-auto sm:min-h-[128px] sm:p-4 lg:min-h-[140px]'
                    : 'min-h-[80px] p-2 sm:min-h-[92px]',
                  inMonth && onSelectDate && 'hover:bg-black/[0.02]',
                  inMonth
                    ? selected
                      ? 'ring-2 ring-brand-500 shadow-md'
                      : today
                        ? 'ring-1 ring-brand-500/40'
                        : ''
                    : 'opacity-25 pointer-events-none',
                  !onSelectDate && inMonth && 'cursor-default'
                )}
                style={{
                  background: selected ? 'rgba(59,130,246,0.12)' : cellBg,
                  border: inMonth ? (selected ? '1px solid rgba(59,130,246,0.4)' : '1px solid var(--border)') : '1px solid transparent',
                }}
              >
                <div className="flex items-center justify-between gap-1">
                  <span
                    className={cn(
                      'flex items-center justify-center rounded-full font-bold',
                      large ? 'h-10 w-10 text-base sm:h-11 sm:w-11' : 'h-8 w-8 text-sm',
                      selected && 'bg-brand-600 text-white shadow-sm',
                      today && !selected && 'ring-2 ring-brand-500/30'
                    )}
                    style={!selected ? { color: inMonth ? 'var(--text-primary)' : 'var(--text-disabled)' } : {}}
                  >
                    {format(day, 'd')}
                  </span>
                  {meta && total > 0 && (
                    <span
                      className="rounded-full px-2 py-0.5 text-xs font-bold"
                      style={{ background: 'rgba(59,130,246,0.15)', color: '#2563EB' }}
                    >
                      {total}
                    </span>
                  )}
                </div>

                {inMonth && meta && (
                  <div className="mt-auto space-y-1 pt-2">
                    {meta.filled > 0 && (
                      <div className="flex items-center gap-1.5 text-xs font-medium sm:text-sm" style={{ color: '#2563EB' }}>
                        <span className="h-2 w-2 shrink-0 rounded-full bg-brand-500" />
                        <span className="truncate">{meta.filled} ingepland</span>
                      </div>
                    )}
                    {meta.open > 0 && (
                      <div className="flex items-center gap-1.5 text-xs font-medium sm:text-sm" style={{ color: '#D97706' }}>
                        <span className="h-2 w-2 shrink-0 rounded-full bg-amber-500" />
                        <span className="truncate">{meta.open} open</span>
                      </div>
                    )}
                    {meta.available > 0 && (
                      <div className="flex items-center gap-1.5 text-xs sm:text-sm" style={{ color: '#059669' }}>
                        <span className="h-2 w-2 shrink-0 rounded-full bg-emerald-500" />
                        <span className="truncate">{meta.available} beschikbaar</span>
                      </div>
                    )}
                  </div>
                )}

                {marker && inMonth && !meta && !selected && (
                  <span className="mt-auto h-1.5 w-1.5 rounded-full bg-brand-500" />
                )}

                {inMonth && renderDay?.(dateStr, inMonth)}
              </button>
            )
          })}
        </div>

        {getDayMeta && (
          <div className="mt-4 flex flex-wrap gap-4 text-xs" style={{ color: 'var(--text-muted)' }}>
            <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-brand-500" /> Ingepland</span>
            <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-amber-500" /> Open dienst</span>
            <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-emerald-500" /> Beschikbaar</span>
          </div>
        )}
      </div>
    </div>
  )
}

export function formatDayHeader(dateStr: string) {
  return format(new Date(dateStr + 'T12:00:00'), 'EEEE d MMMM', { locale: nl })
}
