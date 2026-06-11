import { useEffect, useState } from 'react'
import { useAuth } from '../context/AuthContext'
import { getClockRecords, sumHours } from '../services/clock'
import { getAllUsers } from '../services/users'
import type { ClockRecord, User } from '../types/database'
import { Card, CardHeader } from '../components/ui/Card'
import { WeekNavigator } from '../components/ui/WeekNavigator'
import { LoadingSpinner } from '../components/ui/LoadingSpinner'
import { Select } from '../components/ui/Select'
import { formatDateTime, addWeeks, subWeeks } from '../lib/utils'

export function HoursPage() {
  const { profile, isAdmin } = useAuth()
  const [weekAnchor, setWeekAnchor] = useState(new Date())
  const [range, setRange] = useState<'week' | 'month'>('week')
  const [records, setRecords] = useState<ClockRecord[]>([])
  const [employees, setEmployees] = useState<User[]>([])
  const [selectedUser, setSelectedUser] = useState('')
  const [loading, setLoading] = useState(true)

  const targetUserId = isAdmin ? selectedUser || profile!.id : profile!.id

  const load = async () => {
    if (!targetUserId) return
    setLoading(true)
    try {
      const data = await getClockRecords(targetUserId, range, weekAnchor)
      setRecords(data)
      if (isAdmin && employees.length === 0) {
        const users = await getAllUsers()
        const emps = users.filter((u) => u.role === 'employee')
        setEmployees(emps)
        if (!selectedUser && emps[0]) setSelectedUser(emps[0].id)
      }
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (profile) load()
  }, [weekAnchor, range, targetUserId, profile])

  const total = sumHours(records)

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-zinc-100">Urenoverzicht</h1>
          <p className="text-sm text-zinc-500">
            Gewerkte uren per {range === 'week' ? 'week' : 'maand'}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <select
            value={range}
            onChange={(e) => setRange(e.target.value as 'week' | 'month')}
            className="rounded-xl border px-3 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/30 transition-all"
            style={{ background: 'var(--surface-input)', color: 'var(--text-primary)', borderColor: 'var(--border-input)' }}
          >
            <option value="week">Week</option>
            <option value="month">Maand</option>
          </select>
          {range === 'week' && (
            <WeekNavigator
              weekAnchor={weekAnchor}
              onPrev={() => setWeekAnchor(subWeeks(weekAnchor, 1))}
              onNext={() => setWeekAnchor(addWeeks(weekAnchor, 1))}
              onToday={() => setWeekAnchor(new Date())}
            />
          )}
        </div>
      </div>

      {isAdmin && employees.length > 0 && (
        <Select
          label="Medewerker"
          value={selectedUser}
          onChange={(e) => setSelectedUser(e.target.value)}
          options={employees.map((e) => ({ value: e.id, label: e.full_name }))}
        />
      )}

      {/* Totaal uren card */}
      <div
        className="rounded-2xl p-6"
        style={{ background: 'rgba(37,99,235,0.12)', border: '1px solid rgba(37,99,235,0.25)' }}
      >
        <p className="text-sm font-medium text-brand-400">Totaal gewerkte uren</p>
        <p className="mt-1 text-5xl font-bold text-white">{total.toFixed(2)}</p>
        <p className="mt-1 text-xs text-zinc-500">uur in geselecteerde periode</p>
      </div>

      {loading ? (
        <LoadingSpinner />
      ) : (
        <Card>
          <CardHeader title="Registraties" />
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-white/8 text-left">
                  <th className="pb-3 pr-4 text-xs font-semibold uppercase tracking-wide text-zinc-600">Ingeklokt</th>
                  <th className="pb-3 pr-4 text-xs font-semibold uppercase tracking-wide text-zinc-600">Uitgeklokt</th>
                  <th className="pb-3 text-xs font-semibold uppercase tracking-wide text-zinc-600">Uren</th>
                </tr>
              </thead>
              <tbody>
                {records.length === 0 ? (
                  <tr>
                    <td colSpan={3} className="py-8 text-center text-sm text-zinc-600">
                      Geen registraties in deze periode
                    </td>
                  </tr>
                ) : (
                  records.map((r) => (
                    <tr key={r.id} className="border-b border-white/5 last:border-0">
                      <td className="py-3 pr-4 text-zinc-400">{formatDateTime(r.clock_in)}</td>
                      <td className="py-3 pr-4 text-zinc-400">
                        {r.clock_out ? formatDateTime(r.clock_out) : '—'}
                      </td>
                      <td className="py-3 font-semibold text-zinc-200">{r.total_hours ?? '—'}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </Card>
      )}
    </div>
  )
}
