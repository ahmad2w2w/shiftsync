import { cn } from '../../lib/utils'
import type { SelectHTMLAttributes } from 'react'

interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label?: string
  options: { value: string; label: string }[]
}

export function Select({ label, options, className, id, ...props }: SelectProps) {
  const selectId = id ?? label?.toLowerCase().replace(/\s/g, '-')
  return (
    <div className="space-y-1.5">
      {label && (
        <label htmlFor={selectId} className="block text-sm font-medium text-zinc-300">
          {label}
        </label>
      )}
      <select
        id={selectId}
        className={cn(
          'w-full rounded-xl border border-white/8 bg-zinc-900 px-3.5 py-2.5 text-sm text-zinc-100',
          'focus:border-brand-500/70 focus:outline-none focus:ring-2 focus:ring-brand-500/20',
          'hover:border-white/15 transition-all',
          className
        )}
        {...props}
      >
        {options.map((o) => (
          <option key={o.value} value={o.value} className="bg-zinc-900 text-zinc-100">
            {o.label}
          </option>
        ))}
      </select>
    </div>
  )
}
