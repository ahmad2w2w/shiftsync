import type { ReactNode } from 'react'

interface ProgressRingProps {
  value: number
  max?: number
  size?: number
  stroke?: number
  color?: string
  trackColor?: string
  children?: ReactNode
}

export function ProgressRing({
  value,
  max = 100,
  size = 96,
  stroke = 9,
  color = 'var(--brand)',
  trackColor = 'var(--surface-subtle)',
  children,
}: ProgressRingProps) {
  const radius = (size - stroke) / 2
  const circumference = 2 * Math.PI * radius
  const pct = Math.max(0, Math.min(1, max === 0 ? 0 : value / max))
  const dash = circumference * pct

  return (
    <div className="relative inline-flex items-center justify-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke={trackColor} strokeWidth={stroke} />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={`${dash} ${circumference}`}
          style={{ transition: 'stroke-dasharray 0.6s var(--ease-out)' }}
        />
      </svg>
      {children && <div className="absolute inset-0 flex flex-col items-center justify-center">{children}</div>}
    </div>
  )
}
