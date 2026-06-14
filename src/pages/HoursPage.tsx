import { useEffect, useState } from 'react'
import { FileText, FileSpreadsheet } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { useOrganization } from '../context/OrganizationContext'
import { useToast } from '../context/ToastContext'
import { getClockRecords, sumHours } from '../services/clock'
import { getAllUsers } from '../services/users'
import { exportHoursToPDF, exportHoursToExcel } from '../services/export'
import type { ClockRecord, User } from '../types/database'
import { Card, CardHeader } from '../components/ui/Card'
import { Button } from '../components/ui/Button'
import { WeekNavigator } from '../components/ui/WeekNavigator'
import { MonthNavigator } from '../components/ui/MonthNavigator'
import { LoadingSpinner } from '../components/ui/LoadingSpinner'
import { Select } from '../components/ui/Select'
import { formatDateTime, addWeeks, subWeeks, addMonths, subMonths, weekLabel, monthLabel } from '../lib/utils'

export function HoursPage() {
  const { profile, isAdmin } = useAuth()
  const { organization, hasFeature } = useOrganization()
  const toast = useToast()
  const [anchor, setAnchor] = useState(new Date())
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
      const data = await getClockRecords(targetUserId, range, anchor)
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [anchor, range, targetUserId, profile])

  const total = sumHours(records)
  const periodLabel = range === 'week' ? weekLabel(anchor) : monthLabel(anchor)
  const canExport = hasFeature('export')

  const exportUsers = isAdmin
    ? employees
    : profile
      ? [profile as User]
      : []

  const handleExport = (kind: 'pdf' | 'excel') => {
    if (records.length === 0) {
      toast.info('Geen registraties om te exporteren in deze periode')
      return
    }
    const orgName = organization?.name ?? 'ShiftSync'
    try {
      if (kind === 'pdf') exportHoursToPDF(records, exportUsers, orgName, periodLabel)
      else exportHoursToExcel(records, exportUsers, orgName, periodLabel)
      toast.success(`Export naar ${kind === 'pdf' ? 'PDF' : 'Excel'} gestart`)
    } catch {
      toast.error('Export mislukt')
    }
  }

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
          {range === 'week' ? (
            <WeekNavigator
              weekAnchor={anchor}
              onPrev={() => setAnchor(subWeeks(anchor, 1))}
              onNext={() => setAnchor(addWeeks(anchor, 1))}
              onToday={() => setAnchor(new Date())}
            />
          ) : (
            <MonthNavigator
              monthAnchor={anchor}
              onPrev={() => setAnchor(subMonths(anchor, 1))}
              onNext={() => setAnchor(addMonths(anchor, 1))}
              onToday={() => setAnchor(new Date())}
            />
          )}
        </div>
      </div>

      <div className="flex flex-wrap items-end justify-between gap-3">
        {isAdmin && employees.length > 0 ? (
          <div className="min-w-[220px]">
            <Select
              label="Medewerker"
              value={selectedUser}
              onChange={(e) => setSelectedUser(e.target.value)}
              options={employees.map((e) => ({ value: e.id, label: e.full_name }))}
            />
          </div>
        ) : <div />}

        {canExport && (
          <div className="flex gap-2">
            <Button variant="secondary" size="sm" onClick={() => handleExport('pdf')}>
              <FileText className="h-4 w-4" />
              PDF
            </Button>
            <Button variant="secondary" size="sm" onClick={() => handleExport('excel')}>
              <FileSpreadsheet className="h-4 w-4" />
              Excel
            </Button>
          </div>
        )}
      </div>

      {/* Totaal uren card */}
      <div
        className="rounded-2xl p-6"
        style={{ background: 'rgba(37,99,235,0.12)', border: '1px solid rgba(37,99,235,0.25)' }}
      >
        <p className="text-sm font-medium" style={{ color: 'var(--brand-strong)' }}>Totaal gewerkte uren</p>
        <p className="mt-1 text-5xl font-bold" style={{ color: 'var(--text-primary)' }}>{total.toFixed(2)}</p>
        <p className="mt-1 text-xs" style={{ color: 'var(--text-muted)' }}>uur in geselecteerde periode</p>
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
