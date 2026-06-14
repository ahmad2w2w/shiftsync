import { useCallback, useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { format, isSameMonth } from 'date-fns'
import { Sparkles, CalendarDays, ChevronRight } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { useToast } from '../context/ToastContext'
import { getShiftsForPeriod } from '../services/shifts'
import { getAllAvailabilityForPeriod } from '../services/availability'
import { DayScheduleEditor } from '../components/schedule/DayScheduleEditor'
import { ScheduleShiftCard } from '../components/schedule/ScheduleShiftCard'
import { MonthCalendar, formatDayHeader } from '../components/calendar/MonthCalendar'
import type { Availability, Shift } from '../types/database'
import { MonthNavigator } from '../components/ui/MonthNavigator'
import { LoadingSpinner } from '../components/ui/LoadingSpinner'
import { getMonthRange, addMonths, subMonths, monthLabel, formatDate, cn } from '../lib/utils'

function todayStr() {
  return format(new Date(), 'yyyy-MM-dd')
}

export function SchedulePage() {
  const { profile, isAdmin } = useAuth()
  const toast = useToast()
  const [monthAnchor, setMonthAnchor] = useState(new Date())
  const [selectedDate, setSelectedDate] = useState<string | null>(todayStr())
  const [shifts, setShifts] = useState<Shift[]>([])
  const [availability, setAvailability] = useState<
    (Availability & { users?: { full_name: string } })[]
  >([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)

  const { start, end } = useMemo(() => getMonthRange(monthAnchor), [monthAnchor])

  const fetchData = useCallback(async () => {
    if (!profile) return
    const data = await getShiftsForPeriod(start, end, {
      userId: isAdmin ? undefined : profile.id,
      publishedOnly: !isAdmin,
    })
    setShifts(data.filter((s) => isAdmin || s.user_id))
    if (isAdmin) {
      const avail = await getAllAvailabilityForPeriod(start, end)
      setAvailability(avail)
    }
  }, [profile, isAdmin, start, end])

  useEffect(() => {
    if (!profile) return
    let cancelled = false
    setLoading(true)
    fetchData()
      .catch(() => { if (!cancelled) toast.error('Rooster laden mislukt. Probeer opnieuw.') })
      .finally(() => { if (!cancelled) setLoading(false) })
    return () => { cancelled = true }
  }, [profile, fetchData])

  useEffect(() => {
    if (!selectedDate) return
    const d = new Date(selectedDate + 'T12:00:00')
    if (!isSameMonth(d, monthAnchor)) {
      setSelectedDate(format(start, 'yyyy-MM-dd'))
    }
  }, [monthAnchor, selectedDate, start])

  const reload = useCallback(async () => {
    setRefreshing(true)
    try { await fetchData() } finally { setRefreshing(false) }
  }, [fetchData])

  const shiftsByDate = useMemo(() => {
    const map = new Map<string, Shift[]>()
    for (const s of shifts) {
      const list = map.get(s.date) ?? []
      list.push(s)
      map.set(s.date, list)
    }
    return map
  }, [shifts])

  const dayShifts = selectedDate ? (shiftsByDate.get(selectedDate) ?? []) : []
  const assignedShifts = dayShifts.filter((s) => s.user_id)
  const monthShiftCount = shifts.filter((s) => s.user_id).length
  const daysWithShifts = shiftsByDate.size

  const availCountByDate = useMemo(() => {
    const map = new Map<string, number>()
    for (const a of availability) map.set(a.date, (map.get(a.date) ?? 0) + 1)
    return map
  }, [availability])

  if (loading) return <LoadingSpinner className="min-h-[50vh]" />

  return (
    <div className="space-y-5">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-xl font-bold text-zinc-100">Rooster</h1>
          <p className="mt-1 text-sm text-zinc-500">
            {isAdmin ? 'Plan diensten per dag op basis van beschikbaarheid' : 'Je gepubliceerde diensten'}
          </p>
        </div>
        <MonthNavigator
          monthAnchor={monthAnchor}
          onPrev={() => setMonthAnchor(subMonths(monthAnchor, 1))}
          onNext={() => setMonthAnchor(addMonths(monthAnchor, 1))}
          onToday={() => { setMonthAnchor(new Date()); setSelectedDate(todayStr()) }}
        />
      </header>

      {/* Maandplanner banner */}
      {isAdmin && (
        <Link
          to="/app/maandplanner"
          className="group flex items-center justify-between gap-4 rounded-2xl px-4 py-3 transition-all hover:-translate-y-0.5"
          style={{ background: 'rgba(37,99,235,0.08)', border: '1px solid rgba(37,99,235,0.2)' }}
        >
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-600">
              <Sparkles className="h-5 w-5 text-white" />
            </div>
            <div>
              <p className="font-semibold text-zinc-100">Maandplanner</p>
              <p className="text-sm text-zinc-500">Volledige maand via templates en drag &amp; drop</p>
            </div>
          </div>
          <ChevronRight className="h-5 w-5 text-zinc-600 transition-transform group-hover:translate-x-0.5" />
        </Link>
      )}

      {/* Stats */}
      <div className="flex flex-wrap gap-3 text-sm">
        {[
          { label: 'Deze maand', value: monthLabel(monthAnchor), capitalize: true },
          { label: 'Diensten', value: String(monthShiftCount) },
          ...(isAdmin ? [{ label: 'Dagen ingepland', value: String(daysWithShifts) }] : []),
        ].map(({ label, value, capitalize }) => (
          <div
            key={label}
            className="rounded-xl px-4 py-2"
            style={{ background: 'var(--surface-card)', border: '1px solid var(--border)' }}
          >
            <p className="text-xs text-zinc-500">{label}</p>
            <p className={cn('font-semibold text-zinc-100', capitalize && 'capitalize')}>{value}</p>
          </div>
        ))}
      </div>

      {/* Kalender */}
      <div
        className="rounded-2xl p-4 sm:p-6"
        style={{ background: 'var(--surface-card)', border: '1px solid var(--border)' }}
      >
        <MonthCalendar
          size="large"
          monthAnchor={monthAnchor}
          selectedDate={selectedDate}
          onSelectDate={(d) => {
            if (isSameMonth(new Date(d + 'T12:00:00'), monthAnchor)) setSelectedDate(d)
          }}
          hasMarker={(d) => {
            if (isAdmin) return (shiftsByDate.get(d)?.length ?? 0) > 0 || (availCountByDate.get(d) ?? 0) > 0
            return (shiftsByDate.get(d)?.length ?? 0) > 0
          }}
          renderDay={(dateStr, inMonth) => {
            if (!inMonth) return null
            const planned = shiftsByDate.get(dateStr)?.filter((s) => s.user_id).length ?? 0
            const avail = availCountByDate.get(dateStr) ?? 0
            if (planned === 0 && avail === 0) return null
            return (
              <span className="mt-auto text-[10px] leading-tight sm:text-xs">
                {planned > 0 && (
                  <span className="font-medium text-brand-400">{planned} dienst{planned !== 1 ? 'en' : ''}</span>
                )}
                {isAdmin && avail > 0 && planned === 0 && (
                  <span className="text-emerald-500">{avail} beschikbaar</span>
                )}
              </span>
            )
          }}
        />
      </div>

      {/* Dag detail */}
      <div
        className={cn(
          'rounded-2xl p-4 sm:p-5 transition-opacity',
          refreshing && 'opacity-50'
        )}
        style={{ background: 'var(--surface-card)', border: '1px solid var(--border)' }}
      >
        {!selectedDate ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <CalendarDays className="mb-3 h-10 w-10 text-zinc-700" />
            <p className="font-medium text-zinc-300">Kies een dag</p>
            <p className="mt-1 text-sm text-zinc-600">Selecteer een datum in de kalender</p>
          </div>
        ) : isAdmin ? (
          <DayScheduleEditor
            date={selectedDate}
            availability={availability}
            shifts={shifts}
            onSaved={reload}
          />
        ) : (
          <div className="space-y-4">
            <div>
              <h2 className="text-base font-semibold capitalize text-zinc-100">
                {formatDayHeader(selectedDate)}
              </h2>
              <p className="text-sm text-zinc-500">
                {assignedShifts.length === 0
                  ? 'Geen diensten op deze dag'
                  : `${assignedShifts.length} dienst${assignedShifts.length !== 1 ? 'en' : ''}`}
              </p>
            </div>
            {assignedShifts.length === 0 ? (
              <div
                className="rounded-xl px-6 py-12 text-center"
                style={{ border: '1px dashed var(--border-strong)', background: 'var(--surface-subtle)' }}
              >
                <p className="text-sm" style={{ color: 'var(--text-muted)' }}>Je hebt op deze dag geen gepubliceerde diensten.</p>
              </div>
            ) : (
              <ul className="space-y-3">
                {assignedShifts
                  .sort((a, b) => a.start_time.localeCompare(b.start_time))
                  .map((s) => (
                    <li key={s.id}>
                      <ScheduleShiftCard shift={s} />
                    </li>
                  ))}
              </ul>
            )}
          </div>
        )}
      </div>

      {/* Maandoverzicht (medewerker) */}
      {!isAdmin && monthShiftCount > 0 && (
        <div
          className="rounded-2xl p-4 sm:p-5"
          style={{ background: 'var(--surface-card)', border: '1px solid var(--border)' }}
        >
          <h2 className="mb-4 text-xs font-semibold uppercase tracking-widest text-zinc-600">
            Alle diensten in {monthLabel(monthAnchor)}
          </h2>
          <ul className="divide-y divide-white/6">
            {[...shifts]
              .filter((s) => s.user_id)
              .sort((a, b) => a.date.localeCompare(b.date) || a.start_time.localeCompare(b.start_time))
              .map((s) => (
                <li key={s.id}>
                  <button
                    type="button"
                    onClick={() => setSelectedDate(s.date)}
                    className={cn(
                      'flex w-full items-center justify-between gap-4 py-3 text-left transition-colors hover:bg-white/4 rounded-xl px-2 -mx-2',
                      selectedDate === s.date && 'bg-brand-500/8'
                    )}
                  >
                    <div>
                      <p className="font-medium capitalize text-zinc-200">
                        {formatDate(s.date, 'EEE d MMM')}
                      </p>
                      <p className="text-sm text-zinc-500">
                        {s.position} · {s.start_time.slice(0, 5)}–{s.end_time.slice(0, 5)}
                      </p>
                    </div>
                    <ChevronRight className="h-4 w-4 shrink-0 text-zinc-700" />
                  </button>
                </li>
              ))}
          </ul>
        </div>
      )}
    </div>
  )
}
