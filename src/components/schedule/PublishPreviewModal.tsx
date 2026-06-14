import { useMemo } from 'react'
import { AlertTriangle, CheckCircle2, Send } from 'lucide-react'
import type { Shift, User, Availability, LeaveRequest } from '../../types/database'
import { getWarnings } from '../../lib/plannerEngine'
import { Modal } from '../ui/Modal'
import { Button } from '../ui/Button'
import { ConflictList } from './ConflictBadge'
import { monthLabel } from '../../lib/utils'

interface PublishPreviewModalProps {
  open: boolean
  onClose: () => void
  onConfirm: () => Promise<void>
  loading?: boolean
  monthAnchor: Date
  shifts: Shift[]
  employees: User[]
  availability: Availability[]
  leave: LeaveRequest[]
  maxHours?: number
}

export function PublishPreviewModal({
  open,
  onClose,
  onConfirm,
  loading,
  monthAnchor,
  shifts,
  employees,
  availability,
  leave,
  maxHours = 160,
}: PublishPreviewModalProps) {
  const assigned = shifts.filter((s) => s.user_id)
  const openShifts = shifts.filter((s) => !s.user_id)
  const draft = assigned.filter((s) => !s.published)

  const conflicts = useMemo(() => {
    const items: { shift: Shift; name: string; warnings: ReturnType<typeof getWarnings> }[] = []
    for (const shift of assigned) {
      if (!shift.user_id) continue
      const user = employees.find((e) => e.id === shift.user_id)
      const warnings = getWarnings(
        shift.user_id,
        shift,
        availability,
        leave,
        shifts,
        maxHours
      )
      if (warnings.length > 0) {
        items.push({ shift, name: user?.full_name ?? 'Medewerker', warnings })
      }
    }
    return items
  }, [assigned, employees, availability, leave, shifts, maxHours])

  return (
    <Modal open={open} onClose={onClose} title="Rooster publiceren" size="xl">
      <div className="space-y-5">
        <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
          Preview voor <strong style={{ color: 'var(--text-primary)' }}>{monthLabel(monthAnchor)}</strong>.
          Medewerkers zien alleen gepubliceerde diensten na bevestiging.
        </p>

        <div className="grid gap-3 sm:grid-cols-3">
          {[
            { label: 'Ingeplande diensten', value: assigned.length, color: '#3B82F6' },
            { label: 'Concept (wordt gepubliceerd)', value: draft.length, color: '#8B5CF6' },
            { label: 'Open diensten', value: openShifts.length, color: '#F59E0B' },
          ].map(({ label, value, color }) => (
            <div key={label} className="rounded-xl p-4" style={{ background: 'var(--surface-subtle)', border: '1px solid var(--border)' }}>
              <p className="text-xs font-medium" style={{ color: 'var(--text-muted)' }}>{label}</p>
              <p className="mt-1 text-2xl font-bold" style={{ color }}>{value}</p>
            </div>
          ))}
        </div>

        {conflicts.length > 0 ? (
          <div className="rounded-2xl p-4 space-y-3" style={{ background: 'rgba(245,158,11,0.06)', border: '1px solid rgba(245,158,11,0.25)' }}>
            <div className="flex items-center gap-2 font-semibold" style={{ color: '#D97706' }}>
              <AlertTriangle className="h-4 w-4" />
              {conflicts.length} conflict{conflicts.length !== 1 ? 'en' : ''} gedetecteerd
            </div>
            <ul className="max-h-48 space-y-2 overflow-y-auto">
              {conflicts.slice(0, 12).map(({ shift, name, warnings }) => (
                <li key={shift.id} className="rounded-xl px-3 py-2 text-sm" style={{ background: 'var(--surface-card)', border: '1px solid var(--border)' }}>
                  <p className="font-medium" style={{ color: 'var(--text-primary)' }}>
                    {name} · {shift.date} · {shift.start_time.slice(0, 5)}–{shift.end_time.slice(0, 5)}
                  </p>
                  <ConflictList warnings={warnings} compact />
                </li>
              ))}
            </ul>
            <p className="text-xs" style={{ color: 'var(--text-muted)' }}>Je kunt alsnog publiceren als manager.</p>
          </div>
        ) : (
          <div className="flex items-center gap-2 rounded-xl px-4 py-3 text-sm font-medium" style={{ background: 'rgba(16,185,129,0.08)', color: '#059669', border: '1px solid rgba(16,185,129,0.2)' }}>
            <CheckCircle2 className="h-4 w-4" />
            Geen conflicten gevonden in ingeplande diensten
          </div>
        )}

        {openShifts.length > 0 && (
          <p className="text-sm" style={{ color: '#D97706' }}>
            Let op: {openShifts.length} open dienst{openShifts.length !== 1 ? 'en' : ''} blijft onbezet.
          </p>
        )}

        <div className="flex flex-wrap justify-end gap-2 border-t pt-4" style={{ borderColor: 'var(--border)' }}>
          <Button variant="secondary" onClick={onClose}>Annuleren</Button>
          <Button loading={loading} onClick={onConfirm}>
            <Send className="h-4 w-4" /> Publiceren & notificeren
          </Button>
        </div>
      </div>
    </Modal>
  )
}
