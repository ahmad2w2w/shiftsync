import { useEffect, useState, type FormEvent } from 'react'
import { Thermometer, CheckCircle } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { useOrganization } from '../context/OrganizationContext'
import { useToast } from '../context/ToastContext'
import { getSickReports, reportSick, resolveSickReport } from '../services/sick'
import type { SickReport } from '../types/database'
import { Card, CardHeader } from '../components/ui/Card'
import { Button } from '../components/ui/Button'
import { Input } from '../components/ui/Input'
import { Badge } from '../components/ui/Badge'
import { PageHeader } from '../components/ui/PageHeader'
import { EmptyState } from '../components/ui/EmptyState'
import { DashboardSkeleton } from '../components/ui/Skeleton'
import { formatDate, sickStatusLabel } from '../lib/utils'

export function SickLeavePage() {
  const { profile, isAdmin } = useAuth()
  const { organization } = useOrganization()
  const toast = useToast()
  const [reports, setReports] = useState<SickReport[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [resolvingId, setResolvingId] = useState<string | null>(null)
  const [form, setForm] = useState({ start_date: new Date().toISOString().slice(0, 10), note: '' })

  const load = async () => {
    setLoading(true)
    try {
      const data = await getSickReports(isAdmin ? undefined : profile!.id)
      setReports(data)
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

      {loading ? (
        <DashboardSkeleton />
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
                </div>
                <div className="flex shrink-0 flex-col items-end gap-2">
                  <Badge variant={r.status === 'active' ? 'rejected' : 'approved'}>
                    {sickStatusLabel[r.status]}
                  </Badge>
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
