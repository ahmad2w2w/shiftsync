import { cn } from '../../lib/utils'

const variants: Record<string, string> = {
  pending: 'bg-amber-100 text-amber-800',
  approved: 'bg-emerald-100 text-emerald-800',
  rejected: 'bg-red-100 text-red-800',
  scheduled: 'bg-blue-100 text-blue-800',
  completed: 'bg-gray-100 text-gray-700',
  cancelled: 'bg-red-100 text-red-700',
  admin: 'bg-navy-100 text-navy-800',
  employee: 'bg-gray-100 text-gray-700',
  active: 'bg-emerald-100 text-emerald-800',
}

export function Badge({
  variant = 'pending',
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
        variants[variant] ?? variants.pending,
        className
      )}
    >
      {children}
    </span>
  )
}
