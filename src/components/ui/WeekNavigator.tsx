import { ChevronLeft, ChevronRight } from 'lucide-react'
import { Button } from './Button'
import { weekLabel } from '../../lib/utils'

interface WeekNavigatorProps {
  weekAnchor: Date
  onPrev: () => void
  onNext: () => void
  onToday?: () => void
}

export function WeekNavigator({ weekAnchor, onPrev, onNext, onToday }: WeekNavigatorProps) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      <Button variant="secondary" size="sm" onClick={onPrev} aria-label="Vorige week">
        <ChevronLeft className="h-4 w-4" />
      </Button>
      <span className="min-w-[200px] text-center text-sm font-medium text-zinc-200">
        {weekLabel(weekAnchor)}
      </span>
      <Button variant="secondary" size="sm" onClick={onNext} aria-label="Volgende week">
        <ChevronRight className="h-4 w-4" />
      </Button>
      {onToday && (
        <Button variant="ghost" size="sm" onClick={onToday}>
          Vandaag
        </Button>
      )}
    </div>
  )
}
