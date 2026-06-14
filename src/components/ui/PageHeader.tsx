import type { ReactNode } from 'react'

interface PageHeaderProps {
  title: string
  subtitle?: string
  action?: ReactNode
  badge?: ReactNode
}

export function PageHeader({ title, subtitle, action, badge }: PageHeaderProps) {
  return (
    <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
      <div className="min-w-0">
        <div className="flex flex-wrap items-center gap-2.5">
          <h1 className="text-2xl font-bold tracking-tight sm:text-[1.625rem]" style={{ color: 'var(--text-primary)' }}>
            {title}
          </h1>
          {badge}
        </div>
        {subtitle && (
          <p className="mt-1.5 text-sm sm:text-[0.9375rem]" style={{ color: 'var(--text-muted)' }}>
            {subtitle}
          </p>
        )}
      </div>
      {action && <div className="flex shrink-0 flex-wrap items-center gap-2">{action}</div>}
    </div>
  )
}
