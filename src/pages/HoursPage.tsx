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
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-navy-900">Urenoverzicht</h1>
          <p className="text-sm text-gray-500">
            Gewerkte uren per {range === 'week' ? 'week' : 'maand'}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <select
            value={range}
            onChange={(e) => setRange(e.target.value as 'week' | 'month')}
            className="rounded-lg border border-gray-200 px-3 py-2 text-sm"
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

      <Card className="bg-navy-900 text-white">
        <p className="text-sm text-navy-200">Totaal gewerkte uren</p>
        <p className="text-4xl font-bold">{total.toFixed(2)}</p>
      </Card>

      {loading ? (
        <LoadingSpinner />
      ) : (
        <Card>
          <CardHeader title="Registraties" />
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-left text-gray-500">
                  <th className="pb-2 pr-4">Ingeklokt</th>
                  <th className="pb-2 pr-4">Uitgeklokt</th>
                  <th className="pb-2">Uren</th>
                </tr>
              </thead>
              <tbody>
                {records.length === 0 ? (
                  <tr>
                    <td colSpan={3} className="py-8 text-center text-gray-400">
                      Geen registraties in deze periode
                    </td>
                  </tr>
                ) : (
                  records.map((r) => (
                    <tr key={r.id} className="border-b border-gray-50">
                      <td className="py-3 pr-4">{formatDateTime(r.clock_in)}</td>
                      <td className="py-3 pr-4">
                        {r.clock_out ? formatDateTime(r.clock_out) : '—'}
                      </td>
                      <td className="py-3 font-medium">{r.total_hours ?? '—'}</td>
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
