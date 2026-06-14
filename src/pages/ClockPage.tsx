import { useEffect, useState } from 'react'
import { Clock, LogIn, LogOut, MapPin, Coffee, Play } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { useOrganization } from '../context/OrganizationContext'
import {
  getActiveClock,
  clockIn,
  clockOut,
  startBreak,
  endBreak,
  getAllClockRecords,
  getClockRecords,
  isOnBreak,
} from '../services/clock'
import { getPrimaryLocation } from '../services/locations'
import { getCurrentPosition } from '../lib/geo'
import type { ClockRecord, Location } from '../types/database'
import { Card, CardHeader } from '../components/ui/Card'
import { Button } from '../components/ui/Button'
import { Badge } from '../components/ui/Badge'
import { PageHeader } from '../components/ui/PageHeader'
import { EmptyState } from '../components/ui/EmptyState'
import { DashboardSkeleton } from '../components/ui/Skeleton'
import { Table, TableHead, TableHeaderCell, TableBody, TableRow, TableCell } from '../components/ui/Table'
import { formatDateTime } from '../lib/utils'

export function ClockPage() {
  const { profile, isAdmin } = useAuth()
  const { organization, hasFeature, plan } = useOrganization()
  const [active, setActive] = useState<ClockRecord | null>(null)
  const [records, setRecords] = useState<ClockRecord[]>([])
  const [location, setLocation] = useState<Location | null>(null)
  const [loading, setLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState(false)
  const [error, setError] = useState('')

  const gpsRequired = hasFeature('gps') && organization?.gps_enabled

  const load = async () => {
    setLoading(true)
    try {
      if (organization && hasFeature('gps')) {
        const loc = await getPrimaryLocation(organization.id)
        setLocation(loc)
      }
      if (isAdmin) {
        const data = await getAllClockRecords(30)
        setRecords(data)
      } else {
        const [activeClock, recent] = await Promise.all([
          getActiveClock(profile!.id),
          getClockRecords(profile!.id, 'week', new Date()),
        ])
        setActive(activeClock)
        setRecords(recent)
      }
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (profile) load()
  }, [profile, isAdmin, organization?.id])

  const handleClockIn = async () => {
    setError('')
    setActionLoading(true)
    try {
      let lat: number | undefined
      let lng: number | undefined

      if (gpsRequired) {
        if (!location) {
          throw new Error('Geen werkplek geconfigureerd. Vraag je manager om een locatie in te stellen.')
        }
        const pos = await getCurrentPosition()
        lat = pos.coords.latitude
        lng = pos.coords.longitude
        await clockIn(
          profile!.id,
          organization!.id,
          { lat, lng, locationId: location.id },
          { location, radiusMeters: organization!.gps_radius_meters ?? 100 }
        )
      } else {
        await clockIn(profile!.id, organization!.id)
      }
      await load()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Inklokken mislukt')
    } finally {
      setActionLoading(false)
    }
  }

  const handleClockOut = async () => {
    if (!active) return
    setError('')
    setActionLoading(true)
    try {
      if (isOnBreak(active)) await endBreak(active.id)
      await clockOut(active.id)
      await load()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Uitklokken mislukt')
    } finally {
      setActionLoading(false)
    }
  }

  const handleBreakToggle = async () => {
    if (!active) return
    setActionLoading(true)
    setError('')
    try {
      if (isOnBreak(active)) {
        const updated = await endBreak(active.id)
        setActive(updated)
      } else {
        const updated = await startBreak(active.id)
        setActive(updated)
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Pauze mislukt')
    } finally {
      setActionLoading(false)
    }
  }

  if (loading) return <DashboardSkeleton />

  if (isAdmin) {
    return (
      <div className="mx-auto max-w-6xl space-y-6">
        <PageHeader title="Klokregistratie" subtitle="Live overzicht van in- en uitkloktijden" />
        <Card>
          <CardHeader title="Recente registraties" subtitle={`${records.filter((r) => !r.clock_out).length} actief`} />
          {records.length === 0 ? (
            <EmptyState icon={Clock} title="Geen registraties" description="Klokregistraties verschijnen hier zodra medewerkers inklokken." />
          ) : (
            <Table>
              <TableHead>
                <TableHeaderCell>Medewerker</TableHeaderCell>
                <TableHeaderCell>Ingeklokt</TableHeaderCell>
                <TableHeaderCell>Uitgeklokt</TableHeaderCell>
                <TableHeaderCell>Uren</TableHeaderCell>
                <TableHeaderCell>Status</TableHeaderCell>
              </TableHead>
              <TableBody>
                {records.map((r) => (
                  <TableRow key={r.id}>
                    <TableCell className="font-medium" style={{ color: 'var(--text-primary)' }}>
                      {(r.user as { full_name?: string })?.full_name ?? '—'}
                    </TableCell>
                    <TableCell>{formatDateTime(r.clock_in)}</TableCell>
                    <TableCell>{r.clock_out ? formatDateTime(r.clock_out) : '—'}</TableCell>
                    <TableCell>{r.total_hours ?? '—'}</TableCell>
                    <TableCell>
                      <Badge variant={r.clock_out ? 'completed' : isOnBreak(r) ? 'pending' : 'active'}>
                        {r.clock_out ? 'Afgerond' : isOnBreak(r) ? 'Pauze' : 'Actief'}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </Card>
      </div>
    )
  }

  const onBreak = active ? isOnBreak(active) : false

  return (
    <div className="mx-auto max-w-lg space-y-6">
      <PageHeader title="In-/Uitklokken" subtitle="Registreer je gewerkte uren" />

      <Card className="overflow-hidden p-0">
        <div
          className="px-6 py-8 text-center"
          style={{
            background: onBreak
              ? 'linear-gradient(180deg, rgba(245,158,11,0.1) 0%, transparent 100%)'
              : active
                ? 'linear-gradient(180deg, rgba(16,185,129,0.08) 0%, transparent 100%)'
                : 'linear-gradient(180deg, rgba(59,130,246,0.08) 0%, transparent 100%)',
          }}
        >
          <div
            className="mx-auto mb-5 flex h-20 w-20 items-center justify-center rounded-2xl"
            style={{
              background: onBreak ? 'rgba(245,158,11,0.15)' : active ? 'rgba(16,185,129,0.15)' : 'rgba(59,130,246,0.12)',
            }}
          >
            <Clock className="h-10 w-10" style={{ color: onBreak ? '#F59E0B' : active ? '#10B981' : '#3B82F6' }} />
          </div>

          {active ? (
            <>
              <Badge variant={onBreak ? 'pending' : 'active'} className="mb-2">
                {onBreak ? 'Pauze' : 'Actief'}
              </Badge>
              <p className="text-lg font-semibold" style={{ color: 'var(--text-primary)' }}>
                {onBreak ? 'Pauze actief' : 'Ingeklokt'}
              </p>
              <p className="mt-1 text-sm" style={{ color: 'var(--text-muted)' }}>
                Sinds {formatDateTime(active.clock_in)}
                {(active.total_break_minutes ?? 0) > 0 && ` · ${active.total_break_minutes} min pauze`}
              </p>
              <div className="mx-auto mt-6 flex max-w-xs flex-col gap-2">
                <Button size="lg" variant="secondary" loading={actionLoading} onClick={handleBreakToggle}>
                  {onBreak ? (
                    <>
                      <Play className="h-5 w-5" /> Pauze stoppen
                    </>
                  ) : (
                    <>
                      <Coffee className="h-5 w-5" /> Pauze starten
                    </>
                  )}
                </Button>
                <Button size="lg" variant="danger" loading={actionLoading} onClick={handleClockOut}>
                  <LogOut className="h-5 w-5" /> Uitklokken
                </Button>
              </div>
            </>
          ) : (
            <>
              <p className="text-lg font-semibold" style={{ color: 'var(--text-primary)' }}>Klaar om te starten?</p>
              <p className="mt-1 text-sm" style={{ color: 'var(--text-muted)' }}>
                {gpsRequired
                  ? `GPS-controle actief — binnen ${organization?.gps_radius_meters ?? 100}m van ${location?.name ?? 'werkplek'}`
                  : 'Klok in wanneer je dienst begint'}
              </p>
              <Button size="lg" loading={actionLoading} onClick={handleClockIn} className="mt-6 w-full max-w-xs">
                <LogIn className="h-5 w-5" /> Inklokken
              </Button>
            </>
          )}

          {error && (
            <p
              className="mx-auto mt-4 max-w-xs rounded-xl px-4 py-3 text-sm text-red-600"
              style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)' }}
            >
              {error}
            </p>
          )}
        </div>

        {plan !== 'business' && (
          <div className="flex items-center gap-3 border-t px-5 py-4" style={{ borderColor: 'var(--border)', background: 'var(--surface-subtle)' }}>
            <MapPin className="h-4 w-4 shrink-0" style={{ color: 'var(--text-muted)' }} />
            <p className="flex-1 text-xs" style={{ color: 'var(--text-muted)' }}>
              GPS-controle bij inklokken — beschikbaar op Business
            </p>
            <Badge variant="business">Business</Badge>
          </div>
        )}
      </Card>

      <Card>
        <CardHeader title="Deze week" subtitle={`${records.length} registratie${records.length !== 1 ? 's' : ''}`} />
        {records.length === 0 ? (
          <EmptyState icon={Clock} title="Nog geen uren" description="Je registraties verschijnen hier na je eerste klok actie." />
        ) : (
          <ul className="space-y-2">
            {records.map((r) => (
              <li
                key={r.id}
                className="flex items-center justify-between rounded-xl px-4 py-3 text-sm"
                style={{ background: 'var(--surface-subtle)', border: '1px solid var(--border)' }}
              >
                <span style={{ color: 'var(--text-secondary)' }}>{formatDateTime(r.clock_in)}</span>
                <span className="font-semibold" style={{ color: 'var(--text-primary)' }}>
                  {r.total_hours != null ? `${r.total_hours} uur` : 'Actief'}
                </span>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </div>
  )
}
