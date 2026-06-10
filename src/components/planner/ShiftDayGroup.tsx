import { useDroppable } from '@dnd-kit/core'
import { useDraggable } from '@dnd-kit/core'
import { GripVertical, AlertTriangle, ChevronDown } from 'lucide-react'
import type { Shift } from '../../types/database'
import type { ShiftGroup } from '../../lib/shiftGroups'
import { formatTime, cn } from '../../lib/utils'

const POSITION_BORDER: Record<string, string> = {
  Keuken: 'border-orange-200 bg-orange-50/80',
  Bezorging: 'border-amber-200 bg-amber-50/80',
}

interface ShiftDayGroupProps {
  group: ShiftGroup
  selectedSlotId: string | null
  onSelectSlot: (id: string) => void
  expanded?: boolean
  onToggleExpand?: () => void
}

function AssignedChip({
  shift,
  selected,
  onSelect,
  hasConflict,
}: {
  shift: Shift
  selected: boolean
  onSelect: () => void
  hasConflict: boolean
}) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: `assigned-${shift.id}`,
    data: { shiftId: shift.id, userId: shift.user_id },
  })

  return (
    <div
      ref={setNodeRef}
      {...listeners}
      {...attributes}
      onClick={(e) => {
        e.stopPropagation()
        onSelect()
      }}
      className={cn(
        'flex cursor-grab items-center gap-1 rounded-md border bg-white px-2 py-1 text-xs font-medium text-navy-800',
        selected && 'ring-2 ring-navy-600',
        hasConflict && 'border-red-300',
        isDragging && 'opacity-50'
      )}
    >
      <GripVertical className="h-3 w-3 text-gray-300" />
      <span className="truncate">
        {(shift.user as { full_name?: string })?.full_name ?? 'Medewerker'}
      </span>
      {hasConflict && <AlertTriangle className="h-3 w-3 shrink-0 text-red-500" />}
    </div>
  )
}

function OpenDropSlot({
  shift,
  selected,
  onSelect,
}: {
  shift: Shift
  selected: boolean
  onSelect: () => void
}) {
  const { setNodeRef, isOver } = useDroppable({ id: `slot-${shift.id}` })

  return (
    <button
      ref={setNodeRef}
      type="button"
      onClick={(e) => {
        e.stopPropagation()
        onSelect()
      }}
      className={cn(
        'w-full rounded-md border border-dashed border-gray-300 bg-white/60 px-2 py-1 text-left text-[11px] text-gray-500 hover:border-navy-400 hover:bg-white',
        isOver && 'border-navy-500 bg-navy-50',
        selected && 'border-navy-600 ring-1 ring-navy-500'
      )}
    >
      Open plek
    </button>
  )
}

export function ShiftDayGroup({
  group,
  selectedSlotId,
  onSelectSlot,
  expanded,
  onToggleExpand,
}: ShiftDayGroupProps) {
  const filled = group.shifts.filter((s) => s.user_id)
  const open = group.shifts.filter((s) => !s.user_id)
  const color = POSITION_BORDER[group.position] ?? 'border-gray-200 bg-gray-50'
  const many = group.shifts.length > 3
  const showAll = expanded || !many

  return (
    <div
      className={cn('rounded-lg border p-2 text-xs', color)}
      onClick={() => onSelectSlot(open[0]?.id ?? filled[0]?.id ?? group.shifts[0].id)}
    >
      <div className="mb-1.5 flex items-center justify-between gap-1">
        <span className="font-semibold text-navy-900">{group.position}</span>
        <span className="text-gray-500">
          {formatTime(group.start_time)}–{formatTime(group.end_time)}
        </span>
      </div>

      <p className="mb-1.5 text-[10px] text-gray-500">
        {filled.length} ingevuld
        {open.length > 0 && ` · ${open.length} open`}
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
            <span className="px-1 text-[10px] text-gray-400">+{filled.length - 2}</span>
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
            onClick={(e) => {
              e.stopPropagation()
              onToggleExpand?.()
            }}
            className="flex w-full items-center justify-center gap-1 rounded-md bg-white/70 py-1 text-[11px] font-medium text-navy-700 hover:bg-white"
          >
            {open.length} open plekken
            <ChevronDown className="h-3 w-3" />
          </button>
        )
      )}

      {many && showAll && onToggleExpand && (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation()
            onToggleExpand()
          }}
          className="mt-1 w-full text-[10px] text-gray-400 hover:text-navy-600"
        >
          Minder tonen
        </button>
      )}
    </div>
  )
}
