import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  Users,
  Palmtree,
  Clock,
  Calendar,
  ChevronRight,
  Euro,
  CalendarClock,
  Thermometer,
  ArrowLeftRight,
  TrendingUp,
  CircleAlert,
  CheckCircle2,
} from 'lucide-react'
import { format } from 'date-fns'
import { nl } from 'date-fns/locale'
import { ManagerOnboardingTour } from '../components/onboarding/ManagerOnboardingTour'
import { getAllUsers } from '../services/users'
import { getPendingLeaveCount } from '../services/leave'
import { getActiveSickCount } from '../services/sick'
import { getOpenSwapCount } from '../services/shiftSwaps'
import { getAllClockRecords } from '../services/clock'
import { getShiftsForPeriod } from '../services/shifts'
import { useOrganization } from '../context/OrganizationContext'
import { useToast } from '../context/ToastContext'
import type { ClockRecord, Shift, User } from '../types/database'
import { Card, CardHeader } from '../components/ui/Card'
import { Badge } from '../components/ui/Badge'
import { Avatar } from '../components/ui/Avatar'
import { PageHeader } from '../components/ui/PageHeader'
import { StatCard } from '../components/ui/StatCard'
import { EmptyState } from '../components/ui/EmptyState'
import { DashboardSkeleton } from '../components/ui/Skeleton'
import { LoadError } from '../components/ui/LoadError'
import { AreaChart, type ChartPoint } from '../components/charts/AreaChart'
import { BarChart, type BarDatum } from '../components/charts/BarChart'
import { shiftHours } from '../lib/plannerEngine'
import { getWeekRange, getPositionColor, formatTime, cn } from '../lib/utils'

export function ManagerDashboard() {
  const { organization } = useOrganization()
  const toast = useToast()
  const [employees, setEmployees] = useState<User[]>([])
  const [pendingLeave, setPendingLeave] = useState(0)
  const [activeClocks, setActiveClocks] = useState<ClockRecord[]>([])
  const [weekShifts, setWeekShifts] = useState<Shift[]>([])
  const [todayShifts, setTodayShifts] = useState<Shift[]>([])
  const [activeSick, setActiveSick] = useState(0)
  const [openSwaps, setOpenSwaps] = useState(0)
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState(false)

  const today = format(new Date(), 'yyyy-MM-dd')
  const { start: weekStart, end: weekEnd, days: weekDays } = useMemo(() => getWeekRange(new Date()), [])
  const weekKey = format(weekStart, 'yyyy-MM-dd')

  useEffect(() => {
    const todayStart = new Date(today + 'T00:00:00')
    const todayEnd = new Date(today + 'T23:59:59')

    Promise.all([
      getAllUsers(),
      getPendingLeaveCount(),
      getActiveSickCount(),
      getOpenSwapCount(),
      getAllClockRecords(50),
      getShiftsForPeriod(weekStart, weekEnd),
      getShiftsForPeriod(todayStart, todayEnd),
    ])
      .then(([users, pending, sick, swaps, clocks, week, todayS]) => {
        setEmployees(users.filter((u) => u.role === 'employee'))
        setPendingLeave(pending)
        setActiveSick(sick)
        setOpenSwaps(swaps)
        setActiveClocks(clocks.filter((c) => !c.clock_out))
        setWeekShifts(week)
        setTodayShifts(todayS)
      })
      .catch(() => {
        setLoadError(true)
        toast.error('Dashboard laden mislukt')
      })
      .finally(() => setLoading(false))
  }, [today, weekKey]) // eslint-disable-line react-hooks/exhaustive-deps

  const rateById = useMemo(() => {
    const m = new Map<string, number>()
    employees.forEach((e) => m.set(e.id, e.hourly_rate ?? 0))
    return m
  }, [employees])

  const stats = useMemo(() => {
    let plannedHours = 0
    let laborCost = 0
    let openShifts = 0
    weekShifts.forEach((s) => {
      const h = shiftHours(s.start_time, s.end_time)
      plannedHours += h
      if (s.user_id) laborCost += h * (rateById.get(s.user_id) ?? 0)
      else openShifts++
    })
    const filled = weekShifts.filter((s) => s.user_id).length
    const coverage = weekShifts.length > 0 ? Math.round((filled / weekShifts.length) * 100) : 100
    return { plannedHours, laborCost, openShifts, coverage }
  }, [weekShifts, rateById])

  const hoursPerDay = useMemo<ChartPoint[]>(
    () =>
      weekDays.map((d) => {
        const key = format(d, 'yyyy-MM-dd')
        const total = weekShifts
          .filter((s) => s.date === key)
          .reduce((sum, s) => sum + shiftHours(s.start_time, s.end_time), 0)
        return { label: format(d, 'EEEEEE', { locale: nl }), value: Math.round(total) }
      }),
    [weekDays, weekShifts]
  )

  const byPosition = useMemo<BarDatum[]>(() => {
    const map = new Map<string, number>()
    weekShifts.forEach((s) => map.set(s.position, (map.get(s.position) ?? 0) + 1))
    return Array.from(map.entries())
      .sort((a, b) => b[1] - a[1])
      .map(([pos, count]) => ({ label: pos, value: count, color: getPositionColor(pos).accent }))
  }, [weekShifts])

  const attentionItems = useMemo(
    () =>
      [
        pendingLeave > 0 && { id: 'leave', icon: Palmtree, color: 'var(--color-leave)', label: 'Verlofaanvragen', count: pendingLeave, to: '/app/verlof' },
        openSwaps > 0 && { id: 'swaps', icon: ArrowLeftRight, color: 'var(--brand-strong)', label: 'Ruilverzoeken', count: openSwaps, to: '/app/ruilen' },
        activeSick > 0 && { id: 'sick', icon: Thermometer, color: 'var(--color-warning)', label: 'Ziekmeldingen', count: activeSick, to: '/app/ziek' },
      ].filter(Boolean) as { id: string; icon: typeof Palmtree; color: string; label: string; count: number; to: string }[],
    [pendingLeave, openSwaps, activeSick]
  )

  if (loading) return <DashboardSkeleton />
  if (loadError) {
    return (
      <LoadError
        onRetry={() => {
          setLoadError(false)
          setLoading(true)
          window.location.reload()
        }}
      />
    )
  }

  const eur = (v: number) => `€${Math.round(v).toLocaleString('nl-NL')}`
  const todayAssigned = todayShifts.filter((s) => s.user_id)

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <PageHeader
        title="Overzicht"
        subtitle={`${organization?.name ?? ''} · ${format(new Date(), 'EEEE d MMMM', { locale: nl })}`}
      />

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Geplande uren (week)" value={`${Math.round(stats.plannedHours)}u`} icon={CalendarClock} accent="brand" to="/app/rooster" />
        <StatCard label="Loonkosten (week)" value={eur(stats.laborCost)} icon={Euro} accent="success" to="/app/uren" />
        <StatCard label="Open diensten" value={stats.openShifts} icon={Calendar} accent={stats.openShifts > 0 ? 'warning' : 'neutral'} to="/app/maandplanner" />
        <StatCard label="Bezetting" value={`${stats.coverage}%`} icon={TrendingUp} accent={stats.coverage >= 90 ? 'success' : 'warning'} to="/app/rooster" />
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <div className="space-y-4 lg:col-span-2">
          <Card>
            <CardHeader
              title="Geplande uren deze week"
              subtitle={`${Math.round(stats.plannedHours)} uur totaal`}
              action={<Link to="/app/rooster" className="flex items-center gap-1 text-sm font-medium text-brand-600 hover:text-brand-700">Rooster <ChevronRight className="h-4 w-4" /></Link>}
            />
            <AreaChart data={hoursPerDay} formatValue={(v) => `${v}u`} />
          </Card>

          <Card>
            <CardHeader
              title="Vandaag"
              subtitle={`${todayAssigned.length} ingeplande dienst${todayAssigned.length !== 1 ? 'en' : ''}`}
              action={<Link to="/app/rooster" className="flex items-center gap-1 text-sm font-medium text-brand-600 hover:text-brand-700">Bekijken <ChevronRight className="h-4 w-4" /></Link>}
            />
            {todayAssigned.length === 0 ? (
              <EmptyState icon={Calendar} title="Geen diensten vandaag" description="Plan diensten in via het rooster of de maandplanner." />
            ) : (
              <ul className="space-y-2">
                {todayAssigned
                  .sort((a, b) => a.start_time.localeCompare(b.start_time))
                  .slice(0, 6)
                  .map((s) => {
                    const c = getPositionColor(s.position)
                    return (
                      <li key={s.id} className="flex items-center gap-3 rounded-xl px-3 py-2.5" style={{ background: 'var(--surface-subtle)', border: '1px solid var(--border)' }}>
                        <span className="h-9 w-1 shrink-0 rounded-full" style={{ background: c.accent }} />
                        <Avatar name={s.user?.full_name} size="sm" />
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-medium" style={{ color: 'var(--text-primary)' }}>{s.user?.full_name ?? 'Open dienst'}</p>
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
        </div>

        <div className="space-y-4">
          <Card>
            <CardHeader title="Aandacht nodig" />
            {attentionItems.length === 0 ? (
              <div className="flex flex-col items-center gap-2 py-6 text-center">
                <span className="flex h-11 w-11 items-center justify-center rounded-full" style={{ background: 'var(--badge-approved-bg)' }}>
                  <CheckCircle2 className="h-5 w-5" style={{ color: 'var(--color-success)' }} />
                </span>
                <p className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>Alles bijgewerkt</p>
                <p className="text-xs" style={{ color: 'var(--text-muted)' }}>Geen openstaande acties</p>
              </div>
            ) : (
              <ul className="space-y-2">
                {attentionItems.map((item) => (
                  <li key={item.id}>
                    <Link to={item.to} className="flex items-center gap-3 rounded-xl px-3 py-2.5 transition-colors hover:bg-black/[0.03] dark:hover:bg-white/5" style={{ border: '1px solid var(--border)' }}>
                      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl" style={{ background: 'var(--surface-subtle)', color: item.color }}>
                        <item.icon className="h-4 w-4" />
                      </span>
                      <span className="flex-1 text-sm font-medium" style={{ color: 'var(--text-primary)' }}>{item.label}</span>
                      <Badge variant="warning">{item.count}</Badge>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </Card>

          <Card>
            <CardHeader
              title="Nu ingeklokt"
              action={<Link to="/app/klok" className="text-sm text-brand-600 hover:underline">Alles</Link>}
            />
            {activeClocks.length === 0 ? (
              <EmptyState icon={Clock} title="Niemand ingeklokt" description="Verschijnt hier na inklokken." />
            ) : (
              <ul className="space-y-2">
                {activeClocks.slice(0, 5).map((c) => (
                  <li key={c.id} className="flex items-center gap-3 rounded-xl px-3 py-2 text-sm" style={{ background: 'var(--surface-subtle)' }}>
                    <Avatar name={(c.user as { full_name?: string })?.full_name} size="sm" status="online" />
                    <span className="flex-1 truncate" style={{ color: 'var(--text-primary)' }}>
                      {(c.user as { full_name?: string })?.full_name ?? 'Medewerker'}
                    </span>
                    <span className="text-xs tabular-nums" style={{ color: 'var(--text-muted)' }}>
                      sinds {format(new Date(c.clock_in), 'HH:mm')}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </Card>

          <Card>
            <CardHeader title="Diensten per afdeling" subtitle="Deze week" />
            {byPosition.length === 0 ? (
              <EmptyState icon={CircleAlert} title="Nog geen diensten" description="Plan diensten om verdeling te zien." />
            ) : (
              <BarChart data={byPosition} horizontal />
            )}
          </Card>

          <Card padding="sm">
            <Link to="/app/medewerkers" className={cn('flex items-center gap-3 rounded-xl px-2 py-1.5')}>
              <span className="flex h-9 w-9 items-center justify-center rounded-xl" style={{ background: 'rgba(59,130,246,0.12)' }}>
                <Users className="h-4 w-4" style={{ color: '#3B82F6' }} />
              </span>
              <span className="flex-1">
                <span className="block text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>{employees.length} medewerkers</span>
                <span className="block text-xs" style={{ color: 'var(--text-muted)' }}>Team beheren</span>
              </span>
              <ChevronRight className="h-4 w-4" style={{ color: 'var(--text-muted)' }} />
            </Link>
          </Card>
        </div>
      </div>

      <ManagerOnboardingTour />
    </div>
  )
}
