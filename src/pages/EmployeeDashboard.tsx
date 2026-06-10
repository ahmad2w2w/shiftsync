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
      accent: activeClock ? 'bg-emerald-100 text-emerald-700' : 'bg-brand-100 text-brand-700',
    },
    {
      to: '/app/rooster',
      label: 'Rooster',
      icon: Calendar,
      desc: `${shifts.length} dienst${shifts.length !== 1 ? 'en' : ''} deze week`,
      accent: 'bg-brand-100 text-brand-700',
    },
    {
      to: '/app/uren',
      label: 'Uren',
      icon: Timer,
      desc: `${weekHours.toFixed(1)} uur deze week`,
      accent: 'bg-navy-100 text-navy-700',
    },
    {
      to: '/app/verlof',
      label: 'Verlof',
      icon: Palmtree,
      desc: 'Aanvragen en status bekijken',
      accent: 'bg-amber-100 text-amber-700',
    },
  ]

  if (loading) return <LoadingSpinner />

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-navy-900">Dashboard</h1>
        <p className="text-sm text-gray-500">{organization?.name}</p>
      </div>

      {activeClock && (
        <Link to="/app/klok">
          <Card className="border-emerald-200 bg-emerald-50 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-semibold text-emerald-800">Je bent ingeklokt</p>
                <p className="mt-0.5 text-sm text-emerald-600">
                  Vergeet niet uit te klokken na je dienst.
                </p>
              </div>
              <ChevronRight className="h-5 w-5 text-emerald-400" />
            </div>
          </Card>
        </Link>
      )}

      <div className="grid gap-4 sm:grid-cols-2">
        {quickLinks.map(({ to, label, icon: Icon, desc, accent }) => (
          <Link key={to} to={to}>
            <Card className="flex items-center justify-between transition-shadow hover:shadow-md">
              <div className="flex items-center gap-3">
                <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${accent}`}>
                  <Icon className="h-5 w-5" />
                </div>
                <div>
                  <p className="font-semibold text-navy-900">{label}</p>
                  <p className="text-xs text-gray-500">{desc}</p>
                </div>
              </div>
              <ChevronRight className="h-5 w-5 text-gray-300 shrink-0" />
            </Card>
          </Link>
        ))}
      </div>

      <Card>
        <CardHeader
          title="Komende diensten"
          action={
            <Link to="/app/rooster" className="flex items-center text-sm text-brand-600 hover:underline">
              Volledig rooster <ChevronRight className="ml-0.5 h-4 w-4" />
            </Link>
          }
        />
        {shifts.length === 0 ? (
          <p className="text-sm text-gray-400">Geen gepubliceerde diensten deze week</p>
        ) : (
          <ul className="divide-y">
            {shifts.slice(0, 5).map((s) => (
              <li key={s.id} className="flex items-center justify-between py-3">
                <span className="text-sm text-gray-600">{formatDate(s.date, 'EEEE d MMM')}</span>
                <span className="text-sm font-medium text-navy-900">
                  {formatTime(s.start_time)} – {formatTime(s.end_time)}
                  <span className="ml-2 text-xs text-gray-400">{s.position}</span>
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
              <Link to="/app/verlof" className="text-sm text-brand-600 hover:underline">
                Bekijken
              </Link>
            }
          />
          <ul className="space-y-2">
            {leave.map((r) => (
              <li key={r.id} className="flex items-center justify-between text-sm">
                <span className="text-gray-600">
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
