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
  Sparkles,
  Calendar,
  LayoutTemplate,
  Users,
  Send,
  Wand2,
  ArrowLeft,
} from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { useOrganization } from '../context/OrganizationContext'
import { getAllUsers } from '../services/users'
import { getAllAvailabilityForPeriod } from '../services/availability'
import { getLeaveRequests } from '../services/leave'
import { getShiftTemplates } from '../services/shiftTemplates'
import {
  getPlannerShifts,
  getScheduleMonth,
  generateMonthFromTemplates,
  previewMonthGeneration,
  removeDuplicateOpenShifts,
  assignShift,
  publishMonth,
  plannerStats,
} from '../services/monthPlanner'
import { rankEmployeesForSlot, DAY_NAMES } from '../lib/plannerEngine'
import { enrichShift, patchShiftInList } from '../lib/plannerShifts'
import type { Shift, ShiftTemplate, User } from '../types/database'
import type { Availability, LeaveRequest } from '../types/database'
import { MonthNavigator } from '../components/ui/MonthNavigator'
import { LoadingSpinner } from '../components/ui/LoadingSpinner'
import { Button } from '../components/ui/Button'
import { Card } from '../components/ui/Card'
import { Badge } from '../components/ui/Badge'
import { EmployeePool } from '../components/planner/EmployeePool'
import { MonthPlannerGrid } from '../components/planner/MonthPlannerGrid'
import { TemplateManager } from '../components/planner/TemplateManager'
import { AvailabilityOverview } from '../components/planner/AvailabilityOverview'
import { PlannerDetailPanel } from '../components/planner/PlannerDetailPanel'
import { getMonthRange, addMonths, subMonths, monthLabel, cn } from '../lib/utils'

type Tab = 'planner' | 'templates' | 'availability'

export function MonthPlannerPage() {
  const { profile, isAdmin } = useAuth()
  const { organization } = useOrganization()
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
  const [busy, setBusy] = useState('')
  const [actionError, setActionError] = useState('')
  const [toast, setToast] = useState<string | null>(null)
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
    setActionError('')
    fetchPlannerData()
      .catch(() => {
        if (!cancelled) setActionError('Gegevens laden mislukt. Probeer opnieuw.')
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

  useEffect(() => {
    if (!toast) return
    const t = setTimeout(() => setToast(null), 4000)
    return () => clearTimeout(t)
  }, [toast])

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
    const dayLines = DAY_NAMES.map((name, dow) => {
      const n = preview.perWeekday[dow] ?? 0
      return n > 0 ? `${name}: ${n} diensten` : null
    })
      .filter(Boolean)
      .join('\n')

    const msg = [
      `Maand opnieuw vullen uit templates?`,
      ``,
      `Totaal: ${preview.total} open diensten voor deze maand.`,
      dayLines ? `\nPer weekdag:\n${dayLines}` : '',
      ``,
      `Bestaande open plekken worden verwijderd; ingeplande medewerkers blijven staan.`,
    ].join('\n')

    if (!confirm(msg)) return
    setBusy('generate')
    setActionError('')
    try {
      const count = await generateMonthFromTemplates(monthAnchor, organization!.id, true)
      await fetchPlannerData()
      setTab('planner')
      setToast(`${count} diensten aangemaakt volgens templates.`)
    } catch {
      setActionError('Genereren mislukt.')
    } finally {
      setBusy('')
    }
  }

  const handleCleanupDuplicates = async () => {
    setBusy('cleanup')
    try {
      const removed = await removeDuplicateOpenShifts(start, end)
      await fetchPlannerData()
      setToast(
        removed > 0
          ? `${removed} dubbele open diensten verwijderd.`
          : 'Geen dubbele open diensten gevonden.'
      )
    } catch {
      setActionError('Opschonen mislukt.')
    } finally {
      setBusy('')
    }
  }

  const handlePublish = async () => {
    if (stats.open > 0) {
      if (!confirm(`${stats.open} open diensten blijven leeg. Toch publiceren?`)) return
    }
    if (!confirm('Maandrooster publiceren? Medewerkers zien hun diensten direct.')) return
    setBusy('publish')
    setActionError('')
    try {
      await publishMonth(monthAnchor, profile!.id, organization!.id, maxHours)
      await fetchPlannerData()
      setToast('Maandrooster gepubliceerd!')
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
  if (loading) return <LoadingSpinner className="min-h-[60vh]" />

  return (
    <div className="flex min-h-[calc(100vh-8rem)] flex-col gap-4">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <Link
            to="/rooster"
            className="mb-2 inline-flex items-center gap-1 text-sm text-zinc-500 hover:text-zinc-300 transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            Terug naar rooster
          </Link>
          <h1 className="flex items-center gap-2 text-2xl font-bold text-zinc-100">
            <Sparkles className="h-7 w-7" />
            Slimme Maandrooster Planner
          </h1>
          <p className="text-sm text-gray-500 capitalize">{monthLabel(monthAnchor)}</p>
        </div>
        <MonthNavigator
          monthAnchor={monthAnchor}
          onPrev={() => setMonthAnchor(subMonths(monthAnchor, 1))}
          onNext={() => setMonthAnchor(addMonths(monthAnchor, 1))}
          onToday={() => setMonthAnchor(new Date())}
        />
      </div>

      {toast && (
        <div
          role="status"
          className="rounded-xl px-4 py-3 text-sm text-emerald-400"
          style={{ background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.2)' }}
        >
          {toast}
        </div>
      )}
      {actionError && (
        <div
          role="alert"
          className="rounded-xl px-4 py-3 text-sm text-red-400"
          style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)' }}
        >
          {actionError}
        </div>
      )}

      <div className="flex flex-wrap items-center gap-2">
        {tabs.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            type="button"
            onClick={() => setTab(id)}
            className={cn(
              'inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-colors',
              tab === id
                ? 'bg-brand-600 text-white shadow-sm'
                : 'text-zinc-400 hover:text-zinc-200'
            )}
          >
            <Icon className="h-4 w-4" />
            {label}
          </button>
        ))}
      </div>

      <div className="flex flex-wrap gap-3">
        <Badge variant={stats.open > 0 ? 'pending' : 'approved'}>
          {stats.open} open
        </Badge>
        <Badge variant="scheduled">{stats.filled} ingevuld</Badge>
        <Badge variant={publishedAt ? 'approved' : 'pending'}>
          {publishedAt ? 'Gepubliceerd' : 'Concept'}
        </Badge>
      </div>

      {tab === 'templates' && (
        <TemplateManager templates={templates} onChange={refreshTemplates} />
      )}

      {tab === 'availability' && (
        <AvailabilityOverview monthAnchor={monthAnchor} availability={availability} />
      )}

      {tab === 'planner' && (
        <>
          <Card className="flex flex-wrap items-center gap-3 p-4">
            <Button
              onClick={handleGenerate}
              loading={busy === 'generate'}
              variant="secondary"
            >
              <Wand2 className="h-4 w-4" />
              Genereer maand uit templates
            </Button>
            <Button
              onClick={handleCleanupDuplicates}
              loading={busy === 'cleanup'}
              variant="ghost"
              size="sm"
            >
              Verwijder dubbele open diensten
            </Button>
            <Button onClick={handlePublish} loading={busy === 'publish'}>
              <Send className="h-4 w-4" />
              Publiceer maandrooster
            </Button>
            <label className="ml-auto flex items-center gap-2 text-sm text-zinc-400">
              Max uren/medewerker:
              <input
                type="number"
                value={maxHours}
                onChange={(e) => setMaxHours(Number(e.target.value))}
                className="w-16 rounded-lg px-2 py-1 text-zinc-200 outline-none"
                style={{ background: 'var(--surface-input)', border: '1px solid var(--border-input)' }}
              />
            </label>
          </Card>

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
                'relative flex min-h-[600px] gap-0 overflow-hidden rounded-xl',
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
                  className="cursor-grabbing rounded-xl px-4 py-2 text-sm font-medium text-zinc-200"
                  style={{ background: 'var(--surface-card)', border: '1px solid rgba(59,130,246,0.4)', boxShadow: 'var(--shadow-card-md)' }}
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
