import { useEffect, useMemo, useState } from 'react'
import { Check, X, CalendarCheck, ChevronLeft, ChevronRight, Info } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { useOrganization } from '../context/OrganizationContext'
import {
  getAvailabilityForPeriod,
  getAllAvailabilityForPeriod,
  setDayAvailable,
  removeDayAvailable,
} from '../services/availability'
import type { Availability } from '../types/database'
import { Card, CardHeader } from '../components/ui/Card'
import { LoadingSpinner } from '../components/ui/LoadingSpinner'
import { getMonthRange, addMonths, subMonths, isSameMonth } from '../lib/utils'
import { format, eachWeekOfInterval, endOfWeek, eachDayOfInterval, isToday, isBefore, startOfDay } from 'date-fns'
import { nl } from 'date-fns/locale'

const DAY_NAMES = ['Ma', 'Di', 'Wo', 'Do', 'Vr', 'Za', 'Zo']
const DAY_FULL  = ['Maandag', 'Dinsdag', 'Woensdag', 'Donderdag', 'Vrijdag', 'Zaterdag', 'Zondag']

function toDateStr(d: Date) {
  return format(d, 'yyyy-MM-dd')
}

export function AvailabilityPage() {
  const { profile, isAdmin } = useAuth()
  const { organization } = useOrganization()
  const [monthAnchor, setMonthAnchor]   = useState(new Date())
  const [entries, setEntries]           = useState<Availability[]>([])
  const [allEntries, setAllEntries]     = useState<(Availability & { users?: { full_name: string } })[]>([])
  const [loading, setLoading]           = useState(true)
  const [toggling, setToggling]         = useState<string | null>(null)

  const { start, end } = getMonthRange(monthAnchor)
  const userId = profile!.id

  const load = async () => {
    setLoading(true)
    try {
      if (isAdmin) {
        const data = await getAllAvailabilityForPeriod(start, end)
        setAllEntries(data)
      } else {
        const data = await getAvailabilityForPeriod(userId, start, end)
        setEntries(data)
      }
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (profile) load()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [monthAnchor, profile, isAdmin])

  const isAvailable = (date: string) => entries.some((e) => e.date === date)

  const toggleDay = async (date: string) => {
    const d = new Date(date + 'T12:00:00')
    if (isBefore(d, startOfDay(new Date()))) return // geen verleden
    setToggling(date)
    try {
      if (isAvailable(date)) {
        await removeDayAvailable(userId, date)
      } else {
        await setDayAvailable(userId, date, organization!.id)
      }
      await load()
    } finally {
      setToggling(null)
    }
  }

  // ── ADMIN VIEW ─────────────────────────────────────────────────────────────
  if (isAdmin) {
    const countByDate = useMemo(() => {
      const map = new Map<string, (Availability & { users?: { full_name: string } })[]>()
      for (const e of allEntries) {
        const list = map.get(e.date) ?? []
        list.push(e)
        map.set(e.date, list)
      }
      return map
    }, [allEntries])

    const weeks = useMemo(() => {
      const weekStarts = eachWeekOfInterval({ start, end }, { weekStartsOn: 1 })
      return weekStarts.map((ws) => eachDayOfInterval({ start: ws, end: endOfWeek(ws, { weekStartsOn: 1 }) }))
    }, [start, end])

    return (
      <div className="space-y-5">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-xl font-bold" style={{ color: 'var(--text-primary)' }}>Beschikbaarheid</h1>
            <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
              Overzicht wie beschikbaar is per dag
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setMonthAnchor(subMonths(monthAnchor, 1))}
              className="flex h-8 w-8 items-center justify-center rounded-lg transition-colors hover:opacity-80"
              style={{ background: 'var(--surface-card)', border: '1px solid var(--border)', color: 'var(--text-muted)' }}
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <span className="min-w-[110px] text-center text-sm font-semibold capitalize" style={{ color: 'var(--text-primary)' }}>
              {format(monthAnchor, 'MMMM yyyy', { locale: nl })}
            </span>
            <button
              onClick={() => setMonthAnchor(addMonths(monthAnchor, 1))}
              className="flex h-8 w-8 items-center justify-center rounded-lg transition-colors hover:opacity-80"
              style={{ background: 'var(--surface-card)', border: '1px solid var(--border)', color: 'var(--text-muted)' }}
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>

        {loading ? <LoadingSpinner /> : (
          <Card>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[600px] text-sm">
                <thead>
                  <tr style={{ borderBottom: '1px solid var(--border)' }}>
                    <th className="pb-3 pr-4 text-left text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>
                      Week
                    </th>
                    {DAY_NAMES.map((d) => (
                      <th key={d} className="pb-3 text-center text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>
                        {d}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y" style={{ borderColor: 'var(--border)' }}>
                  {weeks.map((week) => {
                    const inMonth = week.some((d) => isSameMonth(d, monthAnchor))
                    if (!inMonth) return null
                    const weekNum = format(week[0], 'w')
                    return (
                      <tr key={weekNum}>
                        <td className="py-3 pr-4 text-xs font-medium" style={{ color: 'var(--text-disabled)' }}>
                          Wk {weekNum}
                        </td>
                        {week.map((day) => {
                          const dateStr = toDateStr(day)
                          const inM = isSameMonth(day, monthAnchor)
                          const people = countByDate.get(dateStr) ?? []
                          return (
                            <td key={dateStr} className="px-1 py-2 text-center align-top">
                              {inM ? (
                                <div className="flex flex-col items-center gap-1">
                                  <span
                                    className="text-xs font-medium"
                                    style={{ color: isToday(day) ? 'var(--brand)' : 'var(--text-secondary)' }}
                                  >
                                    {format(day, 'd')}
                                  </span>
                                  {people.length > 0 ? (
                                    <div
                                      className="group relative inline-flex cursor-default items-center gap-1 rounded-md px-2 py-0.5 text-xs font-semibold"
                                      style={{ background: 'rgba(16,185,129,0.12)', color: '#10B981' }}
                                    >
                                      <Check className="h-3 w-3" />
                                      {people.length}
                                      {/* Tooltip */}
                                      <div
                                        className="pointer-events-none absolute bottom-full left-1/2 z-10 mb-1.5 hidden w-max max-w-[160px] -translate-x-1/2 rounded-lg p-2 text-left text-xs group-hover:block"
                                        style={{ background: 'var(--surface-card)', border: '1px solid var(--border)', color: 'var(--text-primary)', boxShadow: 'var(--shadow-card)' }}
                                      >
                                        {people.map((p) => (
                                          <p key={p.id}>{p.users?.full_name ?? 'Medewerker'}</p>
                                        ))}
                                      </div>
                                    </div>
                                  ) : (
                                    <span className="text-[10px]" style={{ color: 'var(--text-disabled)' }}>—</span>
                                  )}
                                </div>
                              ) : null}
                            </td>
                          )
                        })}
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
            <p className="mt-4 flex items-center gap-1.5 text-xs" style={{ color: 'var(--text-disabled)' }}>
              <Info className="h-3.5 w-3.5 shrink-0" />
              Hover over een getal om de namen te zien. Plan diensten via Rooster.
            </p>
          </Card>
        )}
      </div>
    )
  }

  // ── EMPLOYEE VIEW ───────────────────────────────────────────────────────────
  const weeks = useMemo(() => {
    const weekStarts = eachWeekOfInterval({ start, end }, { weekStartsOn: 1 })
    return weekStarts.map((ws) => eachDayOfInterval({ start: ws, end: endOfWeek(ws, { weekStartsOn: 1 }) }))
  }, [start, end])

  const availableCount = entries.length
  const daysInMonth = getMonthRange(monthAnchor).days.length
  const percentage = daysInMonth > 0 ? Math.round((availableCount / daysInMonth) * 100) : 0

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold" style={{ color: 'var(--text-primary)' }}>Beschikbaarheid</h1>
          <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
            Klik op een dag om aan te geven of je kunt werken
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setMonthAnchor(subMonths(monthAnchor, 1))}
            className="flex h-8 w-8 items-center justify-center rounded-lg transition-colors hover:opacity-80"
            style={{ background: 'var(--surface-card)', border: '1px solid var(--border)', color: 'var(--text-muted)' }}
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <span className="min-w-[110px] text-center text-sm font-semibold capitalize" style={{ color: 'var(--text-primary)' }}>
            {format(monthAnchor, 'MMMM yyyy', { locale: nl })}
          </span>
          <button
            onClick={() => setMonthAnchor(addMonths(monthAnchor, 1))}
            className="flex h-8 w-8 items-center justify-center rounded-lg transition-colors hover:opacity-80"
            style={{ background: 'var(--surface-card)', border: '1px solid var(--border)', color: 'var(--text-muted)' }}
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Summary pill */}
      <div className="flex flex-wrap gap-3">
        <div className="flex items-center gap-2 rounded-xl px-4 py-2" style={{ background: 'var(--surface-card)', border: '1px solid var(--border)' }}>
          <CalendarCheck className="h-4 w-4" style={{ color: '#10B981' }} />
          <span className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>
            {availableCount} van {daysInMonth} dagen
          </span>
          <span className="text-sm" style={{ color: 'var(--text-muted)' }}>beschikbaar ({percentage}%)</span>
        </div>
      </div>

      {loading ? <LoadingSpinner /> : (
        <Card>
          <CardHeader
            title="Klik dagen aan of uit"
            subtitle="Groen = je bent beschikbaar. Grijs = niet beschikbaar of verleden."
          />

          <div className="space-y-2">
            {/* Day header row */}
            <div className="grid grid-cols-7 gap-1.5 px-1">
              {DAY_NAMES.map((d) => (
                <div key={d} className="text-center text-xs font-semibold uppercase tracking-wider py-1" style={{ color: 'var(--text-muted)' }}>
                  {d}
                </div>
              ))}
            </div>

            {/* Week rows */}
            {weeks.map((week) => {
              const inMonth = week.some((d) => isSameMonth(d, monthAnchor))
              if (!inMonth) return null
              return (
                <div key={toDateStr(week[0])} className="grid grid-cols-7 gap-1.5 px-1">
                  {week.map((day) => {
                    const dateStr  = toDateStr(day)
                    const inM      = isSameMonth(day, monthAnchor)
                    const avail    = isAvailable(dateStr)
                    const loading_ = toggling === dateStr
                    const past     = isBefore(new Date(dateStr + 'T12:00:00'), startOfDay(new Date()))
                    const today    = isToday(day)

                    if (!inM) return <div key={dateStr} />

                    return (
                      <button
                        key={dateStr}
                        type="button"
                        disabled={past || loading_}
                        onClick={() => toggleDay(dateStr)}
                        title={`${DAY_FULL[day.getDay() === 0 ? 6 : day.getDay() - 1]} ${format(day, 'd MMMM', { locale: nl })}`}
                        className="relative flex flex-col items-center justify-center rounded-xl py-2.5 text-center transition-all hover:scale-105 active:scale-95 disabled:cursor-not-allowed disabled:opacity-40"
                        style={{
                          background: avail
                            ? 'rgba(16,185,129,0.12)'
                            : past
                              ? 'transparent'
                              : 'var(--surface-hover)',
                          border: avail
                            ? '1.5px solid rgba(16,185,129,0.3)'
                            : today
                              ? '1.5px solid var(--brand)'
                              : '1.5px solid var(--border)',
                        }}
                      >
                        {/* Day number */}
                        <span
                          className="text-sm font-semibold leading-none"
                          style={{ color: avail ? '#10B981' : today ? 'var(--brand)' : 'var(--text-primary)' }}
                        >
                          {format(day, 'd')}
                        </span>

                        {/* Status icon */}
                        <span className="mt-1 flex h-4 w-4 items-center justify-center rounded-full">
                          {loading_ ? (
                            <span className="h-3 w-3 rounded-full border-2 border-current border-t-transparent animate-spin" style={{ color: '#10B981' }} />
                          ) : avail ? (
                            <Check className="h-3.5 w-3.5" style={{ color: '#10B981' }} />
                          ) : past ? null : (
                            <X className="h-3 w-3" style={{ color: 'var(--text-disabled)' }} />
                          )}
                        </span>
                      </button>
                    )
                  })}
                </div>
              )
            })}
          </div>

          <p className="mt-5 flex items-start gap-1.5 text-xs" style={{ color: 'var(--text-disabled)' }}>
            <Info className="mt-0.5 h-3.5 w-3.5 shrink-0" />
            Je geeft hier alleen aan of je in principe beschikbaar bent.
            Je manager plant de exacte tijden in via het Rooster.
          </p>
        </Card>
      )}
    </div>
  )
}
