import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  Users,
  Palmtree,
  Clock,
  Calendar,
  CalendarPlus,
  UserPlus,
  Send,
  Sparkles,
  AlertCircle,
  Timer,
  Euro,
  ChevronRight,
  FileText,
  FileSpreadsheet,
  Thermometer,
  ArrowLeftRight,
} from 'lucide-react'
import { format } from 'date-fns'
import { SimpleBarChart } from '../components/charts/SimpleBarChart'
import { ManagerOnboardingTour } from '../components/onboarding/ManagerOnboardingTour'
import { getAllUsers } from '../services/users'
import { getPendingLeaveCount } from '../services/leave'
import { getActiveSickCount } from '../services/sick'
import { getOpenSwapCount } from '../services/shiftSwaps'
import { getAllClockRecords, sumHours } from '../services/clock'
import { getShiftsForPeriod } from '../services/shifts'
import { exportScheduleToPDF, exportScheduleToExcel } from '../services/export'
import { useOrganization } from '../context/OrganizationContext'
import { useToast } from '../context/ToastContext'
import type { ClockRecord, Shift, User } from '../types/database'
import { Card, CardHeader } from '../components/ui/Card'
import { Badge } from '../components/ui/Badge'
import { Button } from '../components/ui/Button'
import { PageHeader } from '../components/ui/PageHeader'
import { StatCard } from '../components/ui/StatCard'
import { EmptyState } from '../components/ui/EmptyState'
import { DashboardSkeleton } from '../components/ui/Skeleton'
import { formatDateTime, getWeekRange } from '../lib/utils'

export function ManagerDashboard() {
  const { organization, isSubscribed, pricePerEmployee } = useOrganization()
  const toast = useToast()
  const [employees, setEmployees] = useState<User[]>([])
  const [pendingLeave, setPendingLeave] = useState(0)
  const [activeClocks, setActiveClocks] = useState<ClockRecord[]>([])
  const [weekShifts, setWeekShifts] = useState<Shift[]>([])
  const [todayShifts, setTodayShifts] = useState<Shift[]>([])
  const [weekRecords, setWeekRecords] = useState<ClockRecord[]>([])
  const [activeSick, setActiveSick] = useState(0)
  const [openSwaps, setOpenSwaps] = useState(0)
  const [loading, setLoading] = useState(true)
  const [exporting, setExporting] = useState(false)

  const today = format(new Date(), 'yyyy-MM-dd')
  const { start: weekStart, end: weekEnd } = getWeekRange(new Date())

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
      getAllClockRecords(200),
    ])
      .then(([users, pending, sick, swaps, clocks, shifts, todayS, allRecords]) => {
        setEmployees(users.filter((u) => u.role === 'employee'))
        setPendingLeave(pending)
        setActiveSick(sick)
        setOpenSwaps(swaps)
        setActiveClocks(clocks.filter((c) => !c.clock_out))
        setWeekShifts(shifts)
        setTodayShifts(todayS.filter((s) => s.user_id))
        const weekRecs = allRecords.filter((r) => {
          const d = new Date(r.clock_in)
          return d >= weekStart && d <= weekEnd
        })
        setWeekRecords(weekRecs)
      })
      .finally(() => setLoading(false))
  }, [today, weekStart, weekEnd])

  const openShifts = useMemo(() => weekShifts.filter((s) => !s.user_id).length, [weekShifts])
  const weekHours = useMemo(() => sumHours(weekRecords), [weekRecords])
  const laborCost = useMemo(() => {
    const rateMap = new Map(employees.map((e) => [e.id, Number(e.hourly_rate) || 0]))
    return weekRecords.reduce((sum, r) => {
      if (!r.total_hours) return sum
      return sum + r.total_hours * (rateMap.get(r.user_id) ?? 0)
    }, 0)
  }, [weekRecords, employees])

  const hoursByDay = useMemo(() => {
    const days = ['Ma', 'Di', 'Wo', 'Do', 'Vr', 'Za', 'Zo']
    const totals = [0, 0, 0, 0, 0, 0, 0]
    for (const r of weekRecords) {
      const d = new Date(r.clock_in).getDay()
      const idx = d === 0 ? 6 : d - 1
      totals[idx] += r.total_hours ?? 0
    }
    return days.map((label, i) => ({ label, value: Math.round(totals[i] * 10) / 10 }))
  }, [weekRecords])

  const runExport = async (kind: 'pdf' | 'excel') => {
    if (!organization) return
    setExporting(true)
    try {
      const shifts = await getShiftsForPeriod(weekStart, weekEnd)
      if (shifts.length === 0) {
        toast.info('Geen diensten in deze week om te exporteren')
        return
      }
      const periodLabel = `week ${weekStart.toLocaleDateString('nl-NL', { day: 'numeric', month: 'short' })}`
      if (kind === 'pdf') exportScheduleToPDF(shifts, organization.name, periodLabel)
      else exportScheduleToExcel(shifts, organization.name, periodLabel)
      toast.success(`Export naar ${kind === 'pdf' ? 'PDF' : 'Excel'} gestart`)
    } catch {
      toast.error('Export mislukt')
    } finally {
      setExporting(false)
    }
  }

  const quickActions = [
    { to: '/app/rooster', label: 'Nieuwe dienst', icon: CalendarPlus, desc: 'Plan een dienst in het rooster' },
    { to: '/app/maandplanner', label: 'Rooster publiceren', icon: Send, desc: 'Publiceer de maandplanning' },
    { to: '/app/medewerkers', label: 'Medewerker toevoegen', icon: UserPlus, desc: 'Breid je team uit' },
    { to: '/app/maandplanner', label: 'AI rooster voorstellen', icon: Sparkles, desc: 'Slimme suggesties per dienst' },
  ]

  if (loading) return <DashboardSkeleton />

  return (
    <div className="mx-auto max-w-7xl space-y-8">
      <PageHeader
        title="Command Center"
        subtitle={`Welkom terug · ${organization?.name ?? ''}`}
        badge={
          <Badge variant={isSubscribed ? 'active' : 'pending'}>
            {isSubscribed ? 'Actief' : `€${pricePerEmployee}/medew.`}
          </Badge>
        }
        action={
          <div className="flex gap-2">
            <Button variant="secondary" size="sm" onClick={() => runExport('pdf')} loading={exporting}>
              <FileText className="h-4 w-4" /> PDF
            </Button>
            <Button variant="secondary" size="sm" onClick={() => runExport('excel')} loading={exporting}>
              <FileSpreadsheet className="h-4 w-4" /> Excel
            </Button>
          </div>
        }
      />

      {/* Stats grid */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Vandaag ingepland" value={todayShifts.length} icon={Calendar} to="/app/rooster" accent="brand" />
        <StatCard label="Nu ingeklokt" value={activeClocks.length} icon={Clock} to="/app/klok" accent="success" trend={activeClocks.length > 0 ? 'Live status' : undefined} />
        <StatCard label="Open diensten" value={openShifts} icon={AlertCircle} to="/app/rooster" accent={openShifts > 0 ? 'warning' : 'neutral'} />
        <StatCard label="Verlof open" value={pendingLeave} icon={Palmtree} to="/app/verlof" accent="leave" />
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Medewerkers" value={employees.length} icon={Users} to="/app/medewerkers" accent="neutral" />
        <StatCard label="Ziekmeldingen" value={activeSick} icon={Thermometer} to="/app/ziek" accent={activeSick > 0 ? 'warning' : 'neutral'} />
        <StatCard label="Ruilverzoeken" value={openSwaps} icon={ArrowLeftRight} to="/app/ruilen" accent={openSwaps > 0 ? 'warning' : 'neutral'} />
        <StatCard label="Uren deze week" value={weekHours.toFixed(0)} icon={Timer} to="/app/uren" accent="brand" trend="Geklokte uren" />
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Loonkosten (indicatie)" value={`€${laborCost.toFixed(0)}`} icon={Euro} accent="warning" trend="Deze week" />
        <StatCard label="Diensten deze week" value={weekShifts.filter((s) => s.user_id).length} icon={Calendar} to="/app/rooster" accent="neutral" />
      </div>

      <Card>
        <CardHeader title="Uren deze week" subtitle="Geklokte uren per dag" />
        <SimpleBarChart data={hoursByDay} />
      </Card>

      {/* Quick actions */}
      <div>
        <h2 className="mb-4 text-sm font-semibold uppercase tracking-wide" style={{ color: 'var(--text-muted)' }}>Snelle acties</h2>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {quickActions.map(({ to, label, icon: Icon, desc }) => (
            <Link key={label} to={to}>
              <div
                className="group flex items-start gap-3 rounded-2xl p-4 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md"
                style={{ background: 'var(--surface-card)', border: '1px solid var(--border)', boxShadow: 'var(--shadow-card)' }}
              >
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-brand-600/10 transition-colors group-hover:bg-brand-600/15">
                  <Icon className="h-5 w-5 text-brand-600" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <p className="font-semibold text-sm" style={{ color: 'var(--text-primary)' }}>{label}</p>
                  </div>
                  <p className="mt-0.5 text-xs" style={{ color: 'var(--text-muted)' }}>{desc}</p>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Active clocks */}
        <Card>
          <CardHeader
            title="Nu ingeklokt"
            subtitle={`${activeClocks.length} actieve registratie${activeClocks.length !== 1 ? 's' : ''}`}
            action={
              <Link to="/app/klok" className="flex items-center gap-1 text-sm font-medium text-brand-600 hover:text-brand-700">
                Alles <ChevronRight className="h-4 w-4" />
              </Link>
            }
          />
          {activeClocks.length === 0 ? (
            <EmptyState icon={Clock} title="Niemand ingeklokt" description="Medewerkers verschijnen hier zodra ze inklokken." />
          ) : (
            <ul className="space-y-2">
              {activeClocks.slice(0, 6).map((c) => (
                <li
                  key={c.id}
                  className="flex items-center justify-between rounded-xl px-4 py-3"
                  style={{ background: 'var(--surface-subtle)', border: '1px solid var(--border)' }}
                >
                  <span className="font-medium text-sm" style={{ color: 'var(--text-primary)' }}>
                    {(c.user as { full_name?: string })?.full_name ?? 'Medewerker'}
                  </span>
                  <div className="flex items-center gap-2">
                    <span className="text-xs" style={{ color: 'var(--text-muted)' }}>{formatDateTime(c.clock_in)}</span>
                    <Badge variant="active">Actief</Badge>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </Card>

        {/* Pending leave */}
        <Card>
          <CardHeader
            title="Verlofaanvragen"
            subtitle={pendingLeave > 0 ? `${pendingLeave} wachten op goedkeuring` : 'Alles behandeld'}
            action={
              <Link to="/app/verlof" className="flex items-center gap-1 text-sm font-medium text-brand-600 hover:text-brand-700">
                Beheren <ChevronRight className="h-4 w-4" />
              </Link>
            }
          />
          {pendingLeave === 0 ? (
            <EmptyState icon={Palmtree} title="Geen open aanvragen" description="Nieuwe verlofaanvragen verschijnen hier direct." />
          ) : (
            <div className="flex items-center gap-4 rounded-xl p-5" style={{ background: 'rgba(139,92,246,0.08)', border: '1px solid rgba(139,92,246,0.2)' }}>
              <div className="flex h-12 w-12 items-center justify-center rounded-xl" style={{ background: 'rgba(139,92,246,0.15)' }}>
                <Palmtree className="h-6 w-6" style={{ color: '#8B5CF6' }} />
              </div>
              <div className="flex-1">
                <p className="font-semibold" style={{ color: 'var(--text-primary)' }}>{pendingLeave} aanvragen wachten</p>
                <p className="text-sm" style={{ color: 'var(--text-muted)' }}>Keur verlof goed of af zodat je team weet waar ze aan toe zijn.</p>
              </div>
              <Link to="/app/verlof">
                <Button size="sm">Bekijken</Button>
              </Link>
            </div>
          )}
        </Card>
      </div>
      <ManagerOnboardingTour />
    </div>
  )
}
