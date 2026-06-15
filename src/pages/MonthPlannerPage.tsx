import { useCallback, useEffect, useMemo, useState } from 'react'
import { Link, Navigate } from 'react-router-dom'
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core'
import {
  Calendar,
  LayoutTemplate,
  Users,
  Send,
  Wand2,
} from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { useOrganization } from '../context/OrganizationContext'
import { useConfirm } from '../context/ConfirmContext'
import { useToast } from '../context/ToastContext'
import { getAllUsers } from '../services/users'
import { getAllAvailabilityForPeriod } from '../services/availability'
import { getLeaveRequests } from '../services/leave'
import { getShiftTemplates } from '../services/shiftTemplates'
import {
  getPlannerShifts,
  getScheduleMonth,
  generateMonthFromTemplates,
  previewMonthGeneration,
  assignShift,
  publishMonth,
  plannerStats,
} from '../services/monthPlanner'
import { notifyShiftPublished } from '../services/notifications'
import { rankEmployeesForSlot } from '../lib/plannerEngine'
import { enrichShift, patchShiftInList } from '../lib/plannerShifts'
import type { Shift, ShiftTemplate, User } from '../types/database'
import type { Availability, LeaveRequest } from '../types/database'
import { MonthNavigator } from '../components/ui/MonthNavigator'
import { DashboardSkeleton } from '../components/ui/Skeleton'
import { LoadError } from '../components/ui/LoadError'
import { LoadingSpinner } from '../components/ui/LoadingSpinner'
import { Button } from '../components/ui/Button'
import { Card } from '../components/ui/Card'
import { EmployeePool } from '../components/planner/EmployeePool'
import { MonthPlannerGrid } from '../components/planner/MonthPlannerGrid'
import { TemplateManager } from '../components/planner/TemplateManager'
import { AvailabilityOverview } from '../components/planner/AvailabilityOverview'
import { PlannerDetailPanel } from '../components/planner/PlannerDetailPanel'
import { MobilePlannerList } from '../components/planner/MobilePlannerList'
import { PageHeader } from '../components/ui/PageHeader'
import { ScheduleActionsMenu } from '../components/schedule/ScheduleActionsMenu'
import { getMonthRange, addMonths, subMonths, monthLabel, cn } from '../lib/utils'

type Tab = 'planner' | 'templates' | 'availability'

export function MonthPlannerPage() {
  const { profile, isAdmin } = useAuth()
  const { organization, hasFeature } = useOrganization()
  const confirm = useConfirm()
  const toast = useToast()
  const [monthAnchor, setMonthAnchor] = useState(new Date())
  const [tab, setTab] = useState<Tab>('planner')
  const [shifts, setShifts] = useState<Shift[]>([])
  const [employees, setEmployees] = useState<User[]>([])
  const [availability, setAvailability] = useState<
    (Availability & { users?: { full_name: string } })[]
  >([])
  const [leave, setLeave] = useState<LeaveRequest[]>([])
  const [templates, setTemplates] = useState<ShiftTemplate[]>([])
  const [publishedAt, setPublishedAt] = useState<string | null>(null)
  const [maxHours, setMaxHours] = useState(160)
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState(false)
  const [busy, setBusy] = useState('')
  const [actionError, setActionError] = useState('')
  const [selectedSlotId, setSelectedSlotId] = useState<string | null>(null)
  const [employeeFilter, setEmployeeFilter] = useState('')
  const [activeDragName, setActiveDragName] = useState<string | null>(null)

  const { start, end } = useMemo(() => getMonthRange(monthAnchor), [monthAnchor])
  const stats = plannerStats(shifts)
  const assigning = busy === 'assign'

  const fetchPlannerData = useCallback(async () => {
    const [users, avail, leaveData, tmpl, shiftData, monthMeta] = await Promise.all([
      getAllUsers(),
      getAllAvailabilityForPeriod(start, end),
      getLeaveRequests(),
      getShiftTemplates(),
      getPlannerShifts(start, end),
      getScheduleMonth(monthAnchor),
    ])
    const emps = users.filter((u) => u.role === 'employee')
    setEmployees(emps)
    setAvailability(avail)
    setLeave(leaveData)
    setTemplates(tmpl)
    setShifts(shiftData.map((s) => enrichShift(s, emps)))
    setPublishedAt(monthMeta?.published_at ?? null)
    setMaxHours(Number(monthMeta?.max_hours_per_employee ?? 160))
  }, [monthAnchor, start, end])

  useEffect(() => {
    if (!isAdmin) return
    let cancelled = false
    setLoading(true)
    setLoadError(false)
    setActionError('')
    fetchPlannerData()
      .catch(() => {
        if (!cancelled) setLoadError(true)
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [isAdmin, fetchPlannerData])

  useEffect(() => {
    setSelectedSlotId(null)
  }, [monthAnchor])

  const suggestionsByShiftId = useMemo(() => {
    const map = new Map<string, ReturnType<typeof rankEmployeesForSlot>>()
    for (const shift of shifts) {
      map.set(
        shift.id,
        rankEmployeesForSlot(shift, employees, availability, leave, shifts, maxHours)
      )
    }
    return map
  }, [shifts, employees, availability, leave, maxHours])

  const selectedShift = shifts.find((s) => s.id === selectedSlotId)
  const selectedSuggestions = selectedShift
    ? (suggestionsByShiftId.get(selectedShift.id) ?? [])
    : []

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 8 } }))

  const applyAssignment = useCallback(
    async (slotId: string, userId: string | null, clearSourceSlotId?: string) => {
      setBusy('assign')
      setActionError('')
      try {
        if (clearSourceSlotId && clearSourceSlotId !== slotId) {
          const cleared = await assignShift(clearSourceSlotId, null)
          setShifts((prev) => patchShiftInList(prev, cleared, employees))
        }
        const updated = await assignShift(slotId, userId)
        setShifts((prev) => patchShiftInList(prev, updated, employees))
        setSelectedSlotId(slotId)
      } catch {
        setActionError('Toewijzen mislukt. Probeer opnieuw.')
        await fetchPlannerData()
      } finally {
        setBusy('')
      }
    },
    [employees, fetchPlannerData]
  )

  const handleDragEnd = async (event: DragEndEvent) => {
    setActiveDragName(null)
    const { active, over } = event
    if (!over) return

    const activeId = String(active.id)
    const overId = String(over.id)
    const sourceShiftId = active.data.current?.shiftId as string | undefined

    if (overId === 'pool-unassign' && activeId.startsWith('assigned-') && sourceShiftId) {
      await applyAssignment(sourceShiftId, null)
      return
    }

    let userId: string | null = null
    if (activeId.startsWith('employee-')) {
      userId = active.data.current?.userId as string
    } else if (activeId.startsWith('assigned-')) {
      userId = active.data.current?.userId as string
    }

    if (overId.startsWith('slot-') && userId) {
      const slotId = overId.replace('slot-', '')
      await applyAssignment(slotId, userId, sourceShiftId)
    }
  }

  const handleGenerate = async () => {
    const preview = previewMonthGeneration(monthAnchor, templates)
    const ok = await confirm({
      title: 'Maand vullen uit templates?',
      message: `Dit maakt ${preview.total} open diensten aan voor deze maand. Bestaande open plekken worden vervangen; ingeplande medewerkers blijven staan.`,
      confirmLabel: 'Genereren',
    })
    if (!ok) return
    setBusy('generate')
    setActionError('')
    try {
      const count = await generateMonthFromTemplates(monthAnchor, organization!.id, true)
      await fetchPlannerData()
      setTab('planner')
      toast.success(`${count} diensten aangemaakt volgens templates.`)
    } catch {
      setActionError('Genereren mislukt.')
    } finally {
      setBusy('')
    }
  }

  const handlePublish = async () => {
    const ok = await confirm({
      title: 'Maandrooster publiceren?',
      message:
        stats.open > 0
          ? `Let op: ${stats.open} open diensten blijven leeg. Medewerkers zien hun diensten direct na publicatie.`
          : 'Medewerkers zien hun diensten direct na publicatie.',
      confirmLabel: 'Publiceren',
    })
    if (!ok) return
    setBusy('publish')
    setActionError('')
    try {
      await publishMonth(monthAnchor, profile!.id, organization!.id, maxHours)

      // Notify assigned employees
      if (hasFeature('notifications')) {
        const label = monthLabel(monthAnchor)
        const assignedIds = new Set(shifts.filter((s) => s.user_id).map((s) => s.user_id))
        const recipients = employees.filter((e) => assignedIds.has(e.id) && e.email)
        await Promise.all(
          recipients.map((e) => notifyShiftPublished(e.email, e.full_name, label))
        )
      }

      await fetchPlannerData()
      toast.success('Maandrooster gepubliceerd!')
    } catch {
      setActionError('Publiceren mislukt.')
    } finally {
      setBusy('')
    }
  }

  const refreshTemplates = async () => {
    try {
      const tmpl = await getShiftTemplates()
      setTemplates(tmpl)
    } catch {
      setActionError('Templates laden mislukt.')
    }
  }

  const tabs: { id: Tab; label: string; icon: typeof Calendar }[] = [
    { id: 'planner', label: 'Planner', icon: Calendar },
    { id: 'templates', label: 'Templates', icon: LayoutTemplate },
    { id: 'availability', label: 'Beschikbaarheid', icon: Users },
  ]

  if (!isAdmin) return <Navigate to="/app/rooster" replace />

  if (loading) return <DashboardSkeleton />

  if (loadError) {
    return (
      <LoadError
        onRetry={() => {
          setLoading(true)
          setLoadError(false)
          fetchPlannerData()
            .catch(() => setLoadError(true))
            .finally(() => setLoading(false))
        }}
      />
    )
  }

  return (
    <div className="flex min-h-[calc(100vh-8rem)] flex-col gap-4">
      <PageHeader
        title="Maandplanner"
        subtitle={monthLabel(monthAnchor)}
        action={
          <div className="flex flex-wrap items-center gap-2">
            <Link to="/app/rooster">
              <Button variant="ghost" size="sm">← Rooster</Button>
            </Link>
            <MonthNavigator
              monthAnchor={monthAnchor}
              onPrev={() => setMonthAnchor(subMonths(monthAnchor, 1))}
              onNext={() => setMonthAnchor(addMonths(monthAnchor, 1))}
              onToday={() => setMonthAnchor(new Date())}
            />
            <ScheduleActionsMenu
              shifts={shifts}
              employees={employees}
              organizationName={organization?.name ?? 'ShiftSync'}
              periodLabel={monthLabel(monthAnchor)}
              periodStart={start}
              periodEnd={end}
              monthAnchor={monthAnchor}
              onPublish={handlePublish}
              onCleared={fetchPlannerData}
            />
          </div>
        }
      />

      {actionError && (
        <div
          role="alert"
          className="rounded-xl px-4 py-3 text-sm text-red-400"
          style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)' }}
        >
          {actionError}
        </div>
      )}

      <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
        {stats.filled} ingepland · {stats.open} open · {publishedAt ? 'Gepubliceerd' : 'Concept'}
      </p>

      <div className="flex flex-wrap gap-2">
        {tabs.map(({ id, label }) => (
          <button
            key={id}
            type="button"
            onClick={() => setTab(id)}
            className={cn('rounded-lg px-3 py-1.5 text-sm font-medium transition-colors')}
            style={
              tab === id
                ? { background: 'var(--brand-muted)', color: 'var(--brand-strong)' }
                : { color: 'var(--text-muted)' }
            }
          >
            {label}
          </button>
        ))}
      </div>

      {tab === 'templates' && (
        <TemplateManager templates={templates} onChange={refreshTemplates} />
      )}

      {tab === 'availability' && (
        <AvailabilityOverview monthAnchor={monthAnchor} availability={availability} />
      )}

      {tab === 'planner' && (
        <>
          <Card className="flex flex-wrap items-center gap-2 p-3">
            <Button onClick={handleGenerate} loading={busy === 'generate'} variant="secondary" size="sm">
              <Wand2 className="h-4 w-4" /> Genereer uit templates
            </Button>
            <Button onClick={handlePublish} loading={busy === 'publish'} size="sm">
              <Send className="h-4 w-4" /> Publiceren
            </Button>
            <label className="ml-auto flex items-center gap-2 text-xs" style={{ color: 'var(--text-muted)' }}>
              Max uren:
              <input
                type="number"
                value={maxHours}
                onChange={(e) => setMaxHours(Number(e.target.value))}
                className="w-14 rounded-lg px-2 py-1 outline-none"
                style={{ background: 'var(--surface-input)', border: '1px solid var(--border-input)' }}
              />
            </label>
          </Card>

          <MobilePlannerList
            shifts={shifts}
            employees={employees}
            suggestionsByShiftId={suggestionsByShiftId}
            onAssign={(shiftId, userId) => applyAssignment(shiftId, userId)}
            assigning={!!assigning}
          />

          <DndContext
            sensors={sensors}
            onDragStart={(e) => {
              const id = String(e.active.id)
              if (id.startsWith('employee-')) {
                const uid = e.active.data.current?.userId as string
                const emp = employees.find((x) => x.id === uid)
                setActiveDragName(emp?.full_name ?? null)
              } else if (id.startsWith('assigned-')) {
                const uid = e.active.data.current?.userId as string
                const emp = employees.find((x) => x.id === uid)
                setActiveDragName(emp?.full_name ?? null)
              }
            }}
            onDragEnd={handleDragEnd}
          >
            <div
              className={cn(
                'relative hidden min-h-[600px] gap-0 overflow-hidden rounded-xl lg:flex',
                assigning && 'pointer-events-none opacity-90'
              )}
              style={{ background: 'var(--surface-card)', border: '1px solid var(--border)' }}
            >
              {assigning && (
                <div className="absolute inset-0 z-10 flex items-center justify-center" style={{ background: 'rgba(0,0,0,0.3)' }}>
                  <LoadingSpinner />
                </div>
              )}
              <div className="w-56 shrink-0 lg:w-64" style={{ borderRight: '1px solid var(--border)' }}>
                <EmployeePool
                  employees={employees}
                  shifts={shifts}
                  filter={employeeFilter}
                  onFilterChange={setEmployeeFilter}
                />
              </div>
              <div className="min-w-0 flex-1 overflow-auto p-4">
                <MonthPlannerGrid
                  monthAnchor={monthAnchor}
                  shifts={shifts}
                  selectedSlotId={selectedSlotId}
                  onSelectSlot={setSelectedSlotId}
                />
              </div>
              {selectedShift && (
                <PlannerDetailPanel
                  shift={selectedShift}
                  suggestions={selectedSuggestions}
                  assigning={assigning}
                  onAssign={(userId) => applyAssignment(selectedShift.id, userId)}
                  onClear={() => applyAssignment(selectedShift.id, null)}
                />
              )}
            </div>
            <DragOverlay dropAnimation={null}>
              {activeDragName && (
                <div
                  className="cursor-grabbing rounded-xl px-4 py-2 text-sm font-medium"
                  style={{ color: 'var(--text-primary)', background: 'var(--surface-card)', border: '1px solid rgba(59,130,246,0.4)', boxShadow: 'var(--shadow-card-md)' }}
                >
                  {activeDragName}
                </div>
              )}
            </DragOverlay>
          </DndContext>
        </>
      )}
    </div>
  )
}
