import { useId, useState, type ReactNode } from 'react'
import { cn } from '../../lib/utils'

interface TooltipProps {
  content: ReactNode
  children: ReactNode
  side?: 'top' | 'bottom'
  className?: string
}

export function Tooltip({ content, children, side = 'top', className }: TooltipProps) {
  const [visible, setVisible] = useState(false)
  const id = useId()

  return (
    <span
      className={cn('relative inline-flex', className)}
      onMouseEnter={() => setVisible(true)}
      onMouseLeave={() => setVisible(false)}
      onFocus={() => setVisible(true)}
      onBlur={() => setVisible(false)}
    >
      <span aria-describedby={visible ? id : undefined}>{children}</span>
      {visible && (
        <span
          id={id}
          role="tooltip"
          className={cn(
            'pointer-events-none absolute z-50 w-max max-w-xs rounded-lg px-3 py-2 text-xs leading-relaxed shadow-lg animate-fade-in',
            side === 'top' ? 'bottom-full left-1/2 mb-2 -translate-x-1/2' : 'top-full left-1/2 mt-2 -translate-x-1/2'
          )}
          style={{
            background: 'var(--color-navy)',
            color: '#fff',
            border: '1px solid rgba(255,255,255,0.1)',
          }}
        >
          {content}
        </span>
      )}
    </span>
  )
}

interface HelpTooltipProps {
  text: string
  className?: string
}

export function HelpTooltip({ text, className }: HelpTooltipProps) {
  return (
    <Tooltip content={text} className={className}>
      <button
        type="button"
        className="inline-flex h-5 w-5 items-center justify-center rounded-full text-xs font-bold transition-colors"
        style={{ background: 'var(--brand-muted)', color: 'var(--brand-strong)' }}
        aria-label="Meer informatie"
      >
        ?
      </button>
    </Tooltip>
  )
}
