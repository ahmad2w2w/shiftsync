import { useMemo, useState } from 'react'
import { format, isToday } from 'date-fns'
import { nl } from 'date-fns/locale'
import { Plus, GripVertical } from 'lucide-react'
import {
  DndContext,
  PointerSensor,
  useSensor,
  useSensors,
  useDraggable,
  useDroppable,
  type DragEndEvent,
} from '@dnd-kit/core'
import type { Availability, LeaveRequest, Shift, User } from '../../types/database'
import { updateShift } from '../../services/shifts'
import { useToast } from '../../context/ToastContext'
import { shiftHours } from '../../lib/plannerEngine'
import { formatTime, getPositionColor, cn } from '../../lib/utils'
import { DayPlannerPopover } from './DayPlannerPopover'

interface WeekViewProps {
  weekDays: Date[]
  shifts: Shift[]
  employees: User[]
  availability: (Availability & { users?: { full_name: string } })[]
  leave: LeaveRequest[]
  rateById: Map<string, number>
  onReload: () => Promise<void>
  onEditShift: (shift: Shift) => void
}

export function WeekView({ weekDays, shifts, employees, availability, leave, rateById, onReload, onEditShift }: WeekViewProps) {
  const toast = useToast()
  const [popover, setPopover] = useState<{ date: string; anchor: DOMRect; point: { x: number; y: number } } | null>(null)
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 6 } }))

  const byDate = useMemo(() => {
    const m = new Map<string, Shift[]>()
    for (const s of shifts) {
      const list = m.get(s.date) ?? []
      list.push(s)
      m.set(s.date, list)
    }
    for (const list of m.values()) list.sort((a, b) => a.start_time.localeCompare(b.start_time))
    return m
  }, [shifts])

  const handleDragEnd = async (e: DragEndEvent) => {
    const shiftId = e.active.id as string
    const targetDate = e.over?.id as string | undefined
    if (!targetDate) return
    const shift = shifts.find((s) => s.id === shiftId)
    if (!shift || shift.date === targetDate) return
    try {
      await updateShift(shiftId, { date: targetDate })
      await onReload()
      toast.success('Dienst verplaatst')
    } catch {
      toast.error('Verplaatsen mislukt')
    }
  }

  return (
    <DndContext sensors={sensors} onDragEnd={handleDragEnd}>
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4 lg:grid-cols-7">
        {weekDays.map((day) => {
          const key = format(day, 'yyyy-MM-dd')
          const dayShifts = byDate.get(key) ?? []
          const hours = dayShifts.reduce((sum, s) => sum + shiftHours(s.start_time, s.end_time), 0)
          const cost = dayShifts.reduce((sum, s) => (s.user_id ? sum + shiftHours(s.start_time, s.end_time) * (rateById.get(s.user_id) ?? 0) : sum), 0)
          const open = dayShifts.filter((s) => !s.user_id).length
          return (
            <DayColumn
              key={key}
              dateKey={key}
              day={day}
              hours={hours}
              cost={cost}
              open={open}
              count={dayShifts.length}
            >
              {dayShifts.map((s) => (
                <DraggableShift key={s.id} shift={s} onClick={() => onEditShift(s)} />
              ))}
              <button
                type="button"
                onClick={(ev) => {
                  const r = ev.currentTarget.getBoundingClientRect()
                  setPopover({ date: key, anchor: r, point: { x: ev.clientX, y: ev.clientY } })
                }}
                className="press flex w-full items-center justify-center gap-1 rounded-lg border border-dashed py-1.5 text-xs font-medium transition-colors hover:bg-black/[0.03] dark:hover:bg-white/5"
                style={{ borderColor: 'var(--border-strong)', color: 'var(--text-muted)' }}
              >
                <Plus className="h-3.5 w-3.5" /> Dienst
              </button>
            </DayColumn>
          )
        })}
      </div>

      {popover && (
        <DayPlannerPopover
          date={popover.date}
          anchor={popover.anchor}
          point={popover.point}
          shifts={shifts}
          employees={employees}
          availability={availability}
          leave={leave}
          onSaved={onReload}
          onClose={() => setPopover(null)}
        />
      )}
    </DndContext>
  )
}

function DayColumn({
  dateKey,
  day,
  hours,
  cost,
  open,
  count,
  children,
}: {
  dateKey: string
  day: Date
  hours: number
  cost: number
  open: number
  count: number
  children: React.ReactNode
}) {
  const { setNodeRef, isOver } = useDroppable({ id: dateKey })
  const today = isToday(day)
  return (
    <div
      ref={setNodeRef}
      className={cn('flex min-h-[220px] flex-col rounded-2xl p-2 transition-colors')}
      style={{
        background: isOver ? 'var(--brand-muted)' : 'var(--surface-card)',
        border: `1px solid ${today ? 'var(--brand)' : 'var(--border)'}`,
      }}
    >
      <div className="mb-2 flex items-center justify-between px-1">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-wider" style={{ color: today ? 'var(--brand-strong)' : 'var(--text-muted)' }}>
            {format(day, 'EEE', { locale: nl })}
          </p>
          <p className="text-sm font-bold tabular-nums" style={{ color: 'var(--text-primary)' }}>{format(day, 'd')}</p>
        </div>
        {count > 0 && (
          <span className="rounded-md px-1.5 py-0.5 text-[10px] font-semibold tabular-nums" style={{ background: 'var(--surface-subtle)', color: 'var(--text-muted)' }}>
            {Math.round(hours)}u
          </span>
        )}
      </div>

      <div className="flex flex-1 flex-col gap-1.5">{children}</div>

      <div className="mt-2 flex items-center justify-between px-1 text-[10px] tabular-nums" style={{ color: 'var(--text-disabled)' }}>
        <span>{open > 0 ? `${open} open` : count > 0 ? 'compleet' : '—'}</span>
        {cost > 0 && <span>€{Math.round(cost)}</span>}
      </div>
    </div>
  )
}

function DraggableShift({ shift, onClick }: { shift: Shift; onClick: () => void }) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({ id: shift.id })
  const c = getPositionColor(shift.position)
  const isOpen = !shift.user_id
  const name = (shift.user as { full_name?: string } | undefined)?.full_name

  return (
    <div
      ref={setNodeRef}
      style={{
        transform: transform ? `translate3d(${transform.x}px, ${transform.y}px, 0)` : undefined,
        background: 'var(--surface-subtle)',
        borderLeft: `3px solid ${c.accent}`,
        border: '1px solid var(--border)',
        borderLeftWidth: 3,
        opacity: isDragging ? 0.5 : 1,
        zIndex: isDragging ? 50 : undefined,
      }}
      className={cn('group relative flex items-start gap-1 rounded-lg p-2', isOpen && 'border-dashed')}
    >
      <button
        {...attributes}
        {...listeners}
        className="mt-0.5 cursor-grab touch-none active:cursor-grabbing"
        style={{ color: 'var(--text-disabled)' }}
        aria-label="Versleep dienst"
      >
        <GripVertical className="h-3.5 w-3.5" />
      </button>
      <button type="button" onClick={onClick} className="min-w-0 flex-1 text-left">
        <p className="text-xs font-semibold tabular-nums" style={{ color: 'var(--text-primary)' }}>
          {formatTime(shift.start_time)}–{formatTime(shift.end_time)}
        </p>
        <p className="truncate text-[11px]" style={{ color: 'var(--text-muted)' }}>
          {isOpen ? 'Open dienst' : name}
        </p>
        <p className="truncate text-[10px]" style={{ color: c.accent }}>{shift.position}{!shift.published && ' · concept'}</p>
      </button>
    </div>
  )
}
