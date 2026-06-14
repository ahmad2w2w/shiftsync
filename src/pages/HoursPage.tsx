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
import { PageHeader } from '../components/ui/PageHeader'
import { DashboardSkeleton } from '../components/ui/Skeleton'
import { Table, TableHead, TableHeaderCell, TableBody, TableRow, TableCell } from '../components/ui/Table'
import { EmptyState } from '../components/ui/EmptyState'
import { Timer } from 'lucide-react'
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
    <div className="mx-auto max-w-6xl space-y-6">
      <PageHeader
        title="Urenoverzicht"
        subtitle={`Gewerkte uren per ${range === 'week' ? 'week' : 'maand'}`}
        action={
          canExport ? (
            <div className="flex gap-2">
              <Button variant="secondary" size="sm" onClick={() => handleExport('pdf')}>
                <FileText className="h-4 w-4" /> PDF
              </Button>
              <Button variant="secondary" size="sm" onClick={() => handleExport('excel')}>
                <FileSpreadsheet className="h-4 w-4" /> Excel
              </Button>
            </div>
          ) : undefined
        }
      />

      <div className="flex flex-wrap items-center justify-between gap-3">
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

      {isAdmin && employees.length > 0 && (
        <div className="max-w-xs">
          <Select
            label="Medewerker"
            value={selectedUser}
            onChange={(e) => setSelectedUser(e.target.value)}
            options={employees.map((e) => ({ value: e.id, label: e.full_name }))}
          />
        </div>
      )}

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
        <DashboardSkeleton />
      ) : (
        <Card>
          <CardHeader title="Registraties" />
          {records.length === 0 ? (
            <EmptyState
              icon={Timer}
              title="Geen registraties"
              description="Er zijn geen klokregistraties in deze periode."
            />
          ) : (
            <Table>
              <TableHead>
                <TableHeaderCell>Ingeklokt</TableHeaderCell>
                <TableHeaderCell>Uitgeklokt</TableHeaderCell>
                <TableHeaderCell>Uren</TableHeaderCell>
              </TableHead>
              <TableBody>
                {records.map((r) => (
                  <TableRow key={r.id}>
                    <TableCell>{formatDateTime(r.clock_in)}</TableCell>
                    <TableCell>{r.clock_out ? formatDateTime(r.clock_out) : '—'}</TableCell>
                    <TableCell className="font-semibold" style={{ color: 'var(--text-primary)' }}>
                      {r.total_hours ?? '—'}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </Card>
      )}
    </div>
  )
}
