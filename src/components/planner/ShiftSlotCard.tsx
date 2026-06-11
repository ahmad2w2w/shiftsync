import { useDraggable, useDroppable } from '@dnd-kit/core'
import { GripVertical, AlertTriangle } from 'lucide-react'
import type { Shift } from '../../types/database'
import type { RankedEmployee } from '../../lib/plannerEngine'
import { formatTime, cn } from '../../lib/utils'

const POSITION_COLOR: Record<string, { bg: string; border: string; text: string }> = {
  Keuken:    { bg: 'rgba(249,115,22,0.08)', border: 'rgba(249,115,22,0.25)', text: '#ea580c' },
  Bezorging: { bg: 'rgba(234,179,8,0.08)',  border: 'rgba(234,179,8,0.25)',  text: '#ca8a04' },
  Bediening: { bg: 'rgba(59,130,246,0.08)', border: 'rgba(59,130,246,0.25)', text: '#2563eb' },
}
const FALLBACK_COLOR = { bg: 'var(--surface-subtle)', border: 'var(--border)', text: 'var(--text-secondary)' }

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
        border: `${filled ? '1px' : '1px dashed'} ${isOver ? '#3B82F6' : selected ? 'rgba(59,130,246,0.4)' : color.border}`,
        outline: (isOver || selected) ? '2px solid rgba(59,130,246,0.2)' : undefined,
        outlineOffset: '2px',
      }}
    >
      <div className="mb-1 flex items-center justify-between gap-1">
        <span className="font-semibold" style={{ color: color.text }}>{shift.position}</span>
        <span style={{ color: 'var(--text-muted)' }}>{formatTime(shift.start_time)}–{formatTime(shift.end_time)}</span>
      </div>

      {filled && shift.user ? (
        <div
          ref={dragRef}
          {...listeners}
          {...attributes}
          className={cn('flex cursor-grab items-center gap-1 rounded-lg px-1.5 py-1 font-medium transition-all')}
          style={{
            background: 'var(--surface-card)',
            border: hasConflict ? '1px solid rgba(239,68,68,0.4)' : '1px solid var(--border)',
            color: 'var(--text-primary)',
          }}
        >
          <GripVertical className="h-3 w-3 shrink-0" style={{ color: 'var(--text-disabled)' }} />
          {(shift.user as { full_name?: string }).full_name ?? 'Medewerker'}
          {hasConflict && <AlertTriangle className="h-3 w-3 text-red-500" />}
        </div>
      ) : (
        <p className="italic" style={{ color: 'var(--text-muted)' }}>Open dienst — sleep medewerker hierheen</p>
      )}

      {!filled && suggestions.length > 0 && (
        <div className="mt-2 pt-2" style={{ borderTop: '1px solid var(--border)' }}>
          <p className="mb-1 text-[10px] font-medium uppercase tracking-wider" style={{ color: 'var(--text-disabled)' }}>
            Aanbevolen
          </p>
          <ol className="space-y-0.5">
            {suggestions.slice(0, 3).map((s, i) => (
              <li key={s.user.id}>
                <button
                  type="button"
                  disabled={assigning}
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={(e) => { e.stopPropagation(); onAssignSuggestion?.(s.user.id) }}
                  className={cn('w-full rounded px-1 py-0.5 text-left transition-colors disabled:opacity-50 hover:text-brand-500')}
                  style={{ color: s.warnings.length > 0 ? '#f59e0b' : 'var(--text-secondary)' }}
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
