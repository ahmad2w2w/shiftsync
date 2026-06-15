import { cn } from '../../lib/utils'

export interface BarDatum {
  label: string
  value: number
  color?: string
}

interface BarChartProps {
  data: BarDatum[]
  height?: number
  formatValue?: (v: number) => string
  className?: string
  horizontal?: boolean
}

export function BarChart({
  data,
  height = 180,
  formatValue = (v) => String(Math.round(v)),
  className,
  horizontal,
}: BarChartProps) {
  const max = Math.max(1, ...data.map((d) => d.value))

  if (horizontal) {
    return (
      <div className={cn('space-y-2.5', className)}>
        {data.map((d, i) => (
          <div key={i} className="flex items-center gap-3">
            <span className="w-20 shrink-0 truncate text-xs" style={{ color: 'var(--text-muted)' }}>{d.label}</span>
            <div className="relative h-6 flex-1 overflow-hidden rounded-lg" style={{ background: 'var(--surface-subtle)' }}>
              <div
                className="absolute inset-y-0 left-0 rounded-lg transition-all duration-500"
                style={{ width: `${Math.max(2, (d.value / max) * 100)}%`, background: d.color ?? 'var(--brand)' }}
              />
            </div>
            <span className="w-10 shrink-0 text-right text-xs font-semibold tabular-nums" style={{ color: 'var(--text-primary)' }}>
              {formatValue(d.value)}
            </span>
          </div>
        ))}
      </div>
    )
  }

  return (
    <div className={cn('flex items-end gap-2', className)} style={{ height }}>
      {data.map((d, i) => (
        <div key={i} className="group flex flex-1 flex-col items-center justify-end gap-1.5">
          <span className="text-[10px] font-semibold tabular-nums opacity-0 transition-opacity group-hover:opacity-100" style={{ color: 'var(--text-primary)' }}>
            {formatValue(d.value)}
          </span>
          <div className="flex w-full items-end justify-center" style={{ height: height - 28 }}>
            <div
              className="w-full max-w-[40px] rounded-t-lg transition-all duration-500 group-hover:opacity-80"
              style={{ height: `${Math.max(3, (d.value / max) * 100)}%`, background: d.color ?? 'var(--brand)' }}
            />
          </div>
          <span className="truncate text-[10px]" style={{ color: 'var(--text-muted)' }}>{d.label}</span>
        </div>
      ))}
    </div>
  )
}
