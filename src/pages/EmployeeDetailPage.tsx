import { useCallback, useEffect, useState } from 'react'
import { Navigate, useParams, useNavigate, Link } from 'react-router-dom'
import { startOfMonth, endOfMonth } from 'date-fns'
import { useAuth } from '../context/AuthContext'
import { useOrganization } from '../context/OrganizationContext'
import { useOrgConfig } from '../context/OrgConfigContext'
import { useToast } from '../context/ToastContext'
import { getCurrentUserProfile } from '../services/users'
import { getShiftsForPeriod } from '../services/shifts'
import { getClockRecords, sumHours } from '../services/clock'
import { getLeaveRequests } from '../services/leave'
import { getAvailabilityForPeriod } from '../services/availability'
import { getLeaveBalances, setLeaveBalance } from '../services/leaveTypes'
import type { User, Shift, LeaveRequest, Availability, LeaveBalance } from '../types/database'
import { Card, CardHeader } from '../components/ui/Card'
import { Button } from '../components/ui/Button'
import { Input } from '../components/ui/Input'
import { Badge } from '../components/ui/Badge'
import { StatusBadge } from '../components/ui/StatusBadge'
import { PageHeader } from '../components/ui/PageHeader'
import { EmptyState } from '../components/ui/EmptyState'
import { DashboardSkeleton } from '../components/ui/Skeleton'
import { LoadError } from '../components/ui/LoadError'
import { Avatar } from '../components/ui/Avatar'
import { ArrowLeft, CalendarDays, Timer, Palmtree, CalendarCheck } from 'lucide-react'
import { formatDate, formatTime } from '../lib/utils'

const YEAR = new Date().getFullYear()

export function EmployeeDetailPage() {
  const { id } = useParams<{ id: string }>()
  const { isAdmin } = useAuth()
  const { organization } = useOrganization()
  const { leaveTypes } = useOrgConfig()
  const toast = useToast()
  const navigate = useNavigate()

  const [user, setUser] = useState<User | null>(null)
  const [shifts, setShifts] = useState<Shift[]>([])
  const [hours, setHours] = useState(0)
  const [leave, setLeave] = useState<LeaveRequest[]>([])
  const [availability, setAvailability] = useState<Availability[]>([])
  const [balances, setBalances] = useState<LeaveBalance[]>([])
  const [balanceEdits, setBalanceEdits] = useState<Record<string, string>>({})
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState(false)
  const [savingBalances, setSavingBalances] = useState(false)

  const load = useCallback(async () => {
    if (!id) return
    setLoading(true)
    setLoadError(false)
    try {
      const now = new Date()
      const monthStart = startOfMonth(now)
      const monthEnd = endOfMonth(now)
      const [u, s, recs, lv, av, bal] = await Promise.all([
        getCurrentUserProfile(id),
        getShiftsForPeriod(monthStart, monthEnd, { userId: id }),
        getClockRecords(id, 'month', now),
        getLeaveRequests(id),
        getAvailabilityForPeriod(id, monthStart, monthEnd),
        getLeaveBalances(YEAR, id).catch(() => []),
      ])
      setUser(u)
      setShifts(s)
      setHours(sumHours(recs))
      setLeave(lv)
      setAvailability(av)
      setBalances(bal)
    } catch {
      setLoadError(true)
    } finally {
      setLoading(false)
    }
  }, [id])

  useEffect(() => {
    if (isAdmin) load()
  }, [isAdmin, load])

  if (!isAdmin) return <Navigate to="/app/dashboard" replace />

  const balanceFor = (leaveTypeId: string) => balances.find((b) => b.leave_type_id === leaveTypeId)

  const saveBalances = async () => {
    if (!organization || !id) return
    setSavingBalances(true)
    try {
      const entries = Object.entries(balanceEdits)
      for (const [typeId, value] of entries) {
        if (value === '') continue
        await setLeaveBalance(organization.id, id, typeId, YEAR, Number(value))
      }
      toast.success('Verlofsaldo opgeslagen')
      setBalanceEdits({})
      load()
    } catch {
      toast.error('Saldo opslaan mislukt')
    } finally {
      setSavingBalances(false)
    }
  }

  if (loadError) return <div className="mx-auto max-w-5xl"><LoadError onRetry={load} /></div>
  if (loading) return <div className="mx-auto max-w-5xl"><DashboardSkeleton /></div>
  if (!user) return <div className="mx-auto max-w-5xl"><EmptyState icon={CalendarDays} title="Niet gevonden" description="Deze medewerker bestaat niet." /></div>

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <button onClick={() => navigate('/app/medewerkers')} className="inline-flex items-center gap-1.5 text-sm font-medium" style={{ color: 'var(--text-muted)' }}>
        <ArrowLeft className="h-4 w-4" /> Terug naar medewerkers
      </button>

      <PageHeader title={user.full_name} subtitle={user.email} />

      <Card>
        <div className="flex flex-wrap items-center gap-4">
          <Avatar name={user.full_name} src={user.avatar_url ?? undefined} size="lg" />
          <div className="flex flex-wrap gap-x-8 gap-y-3">
            <div>
              <p className="text-xs" style={{ color: 'var(--text-muted)' }}>Rol</p>
              <Badge variant={user.role}>{user.role === 'admin' ? 'Manager' : 'Medewerker'}</Badge>
            </div>
            <div>
              <p className="text-xs" style={{ color: 'var(--text-muted)' }}>Uurloon</p>
              <p className="font-semibold" style={{ color: 'var(--text-primary)' }}>€ {Number(user.hourly_rate).toFixed(2)}</p>
            </div>
            <div>
              <p className="text-xs" style={{ color: 'var(--text-muted)' }}>Contract</p>
              <p className="font-semibold" style={{ color: 'var(--text-primary)' }}>{user.contract_hours_per_week != null ? `${user.contract_hours_per_week} u/wk` : '—'}</p>
            </div>
            <div>
              <p className="text-xs" style={{ color: 'var(--text-muted)' }}>Status</p>
              <Badge variant={user.active === false ? 'default' : 'approved'}>{user.active === false ? 'Inactief' : 'Actief'}</Badge>
            </div>
          </div>
        </div>
      </Card>

      <div className="grid gap-4 sm:grid-cols-3">
        <Card>
          <p className="flex items-center gap-2 text-sm" style={{ color: 'var(--text-muted)' }}><CalendarDays className="h-4 w-4" /> Diensten deze maand</p>
          <p className="mt-1 text-3xl font-bold" style={{ color: 'var(--text-primary)' }}>{shifts.length}</p>
        </Card>
        <Card>
          <p className="flex items-center gap-2 text-sm" style={{ color: 'var(--text-muted)' }}><Timer className="h-4 w-4" /> Gewerkte uren</p>
          <p className="mt-1 text-3xl font-bold" style={{ color: 'var(--text-primary)' }}>{hours.toFixed(1)}</p>
        </Card>
        <Card>
          <p className="flex items-center gap-2 text-sm" style={{ color: 'var(--text-muted)' }}><CalendarCheck className="h-4 w-4" /> Beschikbare dagen</p>
          <p className="mt-1 text-3xl font-bold" style={{ color: 'var(--text-primary)' }}>{availability.length}</p>
        </Card>
      </div>

      {/* Leave balances editor */}
      {leaveTypes.length > 0 && (
        <Card>
          <CardHeader title="Verlofsaldo" subtitle={`Beginsaldo per type voor ${YEAR}`} />
          <div className="space-y-3">
            {leaveTypes.map((lt) => {
              const b = balanceFor(lt.id)
              const used = Number(b?.used_hours ?? 0)
              const balance = Number(b?.balance_hours ?? lt.default_balance_hours ?? 0)
              return (
                <div key={lt.id} className="flex flex-wrap items-center justify-between gap-3 rounded-xl p-3" style={{ background: 'var(--surface-subtle)' }}>
                  <div className="flex items-center gap-2">
                    <span className="h-2.5 w-2.5 rounded-full" style={{ background: lt.color }} />
                    <span className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>{lt.name}</span>
                    <span className="text-xs" style={{ color: 'var(--text-muted)' }}>· {used.toFixed(0)} u gebruikt · {(balance - used).toFixed(0)} u resterend</span>
                  </div>
                  <div className="w-32">
                    <Input
                      type="number"
                      min={0}
                      step="1"
                      value={balanceEdits[lt.id] ?? String(balance)}
                      onChange={(e) => setBalanceEdits((prev) => ({ ...prev, [lt.id]: e.target.value }))}
                      aria-label={`Saldo ${lt.name}`}
                    />
                  </div>
                </div>
              )
            })}
            <div className="flex justify-end">
              <Button size="sm" loading={savingBalances} onClick={saveBalances} disabled={Object.keys(balanceEdits).length === 0}>
                Saldo opslaan
              </Button>
            </div>
          </div>
        </Card>
      )}

      {/* Shifts */}
      <Card>
        <CardHeader title="Diensten deze maand" />
        {shifts.length === 0 ? (
          <EmptyState icon={CalendarDays} title="Geen diensten" description="Geen ingeplande diensten deze maand." />
        ) : (
          <div className="space-y-2">
            {shifts.map((s) => (
              <div key={s.id} className="flex items-center justify-between rounded-xl p-3" style={{ background: 'var(--surface-subtle)' }}>
                <div>
                  <p className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>{formatDate(s.date, 'EEE d MMM')}</p>
                  <p className="text-xs" style={{ color: 'var(--text-muted)' }}>{formatTime(s.start_time)}–{formatTime(s.end_time)} · {s.position}</p>
                </div>
                <StatusBadge domain="shift" status={s.status} />
              </div>
            ))}
          </div>
        )}
      </Card>

      {/* Leave */}
      <Card>
        <CardHeader title="Verlofaanvragen" action={<Link to="/app/verlof" className="text-sm font-medium text-brand-600 hover:underline">Alle aanvragen</Link>} />
        {leave.length === 0 ? (
          <EmptyState icon={Palmtree} title="Geen verlof" description="Deze medewerker heeft geen verlofaanvragen." />
        ) : (
          <div className="space-y-2">
            {leave.slice(0, 8).map((r) => (
              <div key={r.id} className="flex items-center justify-between rounded-xl p-3" style={{ background: 'var(--surface-subtle)' }}>
                <div>
                  <p className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>{formatDate(r.start_date)} – {formatDate(r.end_date)}</p>
                  <p className="text-xs" style={{ color: 'var(--text-muted)' }}>{r.leave_type?.name ?? r.reason}</p>
                </div>
                <StatusBadge domain="leave" status={r.status} />
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  )
}
