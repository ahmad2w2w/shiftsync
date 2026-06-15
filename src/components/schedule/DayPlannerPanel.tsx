import { useEffect, useMemo, useState } from 'react'
import { X, Clock, UserPlus, Trash2, Check, AlertTriangle } from 'lucide-react'
import type { Shift, User, Availability, LeaveRequest } from '../../types/database'
import { createShift, deleteShift } from '../../services/shifts'
import { useOrganization } from '../../context/OrganizationContext'
import { useToast } from '../../context/ToastContext'
import { useConfirm } from '../../context/ConfirmContext'
import { rankEmployeesForSlot, monthlyHoursForUser } from '../../lib/plannerEngine'
import { ConflictList } from './ConflictBadge'
import { formatDayHeader } from '../calendar/MonthCalendar'
import { Button } from '../ui/Button'
import { Select } from '../ui/Select'
import { Input } from '../ui/Input'
import {
  DEFAULT_SHIFT_END,
  DEFAULT_SHIFT_START,
  DEFAULT_SHIFT_POSITION,
  SHIFT_POSITIONS,
  getPositionColor,
  formatTime,
  cn,
} from '../../lib/utils'

interface DayPlannerPanelProps {
  date: string
  shifts: Shift[]
  employees: User[]
  availability: (Availability & { users?: { full_name: string } })[]
  leave: LeaveRequest[]
  onSaved: () => Promise<void>
  onClose?: () => void
}

export function DayPlannerPanel({
  date,
  shifts,
  employees,
  availability,
  leave,
  onSaved,
  onClose,
}: DayPlannerPanelProps) {
  const { organization } = useOrganization()
  const toast = useToast()
  const confirm = useConfirm()
  const [position, setPosition] = useState(DEFAULT_SHIFT_POSITION)
  const [startTime, setStartTime] = useState(DEFAULT_SHIFT_START)
  const [endTime, setEndTime] = useState(DEFAULT_SHIFT_END)
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)

  const dayShifts = useMemo(() => shifts.filter((s) => s.date === date), [shifts, date])
  const pool = useMemo(() => employees.filter((e) => e.role === 'employee'), [employees])

  const slot = useMemo(
    () => ({ id: 'new', date, start_time: startTime, end_time: endTime, position }),
    [date, startTime, endTime, position]
  )

  const ranked = useMemo(
    () => rankEmployeesForSlot(slot, pool, availability, leave, shifts, 160),
    [slot, pool, availability, leave, shifts]
  )

  const others = useMemo(() => {
    const ids = new Set(ranked.map((r) => r.user.id))
    return pool.filter((e) => !ids.has(e.id))
  }, [ranked, pool])

  const selectedRank = ranked.find((r) => r.user.id === selectedUserId)

  useEffect(() => {
    setSelectedUserId(null)
    setPosition(DEFAULT_SHIFT_POSITION)
    setStartTime(DEFAULT_SHIFT_START)
    setEndTime(DEFAULT_SHIFT_END)
  }, [date])

  const handleSave = async () => {
    if (!organization) return
    setSaving(true)
    try {
      await createShift({
        organization_id: organization.id,
        user_id: selectedUserId,
        date,
        start_time: startTime,
        end_time: endTime,
        position,
        status: 'scheduled',
        published: false,
        template_id: null,
        slot_index: 0,
      })
      await onSaved()
      setSelectedUserId(null)
      toast.success(selectedUserId ? 'Medewerker ingepland' : 'Open dienst aangemaakt')
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Opslaan mislukt')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (shift: Shift) => {
    const ok = await confirm({
      title: 'Dienst verwijderen?',
      message: `${shift.position} ${formatTime(shift.start_time)}–${formatTime(shift.end_time)}`,
      confirmLabel: 'Verwijderen',
      danger: true,
    })
    if (!ok) return
    await deleteShift(shift.id)
    await onSaved()
    toast.success('Dienst verwijderd')
  }

  return (
    <div
      className="animate-slide-up overflow-hidden rounded-2xl"
      style={{
        background: 'var(--surface-card)',
        border: '1px solid var(--border)',
        boxShadow: '0 8px 32px rgba(15,23,42,0.08)',
      }}
    >
      {/* Header */}
      <div
        className="flex items-center justify-between gap-4 px-5 py-4"
        style={{
          background: 'linear-gradient(135deg, rgba(59,130,246,0.06) 0%, transparent 100%)',
          borderBottom: '1px solid var(--border)',
        }}
      >
        <div>
          <p className="text-xs font-medium uppercase tracking-wider" style={{ color: 'var(--brand-strong)' }}>
            Dag plannen
          </p>
          <h2 className="text-lg font-semibold capitalize" style={{ color: 'var(--text-primary)' }}>
            {formatDayHeader(date)}
          </h2>
          <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
            {dayShifts.length} dienst{dayShifts.length !== 1 ? 'en' : ''} · kies medewerker en tijden
          </p>
        </div>
        {onClose && (
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl p-2 transition-colors hover:bg-black/5"
            style={{ color: 'var(--text-muted)' }}
            aria-label="Sluiten"
          >
            <X className="h-5 w-5" />
          </button>
        )}
      </div>

      <div className="grid gap-6 p-5 lg:grid-cols-[1fr_1.2fr]">
        {/* Left: config + existing */}
        <div className="space-y-5">
          {dayShifts.length > 0 && (
            <div className="space-y-2">
              <p className="text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>
                Geplande diensten
              </p>
              <ul className="space-y-2">
                {dayShifts
                  .sort((a, b) => a.start_time.localeCompare(b.start_time))
                  .map((shift) => {
                    const c = getPositionColor(shift.position)
                    const name = shift.user?.full_name
                    return (
                      <li
                        key={shift.id}
                        className="group flex items-center gap-3 rounded-xl px-3 py-2.5"
                        style={{ background: 'var(--surface-subtle)', border: `1px solid ${c.border}` }}
                      >
                        <span className="h-8 w-1 shrink-0 rounded-full" style={{ background: c.accent }} />
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
                            {formatTime(shift.start_time)} – {formatTime(shift.end_time)}
                            <span className="mx-1.5" style={{ color: 'var(--text-disabled)' }}>·</span>
                            {shift.position}
                          </p>
                          <p className="truncate text-xs" style={{ color: 'var(--text-muted)' }}>
                            {name ?? 'Open dienst'}
                            {!shift.published && ' · Concept'}
                          </p>
                        </div>
                        <button
                            type="button"
                            onClick={() => handleDelete(shift)}
                            className="rounded-lg p-1.5 hover:bg-red-500/10"
                            style={{ color: '#EF4444' }}
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                      </li>
                    )
                  })}
              </ul>
            </div>
          )}

          <div className="space-y-3 rounded-xl p-4" style={{ background: 'var(--surface-subtle)', border: '1px solid var(--border)' }}>
            <p className="flex items-center gap-2 text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>
              <Clock className="h-4 w-4" style={{ color: 'var(--brand-strong)' }} />
              Dienst instellen
            </p>
            <Select
              label="Afdeling"
              value={position}
              onChange={(e) => setPosition(e.target.value)}
              options={[...SHIFT_POSITIONS]}
            />
            <div className="grid grid-cols-2 gap-3">
              <Input label="Start" type="time" value={startTime} onChange={(e) => setStartTime(e.target.value)} />
              <Input label="Eind" type="time" value={endTime} onChange={(e) => setEndTime(e.target.value)} />
            </div>
          </div>
        </div>

        {/* Right: employee picker */}
        <div className="space-y-3">
          <p className="flex items-center gap-2 text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>
            <UserPlus className="h-4 w-4" style={{ color: 'var(--brand-strong)' }} />
            Kies medewerker
          </p>

          {/* Open shift option */}
          <button
            type="button"
            onClick={() => setSelectedUserId(null)}
            className={cn(
              'flex w-full items-center gap-3 rounded-xl px-4 py-3 text-left transition-all',
              selectedUserId === null && 'ring-2 ring-amber-400'
            )}
            style={{
              background: selectedUserId === null ? 'rgba(245,158,11,0.08)' : 'var(--surface-subtle)',
              border: '1px solid var(--border)',
            }}
          >
            <span
              className="flex h-10 w-10 items-center justify-center rounded-full text-sm font-bold"
              style={{ background: 'rgba(245,158,11,0.15)', color: '#D97706' }}
            >
              ?
            </span>
            <div>
              <p className="font-medium text-sm" style={{ color: 'var(--text-primary)' }}>Open dienst</p>
              <p className="text-xs" style={{ color: 'var(--text-muted)' }}>Nog geen medewerker toegewezen</p>
            </div>
            {selectedUserId === null && <Check className="ml-auto h-4 w-4 text-amber-500" />}
          </button>

          <div className="max-h-[320px] space-y-2 overflow-y-auto pr-1">
            {ranked.length > 0 && (
              <p className="sticky top-0 py-1 text-[10px] font-bold uppercase tracking-wider" style={{ color: '#10B981', background: 'var(--surface-card)' }}>
                Aanbevolen · beschikbaar
              </p>
            )}
            {ranked.map(({ user, warnings, reasons }) => {
              const sel = selectedUserId === user.id
              const hours = monthlyHoursForUser(user.id, shifts)
              return (
                <button
                  key={user.id}
                  type="button"
                  onClick={() => setSelectedUserId(user.id)}
                  className={cn(
                    'flex w-full flex-col gap-2 rounded-xl px-4 py-3 text-left transition-all',
                    sel ? 'ring-2 ring-brand-500' : 'hover:ring-1 hover:ring-brand-500/30'
                  )}
                  style={{
                    background: sel ? 'rgba(59,130,246,0.06)' : 'var(--surface-subtle)',
                    border: '1px solid var(--border)',
                  }}
                >
                  <div className="flex items-center gap-3">
                    <span
                      className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-sm font-bold"
                      style={{ background: 'var(--brand-muted)', color: 'var(--brand-strong)' }}
                    >
                      {user.full_name[0]?.toUpperCase()}
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-medium text-sm" style={{ color: 'var(--text-primary)' }}>{user.full_name}</p>
                      <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
                        {user.primary_position ?? 'Medewerker'} · {hours.toFixed(0)}u deze maand
                      </p>
                    </div>
                    {sel && <Check className="h-4 w-4 shrink-0 text-brand-600" />}
                  </div>
                  {reasons[0] && !warnings.length && (
                    <p className="text-[10px] font-medium" style={{ color: '#10B981' }}>{reasons[0]}</p>
                  )}
                  {warnings.length > 0 && <ConflictList warnings={warnings} compact />}
                </button>
              )
            })}

            {others.length > 0 && (
              <>
                <p className="pt-2 text-[10px] font-bold uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>
                  Overige
                </p>
                {others.map((user) => {
                  const sel = selectedUserId === user.id
                  return (
                    <button
                      key={user.id}
                      type="button"
                      onClick={() => setSelectedUserId(user.id)}
                      className={cn(
                        'flex w-full items-center gap-3 rounded-xl px-4 py-3 text-left opacity-80',
                        sel && 'ring-2 ring-brand-500 opacity-100'
                      )}
                      style={{ background: 'var(--surface-subtle)', border: '1px solid var(--border)' }}
                    >
                      <span className="flex h-9 w-9 items-center justify-center rounded-full text-xs font-bold" style={{ background: 'var(--border)', color: 'var(--text-muted)' }}>
                        {user.full_name[0]}
                      </span>
                      <p className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>{user.full_name}</p>
                    </button>
                  )
                })}
              </>
            )}
          </div>

          {selectedRank && selectedRank.warnings.length > 0 && (
            <div className="flex items-start gap-2 rounded-xl px-3 py-2 text-xs" style={{ background: 'rgba(245,158,11,0.08)', color: '#D97706' }}>
              <AlertTriangle className="h-3.5 w-3.5 shrink-0 mt-0.5" />
              Conflicten gedetecteerd — je kunt alsnog inplannen als manager.
            </div>
          )}

          <Button className="w-full" loading={saving} onClick={handleSave}>
            {selectedUserId ? 'Medewerker inplannen' : 'Open dienst aanmaken'}
          </Button>
        </div>
      </div>
    </div>
  )
}
