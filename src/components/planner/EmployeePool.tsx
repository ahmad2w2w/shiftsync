import { useDraggable, useDroppable } from '@dnd-kit/core'
import { GripVertical } from 'lucide-react'
import type { User } from '../../types/database'
import { monthlyHoursForUser } from '../../lib/plannerEngine'
import type { Shift } from '../../types/database'
import { cn } from '../../lib/utils'

function EmployeeDragCard({
  employee,
  hours,
}: {
  employee: User
  hours: number
}) {
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
        'flex cursor-grab items-center gap-2 rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm shadow-sm',
        'hover:border-navy-300 hover:shadow',
        isDragging && 'opacity-50'
      )}
    >
      <GripVertical className="h-4 w-4 shrink-0 text-gray-300" />
      <div className="min-w-0 flex-1">
        <p className="truncate font-medium text-navy-900">{employee.full_name}</p>
        <p className="text-xs text-gray-500">
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
    (e) =>
      e.full_name.toLowerCase().includes(q) ||
      (e.primary_position ?? '').toLowerCase().includes(q)
  )

  return (
    <div className="flex h-full flex-col">
      <div
        ref={setNodeRef}
        className={cn(
          'border-b border-gray-200 p-4 transition-colors',
          isOver && 'bg-amber-50 ring-2 ring-inset ring-amber-300'
        )}
      >
        <h3 className="font-semibold text-navy-900">Medewerkers</h3>
        <p className="text-xs text-gray-500">
          Sleep naar een dienst · sleep ingeplande dienst hierheen om te verwijderen
        </p>
        {onFilterChange && (
          <input
            type="search"
            placeholder="Zoeken..."
            value={filter}
            onChange={(e) => onFilterChange(e.target.value)}
            className="mt-3 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm"
          />
        )}
      </div>
      <div className="flex-1 space-y-2 overflow-y-auto p-3">
        {filtered.map((emp) => (
          <EmployeeDragCard
            key={emp.id}
            employee={emp}
            hours={monthlyHoursForUser(emp.id, shifts)}
          />
        ))}
      </div>
    </div>
  )
}
