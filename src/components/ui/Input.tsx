import { cn } from '../../lib/utils'
import type { InputHTMLAttributes } from 'react'

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
  hint?: string
}

export function Input({ label, error, hint, className, id, ...props }: InputProps) {
  const inputId = id ?? label?.toLowerCase().replace(/\s+/g, '-')
  return (
    <div className="space-y-1.5">
      {label && (
        <label htmlFor={inputId} className="block text-sm font-medium text-zinc-300">
          {label}
        </label>
      )}
      <input
        id={inputId}
        className={cn(
          'w-full rounded-xl border bg-zinc-900 px-3.5 py-2.5 text-sm text-zinc-100',
          'placeholder:text-zinc-600 transition-all duration-150',
          'focus:outline-none focus:ring-2 focus:ring-brand-500/40 focus:border-brand-500/70',
          error
            ? 'border-red-500/50 focus:border-red-500 focus:ring-red-500/30'
            : 'border-white/8 hover:border-white/15',
          className
        )}
        {...props}
      />
      {hint && !error && <p className="text-xs text-zinc-600">{hint}</p>}
      {error && <p className="text-xs text-red-400">{error}</p>}
    </div>
  )
}
