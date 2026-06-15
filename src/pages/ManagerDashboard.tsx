import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { Users, Palmtree, Clock, Calendar, ChevronRight } from 'lucide-react'
import { format } from 'date-fns'
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
import { Button } from '../components/ui/Button'
import { PageHeader } from '../components/ui/PageHeader'
import { StatCard } from '../components/ui/StatCard'
import { EmptyState } from '../components/ui/EmptyState'
import { DashboardSkeleton } from '../components/ui/Skeleton'
import { LoadError } from '../components/ui/LoadError'
import { getWeekRange } from '../lib/utils'

export function ManagerDashboard() {
  const { organization } = useOrganization()
  const toast = useToast()
  const [employees, setEmployees] = useState<User[]>([])
  const [pendingLeave, setPendingLeave] = useState(0)
  const [activeClocks, setActiveClocks] = useState<ClockRecord[]>([])
  const [todayShifts, setTodayShifts] = useState<Shift[]>([])
  const [activeSick, setActiveSick] = useState(0)
  const [openSwaps, setOpenSwaps] = useState(0)
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState(false)

  const today = format(new Date(), 'yyyy-MM-dd')
  const { start: weekStart, end: weekEnd } = useMemo(() => getWeekRange(new Date()), [])
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
      .then(([users, pending, sick, swaps, clocks, , todayS]) => {
        setEmployees(users.filter((u) => u.role === 'employee'))
        setPendingLeave(pending)
        setActiveSick(sick)
        setOpenSwaps(swaps)
        setActiveClocks(clocks.filter((c) => !c.clock_out))
        setTodayShifts(todayS.filter((s) => s.user_id))
      })
      .catch(() => {
        setLoadError(true)
        toast.error('Dashboard laden mislukt')
      })
      .finally(() => setLoading(false))
  }, [today, weekKey])

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

  const needsAttention = pendingLeave + activeSick + openSwaps

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <PageHeader
        title="Overzicht"
        subtitle={organization?.name}
      />

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Vandaag" value={todayShifts.length} icon={Calendar} to="/app/rooster" accent="brand" />
        <StatCard label="Ingeklokt" value={activeClocks.length} icon={Clock} to="/app/klok" accent="success" />
        <StatCard label="Verlof open" value={pendingLeave} icon={Palmtree} to="/app/verlof" accent="leave" />
        <StatCard label="Medewerkers" value={employees.length} icon={Users} to="/app/medewerkers" accent="neutral" />
      </div>

      {needsAttention > 0 && (
        <div
          className="flex flex-wrap items-center justify-between gap-3 rounded-xl px-4 py-3 text-sm"
          style={{ background: 'var(--surface-subtle)', border: '1px solid var(--border)' }}
        >
          <span style={{ color: 'var(--text-secondary)' }}>
            {pendingLeave > 0 && `${pendingLeave} verlof`}
            {pendingLeave > 0 && (activeSick > 0 || openSwaps > 0) && ' · '}
            {activeSick > 0 && `${activeSick} ziek`}
            {activeSick > 0 && openSwaps > 0 && ' · '}
            {openSwaps > 0 && `${openSwaps} ruilverzoek`}
          </span>
          <Link to="/app/verlof" className="font-medium text-brand-600 hover:underline">
            Bekijken
          </Link>
        </div>
      )}

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader
            title="Nu ingeklokt"
            action={
              <Link to="/app/klok" className="text-sm text-brand-600 hover:underline">
                Alles <ChevronRight className="inline h-3.5 w-3.5" />
              </Link>
            }
          />
          {activeClocks.length === 0 ? (
            <EmptyState icon={Clock} title="Niemand ingeklokt" description="Medewerkers verschijnen hier na het inklokken." />
          ) : (
            <ul className="space-y-2">
              {activeClocks.slice(0, 5).map((c) => (
                <li
                  key={c.id}
                  className="flex items-center justify-between rounded-lg px-3 py-2.5 text-sm"
                  style={{ background: 'var(--surface-subtle)' }}
                >
                  <span style={{ color: 'var(--text-primary)' }}>
                    {(c.user as { full_name?: string })?.full_name ?? 'Medewerker'}
                  </span>
                  <Badge variant="active">Actief</Badge>
                </li>
              ))}
            </ul>
          )}
        </Card>

        <Card>
          <CardHeader title="Snel naar" />
          <div className="flex flex-col gap-1">
            {[
              { to: '/app/rooster', label: 'Rooster beheren' },
              { to: '/app/maandplanner', label: 'Maandplanner' },
              { to: '/app/medewerkers', label: 'Medewerkers' },
              { to: '/app/verlof', label: 'Verlofaanvragen' },
            ].map(({ to, label }) => (
              <Link
                key={to}
                to={to}
                className="rounded-lg px-3 py-2.5 text-sm font-medium transition-colors hover:bg-black/[0.03]"
                style={{ color: 'var(--text-primary)' }}
              >
                {label}
              </Link>
            ))}
          </div>
        </Card>
      </div>

      <div className="text-center">
        <Link to="/app/rooster">
          <Button>Nieuwe dienst plannen</Button>
        </Link>
      </div>

      <ManagerOnboardingTour />
    </div>
  )
}
