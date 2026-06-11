import { cn } from '../../lib/utils'
import type { HTMLAttributes, ReactNode } from 'react'

export function Card({ className, children, style, ...props }: HTMLAttributes<HTMLDivElement> & { children: ReactNode }) {
  return (
    <div
      className={cn('rounded-2xl p-5', className)}
      style={{
        background: 'var(--surface-card)',
        boxShadow: 'var(--shadow-card)',
        ...style,
      }}
      {...props}
    >
      {children}
    </div>
  )
}

export function CardHeader({ title, subtitle, action }: { title: string; subtitle?: string; action?: ReactNode }) {
  return (
    <div className="mb-5 flex items-start justify-between gap-4">
      <div>
        <h2 className="text-base font-semibold" style={{ color: 'var(--text-primary)' }}>{title}</h2>
        {subtitle && <p className="mt-0.5 text-sm" style={{ color: 'var(--text-muted)' }}>{subtitle}</p>}
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </div>
  )
}
