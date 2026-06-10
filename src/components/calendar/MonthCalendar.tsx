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
  /** large = roosterpagina (volle breedte, grotere cellen) */
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
        <div className={cn('mb-2 grid grid-cols-7', large ? 'gap-2' : 'gap-1')}>
          {WEEKDAYS.map((d) => (
            <div
              key={d}
              className={cn(
                'py-1 text-center font-medium text-gray-400',
                large ? 'text-sm' : 'text-xs'
              )}
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
            const marker = hasMarker?.(dateStr)

            return (
              <button
                key={dateStr}
                type="button"
                disabled={!inMonth || !onSelectDate}
                onClick={() => onSelectDate?.(dateStr)}
                className={cn(
                  'flex flex-col rounded-lg border text-left transition-colors',
                  large
                    ? 'min-h-[100px] p-2.5 text-sm sm:min-h-[120px] sm:p-3'
                    : 'min-h-[72px] p-1.5 text-xs sm:min-h-[88px] sm:p-2',
                  inMonth ? 'border-gray-100 bg-white' : 'border-transparent bg-transparent opacity-30',
                  selected && inMonth && 'border-navy-600 bg-navy-50/40 shadow-sm',
                  inMonth && onSelectDate && !selected && 'hover:border-gray-200 hover:bg-gray-50',
                  !onSelectDate && inMonth && 'cursor-default'
                )}
              >
                <span
                  className={cn(
                    'mb-1 flex items-center justify-center rounded-full font-medium',
                    large ? 'h-8 w-8 text-sm sm:h-9 sm:w-9' : 'h-6 w-6 text-xs',
                    selected && 'bg-navy-900 text-white',
                    !selected && inMonth && 'text-navy-800',
                    !inMonth && 'text-gray-300'
                  )}
                >
                  {format(day, 'd')}
                </span>
                {marker && inMonth && !selected && (
                  <span className="mb-0.5 h-1 w-1 rounded-full bg-navy-400" />
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
