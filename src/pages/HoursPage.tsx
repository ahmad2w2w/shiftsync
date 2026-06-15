import { useEffect, useMemo, useState } from 'react'
import { FileText, FileSpreadsheet, Pencil } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { useOrganization } from '../context/OrganizationContext'
import { useToast } from '../context/ToastContext'
import { getClockRecords, sumHours, setClockApproval, setClockCorrection } from '../services/clock'
import { getAllUsers } from '../services/users'
import { exportHoursToPDF, exportHoursToExcel } from '../services/export'
import type { ClockRecord, User } from '../types/database'
import { Card, CardHeader } from '../components/ui/Card'
import { Button } from '../components/ui/Button'
import { Modal } from '../components/ui/Modal'
import { Input } from '../components/ui/Input'
import { WeekNavigator } from '../components/ui/WeekNavigator'
import { MonthNavigator } from '../components/ui/MonthNavigator'
import { PageHeader } from '../components/ui/PageHeader'
import { TableSkeleton } from '../components/ui/Skeleton'
import { LoadError } from '../components/ui/LoadError'
import { Table, TableHead, TableHeaderCell, TableBody, TableRow, TableCell } from '../components/ui/Table'
import { Badge } from '../components/ui/Badge'
import { EmptyState } from '../components/ui/EmptyState'
import { Pagination } from '../components/ui/Pagination'
import { Timer, Check } from 'lucide-react'
import { Select } from '../components/ui/Select'
import { formatDateTime, addWeeks, subWeeks, addMonths, subMonths, weekLabel, monthLabel } from '../lib/utils'

const PAGE_SIZE = 20

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
  const [loadError, setLoadError] = useState(false)
  const [page, setPage] = useState(0)
  const [correcting, setCorrecting] = useState<ClockRecord | null>(null)
  const [corrHours, setCorrHours] = useState('')
  const [corrNote, setCorrNote] = useState('')
  const [savingCorr, setSavingCorr] = useState(false)

  const targetUserId = isAdmin ? selectedUser || profile!.id : profile!.id

  const load = async () => {
    if (!targetUserId) return
    setLoading(true)
    setLoadError(false)
    try {
      const data = await getClockRecords(targetUserId, range, anchor)
      setRecords(data)
      if (isAdmin && employees.length === 0) {
        const users = await getAllUsers()
        const emps = users.filter((u) => u.role === 'employee')
        setEmployees(emps)
        if (!selectedUser && emps[0]) setSelectedUser(emps[0].id)
      }
    } catch {
      setLoadError(true)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    setPage(0)
    if (profile) load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [anchor, range, targetUserId, profile])

  const total = sumHours(records)
  const periodLabel = range === 'week' ? weekLabel(anchor) : monthLabel(anchor)

  const toggleApproval = async (record: ClockRecord) => {
    if (!profile) return
    try {
      await setClockApproval(record.id, !record.approved, profile.id)
      setRecords((prev) => prev.map((r) => (r.id === record.id ? { ...r, approved: !record.approved } : r)))
    } catch {
      toast.error('Goedkeuren mislukt')
    }
  }

  const openCorrection = (record: ClockRecord) => {
    setCorrecting(record)
    setCorrHours(String(record.corrected_hours ?? record.total_hours ?? ''))
    setCorrNote(record.correction_note ?? '')
  }

  const saveCorrection = async () => {
    if (!correcting) return
    setSavingCorr(true)
    try {
      const hours = corrHours.trim() === '' ? null : Number(corrHours)
      if (hours != null && (Number.isNaN(hours) || hours < 0)) {
        toast.error('Voer een geldig aantal uren in')
        setSavingCorr(false)
        return
      }
      await setClockCorrection(correcting.id, hours, corrNote.trim() || null)
      setRecords((prev) => prev.map((r) => (r.id === correcting.id ? { ...r, corrected_hours: hours, correction_note: corrNote.trim() || null } : r)))
      toast.success('Uren gecorrigeerd')
      setCorrecting(null)
    } catch {
      toast.error('Corrigeren mislukt')
    } finally {
      setSavingCorr(false)
    }
  }

  const canExport = hasFeature('export')

  const pageCount = Math.max(1, Math.ceil(records.length / PAGE_SIZE))
  const pagedRecords = useMemo(
    () => records.slice(page * PAGE_SIZE, page * PAGE_SIZE + PAGE_SIZE),
    [records, page]
  )

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
          <Select
            label="Periode"
            value={range}
            onChange={(e) => setRange(e.target.value as 'week' | 'month')}
            options={[
              { value: 'week', label: 'Week' },
              { value: 'month', label: 'Maand' },
            ]}
          />
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

      {loadError ? (
        <LoadError onRetry={load} />
      ) : loading ? (
        <TableSkeleton />
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
            <>
              <Table>
                <TableHead>
                  <TableHeaderCell>Ingeklokt</TableHeaderCell>
                  <TableHeaderCell>Uitgeklokt</TableHeaderCell>
                  <TableHeaderCell>Uren</TableHeaderCell>
                  <TableHeaderCell>Status</TableHeaderCell>
                  {isAdmin && <TableHeaderCell>Acties</TableHeaderCell>}
                </TableHead>
                <TableBody>
                  {pagedRecords.map((r) => {
                    const corrected = r.corrected_hours != null
                    return (
                      <TableRow key={r.id}>
                        <TableCell>{formatDateTime(r.clock_in)}</TableCell>
                        <TableCell>{r.clock_out ? formatDateTime(r.clock_out) : '—'}</TableCell>
                        <TableCell className="font-semibold tabular-nums" style={{ color: 'var(--text-primary)' }}>
                          <span className="inline-flex items-center gap-1.5">
                            {r.corrected_hours ?? r.total_hours ?? '—'}
                            {corrected && (
                              <Badge variant="warning" className="text-[10px]">gecorrigeerd</Badge>
                            )}
                          </span>
                          {corrected && r.correction_note && (
                            <p className="mt-0.5 text-xs font-normal" style={{ color: 'var(--text-muted)' }}>{r.correction_note}</p>
                          )}
                        </TableCell>
                        <TableCell>
                          {r.approved ? <Badge variant="approved" dot>Goedgekeurd</Badge> : <Badge variant="pending" dot>Te beoordelen</Badge>}
                        </TableCell>
                        {isAdmin && (
                          <TableCell>
                            <div className="flex flex-wrap gap-1.5">
                              <Button
                                size="xs"
                                variant={r.approved ? 'secondary' : 'success'}
                                onClick={() => toggleApproval(r)}
                                disabled={!r.clock_out}
                              >
                                {r.approved ? 'Intrekken' : <><Check className="h-3.5 w-3.5" /> Goedkeuren</>}
                              </Button>
                              <Button size="xs" variant="secondary" onClick={() => openCorrection(r)} disabled={!r.clock_out}>
                                <Pencil className="h-3.5 w-3.5" /> Corrigeren
                              </Button>
                            </div>
                          </TableCell>
                        )}
                      </TableRow>
                    )
                  })}
                </TableBody>
              </Table>
              <Pagination page={page} pageCount={pageCount} total={records.length} onPageChange={setPage} />
            </>
          )}
        </Card>
      )}

      <Modal open={!!correcting} onClose={() => setCorrecting(null)} title="Uren corrigeren" size="sm">
        <div className="space-y-4">
          <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
            Pas het gewerkte aantal uren handmatig aan. De oorspronkelijke kloktijden blijven bewaard.
          </p>
          <Input
            label="Gecorrigeerde uren"
            type="number"
            min={0}
            step="0.25"
            value={corrHours}
            onChange={(e) => setCorrHours(e.target.value)}
            hint="Laat leeg om de correctie te verwijderen"
          />
          <Input
            label="Notitie (reden)"
            value={corrNote}
            onChange={(e) => setCorrNote(e.target.value)}
            placeholder="Bijv. vergeten uit te klokken"
          />
          <div className="flex justify-end gap-2 border-t pt-4" style={{ borderColor: 'var(--border)' }}>
            <Button variant="secondary" onClick={() => setCorrecting(null)}>Annuleren</Button>
            <Button loading={savingCorr} onClick={saveCorrection}>Opslaan</Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
