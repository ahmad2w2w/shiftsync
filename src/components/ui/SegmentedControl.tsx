import { cn } from '../../lib/utils'
import type { ReactNode } from 'react'

export interface Segment<T extends string> {
  value: T
  label: ReactNode
  icon?: ReactNode
}

interface SegmentedControlProps<T extends string> {
  value: T
  onChange: (value: T) => void
  segments: Segment<T>[]
  size?: 'sm' | 'md'
  className?: string
  'aria-label'?: string
}

export function SegmentedControl<T extends string>({
  value,
  onChange,
  segments,
  size = 'md',
  className,
  'aria-label': ariaLabel,
}: SegmentedControlProps<T>) {
  return (
    <div
      role="tablist"
      aria-label={ariaLabel}
      className={cn('inline-flex items-center gap-0.5 rounded-xl p-1', className)}
      style={{ background: 'var(--surface-subtle)', border: '1px solid var(--border)' }}
    >
      {segments.map((seg) => {
        const selected = seg.value === value
        return (
          <button
            key={seg.value}
            type="button"
            role="tab"
            aria-selected={selected}
            onClick={() => onChange(seg.value)}
            className={cn(
              'press inline-flex items-center justify-center gap-1.5 rounded-lg font-medium transition-all',
              size === 'sm' ? 'px-2.5 py-1 text-xs' : 'px-3.5 py-1.5 text-sm',
              selected ? 'shadow-sm' : 'hover:opacity-80'
            )}
            style={{
              background: selected ? 'var(--surface-card)' : 'transparent',
              color: selected ? 'var(--text-primary)' : 'var(--text-muted)',
              boxShadow: selected ? 'var(--shadow-1)' : undefined,
            }}
          >
            {seg.icon}
            {seg.label}
          </button>
        )
      })}
    </div>
  )
}
