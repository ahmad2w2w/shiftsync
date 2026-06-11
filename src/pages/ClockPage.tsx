import { useEffect, useState } from 'react'
import { Clock, LogIn, LogOut } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { useOrganization } from '../context/OrganizationContext'
import { getActiveClock, clockIn, clockOut, getAllClockRecords, getClockRecords } from '../services/clock'
import type { ClockRecord } from '../types/database'
import { Card, CardHeader } from '../components/ui/Card'
import { Button } from '../components/ui/Button'
import { LoadingSpinner } from '../components/ui/LoadingSpinner'
import { Badge } from '../components/ui/Badge'
import { formatDateTime } from '../lib/utils'

export function ClockPage() {
  const { profile, isAdmin } = useAuth()
  const { organization } = useOrganization()
  const [active, setActive] = useState<ClockRecord | null>(null)
  const [records, setRecords] = useState<ClockRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState(false)
  const [error, setError] = useState('')

  const load = async () => {
    setLoading(true)
    try {
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
  }, [profile, isAdmin])

  const handleClockIn = async () => {
    setError('')
    setActionLoading(true)
    try {
      await clockIn(profile!.id, organization!.id)
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
      await clockOut(active.id)
      await load()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Uitklokken mislukt')
    } finally {
      setActionLoading(false)
    }
  }

  if (loading) return <LoadingSpinner />

  if (isAdmin) {
    return (
      <div className="space-y-5">
        <div>
          <h1 className="text-xl font-bold text-zinc-100">Klokregistratie</h1>
          <p className="text-sm text-zinc-500">Controleer in- en uitkloktijden</p>
        </div>
        <Card>
          <CardHeader title="Recente registraties" />
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-white/8 text-left">
                  <th className="pb-3 pr-4 text-xs font-semibold uppercase tracking-wide text-zinc-600">Medewerker</th>
                  <th className="pb-3 pr-4 text-xs font-semibold uppercase tracking-wide text-zinc-600">Ingeklokt</th>
                  <th className="pb-3 pr-4 text-xs font-semibold uppercase tracking-wide text-zinc-600">Uitgeklokt</th>
                  <th className="pb-3 pr-4 text-xs font-semibold uppercase tracking-wide text-zinc-600">Uren</th>
                  <th className="pb-3 text-xs font-semibold uppercase tracking-wide text-zinc-600">Status</th>
                </tr>
              </thead>
              <tbody>
                {records.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-8 text-center text-sm text-zinc-600">Geen registraties</td>
                  </tr>
                ) : (
                  records.map((r) => (
                    <tr key={r.id} className="border-b border-white/5 last:border-0">
                      <td className="py-3 pr-4 font-medium text-zinc-200">
                        {(r.user as { full_name?: string })?.full_name ?? '—'}
                      </td>
                      <td className="py-3 pr-4 text-zinc-400">{formatDateTime(r.clock_in)}</td>
                      <td className="py-3 pr-4 text-zinc-400">{r.clock_out ? formatDateTime(r.clock_out) : '—'}</td>
                      <td className="py-3 pr-4 text-zinc-300">{r.total_hours ?? '—'}</td>
                      <td className="py-3">
                        <Badge variant={r.clock_out ? 'completed' : 'active'}>
                          {r.clock_out ? 'Afgerond' : 'Actief'}
                        </Badge>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-xl font-bold text-zinc-100">In-/Uitklokken</h1>
        <p className="text-sm text-zinc-500">Registreer je gewerkte uren</p>
      </div>

      <Card className="text-center">
        <div
          className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-full"
          style={{ background: active ? 'rgba(16,185,129,0.15)' : 'rgba(37,99,235,0.15)' }}
        >
          <Clock className={`h-8 w-8 ${active ? 'text-emerald-400' : 'text-brand-400'}`} />
        </div>

        {active ? (
          <>
            <Badge variant="active" className="mb-3">
              Ingeklokt sinds {formatDateTime(active.clock_in)}
            </Badge>
            <p className="mb-6 text-sm text-zinc-500">Je bent momenteel aan het werk</p>
            <Button size="lg" variant="danger" loading={actionLoading} onClick={handleClockOut}>
              <LogOut className="h-5 w-5" />
              Uitklokken
            </Button>
          </>
        ) : (
          <>
            <p className="mb-6 text-sm text-zinc-500">Nog niet ingeklokt vandaag</p>
            <Button size="lg" loading={actionLoading} onClick={handleClockIn}>
              <LogIn className="h-5 w-5" />
              Inklokken
            </Button>
          </>
        )}

        {error && (
          <p className="mt-4 rounded-xl px-4 py-3 text-sm text-red-400" style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)' }}>
            {error}
          </p>
        )}
      </Card>

      <Card>
        <CardHeader title="Recente registraties" />
        <ul className="divide-y divide-white/6">
          {records.length === 0 ? (
            <li className="py-4 text-center text-sm text-zinc-600">Geen registraties</li>
          ) : (
            records.map((r) => (
              <li key={r.id} className="flex justify-between py-3 text-sm">
                <span className="text-zinc-400">{formatDateTime(r.clock_in)}</span>
                <span className="font-medium text-zinc-200">
                  {r.total_hours != null ? `${r.total_hours} uur` : 'Actief'}
                </span>
              </li>
            ))
          )}
        </ul>
      </Card>
    </div>
  )
}
