import { cn } from '../../lib/utils'
import type { ButtonHTMLAttributes } from 'react'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost'
  size?: 'sm' | 'md' | 'lg'
  loading?: boolean
}

export function Button({
  variant = 'primary',
  size = 'md',
  loading,
  className,
  children,
  disabled,
  ...props
}: ButtonProps) {
  const variants = {
    primary:
      'bg-brand-600 text-white hover:bg-brand-500 active:bg-brand-700 shadow-md shadow-brand-600/25',
    secondary:
      'bg-zinc-800 text-zinc-100 border border-white/10 hover:bg-zinc-700 hover:border-white/20',
    danger:
      'bg-red-600 text-white hover:bg-red-500 active:bg-red-700 shadow-md shadow-red-600/25',
    ghost:
      'text-zinc-400 hover:bg-white/6 hover:text-zinc-100',
  }
  const sizes = {
    sm: 'px-3 py-1.5 text-xs font-semibold rounded-lg',
    md: 'px-4 py-2 text-sm font-semibold rounded-xl',
    lg: 'px-6 py-3 text-sm font-semibold rounded-xl',
  }

  return (
    <button
      className={cn(
        'inline-flex items-center justify-center gap-1.5 transition-all duration-150',
        'disabled:opacity-40 disabled:cursor-not-allowed',
        variants[variant],
        sizes[size],
        className
      )}
      disabled={disabled || loading}
      {...props}
    >
      {loading && (
        <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-current border-t-transparent" />
      )}
      {children}
    </button>
  )
}
