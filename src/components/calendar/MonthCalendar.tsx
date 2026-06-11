import { format } from 'date-fns'
import { nl } from 'date-fns/locale'
import { cn, getCalendarGrid, isSameMonth } from '../../lib/utils'

const WEEKDAYS = ['Ma', 'Di', 'Wo', 'Do', 'Vr', 'Za', 'Zo']

interface MonthCalendarProps {
  monthAnchor: Date
  selectedDate?: string | null
  onSelectDate?: (dateStr: string) => void
  renderDay?: (dateStr: string, inMonth: boolean) => React.ReactNode
  hasMarker?: (dateStr: string) => boolean
  size?: 'default' | 'large'
}

export function MonthCalendar({
  monthAnchor,
  selectedDate,
  onSelectDate,
  renderDay,
  hasMarker,
  size = 'default',
}: MonthCalendarProps) {
  const grid = getCalendarGrid(monthAnchor)
  const large = size === 'large'

  return (
    <div className="w-full overflow-x-auto">
      <div className={cn('w-full', large ? 'min-w-[640px]' : 'min-w-[320px]')}>
        {/* Weekday headers */}
        <div className={cn('mb-2 grid grid-cols-7', large ? 'gap-2' : 'gap-1')}>
          {WEEKDAYS.map((d) => (
            <div
              key={d}
              className={cn('py-1 text-center font-medium', large ? 'text-sm' : 'text-xs')}
              style={{ color: 'var(--text-muted)' }}
            >
              {d}
            </div>
          ))}
        </div>

        {/* Day cells */}
        <div className={cn('grid grid-cols-7', large ? 'gap-2' : 'gap-1')}>
          {grid.map((day) => {
            const dateStr = format(day, 'yyyy-MM-dd')
            const inMonth = isSameMonth(day, monthAnchor)
            const selected = selectedDate === dateStr
            const marker = hasMarker?.(dateStr)

            return (
              <button
                key={dateStr}
                type="button"
                disabled={!inMonth || !onSelectDate}
                onClick={() => onSelectDate?.(dateStr)}
                className={cn(
                  'flex flex-col rounded-xl transition-all',
                  large
                    ? 'min-h-[90px] p-2.5 text-sm sm:min-h-[110px] sm:p-3'
                    : 'min-h-[68px] p-1.5 text-xs sm:min-h-[84px] sm:p-2',
                  inMonth
                    ? selected
                      ? 'bg-brand-500/15 ring-1 ring-brand-500/40'
                      : 'hover:bg-brand-500/5'
                    : 'opacity-30',
                  !onSelectDate && inMonth && 'cursor-default'
                )}
                style={
                  inMonth && !selected
                    ? { border: '1px solid var(--border)' }
                    : inMonth && selected
                    ? { border: '1px solid transparent' }
                    : {}
                }
              >
                <span
                  className={cn(
                    'mb-1 flex items-center justify-center rounded-full font-semibold',
                    large ? 'h-8 w-8 text-sm sm:h-9 sm:w-9' : 'h-6 w-6 text-xs',
                    selected ? 'bg-brand-600 text-white' : ''
                  )}
                  style={!selected ? { color: inMonth ? 'var(--text-primary)' : 'var(--text-disabled)' } : {}}
                >
                  {format(day, 'd')}
                </span>
                {marker && inMonth && !selected && (
                  <span className="mb-0.5 h-1 w-1 rounded-full bg-brand-500" />
                )}
                {inMonth && renderDay?.(dateStr, inMonth)}
              </button>
            )
          })}
        </div>
      </div>
    </div>
  )
}

export function formatDayHeader(dateStr: string) {
  return format(new Date(dateStr + 'T12:00:00'), 'EEEE d MMMM', { locale: nl })
}
