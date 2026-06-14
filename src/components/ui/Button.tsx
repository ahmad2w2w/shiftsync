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
      'bg-brand-500 text-white hover:bg-brand-600 active:bg-brand-700 shadow-sm shadow-brand-500/20',
    secondary:
      'text-[var(--text-primary)] border hover:opacity-90',
    danger:
      'bg-red-500 text-white hover:bg-red-600 active:bg-red-700 shadow-sm shadow-red-500/20',
    ghost:
      'hover:opacity-90',
  }
  const variantStyle =
    variant === 'secondary'
      ? { background: 'var(--surface-card)', borderColor: 'var(--border-strong)' }
      : variant === 'ghost'
        ? { color: 'var(--text-secondary)', background: 'transparent' }
        : undefined
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
        'hover-lift',
        variants[variant],
        sizes[size],
        className
      )}
      style={variantStyle}
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
