import { cn } from '../../lib/utils'
import type { InputHTMLAttributes } from 'react'

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
  hint?: string
}

export function Input({ label, error, hint, className, id, style, ...props }: InputProps) {
  const inputId = id ?? label?.toLowerCase().replace(/\s+/g, '-')
  return (
    <div className="space-y-1.5">
      {label && (
        <label
          htmlFor={inputId}
          className="block text-sm font-medium"
          style={{ color: 'var(--text-secondary)' }}
        >
          {label}
        </label>
      )}
      <input
        id={inputId}
        className={cn(
          'w-full rounded-xl px-3.5 py-2.5 text-sm transition-all duration-150',
          'placeholder:text-[var(--text-disabled)]',
          'focus:outline-none focus:ring-2 focus:ring-brand-500/30 focus:border-brand-500',
          error
            ? 'border border-red-500 focus:ring-red-500/20'
            : 'border hover:border-brand-500/50',
          className
        )}
        style={{
          background: 'var(--surface-input)',
          color: 'var(--text-primary)',
          borderColor: error ? undefined : 'var(--border-input)',
          ...style,
        }}
        {...props}
      />
      {hint && !error && (
        <p className="text-xs" style={{ color: 'var(--text-disabled)' }}>{hint}</p>
      )}
      {error && <p className="text-xs text-red-500">{error}</p>}
    </div>
  )
}
