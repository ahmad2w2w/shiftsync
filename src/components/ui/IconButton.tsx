import { cn } from '../../lib/utils'
import { forwardRef, type ButtonHTMLAttributes } from 'react'

interface IconButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  size?: 'sm' | 'md' | 'lg'
  variant?: 'ghost' | 'outline' | 'solid'
  active?: boolean
}

const sizes = {
  sm: 'h-8 w-8',
  md: 'h-9 w-9',
  lg: 'h-10 w-10',
}

export const IconButton = forwardRef<HTMLButtonElement, IconButtonProps>(function IconButton(
  { size = 'md', variant = 'ghost', active, className, children, ...props },
  ref
) {
  return (
    <button
      ref={ref}
      type="button"
      className={cn(
        'press focus-ring inline-flex items-center justify-center rounded-xl transition-colors',
        sizes[size],
        variant === 'ghost' && 'hover:bg-black/5 dark:hover:bg-white/8',
        variant === 'outline' && 'border hover:bg-black/5 dark:hover:bg-white/8',
        variant === 'solid' && 'bg-brand-500 text-white hover:bg-brand-600',
        className
      )}
      style={{
        color: variant === 'solid' ? undefined : 'var(--text-muted)',
        borderColor: variant === 'outline' ? 'var(--border)' : undefined,
        ...(active ? { background: 'var(--brand-muted)', color: 'var(--brand-strong)' } : {}),
      }}
      {...props}
    >
      {children}
    </button>
  )
})
