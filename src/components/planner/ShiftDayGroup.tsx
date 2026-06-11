import { useDroppable, useDraggable } from '@dnd-kit/core'
import { GripVertical, AlertTriangle, ChevronDown } from 'lucide-react'
import type { Shift } from '../../types/database'
import type { ShiftGroup } from '../../lib/shiftGroups'
import { formatTime, cn } from '../../lib/utils'

const POSITION_COLOR: Record<string, { bg: string; border: string; text: string }> = {
  Keuken:    { bg: 'rgba(249,115,22,0.12)', border: 'rgba(249,115,22,0.25)', text: '#fb923c' },
  Bezorging: { bg: 'rgba(234,179,8,0.12)',  border: 'rgba(234,179,8,0.25)',  text: '#facc15' },
  Bediening: { bg: 'rgba(37,99,235,0.12)',  border: 'rgba(37,99,235,0.25)',  text: '#60a5fa' },
}
const FALLBACK_COLOR = { bg: 'rgba(255,255,255,0.05)', border: 'rgba(255,255,255,0.1)', text: '#a1a1aa' }

function AssignedChip({ shift, selected, onSelect, hasConflict }: { shift: Shift; selected: boolean; onSelect: () => void; hasConflict: boolean }) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: `assigned-${shift.id}`,
    data: { shiftId: shift.id, userId: shift.user_id },
  })

  return (
    <div
      ref={setNodeRef}
      {...listeners}
      {...attributes}
      onClick={(e) => { e.stopPropagation(); onSelect() }}
      className={cn('flex cursor-grab items-center gap-1 rounded-lg px-2 py-1 text-xs font-medium transition-all', isDragging && 'opacity-50')}
      style={{
        background: selected ? 'rgba(37,99,235,0.2)' : 'rgba(255,255,255,0.08)',
        border: selected ? '1px solid rgba(37,99,235,0.5)' : hasConflict ? '1px solid rgba(239,68,68,0.5)' : '1px solid rgba(255,255,255,0.1)',
        color: '#d4d4d8',
      }}
    >
      <GripVertical className="h-3 w-3 text-zinc-600" />
      <span className="truncate">{(shift.user as { full_name?: string })?.full_name ?? 'Medewerker'}</span>
      {hasConflict && <AlertTriangle className="h-3 w-3 shrink-0 text-red-400" />}
    </div>
  )
}

function OpenDropSlot({ shift, selected, onSelect }: { shift: Shift; selected: boolean; onSelect: () => void }) {
  const { setNodeRef, isOver } = useDroppable({ id: `slot-${shift.id}` })

  return (
    <button
      ref={setNodeRef}
      type="button"
      onClick={(e) => { e.stopPropagation(); onSelect() }}
      className="w-full rounded-lg px-2 py-1 text-left text-[11px] transition-all"
      style={{
        background: isOver ? 'rgba(37,99,235,0.15)' : 'rgba(255,255,255,0.03)',
        border: `1px dashed ${isOver || selected ? 'rgba(37,99,235,0.6)' : 'rgba(255,255,255,0.15)'}`,
        color: isOver ? '#60a5fa' : '#71717a',
      }}
    >
      Open plek
    </button>
  )
}

export function ShiftDayGroup({ group, selectedSlotId, onSelectSlot, expanded, onToggleExpand }: {
  group: ShiftGroup
  selectedSlotId: string | null
  onSelectSlot: (id: string) => void
  expanded?: boolean
  onToggleExpand?: () => void
}) {
  const filled = group.shifts.filter((s) => s.user_id)
  const open = group.shifts.filter((s) => !s.user_id)
  const color = POSITION_COLOR[group.position] ?? FALLBACK_COLOR
  const many = group.shifts.length > 3
  const showAll = expanded || !many

  return (
    <div
      className="rounded-xl p-2 text-xs cursor-pointer transition-all"
      style={{ background: color.bg, border: `1px solid ${color.border}` }}
      onClick={() => onSelectSlot(open[0]?.id ?? filled[0]?.id ?? group.shifts[0].id)}
    >
      <div className="mb-1.5 flex items-center justify-between gap-1">
        <span className="font-semibold" style={{ color: color.text }}>{group.position}</span>
        <span className="text-zinc-500">{formatTime(group.start_time)}–{formatTime(group.end_time)}</span>
      </div>
      <p className="mb-1.5 text-[10px] text-zinc-600">
        {filled.length} ingevuld{open.length > 0 && ` · ${open.length} open`}
      </p>

      {filled.length > 0 && (
        <div className="mb-1 flex flex-wrap gap-1">
          {(showAll ? filled : filled.slice(0, 2)).map((s) => (
            <AssignedChip
              key={s.id}
              shift={s}
              selected={selectedSlotId === s.id}
              onSelect={() => onSelectSlot(s.id)}
              hasConflict={false}
            />
          ))}
          {!showAll && filled.length > 2 && (
            <span className="px-1 text-[10px] text-zinc-600">+{filled.length - 2}</span>
          )}
        </div>
      )}

      {showAll ? (
        open.length > 0 && (
          <div className="space-y-1">
            {open.map((s) => (
              <OpenDropSlot
                key={s.id}
                shift={s}
                selected={selectedSlotId === s.id}
                onSelect={() => onSelectSlot(s.id)}
              />
            ))}
          </div>
        )
      ) : (
        open.length > 0 && (
          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); onToggleExpand?.() }}
            className="flex w-full items-center justify-center gap-1 rounded-lg py-1 text-[11px] font-medium transition-colors"
            style={{ background: 'rgba(255,255,255,0.05)', color: '#a1a1aa' }}
          >
            {open.length} open plekken
            <ChevronDown className="h-3 w-3" />
          </button>
        )
      )}

      {many && showAll && onToggleExpand && (
        <button
          type="button"
          onClick={(e) => { e.stopPropagation(); onToggleExpand() }}
          className="mt-1 w-full text-[10px] text-zinc-600 hover:text-zinc-400 transition-colors"
        >
          Minder tonen
        </button>
      )}
    </div>
  )
}
