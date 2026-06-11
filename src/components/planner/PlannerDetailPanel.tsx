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

export function PlannerDetailPanel({ shift, suggestions, assigning, onAssign, onClear }: PlannerDetailPanelProps) {
  return (
    <div
      className="hidden w-72 shrink-0 p-4 xl:block"
      style={{ borderLeft: '1px solid rgba(255,255,255,0.08)', background: 'rgba(255,255,255,0.02)' }}
    >
      <h3 className="mb-1 font-semibold text-zinc-100">Dienstdetails</h3>
      <p className="text-sm text-zinc-400">
        {shift.position} · {shift.date}
      </p>
      <p className="mb-4 text-sm text-zinc-500">
        {shift.start_time.slice(0, 5)}–{shift.end_time.slice(0, 5)}
      </p>
      {shift.user_id && (
        <p className="mb-4 text-sm font-medium text-brand-400">
          Ingepland: {(shift.user as { full_name?: string } | undefined)?.full_name ?? 'Medewerker'}
        </p>
      )}
      <p className="mb-2 text-xs font-medium uppercase tracking-wider text-zinc-600">Aanbevelingen</p>
      <ol className="space-y-2">
        {suggestions.slice(0, 8).map((s, i) => (
          <li
            key={s.user.id}
            className="rounded-xl p-2 text-sm"
            style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)' }}
          >
            <button
              type="button"
              disabled={assigning}
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => onAssign(s.user.id)}
              className="w-full text-left font-medium text-zinc-200 hover:text-brand-400 transition-colors disabled:opacity-50"
            >
              {i + 1}. {s.user.full_name}
            </button>
            <p className="text-xs text-zinc-600">{s.reasons.join(' · ')}</p>
            {s.warnings.map((w) => (
              <p key={w.type} className="mt-1 flex items-center gap-1 text-xs text-amber-400">
                <AlertCircle className="h-3 w-3" />
                {w.message}
              </p>
            ))}
          </li>
        ))}
        {suggestions.length === 0 && (
          <li className="py-3 text-center text-sm text-zinc-600">Geen aanbevelingen beschikbaar.</li>
        )}
      </ol>
      {shift.user_id && (
        <Button variant="secondary" size="sm" className="mt-4 w-full" disabled={assigning} onClick={onClear}>
          Dienst leegmaken
        </Button>
      )}
    </div>
  )
}
