import { useCallback, useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { Calendar, Clock, Palmtree, ChevronRight, CalendarCheck, ArrowRight, CalendarDays } from 'lucide-react'
import { differenceInCalendarDays, parseISO } from 'date-fns'
import { useAuth } from '../context/AuthContext'
import { useOrganization } from '../context/OrganizationContext'
import { getShiftsForWeek } from '../services/shifts'
import { getActiveClock, getClockRecords, sumHours } from '../services/clock'
import { getLeaveRequests } from '../services/leave'
import type { Shift, ClockRecord, LeaveRequest } from '../types/database'
import { Card, CardHeader } from '../components/ui/Card'
import { Badge } from '../components/ui/Badge'
import { Button } from '../components/ui/Button'
import { PageHeader } from '../components/ui/PageHeader'
import { EmptyState } from '../components/ui/EmptyState'
import { DashboardSkeleton } from '../components/ui/Skeleton'
import { LoadError } from '../components/ui/LoadError'
import { ProgressRing } from '../components/charts/ProgressRing'
import { shiftHours } from '../lib/plannerEngine'
import { getWeekRange, formatDate, formatTime, leaveStatusLabel, getPositionColor } from '../lib/utils'

function relativeDay(date: string) {
  const diff = differenceInCalendarDays(parseISO(date), new Date())
  if (diff === 0) return 'Vandaag'
  if (diff === 1) return 'Morgen'
  if (diff > 1 && diff < 7) return `Over ${diff} dagen`
  return formatDate(date, 'EEEE d MMM')
}

export function EmployeeDashboard() {
  const { profile } = useAuth()
  const { organization } = useOrganization()
  const [shifts, setShifts] = useState<Shift[]>([])
  const [activeClock, setActiveClock] = useState<ClockRecord | null>(null)
  const [weekHours, setWeekHours] = useState(0)
  const [leave, setLeave] = useState<LeaveRequest[]>([])
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState(false)

  const load = useCallback(async () => {
    if (!profile) return
    setLoading(true)
    setLoadError(false)
    const { start, end } = getWeekRange(new Date())
    try {
      const [s, clock, records, l] = await Promise.all([
        getShiftsForWeek(start, end, { userId: profile.id, publishedOnly: true }),
        getActiveClock(profile.id),
        getClockRecords(profile.id, 'week', new Date()),
        getLeaveRequests(profile.id),
      ])
      setShifts(s)
      setActiveClock(clock)
      setWeekHours(sumHours(records))
      setLeave(l.filter((r) => r.status === 'pending').slice(0, 3))
    } catch {
      setLoadError(true)
    } finally {
      setLoading(false)
    }
  }, [profile])

  useEffect(() => {
    load()
  }, [load])

  const firstName = profile?.full_name?.split(' ')[0] ?? 'daar'

  const todayStr = useMemo(() => new Date().toISOString().slice(0, 10), [])
  const upcoming = useMemo(
    () => [...shifts].filter((s) => s.date >= todayStr).sort((a, b) => (a.date + a.start_time).localeCompare(b.date + b.start_time)),
    [shifts, todayStr]
  )
  const nextShift = upcoming[0]
  const scheduledHours = useMemo(() => shifts.reduce((sum, s) => sum + shiftHours(s.start_time, s.end_time), 0), [shifts])

  if (loading) return <DashboardSkeleton />
  if (loadError) return <LoadError onRetry={load} />

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <PageHeader title={`Hoi, ${firstName}!`} subtitle={organization?.name} />

      <div className="grid gap-4 lg:grid-cols-3">
        {/* Next shift hero */}
        <div className="lg:col-span-2">
          {nextShift ? (
            <div className="relative h-full overflow-hidden rounded-2xl p-5" style={{ background: 'var(--surface-card)', border: '1px solid var(--border)', boxShadow: 'var(--shadow-1)' }}>
              <div className="absolute left-0 top-0 h-full w-1" style={{ background: 'var(--brand-strong)' }} />
              <div className="relative">
                <p className="text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--brand-strong)' }}>Volgende dienst</p>
                <p className="mt-1 text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>{relativeDay(nextShift.date)}</p>
                <div className="mt-4 flex flex-wrap items-center gap-x-6 gap-y-2">
                  <span className="flex items-center gap-2 text-sm" style={{ color: 'var(--text-secondary)' }}>
                    <Clock className="h-4 w-4" style={{ color: 'var(--text-muted)' }} />
                    <span className="font-semibold tabular-nums">{formatTime(nextShift.start_time)} – {formatTime(nextShift.end_time)}</span>
                  </span>
                  <span className="flex items-center gap-2 text-sm capitalize" style={{ color: 'var(--text-secondary)' }}>
                    <Calendar className="h-4 w-4" style={{ color: 'var(--text-muted)' }} />
                    {formatDate(nextShift.date, 'EEEE d MMMM')}
                  </span>
                  <span className="rounded-full px-2.5 py-0.5 text-xs font-semibold" style={{ background: 'var(--brand-muted)', color: 'var(--brand-strong)' }}>{nextShift.position}</span>
                </div>
                <Link to="/app/rooster" className="mt-5 inline-flex items-center gap-1.5 rounded-xl px-4 py-2 text-sm font-semibold transition-colors" style={{ background: 'var(--brand-muted)', color: 'var(--brand-strong)' }}>
                  Volledig rooster <ArrowRight className="h-4 w-4" />
                </Link>
              </div>
            </div>
          ) : (
            <Card className="flex h-full flex-col items-center justify-center text-center" elevation={1}>
              <EmptyState
                icon={CalendarDays}
                title="Geen geplande diensten"
                description="Zodra je manager het rooster publiceert, verschijnt je volgende dienst hier."
                action={<Link to="/app/beschikbaarheid"><Button variant="secondary" size="sm">Beschikbaarheid invullen</Button></Link>}
              />
            </Card>
          )}
        </div>

        {/* Hours ring */}
        <Card className="flex flex-col items-center justify-center gap-2 text-center">
          <p className="text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>Deze week</p>
          <ProgressRing value={weekHours} max={scheduledHours || Math.max(weekHours, 1)} size={120} color="var(--brand)">
            <p className="text-2xl font-bold tabular-nums" style={{ color: 'var(--text-primary)' }}>{weekHours.toFixed(1)}u</p>
            <p className="text-[11px]" style={{ color: 'var(--text-muted)' }}>gewerkt</p>
          </ProgressRing>
          <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
            {scheduledHours > 0 ? `van ${scheduledHours.toFixed(0)}u gepland` : 'Nog niets gepland'}
          </p>
        </Card>
      </div>

      {/* Clock status */}
      <Link to="/app/klok">
        <div
          className="flex items-center justify-between rounded-2xl px-5 py-4 transition-all hover:-translate-y-0.5 hover:shadow-[var(--shadow-3)]"
          style={
            activeClock
              ? { background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.25)' }
              : { background: 'var(--surface-card)', border: '1px solid var(--border)', boxShadow: 'var(--shadow-1)' }
          }
        >
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl" style={{ background: activeClock ? 'rgba(16,185,129,0.15)' : 'var(--brand-muted)' }}>
              <Clock className="h-5 w-5" style={{ color: activeClock ? '#10B981' : 'var(--brand-strong)' }} />
            </div>
            <div>
              <p className="font-semibold" style={{ color: activeClock ? '#059669' : 'var(--text-primary)' }}>
                {activeClock ? 'Je bent ingeklokt' : 'Klaar om te beginnen?'}
              </p>
              <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
                {activeClock ? 'Vergeet niet uit te klokken na je dienst.' : 'Klok in wanneer je dienst start.'}
              </p>
            </div>
          </div>
          {activeClock ? <ChevronRight className="h-5 w-5" style={{ color: '#10B981' }} /> : <Button size="sm">Inklokken</Button>}
        </div>
      </Link>

      {/* Quick actions */}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {[
          { to: '/app/rooster', label: 'Mijn rooster', icon: Calendar, desc: `${shifts.length} deze week`, color: '#3B82F6', bg: 'rgba(59,130,246,0.12)' },
          { to: '/app/beschikbaarheid', label: 'Beschikbaarheid', icon: CalendarCheck, desc: 'Geef door wanneer je kunt', color: '#10B981', bg: 'rgba(16,185,129,0.12)' },
          { to: '/app/verlof', label: 'Verlof', icon: Palmtree, desc: `${leave.length} openstaand`, color: '#8B5CF6', bg: 'rgba(139,92,246,0.12)' },
          { to: '/app/uren', label: 'Mijn uren', icon: Clock, desc: 'Bekijk je urenstaat', color: 'var(--text-muted)', bg: 'var(--surface-subtle)' },
        ].map(({ to, label, icon: Icon, desc, color, bg }) => (
          <Link key={to} to={to}>
            <div className="group flex items-center gap-3 rounded-2xl p-4 transition-all hover:-translate-y-0.5 hover:shadow-[var(--shadow-3)]" style={{ background: 'var(--surface-card)', border: '1px solid var(--border)', boxShadow: 'var(--shadow-1)' }}>
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl transition-transform group-hover:scale-105" style={{ background: bg }}>
                <Icon className="h-5 w-5" style={{ color }} />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>{label}</p>
                <p className="truncate text-xs" style={{ color: 'var(--text-muted)' }}>{desc}</p>
              </div>
            </div>
          </Link>
        ))}
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader
            title="Komende diensten"
            subtitle="Deze week"
            action={<Link to="/app/rooster" className="flex items-center gap-1 text-sm font-medium text-brand-600 hover:text-brand-700">Rooster <ChevronRight className="h-4 w-4" /></Link>}
          />
          {upcoming.length === 0 ? (
            <EmptyState icon={Calendar} title="Geen diensten deze week" description="Zodra je manager publiceert, zie je je diensten hier." />
          ) : (
            <ul className="space-y-2">
              {upcoming.slice(0, 5).map((s) => {
                const c = getPositionColor(s.position)
                return (
                  <li key={s.id} className="flex items-center gap-3 rounded-xl px-4 py-3" style={{ background: 'var(--surface-subtle)', border: '1px solid var(--border)' }}>
                    <span className="h-9 w-1 shrink-0 rounded-full" style={{ background: c.accent }} />
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium capitalize" style={{ color: 'var(--text-primary)' }}>{formatDate(s.date, 'EEEE d MMM')}</p>
                      <p className="text-xs" style={{ color: 'var(--text-muted)' }}>{s.position}</p>
                    </div>
                    <span className="shrink-0 text-sm font-medium tabular-nums" style={{ color: 'var(--text-secondary)' }}>
                      {formatTime(s.start_time)}–{formatTime(s.end_time)}
                    </span>
                  </li>
                )
              })}
            </ul>
          )}
        </Card>

        <Card>
          <CardHeader title="Mijn verlofaanvragen" action={<Link to="/app/verlof" className="text-sm font-medium text-brand-600 hover:underline">Bekijken</Link>} />
          {leave.length === 0 ? (
            <EmptyState icon={Palmtree} title="Geen openstaande aanvragen" description="Vraag verlof aan wanneer je vrij wilt." action={<Link to="/app/verlof"><Button variant="secondary" size="sm">Verlof aanvragen</Button></Link>} />
          ) : (
            <ul className="space-y-2">
              {leave.map((r) => (
                <li key={r.id} className="flex items-center justify-between rounded-xl px-4 py-3 text-sm" style={{ background: 'var(--surface-subtle)', border: '1px solid var(--border)' }}>
                  <span style={{ color: 'var(--text-secondary)' }}>{formatDate(r.start_date)} – {formatDate(r.end_date)}</span>
                  <Badge variant={r.status}>{leaveStatusLabel[r.status]}</Badge>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>
    </div>
  )
}
