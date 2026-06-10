import { useCallback, useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { format, isSameMonth } from 'date-fns'
import { Sparkles, CalendarDays, ChevronRight } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { getShiftsForPeriod } from '../services/shifts'
import { getAllAvailabilityForPeriod } from '../services/availability'
import { DayScheduleEditor } from '../components/schedule/DayScheduleEditor'
import { ScheduleShiftCard } from '../components/schedule/ScheduleShiftCard'
import { MonthCalendar, formatDayHeader } from '../components/calendar/MonthCalendar'
import type { Availability } from '../types/database'
import type { Shift } from '../types/database'
import { MonthNavigator } from '../components/ui/MonthNavigator'
import { LoadingSpinner } from '../components/ui/LoadingSpinner'
import {
  getMonthRange,
  addMonths,
  subMonths,
  monthLabel,
  formatDate,
  cn,
} from '../lib/utils'

function todayStr() {
  return format(new Date(), 'yyyy-MM-dd')
}

export function SchedulePage() {
  const { profile, isAdmin } = useAuth()
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
      .catch(() => {})
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
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
    try {
      await fetchData()
    } finally {
      setRefreshing(false)
    }
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
    for (const a of availability) {
      map.set(a.date, (map.get(a.date) ?? 0) + 1)
    }
    return map
  }, [availability])

  if (loading) {
    return <LoadingSpinner className="min-h-[50vh]" />
  }

  return (
    <div className="space-y-6">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-navy-900">Rooster</h1>
          <p className="mt-1 text-sm text-gray-500">
            {isAdmin
              ? 'Plan diensten per dag op basis van beschikbaarheid'
              : 'Je gepubliceerde diensten'}
          </p>
        </div>
        <MonthNavigator
          monthAnchor={monthAnchor}
          onPrev={() => setMonthAnchor(subMonths(monthAnchor, 1))}
          onNext={() => setMonthAnchor(addMonths(monthAnchor, 1))}
          onToday={() => {
            setMonthAnchor(new Date())
            setSelectedDate(todayStr())
          }}
        />
      </header>

      {isAdmin && (
        <Link
          to="/rooster-planner"
          className="group flex items-center justify-between gap-4 rounded-xl border border-navy-100 bg-navy-50/60 px-4 py-3 transition-colors hover:border-navy-200 hover:bg-navy-50"
        >
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-navy-900 text-white">
              <Sparkles className="h-5 w-5" />
            </div>
            <div>
              <p className="font-medium text-navy-900">Maandplanner</p>
              <p className="text-sm text-gray-500">
                Volledige maand via templates en drag &amp; drop
              </p>
            </div>
          </div>
          <ChevronRight className="h-5 w-5 text-gray-400 transition-transform group-hover:translate-x-0.5" />
        </Link>
      )}

      <div className="flex flex-wrap gap-3 text-sm">
        <div className="rounded-lg bg-white px-4 py-2 shadow-sm ring-1 ring-gray-100">
          <span className="text-gray-500">Deze maand</span>
          <p className="font-semibold text-navy-900 capitalize">{monthLabel(monthAnchor)}</p>
        </div>
        <div className="rounded-lg bg-white px-4 py-2 shadow-sm ring-1 ring-gray-100">
          <span className="text-gray-500">Diensten</span>
          <p className="font-semibold text-navy-900">{monthShiftCount}</p>
        </div>
        {isAdmin && (
          <div className="rounded-lg bg-white px-4 py-2 shadow-sm ring-1 ring-gray-100">
            <span className="text-gray-500">Dagen ingepland</span>
            <p className="font-semibold text-navy-900">{daysWithShifts}</p>
          </div>
        )}
      </div>

      <section className="rounded-xl bg-white p-4 shadow-sm ring-1 ring-gray-100 sm:p-6">
        <MonthCalendar
          size="large"
          monthAnchor={monthAnchor}
          selectedDate={selectedDate}
          onSelectDate={(d) => {
            if (isSameMonth(new Date(d + 'T12:00:00'), monthAnchor)) setSelectedDate(d)
          }}
            hasMarker={(d) => {
              if (isAdmin) {
                return (shiftsByDate.get(d)?.length ?? 0) > 0 || (availCountByDate.get(d) ?? 0) > 0
              }
              return (shiftsByDate.get(d)?.length ?? 0) > 0
            }}
            renderDay={(dateStr, inMonth) => {
              if (!inMonth) return null
              const planned = shiftsByDate.get(dateStr)?.filter((s) => s.user_id).length ?? 0
              const avail = availCountByDate.get(dateStr) ?? 0
              if (planned === 0 && avail === 0) return null
              return (
                <span className="mt-auto text-[10px] leading-tight text-gray-500 sm:text-xs">
                  {planned > 0 && (
                    <span className="font-medium text-navy-700">{planned} dienst{planned !== 1 ? 'en' : ''}</span>
                  )}
                  {isAdmin && avail > 0 && planned === 0 && (
                    <span className="text-emerald-600">{avail} beschikbaar</span>
                  )}
                </span>
              )
            }}
          />
        </section>

        <section
          className={cn(
            'rounded-xl bg-white p-4 shadow-sm ring-1 ring-gray-100 sm:p-5',
            refreshing && 'opacity-60'
          )}
        >
          {!selectedDate ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <CalendarDays className="mb-3 h-10 w-10 text-gray-300" />
              <p className="font-medium text-navy-900">Kies een dag</p>
              <p className="mt-1 text-sm text-gray-500">Selecteer een datum in de kalender</p>
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
                <h2 className="text-lg font-semibold text-navy-900 capitalize">
                  {formatDayHeader(selectedDate)}
                </h2>
                <p className="text-sm text-gray-500">
                  {assignedShifts.length === 0
                    ? 'Geen diensten op deze dag'
                    : `${assignedShifts.length} dienst${assignedShifts.length !== 1 ? 'en' : ''}`}
                </p>
              </div>
              {assignedShifts.length === 0 ? (
                <div className="rounded-xl border border-dashed border-gray-200 bg-gray-50/80 px-6 py-12 text-center">
                  <p className="text-sm text-gray-500">
                    Je hebt op deze dag geen gepubliceerde diensten.
                  </p>
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
      </section>

      {!isAdmin && monthShiftCount > 0 && (
        <section className="rounded-xl bg-white p-4 shadow-sm ring-1 ring-gray-100 sm:p-5">
          <h2 className="mb-4 text-sm font-semibold uppercase tracking-wide text-gray-400">
            Alle diensten in {monthLabel(monthAnchor)}
          </h2>
          <ul className="divide-y divide-gray-100">
            {[...shifts]
              .filter((s) => s.user_id)
              .sort((a, b) => a.date.localeCompare(b.date) || a.start_time.localeCompare(b.start_time))
              .map((s) => (
                <li key={s.id}>
                  <button
                    type="button"
                    onClick={() => setSelectedDate(s.date)}
                    className={cn(
                      'flex w-full items-center justify-between gap-4 py-3 text-left transition-colors hover:bg-gray-50',
                      selectedDate === s.date && 'bg-navy-50/50'
                    )}
                  >
                    <div>
                      <p className="font-medium capitalize text-navy-900">
                        {formatDate(s.date, 'EEE d MMM')}
                      </p>
                      <p className="text-sm text-gray-500">
                        {s.position} · {s.start_time.slice(0, 5)}–{s.end_time.slice(0, 5)}
                      </p>
                    </div>
                    <ChevronRight className="h-4 w-4 shrink-0 text-gray-300" />
                  </button>
                </li>
              ))}
          </ul>
        </section>
      )}
    </div>
  )
}
