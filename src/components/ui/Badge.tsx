import { cn } from '../../lib/utils'

const variantVars: Record<string, { bg: string; text: string; ring: string }> = {
  pending:   { bg: 'var(--badge-pending-bg)',   text: 'var(--badge-pending-text)',   ring: 'var(--badge-pending-ring)' },
  approved:  { bg: 'var(--badge-approved-bg)',  text: 'var(--badge-approved-text)',  ring: 'var(--badge-approved-ring)' },
  rejected:  { bg: 'var(--badge-rejected-bg)',  text: 'var(--badge-rejected-text)',  ring: 'var(--badge-rejected-ring)' },
  cancelled: { bg: 'var(--badge-rejected-bg)',  text: 'var(--badge-rejected-text)',  ring: 'var(--badge-rejected-ring)' },
  scheduled: { bg: 'var(--badge-scheduled-bg)', text: 'var(--badge-scheduled-text)', ring: 'var(--badge-scheduled-ring)' },
  active:    { bg: 'var(--badge-approved-bg)',  text: 'var(--badge-approved-text)',  ring: 'var(--badge-approved-ring)' },
  completed: { bg: 'var(--badge-default-bg)',   text: 'var(--badge-default-text)',   ring: 'var(--badge-default-ring)' },
  default:   { bg: 'var(--badge-default-bg)',   text: 'var(--badge-default-text)',   ring: 'var(--badge-default-ring)' },
  free:      { bg: 'var(--badge-default-bg)',   text: 'var(--badge-default-text)',   ring: 'var(--badge-default-ring)' },
  employee:  { bg: 'var(--badge-default-bg)',   text: 'var(--badge-default-text)',   ring: 'var(--badge-default-ring)' },
  admin:     { bg: 'var(--badge-scheduled-bg)', text: 'var(--badge-scheduled-text)', ring: 'var(--badge-scheduled-ring)' },
  pro:       { bg: 'var(--badge-scheduled-bg)', text: 'var(--badge-scheduled-text)', ring: 'var(--badge-scheduled-ring)' },
  business:  { bg: 'var(--badge-gold-bg)',      text: 'var(--badge-gold-text)',      ring: 'var(--badge-gold-ring)' },
  leave:     { bg: 'var(--badge-purple-bg)',    text: 'var(--badge-purple-text)',    ring: 'var(--badge-purple-ring)' },
  warning:  { bg: 'rgba(245,158,11,0.12)', text: '#D97706', ring: 'rgba(245,158,11,0.3)' },
  sick:     { bg: 'rgba(245,158,11,0.12)', text: '#D97706', ring: 'rgba(245,158,11,0.3)' },
  success:  { bg: 'var(--badge-approved-bg)',  text: 'var(--badge-approved-text)',  ring: 'var(--badge-approved-ring)' },
  brand:    { bg: 'var(--badge-scheduled-bg)', text: 'var(--badge-scheduled-text)', ring: 'var(--badge-scheduled-ring)' },
}

export function Badge({
  variant = 'default',
  children,
  className,
  dot,
}: {
  variant?: string
  children: React.ReactNode
  className?: string
  dot?: boolean
}) {
  const v = variantVars[variant] ?? variantVars.default
  return (
    <span
      className={cn('inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium', className)}
      style={{
        background: v.bg,
        color: v.text,
        boxShadow: `0 0 0 1px ${v.ring}`,
      }}
    >
      {dot && <span className="h-1.5 w-1.5 rounded-full" style={{ background: v.text }} />}
      {children}
    </span>
  )
}

/** Small count pill for nav items / notification bells */
export function CountBadge({ count, className, tone = 'brand' }: { count: number; className?: string; tone?: 'brand' | 'danger' }) {
  if (count <= 0) return null
  return (
    <span
      className={cn(
        'inline-flex h-[18px] min-w-[18px] items-center justify-center rounded-full px-1 text-[10px] font-bold leading-none tabular-nums',
        className
      )}
      style={{
        background: tone === 'danger' ? 'var(--color-error)' : 'var(--brand-strong)',
        color: '#fff',
      }}
    >
      {count > 99 ? '99+' : count}
    </span>
  )
}
