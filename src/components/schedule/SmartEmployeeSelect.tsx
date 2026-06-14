import { useMemo } from 'react'
import { Check, ChevronDown } from 'lucide-react'
import type { User, Availability, LeaveRequest, Shift } from '../../types/database'
import { getWarnings, monthlyHoursForUser, rankEmployeesForSlot } from '../../lib/plannerEngine'
import { ConflictList } from './ConflictBadge'
import { cn } from '../../lib/utils'

interface SmartEmployeeSelectProps {
  employees: User[]
  availability: Availability[]
  leave: LeaveRequest[]
  shifts: Shift[]
  date: string
  startTime: string
  endTime: string
  position: string
  maxHours: number
  value: string | null
  onChange: (userId: string | null) => void
  allowOpen?: boolean
  excludeShiftId?: string
}

export function SmartEmployeeSelect({
  employees,
  availability,
  leave,
  shifts,
  date,
  startTime,
  endTime,
  position,
  maxHours,
  value,
  onChange,
  allowOpen = true,
  excludeShiftId,
}: SmartEmployeeSelectProps) {
  const slot = useMemo(
    () => ({ id: excludeShiftId ?? 'new', date, start_time: startTime, end_time: endTime, position }),
    [date, startTime, endTime, position, excludeShiftId]
  )

  const ranked = useMemo(
    () => rankEmployeesForSlot(slot, employees, availability, leave, shifts, maxHours),
    [slot, employees, availability, leave, shifts, maxHours]
  )

  const rankedIds = useMemo(() => new Set(ranked.map((r) => r.user.id)), [ranked])

  const others = employees.filter((e) => !rankedIds.has(e.id))

  const selectedWarnings = value
    ? getWarnings(value, slot, availability, leave, shifts, maxHours)
    : []

  return (
    <div className="space-y-3">
      <label className="block text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>
        Medewerker
      </label>

      {allowOpen && (
        <button
          type="button"
          onClick={() => onChange(null)}
          className={cn(
            'flex w-full items-center justify-between rounded-xl px-4 py-3 text-sm font-medium transition-all',
            value === null && 'ring-2 ring-brand-500'
          )}
          style={{
            background: value === null ? 'rgba(245,158,11,0.08)' : 'var(--surface-subtle)',
            border: '1px solid var(--border)',
            color: 'var(--text-primary)',
          }}
        >
          Open dienst (nog niet toegewezen)
          {value === null && <Check className="h-4 w-4 text-brand-600" />}
        </button>
      )}

      <div className="max-h-64 space-y-1.5 overflow-y-auto rounded-xl p-2" style={{ border: '1px solid var(--border)', background: 'var(--surface-subtle)' }}>
        {ranked.length > 0 && (
          <p className="px-2 py-1 text-[10px] font-semibold uppercase tracking-wider" style={{ color: '#10B981' }}>
            Aanbevolen · beschikbaar
          </p>
        )}
        {ranked.map(({ user, warnings, reasons }) => {
          const hours = monthlyHoursForUser(user.id, shifts)
          const selected = value === user.id
          return (
            <button
              key={user.id}
              type="button"
              onClick={() => onChange(user.id)}
              className={cn(
                'flex w-full flex-col gap-1 rounded-xl px-3 py-2.5 text-left transition-all hover:shadow-sm',
                selected && 'ring-2 ring-brand-500'
              )}
              style={{
                background: selected ? 'rgba(59,130,246,0.08)' : 'var(--surface-card)',
                border: '1px solid var(--border)',
              }}
            >
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2 min-w-0">
                  <span
                    className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-bold"
                    style={{ background: 'var(--brand-muted)', color: 'var(--brand-strong)' }}
                  >
                    {user.full_name[0]?.toUpperCase()}
                  </span>
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>{user.full_name}</p>
                    <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
                      {user.primary_position ?? 'Medewerker'} · {hours.toFixed(0)}u deze maand
                    </p>
                  </div>
                </div>
                {selected && <Check className="h-4 w-4 shrink-0 text-brand-600" />}
              </div>
              {reasons.length > 0 && !warnings.length && (
                <p className="text-[10px]" style={{ color: '#10B981' }}>{reasons[0]}</p>
              )}
              {warnings.length > 0 && <ConflictList warnings={warnings} compact />}
            </button>
          )
        })}

        {others.length > 0 && (
          <>
            <p className="mt-2 px-2 py-1 text-[10px] font-semibold uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>
              Overige medewerkers
            </p>
            {others.map((user) => {
              const warnings = getWarnings(user.id, slot, availability, leave, shifts, maxHours)
              const selected = value === user.id
              const unavailable = warnings.some((w) => w.type === 'unavailable')
              return (
                <button
                  key={user.id}
                  type="button"
                  onClick={() => onChange(user.id)}
                  disabled={false}
                  className={cn(
                    'flex w-full flex-col gap-1 rounded-xl px-3 py-2.5 text-left transition-all',
                    selected && 'ring-2 ring-brand-500',
                    unavailable && !selected && 'opacity-60'
                  )}
                  style={{ background: 'var(--surface-card)', border: '1px solid var(--border)' }}
                >
                  <div className="flex items-center gap-2">
                    <span className="flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold" style={{ background: 'var(--surface-subtle)', color: 'var(--text-muted)' }}>
                      {user.full_name[0]?.toUpperCase()}
                    </span>
                    <p className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>{user.full_name}</p>
                  </div>
                  {warnings.length > 0 && <ConflictList warnings={warnings} compact />}
                </button>
              )
            })}
          </>
        )}
      </div>

      {selectedWarnings.length > 0 && value && (
        <div className="rounded-xl p-3" style={{ background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.25)' }}>
          <p className="mb-2 text-xs font-semibold" style={{ color: '#D97706' }}>Let op — conflicten gedetecteerd</p>
          <ConflictList warnings={selectedWarnings} />
          <p className="mt-2 text-[10px]" style={{ color: 'var(--text-muted)' }}>Je kunt alsnog opslaan als manager.</p>
        </div>
      )}

      <div className="pointer-events-none flex items-center gap-1 text-xs" style={{ color: 'var(--text-disabled)' }}>
        <ChevronDown className="h-3 w-3" /> Scroll voor meer medewerkers
      </div>
    </div>
  )
}
