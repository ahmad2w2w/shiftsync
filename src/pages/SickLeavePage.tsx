import { useEffect, useState, type FormEvent } from 'react'
import { Thermometer, CheckCircle } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { useOrganization } from '../context/OrganizationContext'
import { useToast } from '../context/ToastContext'
import { getSickReports, reportSick, resolveSickReport } from '../services/sick'
import { getShiftsForPeriod } from '../services/shifts'
import { notifyAdmins } from '../services/notifications'
import { exportSickToPDF, exportSickToExcel } from '../services/export'
import type { SickReport } from '../types/database'
import { Card, CardHeader } from '../components/ui/Card'
import { Button } from '../components/ui/Button'
import { Input } from '../components/ui/Input'
import { StatusBadge } from '../components/ui/StatusBadge'
import { PageHeader } from '../components/ui/PageHeader'
import { EmptyState } from '../components/ui/EmptyState'
import { ListSkeleton } from '../components/ui/Skeleton'
import { LoadError } from '../components/ui/LoadError'
import { AlertTriangle, FileText, FileSpreadsheet } from 'lucide-react'
import { formatDate, parseISO } from '../lib/utils'
import { addDays } from 'date-fns'

export function SickLeavePage() {
  const { profile, isAdmin } = useAuth()
  const { organization, hasFeature } = useOrganization()
  const toast = useToast()
  const [reports, setReports] = useState<SickReport[]>([])
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState(false)
  const [showForm, setShowForm] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [resolvingId, setResolvingId] = useState<string | null>(null)
  const [conflicts, setConflicts] = useState<Record<string, number>>({})
  const [form, setForm] = useState({ start_date: new Date().toISOString().slice(0, 10), note: '' })

  const load = async () => {
    setLoading(true)
    setLoadError(false)
    try {
      const data = await getSickReports(isAdmin ? undefined : profile!.id)
      setReports(data)
      if (isAdmin) {
        const active = data.filter((r) => r.status === 'active')
        const entries = await Promise.all(
          active.map(async (r) => {
            try {
              const start = parseISO(r.start_date)
              const shifts = await getShiftsForPeriod(start, addDays(start, 14), { userId: r.user_id, publishedOnly: true })
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
  }

  useEffect(() => {
    if (profile) load()
  }, [profile, isAdmin])

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    if (!profile || !organization) return
    setSubmitting(true)
    try {
      await reportSick({
        organization_id: organization.id,
        user_id: profile.id,
        start_date: form.start_date,
        note: form.note || null,
      })
      await notifyAdmins(organization.id, {
        type: 'sick_reported',
        title: 'Nieuwe ziekmelding',
        body: `${profile.full_name} heeft zich ziek gemeld vanaf ${formatDate(form.start_date)}.`,
        link: '/app/ziek',
      }).catch(() => {})
      toast.success('Ziekmelding verstuurd. Je manager is op de hoogte gebracht.')
      setForm({ start_date: new Date().toISOString().slice(0, 10), note: '' })
      setShowForm(false)
      load()
    } catch {
      toast.error('Ziekmelding mislukt')
    } finally {
      setSubmitting(false)
    }
  }

  const handleResolve = async (r: SickReport) => {
    setResolvingId(r.id)
    try {
      await resolveSickReport(r.id)
      toast.success('Ziekmelding afgerond')
      load()
    } catch {
      toast.error('Kon status niet bijwerken')
    } finally {
      setResolvingId(null)
    }
  }

  const getName = (r: SickReport) => (r.user as { full_name?: string })?.full_name ?? '—'
  const activeCount = reports.filter((r) => r.status === 'active').length

  const exportSick = (kind: 'pdf' | 'excel') => {
    if (reports.length === 0) {
      toast.info('Geen ziekmeldingen om te exporteren')
      return
    }
    const orgName = organization?.name ?? 'ShiftSync'
    const label = `alle meldingen ${new Date().getFullYear()}`
    try {
      if (kind === 'pdf') exportSickToPDF(reports, orgName, label)
      else exportSickToExcel(reports, orgName, label)
      toast.success(`Export naar ${kind === 'pdf' ? 'PDF' : 'Excel'} gestart`)
    } catch {
      toast.error('Export mislukt')
    }
  }

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <PageHeader
        title={isAdmin ? 'Ziekmeldingen' : 'Ziekmelden'}
        subtitle={
          isAdmin
            ? `${activeCount} actieve melding${activeCount !== 1 ? 'en' : ''}`
            : 'Meld je ziek en informeer je manager direct'
        }
        action={
          !isAdmin ? (
            <Button onClick={() => setShowForm(!showForm)} variant={showForm ? 'secondary' : 'primary'}>
              {showForm ? 'Annuleren' : 'Ziekmelden'}
            </Button>
          ) : hasFeature('export') ? (
            <div className="flex gap-2">
              <Button variant="secondary" size="sm" onClick={() => exportSick('pdf')}>
                <FileText className="h-4 w-4" /> PDF
              </Button>
              <Button variant="secondary" size="sm" onClick={() => exportSick('excel')}>
                <FileSpreadsheet className="h-4 w-4" /> Excel
              </Button>
            </div>
          ) : undefined
        }
      />

      {!isAdmin && showForm && (
        <Card>
          <CardHeader title="Nieuwe ziekmelding" subtitle="Je manager ziet dit in het dashboard" />
          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              label="Startdatum"
              type="date"
              value={form.start_date}
              onChange={(e) => setForm({ ...form, start_date: e.target.value })}
              required
            />
            <Input
              label="Toelichting (optioneel)"
              value={form.note}
              onChange={(e) => setForm({ ...form, note: e.target.value })}
              placeholder="Bijv. griep, verwacht terug over 2 dagen"
            />
            <Button type="submit" loading={submitting}>Melding versturen</Button>
          </form>
        </Card>
      )}

      {loadError ? (
        <LoadError onRetry={load} />
      ) : loading ? (
        <ListSkeleton withHeader={false} />
      ) : reports.length === 0 ? (
        <Card>
          <EmptyState
            icon={Thermometer}
            title="Geen ziekmeldingen"
            description={
              isAdmin
                ? 'Er zijn momenteel geen ziekmeldingen geregistreerd.'
                : 'Meld je ziek als je niet kunt werken. Je manager wordt direct geïnformeerd.'
            }
            action={!isAdmin ? <Button onClick={() => setShowForm(true)}>Ziekmelden</Button> : undefined}
          />
        </Card>
      ) : (
        <div className="space-y-3">
          {reports.map((r) => (
            <Card key={r.id}>
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div className="min-w-0">
                  {isAdmin && (
                    <p className="font-semibold" style={{ color: 'var(--text-primary)' }}>{getName(r)}</p>
                  )}
                  <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
                    Sinds {formatDate(r.start_date)}
                    {r.end_date ? ` · tot ${formatDate(r.end_date)}` : ''}
                  </p>
                  {r.note && (
                    <p className="mt-1 text-sm" style={{ color: 'var(--text-secondary)' }}>{r.note}</p>
                  )}
                  {isAdmin && r.status === 'active' && (conflicts[r.id] ?? 0) > 0 && (
                    <p className="mt-2 inline-flex items-center gap-1.5 rounded-lg px-2 py-1 text-xs font-medium" style={{ background: 'rgba(245,158,11,0.12)', color: '#D97706' }}>
                      <AlertTriangle className="h-3.5 w-3.5" />
                      {conflicts[r.id]} ingeplande dienst{conflicts[r.id] > 1 ? 'en' : ''} de komende 2 weken — herplan deze
                    </p>
                  )}
                </div>
                <div className="flex shrink-0 flex-col items-end gap-2">
                  <StatusBadge domain="sick" status={r.status} />
                  {isAdmin && r.status === 'active' && (
                    <Button size="sm" variant="secondary" loading={resolvingId === r.id} onClick={() => handleResolve(r)}>
                      <CheckCircle className="h-4 w-4" />
                      Markeer als hersteld
                    </Button>
                  )}
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
