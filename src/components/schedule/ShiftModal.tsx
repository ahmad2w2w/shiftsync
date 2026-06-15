import { useEffect, useState } from 'react'
import { BookmarkPlus, Sparkles } from 'lucide-react'
import type { Shift, User, Availability, LeaveRequest } from '../../types/database'
import { createShift, updateShift } from '../../services/shifts'
import { createShiftTemplate } from '../../services/shiftTemplates'
import { useOrganization } from '../../context/OrganizationContext'
import { useOrgConfig } from '../../context/OrgConfigContext'
import { useToast } from '../../context/ToastContext'
import { Modal } from '../ui/Modal'
import { Input } from '../ui/Input'
import { Select } from '../ui/Select'
import { Button } from '../ui/Button'
import { SmartEmployeeSelect } from './SmartEmployeeSelect'
import { DEFAULT_SHIFT_END, DEFAULT_SHIFT_START, DEFAULT_SHIFT_POSITION } from '../../lib/utils'

export interface ShiftModalValues {
  date: string
  start_time: string
  end_time: string
  position: string
  user_id: string | null
  published: boolean
  required_count: number
  note: string
}

interface ShiftModalProps {
  open: boolean
  onClose: () => void
  onSaved: () => Promise<void>
  employees: User[]
  availability: Availability[]
  leave: LeaveRequest[]
  shifts: Shift[]
  maxHours?: number
  initialDate: string
  initialUserId?: string | null
  editShift?: Shift | null
}

const defaultValues = (date: string, userId?: string | null): ShiftModalValues => ({
  date,
  start_time: DEFAULT_SHIFT_START,
  end_time: DEFAULT_SHIFT_END,
  position: DEFAULT_SHIFT_POSITION,
  user_id: userId ?? null,
  published: false,
  required_count: 1,
  note: '',
})

export function ShiftModal({
  open,
  onClose,
  onSaved,
  employees,
  availability,
  leave,
  shifts,
  maxHours = 160,
  initialDate,
  initialUserId,
  editShift,
}: ShiftModalProps) {
  const { organization } = useOrganization()
  const { positionOptions } = useOrgConfig()
  const toast = useToast()
  const [form, setForm] = useState<ShiftModalValues>(defaultValues(initialDate, initialUserId))
  const [saving, setSaving] = useState(false)
  const [saveTemplate, setSaveTemplate] = useState(false)

  useEffect(() => {
    if (!open) return
    if (editShift) {
      setForm({
        date: editShift.date,
        start_time: editShift.start_time.slice(0, 5),
        end_time: editShift.end_time.slice(0, 5),
        position: editShift.position,
        user_id: editShift.user_id,
        published: editShift.published,
        required_count: 1,
        note: '',
      })
    } else {
      const d = defaultValues(initialDate, initialUserId)
      if (positionOptions.length && !positionOptions.some((o) => o.value === d.position)) {
        d.position = positionOptions[0].value
      }
      setForm(d)
    }
    setSaveTemplate(false)
  }, [open, initialDate, initialUserId, editShift, positionOptions])

  const patch = (p: Partial<ShiftModalValues>) => setForm((f) => ({ ...f, ...p }))

  const handleSubmit = async () => {
    if (!organization) return
    setSaving(true)
    try {
      const payload = {
        organization_id: organization.id,
        user_id: form.user_id,
        date: form.date,
        start_time: form.start_time,
        end_time: form.end_time,
        position: form.position,
        status: 'scheduled' as const,
        published: form.published,
        template_id: null,
        slot_index: 0,
      }

      if (editShift) {
        await updateShift(editShift.id, payload)
        toast.success('Dienst bijgewerkt')
      } else if (!form.user_id && form.required_count > 1) {
        for (let i = 0; i < form.required_count; i++) {
          await createShift({ ...payload, slot_index: i })
        }
        toast.success(`${form.required_count} open diensten aangemaakt`)
      } else {
        await createShift(payload)
        toast.success(form.user_id ? 'Dienst ingepland' : 'Open dienst aangemaakt')
      }

      if (saveTemplate && organization) {
        const d = new Date(form.date + 'T12:00:00')
        await createShiftTemplate({
          organization_id: organization.id,
          day_of_week: d.getDay(),
          position: form.position,
          start_time: form.start_time,
          end_time: form.end_time,
          required_count: form.required_count,
          label: form.note || `${form.position} ${form.start_time}`,
        })
        toast.success('Opgeslagen als template')
      }

      await onSaved()
      onClose()
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Opslaan mislukt')
    } finally {
      setSaving(false)
    }
  }

  return (
    <Modal open={open} onClose={onClose} title={editShift ? 'Dienst bewerken' : 'Nieuwe dienst'} size="xl">
      <div className="space-y-5">
        <div className="flex items-center gap-2 rounded-xl px-3 py-2 text-xs font-medium" style={{ background: 'var(--brand-muted)', color: 'var(--brand-strong)' }}>
          <Sparkles className="h-3.5 w-3.5" />
          Concept rooster — medewerkers zien pas na publiceren
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <Select
            label="Functie"
            value={form.position}
            onChange={(e) => patch({ position: e.target.value })}
            options={positionOptions}
          />
          <Input label="Datum" type="date" value={form.date} onChange={(e) => patch({ date: e.target.value })} />
          <Input label="Starttijd" type="time" value={form.start_time} onChange={(e) => patch({ start_time: e.target.value })} />
          <Input label="Eindtijd" type="time" value={form.end_time} onChange={(e) => patch({ end_time: e.target.value })} />
          {!form.user_id && (
            <Input
              label="Aantal medewerkers nodig"
              type="number"
              min={1}
              max={20}
              value={String(form.required_count)}
              onChange={(e) => patch({ required_count: Math.max(1, parseInt(e.target.value, 10) || 1) })}
            />
          )}
          <Input
            label="Notitie (optioneel)"
            value={form.note}
            onChange={(e) => patch({ note: e.target.value })}
            placeholder="Bijv. extra drukte verwacht"
          />
        </div>

        <SmartEmployeeSelect
          employees={employees.filter((e) => e.role === 'employee')}
          availability={availability}
          leave={leave}
          shifts={shifts}
          date={form.date}
          startTime={form.start_time}
          endTime={form.end_time}
          position={form.position}
          maxHours={maxHours}
          value={form.user_id}
          onChange={(id) => patch({ user_id: id })}
          excludeShiftId={editShift?.id}
        />

        <div className="flex flex-wrap gap-4">
          <label className="flex cursor-pointer items-center gap-2 text-sm" style={{ color: 'var(--text-secondary)' }}>
            <input type="checkbox" checked={form.published} onChange={(e) => patch({ published: e.target.checked })} className="rounded accent-brand-500" />
            Direct publiceren
          </label>
          {!editShift && (
            <label className="flex cursor-pointer items-center gap-2 text-sm" style={{ color: 'var(--text-secondary)' }}>
              <input type="checkbox" checked={saveTemplate} onChange={(e) => setSaveTemplate(e.target.checked)} className="rounded accent-brand-500" />
              <BookmarkPlus className="h-4 w-4" /> Opslaan als template
            </label>
          )}
        </div>

        <div className="flex flex-wrap justify-end gap-2 border-t pt-4" style={{ borderColor: 'var(--border)' }}>
          <Button variant="secondary" onClick={onClose}>Annuleren</Button>
          <Button loading={saving} onClick={handleSubmit}>
            {editShift ? 'Opslaan' : 'Dienst aanmaken'}
          </Button>
        </div>
      </div>
    </Modal>
  )
}
