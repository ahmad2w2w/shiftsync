import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Users, Palmtree, Clock, Download, ChevronRight, FileText, FileSpreadsheet } from 'lucide-react'
import { getAllUsers } from '../services/users'
import { getPendingLeaveCount } from '../services/leave'
import { getAllClockRecords } from '../services/clock'
import { getShiftsForPeriod } from '../services/shifts'
import { exportScheduleToPDF, exportScheduleToExcel } from '../services/export'
import { useOrganization } from '../context/OrganizationContext'
import { useToast } from '../context/ToastContext'
import type { ClockRecord } from '../types/database'
import { Card, CardHeader } from '../components/ui/Card'
import { Badge } from '../components/ui/Badge'
import { Button } from '../components/ui/Button'
import { LoadingSpinner } from '../components/ui/LoadingSpinner'
import { formatDateTime, getWeekRange } from '../lib/utils'

export function ManagerDashboard() {
  const { organization, hasFeature } = useOrganization()
  const toast = useToast()
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

  const runExport = async (kind: 'pdf' | 'excel') => {
    if (!organization) return
    setExporting(true)
    try {
      const { start, end } = getWeekRange(new Date())
      const shifts = await getShiftsForPeriod(start, end)
      if (shifts.length === 0) {
        toast.info('Geen diensten in deze week om te exporteren')
        return
      }
      const periodLabel = `week ${start.toLocaleDateString('nl-NL', { day: 'numeric', month: 'short' })}`
      if (kind === 'pdf') exportScheduleToPDF(shifts, organization.name, periodLabel)
      else exportScheduleToExcel(shifts, organization.name, periodLabel)
      toast.success(`Export naar ${kind === 'pdf' ? 'PDF' : 'Excel'} gestart`)
    } catch {
      toast.error('Export mislukt')
    } finally {
      setExporting(false)
    }
  }

  const handleExportPDF = () => runExport('pdf')
  const handleExportExcel = () => runExport('excel')

  const stats = [
    { label: 'Medewerkers', value: employeeCount, icon: Users, to: '/app/medewerkers', color: 'bg-brand-500/15 text-brand-400' },
    { label: 'Verlof in behandeling', value: pendingLeave, icon: Palmtree, to: '/app/verlof', color: 'bg-amber-500/15 text-amber-400' },
    { label: 'Nu ingeklokt', value: activeClocks.length, icon: Clock, to: '/app/klok', color: 'bg-emerald-500/15 text-emerald-400' },
  ]

  if (loading) return <LoadingSpinner />

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-zinc-100">Dashboard</h1>
          <p className="text-sm text-zinc-500">{organization?.name}</p>
        </div>
        {hasFeature('export') ? (
          <div className="flex gap-2">
            <Button variant="secondary" size="sm" onClick={handleExportPDF} loading={exporting}>
              <FileText className="h-4 w-4" />
              PDF
            </Button>
            <Button variant="secondary" size="sm" onClick={handleExportExcel} loading={exporting}>
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
        {stats.map(({ label, value, icon: Icon, to, color }) => (
          <Link key={label} to={to}>
            <Card className="transition-all hover:card-shadow-md hover:-translate-y-0.5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium text-zinc-500">{label}</p>
                  <p className="mt-0.5 text-3xl font-bold text-zinc-100">{value}</p>
                </div>
                <div className={`flex h-11 w-11 items-center justify-center rounded-xl ${color}`}>
                  <Icon className="h-5 w-5" />
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
            <Link to="/app/klok" className="flex items-center gap-1 text-sm text-brand-400 hover:text-brand-300 transition-colors">
              Alles bekijken <ChevronRight className="h-4 w-4" />
            </Link>
          }
        />
        {activeClocks.length === 0 ? (
          <p className="text-sm text-zinc-600">Niemand is momenteel ingeklokt</p>
        ) : (
          <ul className="divide-y divide-white/6">
            {activeClocks.map((c) => (
              <li key={c.id} className="flex items-center justify-between py-3 text-sm">
                <span className="font-medium text-zinc-200">
                  {(c.user as { full_name?: string })?.full_name ?? 'Medewerker'}
                </span>
                <div className="flex items-center gap-2">
                  <span className="text-zinc-500">sinds {formatDateTime(c.clock_in)}</span>
                  <Badge variant="active">Actief</Badge>
                </div>
              </li>
            ))}
          </ul>
        )}
      </Card>

      <div className="grid gap-4 sm:grid-cols-2">
        {[
          { to: '/app/rooster', title: 'Rooster beheren', desc: 'Diensten plannen per week' },
          { to: '/app/medewerkers', title: 'Medewerkers', desc: 'Team beheren en rollen instellen' },
          { to: '/app/maandplanner', title: 'Maandplanner', desc: 'Automatisch rooster genereren' },
          { to: '/app/verlof', title: 'Verlofaanvragen', desc: pendingLeave > 0 ? `${pendingLeave} openstaand` : 'Alles behandeld' },
        ].map(({ to, title, desc }) => (
          <Link key={to} to={to}>
            <Card className="group transition-all hover:card-shadow-md hover:border-white/15 hover:-translate-y-0.5">
              <p className="font-semibold text-zinc-200 group-hover:text-brand-400 transition-colors">{title}</p>
              <p className="mt-1 text-sm text-zinc-500">{desc}</p>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  )
}
