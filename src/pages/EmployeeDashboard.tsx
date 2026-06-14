import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Calendar, Clock, Palmtree, ChevronRight, CalendarCheck } from 'lucide-react'
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
import { getWeekRange, formatDate, formatTime, leaveStatusLabel } from '../lib/utils'

export function EmployeeDashboard() {
  const { profile } = useAuth()
  const { organization } = useOrganization()
  const [shifts, setShifts] = useState<Shift[]>([])
  const [activeClock, setActiveClock] = useState<ClockRecord | null>(null)
  const [weekHours, setWeekHours] = useState(0)
  const [leave, setLeave] = useState<LeaveRequest[]>([])
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState(false)

  useEffect(() => {
    if (!profile) return
    const { start, end } = getWeekRange(new Date())
    Promise.all([
      getShiftsForWeek(start, end, { userId: profile.id, publishedOnly: true }),
      getActiveClock(profile.id),
      getClockRecords(profile.id, 'week', new Date()),
      getLeaveRequests(profile.id),
    ])
      .then(([s, clock, records, l]) => {
        setShifts(s)
        setActiveClock(clock)
        setWeekHours(sumHours(records))
        setLeave(l.filter((r) => r.status === 'pending').slice(0, 3))
      })
      .catch(() => setLoadError(true))
      .finally(() => setLoading(false))
  }, [profile])

  const firstName = profile?.full_name?.split(' ')[0] ?? 'daar'

  const quickActions = [
    { to: '/app/klok', label: 'In-/Uitklokken', icon: Clock, desc: activeClock ? 'Je bent ingeklokt' : 'Start je dienst', accent: activeClock ? 'success' as const : 'brand' as const },
    { to: '/app/rooster', label: 'Mijn rooster', icon: Calendar, desc: `${shifts.length} dienst${shifts.length !== 1 ? 'en' : ''} deze week`, accent: 'brand' as const },
    { to: '/app/beschikbaarheid', label: 'Beschikbaarheid', icon: CalendarCheck, desc: 'Geef door wanneer je kunt', accent: 'neutral' as const },
    { to: '/app/verlof', label: 'Verlof', icon: Palmtree, desc: 'Aanvragen of status bekijken', accent: 'leave' as const },
  ]

  const accentBg = {
    brand: 'rgba(59,130,246,0.12)',
    success: 'rgba(16,185,129,0.12)',
    leave: 'rgba(139,92,246,0.12)',
    neutral: 'var(--surface-subtle)',
  }
  const accentColor = {
    brand: '#3B82F6',
    success: '#10B981',
    leave: '#8B5CF6',
    neutral: 'var(--text-muted)',
  }

  if (loading) return <DashboardSkeleton />
  if (loadError) {
    return <LoadError onRetry={() => window.location.reload()} />
  }

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <PageHeader
        title={`Hoi, ${firstName}!`}
        subtitle={organization?.name}
      />

      {/* Active clock banner — prominent on mobile */}
      {activeClock ? (
        <Link to="/app/klok">
          <div
            className="flex items-center justify-between rounded-2xl px-5 py-4 transition-all hover:-translate-y-0.5 hover:shadow-md"
            style={{ background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.25)' }}
          >
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl" style={{ background: 'rgba(16,185,129,0.15)' }}>
                <Clock className="h-5 w-5" style={{ color: '#10B981' }} />
              </div>
              <div>
                <p className="font-semibold" style={{ color: '#059669' }}>Je bent ingeklokt</p>
                <p className="text-sm" style={{ color: 'var(--text-muted)' }}>Vergeet niet uit te klokken na je dienst.</p>
              </div>
            </div>
            <ChevronRight className="h-5 w-5 shrink-0" style={{ color: '#10B981' }} />
          </div>
        </Link>
      ) : (
        <Link to="/app/klok">
          <div
            className="flex items-center justify-between rounded-2xl px-5 py-4 transition-all hover:-translate-y-0.5 hover:shadow-md"
            style={{ background: 'var(--surface-card)', border: '1px solid var(--border)', boxShadow: 'var(--shadow-card)' }}
          >
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-600/10">
                <Clock className="h-5 w-5 text-brand-600" />
              </div>
              <div>
                <p className="font-semibold" style={{ color: 'var(--text-primary)' }}>Klaar om te beginnen?</p>
                <p className="text-sm" style={{ color: 'var(--text-muted)' }}>Klok in wanneer je dienst start.</p>
              </div>
            </div>
            <Button size="sm">Inklokken</Button>
          </div>
        </Link>
      )}

      {/* Week summary */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        <div className="rounded-2xl p-4" style={{ background: 'var(--surface-card)', border: '1px solid var(--border)' }}>
          <p className="text-xs font-medium uppercase tracking-wide" style={{ color: 'var(--text-muted)' }}>Deze week</p>
          <p className="mt-1 text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>{weekHours.toFixed(1)}u</p>
          <p className="text-xs" style={{ color: 'var(--text-muted)' }}>Gewerkte uren</p>
        </div>
        <div className="rounded-2xl p-4" style={{ background: 'var(--surface-card)', border: '1px solid var(--border)' }}>
          <p className="text-xs font-medium uppercase tracking-wide" style={{ color: 'var(--text-muted)' }}>Diensten</p>
          <p className="mt-1 text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>{shifts.length}</p>
          <p className="text-xs" style={{ color: 'var(--text-muted)' }}>Deze week</p>
        </div>
        <div className="col-span-2 rounded-2xl p-4 sm:col-span-1" style={{ background: 'var(--surface-card)', border: '1px solid var(--border)' }}>
          <p className="text-xs font-medium uppercase tracking-wide" style={{ color: 'var(--text-muted)' }}>Verlof</p>
          <p className="mt-1 text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>{leave.length}</p>
          <p className="text-xs" style={{ color: 'var(--text-muted)' }}>Openstaand</p>
        </div>
      </div>

      {/* Quick actions — mobile-first grid */}
      <div className="grid gap-3 sm:grid-cols-2">
        {quickActions.map(({ to, label, icon: Icon, desc, accent }) => (
          <Link key={to} to={to}>
            <div
              className="group flex items-center gap-3 rounded-2xl p-4 transition-all hover:-translate-y-0.5 hover:shadow-md"
              style={{ background: 'var(--surface-card)', border: '1px solid var(--border)', boxShadow: 'var(--shadow-card)' }}
            >
              <div
                className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl transition-transform group-hover:scale-105"
                style={{ background: accentBg[accent] }}
              >
                <Icon className="h-5 w-5" style={{ color: accentColor[accent] }} />
              </div>
              <div className="min-w-0 flex-1">
                <p className="font-semibold text-sm" style={{ color: 'var(--text-primary)' }}>{label}</p>
                <p className="text-xs" style={{ color: 'var(--text-muted)' }}>{desc}</p>
              </div>
              <ChevronRight className="h-4 w-4 shrink-0" style={{ color: 'var(--text-disabled)' }} />
            </div>
          </Link>
        ))}
      </div>

      {/* Upcoming shifts */}
      <Card>
        <CardHeader
          title="Komende diensten"
          subtitle="Deze week"
          action={
            <Link to="/app/rooster" className="flex items-center gap-1 text-sm font-medium text-brand-600 hover:text-brand-700">
              Volledig rooster <ChevronRight className="h-4 w-4" />
            </Link>
          }
        />
        {shifts.length === 0 ? (
          <EmptyState
            icon={Calendar}
            title="Geen diensten deze week"
            description="Zodra je manager het rooster publiceert, zie je je diensten hier."
            action={<Link to="/app/beschikbaarheid"><Button variant="secondary" size="sm">Beschikbaarheid invullen</Button></Link>}
          />
        ) : (
          <ul className="space-y-2">
            {shifts.slice(0, 5).map((s) => (
              <li
                key={s.id}
                className="flex flex-wrap items-center justify-between gap-2 rounded-xl px-4 py-3"
                style={{ background: 'var(--surface-subtle)', border: '1px solid var(--border)' }}
              >
                <span className="text-sm font-medium capitalize" style={{ color: 'var(--text-primary)' }}>
                  {formatDate(s.date, 'EEEE d MMM')}
                </span>
                <span className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                  {formatTime(s.start_time)} – {formatTime(s.end_time)}
                  <span className="ml-2 rounded-md px-2 py-0.5 text-xs" style={{ background: 'var(--brand-muted)', color: 'var(--brand-strong)' }}>
                    {s.position}
                  </span>
                </span>
              </li>
            ))}
          </ul>
        )}
      </Card>

      {leave.length > 0 && (
        <Card>
          <CardHeader title="Openstaande verlofaanvragen" action={<Link to="/app/verlof" className="text-sm font-medium text-brand-600">Bekijken</Link>} />
          <ul className="space-y-2">
            {leave.map((r) => (
              <li key={r.id} className="flex items-center justify-between rounded-xl px-4 py-3 text-sm" style={{ background: 'var(--surface-subtle)', border: '1px solid var(--border)' }}>
                <span style={{ color: 'var(--text-secondary)' }}>{formatDate(r.start_date)} – {formatDate(r.end_date)}</span>
                <Badge variant={r.status}>{leaveStatusLabel[r.status]}</Badge>
              </li>
            ))}
          </ul>
        </Card>
      )}
    </div>
  )
}
