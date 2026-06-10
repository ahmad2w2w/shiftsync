import { useDraggable, useDroppable } from '@dnd-kit/core'
import { GripVertical, AlertTriangle } from 'lucide-react'
import type { Shift } from '../../types/database'
import type { RankedEmployee } from '../../lib/plannerEngine'
import { formatTime, cn } from '../../lib/utils'

const POSITION_BORDER: Record<string, string> = {
  Keuken: 'border-orange-300 bg-orange-50',
  Bezorging: 'border-amber-300 bg-amber-50',
}

interface ShiftSlotCardProps {
  shift: Shift
  suggestions?: RankedEmployee[]
  selected?: boolean
  onSelect?: () => void
  onAssignSuggestion?: (userId: string) => void
  assigning?: boolean
}

export function ShiftSlotCard({
  shift,
  suggestions = [],
  selected,
  onSelect,
  onAssignSuggestion,
  assigning = false,
}: ShiftSlotCardProps) {
  const { setNodeRef: dropRef, isOver } = useDroppable({ id: `slot-${shift.id}` })
  const filled = !!shift.user_id
  const color = POSITION_BORDER[shift.position] ?? 'border-navy-200 bg-white'

  const dragId = shift.user_id ? `assigned-${shift.id}` : undefined
  const {
    attributes,
    listeners,
    setNodeRef: dragRef,
    isDragging,
  } = useDraggable({
    id: dragId ?? `empty-${shift.id}`,
    data: { shiftId: shift.id, userId: shift.user_id },
    disabled: !shift.user_id,
  })

  const hasConflict = suggestions.some(
    (s) => s.user.id === shift.user_id && s.warnings.length > 0
  )

  return (
    <div
      ref={dropRef}
      onClick={onSelect}
      className={cn(
        'rounded-lg border-2 p-2 text-xs transition-all',
        color,
        !filled && 'border-dashed',
        isOver && 'ring-2 ring-navy-500 ring-offset-1',
        selected && 'ring-2 ring-navy-700',
        isDragging && 'opacity-40'
      )}
    >
      <div className="mb-1 flex items-center justify-between gap-1">
        <span className="font-semibold text-navy-900">{shift.position}</span>
        <span className="text-gray-500">
          {formatTime(shift.start_time)}–{formatTime(shift.end_time)}
        </span>
      </div>

      {filled && shift.user ? (
        <div
          ref={dragRef}
          {...listeners}
          {...attributes}
          className={cn(
            'flex cursor-grab items-center gap-1 rounded bg-white/80 px-1.5 py-1 font-medium text-navy-800',
            hasConflict && 'border border-red-300'
          )}
        >
          <GripVertical className="h-3 w-3 shrink-0 text-gray-400" />
          {(shift.user as { full_name?: string }).full_name ?? 'Medewerker'}
          {hasConflict && <AlertTriangle className="h-3 w-3 text-red-500" />}
        </div>
      ) : (
        <p className="text-gray-400">Open dienst — sleep medewerker hierheen</p>
      )}

      {!filled && suggestions.length > 0 && (
        <div className="mt-2 border-t border-gray-200/80 pt-2">
          <p className="mb-1 text-[10px] font-medium uppercase text-gray-400">Aanbevolen</p>
          <ol className="space-y-0.5">
            {suggestions.slice(0, 3).map((s, i) => (
              <li key={s.user.id}>
                <button
                  type="button"
                  disabled={assigning}
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={(e) => {
                    e.stopPropagation()
                    onAssignSuggestion?.(s.user.id)
                  }}
                  className={cn(
                    'w-full rounded px-1 py-0.5 text-left hover:bg-white/90 disabled:opacity-50',
                    s.warnings.length > 0 ? 'text-amber-800' : 'text-navy-800'
                  )}
                >
                  {i + 1}. {s.user.full_name}
                  {s.warnings.length > 0 && ' ⚠'}
                </button>
              </li>
            ))}
          </ol>
        </div>
      )}
    </div>
  )
}
