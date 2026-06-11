import { cn } from '../../lib/utils'
import type { SelectHTMLAttributes } from 'react'

interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label?: string
  options: { value: string; label: string }[]
}

export function Select({ label, options, className, id, style, ...props }: SelectProps) {
  const selectId = id ?? label?.toLowerCase().replace(/\s/g, '-')
  return (
    <div className="space-y-1.5">
      {label && (
        <label
          htmlFor={selectId}
          className="block text-sm font-medium"
          style={{ color: 'var(--text-secondary)' }}
        >
          {label}
        </label>
      )}
      <select
        id={selectId}
        className={cn(
          'w-full rounded-xl border px-3.5 py-2.5 text-sm transition-all',
          'focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/30',
          'hover:border-brand-500/50',
          className
        )}
        style={{
          background: 'var(--surface-input)',
          color: 'var(--text-primary)',
          borderColor: 'var(--border-input)',
          ...style,
        }}
        {...props}
      >
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </div>
  )
}
