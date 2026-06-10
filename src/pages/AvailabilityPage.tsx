import { useEffect, useState } from 'react'
import { Check } from 'lucide-react'
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
import { MonthNavigator } from '../components/ui/MonthNavigator'
import { LoadingSpinner } from '../components/ui/LoadingSpinner'
import { MonthCalendar, formatDayHeader } from '../components/calendar/MonthCalendar'
import {
  getMonthRange,
  addMonths,
  subMonths,
  isSameMonth,
  cn,
} from '../lib/utils'

export function AvailabilityPage() {
  const { profile, isAdmin } = useAuth()
  const { organization } = useOrganization()
  const [monthAnchor, setMonthAnchor] = useState(new Date())
  const [entries, setEntries] = useState<Availability[]>([])
  const [allEntries, setAllEntries] = useState<
    (Availability & { users?: { full_name: string } })[]
  >([])
  const [loading, setLoading] = useState(true)
  const [toggling, setToggling] = useState<string | null>(null)
  const [selectedDate, setSelectedDate] = useState<string | null>(null)

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
  }, [monthAnchor, profile, isAdmin])

  const isAvailable = (date: string) => entries.some((e) => e.date === date)

  const toggleDay = async (date: string) => {
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

  const nav = (
    <MonthNavigator
      monthAnchor={monthAnchor}
      onPrev={() => setMonthAnchor(subMonths(monthAnchor, 1))}
      onNext={() => setMonthAnchor(addMonths(monthAnchor, 1))}
      onToday={() => setMonthAnchor(new Date())}
    />
  )

  if (isAdmin) {
    const dayView = selectedDate
      ? allEntries.filter((e) => e.date === selectedDate)
      : []

    return (
      <div className="space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-navy-900">Beschikbaarheid</h1>
            <p className="text-sm text-gray-500">
              Per dag zien wie zich beschikbaar heeft gemeld (zonder tijden)
            </p>
          </div>
          {nav}
        </div>
        {loading ? (
          <LoadingSpinner />
        ) : (
          <Card>
            <CardHeader
              title="Maandkalender"
              subtitle="Klik een dag om te zien wie beschikbaar is"
            />
            <MonthCalendar
              monthAnchor={monthAnchor}
              selectedDate={selectedDate}
              onSelectDate={(d) => {
                if (isSameMonth(new Date(d + 'T12:00:00'), monthAnchor)) setSelectedDate(d)
              }}
              hasMarker={(d) => allEntries.some((e) => e.date === d)}
              renderDay={(dateStr, inMonth) => {
                if (!inMonth) return null
                const count = allEntries.filter((e) => e.date === dateStr).length
                if (count === 0) return null
                return (
                  <span className="text-[10px] font-medium text-emerald-700 sm:text-xs">
                    {count} pers.
                  </span>
                )
              }}
            />
            {selectedDate && (
              <div className="mt-6 border-t border-gray-200 pt-4">
                <h3 className="mb-3 font-semibold text-navy-900">
                  {formatDayHeader(selectedDate)}
                </h3>
                {dayView.length === 0 ? (
                  <p className="text-sm text-gray-500">Niemand beschikbaar op deze dag.</p>
                ) : (
                  <ul className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                    {dayView.map((e) => (
                      <li
                        key={e.id}
                        className="flex items-center gap-2 rounded-lg bg-emerald-50 px-3 py-2 text-sm font-medium text-emerald-900"
                      >
                        <Check className="h-4 w-4 shrink-0" />
                        {e.users?.full_name ?? 'Medewerker'}
                      </li>
                    ))}
                  </ul>
                )}
                <p className="mt-3 text-xs text-gray-400">
                  Tijden stel je in onder Rooster → kies dezelfde dag.
                </p>
              </div>
            )}
          </Card>
        )}
      </div>
    )
  }

  const availableCount = entries.length
  const daysInMonth = getMonthRange(monthAnchor).days.length

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-navy-900">Beschikbaarheid</h1>
          <p className="text-sm text-gray-500">
            Geef per dag aan of je kunt werken — je manager plant de tijden in
          </p>
        </div>
        {nav}
      </div>

      {loading ? (
        <LoadingSpinner />
      ) : (
        <Card>
          <CardHeader
            title="Maandkalender"
            subtitle={`${availableCount} van ${daysInMonth} dagen gemarkeerd als beschikbaar. Klik om aan/uit te zetten.`}
          />
          <MonthCalendar
            monthAnchor={monthAnchor}
            selectedDate={selectedDate}
            onSelectDate={(d) => {
              if (!isSameMonth(new Date(d + 'T12:00:00'), monthAnchor)) return
              setSelectedDate(d)
              toggleDay(d)
            }}
            hasMarker={(d) => isAvailable(d)}
            renderDay={(dateStr, inMonth) => {
              if (!inMonth || !isAvailable(dateStr)) return null
              return (
                <span
                  className={cn(
                    'text-[10px] font-medium sm:text-xs',
                    toggling === dateStr ? 'text-gray-400' : 'text-emerald-700'
                  )}
                >
                  {toggling === dateStr ? '...' : 'Beschikbaar'}
                </span>
              )
            }}
          />
          <p className="mt-4 text-xs text-gray-500">
            Je hoeft geen start- of eindtijd in te vullen. De manager bepaalt wanneer je dienst
            begint op basis van het rooster.
          </p>
        </Card>
      )}
    </div>
  )
}
