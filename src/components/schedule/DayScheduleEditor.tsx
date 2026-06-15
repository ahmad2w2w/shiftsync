import { useEffect, useMemo, useState } from 'react'
import {
  Plus,
  MoreHorizontal,
} from 'lucide-react'
import { subDays, format } from 'date-fns'
import type { Shift, Availability, User } from '../../types/database'
import { createShift, updateShift, deleteShift } from '../../services/shifts'
import { useOrganization } from '../../context/OrganizationContext'
import { useToast } from '../../context/ToastContext'
import { useConfirm } from '../../context/ConfirmContext'
import { Button } from '../ui/Button'
import { formatDayHeader } from '../calendar/MonthCalendar'
import { ScheduleShiftCard } from './ScheduleShiftCard'
import { ShiftEditorForm, type ShiftFormValues } from './ShiftEditorForm'
import { Dropdown } from '../ui/Dropdown'
import { DEFAULT_SHIFT_END, DEFAULT_SHIFT_START, DEFAULT_SHIFT_POSITION, cn } from '../../lib/utils'

export { DEFAULT_SHIFT_START, DEFAULT_SHIFT_END }

interface DayScheduleEditorProps {
  date: string
  availability: (Availability & { users?: { full_name: string } })[]
  shifts: Shift[]
  employees: User[]
  onSaved: () => Promise<void>
  onAddShift?: () => void
}

const emptyForm = (): ShiftFormValues => ({
  start_time: DEFAULT_SHIFT_START,
  end_time: DEFAULT_SHIFT_END,
  position: DEFAULT_SHIFT_POSITION,
  user_id: null,
})

export function DayScheduleEditor({
  date,
  availability,
  shifts,
  employees,
  onSaved,
  onAddShift,
}: DayScheduleEditorProps) {
  const { organization } = useOrganization()
  const toast = useToast()
  const confirm = useConfirm()
  const [busy, setBusy] = useState<string | null>(null)
  const [adding, setAdding] = useState<'open' | 'employee' | null>(null)
  const [quickAddUserId, setQuickAddUserId] = useState<string | null>(null)
  const [editId, setEditId] = useState<string | null>(null)
  const [form, setForm] = useState<ShiftFormValues>(emptyForm())

  const dayShifts = useMemo(() => shifts.filter((s) => s.date === date), [shifts, date])
  const assigned = useMemo(() => dayShifts.filter((s) => s.user_id), [dayShifts])
  const assignedIds = useMemo(() => new Set(assigned.map((s) => s.user_id)), [assigned])

  const availableToday = useMemo(
    () => availability.filter((a) => a.date === date),
    [availability, date]
  )

  const unscheduledAvailable = useMemo(
    () => availableToday.filter((a) => !assignedIds.has(a.user_id)),
    [availableToday, assignedIds]
  )

  const employeeOptions = useMemo(
    () => employees.filter((e) => e.role === 'employee'),
    [employees]
  )

  useEffect(() => {
    setAdding(null)
    setQuickAddUserId(null)
    setEditId(null)
    setForm(emptyForm())
  }, [date])

  const run = async (key: string, fn: () => Promise<void>, success: string) => {
    setBusy(key)
    try {
      await fn()
      await onSaved()
      toast.success(success)
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Actie mislukt')
    } finally {
      setBusy(null)
    }
  }

  const startEdit = (shift: Shift) => {
    setEditId(shift.id)
    setAdding(null)
    setForm({
      start_time: shift.start_time.slice(0, 5),
      end_time: shift.end_time.slice(0, 5),
      position: shift.position,
      user_id: shift.user_id,
    })
  }

  const handleCreate = async () => {
    if (!organization) return
    await run('create', async () => {
      await createShift({
        organization_id: organization.id,
        user_id: form.user_id,
        date,
        start_time: form.start_time,
        end_time: form.end_time,
        position: form.position,
        status: 'scheduled',
        published: false,
        template_id: null,
        slot_index: 0,
      })
      setAdding(null)
      setQuickAddUserId(null)
      setForm(emptyForm())
    }, form.user_id ? 'Dienst toegevoegd' : 'Open dienst aangemaakt')
  }

  const handleUpdate = async (id: string) => {
    await run(`edit-${id}`, async () => {
      await updateShift(id, {
        start_time: form.start_time,
        end_time: form.end_time,
        position: form.position,
        user_id: form.user_id,
        published: false,
      })
      setEditId(null)
      setForm(emptyForm())
    }, 'Dienst bijgewerkt')
  }

  const handleDelete = async (shift: Shift) => {
    const ok = await confirm({
      title: 'Dienst verwijderen?',
      message: `${shift.position} ${shift.start_time.slice(0, 5)}–${shift.end_time.slice(0, 5)} wordt permanent verwijderd.`,
      confirmLabel: 'Verwijderen',
      danger: true,
    })
    if (!ok) return
    await run(`del-${shift.id}`, async () => {
      await deleteShift(shift.id)
      if (editId === shift.id) setEditId(null)
    }, 'Dienst verwijderd')
  }

  const handleTogglePublish = async (shift: Shift) => {
    await run(`pub-${shift.id}`, async () => {
      await updateShift(shift.id, { published: !shift.published })
    }, shift.published ? 'Naar concept gezet' : 'Dienst gepubliceerd')
  }

  const startQuickAdd = (userId: string) => {
    setQuickAddUserId(userId)
    setAdding(null)
    setEditId(null)
    setForm({
      ...emptyForm(),
      user_id: userId,
    })
  }

  const handleQuickAddConfirm = async () => {
    if (!organization || !form.user_id) return
    await run('create', async () => {
      await createShift({
        organization_id: organization.id,
        user_id: form.user_id,
        date,
        start_time: form.start_time,
        end_time: form.end_time,
        position: form.position,
        status: 'scheduled',
        published: false,
        template_id: null,
        slot_index: 0,
      })
      setQuickAddUserId(null)
      setForm(emptyForm())
    }, 'Dienst ingepland')
  }

  const planAllAvailable = async () => {
    if (!organization || unscheduledAvailable.length === 0) return
    const ok = await confirm({
      title: 'Allen inplannen?',
      message: `${unscheduledAvailable.length} beschikbare medewerker(s) worden ingepland met standaardtijden ${DEFAULT_SHIFT_START}–${DEFAULT_SHIFT_END}.`,
      confirmLabel: 'Inplannen',
    })
    if (!ok) return
    setBusy('all')
    try {
      for (const a of unscheduledAvailable) {
        await createShift({
          organization_id: organization.id,
          user_id: a.user_id,
          date,
          start_time: DEFAULT_SHIFT_START,
          end_time: DEFAULT_SHIFT_END,
          position: DEFAULT_SHIFT_POSITION,
          status: 'scheduled',
          published: false,
          template_id: null,
          slot_index: 0,
        })
      }
      await onSaved()
      toast.success(`${unscheduledAvailable.length} medewerkers ingepland`)
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Bulk inplannen mislukt')
    } finally {
      setBusy(null)
    }
  }

  const clearDay = async () => {
    if (dayShifts.length === 0) return
    const ok = await confirm({
      title: 'Hele dag leegmaken?',
      message: `Alle ${dayShifts.length} dienst(en) op ${formatDayHeader(date)} worden verwijderd.`,
      confirmLabel: 'Alles verwijderen',
      danger: true,
    })
    if (!ok) return
    setBusy('clear')
    try {
      for (const s of dayShifts) await deleteShift(s.id)
      await onSaved()
      toast.success('Dag geleegd')
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Leegmaken mislukt')
    } finally {
      setBusy(null)
    }
  }

  const copyFromYesterday = async () => {
    if (!organization) return
    const prev = format(subDays(new Date(date + 'T12:00:00'), 1), 'yyyy-MM-dd')
    const prevShifts = shifts.filter((s) => s.date === prev)
    if (prevShifts.length === 0) {
      toast.info('Geen diensten gevonden op de vorige dag')
      return
    }
    const ok = await confirm({
      title: 'Kopiëren van gisteren?',
      message: `${prevShifts.length} dienst(en) worden gekopieerd naar ${formatDayHeader(date)}.`,
      confirmLabel: 'Kopiëren',
    })
    if (!ok) return
    setBusy('copy')
    try {
      for (const s of prevShifts) {
        await createShift({
          organization_id: organization.id,
          user_id: s.user_id,
          date,
          start_time: s.start_time.slice(0, 5),
          end_time: s.end_time.slice(0, 5),
          position: s.position,
          status: 'scheduled',
          published: s.published,
          template_id: null,
          slot_index: 0,
        })
      }
      await onSaved()
      toast.success(`${prevShifts.length} diensten gekopieerd`)
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Kopiëren mislukt')
    } finally {
      setBusy(null)
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold capitalize" style={{ color: 'var(--text-primary)' }}>
            {formatDayHeader(date)}
          </h2>
          <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
            {dayShifts.length === 0 ? 'Geen diensten' : `${dayShifts.length} dienst${dayShifts.length !== 1 ? 'en' : ''}`}
          </p>
        </div>
        <div className="flex gap-2">
          {onAddShift ? (
            <Button size="sm" onClick={onAddShift}>
              <Plus className="h-4 w-4" /> Toevoegen
            </Button>
          ) : (
            <Button size="sm" onClick={() => { setAdding('open'); setEditId(null); setForm(emptyForm()) }}>
              <Plus className="h-4 w-4" /> Toevoegen
            </Button>
          )}
          <Dropdown
            align="right"
            aria-label="Dag acties"
            trigger={
              <span className="inline-flex rounded-lg p-2" style={{ border: '1px solid var(--border)', color: 'var(--text-muted)' }}>
                <MoreHorizontal className="h-4 w-4" />
              </span>
            }
            items={[
              { id: 'plan', label: 'Plan beschikbaren', onClick: planAllAvailable, disabled: unscheduledAvailable.length === 0 },
              { id: 'copy', label: 'Kopieer gisteren', onClick: copyFromYesterday },
              { id: 'clear', label: 'Dag leegmaken', onClick: clearDay, disabled: dayShifts.length === 0, danger: true },
            ]}
          />
        </div>
      </div>

      {(adding === 'open' || adding === 'employee') && (
        <div className="rounded-xl p-4" style={{ border: '1px solid var(--border)', background: 'var(--surface-subtle)' }}>
          <ShiftEditorForm
            values={form}
            onChange={(p) => setForm((f) => ({ ...f, ...p }))}
            onSubmit={handleCreate}
            onCancel={() => setAdding(null)}
            submitLabel="Opslaan"
            loading={busy === 'create'}
            employees={employeeOptions}
            showEmployee={adding === 'employee'}
          />
        </div>
      )}

      {dayShifts.length > 0 ? (
        <ul className="space-y-2">
          {[...dayShifts]
            .sort((a, b) => a.start_time.localeCompare(b.start_time))
            .map((shift) => (
              <li key={shift.id}>
                {editId === shift.id ? (
                  <div className="rounded-xl p-4" style={{ border: '1px solid var(--border)', background: 'var(--surface-subtle)' }}>
                    <ShiftEditorForm
                      values={form}
                      onChange={(p) => setForm((f) => ({ ...f, ...p }))}
                      onSubmit={() => handleUpdate(shift.id)}
                      onCancel={() => setEditId(null)}
                      loading={busy === `edit-${shift.id}`}
                      employees={employeeOptions}
                      showEmployee
                    />
                  </div>
                ) : (
                  <ScheduleShiftCard
                    shift={shift}
                    admin
                    onEdit={() => startEdit(shift)}
                    onDelete={() => handleDelete(shift)}
                    onTogglePublish={() => handleTogglePublish(shift)}
                  />
                )}
              </li>
            ))}
        </ul>
      ) : !adding && (
        <p className="py-6 text-center text-sm" style={{ color: 'var(--text-muted)' }}>
          Nog geen diensten op deze dag.
        </p>
      )}

      {unscheduledAvailable.length > 0 && (
        <div className="space-y-2 border-t pt-4" style={{ borderColor: 'var(--border)' }}>
          <p className="text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>
            Beschikbaar ({unscheduledAvailable.length})
          </p>
          {quickAddUserId && (
            <div className="rounded-xl p-4" style={{ border: '1px solid var(--border)', background: 'var(--surface-subtle)' }}>
              <ShiftEditorForm
                values={form}
                onChange={(p) => setForm((f) => ({ ...f, ...p }))}
                onSubmit={handleQuickAddConfirm}
                onCancel={() => { setQuickAddUserId(null); setForm(emptyForm()) }}
                submitLabel="Inplannen"
                loading={busy === 'create'}
                employees={employeeOptions}
                showEmployee
              />
            </div>
          )}
          <div className="flex flex-wrap gap-2">
            {unscheduledAvailable.map((a) => (
              <button
                key={a.id}
                type="button"
                disabled={!!busy}
                onClick={() => startQuickAdd(a.user_id)}
                className={cn(
                  'rounded-lg px-3 py-1.5 text-sm transition-colors',
                  quickAddUserId === a.user_id && 'ring-2 ring-brand-500'
                )}
                style={{
                  background: 'var(--surface-subtle)',
                  border: '1px solid var(--border)',
                  color: 'var(--text-primary)',
                }}
              >
                {a.users?.full_name ?? 'Medewerker'}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
