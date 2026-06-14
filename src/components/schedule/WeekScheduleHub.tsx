import { useMemo, useState } from 'react'
import { DndContext, DragOverlay, PointerSensor, useSensor, useSensors, type DragEndEvent, type DragStartEvent } from '@dnd-kit/core'
import type { Shift, User } from '../../types/database'
import { EmployeePool } from '../planner/EmployeePool'
import { WeekScheduler } from './WeekScheduler'

interface WeekScheduleHubProps {
  weekAnchor: Date
  shifts: Shift[]
  employees: User[]
  onDayClick: (date: string) => void
  onShiftClick: (shift: Shift) => void
  onAddShift: (date: string) => void
  onDropEmployee: (date: string, userId: string) => void
}

export function WeekScheduleHub(props: WeekScheduleHubProps) {
  const { employees, shifts } = props
  const [filter, setFilter] = useState('')
  const [activeId, setActiveId] = useState<string | null>(null)

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 8 } }))

  const activeEmployee = useMemo(() => {
    if (!activeId?.startsWith('employee-')) return null
    const id = activeId.replace('employee-', '')
    return employees.find((e) => e.id === id) ?? null
  }, [activeId, employees])

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(String(event.active.id))
  }

  const handleDragEnd = (event: DragEndEvent) => {
    setActiveId(null)
    const overId = String(event.over?.id ?? '')
    if (!overId.startsWith('week-day-')) return
    const date = overId.replace('week-day-', '')
    const userId = event.active.data.current?.userId as string | undefined
    if (userId) props.onDropEmployee(date, userId)
  }

  const poolEmployees = employees.filter((e) => e.role === 'employee')

  return (
    <DndContext sensors={sensors} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
      <div className="grid gap-4 lg:grid-cols-[260px_1fr]">
        <div
          className="overflow-hidden rounded-2xl lg:max-h-[calc(100vh-16rem)] lg:overflow-y-auto"
          style={{ background: 'var(--surface-card)', border: '1px solid var(--border)', boxShadow: 'var(--shadow-card)' }}
        >
          <EmployeePool employees={poolEmployees} shifts={shifts} filter={filter} onFilterChange={setFilter} />
        </div>
        <div
          className="rounded-2xl p-4 sm:p-5"
          style={{ background: 'var(--surface-card)', border: '1px solid var(--border)', boxShadow: 'var(--shadow-card)' }}
        >
          <WeekScheduler {...props} />
        </div>
      </div>
      <DragOverlay>
        {activeEmployee && (
          <div className="rounded-xl px-4 py-3 shadow-xl" style={{ background: 'var(--surface-card)', border: '2px solid var(--brand)' }}>
            <p className="font-semibold" style={{ color: 'var(--text-primary)' }}>{activeEmployee.full_name}</p>
          </div>
        )}
      </DragOverlay>
    </DndContext>
  )
}
