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
    <div className="w-full overflow-x-auto">
      <div className={cn('w-full', large ? 'min-w-[640px]' : 'min-w-[320px]')}>
        <div className={cn('mb-3 grid grid-cols-7', large ? 'gap-2' : 'gap-1')}>
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

        <div className={cn('grid grid-cols-7', large ? 'gap-2' : 'gap-1')}>
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
                  'relative flex flex-col rounded-2xl text-left transition-all duration-150',
                  large
                    ? 'min-h-[96px] p-2.5 sm:min-h-[112px] sm:p-3'
                    : 'min-h-[72px] p-1.5 sm:min-h-[84px] sm:p-2',
                  inMonth && onSelectDate && 'hover:-translate-y-0.5 hover:shadow-md',
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
                      large ? 'h-8 w-8 text-sm' : 'h-7 w-7 text-xs',
                      selected && 'bg-brand-600 text-white shadow-sm',
                      today && !selected && 'ring-2 ring-brand-500/30'
                    )}
                    style={!selected ? { color: inMonth ? 'var(--text-primary)' : 'var(--text-disabled)' } : {}}
                  >
                    {format(day, 'd')}
                  </span>
                  {meta && total > 0 && (
                    <span
                      className="rounded-full px-1.5 py-0.5 text-[10px] font-bold"
                      style={{ background: 'rgba(59,130,246,0.15)', color: '#2563EB' }}
                    >
                      {total}
                    </span>
                  )}
                </div>

                {inMonth && meta && (
                  <div className="mt-auto space-y-0.5 pt-1">
                    {meta.filled > 0 && (
                      <div className="flex items-center gap-1 text-[10px] font-medium sm:text-xs" style={{ color: '#2563EB' }}>
                        <span className="h-1.5 w-1.5 rounded-full bg-brand-500" />
                        {meta.filled} ingepland
                      </div>
                    )}
                    {meta.open > 0 && (
                      <div className="flex items-center gap-1 text-[10px] font-medium sm:text-xs" style={{ color: '#D97706' }}>
                        <span className="h-1.5 w-1.5 rounded-full bg-amber-500" />
                        {meta.open} open
                      </div>
                    )}
                    {meta.available > 0 && meta.filled === 0 && meta.open === 0 && (
                      <div className="flex items-center gap-1 text-[10px] sm:text-xs" style={{ color: '#059669' }}>
                        <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                        {meta.available} beschikbaar
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
