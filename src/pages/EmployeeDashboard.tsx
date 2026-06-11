import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Calendar, Clock, Palmtree, Timer, ChevronRight } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { useOrganization } from '../context/OrganizationContext'
import { getShiftsForWeek } from '../services/shifts'
import { getActiveClock, getClockRecords, sumHours } from '../services/clock'
import { getLeaveRequests } from '../services/leave'
import type { Shift, ClockRecord, LeaveRequest } from '../types/database'
import { Card, CardHeader } from '../components/ui/Card'
import { Badge } from '../components/ui/Badge'
import { LoadingSpinner } from '../components/ui/LoadingSpinner'
import { getWeekRange, formatDate, formatTime, leaveStatusLabel } from '../lib/utils'

export function EmployeeDashboard() {
  const { profile } = useAuth()
  const { organization } = useOrganization()
  const [shifts, setShifts] = useState<Shift[]>([])
  const [activeClock, setActiveClock] = useState<ClockRecord | null>(null)
  const [weekHours, setWeekHours] = useState(0)
  const [leave, setLeave] = useState<LeaveRequest[]>([])
  const [loading, setLoading] = useState(true)

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
      .finally(() => setLoading(false))
  }, [profile])

  const quickLinks = [
    {
      to: '/app/klok',
      label: 'In-/Uitklokken',
      icon: Clock,
      desc: activeClock ? 'Je bent ingeklokt' : 'Klok in voor je dienst',
      color: activeClock ? 'bg-emerald-500/15 text-emerald-400' : 'bg-brand-500/15 text-brand-400',
    },
    {
      to: '/app/rooster',
      label: 'Rooster',
      icon: Calendar,
      desc: `${shifts.length} dienst${shifts.length !== 1 ? 'en' : ''} deze week`,
      color: 'bg-brand-500/15 text-brand-400',
    },
    {
      to: '/app/uren',
      label: 'Uren',
      icon: Timer,
      desc: `${weekHours.toFixed(1)} uur deze week`,
      color: 'bg-zinc-500/15 text-zinc-400',
    },
    {
      to: '/app/verlof',
      label: 'Verlof',
      icon: Palmtree,
      desc: 'Aanvragen en status bekijken',
      color: 'bg-amber-500/15 text-amber-400',
    },
  ]

  if (loading) return <LoadingSpinner />

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-xl font-bold text-zinc-100">Dashboard</h1>
        <p className="text-sm text-zinc-500">{organization?.name}</p>
      </div>

      {activeClock && (
        <Link to="/app/klok">
          <div
            className="flex items-center justify-between rounded-2xl px-5 py-4 transition-all hover:-translate-y-0.5"
            style={{ background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.2)' }}
          >
            <div>
              <p className="font-semibold text-emerald-400">Je bent ingeklokt</p>
              <p className="mt-0.5 text-sm text-emerald-600">Vergeet niet uit te klokken na je dienst.</p>
            </div>
            <ChevronRight className="h-5 w-5 text-emerald-600 shrink-0" />
          </div>
        </Link>
      )}

      <div className="grid gap-4 sm:grid-cols-2">
        {quickLinks.map(({ to, label, icon: Icon, desc, color }) => (
          <Link key={to} to={to}>
            <Card className="flex items-center justify-between transition-all hover:card-shadow-md hover:-translate-y-0.5">
              <div className="flex items-center gap-3">
                <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${color}`}>
                  <Icon className="h-5 w-5" />
                </div>
                <div>
                  <p className="font-semibold text-zinc-200">{label}</p>
                  <p className="text-xs text-zinc-500">{desc}</p>
                </div>
              </div>
              <ChevronRight className="h-5 w-5 text-zinc-700 shrink-0" />
            </Card>
          </Link>
        ))}
      </div>

      <Card>
        <CardHeader
          title="Komende diensten"
          action={
            <Link to="/app/rooster" className="flex items-center gap-1 text-sm text-brand-400 hover:text-brand-300 transition-colors">
              Volledig rooster <ChevronRight className="h-4 w-4" />
            </Link>
          }
        />
        {shifts.length === 0 ? (
          <p className="text-sm text-zinc-600">Geen gepubliceerde diensten deze week</p>
        ) : (
          <ul className="divide-y divide-white/6">
            {shifts.slice(0, 5).map((s) => (
              <li key={s.id} className="flex items-center justify-between py-3">
                <span className="text-sm text-zinc-400">{formatDate(s.date, 'EEEE d MMM')}</span>
                <span className="text-sm font-medium text-zinc-200">
                  {formatTime(s.start_time)} – {formatTime(s.end_time)}
                  <span className="ml-2 text-xs text-zinc-600">{s.position}</span>
                </span>
              </li>
            ))}
          </ul>
        )}
      </Card>

      {leave.length > 0 && (
        <Card>
          <CardHeader
            title="Openstaande verlofaanvragen"
            action={
              <Link to="/app/verlof" className="text-sm text-brand-400 hover:text-brand-300 transition-colors">
                Bekijken
              </Link>
            }
          />
          <ul className="space-y-2">
            {leave.map((r) => (
              <li key={r.id} className="flex items-center justify-between text-sm">
                <span className="text-zinc-400">
                  {formatDate(r.start_date)} – {formatDate(r.end_date)}
                </span>
                <Badge variant={r.status}>{leaveStatusLabel[r.status]}</Badge>
              </li>
            ))}
          </ul>
        </Card>
      )}
    </div>
  )
}
