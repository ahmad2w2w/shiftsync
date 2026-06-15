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
  compact?: boolean
}

export function DayPlannerPanel({
  date,
  shifts,
  employees,
  availability,
  leave,
  onSaved,
  onClose,
  compact,
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
      className={cn(
        'flex min-h-0 flex-col overflow-hidden',
        !compact && 'animate-slide-up rounded-2xl'
      )}
      style={
        compact
          ? undefined
          : {
              background: 'var(--surface-card)',
              border: '1px solid var(--border)',
              boxShadow: '0 8px 32px rgba(15,23,42,0.08)',
            }
      }
    >
      <div
        className={cn(
          'flex shrink-0 items-center justify-between gap-3',
          compact ? 'px-3 py-2.5' : 'px-5 py-4'
        )}
        style={{
          background: 'linear-gradient(135deg, rgba(59,130,246,0.06) 0%, transparent 100%)',
          borderBottom: '1px solid var(--border)',
        }}
      >
        <div className="min-w-0">
          {!compact && (
            <p className="text-xs font-medium uppercase tracking-wider" style={{ color: 'var(--brand-strong)' }}>
              Dag plannen
            </p>
          )}
          <h2
            className={cn('font-semibold capitalize leading-tight', compact ? 'text-sm' : 'text-lg')}
            style={{ color: 'var(--text-primary)' }}
          >
            {formatDayHeader(date)}
          </h2>
          {!compact && (
            <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
              {dayShifts.length} dienst{dayShifts.length !== 1 ? 'en' : ''} · kies medewerker en tijden
            </p>
          )}
        </div>
        {onClose && (
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1.5 transition-colors hover:bg-black/5"
            style={{ color: 'var(--text-muted)' }}
            aria-label="Sluiten"
          >
            <X className={compact ? 'h-4 w-4' : 'h-5 w-5'} />
          </button>
        )}
      </div>

      <div
        className={cn(
          'grid min-h-0 flex-1',
          compact ? 'grid-cols-2 gap-0' : 'gap-6 p-5 lg:grid-cols-[1fr_1.2fr]'
        )}
      >
        {/* Left: config + existing */}
        <div
          className={cn(
            'space-y-2 overflow-y-auto',
            compact ? 'border-r p-3' : 'space-y-5',
          )}
          style={compact ? { borderColor: 'var(--border)' } : undefined}
        >
          {dayShifts.length > 0 && (
            <div className="space-y-1">
              <p className="text-[10px] font-semibold uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>
                Gepland ({dayShifts.length})
              </p>
              <ul className="space-y-1">
                {dayShifts
                  .sort((a, b) => a.start_time.localeCompare(b.start_time))
                  .map((shift) => {
                    const c = getPositionColor(shift.position)
                    const name = shift.user?.full_name
                    return (
                      <li
                        key={shift.id}
                        className={cn(
                          'group flex items-center gap-2 rounded-lg',
                          compact ? 'px-2 py-1.5' : 'gap-3 rounded-xl px-3 py-2.5'
                        )}
                        style={{ background: 'var(--surface-subtle)', border: `1px solid ${c.border}` }}
                      >
                        <span className={cn('shrink-0 rounded-full', compact ? 'h-5 w-0.5' : 'h-8 w-1')} style={{ background: c.accent }} />
                        <div className="min-w-0 flex-1">
                          <p className={cn('font-medium', compact ? 'text-[11px] leading-tight' : 'text-sm')} style={{ color: 'var(--text-primary)' }}>
                            {formatTime(shift.start_time)}–{formatTime(shift.end_time)}
                            {!compact && (
                              <>
                                <span className="mx-1.5" style={{ color: 'var(--text-disabled)' }}>·</span>
                                {shift.position}
                              </>
                            )}
                          </p>
                          {!compact && (
                            <p className="truncate text-xs" style={{ color: 'var(--text-muted)' }}>
                              {name ?? 'Open dienst'}
                              {!shift.published && ' · Concept'}
                            </p>
                          )}
                        </div>
                        <button
                          type="button"
                          onClick={() => handleDelete(shift)}
                          className="rounded p-1 hover:bg-red-500/10"
                          style={{ color: '#EF4444' }}
                        >
                          <Trash2 className={compact ? 'h-3 w-3' : 'h-3.5 w-3.5'} />
                        </button>
                      </li>
                    )
                  })}
              </ul>
            </div>
          )}

          <div
            className={cn('space-y-2 rounded-lg', compact ? 'p-2' : 'rounded-xl p-3')}
            style={{ background: 'var(--surface-subtle)', border: '1px solid var(--border)' }}
          >
            {!compact && (
              <p className="flex items-center gap-1.5 text-xs font-semibold" style={{ color: 'var(--text-primary)' }}>
                <Clock className="h-3.5 w-3.5" style={{ color: 'var(--brand-strong)' }} />
                Tijd & afdeling
              </p>
            )}
            <Select
              label={compact ? 'Afdeling' : 'Afdeling'}
              value={position}
              onChange={(e) => setPosition(e.target.value)}
              options={[...SHIFT_POSITIONS]}
            />
            <div className="grid grid-cols-2 gap-2">
              <Input label="Start" type="time" value={startTime} onChange={(e) => setStartTime(e.target.value)} />
              <Input label="Eind" type="time" value={endTime} onChange={(e) => setEndTime(e.target.value)} />
            </div>
          </div>
        </div>

        {/* Right: employee picker */}
        <div className={cn('flex min-h-0 flex-col', compact ? 'p-3' : 'space-y-2')}>
          {!compact && (
            <p className="flex items-center gap-1.5 text-xs font-semibold" style={{ color: 'var(--text-primary)' }}>
              <UserPlus className="h-3.5 w-3.5" style={{ color: 'var(--brand-strong)' }} />
              Medewerker
            </p>
          )}

          <button
            type="button"
            onClick={() => setSelectedUserId(null)}
            className={cn(
              'flex w-full shrink-0 items-center gap-2 rounded-lg text-left transition-all',
              compact ? 'px-2.5 py-2' : 'gap-3 rounded-xl px-4 py-3',
              selectedUserId === null && 'ring-2 ring-amber-400'
            )}
            style={{
              background: selectedUserId === null ? 'rgba(245,158,11,0.08)' : 'var(--surface-subtle)',
              border: '1px solid var(--border)',
            }}
          >
            <span
              className={cn(
                'flex shrink-0 items-center justify-center rounded-full font-bold',
                compact ? 'h-7 w-7 text-xs' : 'h-10 w-10 text-sm'
              )}
              style={{ background: 'rgba(245,158,11,0.15)', color: '#D97706' }}
            >
              ?
            </span>
            <div className="min-w-0">
              <p className={cn('font-medium', compact ? 'text-xs' : 'text-sm')} style={{ color: 'var(--text-primary)' }}>
                Open dienst
              </p>
              {!compact && (
                <p className="text-xs" style={{ color: 'var(--text-muted)' }}>Nog geen medewerker toegewezen</p>
              )}
            </div>
            {selectedUserId === null && <Check className="ml-auto h-3.5 w-3.5 shrink-0 text-amber-500" />}
          </button>

          <div className={cn('min-h-0 flex-1 space-y-1 overflow-y-auto', compact ? 'max-h-[140px]' : 'max-h-[320px] space-y-1.5 pr-0.5')}>
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
                    'flex w-full items-center gap-2 rounded-lg text-left transition-all',
                    compact ? 'px-2.5 py-1.5' : 'flex-col gap-2 rounded-xl px-4 py-3',
                    sel ? 'ring-2 ring-brand-500' : 'hover:ring-1 hover:ring-brand-500/30'
                  )}
                  style={{
                    background: sel ? 'rgba(59,130,246,0.06)' : 'var(--surface-subtle)',
                    border: '1px solid var(--border)',
                  }}
                >
                  <span
                    className={cn(
                      'flex shrink-0 items-center justify-center rounded-full font-bold',
                      compact ? 'h-7 w-7 text-xs' : 'h-10 w-10 text-sm'
                    )}
                    style={{ background: 'var(--brand-muted)', color: 'var(--brand-strong)' }}
                  >
                    {user.full_name[0]?.toUpperCase()}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className={cn('truncate font-medium', compact ? 'text-xs' : 'text-sm')} style={{ color: 'var(--text-primary)' }}>
                      {user.full_name}
                    </p>
                    <p className={cn(compact ? 'text-[10px]' : 'text-xs')} style={{ color: 'var(--text-muted)' }}>
                      {compact ? `${hours.toFixed(0)}u` : `${user.primary_position ?? 'Medewerker'} · ${hours.toFixed(0)}u deze maand`}
                    </p>
                  </div>
                  {sel && <Check className="h-3.5 w-3.5 shrink-0 text-brand-600" />}
                  {!compact && reasons[0] && !warnings.length && (
                    <p className="text-[10px] font-medium" style={{ color: '#10B981' }}>{reasons[0]}</p>
                  )}
                  {!compact && warnings.length > 0 && <ConflictList warnings={warnings} compact />}
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

          {selectedRank && selectedRank.warnings.length > 0 && !compact && (
            <div className="flex items-start gap-2 rounded-xl px-3 py-2 text-xs" style={{ background: 'rgba(245,158,11,0.08)', color: '#D97706' }}>
              <AlertTriangle className="h-3.5 w-3.5 shrink-0 mt-0.5" />
              Conflicten gedetecteerd — je kunt alsnog inplannen als manager.
            </div>
          )}
        </div>
      </div>

      <div
        className={cn('shrink-0', compact ? 'border-t px-3 py-2.5' : 'px-5 pb-5')}
        style={compact ? { borderColor: 'var(--border)' } : undefined}
      >
        <Button className="w-full" size={compact ? 'sm' : 'md'} loading={saving} onClick={handleSave}>
          {selectedUserId ? 'Inplannen' : 'Open dienst'}
        </Button>
      </div>
    </div>
  )
}
