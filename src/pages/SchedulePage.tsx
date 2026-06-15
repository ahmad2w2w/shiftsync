import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  format,
  isSameMonth,
  addMonths as dfAddMonths,
  subMonths as dfSubMonths,
  addWeeks,
  subWeeks,
  startOfMonth,
  endOfMonth,
  addDays,
  parseISO,
} from 'date-fns'
import { nl } from 'date-fns/locale'
import { CalendarDays, Plus, ChevronLeft, ChevronRight, Calendar, CalendarRange, Copy } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { useOrganization } from '../context/OrganizationContext'
import { useToast } from '../context/ToastContext'
import { useConfirm } from '../context/ConfirmContext'
import { getShiftsForPeriod, createShiftsBulk } from '../services/shifts'
import { getAllAvailabilityForPeriod } from '../services/availability'
import { getAllUsers } from '../services/users'
import { getLeaveRequests } from '../services/leave'
import { publishMonth } from '../services/monthPlanner'
import { notifyShiftPublished, createNotificationsBulk } from '../services/notifications'
import { DayPlannerPopover } from '../components/schedule/DayPlannerPopover'
import { DayPlannerPanel } from '../components/schedule/DayPlannerPanel'
import { WeekView } from '../components/schedule/WeekView'
import { ScheduleSummaryBar } from '../components/schedule/ScheduleSummaryBar'
import { ShiftModal } from '../components/schedule/ShiftModal'
import { PublishPreviewModal } from '../components/schedule/PublishPreviewModal'
import { ScheduleActionsMenu } from '../components/schedule/ScheduleActionsMenu'
import { ScheduleShiftCard } from '../components/schedule/ScheduleShiftCard'
import { MonthCalendar, formatDayHeader } from '../components/calendar/MonthCalendar'
import type { Availability, LeaveRequest, Shift, User } from '../types/database'
import { PageHeader } from '../components/ui/PageHeader'
import { EmptyState } from '../components/ui/EmptyState'
import { DashboardSkeleton } from '../components/ui/Skeleton'
import { Button } from '../components/ui/Button'
import { SegmentedControl } from '../components/ui/SegmentedControl'
import { getMonthRange, getWeekRange, monthLabel, weekLabel, cn } from '../lib/utils'
import { shiftHours } from '../lib/plannerEngine'

type ViewMode = 'maand' | 'week' | 'dag'

function todayStr() {
  return format(new Date(), 'yyyy-MM-dd')
}

export function SchedulePage() {
  const { profile, isAdmin } = useAuth()
  const { organization, hasFeature } = useOrganization()
  const toast = useToast()
  const confirm = useConfirm()
  const [view, setView] = useState<ViewMode>('maand')
  const [anchor, setAnchor] = useState(new Date())
  const [selectedDate, setSelectedDate] = useState<string>(todayStr())
  const [shifts, setShifts] = useState<Shift[]>([])
  const [employees, setEmployees] = useState<User[]>([])
  const [leave, setLeave] = useState<LeaveRequest[]>([])
  const [availability, setAvailability] = useState<(Availability & { users?: { full_name: string } })[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [publishing, setPublishing] = useState(false)
  const [copying, setCopying] = useState(false)
  const [shiftModalOpen, setShiftModalOpen] = useState(false)
  const [publishModalOpen, setPublishModalOpen] = useState(false)
  const [editShift, setEditShift] = useState<Shift | null>(null)
  const [modalDate, setModalDate] = useState(todayStr())
  const [popover, setPopover] = useState<{ date: string; anchor: DOMRect; point: { x: number; y: number } } | null>(null)

  const monthRange = useMemo(() => getMonthRange(anchor), [anchor])
  const weekRange = useMemo(() => getWeekRange(anchor), [anchor])

  const { fetchStart, fetchEnd } = useMemo(() => {
    if (view === 'week') return { fetchStart: startOfMonth(weekRange.start), fetchEnd: endOfMonth(weekRange.end) }
    return { fetchStart: monthRange.start, fetchEnd: monthRange.end }
  }, [view, weekRange.start, weekRange.end, monthRange.start, monthRange.end])

  const periodKey = useMemo(() => `${format(fetchStart, 'yyyy-MM-dd')}_${format(fetchEnd, 'yyyy-MM-dd')}`, [fetchStart, fetchEnd])
  const initialLoad = useRef(true)

  const fetchData = useCallback(async () => {
    if (!profile) return
    const data = await getShiftsForPeriod(fetchStart, fetchEnd, {
      userId: isAdmin ? undefined : profile.id,
      publishedOnly: !isAdmin,
    })
    setShifts(isAdmin ? data : data.filter((s) => s.user_id))
    if (isAdmin) {
      const [avail, users, leaveData] = await Promise.all([
        getAllAvailabilityForPeriod(fetchStart, fetchEnd),
        getAllUsers(),
        getLeaveRequests(),
      ])
      setAvailability(avail)
      setEmployees(users)
      setLeave(leaveData)
    }
  }, [profile?.id, isAdmin, fetchStart, fetchEnd]) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!profile) return
    let cancelled = false
    if (initialLoad.current) setLoading(true)
    else setRefreshing(true)
    fetchData()
      .catch(() => { if (!cancelled) toast.error('Rooster laden mislukt') })
      .finally(() => {
        if (!cancelled) {
          setLoading(false)
          setRefreshing(false)
          initialLoad.current = false
        }
      })
    return () => { cancelled = true }
  }, [profile?.id, isAdmin, periodKey, fetchData]) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => { setPopover(null) }, [anchor, view])

  const reload = useCallback(async () => {
    setRefreshing(true)
    try { await fetchData() } finally { setRefreshing(false) }
  }, [fetchData])

  const rateById = useMemo(() => {
    const m = new Map<string, number>()
    employees.forEach((e) => m.set(e.id, e.hourly_rate ?? 0))
    return m
  }, [employees])

  const shiftsByDate = useMemo(() => {
    const map = new Map<string, Shift[]>()
    for (const s of shifts) {
      const list = map.get(s.date) ?? []
      list.push(s)
      map.set(s.date, list)
    }
    return map
  }, [shifts])

  const weekDayKeys = useMemo(() => new Set(weekRange.days.map((d) => format(d, 'yyyy-MM-dd'))), [weekRange.days])
  const visibleShifts = useMemo(() => {
    if (view === 'week') return shifts.filter((s) => weekDayKeys.has(s.date))
    if (view === 'dag') return shiftsByDate.get(selectedDate) ?? []
    return shifts
  }, [view, shifts, weekDayKeys, shiftsByDate, selectedDate])

  const summary = useMemo(() => {
    let hours = 0, cost = 0, open = 0
    visibleShifts.forEach((s) => {
      const h = shiftHours(s.start_time, s.end_time)
      hours += h
      if (s.user_id) cost += h * (rateById.get(s.user_id) ?? 0)
      else open++
    })
    return { hours, cost, open, count: visibleShifts.length }
  }, [visibleShifts, rateById])

  const dayMeta = useCallback(
    (dateStr: string) => {
      const day = shiftsByDate.get(dateStr) ?? []
      if (day.length === 0) return undefined
      return { filled: day.filter((s) => s.user_id).length, open: day.filter((s) => !s.user_id).length, available: 0 }
    },
    [shiftsByDate]
  )
  const getDayShifts = useCallback((dateStr: string) => shiftsByDate.get(dateStr) ?? [], [shiftsByDate])

  const openAddShift = (date?: string) => {
    setModalDate(date ?? selectedDate ?? todayStr())
    setEditShift(null)
    setShiftModalOpen(true)
  }

  const handleEditShift = (shift: Shift) => {
    setEditShift(shift)
    setModalDate(shift.date)
    setShiftModalOpen(true)
  }

  const goPrev = () => setAnchor(view === 'week' ? subWeeks(anchor, 1) : dfSubMonths(anchor, 1))
  const goNext = () => setAnchor(view === 'week' ? addWeeks(anchor, 1) : dfAddMonths(anchor, 1))
  const goToday = () => { setAnchor(new Date()); setSelectedDate(todayStr()) }

  const copyPrevWeek = async () => {
    if (!organization) return
    const ok = await confirm({
      title: 'Vorige week kopiëren?',
      message: 'Alle diensten van vorige week worden als concept naar deze week gekopieerd.',
      confirmLabel: 'Kopiëren',
    })
    if (!ok) return
    setCopying(true)
    try {
      const prev = getWeekRange(subWeeks(anchor, 1))
      const prevShifts = await getShiftsForPeriod(prev.start, prev.end)
      if (prevShifts.length === 0) { toast.info('Vorige week heeft geen diensten'); return }
      await createShiftsBulk(
        prevShifts.map((s) => ({
          organization_id: organization.id,
          user_id: s.user_id,
          date: format(addDays(parseISO(s.date), 7), 'yyyy-MM-dd'),
          start_time: s.start_time,
          end_time: s.end_time,
          position: s.position,
          status: 'scheduled' as const,
          published: false,
          template_id: null,
          slot_index: s.slot_index ?? 0,
        }))
      )
      await reload()
      toast.success(`${prevShifts.length} diensten gekopieerd`)
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Kopiëren mislukt')
    } finally {
      setCopying(false)
    }
  }

  const handlePublish = async () => {
    if (!profile || !organization) return
    setPublishing(true)
    try {
      await publishMonth(anchor, profile.id, organization.id)
      const label = monthLabel(anchor)
      const assignedIds = new Set(shifts.filter((s) => s.user_id).map((s) => s.user_id))
      const recipients = employees.filter((e) => assignedIds.has(e.id))
      // In-app notifications (core)
      await createNotificationsBulk(
        recipients.map((e) => ({
          organizationId: organization.id,
          userId: e.id,
          type: 'shift_published' as const,
          title: 'Rooster gepubliceerd',
          body: `Je rooster voor ${label} staat klaar.`,
          link: '/app/rooster',
        }))
      ).catch(() => {})
      // Email notifications (optional feature)
      if (hasFeature('notifications')) {
        await Promise.all(recipients.filter((e) => e.email).map((e) => notifyShiftPublished(e.email, e.full_name, label)))
      }
      await reload()
      setPublishModalOpen(false)
      toast.success('Rooster gepubliceerd')
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Publiceren mislukt')
    } finally {
      setPublishing(false)
    }
  }

  const headerLabel = view === 'week' ? weekLabel(anchor) : view === 'dag' ? format(parseISO(selectedDate), 'd MMMM yyyy', { locale: nl }) : monthLabel(anchor)
  const dayShifts = shiftsByDate.get(selectedDate) ?? []
  const assignedShifts = dayShifts.filter((s) => s.user_id)

  if (loading) return <DashboardSkeleton />

  return (
    <div className="w-full space-y-5">
      <PageHeader
        title="Rooster"
        subtitle={isAdmin ? headerLabel : `Je diensten · ${monthLabel(anchor)}`}
        action={
          <div className="flex flex-wrap items-center gap-2">
            {isAdmin && (
              <SegmentedControl
                value={view}
                onChange={(v) => setView(v)}
                segments={[
                  { value: 'maand', label: 'Maand', icon: <CalendarRange className="h-3.5 w-3.5" /> },
                  { value: 'week', label: 'Week', icon: <Calendar className="h-3.5 w-3.5" /> },
                  { value: 'dag', label: 'Dag', icon: <CalendarDays className="h-3.5 w-3.5" /> },
                ]}
                aria-label="Weergave"
              />
            )}
            <div className="flex items-center gap-1.5">
              <Button variant="secondary" size="sm" onClick={goPrev} aria-label="Vorige"><ChevronLeft className="h-4 w-4" /></Button>
              <Button variant="ghost" size="sm" onClick={goToday}>Vandaag</Button>
              <Button variant="secondary" size="sm" onClick={goNext} aria-label="Volgende"><ChevronRight className="h-4 w-4" /></Button>
            </div>
            {isAdmin && (
              <>
                {view === 'week' && (
                  <Button variant="secondary" size="sm" onClick={copyPrevWeek} loading={copying}>
                    <Copy className="h-4 w-4" /> Vorige week
                  </Button>
                )}
                <Button size="sm" onClick={() => openAddShift()}>
                  <Plus className="h-4 w-4" /> Dienst
                </Button>
                <ScheduleActionsMenu
                  shifts={shifts}
                  employees={employees}
                  organizationName={organization?.name ?? 'ShiftSync'}
                  periodLabel={monthLabel(anchor)}
                  periodStart={monthRange.start}
                  periodEnd={monthRange.end}
                  monthAnchor={anchor}
                  onPublish={() => setPublishModalOpen(true)}
                  onCleared={reload}
                />
              </>
            )}
          </div>
        }
      />

      {isAdmin && <ScheduleSummaryBar hours={summary.hours} cost={summary.cost} shiftCount={summary.count} openCount={summary.open} />}

      <div className={cn('space-y-4 transition-opacity', refreshing && 'opacity-60')}>
        {/* ADMIN — MONTH */}
        {isAdmin && view === 'maand' && (
          <>
            <div className="rounded-2xl p-4 sm:p-5" style={{ background: 'var(--surface-card)', border: '1px solid var(--border)' }}>
              <MonthCalendar
                size="large"
                monthAnchor={anchor}
                selectedDate={selectedDate}
                onSelectDate={(d, rect, point) => {
                  if (!isSameMonth(new Date(d + 'T12:00:00'), anchor)) return
                  setSelectedDate(d)
                  setPopover((prev) => (prev?.date === d ? null : { date: d, anchor: rect, point }))
                }}
                getDayMeta={dayMeta}
                getDayShifts={getDayShifts}
              />
            </div>
            {popover && (
              <DayPlannerPopover
                date={popover.date}
                anchor={popover.anchor}
                point={popover.point}
                shifts={shifts}
                employees={employees}
                availability={availability}
                leave={leave}
                onSaved={reload}
                onClose={() => setPopover(null)}
              />
            )}
            {!popover && (
              <p className="py-2 text-center text-sm" style={{ color: 'var(--text-muted)' }}>
                Klik op een dag — planner opent naast de cel
              </p>
            )}
          </>
        )}

        {/* ADMIN — WEEK */}
        {isAdmin && view === 'week' && (
          <WeekView
            weekDays={weekRange.days}
            shifts={shifts}
            employees={employees}
            availability={availability}
            leave={leave}
            rateById={rateById}
            onReload={reload}
            onEditShift={handleEditShift}
          />
        )}

        {/* ADMIN — DAY */}
        {isAdmin && view === 'dag' && (
          <div className="space-y-3">
            <div className="flex items-center justify-center gap-3">
              <Button variant="secondary" size="sm" onClick={() => setSelectedDate(format(addDays(parseISO(selectedDate), -1), 'yyyy-MM-dd'))} aria-label="Vorige dag"><ChevronLeft className="h-4 w-4" /></Button>
              <span className="min-w-[180px] text-center text-sm font-semibold capitalize" style={{ color: 'var(--text-primary)' }}>{formatDayHeader(selectedDate)}</span>
              <Button variant="secondary" size="sm" onClick={() => setSelectedDate(format(addDays(parseISO(selectedDate), 1), 'yyyy-MM-dd'))} aria-label="Volgende dag"><ChevronRight className="h-4 w-4" /></Button>
            </div>
            <DayPlannerPanel
              date={selectedDate}
              shifts={shifts}
              employees={employees}
              availability={availability}
              leave={leave}
              onSaved={reload}
            />
          </div>
        )}

        {/* EMPLOYEE — month calendar + day detail */}
        {!isAdmin && (
          <>
            <div className="rounded-2xl p-4 sm:p-5" style={{ background: 'var(--surface-card)', border: '1px solid var(--border)' }}>
              <MonthCalendar
                size="large"
                monthAnchor={anchor}
                selectedDate={selectedDate}
                onSelectDate={(d) => { if (isSameMonth(new Date(d + 'T12:00:00'), anchor)) setSelectedDate(d) }}
              />
            </div>
            <div className="rounded-2xl p-5" style={{ background: 'var(--surface-card)', border: '1px solid var(--border)' }}>
              <h2 className="mb-4 text-lg font-semibold capitalize" style={{ color: 'var(--text-primary)' }}>{formatDayHeader(selectedDate)}</h2>
              {assignedShifts.length === 0 ? (
                <EmptyState
                  icon={CalendarDays}
                  title="Geen diensten"
                  description="Je hebt op deze dag geen diensten."
                  action={<Link to="/app/beschikbaarheid" className="text-sm text-brand-600 hover:underline">Beschikbaarheid doorgeven</Link>}
                />
              ) : (
                <ul className="space-y-2">
                  {assignedShifts.sort((a, b) => a.start_time.localeCompare(b.start_time)).map((s) => (
                    <li key={s.id}><ScheduleShiftCard shift={s} /></li>
                  ))}
                </ul>
              )}
            </div>
          </>
        )}
      </div>

      {isAdmin && (
        <p className="text-center text-xs" style={{ color: 'var(--text-muted)' }}>
          Templates & maandgeneratie →{' '}
          <Link to="/app/maandplanner" className="font-medium text-brand-600 hover:underline">Maandplanner</Link>
        </p>
      )}

      {isAdmin && (
        <>
          <ShiftModal
            open={shiftModalOpen}
            onClose={() => { setShiftModalOpen(false); setEditShift(null) }}
            onSaved={reload}
            employees={employees}
            availability={availability}
            leave={leave}
            shifts={shifts}
            initialDate={modalDate}
            initialUserId={null}
            editShift={editShift}
          />
          <PublishPreviewModal
            open={publishModalOpen}
            onClose={() => setPublishModalOpen(false)}
            onConfirm={handlePublish}
            loading={publishing}
            monthAnchor={anchor}
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
