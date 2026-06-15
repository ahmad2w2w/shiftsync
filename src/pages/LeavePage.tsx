import { useEffect, useState, type FormEvent } from 'react'
import { useAuth } from '../context/AuthContext'
import { useOrganization } from '../context/OrganizationContext'
import { useToast } from '../context/ToastContext'
import { getLeaveRequests, createLeaveRequest, updateLeaveStatus } from '../services/leave'
import { notifyLeaveDecision, createNotification } from '../services/notifications'
import type { LeaveRequest } from '../types/database'
import { Card, CardHeader } from '../components/ui/Card'
import { Button } from '../components/ui/Button'
import { Input } from '../components/ui/Input'
import { Badge } from '../components/ui/Badge'
import { PageHeader } from '../components/ui/PageHeader'
import { EmptyState } from '../components/ui/EmptyState'
import { DashboardSkeleton } from '../components/ui/Skeleton'
import { LoadError } from '../components/ui/LoadError'
import { Palmtree } from 'lucide-react'
import { formatDate, leaveStatusLabel } from '../lib/utils'

export function LeavePage() {
  const { profile, isAdmin } = useAuth()
  const { organization, hasFeature } = useOrganization()
  const toast = useToast()
  const [requests, setRequests] = useState<LeaveRequest[]>([])
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState(false)
  const [form, setForm] = useState({ start_date: '', end_date: '', reason: '' })
  const [submitting, setSubmitting] = useState(false)
  const [showForm, setShowForm] = useState(false)
  const [reviewingId, setReviewingId] = useState<string | null>(null)
  const [rejectNote, setRejectNote] = useState('')
  const [rejectingId, setRejectingId] = useState<string | null>(null)

  const load = async () => {
    setLoading(true)
    setLoadError(false)
    try {
      const data = await getLeaveRequests(isAdmin ? undefined : profile!.id)
      setRequests(data)
    } catch {
      setLoadError(true)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (profile) load()
  }, [profile, isAdmin])

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    if (!profile || !organization) return
    setSubmitting(true)
    try {
      await createLeaveRequest({ user_id: profile.id, organization_id: organization.id, ...form })
      setForm({ start_date: '', end_date: '', reason: '' })
      setShowForm(false)
      toast.success('Verlofaanvraag ingediend')
      load()
    } catch {
      toast.error('Indienen mislukt. Probeer opnieuw.')
    } finally {
      setSubmitting(false)
    }
  }

  const handleApprove = async (r: LeaveRequest) => {
    setReviewingId(r.id)
    try {
      await updateLeaveStatus(r.id, 'approved')
      if (organization) {
        await createNotification({
          organizationId: organization.id,
          userId: r.user_id,
          type: 'leave_approved',
          title: 'Verlof goedgekeurd',
          body: `${formatDate(r.start_date)} – ${formatDate(r.end_date)} is goedgekeurd.`,
          link: '/app/verlof',
        }).catch(() => {})
      }
      if (hasFeature('notifications') && r.user) {
        const user = r.user as { email?: string; full_name?: string }
        if (user.email) {
          await notifyLeaveDecision(user.email, user.full_name ?? 'Medewerker', 'approved', formatDate(r.start_date), formatDate(r.end_date))
        }
      }
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
      if (hasFeature('notifications') && r.user) {
        const user = r.user as { email?: string; full_name?: string }
        if (user.email) {
          await notifyLeaveDecision(user.email, user.full_name ?? 'Medewerker', 'rejected', formatDate(r.start_date), formatDate(r.end_date), rejectNote || undefined)
        }
      }
      setRejectingId(null)
      setRejectNote('')
      load()
    } finally {
      setReviewingId(null)
    }
  }

  const getName = (r: LeaveRequest) => (r.user as { full_name?: string })?.full_name ?? '—'

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
          ) : undefined
        }
      />

      {!isAdmin && showForm && (
        <Card>
          <CardHeader title="Nieuwe aanvraag" />
          <form onSubmit={handleSubmit} className="grid gap-4 sm:grid-cols-2">
            <Input label="Startdatum" type="date" value={form.start_date} onChange={(e) => setForm({ ...form, start_date: e.target.value })} required />
            <Input label="Einddatum" type="date" value={form.end_date} onChange={(e) => setForm({ ...form, end_date: e.target.value })} required />
            <div className="sm:col-span-2">
              <Input label="Reden" value={form.reason} onChange={(e) => setForm({ ...form, reason: e.target.value })} required placeholder="Bijv. vakantie, doktersbezoek" />
            </div>
            <Button type="submit" loading={submitting}>Indienen</Button>
          </form>
        </Card>
      )}

      {loadError ? (
        <LoadError onRetry={load} />
      ) : loading ? (
        <DashboardSkeleton />
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
          {requests.map((r) => (
              <Card key={r.id}>
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div className="min-w-0">
                    {isAdmin && <p className="font-semibold" style={{ color: 'var(--text-primary)' }}>{getName(r)}</p>}
                    <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
                      {formatDate(r.start_date)} – {formatDate(r.end_date)}
                    </p>
                    <p className="mt-1 text-sm" style={{ color: 'var(--text-secondary)' }}>{r.reason}</p>
                    {r.manager_note && (
                      <p className="mt-2 text-xs italic" style={{ color: 'var(--text-disabled)' }}>Opmerking: {r.manager_note}</p>
                    )}
                  </div>
                  <div className="flex shrink-0 flex-col items-end gap-2">
                    <Badge variant={r.status}>{leaveStatusLabel[r.status]}</Badge>
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
          ))}
        </div>
      )}
    </div>
  )
}
