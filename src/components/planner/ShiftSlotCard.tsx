import { useDraggable, useDroppable } from '@dnd-kit/core'
import { GripVertical, AlertTriangle } from 'lucide-react'
import type { Shift } from '../../types/database'
import type { RankedEmployee } from '../../lib/plannerEngine'
import { formatTime, cn } from '../../lib/utils'

const POSITION_COLOR: Record<string, { bg: string; border: string; text: string }> = {
  Keuken:    { bg: 'rgba(249,115,22,0.1)', border: 'rgba(249,115,22,0.3)', text: '#fb923c' },
  Bezorging: { bg: 'rgba(234,179,8,0.1)',  border: 'rgba(234,179,8,0.3)',  text: '#facc15' },
  Bediening: { bg: 'rgba(37,99,235,0.1)',  border: 'rgba(37,99,235,0.3)',  text: '#60a5fa' },
}
const FALLBACK_COLOR = { bg: 'rgba(255,255,255,0.04)', border: 'rgba(255,255,255,0.12)', text: '#a1a1aa' }

interface ShiftSlotCardProps {
  shift: Shift
  suggestions?: RankedEmployee[]
  selected?: boolean
  onSelect?: () => void
  onAssignSuggestion?: (userId: string) => void
  assigning?: boolean
}

export function ShiftSlotCard({ shift, suggestions = [], selected, onSelect, onAssignSuggestion, assigning = false }: ShiftSlotCardProps) {
  const { setNodeRef: dropRef, isOver } = useDroppable({ id: `slot-${shift.id}` })
  const filled = !!shift.user_id
  const color = POSITION_COLOR[shift.position] ?? FALLBACK_COLOR

  const dragId = shift.user_id ? `assigned-${shift.id}` : undefined
  const { attributes, listeners, setNodeRef: dragRef, isDragging } = useDraggable({
    id: dragId ?? `empty-${shift.id}`,
    data: { shiftId: shift.id, userId: shift.user_id },
    disabled: !shift.user_id,
  })

  const hasConflict = suggestions.some((s) => s.user.id === shift.user_id && s.warnings.length > 0)

  return (
    <div
      ref={dropRef}
      onClick={onSelect}
      className={cn('rounded-xl p-2 text-xs transition-all cursor-pointer', isDragging && 'opacity-40')}
      style={{
        background: color.bg,
        border: `${filled ? '1px' : '1px dashed'} ${isOver ? 'rgba(37,99,235,0.7)' : selected ? 'rgba(37,99,235,0.5)' : color.border}`,
        outline: (isOver || selected) ? `2px solid rgba(37,99,235,0.3)` : undefined,
        outlineOffset: '2px',
      }}
    >
      <div className="mb-1 flex items-center justify-between gap-1">
        <span className="font-semibold" style={{ color: color.text }}>{shift.position}</span>
        <span className="text-zinc-500">{formatTime(shift.start_time)}–{formatTime(shift.end_time)}</span>
      </div>

      {filled && shift.user ? (
        <div
          ref={dragRef}
          {...listeners}
          {...attributes}
          className={cn('flex cursor-grab items-center gap-1 rounded-lg px-1.5 py-1 font-medium transition-all')}
          style={{
            background: 'rgba(255,255,255,0.07)',
            border: hasConflict ? '1px solid rgba(239,68,68,0.4)' : '1px solid rgba(255,255,255,0.08)',
            color: '#d4d4d8',
          }}
        >
          <GripVertical className="h-3 w-3 shrink-0 text-zinc-600" />
          {(shift.user as { full_name?: string }).full_name ?? 'Medewerker'}
          {hasConflict && <AlertTriangle className="h-3 w-3 text-red-400" />}
        </div>
      ) : (
        <p className="text-zinc-600 italic">Open dienst — sleep medewerker hierheen</p>
      )}

      {!filled && suggestions.length > 0 && (
        <div className="mt-2 pt-2" style={{ borderTop: '1px solid rgba(255,255,255,0.07)' }}>
          <p className="mb-1 text-[10px] font-medium uppercase tracking-wider text-zinc-600">Aanbevolen</p>
          <ol className="space-y-0.5">
            {suggestions.slice(0, 3).map((s, i) => (
              <li key={s.user.id}>
                <button
                  type="button"
                  disabled={assigning}
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={(e) => { e.stopPropagation(); onAssignSuggestion?.(s.user.id) }}
                  className={cn(
                    'w-full rounded px-1 py-0.5 text-left transition-colors disabled:opacity-50',
                    s.warnings.length > 0 ? 'text-amber-400 hover:text-amber-300' : 'text-zinc-400 hover:text-zinc-200'
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
