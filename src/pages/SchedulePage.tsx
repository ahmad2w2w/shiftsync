import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { format, isSameMonth } from 'date-fns'
import { CalendarDays, Plus } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { useOrganization } from '../context/OrganizationContext'
import { useToast } from '../context/ToastContext'
import { getShiftsForPeriod } from '../services/shifts'
import { getAllAvailabilityForPeriod } from '../services/availability'
import { getAllUsers } from '../services/users'
import { getLeaveRequests } from '../services/leave'
import { publishMonth } from '../services/monthPlanner'
import { notifyShiftPublished } from '../services/notifications'
import { DayPlannerPopover } from '../components/schedule/DayPlannerPopover'
import { ShiftModal } from '../components/schedule/ShiftModal'
import { PublishPreviewModal } from '../components/schedule/PublishPreviewModal'
import { ScheduleActionsMenu } from '../components/schedule/ScheduleActionsMenu'
import { ScheduleShiftCard } from '../components/schedule/ScheduleShiftCard'
import { MonthCalendar, formatDayHeader } from '../components/calendar/MonthCalendar'
import type { Availability, LeaveRequest, Shift, User } from '../types/database'
import { MonthNavigator } from '../components/ui/MonthNavigator'
import { PageHeader } from '../components/ui/PageHeader'
import { EmptyState } from '../components/ui/EmptyState'
import { DashboardSkeleton } from '../components/ui/Skeleton'
import { Button } from '../components/ui/Button'
import { getMonthRange, addMonths, subMonths, monthLabel, cn } from '../lib/utils'

function todayStr() {
  return format(new Date(), 'yyyy-MM-dd')
}

export function SchedulePage() {
  const { profile, isAdmin } = useAuth()
  const { organization, hasFeature } = useOrganization()
  const toast = useToast()
  const [monthAnchor, setMonthAnchor] = useState(new Date())
  const [selectedDate, setSelectedDate] = useState<string | null>(todayStr())
  const [shifts, setShifts] = useState<Shift[]>([])
  const [employees, setEmployees] = useState<User[]>([])
  const [leave, setLeave] = useState<LeaveRequest[]>([])
  const [availability, setAvailability] = useState<
    (Availability & { users?: { full_name: string } })[]
  >([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [publishing, setPublishing] = useState(false)
  const [shiftModalOpen, setShiftModalOpen] = useState(false)
  const [publishModalOpen, setPublishModalOpen] = useState(false)
  const [editShift, setEditShift] = useState<Shift | null>(null)
  const [modalUserId, setModalUserId] = useState<string | null>(null)
  const [modalDate, setModalDate] = useState(todayStr())
  const [popover, setPopover] = useState<{ date: string; anchor: DOMRect } | null>(null)

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
  }, [profile?.id, isAdmin, periodKey, fetchData])

  useEffect(() => {
    setPopover(null)
  }, [monthAnchor])

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

  const openAddShift = (date?: string) => {
    setModalDate(date ?? selectedDate ?? todayStr())
    setModalUserId(null)
    setEditShift(null)
    setShiftModalOpen(true)
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
      toast.success('Rooster gepubliceerd')
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
      if (day.length === 0) return undefined
      return {
        filled: day.filter((s) => s.user_id).length,
        open: day.filter((s) => !s.user_id).length,
        available: 0,
      }
    },
    [shiftsByDate]
  )

  const getDayShifts = useCallback(
    (dateStr: string) => shiftsByDate.get(dateStr) ?? [],
    [shiftsByDate]
  )

  const dayShifts = selectedDate ? (shiftsByDate.get(selectedDate) ?? []) : []
  const assignedShifts = dayShifts.filter((s) => s.user_id)
  const monthLabelStr = monthLabel(monthAnchor)

  if (loading) return <DashboardSkeleton />

  return (
    <div className="w-full space-y-5">
      <PageHeader
        title="Rooster"
        subtitle={isAdmin ? monthLabelStr : `Je diensten · ${monthLabelStr}`}
        action={
          <div className="flex flex-wrap items-center gap-2">
            <MonthNavigator
              monthAnchor={monthAnchor}
              onPrev={() => setMonthAnchor(subMonths(monthAnchor, 1))}
              onNext={() => setMonthAnchor(addMonths(monthAnchor, 1))}
              onToday={() => { setMonthAnchor(new Date()); setSelectedDate(todayStr()) }}
            />
            {isAdmin && (
              <>
                <Button size="sm" onClick={() => openAddShift()}>
                  <Plus className="h-4 w-4" /> Dienst
                </Button>
                <ScheduleActionsMenu
                  shifts={shifts}
                  employees={employees}
                  organizationName={organization?.name ?? 'ShiftSync'}
                  periodLabel={monthLabelStr}
                  periodStart={start}
                  periodEnd={end}
                  monthAnchor={monthAnchor}
                  onPublish={() => setPublishModalOpen(true)}
                  onCleared={reload}
                />
              </>
            )}
          </div>
        }
      />

      <div className={cn('space-y-4 transition-opacity', refreshing && 'opacity-60')}>
        <div
          className="rounded-2xl p-4 sm:p-5"
          style={{ background: 'var(--surface-card)', border: '1px solid var(--border)' }}
        >
          <MonthCalendar
            size="large"
            monthAnchor={monthAnchor}
            selectedDate={selectedDate}
            onSelectDate={(d, anchor) => {
              if (!isSameMonth(new Date(d + 'T12:00:00'), monthAnchor)) return
              setSelectedDate(d)
              if (isAdmin) {
                setPopover((prev) =>
                  prev?.date === d ? null : { date: d, anchor }
                )
              }
            }}
            getDayMeta={isAdmin ? dayMeta : undefined}
            getDayShifts={isAdmin ? getDayShifts : undefined}
          />
        </div>

        {isAdmin && popover && (
          <DayPlannerPopover
            date={popover.date}
            anchor={popover.anchor}
            shifts={shifts}
            employees={employees}
            availability={availability}
            leave={leave}
            onSaved={reload}
            onClose={() => setPopover(null)}
          />
        )}

        {!isAdmin && selectedDate && (
          <div
            className="rounded-2xl p-5"
            style={{ background: 'var(--surface-card)', border: '1px solid var(--border)' }}
          >
            <h2 className="mb-4 text-lg font-semibold capitalize" style={{ color: 'var(--text-primary)' }}>
              {formatDayHeader(selectedDate)}
            </h2>
            {assignedShifts.length === 0 ? (
              <EmptyState
                icon={CalendarDays}
                title="Geen diensten"
                description="Je hebt op deze dag geen diensten."
                action={
                  <Link to="/app/beschikbaarheid" className="text-sm text-brand-600 hover:underline">
                    Beschikbaarheid doorgeven
                  </Link>
                }
              />
            ) : (
              <ul className="space-y-2">
                {assignedShifts
                  .sort((a, b) => a.start_time.localeCompare(b.start_time))
                  .map((s) => (
                    <li key={s.id}><ScheduleShiftCard shift={s} /></li>
                  ))}
              </ul>
            )}
          </div>
        )}

        {isAdmin && !popover && (
          <p className="py-4 text-center text-sm" style={{ color: 'var(--text-muted)' }}>
            Klik op een dag — planner opent naast de cel
          </p>
        )}
      </div>

      {isAdmin && (
        <p className="text-center text-xs" style={{ color: 'var(--text-muted)' }}>
          Drag-and-drop & templates →{' '}
          <Link to="/app/maandplanner" className="font-medium text-brand-600 hover:underline">
            Maandplanner
          </Link>
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
