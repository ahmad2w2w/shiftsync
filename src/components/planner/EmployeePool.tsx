import { useDraggable, useDroppable } from '@dnd-kit/core'
import { GripVertical } from 'lucide-react'
import type { User, Shift } from '../../types/database'
import { monthlyHoursForUser } from '../../lib/plannerEngine'
import { cn } from '../../lib/utils'

function EmployeeDragCard({ employee, hours }: { employee: User; hours: number }) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: `employee-${employee.id}`,
    data: { userId: employee.id, fromPool: true },
  })

  return (
    <div
      ref={setNodeRef}
      {...listeners}
      {...attributes}
      className={cn(
        'flex cursor-grab items-center gap-2 rounded-xl px-3 py-2 text-sm transition-all',
        isDragging && 'opacity-50'
      )}
      style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)' }}
    >
      <GripVertical className="h-4 w-4 shrink-0 text-zinc-600" />
      <div className="min-w-0 flex-1">
        <p className="truncate font-medium text-zinc-200">{employee.full_name}</p>
        <p className="text-xs text-zinc-500">
          {employee.primary_position ?? 'Keuken'} · {hours.toFixed(0)}u deze maand
        </p>
      </div>
    </div>
  )
}

interface EmployeePoolProps {
  employees: User[]
  shifts: Shift[]
  filter?: string
  onFilterChange?: (v: string) => void
}

export function EmployeePool({ employees, shifts, filter = '', onFilterChange }: EmployeePoolProps) {
  const { setNodeRef, isOver } = useDroppable({ id: 'pool-unassign' })
  const q = filter.toLowerCase()
  const filtered = employees.filter(
    (e) => e.full_name.toLowerCase().includes(q) || (e.primary_position ?? '').toLowerCase().includes(q)
  )

  return (
    <div className="flex h-full flex-col">
      <div
        ref={setNodeRef}
        className="p-4 transition-colors"
        style={{
          borderBottom: '1px solid rgba(255,255,255,0.08)',
          background: isOver ? 'rgba(245,158,11,0.08)' : undefined,
          outline: isOver ? '2px solid rgba(245,158,11,0.4)' : undefined,
          outlineOffset: '-2px',
        }}
      >
        <h3 className="font-semibold text-zinc-100">Medewerkers</h3>
        <p className="text-xs text-zinc-500">
          Sleep naar een dienst · sleep ingeplande dienst hierheen om te verwijderen
        </p>
        {onFilterChange && (
          <input
            type="search"
            placeholder="Zoeken..."
            value={filter}
            onChange={(e) => onFilterChange(e.target.value)}
            className="mt-3 w-full rounded-xl px-3 py-2 text-sm text-zinc-200 placeholder:text-zinc-600 outline-none"
            style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)' }}
          />
        )}
      </div>
      <div className="flex-1 space-y-2 overflow-y-auto p-3">
        {filtered.map((emp) => (
          <EmployeeDragCard key={emp.id} employee={emp} hours={monthlyHoursForUser(emp.id, shifts)} />
        ))}
        {filtered.length === 0 && (
          <p className="py-6 text-center text-sm text-zinc-600">Geen medewerkers gevonden.</p>
        )}
      </div>
    </div>
  )
}
