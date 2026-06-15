import { useEffect, useMemo, useState } from 'react'
import { X, Clock, UserPlus, Trash2, Check, AlertTriangle } from 'lucide-react'
import type { Shift, User, Availability, LeaveRequest } from '../../types/database'
import { createShift, deleteShift } from '../../services/shifts'
import { useOrganization } from '../../context/OrganizationContext'
import { useOrgConfig } from '../../context/OrgConfigContext'
import { useToast } from '../../context/ToastContext'
import { useConfirm } from '../../context/ConfirmContext'
import {
  rankEmployeesForSlot,
  monthlyHoursForUser,
  getWarnings,
} from '../../lib/plannerEngine'
import { ConflictList } from './ConflictBadge'
import { formatDayHeader } from '../calendar/MonthCalendar'
import { Button } from '../ui/Button'
import { Select } from '../ui/Select'
import { Input } from '../ui/Input'
import {
  DEFAULT_SHIFT_END,
  DEFAULT_SHIFT_START,
  DEFAULT_SHIFT_POSITION,
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
  /** Popover layout: 2 columns, sticky footer — same info as inline, no stripped fields */
  popover?: boolean
}

function EmployeeRow({
  user,
  hours,
  position,
  reasons,
  warnings,
  selected,
  onSelect,
  dense,
}: {
  user: User
  hours: number
  position?: string
  reasons: string[]
  warnings: ReturnType<typeof getWarnings>
  selected: boolean
  onSelect: () => void
  dense?: boolean
}) {
  return (
    <button
      type="button"
      onClick={onSelect}
      className={cn(
        'flex w-full flex-col gap-1.5 rounded-xl text-left transition-all',
        dense ? 'px-3 py-2.5' : 'gap-2 px-4 py-3',
        selected ? 'ring-2 ring-brand-500' : 'hover:ring-1 hover:ring-brand-500/30'
      )}
      style={{
        background: selected ? 'rgba(59,130,246,0.06)' : 'var(--surface-subtle)',
        border: '1px solid var(--border)',
      }}
    >
      <div className="flex items-center gap-3">
        <span
          className={cn(
            'flex shrink-0 items-center justify-center rounded-full font-bold',
            dense ? 'h-8 w-8 text-xs' : 'h-10 w-10 text-sm'
          )}
          style={{ background: 'var(--brand-muted)', color: 'var(--brand-strong)' }}
        >
          {user.full_name[0]?.toUpperCase()}
        </span>
        <div className="min-w-0 flex-1">
          <p className="truncate font-medium text-sm" style={{ color: 'var(--text-primary)' }}>
            {user.full_name}
          </p>
          <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
            {position ?? user.primary_position ?? 'Medewerker'} · {hours.toFixed(0)}u deze maand
          </p>
        </div>
        {selected && <Check className="h-4 w-4 shrink-0 text-brand-600" />}
      </div>
      {reasons[0] && !warnings.length && (
        <p className="break-words pl-11 text-[11px] font-medium" style={{ color: '#10B981' }}>
          {reasons.join(' · ')}
        </p>
      )}
      {warnings.length > 0 && (
        <div className="pl-11">
          <ConflictList warnings={warnings} compact />
        </div>
      )}
    </button>
  )
}

export function DayPlannerPanel({
  date,
  shifts,
  employees,
  availability,
  leave,
  onSaved,
  onClose,
  popover,
}: DayPlannerPanelProps) {
  const { organization } = useOrganization()
  const { positionOptions } = useOrgConfig()
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

  const selectedWarnings = useMemo(() => {
    if (!selectedUserId) return []
    const entry = ranked.find((r) => r.user.id === selectedUserId)
    if (entry) return entry.warnings
    return getWarnings(selectedUserId, slot, availability, leave, shifts, 160, pool.find((e) => e.id === selectedUserId)?.contract_hours_per_week)
  }, [selectedUserId, ranked, slot, availability, leave, shifts])

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
      className={cn(
        'flex min-h-0 min-w-0 max-w-full flex-col overflow-hidden',
        !popover && 'animate-slide-up rounded-2xl'
      )}
      style={
        popover
          ? undefined
          : {
              background: 'var(--surface-card)',
              border: '1px solid var(--border)',
              boxShadow: '0 8px 32px rgba(15,23,42,0.08)',
            }
      }
    >
      <div
        className={cn('flex shrink-0 items-center justify-between gap-3', popover ? 'px-4 py-3' : 'px-5 py-4')}
        style={{
          background: 'linear-gradient(135deg, rgba(59,130,246,0.06) 0%, transparent 100%)',
          borderBottom: '1px solid var(--border)',
        }}
      >
        <div className="min-w-0">
          <p className="text-xs font-medium uppercase tracking-wider" style={{ color: 'var(--brand-strong)' }}>
            Dag plannen
          </p>
          <h2 className="text-base font-semibold capitalize leading-tight" style={{ color: 'var(--text-primary)' }}>
            {formatDayHeader(date)}
          </h2>
          <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
            {dayShifts.length} dienst{dayShifts.length !== 1 ? 'en' : ''} · kies medewerker en tijden
          </p>
        </div>
        {onClose && (
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1.5 transition-colors hover:bg-black/5"
            style={{ color: 'var(--text-muted)' }}
            aria-label="Sluiten"
          >
            <X className="h-5 w-5" />
          </button>
        )}
      </div>

      <div
        className={cn(
          'grid min-h-0 min-w-0 flex-1 overflow-hidden',
          popover
            ? 'grid-cols-1 md:grid-cols-[minmax(0,260px)_minmax(0,1fr)]'
            : 'grid-cols-1 gap-6 p-5 lg:grid-cols-[1fr_1.2fr]'
        )}
      >
        {/* Left: existing shifts + slot config */}
        <div
          className={cn(
            'flex min-h-0 min-w-0 flex-col gap-3 overflow-y-auto',
            popover ? 'border-b p-4 md:border-b-0 md:border-r' : 'space-y-5'
          )}
          style={popover ? { borderColor: 'var(--border)' } : undefined}
        >
          {dayShifts.length > 0 && (
            <div className="space-y-2">
              <p className="text-[10px] font-semibold uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>
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
                        className="group flex items-center gap-2 rounded-xl px-3 py-2.5"
                        style={{ background: 'var(--surface-subtle)', border: `1px solid ${c.border}` }}
                      >
                        <span className="h-8 w-1 shrink-0 rounded-full" style={{ background: c.accent }} />
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-medium leading-snug" style={{ color: 'var(--text-primary)' }}>
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
                          aria-label="Dienst verwijderen"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </li>
                    )
                  })}
              </ul>
            </div>
          )}

          <div
            className="space-y-2 rounded-xl p-3"
            style={{ background: 'var(--surface-subtle)', border: '1px solid var(--border)' }}
          >
            <p className="flex items-center gap-1.5 text-xs font-semibold" style={{ color: 'var(--text-primary)' }}>
              <Clock className="h-3.5 w-3.5" style={{ color: 'var(--brand-strong)' }} />
              Tijd & afdeling
            </p>
            <Select
              label="Afdeling"
              value={position}
              onChange={(e) => setPosition(e.target.value)}
              options={positionOptions}
            />
            <div className="grid grid-cols-2 gap-2">
              <Input label="Start" type="time" value={startTime} onChange={(e) => setStartTime(e.target.value)} />
              <Input label="Eind" type="time" value={endTime} onChange={(e) => setEndTime(e.target.value)} />
            </div>
          </div>
        </div>

        {/* Right: employee picker */}
        <div className={cn('flex min-h-0 min-w-0 flex-col gap-2 overflow-hidden', popover ? 'p-4' : 'space-y-2')}>
          <p className="flex shrink-0 items-center gap-1.5 text-xs font-semibold" style={{ color: 'var(--text-primary)' }}>
            <UserPlus className="h-3.5 w-3.5" style={{ color: 'var(--brand-strong)' }} />
            Medewerker
          </p>

          <button
            type="button"
            onClick={() => setSelectedUserId(null)}
            className={cn(
              'flex w-full shrink-0 items-center gap-3 rounded-xl px-3 py-2.5 text-left transition-all',
              selectedUserId === null && 'ring-2 ring-amber-400'
            )}
            style={{
              background: selectedUserId === null ? 'rgba(245,158,11,0.08)' : 'var(--surface-subtle)',
              border: '1px solid var(--border)',
            }}
          >
            <span
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-sm font-bold"
              style={{ background: 'rgba(245,158,11,0.15)', color: '#D97706' }}
            >
              ?
            </span>
            <div className="min-w-0">
              <p className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>Open dienst</p>
              <p className="text-xs" style={{ color: 'var(--text-muted)' }}>Nog geen medewerker toegewezen</p>
            </div>
            {selectedUserId === null && <Check className="ml-auto h-4 w-4 text-amber-500" />}
          </button>

          <div className="min-h-0 flex-1 space-y-2 overflow-y-auto pr-0.5">
            {ranked.length > 0 && (
              <p
                className="sticky top-0 z-10 py-1 text-[10px] font-bold uppercase tracking-wider"
                style={{ color: '#10B981', background: 'var(--surface-card)' }}
              >
                Aanbevolen · beschikbaar
              </p>
            )}
            {ranked.map(({ user, warnings, reasons }) => (
              <EmployeeRow
                key={user.id}
                user={user}
                hours={monthlyHoursForUser(user.id, shifts)}
                reasons={reasons}
                warnings={warnings}
                selected={selectedUserId === user.id}
                onSelect={() => setSelectedUserId(user.id)}
                dense={popover}
              />
            ))}

            {others.length > 0 && (
              <>
                <p className="pt-1 text-[10px] font-bold uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>
                  Overige medewerkers
                </p>
                {others.map((user) => {
                  const warnings = getWarnings(user.id, slot, availability, leave, shifts, 160, user.contract_hours_per_week)
                  const hours = monthlyHoursForUser(user.id, shifts)
                  return (
                    <EmployeeRow
                      key={user.id}
                      user={user}
                      hours={hours}
                      reasons={warnings.length ? [] : ['Niet in top aanbevelingen']}
                      warnings={warnings}
                      selected={selectedUserId === user.id}
                      onSelect={() => setSelectedUserId(user.id)}
                      dense={popover}
                    />
                  )
                })}
              </>
            )}

            {pool.length === 0 && (
              <p className="py-4 text-center text-sm" style={{ color: 'var(--text-muted)' }}>
                Geen medewerkers gevonden
              </p>
            )}
          </div>

          {selectedWarnings.length > 0 && (
            <div
              className="flex shrink-0 items-start gap-2 rounded-xl px-3 py-2 text-xs"
              style={{ background: 'rgba(245,158,11,0.08)', color: '#D97706' }}
            >
              <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
              <div>
                <p className="font-medium">Conflicten gedetecteerd</p>
                <p className="mt-0.5 opacity-90">Je kunt alsnog inplannen als manager.</p>
                <div className="mt-1.5">
                  <ConflictList warnings={selectedWarnings} />
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      <div
        className={cn('shrink-0', popover ? 'border-t px-4 py-3' : 'px-5 pb-5')}
        style={popover ? { borderColor: 'var(--border)' } : undefined}
      >
        <Button className="w-full" loading={saving} onClick={handleSave}>
          {selectedUserId ? 'Medewerker inplannen' : 'Open dienst aanmaken'}
        </Button>
      </div>
    </div>
  )
}
