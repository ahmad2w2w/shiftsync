import { format } from 'date-fns'
import { nl } from 'date-fns/locale'
import type { Shift, User } from '../../types/database'
import { Badge } from '../ui/Badge'
import { Card } from '../ui/Card'

interface MobilePlannerListProps {
  shifts: Shift[]
  employees: User[]
  onAssign: (shiftId: string, userId: string | null) => void
  assigning: boolean
}

export function MobilePlannerList({ shifts, employees, onAssign, assigning }: MobilePlannerListProps) {
  const openShifts = shifts.filter((s) => !s.user_id).sort((a, b) => a.date.localeCompare(b.date))

  if (openShifts.length === 0) {
    return (
      <Card className="p-6 text-center text-sm" style={{ color: 'var(--text-muted)' }}>
        Geen open diensten deze maand. Genereer diensten uit templates of voeg ze toe in het rooster.
      </Card>
    )
  }

  return (
    <div className="space-y-3 lg:hidden">
      <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
        Mobiele weergave: wijs medewerkers toe via het menu (geen drag &amp; drop).
      </p>
      {openShifts.map((shift) => (
        <Card key={shift.id} className="p-4">
          <div className="flex flex-wrap items-start justify-between gap-2">
            <div>
              <p className="font-semibold text-sm capitalize" style={{ color: 'var(--text-primary)' }}>
                {format(new Date(shift.date + 'T12:00:00'), 'EEE d MMM', { locale: nl })}
              </p>
              <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
                {shift.start_time?.slice(0, 5)} – {shift.end_time?.slice(0, 5)} · {shift.position ?? 'Dienst'}
              </p>
            </div>
            <Badge variant="pending">Open</Badge>
          </div>
          <label className="mt-3 block text-xs font-medium" style={{ color: 'var(--text-secondary)' }}>
            Medewerker toewijzen
          </label>
          <select
            className="mt-1 w-full rounded-xl px-3 py-2.5 text-sm"
            style={{ background: 'var(--surface-input)', color: 'var(--text-primary)', border: '1px solid var(--border-input)' }}
            defaultValue=""
            disabled={assigning}
            onChange={(e) => {
              const val = e.target.value
              if (val) onAssign(shift.id, val)
              e.target.value = ''
            }}
          >
            <option value="">Kies medewerker…</option>
            {employees.map((emp) => (
              <option key={emp.id} value={emp.id}>{emp.full_name}</option>
            ))}
          </select>
        </Card>
      ))}
    </div>
  )
}
