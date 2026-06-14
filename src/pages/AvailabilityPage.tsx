import { useEffect, useMemo, useState } from 'react'
import { Check, X, CalendarCheck, Info } from 'lucide-react'
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
import { PageHeader } from '../components/ui/PageHeader'
import { DashboardSkeleton } from '../components/ui/Skeleton'
import { LoadError } from '../components/ui/LoadError'
import { MonthNavigator } from '../components/ui/MonthNavigator'
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
  const [loadError, setLoadError]       = useState(false)
  const [toggling, setToggling]         = useState<string | null>(null)
  const [expandedDate, setExpandedDate] = useState<string | null>(null)

  const { start, end } = getMonthRange(monthAnchor)
  const userId = profile!.id

  const load = async () => {
    setLoading(true)
    setLoadError(false)
    try {
      if (isAdmin) {
        const data = await getAllAvailabilityForPeriod(start, end)
        setAllEntries(data)
      } else {
        const data = await getAvailabilityForPeriod(userId, start, end)
        setEntries(data)
      }
    } catch {
      setLoadError(true)
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

  // Hooks must run unconditionally (Rules of Hooks) — computed once for both views.
  const weeks = useMemo(() => {
    const weekStarts = eachWeekOfInterval({ start, end }, { weekStartsOn: 1 })
    return weekStarts.map((ws) => eachDayOfInterval({ start: ws, end: endOfWeek(ws, { weekStartsOn: 1 }) }))
  }, [start, end])

  const countByDate = useMemo(() => {
    const map = new Map<string, (Availability & { users?: { full_name: string } })[]>()
    for (const e of allEntries) {
      const list = map.get(e.date) ?? []
      list.push(e)
      map.set(e.date, list)
    }
    return map
  }, [allEntries])

  // ── ADMIN VIEW ─────────────────────────────────────────────────────────────
  if (isAdmin) {
    return (
      <div className="mx-auto max-w-6xl space-y-6">
        <PageHeader
          title="Beschikbaarheid"
          subtitle="Overzicht wie beschikbaar is per dag"
          action={
            <MonthNavigator
              monthAnchor={monthAnchor}
              onPrev={() => setMonthAnchor(subMonths(monthAnchor, 1))}
              onNext={() => setMonthAnchor(addMonths(monthAnchor, 1))}
              onToday={() => setMonthAnchor(new Date())}
            />
          }
        />

        {loadError ? (
          <LoadError onRetry={load} />
        ) : loading ? (
          <DashboardSkeleton />
        ) : (
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
                                    <button
                                      type="button"
                                      onClick={() => setExpandedDate(expandedDate === dateStr ? null : dateStr)}
                                      className="inline-flex cursor-pointer items-center gap-1 rounded-md px-2 py-0.5 text-xs font-semibold transition-opacity hover:opacity-80"
                                      style={{ background: 'rgba(16,185,129,0.12)', color: '#10B981' }}
                                      aria-expanded={expandedDate === dateStr}
                                    >
                                      <Check className="h-3 w-3" />
                                      {people.length}
                                    </button>
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
            {expandedDate && (
              <div
                className="mt-4 rounded-xl p-3 text-sm"
                style={{ background: 'var(--surface-subtle)', border: '1px solid var(--border)' }}
              >
                <p className="mb-2 font-semibold" style={{ color: 'var(--text-primary)' }}>
                  Beschikbaar op {format(new Date(expandedDate + 'T12:00:00'), 'd MMMM', { locale: nl })}
                </p>
                <ul className="space-y-1">
                  {(countByDate.get(expandedDate) ?? []).map((p) => (
                    <li key={p.id} style={{ color: 'var(--text-secondary)' }}>
                      {p.users?.full_name ?? 'Medewerker'}
                    </li>
                  ))}
                </ul>
              </div>
            )}
            <p className="mt-4 flex items-center gap-1.5 text-xs" style={{ color: 'var(--text-disabled)' }}>
              <Info className="h-3.5 w-3.5 shrink-0" />
              Tik op een getal om namen te zien. Plan diensten via Rooster.
            </p>
          </Card>
        )}
      </div>
    )
  }

  // ── EMPLOYEE VIEW ───────────────────────────────────────────────────────────
  const availableCount = entries.length
  const daysInMonth = getMonthRange(monthAnchor).days.length
  const percentage = daysInMonth > 0 ? Math.round((availableCount / daysInMonth) * 100) : 0

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <PageHeader
        title="Beschikbaarheid"
        subtitle="Klik op een dag om aan te geven of je kunt werken"
        action={
          <MonthNavigator
            monthAnchor={monthAnchor}
            onPrev={() => setMonthAnchor(subMonths(monthAnchor, 1))}
            onNext={() => setMonthAnchor(addMonths(monthAnchor, 1))}
            onToday={() => setMonthAnchor(new Date())}
          />
        }
      />

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

      {loadError ? (
        <LoadError onRetry={load} />
      ) : loading ? (
        <DashboardSkeleton />
      ) : (
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
