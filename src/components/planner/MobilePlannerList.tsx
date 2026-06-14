import { useState } from 'react'
import { format } from 'date-fns'
import { nl } from 'date-fns/locale'
import { Sparkles, UserCheck } from 'lucide-react'
import type { Shift, User } from '../../types/database'
import type { RankedEmployee } from '../../lib/plannerEngine'
import { Badge } from '../ui/Badge'
import { Card } from '../ui/Card'
import { Select } from '../ui/Select'
import { Button } from '../ui/Button'
import { cn } from '../../lib/utils'

interface MobilePlannerListProps {
  shifts: Shift[]
  employees: User[]
  suggestionsByShiftId: Map<string, RankedEmployee[]>
  onAssign: (shiftId: string, userId: string | null) => void
  assigning: boolean
}

export function MobilePlannerList({
  shifts,
  employees,
  suggestionsByShiftId,
  onAssign,
  assigning,
}: MobilePlannerListProps) {
  const [view, setView] = useState<'open' | 'filled'>('open')
  const [expandedId, setExpandedId] = useState<string | null>(null)

  const openShifts = shifts.filter((s) => !s.user_id).sort((a, b) => a.date.localeCompare(b.date))
  const filledShifts = shifts.filter((s) => s.user_id).sort((a, b) => a.date.localeCompare(b.date))
  const visible = view === 'open' ? openShifts : filledShifts

  const employeeName = (id: string | null) =>
    employees.find((e) => e.id === id)?.full_name ?? 'Medewerker'

  return (
    <div className="space-y-3 lg:hidden">
      <div className="flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={() => setView('open')}
          className={cn('rounded-lg px-3 py-1.5 text-sm font-medium', view === 'open' && 'bg-brand-600 text-white')}
          style={view !== 'open' ? { background: 'var(--surface-card)', border: '1px solid var(--border)', color: 'var(--text-secondary)' } : undefined}
        >
          Open ({openShifts.length})
        </button>
        <button
          type="button"
          onClick={() => setView('filled')}
          className={cn('rounded-lg px-3 py-1.5 text-sm font-medium', view === 'filled' && 'bg-brand-600 text-white')}
          style={view !== 'filled' ? { background: 'var(--surface-card)', border: '1px solid var(--border)', color: 'var(--text-secondary)' } : undefined}
        >
          Ingevuld ({filledShifts.length})
        </button>
      </div>

      {visible.length === 0 ? (
        <Card className="p-6 text-center text-sm" style={{ color: 'var(--text-muted)' }}>
          {view === 'open'
            ? 'Geen open diensten. Genereer diensten uit templates of voeg ze toe in het rooster.'
            : 'Nog geen ingevulde diensten deze maand.'}
        </Card>
      ) : (
        visible.map((shift) => {
          const suggestions = suggestionsByShiftId.get(shift.id) ?? []
          const topSuggestions = suggestions.slice(0, 3)
          const expanded = expandedId === shift.id

          return (
            <Card key={shift.id} className="p-4">
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div>
                  <p className="font-semibold text-sm capitalize" style={{ color: 'var(--text-primary)' }}>
                    {format(new Date(shift.date + 'T12:00:00'), 'EEE d MMM', { locale: nl })}
                  </p>
                  <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
                    {shift.start_time?.slice(0, 5)} – {shift.end_time?.slice(0, 5)} · {shift.position ?? 'Dienst'}
                  </p>
                  {shift.user_id && (
                    <p className="mt-1 flex items-center gap-1 text-xs font-medium" style={{ color: 'var(--brand-strong)' }}>
                      <UserCheck className="h-3.5 w-3.5" />
                      {employeeName(shift.user_id)}
                    </p>
                  )}
                </div>
                <Badge variant={shift.user_id ? 'scheduled' : 'pending'}>
                  {shift.user_id ? 'Ingevuld' : 'Open'}
                </Badge>
              </div>

              {!shift.user_id && (
                <>
                  {topSuggestions.length > 0 && (
                    <div className="mt-3 rounded-xl p-3" style={{ background: 'var(--surface-subtle)', border: '1px solid var(--border)' }}>
                      <p className="mb-2 flex items-center gap-1.5 text-xs font-semibold" style={{ color: 'var(--text-secondary)' }}>
                        <Sparkles className="h-3.5 w-3.5" style={{ color: 'var(--brand)' }} />
                        AI-suggesties
                      </p>
                      <div className="flex flex-wrap gap-2">
                        {topSuggestions.map((s) => (
                          <Button
                            key={s.user.id}
                            size="sm"
                            variant="secondary"
                            loading={assigning}
                            onClick={() => onAssign(shift.id, s.user.id)}
                          >
                            {s.user.full_name}
                          </Button>
                        ))}
                      </div>
                    </div>
                  )}
                  <div className="mt-3">
                    <Select
                      label="Medewerker toewijzen"
                      value=""
                      disabled={assigning}
                      onChange={(e) => {
                        const val = e.target.value
                        if (val) onAssign(shift.id, val)
                      }}
                      options={[
                        { value: '', label: 'Kies medewerker…' },
                        ...employees.map((emp) => ({ value: emp.id, label: emp.full_name })),
                      ]}
                    />
                  </div>
                </>
              )}

              {shift.user_id && (
                <div className="mt-3 flex flex-wrap gap-2">
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => setExpandedId(expanded ? null : shift.id)}
                  >
                    {expanded ? 'Verberg suggesties' : 'Andere medewerker'}
                  </Button>
                  <Button
                    size="sm"
                    variant="danger"
                    loading={assigning}
                    onClick={() => onAssign(shift.id, null)}
                  >
                    Vrijmaken
                  </Button>
                </div>
              )}

              {shift.user_id && expanded && (
                <div className="mt-3">
                  <Select
                    label="Vervangen door"
                    value=""
                    disabled={assigning}
                    onChange={(e) => {
                      const val = e.target.value
                      if (val) onAssign(shift.id, val)
                    }}
                    options={[
                      { value: '', label: 'Kies medewerker…' },
                      ...employees.filter((e) => e.id !== shift.user_id).map((emp) => ({
                        value: emp.id,
                        label: emp.full_name,
                      })),
                    ]}
                  />
                </div>
              )}
            </Card>
          )
        })
      )}
    </div>
  )
}
