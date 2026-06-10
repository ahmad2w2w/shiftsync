import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Users, Palmtree, Clock, Download, ChevronRight, FileText, FileSpreadsheet } from 'lucide-react'
import { getAllUsers } from '../services/users'
import { getPendingLeaveCount } from '../services/leave'
import { getAllClockRecords } from '../services/clock'
import { getShiftsForPeriod } from '../services/shifts'
import { exportScheduleToPDF, exportScheduleToExcel } from '../services/export'
import { useOrganization } from '../context/OrganizationContext'
import type { ClockRecord } from '../types/database'
import { Card, CardHeader } from '../components/ui/Card'
import { Badge } from '../components/ui/Badge'
import { Button } from '../components/ui/Button'
import { LoadingSpinner } from '../components/ui/LoadingSpinner'
import { formatDateTime, getWeekRange } from '../lib/utils'

export function ManagerDashboard() {
  const { organization, hasFeature } = useOrganization()
  const [employeeCount, setEmployeeCount] = useState(0)
  const [pendingLeave, setPendingLeave] = useState(0)
  const [activeClocks, setActiveClocks] = useState<ClockRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [exporting, setExporting] = useState(false)

  useEffect(() => {
    Promise.all([getAllUsers(), getPendingLeaveCount(), getAllClockRecords(20)])
      .then(([users, pending, clocks]) => {
        setEmployeeCount(users.filter((u) => u.role === 'employee').length)
        setPendingLeave(pending)
        setActiveClocks(clocks.filter((c) => !c.clock_out))
      })
      .finally(() => setLoading(false))
  }, [])

  const handleExportPDF = async () => {
    if (!organization) return
    setExporting(true)
    try {
      const { start, end } = getWeekRange(new Date())
      const shifts = await getShiftsForPeriod(start, end)
      const periodLabel = `week ${start.toLocaleDateString('nl-NL', { day: 'numeric', month: 'short' })}`
      exportScheduleToPDF(shifts, organization.name, periodLabel)
    } finally {
      setExporting(false)
    }
  }

  const handleExportExcel = async () => {
    if (!organization) return
    setExporting(true)
    try {
      const { start, end } = getWeekRange(new Date())
      const shifts = await getShiftsForPeriod(start, end)
      const periodLabel = `week ${start.toLocaleDateString('nl-NL', { day: 'numeric', month: 'short' })}`
      exportScheduleToExcel(shifts, organization.name, periodLabel)
    } finally {
      setExporting(false)
    }
  }

  const stats = [
    { label: 'Medewerkers', value: employeeCount, icon: Users, to: '/app/medewerkers' },
    { label: 'Verlof in behandeling', value: pendingLeave, icon: Palmtree, to: '/app/verlof' },
    { label: 'Nu ingeklokt', value: activeClocks.length, icon: Clock, to: '/app/klok' },
  ]

  if (loading) return <LoadingSpinner />

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-navy-900">Dashboard</h1>
          <p className="text-sm text-gray-500">{organization?.name}</p>
        </div>
        {hasFeature('export') ? (
          <div className="flex gap-2">
            <Button
              variant="secondary"
              size="sm"
              onClick={handleExportPDF}
              loading={exporting}
            >
              <FileText className="h-4 w-4" />
              PDF
            </Button>
            <Button
              variant="secondary"
              size="sm"
              onClick={handleExportExcel}
              loading={exporting}
            >
              <FileSpreadsheet className="h-4 w-4" />
              Excel
            </Button>
          </div>
        ) : (
          <Link to="/app/abonnement">
            <Button variant="secondary" size="sm">
              <Download className="h-4 w-4" />
              Export (Pro)
            </Button>
          </Link>
        )}
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        {stats.map(({ label, value, icon: Icon, to }) => (
          <Link key={label} to={to}>
            <Card className="transition-shadow hover:shadow-md">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500">{label}</p>
                  <p className="text-3xl font-bold text-navy-900">{value}</p>
                </div>
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-navy-100">
                  <Icon className="h-6 w-6 text-navy-800" />
                </div>
              </div>
            </Card>
          </Link>
        ))}
      </div>

      <Card>
        <CardHeader
          title="Nu ingeklokt"
          action={
            <Link to="/app/klok" className="flex items-center text-sm text-brand-600 hover:underline">
              Alles bekijken <ChevronRight className="ml-0.5 h-4 w-4" />
            </Link>
          }
        />
        {activeClocks.length === 0 ? (
          <p className="text-sm text-gray-400">Niemand is momenteel ingeklokt</p>
        ) : (
          <ul className="divide-y">
            {activeClocks.map((c) => (
              <li key={c.id} className="flex items-center justify-between py-3 text-sm">
                <span className="font-medium text-navy-900">
                  {(c.user as { full_name?: string })?.full_name ?? 'Medewerker'}
                </span>
                <div className="flex items-center gap-2">
                  <span className="text-gray-500">sinds {formatDateTime(c.clock_in)}</span>
                  <Badge variant="active">Actief</Badge>
                </div>
              </li>
            ))}
          </ul>
        )}
      </Card>

      <div className="grid gap-4 sm:grid-cols-2">
        <Link to="/app/rooster">
          <Card className="group transition-shadow hover:shadow-md">
            <p className="font-semibold text-navy-900 group-hover:text-brand-700">Rooster beheren</p>
            <p className="mt-1 text-sm text-gray-500">Diensten plannen per week</p>
          </Card>
        </Link>
        <Link to="/app/medewerkers">
          <Card className="group transition-shadow hover:shadow-md">
            <p className="font-semibold text-navy-900 group-hover:text-brand-700">Medewerkers</p>
            <p className="mt-1 text-sm text-gray-500">Team beheren en rollen instellen</p>
          </Card>
        </Link>
        <Link to="/app/maandplanner">
          <Card className="group transition-shadow hover:shadow-md">
            <p className="font-semibold text-navy-900 group-hover:text-brand-700">Maandplanner</p>
            <p className="mt-1 text-sm text-gray-500">Automatisch rooster genereren</p>
          </Card>
        </Link>
        <Link to="/app/verlof">
          <Card className="group transition-shadow hover:shadow-md">
            <p className="font-semibold text-navy-900 group-hover:text-brand-700">Verlofaanvragen</p>
            <p className="mt-1 text-sm text-gray-500">
              {pendingLeave > 0 ? `${pendingLeave} openstaand` : 'Alles behandeld'}
            </p>
          </Card>
        </Link>
      </div>
    </div>
  )
}
