import { cn } from '../../lib/utils'

const variants: Record<string, string> = {
  pending:   'bg-amber-500/15  text-amber-400  ring-1 ring-amber-500/30',
  approved:  'bg-emerald-500/15 text-emerald-400 ring-1 ring-emerald-500/30',
  rejected:  'bg-red-500/15    text-red-400    ring-1 ring-red-500/30',
  scheduled: 'bg-brand-500/15  text-brand-400  ring-1 ring-brand-500/30',
  completed: 'bg-zinc-500/15   text-zinc-400   ring-1 ring-white/10',
  cancelled: 'bg-red-500/15    text-red-400    ring-1 ring-red-500/30',
  admin:     'bg-brand-500/15  text-brand-400  ring-1 ring-brand-500/30',
  employee:  'bg-zinc-500/15   text-zinc-400   ring-1 ring-white/10',
  active:    'bg-emerald-500/15 text-emerald-400 ring-1 ring-emerald-500/30',
  default:   'bg-zinc-500/15   text-zinc-400   ring-1 ring-white/10',
  free:      'bg-zinc-500/15   text-zinc-400   ring-1 ring-white/10',
  pro:       'bg-brand-500/15  text-brand-400  ring-1 ring-brand-500/30',
  business:  'bg-amber-500/15  text-amber-400  ring-1 ring-amber-500/30',
}

export function Badge({
  variant = 'default',
  children,
  className,
}: {
  variant?: string
  children: React.ReactNode
  className?: string
}) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium',
        variants[variant] ?? variants.default,
        className
      )}
    >
      {children}
    </span>
  )
}
