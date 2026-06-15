import { useId, useState } from 'react'
import { cn } from '../../lib/utils'

export interface ChartPoint {
  label: string
  value: number
}

interface AreaChartProps {
  data: ChartPoint[]
  height?: number
  color?: string
  formatValue?: (v: number) => string
  className?: string
}

export function AreaChart({
  data,
  height = 160,
  color = 'var(--brand)',
  formatValue = (v) => String(Math.round(v)),
  className,
}: AreaChartProps) {
  const gradId = useId()
  const [hover, setHover] = useState<number | null>(null)
  const width = 100 // viewBox units (responsive via preserveAspectRatio none)
  const max = Math.max(1, ...data.map((d) => d.value))
  const stepX = data.length > 1 ? width / (data.length - 1) : width
  const padY = 8
  const usableH = height - padY * 2

  const points = data.map((d, i) => ({
    x: i * stepX,
    y: padY + usableH - (d.value / max) * usableH,
    ...d,
  }))

  const linePath = points
    .map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x.toFixed(2)} ${p.y.toFixed(2)}`)
    .join(' ')
  const areaPath = `${linePath} L ${width} ${height} L 0 ${height} Z`

  return (
    <div className={cn('relative w-full', className)} style={{ height }}>
      <svg
        viewBox={`0 0 ${width} ${height}`}
        preserveAspectRatio="none"
        className="h-full w-full overflow-visible"
        onMouseLeave={() => setHover(null)}
      >
        <defs>
          <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={color} stopOpacity="0.28" />
            <stop offset="100%" stopColor={color} stopOpacity="0" />
          </linearGradient>
        </defs>

        {[0.25, 0.5, 0.75].map((f) => (
          <line
            key={f}
            x1="0"
            x2={width}
            y1={padY + usableH * f}
            y2={padY + usableH * f}
            stroke="var(--border)"
            strokeWidth="0.3"
            strokeDasharray="1 1.5"
          />
        ))}

        <path d={areaPath} fill={`url(#${gradId})`} />
        <path d={linePath} fill="none" stroke={color} strokeWidth="1.4" strokeLinejoin="round" strokeLinecap="round" vectorEffect="non-scaling-stroke" />

        {points.map((p, i) => (
          <g key={i}>
            <rect
              x={p.x - stepX / 2}
              y={0}
              width={stepX}
              height={height}
              fill="transparent"
              onMouseEnter={() => setHover(i)}
            />
            {hover === i && (
              <>
                <line x1={p.x} x2={p.x} y1={padY} y2={height} stroke={color} strokeWidth="0.4" strokeDasharray="1.5 1.5" vectorEffect="non-scaling-stroke" />
                <circle cx={p.x} cy={p.y} r="3" fill={color} stroke="var(--surface-card)" strokeWidth="1.5" vectorEffect="non-scaling-stroke" />
              </>
            )}
          </g>
        ))}
      </svg>

      {hover !== null && points[hover] && (
        <div
          className="pointer-events-none absolute z-10 -translate-x-1/2 -translate-y-full rounded-lg px-2.5 py-1.5 text-center"
          style={{
            left: `${(points[hover].x / width) * 100}%`,
            top: `${(points[hover].y / height) * 100}%`,
            background: 'var(--color-navy)',
            color: '#fff',
            boxShadow: 'var(--shadow-3)',
          }}
        >
          <p className="text-sm font-bold leading-none tabular-nums">{formatValue(points[hover].value)}</p>
          <p className="mt-0.5 text-[10px] opacity-70">{points[hover].label}</p>
        </div>
      )}

      <div className="mt-1 flex justify-between text-[10px]" style={{ color: 'var(--text-disabled)' }}>
        {data.map((d, i) => (
          <span key={i} className={cn(data.length > 8 && i % 2 !== 0 && 'opacity-0')}>{d.label}</span>
        ))}
      </div>
    </div>
  )
}
