import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { format, isSameMonth, startOfWeek, endOfWeek, eachDayOfInterval, isSameDay } from 'date-fns'
import { nl } from 'date-fns/locale'
import {
  Sparkles,
  CalendarDays,
  ChevronRight,
  Users,
  Clock,
  AlertCircle,
  CalendarCheck,
  LayoutGrid,
  CalendarRange,
  Send,
  Plus,
} from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { useOrganization } from '../context/OrganizationContext'
import { useToast } from '../context/ToastContext'
import { getShiftsForPeriod } from '../services/shifts'
import { getAllAvailabilityForPeriod } from '../services/availability'
import { getAllUsers } from '../services/users'
import { getLeaveRequests } from '../services/leave'
import { publishMonth } from '../services/monthPlanner'
import { notifyShiftPublished } from '../services/notifications'
import { DayScheduleEditor } from '../components/schedule/DayScheduleEditor'
import { DayDrawer } from '../components/schedule/DayDrawer'
import { ShiftModal } from '../components/schedule/ShiftModal'
import { PublishPreviewModal } from '../components/schedule/PublishPreviewModal'
import { WeekScheduleHub } from '../components/schedule/WeekScheduleHub'
import { AIPlannerPanel } from '../components/schedule/AIPlannerPanel'
import { ScheduleShiftCard } from '../components/schedule/ScheduleShiftCard'
import { ScheduleTimeline } from '../components/schedule/ScheduleTimeline'
import { MonthCalendar, formatDayHeader } from '../components/calendar/MonthCalendar'
import type { Availability, LeaveRequest, Shift, User } from '../types/database'
import { MonthNavigator } from '../components/ui/MonthNavigator'
import { PageHeader } from '../components/ui/PageHeader'
import { EmptyState } from '../components/ui/EmptyState'
import { DashboardSkeleton } from '../components/ui/Skeleton'
import { Tabs } from '../components/ui/Tabs'
import { Button } from '../components/ui/Button'
import { ScheduleExportButton } from '../components/schedule/ScheduleExportButton'
import { getMonthRange, addMonths, subMonths, monthLabel, formatDate, cn } from '../lib/utils'

type ScheduleTab = 'month' | 'week' | 'ai'

function todayStr() {
  return format(new Date(), 'yyyy-MM-dd')
}

export function SchedulePage() {
  const { profile, isAdmin } = useAuth()
  const { organization, hasFeature } = useOrganization()
  const toast = useToast()
  const [monthAnchor, setMonthAnchor] = useState(new Date())
  const [selectedDate, setSelectedDate] = useState<string | null>(todayStr())
  const [activeTab, setActiveTab] = useState<ScheduleTab>('month')
  const [shifts, setShifts] = useState<Shift[]>([])
  const [employees, setEmployees] = useState<User[]>([])
  const [leave, setLeave] = useState<LeaveRequest[]>([])
  const [availability, setAvailability] = useState<
    (Availability & { users?: { full_name: string } })[]
  >([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [publishing, setPublishing] = useState(false)

  const [drawerOpen, setDrawerOpen] = useState(false)
  const [shiftModalOpen, setShiftModalOpen] = useState(false)
  const [publishModalOpen, setPublishModalOpen] = useState(false)
  const [editShift, setEditShift] = useState<Shift | null>(null)
  const [modalUserId, setModalUserId] = useState<string | null>(null)
  const [modalDate, setModalDate] = useState(todayStr())

  const { start, end } = useMemo(() => getMonthRange(monthAnchor), [monthAnchor])
  const periodKey = useMemo(
    () => `${format(start, 'yyyy-MM-dd')}_${format(end, 'yyyy-MM-dd')}`,
    [start, end]
  )
  const initialLoad = useRef(true)

  const fetchData = useCallback(async () => {
    if (!profile) return
    const data = await getShiftsForPeriod(start, end, {
      userId: isAdmin ? undefined : profile.id,
      publishedOnly: !isAdmin,
    })
    setShifts(isAdmin ? data : data.filter((s) => s.user_id))
    if (isAdmin) {
      const [avail, users, leaveData] = await Promise.all([
        getAllAvailabilityForPeriod(start, end),
        getAllUsers(),
        getLeaveRequests(),
      ])
      setAvailability(avail)
      setEmployees(users)
      setLeave(leaveData)
    }
  }, [profile?.id, isAdmin, start, end])

  useEffect(() => {
    if (!profile) return
    let cancelled = false
    if (initialLoad.current) {
      setLoading(true)
    } else {
      setRefreshing(true)
    }
    fetchData()
      .catch(() => { if (!cancelled) toast.error('Rooster laden mislukt. Probeer opnieuw.') })
      .finally(() => {
        if (!cancelled) {
          setLoading(false)
          setRefreshing(false)
          initialLoad.current = false
        }
      })
    return () => { cancelled = true }
  }, [profile?.id, isAdmin, periodKey, fetchData])

  useEffect(() => {
    if (!selectedDate) return
    const d = new Date(selectedDate + 'T12:00:00')
    if (!isSameMonth(d, monthAnchor)) {
      setSelectedDate(format(start, 'yyyy-MM-dd'))
    }
  }, [monthAnchor, selectedDate, periodKey, start])

  const reload = useCallback(async () => {
    setRefreshing(true)
    try { await fetchData() } finally { setRefreshing(false) }
  }, [fetchData])

  const openAddShift = (date: string, userId?: string | null) => {
    setModalDate(date)
    setModalUserId(userId ?? null)
    setEditShift(null)
    setShiftModalOpen(true)
  }

  const openEditShift = (shift: Shift) => {
    setEditShift(shift)
    setModalDate(shift.date)
    setModalUserId(shift.user_id)
    setShiftModalOpen(true)
  }

  const openDayDrawer = (date: string) => {
    setSelectedDate(date)
    setDrawerOpen(true)
  }

  const handlePublish = async () => {
    if (!profile || !organization) return
    setPublishing(true)
    try {
      await publishMonth(monthAnchor, profile.id, organization.id)
      if (hasFeature('notifications')) {
        const label = monthLabel(monthAnchor)
        const assignedIds = new Set(shifts.filter((s) => s.user_id).map((s) => s.user_id))
        const recipients = employees.filter((e) => assignedIds.has(e.id) && e.email)
        await Promise.all(recipients.map((e) => notifyShiftPublished(e.email, e.full_name, label)))
      }
      await reload()
      setPublishModalOpen(false)
      toast.success('Maandrooster gepubliceerd!')
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Publiceren mislukt')
    } finally {
      setPublishing(false)
    }
  }

  const shiftsByDate = useMemo(() => {
    const map = new Map<string, Shift[]>()
    for (const s of shifts) {
      const list = map.get(s.date) ?? []
      list.push(s)
      map.set(s.date, list)
    }
    return map
  }, [shifts])

  const dayMeta = useCallback(
    (dateStr: string) => {
      const day = shiftsByDate.get(dateStr) ?? []
      const filled = day.filter((s) => s.user_id).length
      const open = day.filter((s) => !s.user_id).length
      const available = availability.filter((a) => a.date === dateStr).length
      if (filled === 0 && open === 0 && available === 0) return undefined
      return { filled, open, available }
    },
    [shiftsByDate, availability]
  )

  const dayShifts = selectedDate ? (shiftsByDate.get(selectedDate) ?? []) : []
  const assignedShifts = dayShifts.filter((s) => s.user_id)
  const monthFilled = shifts.filter((s) => s.user_id).length
  const monthOpen = shifts.filter((s) => !s.user_id).length
  const monthDraft = shifts.filter((s) => s.user_id && !s.published).length

  const weekDays = useMemo(() => {
    if (!selectedDate) return []
    const anchor = new Date(selectedDate + 'T12:00:00')
    const ws = startOfWeek(anchor, { weekStartsOn: 1 })
    const we = endOfWeek(anchor, { weekStartsOn: 1 })
    return eachDayOfInterval({ start: ws, end: we })
  }, [selectedDate])

  const weekAnchor = selectedDate ? new Date(selectedDate + 'T12:00:00') : new Date()

  const stats = isAdmin
    ? [
        { icon: Users, label: 'Ingepland', value: monthFilled, accent: '#3B82F6' },
        { icon: AlertCircle, label: 'Open', value: monthOpen, accent: '#F59E0B' },
        { icon: CalendarCheck, label: 'Concept', value: monthDraft, accent: '#8B5CF6' },
        { icon: Clock, label: 'Maand', value: monthLabel(monthAnchor), accent: 'var(--text-primary)', capitalize: true },
      ]
    : [
        { icon: CalendarDays, label: 'Diensten', value: monthFilled, accent: '#3B82F6' },
        { icon: Clock, label: 'Maand', value: monthLabel(monthAnchor), accent: 'var(--text-primary)', capitalize: true },
      ]

  if (loading) return <DashboardSkeleton />

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <PageHeader
        title="Rooster"
        subtitle={isAdmin ? 'Plan, publiceer en beheer diensten' : 'Je gepubliceerde diensten'}
        action={
          <div className="flex flex-wrap items-center gap-2">
            {isAdmin && (
              <>
                <ScheduleExportButton
                  shifts={shifts}
                  employees={employees}
                  organizationName={organization?.name ?? 'ShiftSync'}
                  periodLabel={monthLabel(monthAnchor)}
                  periodStart={start}
                  periodEnd={end}
                />
                <Button size="sm" variant="secondary" onClick={() => openAddShift(selectedDate ?? todayStr())}>
                  <Plus className="h-4 w-4" /> Nieuwe dienst
                </Button>
                <Button size="sm" onClick={() => setPublishModalOpen(true)}>
                  <Send className="h-4 w-4" /> Publiceren
                </Button>
              </>
            )}
            <MonthNavigator
              monthAnchor={monthAnchor}
              onPrev={() => setMonthAnchor(subMonths(monthAnchor, 1))}
              onNext={() => setMonthAnchor(addMonths(monthAnchor, 1))}
              onToday={() => { setMonthAnchor(new Date()); setSelectedDate(todayStr()) }}
            />
          </div>
        }
      />

      {isAdmin && (
        <>
          <Tabs<ScheduleTab>
            active={activeTab}
            onChange={setActiveTab}
            tabs={[
              { id: 'month', label: 'Maand', icon: <LayoutGrid className="h-4 w-4" /> },
              { id: 'week', label: 'Week', icon: <CalendarRange className="h-4 w-4" /> },
              { id: 'ai', label: 'AI Planner', icon: <Sparkles className="h-4 w-4" /> },
            ]}
          />

          <Link
            to="/app/maandplanner"
            className="group flex items-center justify-between gap-4 rounded-2xl px-5 py-4 transition-all hover:-translate-y-0.5 hover:shadow-lg"
            style={{
              background: 'linear-gradient(135deg, rgba(37,99,235,0.1) 0%, rgba(59,130,246,0.04) 100%)',
              border: '1px solid rgba(59,130,246,0.22)',
            }}
          >
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-brand-600 shadow-lg shadow-brand-600/25">
                <Sparkles className="h-5 w-5 text-white" />
              </div>
              <div>
                <p className="font-semibold" style={{ color: 'var(--text-primary)' }}>Maandplanner Pro</p>
                <p className="text-sm" style={{ color: 'var(--text-muted)' }}>Templates, bulk-planning & drag-and-drop grid</p>
              </div>
            </div>
            <ChevronRight className="h-5 w-5 transition-transform group-hover:translate-x-1" style={{ color: 'var(--brand)' }} />
          </Link>
        </>
      )}

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {stats.map(({ icon: Icon, label, value, accent, capitalize }) => (
          <div
            key={label}
            className="rounded-2xl p-4 transition-all hover:-translate-y-0.5"
            style={{ background: 'var(--surface-card)', border: '1px solid var(--border)', boxShadow: 'var(--shadow-card)' }}
          >
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg" style={{ background: `${accent}18` }}>
                <Icon className="h-4 w-4" style={{ color: accent }} />
              </div>
              <p className="text-xs font-medium uppercase tracking-wide" style={{ color: 'var(--text-muted)' }}>{label}</p>
            </div>
            <p className={cn('mt-2 text-2xl font-bold', capitalize && 'capitalize')} style={{ color: 'var(--text-primary)' }}>
              {value}
            </p>
          </div>
        ))}
      </div>

      {selectedDate && (
        <div className="flex gap-2 overflow-x-auto pb-1">
          {weekDays.map((day) => {
            const ds = format(day, 'yyyy-MM-dd')
            const meta = dayMeta(ds)
            const sel = selectedDate === ds
            const today = isSameDay(day, new Date())
            return (
              <button
                key={ds}
                type="button"
                onClick={() => setSelectedDate(ds)}
                className={cn(
                  'flex min-w-[72px] shrink-0 flex-col items-center rounded-xl px-3 py-2.5 transition-all',
                  sel && 'shadow-md ring-2 ring-brand-500'
                )}
                style={{
                  background: sel ? 'rgba(59,130,246,0.12)' : 'var(--surface-card)',
                  border: `1px solid ${sel ? 'rgba(59,130,246,0.35)' : 'var(--border)'}`,
                }}
              >
                <span className="text-[10px] font-semibold uppercase" style={{ color: 'var(--text-muted)' }}>
                  {format(day, 'EEE', { locale: nl })}
                </span>
                <span
                  className={cn('mt-0.5 text-lg font-bold', today && !sel && 'text-brand-600')}
                  style={{ color: sel ? 'var(--brand-strong)' : 'var(--text-primary)' }}
                >
                  {format(day, 'd')}
                </span>
                {meta && (
                  <span className="mt-1 text-[10px] font-medium" style={{ color: '#2563EB' }}>
                    {(meta.filled + meta.open) || meta.available}
                  </span>
                )}
              </button>
            )
          })}
        </div>
      )}

      {isAdmin && activeTab === 'week' && (
        <div className={cn('transition-opacity', refreshing && 'opacity-60')}>
          <WeekScheduleHub
            weekAnchor={weekAnchor}
            shifts={shifts}
            employees={employees}
            onDayClick={openDayDrawer}
            onShiftClick={openEditShift}
            onAddShift={openAddShift}
            onDropEmployee={(date, userId) => openAddShift(date, userId)}
          />
        </div>
      )}

      {isAdmin && activeTab === 'ai' && selectedDate && (
        <div
          className="rounded-2xl p-4 sm:p-6"
          style={{ background: 'var(--surface-card)', border: '1px solid var(--border)', boxShadow: 'var(--shadow-card)' }}
        >
          <p className="mb-4 text-sm" style={{ color: 'var(--text-muted)' }}>
            Planning voor <strong style={{ color: 'var(--text-primary)' }}>{formatDayHeader(selectedDate)}</strong>
          </p>
          <AIPlannerPanel
            date={selectedDate}
            employees={employees}
            availability={availability}
            leave={leave}
            shifts={shifts}
            onSaved={reload}
          />
        </div>
      )}

      {(activeTab === 'month' || !isAdmin) && (
        <div className="space-y-6">
          <div
            className="rounded-2xl p-4 sm:p-6"
            style={{ background: 'var(--surface-card)', border: '1px solid var(--border)', boxShadow: 'var(--shadow-card)' }}
          >
            <div className="mb-4 flex items-center justify-between gap-3">
              <h2 className="text-sm font-semibold uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>
                {monthLabel(monthAnchor)}
              </h2>
              {isAdmin && selectedDate && (
                <Button size="sm" variant="ghost" onClick={() => openDayDrawer(selectedDate)}>
                  Dagdetails →
                </Button>
              )}
            </div>
            <MonthCalendar
              size="large"
              monthAnchor={monthAnchor}
              selectedDate={selectedDate}
              onSelectDate={(d) => {
                if (isSameMonth(new Date(d + 'T12:00:00'), monthAnchor)) {
                  setSelectedDate(d)
                  if (isAdmin) openDayDrawer(d)
                }
              }}
              getDayMeta={isAdmin ? dayMeta : undefined}
              hasMarker={(d) => (shiftsByDate.get(d)?.length ?? 0) > 0}
            />
          </div>

          <div
            className={cn('rounded-2xl p-4 sm:p-6 transition-opacity', refreshing && 'opacity-60')}
            style={{ background: 'var(--surface-card)', border: '1px solid var(--border)', boxShadow: 'var(--shadow-card-md)' }}
          >
            {!selectedDate ? (
              <EmptyState
                icon={CalendarDays}
                title="Kies een dag"
                description="Selecteer een datum in de kalender of weekbalk."
              />
            ) : isAdmin ? (
              <DayScheduleEditor
                date={selectedDate}
                availability={availability}
                shifts={shifts}
                employees={employees}
                onSaved={reload}
              />
            ) : (
              <div className="space-y-5">
                <div>
                  <h2 className="text-xl font-bold capitalize" style={{ color: 'var(--text-primary)' }}>
                    {formatDayHeader(selectedDate)}
                  </h2>
                  <p className="mt-1 text-sm" style={{ color: 'var(--text-muted)' }}>
                    {assignedShifts.length === 0
                      ? 'Geen diensten op deze dag'
                      : `${assignedShifts.length} dienst${assignedShifts.length !== 1 ? 'en' : ''}`}
                  </p>
                </div>

                {assignedShifts.length > 0 && <ScheduleTimeline shifts={assignedShifts} />}

                {assignedShifts.length === 0 ? (
                  <EmptyState
                    icon={CalendarDays}
                    title="Vrij"
                    description="Je hebt op deze dag geen gepubliceerde diensten."
                    action={
                      <Link to="/app/beschikbaarheid" className="text-sm font-medium text-brand-600 hover:underline">
                        Beschikbaarheid doorgeven →
                      </Link>
                    }
                  />
                ) : (
                  <ul className="space-y-3">
                    {assignedShifts
                      .sort((a, b) => a.start_time.localeCompare(b.start_time))
                      .map((s) => (
                        <li key={s.id}>
                          <ScheduleShiftCard shift={s} />
                        </li>
                      ))}
                  </ul>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {!isAdmin && monthFilled > 0 && (
        <div
          className="rounded-2xl p-4 sm:p-6"
          style={{ background: 'var(--surface-card)', border: '1px solid var(--border)' }}
        >
          <h2 className="mb-4 text-sm font-semibold uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>
            Alle diensten · {monthLabel(monthAnchor)}
          </h2>
          <ul className="space-y-2">
            {[...shifts]
              .filter((s) => s.user_id)
              .sort((a, b) => a.date.localeCompare(b.date) || a.start_time.localeCompare(b.start_time))
              .map((s) => (
                <li key={s.id}>
                  <button
                    type="button"
                    onClick={() => setSelectedDate(s.date)}
                    className={cn(
                      'flex w-full items-center justify-between gap-4 rounded-xl px-4 py-3 text-left transition-all hover:-translate-y-0.5 hover:shadow-sm',
                      selectedDate === s.date && 'ring-1 ring-brand-500/40'
                    )}
                    style={{
                      background: selectedDate === s.date ? 'rgba(59,130,246,0.08)' : 'var(--surface-subtle)',
                      border: '1px solid var(--border)',
                    }}
                  >
                    <div>
                      <p className="font-medium capitalize" style={{ color: 'var(--text-primary)' }}>
                        {formatDate(s.date, 'EEE d MMM')}
                      </p>
                      <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
                        {s.position} · {s.start_time.slice(0, 5)}–{s.end_time.slice(0, 5)}
                      </p>
                    </div>
                    <ChevronRight className="h-4 w-4 shrink-0" style={{ color: 'var(--text-disabled)' }} />
                  </button>
                </li>
              ))}
          </ul>
        </div>
      )}

      {isAdmin && (
        <>
          <DayDrawer
            open={drawerOpen}
            onClose={() => setDrawerOpen(false)}
            date={selectedDate}
            availability={availability}
            shifts={shifts}
            employees={employees}
            onSaved={reload}
            onAddShift={openAddShift}
          />

          <ShiftModal
            open={shiftModalOpen}
            onClose={() => { setShiftModalOpen(false); setEditShift(null) }}
            onSaved={reload}
            employees={employees}
            availability={availability}
            leave={leave}
            shifts={shifts}
            initialDate={modalDate}
            initialUserId={modalUserId}
            editShift={editShift}
          />

          <PublishPreviewModal
            open={publishModalOpen}
            onClose={() => setPublishModalOpen(false)}
            onConfirm={handlePublish}
            loading={publishing}
            monthAnchor={monthAnchor}
            shifts={shifts}
            employees={employees}
            availability={availability}
            leave={leave}
          />
        </>
      )}
    </div>
  )
}
