import { useNavigate } from 'react-router-dom'
import {
  Bell,
  Palmtree,
  Thermometer,
  ArrowLeftRight,
  Check,
  CheckCheck,
  Calendar,
  Megaphone,
  Info,
} from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import { nl } from 'date-fns/locale'
import { Popover } from '../ui/Popover'
import { CountBadge } from '../ui/Badge'
import { cn } from '../../lib/utils'
import { useNotifications } from '../../lib/useNotifications'
import type { AppNotification, NotificationType } from '../../types/database'

const typeIcon: Record<NotificationType, typeof Bell> = {
  info: Info,
  announcement: Megaphone,
  shift_published: Calendar,
  shift_assigned: Calendar,
  leave_approved: Palmtree,
  leave_rejected: Palmtree,
  leave_requested: Palmtree,
  swap_requested: ArrowLeftRight,
  sick_reported: Thermometer,
}

const typeColor: Record<NotificationType, string> = {
  info: 'var(--text-muted)',
  announcement: 'var(--brand-strong)',
  shift_published: 'var(--brand-strong)',
  shift_assigned: 'var(--brand-strong)',
  leave_approved: 'var(--color-success)',
  leave_rejected: 'var(--color-error)',
  leave_requested: 'var(--color-leave)',
  swap_requested: 'var(--brand-strong)',
  sick_reported: 'var(--color-warning)',
}

export function NotificationCenter() {
  const navigate = useNavigate()
  const { items, unread, markRead, markAll } = useNotifications()

  return (
    <Popover
      width={380}
      trigger={({ toggle, ref, open }) => (
        <button
          ref={ref}
          type="button"
          onClick={toggle}
          aria-label="Meldingen"
          aria-expanded={open}
          className="press focus-ring relative flex h-9 w-9 items-center justify-center rounded-xl transition-colors hover:bg-black/5 dark:hover:bg-white/8"
          style={{ color: 'var(--text-muted)', border: '1px solid var(--border)' }}
        >
          <Bell className="h-4 w-4" />
          {unread > 0 && (
            <span className="absolute -right-1.5 -top-1.5 animate-pop-in">
              <CountBadge count={unread} tone="danger" />
            </span>
          )}
        </button>
      )}
    >
      {({ close }) => (
        <div>
          <div className="flex items-center justify-between px-4 py-3" style={{ borderBottom: '1px solid var(--border)' }}>
            <p className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>Meldingen</p>
            {unread > 0 && (
              <button type="button" onClick={() => markAll()} className="flex items-center gap-1 text-xs font-medium text-brand-600 hover:underline">
                <CheckCheck className="h-3.5 w-3.5" /> Alles gelezen
              </button>
            )}
          </div>

          {items.length === 0 ? (
            <div className="flex flex-col items-center gap-2 px-4 py-10 text-center">
              <span className="flex h-11 w-11 items-center justify-center rounded-full" style={{ background: 'var(--badge-approved-bg)' }}>
                <Check className="h-5 w-5" style={{ color: 'var(--color-success)' }} />
              </span>
              <p className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>Geen meldingen</p>
              <p className="text-xs" style={{ color: 'var(--text-muted)' }}>Je bent helemaal bij</p>
            </div>
          ) : (
            <ul className="max-h-[65vh] overflow-y-auto p-1.5">
              {items.map((n) => (
                <NotifRow
                  key={n.id}
                  n={n}
                  onClick={() => {
                    if (!n.read_at) markRead(n.id)
                    if (n.link) { navigate(n.link); close() }
                  }}
                />
              ))}
            </ul>
          )}
        </div>
      )}
    </Popover>
  )
}

function NotifRow({ n, onClick }: { n: AppNotification; onClick: () => void }) {
  const Icon = typeIcon[n.type] ?? Info
  const color = typeColor[n.type] ?? 'var(--text-muted)'
  return (
    <li>
      <button
        type="button"
        onClick={onClick}
        className={cn('flex w-full items-start gap-3 rounded-xl px-3 py-2.5 text-left transition-colors hover:bg-black/5 dark:hover:bg-white/8')}
      >
        <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl" style={{ background: 'var(--surface-subtle)', color }}>
          <Icon className="h-4 w-4" />
        </span>
        <span className="min-w-0 flex-1">
          <span className="flex items-center gap-2">
            <span className="truncate text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>{n.title}</span>
            {!n.read_at && <span className="h-2 w-2 shrink-0 rounded-full" style={{ background: 'var(--brand-strong)' }} />}
          </span>
          {n.body && <span className="mt-0.5 block text-xs" style={{ color: 'var(--text-muted)' }}>{n.body}</span>}
          <span className="mt-1 block text-[10px]" style={{ color: 'var(--text-disabled)' }}>
            {formatDistanceToNow(new Date(n.created_at), { addSuffix: true, locale: nl })}
          </span>
        </span>
      </button>
    </li>
  )
}
