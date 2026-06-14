import { Clock, Pencil, Trash2, User, UserX } from 'lucide-react'
import type { Shift } from '../../types/database'
import { Badge } from '../ui/Badge'
import { Button } from '../ui/Button'
import { formatTime, getPositionColor, shiftStatusLabel, cn } from '../../lib/utils'

function shiftHours(start: string, end: string) {
  const [sh, sm] = start.slice(0, 5).split(':').map(Number)
  const [eh, em] = end.slice(0, 5).split(':').map(Number)
  const h = eh + em / 60 - (sh + sm / 60)
  return h > 0 ? `${h.toFixed(1)}u` : '—'
}

interface ScheduleShiftCardProps {
  shift: Shift
  showEmployee?: boolean
  admin?: boolean
  onEdit?: () => void
  onDelete?: () => void
  onTogglePublish?: () => void
  compact?: boolean
}

export function ScheduleShiftCard({
  shift,
  showEmployee = true,
  admin,
  onEdit,
  onDelete,
  onTogglePublish,
  compact,
}: ScheduleShiftCardProps) {
  const name = (shift.user as { full_name?: string } | undefined)?.full_name
  const colors = getPositionColor(shift.position)
  const isOpen = !shift.user_id

  return (
    <div
      className={cn(
        'group relative overflow-hidden rounded-2xl transition-all duration-200 hover:shadow-md',
        compact ? 'p-3' : 'p-4'
      )}
      style={{
        background: 'var(--surface-card)',
        border: `1px solid ${colors.border}`,
        boxShadow: 'var(--shadow-card)',
      }}
    >
      <div className="absolute inset-y-0 left-0 w-1 rounded-l-2xl" style={{ background: colors.accent }} />

      <div className="flex items-start gap-3 pl-2">
        <div
          className={cn('flex shrink-0 items-center justify-center rounded-xl font-bold', compact ? 'h-9 w-9 text-xs' : 'h-11 w-11 text-sm')}
          style={{ background: colors.bg, color: colors.text }}
        >
          {isOpen ? <UserX className="h-4 w-4" /> : (name?.[0]?.toUpperCase() ?? '?')}
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-semibold" style={{ color: 'var(--text-primary)' }}>{shift.position}</span>
            {isOpen && <Badge variant="pending">Open</Badge>}
            {!shift.published && <Badge variant="pending">Concept</Badge>}
          </div>

          {showEmployee && (
            <p className="mt-0.5 text-sm" style={{ color: 'var(--text-secondary)' }}>
              {isOpen ? 'Nog niet toegewezen' : name}
            </p>
          )}

          <div className="mt-2 flex flex-wrap items-center gap-3 text-sm" style={{ color: 'var(--text-muted)' }}>
            <span className="inline-flex items-center gap-1">
              <Clock className="h-3.5 w-3.5" />
              {formatTime(shift.start_time)} – {formatTime(shift.end_time)}
            </span>
            <span className="rounded-md px-1.5 py-0.5 text-xs font-medium" style={{ background: colors.bg, color: colors.text }}>
              {shiftHours(shift.start_time, shift.end_time)}
            </span>
            {!isOpen && (
              <span className="inline-flex items-center gap-1 text-xs">
                <User className="h-3 w-3" />
                {shiftStatusLabel[shift.status] ?? shift.status}
              </span>
            )}
          </div>
        </div>

        {admin && (
          <div className="flex shrink-0 flex-col gap-1 opacity-100 sm:opacity-0 sm:transition-opacity sm:group-hover:opacity-100">
            {onEdit && (
              <Button type="button" size="sm" variant="ghost" onClick={onEdit} aria-label="Bewerken">
                <Pencil className="h-3.5 w-3.5" />
              </Button>
            )}
            {onTogglePublish && (
              <Button type="button" size="sm" variant="ghost" onClick={onTogglePublish} title={shift.published ? 'Naar concept' : 'Publiceren'}>
                {shift.published ? '◐' : '●'}
              </Button>
            )}
            {onDelete && (
              <Button type="button" size="sm" variant="danger" onClick={onDelete} aria-label="Verwijderen">
                <Trash2 className="h-3.5 w-3.5" />
              </Button>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
