import { Pencil, Trash2 } from 'lucide-react'
import type { Shift } from '../../types/database'
import { Badge } from '../ui/Badge'
import { Button } from '../ui/Button'
import { formatTime, getPositionColor, cn } from '../../lib/utils'

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
      className={cn('flex items-center gap-3 rounded-lg', compact ? 'p-2.5' : 'p-3')}
      style={{
        background: 'var(--surface-subtle)',
        border: '1px solid var(--border)',
        borderLeft: `3px solid ${colors.accent}`,
      }}
    >
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <span className="font-medium text-sm" style={{ color: 'var(--text-primary)' }}>
            {formatTime(shift.start_time)} – {formatTime(shift.end_time)}
          </span>
          <span className="text-sm" style={{ color: 'var(--text-muted)' }}>{shift.position}</span>
          {isOpen && <Badge variant="pending">Open</Badge>}
          {!shift.published && <Badge variant="pending">Concept</Badge>}
        </div>
        {showEmployee && (
          <p className="mt-0.5 text-sm" style={{ color: 'var(--text-secondary)' }}>
            {isOpen ? 'Nog niet toegewezen' : name}
          </p>
        )}
      </div>

      {admin && (
        <div className="flex shrink-0 gap-0.5">
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
            <Button type="button" size="sm" variant="ghost" onClick={onDelete} aria-label="Verwijderen">
              <Trash2 className="h-3.5 w-3.5" style={{ color: '#EF4444' }} />
            </Button>
          )}
        </div>
      )}
    </div>
  )
}
