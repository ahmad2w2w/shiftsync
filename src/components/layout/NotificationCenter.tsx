import { useNavigate } from 'react-router-dom'
import { Bell, Palmtree, Thermometer, ArrowLeftRight, Check } from 'lucide-react'
import { Popover } from '../ui/Popover'
import { CountBadge } from '../ui/Badge'
import { cn } from '../../lib/utils'
import type { Attention, AttentionItem } from '../../lib/useAttention'

const toneIcon = {
  leave: Palmtree,
  sick: Thermometer,
  swaps: ArrowLeftRight,
}

const toneColor = {
  leave: 'var(--color-leave)',
  sick: 'var(--color-warning)',
  swaps: 'var(--brand-strong)',
}

export function NotificationCenter({ attention }: { attention: Attention }) {
  const navigate = useNavigate()

  return (
    <Popover
      width={360}
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
          {attention.total > 0 && (
            <span className="absolute -right-1.5 -top-1.5">
              <CountBadge count={attention.total} tone="danger" />
            </span>
          )}
        </button>
      )}
    >
      {({ close }) => (
        <div>
          <div className="flex items-center justify-between px-4 py-3" style={{ borderBottom: '1px solid var(--border)' }}>
            <p className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>Meldingen</p>
            {attention.total > 0 && <CountBadge count={attention.total} tone="danger" />}
          </div>

          {attention.items.length === 0 ? (
            <div className="flex flex-col items-center gap-2 px-4 py-10 text-center">
              <span className="flex h-11 w-11 items-center justify-center rounded-full" style={{ background: 'var(--badge-approved-bg)' }}>
                <Check className="h-5 w-5" style={{ color: 'var(--color-success)' }} />
              </span>
              <p className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>Alles is bijgewerkt</p>
              <p className="text-xs" style={{ color: 'var(--text-muted)' }}>Geen openstaande acties</p>
            </div>
          ) : (
            <ul className="max-h-[60vh] overflow-y-auto p-1.5">
              {attention.items.map((item) => (
                <NotifRow key={item.id} item={item} onClick={() => { navigate(item.to); close() }} />
              ))}
            </ul>
          )}
        </div>
      )}
    </Popover>
  )
}

function NotifRow({ item, onClick }: { item: AttentionItem; onClick: () => void }) {
  const Icon = toneIcon[item.tone]
  return (
    <li>
      <button
        type="button"
        onClick={onClick}
        className={cn('flex w-full items-start gap-3 rounded-xl px-3 py-2.5 text-left transition-colors hover:bg-black/5 dark:hover:bg-white/8')}
      >
        <span
          className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl"
          style={{ background: 'var(--surface-subtle)', color: toneColor[item.tone] }}
        >
          <Icon className="h-4 w-4" />
        </span>
        <span className="min-w-0 flex-1">
          <span className="flex items-center gap-2">
            <span className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>{item.title}</span>
            <CountBadge count={item.count} tone="danger" />
          </span>
          <span className="mt-0.5 block text-xs" style={{ color: 'var(--text-muted)' }}>{item.description}</span>
        </span>
      </button>
    </li>
  )
}
