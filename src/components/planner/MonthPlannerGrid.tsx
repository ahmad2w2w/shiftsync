import { useState } from 'react'
import { format } from 'date-fns'
import { nl } from 'date-fns/locale'
import type { Shift } from '../../types/database'
import { getCalendarGrid, isSameMonth, cn } from '../../lib/utils'
import { ShiftDayGroup } from './ShiftDayGroup'
import { groupShiftsBySlot } from '../../lib/shiftGroups'

const WEEKDAYS = ['Ma', 'Di', 'Wo', 'Do', 'Vr', 'Za', 'Zo']

interface MonthPlannerGridProps {
  monthAnchor: Date
  shifts: Shift[]
  selectedSlotId: string | null
  onSelectSlot: (id: string) => void
}

export function MonthPlannerGrid({ monthAnchor, shifts, selectedSlotId, onSelectSlot }: MonthPlannerGridProps) {
  const grid = getCalendarGrid(monthAnchor)
  const [expandedGroupKey, setExpandedGroupKey] = useState<string | null>(null)

  return (
    <div className="overflow-x-auto">
      <div className="min-w-[900px]">
        <div className="grid grid-cols-7 gap-1 pb-2" style={{ borderBottom: '1px solid var(--border)' }}>
          {WEEKDAYS.map((d) => (
            <div key={d} className="text-center text-xs font-semibold" style={{ color: 'var(--text-muted)' }}>{d}</div>
          ))}
        </div>
        <div className="grid grid-cols-7 gap-1 pt-1">
          {grid.map((day) => {
            const dateStr = format(day, 'yyyy-MM-dd')
            const inMonth = isSameMonth(day, monthAnchor)
            const dayShifts = shifts.filter((s) => s.date === dateStr)
            const groups = groupShiftsBySlot(dayShifts)

            return (
              <div
                key={dateStr}
                className={cn('min-h-[100px] rounded-xl p-1.5')}
                style={
                  inMonth
                    ? { background: 'var(--surface-subtle)', border: '1px solid var(--border)' }
                    : { background: 'transparent', border: '1px solid transparent' }
                }
              >
                {inMonth && (
                  <>
                    <p className="mb-1 text-xs font-semibold" style={{ color: 'var(--text-muted)' }}>
                      {format(day, 'd', { locale: nl })}
                    </p>
                    <div className="space-y-1.5">
                      {groups.length === 0 ? (
                        <p className="text-[10px]" style={{ color: 'var(--text-disabled)' }}>—</p>
                      ) : (
                        groups.map((group) => {
                          const expandKey = `${dateStr}|${group.key}`
                          return (
                            <ShiftDayGroup
                              key={expandKey}
                              group={group}
                              selectedSlotId={selectedSlotId}
                              onSelectSlot={onSelectSlot}
                              expanded={expandedGroupKey === expandKey}
                              onToggleExpand={() =>
                                setExpandedGroupKey((k) => (k === expandKey ? null : expandKey))
                              }
                            />
                          )
                        })
                      )}
                    </div>
                  </>
                )}
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
