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
  const v = variantVars[variant] ?? variantVars.default
  return (
    <span
      className={cn('inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium', className)}
      style={{
        background: v.bg,
        color: v.text,
        boxShadow: `0 0 0 1px ${v.ring}`,
      }}
    >
      {children}
    </span>
  )
}
