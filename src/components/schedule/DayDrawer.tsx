import { CalendarDays, Plus } from 'lucide-react'
import type { Shift, Availability, User } from '../../types/database'
import { Drawer } from '../ui/Drawer'
import { Button } from '../ui/Button'
import { DayScheduleEditor } from './DayScheduleEditor'
import { formatDayHeader } from '../calendar/MonthCalendar'

interface DayDrawerProps {
  open: boolean
  onClose: () => void
  date: string | null
  availability: (Availability & { users?: { full_name: string } })[]
  shifts: Shift[]
  employees: User[]
  onSaved: () => Promise<void>
  onAddShift: (date: string) => void
}

export function DayDrawer({
  open,
  onClose,
  date,
  availability,
  shifts,
  employees,
  onSaved,
  onAddShift,
}: DayDrawerProps) {
  if (!date) return null

  const dayShifts = shifts.filter((s) => s.date === date)
  const draft = dayShifts.filter((s) => !s.published).length
  const published = dayShifts.filter((s) => s.published).length

  return (
    <Drawer
      open={open}
      onClose={onClose}
      title={formatDayHeader(date)}
      subtitle={`${dayShifts.length} dienst${dayShifts.length !== 1 ? 'en' : ''} · ${draft} concept · ${published} gepubliceerd`}
      width="xl"
    >
      <div className="mb-5 flex flex-wrap gap-2">
        <Button size="sm" onClick={() => onAddShift(date)}>
          <Plus className="h-4 w-4" /> Nieuwe dienst
        </Button>
        <div
          className="inline-flex items-center gap-2 rounded-xl px-3 py-2 text-xs font-medium"
          style={{ background: 'var(--surface-subtle)', border: '1px solid var(--border)', color: 'var(--text-muted)' }}
        >
          <CalendarDays className="h-3.5 w-3.5" />
          Klik op een dienst om te bewerken
        </div>
      </div>
      <DayScheduleEditor
        date={date}
        availability={availability}
        shifts={shifts}
        employees={employees}
        onSaved={onSaved}
      />
    </Drawer>
  )
}
