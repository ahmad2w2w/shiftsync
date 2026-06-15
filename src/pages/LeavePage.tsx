import { useCallback, useEffect, useMemo, useState, type FormEvent } from 'react'
import { useAuth } from '../context/AuthContext'
import { useOrganization } from '../context/OrganizationContext'
import { useOrgConfig } from '../context/OrgConfigContext'
import { useToast } from '../context/ToastContext'
import { getLeaveRequests, createLeaveRequest, updateLeaveStatus } from '../services/leave'
import { getLeaveBalances, addLeaveUsage } from '../services/leaveTypes'
import { getShiftsForPeriod } from '../services/shifts'
import { notifyLeaveDecision, createNotification, notifyAdmins } from '../services/notifications'
import { exportLeaveToPDF, exportLeaveToExcel } from '../services/export'
import type { LeaveRequest, LeaveBalance } from '../types/database'
import { Card, CardHeader } from '../components/ui/Card'
import { Button } from '../components/ui/Button'
import { Input } from '../components/ui/Input'
import { Select } from '../components/ui/Select'
import { StatusBadge } from '../components/ui/StatusBadge'
import { PageHeader } from '../components/ui/PageHeader'
import { EmptyState } from '../components/ui/EmptyState'
import { ListSkeleton } from '../components/ui/Skeleton'
import { LoadError } from '../components/ui/LoadError'
import { Palmtree, AlertTriangle, FileText, FileSpreadsheet } from 'lucide-react'
import { formatDate, estimateLeaveHours, parseISO } from '../lib/utils'

const YEAR = new Date().getFullYear()

export function LeavePage() {
  const { profile, isAdmin } = useAuth()
  const { organization, hasFeature } = useOrganization()
  const { leaveTypes } = useOrgConfig()
  const toast = useToast()
  const [requests, setRequests] = useState<LeaveRequest[]>([])
  const [balances, setBalances] = useState<LeaveBalance[]>([])
  const [conflicts, setConflicts] = useState<Record<string, number>>({})
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState(false)
  const [form, setForm] = useState({ start_date: '', end_date: '', reason: '', leave_type_id: '', hours: '' })
  const [submitting, setSubmitting] = useState(false)
  const [showForm, setShowForm] = useState(false)
  const [reviewingId, setReviewingId] = useState<string | null>(null)
  const [rejectNote, setRejectNote] = useState('')
  const [rejectingId, setRejectingId] = useState<string | null>(null)
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [bulkBusy, setBulkBusy] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    setLoadError(false)
    try {
      const data = await getLeaveRequests(isAdmin ? undefined : profile!.id)
      setRequests(data)
      // Balances (employee sees own; admin skips here)
      if (!isAdmin) {
        const b = await getLeaveBalances(YEAR, profile!.id).catch(() => [])
        setBalances(b)
      }
      // Conflict detection: count published shifts overlapping each pending request
      if (isAdmin) {
        const pending = data.filter((r) => r.status === 'pending')
        const entries = await Promise.all(
          pending.map(async (r) => {
            try {
              const shifts = await getShiftsForPeriod(parseISO(r.start_date), parseISO(r.end_date), { userId: r.user_id })
              return [r.id, shifts.length] as const
            } catch {
              return [r.id, 0] as const
            }
          })
        )
        setConflicts(Object.fromEntries(entries))
      }
    } catch {
      setLoadError(true)
    } finally {
      setLoading(false)
    }
  }, [isAdmin, profile])

  useEffect(() => {
    if (profile) load()
  }, [profile, load])

  const balanceByType = useMemo(() => {
    const map = new Map<string, { remaining: number; balance: number; used: number }>()
    for (const lt of leaveTypes) {
      const row = balances.find((b) => b.leave_type_id === lt.id)
      const balance = Number(row?.balance_hours ?? lt.default_balance_hours ?? 0)
      const used = Number(row?.used_hours ?? 0)
      map.set(lt.id, { balance, used, remaining: balance - used })
    }
    return map
  }, [leaveTypes, balances])

  const estimatedHours = useMemo(() => {
    if (!form.start_date || !form.end_date) return 0
    const perDay = profile?.contract_hours_per_week ? Number(profile.contract_hours_per_week) / 5 : 8
    return estimateLeaveHours(form.start_date, form.end_date, perDay)
  }, [form.start_date, form.end_date, profile])

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    if (!profile || !organization) return
    setSubmitting(true)
    try {
      const hours = form.hours ? Number(form.hours) : estimatedHours || null
      const created = await createLeaveRequest({
        user_id: profile.id,
        organization_id: organization.id,
        start_date: form.start_date,
        end_date: form.end_date,
        reason: form.reason,
        leave_type_id: form.leave_type_id || null,
        hours,
      })
      await notifyAdmins(organization.id, {
        type: 'leave_requested',
        title: 'Nieuwe verlofaanvraag',
        body: `${profile.full_name} vraagt verlof aan: ${formatDate(created.start_date)} – ${formatDate(created.end_date)}.`,
        link: '/app/verlof',
      }).catch(() => {})
      setForm({ start_date: '', end_date: '', reason: '', leave_type_id: '', hours: '' })
      setShowForm(false)
      toast.success('Verlofaanvraag ingediend')
      load()
    } catch {
      toast.error('Indienen mislukt. Probeer opnieuw.')
    } finally {
      setSubmitting(false)
    }
  }

  const approveOne = async (r: LeaveRequest) => {
    await updateLeaveStatus(r.id, 'approved')
    if (organization) {
      if (r.leave_type_id && r.hours) {
        await addLeaveUsage(organization.id, r.user_id, r.leave_type_id, YEAR, Number(r.hours)).catch(() => {})
      }
      await createNotification({
        organizationId: organization.id,
        userId: r.user_id,
        type: 'leave_approved',
        title: 'Verlof goedgekeurd',
        body: `${formatDate(r.start_date)} – ${formatDate(r.end_date)} is goedgekeurd.`,
        link: '/app/verlof',
      }).catch(() => {})
    }
    if (hasFeature('notifications') && r.user?.email) {
      await notifyLeaveDecision(r.user.email, r.user.full_name ?? 'Medewerker', 'approved', formatDate(r.start_date), formatDate(r.end_date)).catch(() => {})
    }
  }

  const handleApprove = async (r: LeaveRequest) => {
    setReviewingId(r.id)
    try {
      await approveOne(r)
      load()
    } finally {
      setReviewingId(null)
    }
  }

  const confirmReject = async (r: LeaveRequest) => {
    setReviewingId(r.id)
    try {
      await updateLeaveStatus(r.id, 'rejected', rejectNote || undefined)
      if (organization) {
        await createNotification({
          organizationId: organization.id,
          userId: r.user_id,
          type: 'leave_rejected',
          title: 'Verlof afgewezen',
          body: `${formatDate(r.start_date)} – ${formatDate(r.end_date)}${rejectNote ? ` · ${rejectNote}` : ''}`,
          link: '/app/verlof',
        }).catch(() => {})
      }
      if (hasFeature('notifications') && r.user?.email) {
        await notifyLeaveDecision(r.user.email, r.user.full_name ?? 'Medewerker', 'rejected', formatDate(r.start_date), formatDate(r.end_date), rejectNote || undefined).catch(() => {})
      }
      setRejectingId(null)
      setRejectNote('')
      load()
    } finally {
      setReviewingId(null)
    }
  }

  const pendingRequests = useMemo(() => requests.filter((r) => r.status === 'pending'), [requests])

  const toggleSelect = (id: string) =>
    setSelected((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })

  const handleBulkApprove = async () => {
    const toApprove = pendingRequests.filter((r) => selected.has(r.id))
    if (toApprove.length === 0) return
    setBulkBusy(true)
    try {
      for (const r of toApprove) await approveOne(r)
      toast.success(`${toApprove.length} aanvragen goedgekeurd`)
      setSelected(new Set())
      load()
    } catch {
      toast.error('Bulk goedkeuren deels mislukt')
      load()
    } finally {
      setBulkBusy(false)
    }
  }

  const getName = (r: LeaveRequest) => r.user?.full_name ?? '—'

  const exportLeave = (kind: 'pdf' | 'excel') => {
    if (requests.length === 0) {
      toast.info('Geen verlofaanvragen om te exporteren')
      return
    }
    const orgName = organization?.name ?? 'ShiftSync'
    const label = `alle aanvragen ${YEAR}`
    try {
      if (kind === 'pdf') exportLeaveToPDF(requests, orgName, label)
      else exportLeaveToExcel(requests, orgName, label)
      toast.success(`Export naar ${kind === 'pdf' ? 'PDF' : 'Excel'} gestart`)
    } catch {
      toast.error('Export mislukt')
    }
  }

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <PageHeader
        title={isAdmin ? 'Verlofaanvragen' : 'Verlof'}
        subtitle={isAdmin ? 'Keur aanvragen goed of wijs ze af' : 'Dien verlof in en bekijk de status'}
        action={
          !isAdmin ? (
            <Button onClick={() => setShowForm(!showForm)} variant={showForm ? 'secondary' : 'primary'}>
              {showForm ? 'Annuleren' : 'Verlof aanvragen'}
            </Button>
          ) : hasFeature('export') ? (
            <div className="flex gap-2">
              <Button variant="secondary" size="sm" onClick={() => exportLeave('pdf')}>
                <FileText className="h-4 w-4" /> PDF
              </Button>
              <Button variant="secondary" size="sm" onClick={() => exportLeave('excel')}>
                <FileSpreadsheet className="h-4 w-4" /> Excel
              </Button>
            </div>
          ) : undefined
        }
      />

      {/* Employee balance overview */}
      {!isAdmin && leaveTypes.length > 0 && (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {leaveTypes.map((lt) => {
            const b = balanceByType.get(lt.id)
            return (
              <Card key={lt.id} className="flex items-center justify-between">
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ background: lt.color }} />
                    <p className="truncate text-sm font-medium" style={{ color: 'var(--text-primary)' }}>{lt.name}</p>
                  </div>
                  <p className="mt-1 text-xs" style={{ color: 'var(--text-muted)' }}>
                    {(b?.used ?? 0).toFixed(0)} u gebruikt van {(b?.balance ?? 0).toFixed(0)} u
                  </p>
                </div>
                <p className="text-lg font-bold tabular-nums" style={{ color: 'var(--text-primary)' }}>
                  {(b?.remaining ?? 0).toFixed(0)}<span className="text-xs font-normal" style={{ color: 'var(--text-muted)' }}> u</span>
                </p>
              </Card>
            )
          })}
        </div>
      )}

      {!isAdmin && showForm && (
        <Card>
          <CardHeader title="Nieuwe aanvraag" />
          <form onSubmit={handleSubmit} className="grid gap-4 sm:grid-cols-2">
            <Input label="Startdatum" type="date" value={form.start_date} onChange={(e) => setForm({ ...form, start_date: e.target.value })} required />
            <Input label="Einddatum" type="date" value={form.end_date} onChange={(e) => setForm({ ...form, end_date: e.target.value })} required />
            {leaveTypes.length > 0 && (
              <Select
                label="Verloftype"
                value={form.leave_type_id}
                onChange={(e) => setForm({ ...form, leave_type_id: e.target.value })}
                options={[{ value: '', label: 'Kies een type…' }, ...leaveTypes.map((lt) => ({ value: lt.id, label: lt.name }))]}
              />
            )}
            <Input
              label="Uren (schatting)"
              type="number"
              min={0}
              step="0.5"
              value={form.hours}
              onChange={(e) => setForm({ ...form, hours: e.target.value })}
              placeholder={estimatedHours ? String(estimatedHours) : '8'}
              hint={estimatedHours ? `Voorstel: ${estimatedHours} u (${estimatedHours / (profile?.contract_hours_per_week ? Number(profile.contract_hours_per_week) / 5 : 8)} werkdagen)` : undefined}
            />
            <div className="sm:col-span-2">
              <Input label="Reden" value={form.reason} onChange={(e) => setForm({ ...form, reason: e.target.value })} required placeholder="Bijv. vakantie, doktersbezoek" />
            </div>
            <Button type="submit" loading={submitting}>Indienen</Button>
          </form>
        </Card>
      )}

      {/* Bulk approve bar */}
      {isAdmin && pendingRequests.length > 0 && selected.size > 0 && (
        <Card className="flex flex-wrap items-center justify-between gap-3">
          <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>{selected.size} geselecteerd</p>
          <div className="flex gap-2">
            <Button size="sm" variant="secondary" onClick={() => setSelected(new Set())}>Wissen</Button>
            <Button size="sm" loading={bulkBusy} onClick={handleBulkApprove}>Geselecteerde goedkeuren</Button>
          </div>
        </Card>
      )}

      {loadError ? (
        <LoadError onRetry={load} />
      ) : loading ? (
        <ListSkeleton withHeader={false} />
      ) : requests.length === 0 ? (
        <Card>
          <EmptyState
            icon={Palmtree}
            title="Geen verlofaanvragen"
            description={isAdmin ? 'Er zijn momenteel geen openstaande verlofaanvragen.' : 'Je hebt nog geen verlof aangevraagd.'}
            action={!isAdmin ? (
              <Button onClick={() => setShowForm(true)}>Verlof aanvragen</Button>
            ) : undefined}
          />
        </Card>
      ) : (
        <div className="space-y-3">
          {requests.map((r) => {
            const conflictCount = conflicts[r.id] ?? 0
            return (
              <Card key={r.id}>
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div className="flex min-w-0 gap-3">
                    {isAdmin && r.status === 'pending' && (
                      <input
                        type="checkbox"
                        className="mt-1 h-4 w-4 shrink-0 accent-brand-500"
                        checked={selected.has(r.id)}
                        onChange={() => toggleSelect(r.id)}
                        aria-label={`Selecteer aanvraag van ${getName(r)}`}
                      />
                    )}
                    <div className="min-w-0">
                      {isAdmin && <p className="font-semibold" style={{ color: 'var(--text-primary)' }}>{getName(r)}</p>}
                      <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
                        {formatDate(r.start_date)} – {formatDate(r.end_date)}
                        {r.hours ? ` · ${Number(r.hours).toFixed(0)} u` : ''}
                      </p>
                      <p className="mt-1 flex items-center gap-2 text-sm" style={{ color: 'var(--text-secondary)' }}>
                        {r.leave_type && (
                          <span className="inline-flex items-center gap-1.5">
                            <span className="h-2 w-2 rounded-full" style={{ background: r.leave_type.color }} />
                            {r.leave_type.name}
                          </span>
                        )}
                        {r.reason && <span>· {r.reason}</span>}
                      </p>
                      {isAdmin && r.status === 'pending' && conflictCount > 0 && (
                        <p className="mt-2 inline-flex items-center gap-1.5 rounded-lg px-2 py-1 text-xs font-medium" style={{ background: 'rgba(245,158,11,0.12)', color: '#D97706' }}>
                          <AlertTriangle className="h-3.5 w-3.5" />
                          Let op: {conflictCount} ingeplande dienst{conflictCount > 1 ? 'en' : ''} in deze periode
                        </p>
                      )}
                      {r.manager_note && (
                        <p className="mt-2 text-xs italic" style={{ color: 'var(--text-disabled)' }}>Opmerking: {r.manager_note}</p>
                      )}
                    </div>
                  </div>
                  <div className="flex shrink-0 flex-col items-end gap-2">
                    <StatusBadge domain="leave" status={r.status} />
                    {isAdmin && r.status === 'pending' && rejectingId !== r.id && (
                      <div className="flex gap-2">
                        <Button size="sm" onClick={() => handleApprove(r)} loading={reviewingId === r.id}>
                          Goedkeuren
                        </Button>
                        <Button size="sm" variant="danger" onClick={() => setRejectingId(r.id)}>
                          Afwijzen
                        </Button>
                      </div>
                    )}
                  </div>
                </div>

                {rejectingId === r.id && (
                  <div className="mt-4 rounded-xl p-4 space-y-3" style={{ background: 'var(--surface-subtle)', border: '1px solid var(--border)' }}>
                    <Input
                      label="Reden afwijzing (optioneel)"
                      value={rejectNote}
                      onChange={(e) => setRejectNote(e.target.value)}
                      placeholder="Bijv. te druk die periode"
                    />
                    <div className="flex gap-2">
                      <Button size="sm" variant="danger" onClick={() => confirmReject(r)} loading={reviewingId === r.id}>
                        Bevestig afwijzing
                      </Button>
                      <Button size="sm" variant="secondary" onClick={() => { setRejectingId(null); setRejectNote('') }}>
                        Annuleren
                      </Button>
                    </div>
                  </div>
                )}
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}
