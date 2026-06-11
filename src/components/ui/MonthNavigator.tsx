import { ChevronLeft, ChevronRight } from 'lucide-react'
import { Button } from './Button'
import { monthLabel } from '../../lib/utils'

interface MonthNavigatorProps {
  monthAnchor: Date
  onPrev: () => void
  onNext: () => void
  onToday?: () => void
}

export function MonthNavigator({ monthAnchor, onPrev, onNext, onToday }: MonthNavigatorProps) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      <Button variant="secondary" size="sm" onClick={onPrev} aria-label="Vorige maand">
        <ChevronLeft className="h-4 w-4" />
      </Button>
      <span
        className="min-w-[160px] text-center text-sm font-medium capitalize"
        style={{ color: 'var(--text-primary)' }}
      >
        {monthLabel(monthAnchor)}
      </span>
      <Button variant="secondary" size="sm" onClick={onNext} aria-label="Volgende maand">
        <ChevronRight className="h-4 w-4" />
      </Button>
      {onToday && (
        <Button variant="ghost" size="sm" onClick={onToday}>
          Deze maand
        </Button>
      )}
    </div>
  )
}
