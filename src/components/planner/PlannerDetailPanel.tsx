import { AlertCircle } from 'lucide-react'
import type { Shift } from '../../types/database'
import type { RankedEmployee } from '../../lib/plannerEngine'
import { Button } from '../ui/Button'

interface PlannerDetailPanelProps {
  shift: Shift
  suggestions: RankedEmployee[]
  assigning: boolean
  onAssign: (userId: string) => void
  onClear: () => void
}

export function PlannerDetailPanel({
  shift,
  suggestions,
  assigning,
  onAssign,
  onClear,
}: PlannerDetailPanelProps) {
  return (
    <div className="hidden w-72 shrink-0 border-l border-gray-200 bg-gray-50/50 p-4 xl:block">
      <h3 className="mb-3 font-semibold text-navy-900">Dienstdetails</h3>
      <p className="text-sm text-gray-600">
        {shift.position} · {shift.date}
      </p>
      <p className="mb-4 text-sm">
        {shift.start_time.slice(0, 5)}–{shift.end_time.slice(0, 5)}
      </p>
      {shift.user_id && (
        <p className="mb-4 text-sm font-medium text-navy-800">
          Ingepland: {(shift.user as { full_name?: string } | undefined)?.full_name ?? 'Medewerker'}
        </p>
      )}
      <p className="mb-2 text-xs font-medium uppercase text-gray-400">Aanbevelingen</p>
      <ol className="space-y-2">
        {suggestions.slice(0, 8).map((s, i) => (
          <li key={s.user.id} className="rounded-lg bg-white p-2 text-sm shadow-sm">
            <button
              type="button"
              disabled={assigning}
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => onAssign(s.user.id)}
              className="w-full text-left font-medium text-navy-900 hover:text-navy-600 disabled:opacity-50"
            >
              {i + 1}. {s.user.full_name}
            </button>
            <p className="text-xs text-gray-500">{s.reasons.join(' · ')}</p>
            {s.warnings.map((w) => (
              <p
                key={w.type}
                className="mt-1 flex items-center gap-1 text-xs text-amber-700"
              >
                <AlertCircle className="h-3 w-3" />
                {w.message}
              </p>
            ))}
          </li>
        ))}
      </ol>
      {shift.user_id && (
        <Button
          variant="secondary"
          size="sm"
          className="mt-4 w-full"
          disabled={assigning}
          onClick={onClear}
        >
          Dienst leegmaken
        </Button>
      )}
    </div>
  )
}
