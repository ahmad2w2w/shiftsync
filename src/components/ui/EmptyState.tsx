import type { LucideIcon } from 'lucide-react'
import type { ReactNode } from 'react'

interface EmptyStateProps {
  icon: LucideIcon
  title: string
  description?: string
  action?: ReactNode
}

export function EmptyState({ icon: Icon, title, description, action }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center px-4 py-12 text-center">
      <div
        className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl"
        style={{ background: 'var(--brand-muted)' }}
      >
        <Icon className="h-7 w-7" style={{ color: 'var(--brand-strong)' }} />
      </div>
      <h3 className="text-base font-semibold" style={{ color: 'var(--text-primary)' }}>{title}</h3>
      {description && (
        <p className="mt-1.5 max-w-sm text-sm leading-relaxed" style={{ color: 'var(--text-muted)' }}>
          {description}
        </p>
      )}
      {action && <div className="mt-5">{action}</div>}
    </div>
  )
}
