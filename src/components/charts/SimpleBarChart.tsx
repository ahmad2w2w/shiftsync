interface BarChartProps {
  data: { label: string; value: number; color?: string }[]
  maxValue?: number
  height?: number
}

export function SimpleBarChart({ data, maxValue, height = 160 }: BarChartProps) {
  const max = maxValue ?? Math.max(...data.map((d) => d.value), 1)

  return (
    <div className="flex items-end justify-between gap-2" style={{ height }} role="img" aria-label="Staafdiagram">
      {data.map(({ label, value, color }) => (
        <div key={label} className="flex min-w-0 flex-1 flex-col items-center gap-2">
          <span className="text-xs font-semibold tabular-nums" style={{ color: 'var(--text-secondary)' }}>
            {value}
          </span>
          <div
            className="w-full max-w-[2.5rem] rounded-t-lg transition-all duration-500 ease-out animate-bar-grow"
            style={{
              height: `${Math.max(4, (value / max) * (height - 48))}px`,
              background: color ?? 'var(--brand)',
            }}
            title={`${label}: ${value}`}
          />
          <span className="truncate text-[10px] font-medium uppercase tracking-wide" style={{ color: 'var(--text-muted)' }}>
            {label}
          </span>
        </div>
      ))}
    </div>
  )
}
