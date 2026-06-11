import { useEffect, useMemo, useState } from 'react'
import { Check, CalendarCheck, ChevronLeft, ChevronRight, Info, Pencil, Trash2, Plus } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { useOrganization } from '../context/OrganizationContext'
import {
  getAvailabilityForPeriod,
  getAllAvailabilityForPeriod,
  setDayAvailable,
  updateAvailability,
  deleteAvailability,
} from '../services/availability'
import { getAllUsers } from '../services/users'
import type { Availability, User } from '../types/database'
import { Card, CardHeader } from '../components/ui/Card'
import { Button } from '../components/ui/Button'
import { Select } from '../components/ui/Select'
import { LoadingSpinner } from '../components/ui/LoadingSpinner'
import { AvailabilityEntryPanel, toTimeInput } from '../components/availability/AvailabilityEntryPanel'
import { getMonthRange, addMonths, subMonths, isSameMonth, formatDate } from '../lib/utils'
import { format, eachWeekOfInterval, endOfWeek, eachDayOfInterval, isToday, isBefore, startOfDay } from 'date-fns'
import { nl } from 'date-fns/locale'

const DAY_NAMES = ['Ma', 'Di', 'Wo', 'Do', 'Vr', 'Za', 'Zo']
const DAY_FULL  = ['Maandag', 'Dinsdag', 'Woensdag', 'Donderdag', 'Vrijdag', 'Zaterdag', 'Zondag']

function toDateStr(d: Date) {
  return format(d, 'yyyy-MM-dd')
}

function formatTimeRange(from: string | null, until: string | null) {
  if (!from && !until) return 'Hele dag'
  const f = from ? toTimeInput(from) : '—'
  const u = until ? toTimeInput(until) : '—'
  return `${f} – ${u}`
}

function MonthNav({
  monthAnchor,
  onPrev,
  onNext,
}: {
  monthAnchor: Date
  onPrev: () => void
  onNext: () => void
}) {
  return (
    <div className="flex items-center gap-2">
      <button
        type="button"
        onClick={onPrev}
        className="flex h-8 w-8 items-center justify-center rounded-lg transition-colors hover:opacity-80"
        style={{ background: 'var(--surface-card)', border: '1px solid var(--border)', color: 'var(--text-muted)' }}
      >
        <ChevronLeft className="h-4 w-4" />
      </button>
      <span className="min-w-[110px] text-center text-sm font-semibold capitalize" style={{ color: 'var(--text-primary)' }}>
        {format(monthAnchor, 'MMMM yyyy', { locale: nl })}
      </span>
      <button
        type="button"
        onClick={onNext}
        className="flex h-8 w-8 items-center justify-center rounded-lg transition-colors hover:opacity-80"
        style={{ background: 'var(--surface-card)', border: '1px solid var(--border)', color: 'var(--text-muted)' }}
      >
        <ChevronRight className="h-4 w-4" />
      </button>
    </div>
  )
}

function EntriesTable({
  entries,
  onEdit,
  onDelete,
  showEmployee,
}: {
  entries: (Availability & { users?: { full_name: string } })[]
  onEdit: (entry: Availability) => void
  onDelete: (entry: Availability) => void
  showEmployee?: boolean
}) {
  if (entries.length === 0) {
    return (
      <p className="py-6 text-center text-sm" style={{ color: 'var(--text-muted)' }}>
        Geen beschikbaarheid ingevuld deze maand
      </p>
    )
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr style={{ borderBottom: '1px solid var(--border)' }}>
            <th className="pb-3 pr-4 text-left text-xs font-semibold uppercase tracking-wide" style={{ color: 'var(--text-muted)' }}>Datum</th>
            {showEmployee && (
              <th className="pb-3 pr-4 text-left text-xs font-semibold uppercase tracking-wide" style={{ color: 'var(--text-muted)' }}>Medewerker</th>
            )}
            <th className="pb-3 pr-4 text-left text-xs font-semibold uppercase tracking-wide" style={{ color: 'var(--text-muted)' }}>Tijd</th>
            <th className="pb-3 pr-4 text-left text-xs font-semibold uppercase tracking-wide" style={{ color: 'var(--text-muted)' }}>Opmerking</th>
            <th className="pb-3 text-left text-xs font-semibold uppercase tracking-wide" style={{ color: 'var(--text-muted)' }}>Acties</th>
          </tr>
        </thead>
        <tbody>
          {[...entries]
            .sort((a, b) => a.date.localeCompare(b.date))
            .map((entry) => (
              <tr key={entry.id} style={{ borderBottom: '1px solid var(--border)' }}>
                <td className="py-3 pr-4 font-medium capitalize" style={{ color: 'var(--text-primary)' }}>
                  {formatDate(entry.date, 'EEE d MMM')}
                </td>
                {showEmployee && (
                  <td className="py-3 pr-4" style={{ color: 'var(--text-secondary)' }}>
                    {entry.users?.full_name ?? 'Medewerker'}
                  </td>
                )}
                <td className="py-3 pr-4" style={{ color: 'var(--text-secondary)' }}>
                  {formatTimeRange(entry.available_from, entry.available_until)}
                </td>
                <td className="py-3 pr-4 max-w-[200px] truncate" style={{ color: 'var(--text-muted)' }}>
                  {entry.note || '—'}
                </td>
                <td className="py-3">
                  <div className="flex gap-2">
                    <Button size="sm" variant="secondary" onClick={() => onEdit(entry)}>
                      <Pencil className="h-3.5 w-3.5" />
                      Bewerken
                    </Button>
                    <Button size="sm" variant="danger" onClick={() => onDelete(entry)}>
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </td>
              </tr>
            ))}
        </tbody>
      </table>
    </div>
  )
}

function EmployeeAvailabilityView({
  monthAnchor,
  setMonthAnchor,
  entries,
  loading,
  onReload,
  userId,
  organizationId,
}: {
  monthAnchor: Date
  setMonthAnchor: (d: Date) => void
  entries: Availability[]
  loading: boolean
  onReload: () => Promise<void>
  userId: string
  organizationId: string
}) {
  const [busyDate, setBusyDate] = useState<string | null>(null)
  const [selectedEntry, setSelectedEntry] = useState<Availability | null>(null)

  const { start, end } = getMonthRange(monthAnchor)

  const weeks = useMemo(() => {
    const weekStarts = eachWeekOfInterval({ start, end }, { weekStartsOn: 1 })
    return weekStarts.map((ws) => eachDayOfInterval({ start: ws, end: endOfWeek(ws, { weekStartsOn: 1 }) }))
  }, [start, end])

  const entryByDate = useMemo(() => {
    const map = new Map<string, Availability>()
    for (const e of entries) map.set(e.date, e)
    return map
  }, [entries])

  const availableCount = entries.length
  const daysInMonth = getMonthRange(monthAnchor).days.length
  const percentage = daysInMonth > 0 ? Math.round((availableCount / daysInMonth) * 100) : 0

  const handleDayClick = async (dateStr: string) => {
    const d = new Date(dateStr + 'T12:00:00')
    if (isBefore(d, startOfDay(new Date()))) return

    const existing = entryByDate.get(dateStr)
    if (existing) {
      setSelectedEntry(existing)
      return
    }

    setBusyDate(dateStr)
    try {
      const created = await setDayAvailable(userId, dateStr, organizationId)
      await onReload()
      setSelectedEntry(created)
    } finally {
      setBusyDate(null)
    }
  }

  const handleSave = async (updates: {
    available_from: string | null
    available_until: string | null
    note: string | null
  }) => {
    if (!selectedEntry) return
    const updated = await updateAvailability(selectedEntry.id, updates)
    await onReload()
    setSelectedEntry(updated)
  }

  const handleDelete = async (entry: Availability) => {
    await deleteAvailability(entry.id)
    if (selectedEntry?.id === entry.id) setSelectedEntry(null)
    await onReload()
  }

  const handleDeleteSelected = async () => {
    if (!selectedEntry) return
    await handleDelete(selectedEntry)
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold" style={{ color: 'var(--text-primary)' }}>Beschikbaarheid</h1>
          <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
            Klik op een dag om beschikbaarheid toe te voegen of te bewerken
          </p>
        </div>
        <MonthNav
          monthAnchor={monthAnchor}
          onPrev={() => setMonthAnchor(subMonths(monthAnchor, 1))}
          onNext={() => setMonthAnchor(addMonths(monthAnchor, 1))}
        />
      </div>

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
        <>
          <Card>
            <CardHeader
              title="Maandoverzicht"
              subtitle="Groen = beschikbaar. Klik om details in te vullen."
            />

            <div className="space-y-2">
              <div className="grid grid-cols-7 gap-1.5 px-1">
                {DAY_NAMES.map((d) => (
                  <div key={d} className="py-1 text-center text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>
                    {d}
                  </div>
                ))}
              </div>

              {weeks.map((week) => {
                const inMonth = week.some((d) => isSameMonth(d, monthAnchor))
                if (!inMonth) return null
                return (
                  <div key={toDateStr(week[0])} className="grid grid-cols-7 gap-1.5 px-1">
                    {week.map((day) => {
                      const dateStr = toDateStr(day)
                      const inM = isSameMonth(day, monthAnchor)
                      const entry = entryByDate.get(dateStr)
                      const busy = busyDate === dateStr
                      const past = isBefore(new Date(dateStr + 'T12:00:00'), startOfDay(new Date()))
                      const today = isToday(day)
                      const selected = selectedEntry?.date === dateStr

                      if (!inM) return <div key={dateStr} />

                      return (
                        <button
                          key={dateStr}
                          type="button"
                          disabled={past || busy}
                          onClick={() => handleDayClick(dateStr)}
                          title={`${DAY_FULL[day.getDay() === 0 ? 6 : day.getDay() - 1]} ${format(day, 'd MMMM', { locale: nl })}`}
                          className="relative flex flex-col items-center justify-center rounded-xl py-2.5 text-center transition-all hover:scale-105 active:scale-95 disabled:cursor-not-allowed disabled:opacity-40"
                          style={{
                            background: entry
                              ? 'rgba(16,185,129,0.12)'
                              : past
                                ? 'transparent'
                                : 'var(--surface-hover)',
                            border: selected
                              ? '2px solid var(--brand)'
                              : entry
                                ? '1.5px solid rgba(16,185,129,0.3)'
                                : today
                                  ? '1.5px solid var(--brand)'
                                  : '1.5px solid var(--border)',
                          }}
                        >
                          <span
                            className="text-sm font-semibold leading-none"
                            style={{ color: entry ? '#10B981' : today ? 'var(--brand)' : 'var(--text-primary)' }}
                          >
                            {format(day, 'd')}
                          </span>
                          <span className="mt-1 flex h-4 w-4 items-center justify-center rounded-full">
                            {busy ? (
                              <span className="h-3 w-3 animate-spin rounded-full border-2 border-current border-t-transparent" style={{ color: '#10B981' }} />
                            ) : entry ? (
                              <Check className="h-3.5 w-3.5" style={{ color: '#10B981' }} />
                            ) : past ? null : (
                              <Plus className="h-3 w-3" style={{ color: 'var(--text-disabled)' }} />
                            )}
                          </span>
                        </button>
                      )
                    })}
                  </div>
                )
              })}
            </div>
          </Card>

          {selectedEntry && (
            <Card>
              <CardHeader title="Dag bewerken" subtitle="Tijden en opmerking zijn optioneel" />
              <AvailabilityEntryPanel
                entry={selectedEntry}
                onSave={handleSave}
                onDelete={handleDeleteSelected}
              />
            </Card>
          )}

          <Card>
            <CardHeader title="Alle entries deze maand" subtitle="Overzicht met bewerken en verwijderen" />
            <EntriesTable
              entries={entries}
              onEdit={setSelectedEntry}
              onDelete={async (entry) => {
                if (!confirm(`Beschikbaarheid op ${formatDate(entry.date, 'd MMM')} verwijderen?`)) return
                await handleDelete(entry)
              }}
            />
          </Card>

          <p className="flex items-start gap-1.5 text-xs" style={{ color: 'var(--text-disabled)' }}>
            <Info className="mt-0.5 h-3.5 w-3.5 shrink-0" />
            Je manager plant de exacte diensttijden in via het Rooster.
          </p>
        </>
      )}
    </div>
  )
}

function AdminAvailabilityView({
  monthAnchor,
  setMonthAnchor,
  entries,
  loading,
  onReload,
  organizationId,
}: {
  monthAnchor: Date
  setMonthAnchor: (d: Date) => void
  entries: (Availability & { users?: { full_name: string } })[]
  loading: boolean
  onReload: () => Promise<void>
  organizationId: string
}) {
  const [selectedDate, setSelectedDate] = useState<string | null>(null)
  const [editingEntry, setEditingEntry] = useState<(Availability & { users?: { full_name: string } }) | null>(null)
  const [employees, setEmployees] = useState<User[]>([])
  const [addUserId, setAddUserId] = useState('')
  const [adding, setAdding] = useState(false)

  const { start, end } = getMonthRange(monthAnchor)

  useEffect(() => {
    getAllUsers()
      .then((users) => setEmployees(users.filter((u) => u.role === 'employee')))
      .catch(() => {})
  }, [])

  const countByDate = useMemo(() => {
    const map = new Map<string, (Availability & { users?: { full_name: string } })[]>()
    for (const e of entries) {
      const list = map.get(e.date) ?? []
      list.push(e)
      map.set(e.date, list)
    }
    return map
  }, [entries])

  const weeks = useMemo(() => {
    const weekStarts = eachWeekOfInterval({ start, end }, { weekStartsOn: 1 })
    return weekStarts.map((ws) => eachDayOfInterval({ start: ws, end: endOfWeek(ws, { weekStartsOn: 1 }) }))
  }, [start, end])

  const dayEntries = selectedDate ? (countByDate.get(selectedDate) ?? []) : []

  const handleAddForDay = async () => {
    if (!selectedDate || !addUserId) return
    if (dayEntries.some((e) => e.user_id === addUserId)) {
      alert('Deze medewerker is al beschikbaar op deze dag.')
      return
    }
    setAdding(true)
    try {
      const created = await setDayAvailable(addUserId, selectedDate, organizationId)
      await onReload()
      setEditingEntry(created)
      setAddUserId('')
    } finally {
      setAdding(false)
    }
  }

  const handleSave = async (updates: {
    available_from: string | null
    available_until: string | null
    note: string | null
  }) => {
    if (!editingEntry) return
    const updated = await updateAvailability(editingEntry.id, updates)
    await onReload()
    setEditingEntry({ ...updated, users: editingEntry.users })
  }

  const handleDelete = async (entry: Availability) => {
    await deleteAvailability(entry.id)
    if (editingEntry?.id === entry.id) setEditingEntry(null)
    await onReload()
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold" style={{ color: 'var(--text-primary)' }}>Beschikbaarheid</h1>
          <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
            Beheer beschikbaarheid van medewerkers per dag
          </p>
        </div>
        <MonthNav
          monthAnchor={monthAnchor}
          onPrev={() => setMonthAnchor(subMonths(monthAnchor, 1))}
          onNext={() => setMonthAnchor(addMonths(monthAnchor, 1))}
        />
      </div>

      {loading ? <LoadingSpinner /> : (
        <>
          <Card>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[600px] text-sm">
                <thead>
                  <tr style={{ borderBottom: '1px solid var(--border)' }}>
                    <th className="pb-3 pr-4 text-left text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>Week</th>
                    {DAY_NAMES.map((d) => (
                      <th key={d} className="pb-3 text-center text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>{d}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {weeks.map((week) => {
                    const inMonth = week.some((d) => isSameMonth(d, monthAnchor))
                    if (!inMonth) return null
                    const weekNum = format(week[0], 'w')
                    return (
                      <tr key={weekNum} style={{ borderBottom: '1px solid var(--border)' }}>
                        <td className="py-3 pr-4 text-xs font-medium" style={{ color: 'var(--text-disabled)' }}>Wk {weekNum}</td>
                        {week.map((day) => {
                          const dateStr = toDateStr(day)
                          const inM = isSameMonth(day, monthAnchor)
                          const people = countByDate.get(dateStr) ?? []
                          const selected = selectedDate === dateStr
                          return (
                            <td key={dateStr} className="px-1 py-2 text-center align-top">
                              {inM ? (
                                <button
                                  type="button"
                                  onClick={() => {
                                    setSelectedDate(dateStr)
                                    setEditingEntry(null)
                                  }}
                                  className="flex w-full flex-col items-center gap-1 rounded-lg py-1 transition-colors hover:opacity-80"
                                  style={{
                                    background: selected ? 'rgba(59,130,246,0.1)' : 'transparent',
                                    border: selected ? '1px solid rgba(59,130,246,0.3)' : '1px solid transparent',
                                  }}
                                >
                                  <span className="text-xs font-medium" style={{ color: isToday(day) ? 'var(--brand)' : 'var(--text-secondary)' }}>
                                    {format(day, 'd')}
                                  </span>
                                  {people.length > 0 ? (
                                    <span className="inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-xs font-semibold" style={{ background: 'rgba(16,185,129,0.12)', color: '#10B981' }}>
                                      <Check className="h-3 w-3" />
                                      {people.length}
                                    </span>
                                  ) : (
                                    <span className="text-[10px]" style={{ color: 'var(--text-disabled)' }}>—</span>
                                  )}
                                </button>
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
          </Card>

          {selectedDate && (
            <Card>
              <CardHeader
                title={`Beschikbaarheid — ${formatDate(selectedDate, 'EEEE d MMMM')}`}
                subtitle={`${dayEntries.length} medewerker${dayEntries.length !== 1 ? 's' : ''} beschikbaar`}
              />

              {dayEntries.length > 0 && (
                <ul className="mb-4 space-y-2">
                  {dayEntries.map((entry) => (
                    <li
                      key={entry.id}
                      className="flex flex-wrap items-center justify-between gap-3 rounded-xl px-4 py-3"
                      style={{
                        background: editingEntry?.id === entry.id ? 'rgba(59,130,246,0.08)' : 'var(--surface-subtle)',
                        border: '1px solid var(--border)',
                      }}
                    >
                      <div>
                        <p className="font-medium" style={{ color: 'var(--text-primary)' }}>
                          {entry.users?.full_name ?? 'Medewerker'}
                        </p>
                        <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
                          {formatTimeRange(entry.available_from, entry.available_until)}
                          {entry.note ? ` · ${entry.note}` : ''}
                        </p>
                      </div>
                      <div className="flex gap-2">
                        <Button size="sm" variant="secondary" onClick={() => setEditingEntry(entry)}>
                          <Pencil className="h-3.5 w-3.5" />
                          Bewerken
                        </Button>
                        <Button
                          size="sm"
                          variant="danger"
                          onClick={async () => {
                            if (!confirm('Beschikbaarheid verwijderen?')) return
                            await handleDelete(entry)
                          }}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </li>
                  ))}
                </ul>
              )}

              <div className="mb-4 flex flex-wrap items-end gap-3 rounded-xl p-4" style={{ background: 'var(--surface-subtle)', border: '1px solid var(--border)' }}>
                <div className="min-w-[200px] flex-1">
                  <Select
                    label="Medewerker toevoegen"
                    value={addUserId}
                    onChange={(e) => setAddUserId(e.target.value)}
                    options={[
                      { value: '', label: 'Kies medewerker…' },
                      ...employees
                        .filter((e) => !dayEntries.some((d) => d.user_id === e.id))
                        .map((e) => ({ value: e.id, label: e.full_name })),
                    ]}
                  />
                </div>
                <Button onClick={handleAddForDay} loading={adding} disabled={!addUserId}>
                  <Plus className="h-4 w-4" />
                  Toevoegen
                </Button>
              </div>

              {editingEntry && (
                <AvailabilityEntryPanel
                  entry={editingEntry}
                  subtitle={editingEntry.users?.full_name}
                  onSave={handleSave}
                  onDelete={async () => handleDelete(editingEntry)}
                />
              )}
            </Card>
          )}

          <Card>
            <CardHeader title="Alle entries deze maand" />
            <EntriesTable
              entries={entries}
              showEmployee
              onEdit={(entry) => {
                setSelectedDate(entry.date)
                setEditingEntry(entry as Availability & { users?: { full_name: string } })
              }}
              onDelete={async (entry) => {
                if (!confirm('Beschikbaarheid verwijderen?')) return
                await handleDelete(entry)
              }}
            />
          </Card>
        </>
      )}
    </div>
  )
}

export function AvailabilityPage() {
  const { profile, isAdmin } = useAuth()
  const { organization } = useOrganization()
  const [monthAnchor, setMonthAnchor] = useState(new Date())
  const [entries, setEntries] = useState<Availability[]>([])
  const [allEntries, setAllEntries] = useState<(Availability & { users?: { full_name: string } })[]>([])
  const [loading, setLoading] = useState(true)

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

  if (isAdmin) {
    return (
      <AdminAvailabilityView
        monthAnchor={monthAnchor}
        setMonthAnchor={setMonthAnchor}
        entries={allEntries}
        loading={loading}
        onReload={load}
        organizationId={organization!.id}
      />
    )
  }

  return (
    <EmployeeAvailabilityView
      monthAnchor={monthAnchor}
      setMonthAnchor={setMonthAnchor}
      entries={entries}
      loading={loading}
      onReload={load}
      userId={userId}
      organizationId={organization!.id}
    />
  )
}
