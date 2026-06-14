import { useEffect, useMemo, useState } from 'react'
import {
  Plus,
  Users,
  CalendarPlus,
  Trash2,
  Sparkles,
  UserPlus,
  Copy,
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
import { ScheduleTimeline } from './ScheduleTimeline'
import { ShiftEditorForm, type ShiftFormValues } from './ShiftEditorForm'
import { DEFAULT_SHIFT_END, DEFAULT_SHIFT_START, DEFAULT_SHIFT_POSITION, cn } from '../../lib/utils'

export { DEFAULT_SHIFT_START, DEFAULT_SHIFT_END }

interface DayScheduleEditorProps {
  date: string
  availability: (Availability & { users?: { full_name: string } })[]
  shifts: Shift[]
  employees: User[]
  onSaved: () => Promise<void>
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
}: DayScheduleEditorProps) {
  const { organization } = useOrganization()
  const toast = useToast()
  const confirm = useConfirm()
  const [busy, setBusy] = useState<string | null>(null)
  const [adding, setAdding] = useState<'open' | 'employee' | null>(null)
  const [editId, setEditId] = useState<string | null>(null)
  const [form, setForm] = useState<ShiftFormValues>(emptyForm())

  const dayShifts = useMemo(() => shifts.filter((s) => s.date === date), [shifts, date])
  const assigned = useMemo(() => dayShifts.filter((s) => s.user_id), [dayShifts])
  const openShifts = useMemo(() => dayShifts.filter((s) => !s.user_id), [dayShifts])
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
        published: true,
        template_id: null,
        slot_index: 0,
      })
      setAdding(null)
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
        published: true,
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

  const quickAddEmployee = async (userId: string, name: string) => {
    if (!organization) return
    await run(`quick-${userId}`, async () => {
      await createShift({
        organization_id: organization.id,
        user_id: userId,
        date,
        start_time: DEFAULT_SHIFT_START,
        end_time: DEFAULT_SHIFT_END,
        position: DEFAULT_SHIFT_POSITION,
        status: 'scheduled',
        published: true,
        template_id: null,
        slot_index: 0,
      })
    }, `${name} ingepland`)
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
          published: true,
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
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold capitalize" style={{ color: 'var(--text-primary)' }}>
            {formatDayHeader(date)}
          </h2>
          <div className="mt-2 flex flex-wrap gap-2">
            {[
              { label: 'Ingepland', value: assigned.length, color: '#3B82F6' },
              { label: 'Open', value: openShifts.length, color: '#F59E0B' },
              { label: 'Beschikbaar', value: availableToday.length, color: '#10B981' },
            ].map(({ label, value, color }) => (
              <span
                key={label}
                className="inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold"
                style={{ background: `${color}18`, color, border: `1px solid ${color}33` }}
              >
                {value} {label.toLowerCase()}
              </span>
            ))}
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          <Button size="sm" variant="secondary" onClick={() => { setAdding('open'); setEditId(null); setForm(emptyForm()) }} loading={busy === 'create'}>
            <CalendarPlus className="h-4 w-4" /> Open dienst
          </Button>
          <Button size="sm" onClick={() => { setAdding('employee'); setEditId(null); setForm({ ...emptyForm(), user_id: employeeOptions[0]?.id ?? null }) }}>
            <UserPlus className="h-4 w-4" /> Medewerker
          </Button>
        </div>
      </div>

      {dayShifts.length > 0 && <ScheduleTimeline shifts={dayShifts} />}

      {/* Quick actions bar */}
      <div
        className="flex flex-wrap gap-2 rounded-2xl p-3"
        style={{ background: 'var(--surface-subtle)', border: '1px solid var(--border)' }}
      >
        <Button size="sm" variant="ghost" onClick={planAllAvailable} disabled={unscheduledAvailable.length === 0} loading={busy === 'all'}>
          <Sparkles className="h-4 w-4" /> Plan alle beschikbaren
        </Button>
        <Button size="sm" variant="ghost" onClick={copyFromYesterday} loading={busy === 'copy'}>
          <Copy className="h-4 w-4" /> Kopieer gisteren
        </Button>
        <Button size="sm" variant="ghost" onClick={clearDay} disabled={dayShifts.length === 0} loading={busy === 'clear'}>
          <Trash2 className="h-4 w-4" /> Leeg dag
        </Button>
      </div>

      {(adding === 'open' || adding === 'employee') && (
        <div className="rounded-2xl p-4 animate-slide-up" style={{ background: 'var(--surface-subtle)', border: '1px solid var(--border)' }}>
          <p className="mb-3 text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>
            {adding === 'open' ? 'Nieuwe open dienst' : 'Medewerker inplannen'}
          </p>
          <ShiftEditorForm
            values={form}
            onChange={(p) => setForm((f) => ({ ...f, ...p }))}
            onSubmit={handleCreate}
            onCancel={() => setAdding(null)}
            submitLabel="Toevoegen"
            loading={busy === 'create'}
            employees={employeeOptions}
            showEmployee={adding === 'employee'}
          />
        </div>
      )}

      {/* Open shifts */}
      {openShifts.length > 0 && (
        <section className="space-y-3">
          <h3 className="flex items-center gap-2 text-sm font-semibold uppercase tracking-wider" style={{ color: '#F59E0B' }}>
            <CalendarPlus className="h-4 w-4" /> Open diensten ({openShifts.length})
          </h3>
          <ul className="space-y-2">
            {openShifts.map((shift) => (
              <li key={shift.id}>
                {editId === shift.id ? (
                  <div className="rounded-2xl p-4" style={{ border: '1px solid var(--border)', background: 'var(--surface-subtle)' }}>
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
        </section>
      )}

      {/* Assigned shifts */}
      <section className="space-y-3">
        <h3 className="flex items-center gap-2 text-sm font-semibold uppercase tracking-wider" style={{ color: 'var(--brand-strong)' }}>
          <Users className="h-4 w-4" /> Ingeplande diensten ({assigned.length})
        </h3>
        {assigned.length === 0 ? (
          <div
            className="rounded-2xl px-6 py-10 text-center"
            style={{ border: '1px dashed var(--border-strong)', background: 'var(--surface-subtle)' }}
          >
            <Users className="mx-auto mb-2 h-8 w-8" style={{ color: 'var(--text-disabled)' }} />
            <p className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>Nog niemand ingepland</p>
            <p className="mt-1 text-xs" style={{ color: 'var(--text-muted)' }}>Voeg medewerkers toe of plan beschikbaren in.</p>
          </div>
        ) : (
          <ul className="space-y-2">
            {assigned
              .sort((a, b) => a.start_time.localeCompare(b.start_time))
              .map((shift) => (
                <li key={shift.id}>
                  {editId === shift.id ? (
                    <div className="rounded-2xl p-4" style={{ border: '1px solid var(--border)', background: 'var(--surface-subtle)' }}>
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
        )}
      </section>

      {/* Available pool */}
      {unscheduledAvailable.length > 0 && (
        <section className="space-y-3">
          <h3 className="flex items-center gap-2 text-sm font-semibold uppercase tracking-wider" style={{ color: '#10B981' }}>
            <Plus className="h-4 w-4" /> Beschikbaar — snel toevoegen
          </h3>
          <div className="flex flex-wrap gap-2">
            {unscheduledAvailable.map((a) => (
              <button
                key={a.id}
                type="button"
                disabled={!!busy}
                onClick={() => quickAddEmployee(a.user_id, a.users?.full_name ?? 'Medewerker')}
                className={cn(
                  'rounded-xl px-3 py-2 text-sm font-medium transition-all hover:-translate-y-0.5 hover:shadow-sm disabled:opacity-50'
                )}
                style={{
                  background: 'rgba(16,185,129,0.1)',
                  border: '1px solid rgba(16,185,129,0.25)',
                  color: '#059669',
                }}
              >
                + {a.users?.full_name ?? 'Medewerker'}
              </button>
            ))}
          </div>
        </section>
      )}

      {availableToday.length === 0 && assigned.length === 0 && openShifts.length === 0 && !adding && (
        <div
          className="flex flex-col items-center justify-center rounded-2xl px-6 py-14 text-center"
          style={{ border: '1px dashed var(--border-strong)', background: 'var(--surface-subtle)' }}
        >
          <Users className="mb-3 h-10 w-10" style={{ color: 'var(--text-disabled)' }} />
          <p className="font-medium" style={{ color: 'var(--text-primary)' }}>Lege dag</p>
          <p className="mt-1 max-w-sm text-sm" style={{ color: 'var(--text-muted)' }}>
            Nog geen beschikbaarheid of diensten. Voeg handmatig een open dienst of medewerker toe.
          </p>
          <div className="mt-4 flex flex-wrap justify-center gap-2">
            <Button size="sm" onClick={() => setAdding('open')}>Open dienst</Button>
            <Button size="sm" variant="secondary" onClick={() => setAdding('employee')}>Medewerker</Button>
          </div>
        </div>
      )}
    </div>
  )
}
