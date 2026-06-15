import { useCallback, useEffect, useMemo, useState } from 'react'
import { addDays, startOfDay, endOfDay } from 'date-fns'
import { useAuth } from '../context/AuthContext'
import { useToast } from '../context/ToastContext'
import { getShiftsForPeriod, getOpenShifts, claimOpenShift } from '../services/shifts'
import { getAllUsers } from '../services/users'
import type { Shift, User } from '../types/database'
import { Card, CardHeader } from '../components/ui/Card'
import { Button } from '../components/ui/Button'
import { Avatar } from '../components/ui/Avatar'
import { PageHeader } from '../components/ui/PageHeader'
import { EmptyState } from '../components/ui/EmptyState'
import { ListSkeleton } from '../components/ui/Skeleton'
import { LoadError } from '../components/ui/LoadError'
import { Users, Hand, ChevronLeft, ChevronRight, CalendarOff } from 'lucide-react'
import { formatDate, formatTime, getPositionColor } from '../lib/utils'

export function TeamPage() {
  const { profile } = useAuth()
  const toast = useToast()
  const [date, setDate] = useState(() => new Date())
  const [shifts, setShifts] = useState<Shift[]>([])
  const [openShifts, setOpenShifts] = useState<Shift[]>([])
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState(false)
  const [claimingId, setClaimingId] = useState<string | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    setLoadError(false)
    try {
      const [dayShifts, open, allUsers] = await Promise.all([
        getShiftsForPeriod(startOfDay(date), endOfDay(date), { publishedOnly: true }),
        getOpenShifts(startOfDay(date), addDays(startOfDay(date), 14)),
        getAllUsers().catch(() => []),
      ])
      setShifts(dayShifts.filter((s) => s.user_id))
      setOpenShifts(open)
      setUsers(allUsers)
    } catch {
      setLoadError(true)
    } finally {
      setLoading(false)
    }
  }, [date])

  useEffect(() => {
    load()
  }, [load])

  const userMap = useMemo(() => new Map(users.map((u) => [u.id, u])), [users])

  const handleClaim = async (shift: Shift) => {
    if (!profile) return
    setClaimingId(shift.id)
    try {
      await claimOpenShift(shift.id, profile.id)
      toast.success('Dienst opgepakt — staat nu in je rooster')
      load()
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Oppakken mislukt')
    } finally {
      setClaimingId(null)
    }
  }

  const isToday = startOfDay(date).getTime() === startOfDay(new Date()).getTime()

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <PageHeader title="Team" subtitle="Bekijk wie er werkt en pak open diensten op" />

      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <button onClick={() => setDate((d) => addDays(d, -1))} className="press inline-flex h-9 w-9 items-center justify-center rounded-xl" style={{ border: '1px solid var(--border)', color: 'var(--text-secondary)' }} aria-label="Vorige dag">
            <ChevronLeft className="h-4 w-4" />
          </button>
          <button onClick={() => setDate((d) => addDays(d, 1))} className="press inline-flex h-9 w-9 items-center justify-center rounded-xl" style={{ border: '1px solid var(--border)', color: 'var(--text-secondary)' }} aria-label="Volgende dag">
            <ChevronRight className="h-4 w-4" />
          </button>
          <p className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>
            {isToday ? 'Vandaag' : formatDate(date, 'EEEE d MMMM')}
          </p>
        </div>
        {!isToday && (
          <Button size="sm" variant="secondary" onClick={() => setDate(new Date())}>Vandaag</Button>
        )}
      </div>

      {loadError ? (
        <LoadError onRetry={load} />
      ) : loading ? (
        <ListSkeleton withHeader={false} />
      ) : (
        <>
          <Card>
            <CardHeader title={`Wie werkt ${isToday ? 'vandaag' : 'deze dag'}`} subtitle={`${shifts.length} ingeplande dienst${shifts.length === 1 ? '' : 'en'}`} />
            {shifts.length === 0 ? (
              <EmptyState icon={Users} title="Niemand ingepland" description="Er staan geen gepubliceerde diensten voor deze dag." />
            ) : (
              <div className="space-y-2">
                {shifts.map((s) => {
                  const u = s.user_id ? userMap.get(s.user_id) : undefined
                  const color = getPositionColor(s.position)
                  const mine = s.user_id === profile?.id
                  return (
                    <div key={s.id} className="flex items-center gap-3 rounded-xl p-3" style={{ background: 'var(--surface-subtle)' }}>
                      <Avatar name={u?.full_name ?? '?'} src={u?.avatar_url ?? undefined} size="sm" />
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
                          {u?.full_name ?? 'Medewerker'} {mine && <span className="text-xs" style={{ color: 'var(--brand-strong)' }}>· jij</span>}
                        </p>
                        <p className="text-xs" style={{ color: 'var(--text-muted)' }}>{formatTime(s.start_time)}–{formatTime(s.end_time)}</p>
                      </div>
                      <span className="rounded-full px-2.5 py-0.5 text-xs font-medium" style={{ background: color.bg, color: color.text, boxShadow: `0 0 0 1px ${color.border}` }}>
                        {s.position}
                      </span>
                    </div>
                  )
                })}
              </div>
            )}
          </Card>

          <Card>
            <CardHeader title="Open diensten" subtitle="Pak een dienst op die nog niemand heeft (komende 2 weken)" />
            {openShifts.length === 0 ? (
              <EmptyState icon={CalendarOff} title="Geen open diensten" description="Er zijn op dit moment geen open diensten om op te pakken." />
            ) : (
              <div className="space-y-2">
                {openShifts.map((s) => {
                  const color = getPositionColor(s.position)
                  return (
                    <div key={s.id} className="flex flex-wrap items-center justify-between gap-3 rounded-xl p-3" style={{ background: 'var(--surface-subtle)' }}>
                      <div className="flex items-center gap-3">
                        <span className="rounded-full px-2.5 py-0.5 text-xs font-medium" style={{ background: color.bg, color: color.text, boxShadow: `0 0 0 1px ${color.border}` }}>
                          {s.position}
                        </span>
                        <div>
                          <p className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>{formatDate(s.date, 'EEE d MMM')}</p>
                          <p className="text-xs" style={{ color: 'var(--text-muted)' }}>{formatTime(s.start_time)}–{formatTime(s.end_time)}</p>
                        </div>
                      </div>
                      <Button size="sm" loading={claimingId === s.id} onClick={() => handleClaim(s)}>
                        <Hand className="h-3.5 w-3.5" /> Oppakken
                      </Button>
                    </div>
                  )
                })}
              </div>
            )}
          </Card>
        </>
      )}
    </div>
  )
}
