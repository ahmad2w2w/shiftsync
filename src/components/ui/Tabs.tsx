import { cn } from '../../lib/utils'

export interface TabItem<T extends string = string> {
  id: T
  label: string
  icon?: React.ReactNode
  badge?: number
}

interface TabsProps<T extends string = string> {
  tabs: TabItem<T>[]
  active: T
  onChange: (id: T) => void
  className?: string
}

export function Tabs<T extends string>({ tabs, active, onChange, className }: TabsProps<T>) {
  return (
    <div
      className={cn('inline-flex flex-wrap gap-1 rounded-2xl p-1', className)}
      style={{ background: 'var(--surface-subtle)', border: '1px solid var(--border)' }}
      role="tablist"
    >
      {tabs.map(({ id, label, icon, badge }) => {
        const selected = active === id
        return (
          <button
            key={id}
            type="button"
            role="tab"
            aria-selected={selected}
            onClick={() => onChange(id)}
            className={cn(
              'inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-medium transition-all duration-200',
              selected ? 'shadow-sm' : 'hover:opacity-80'
            )}
            style={
              selected
                ? { background: 'var(--surface-card)', color: 'var(--brand-strong)', boxShadow: 'var(--shadow-card)' }
                : { color: 'var(--text-muted)' }
            }
          >
            {icon}
            {label}
            {badge != null && badge > 0 && (
              <span
                className="rounded-full px-1.5 py-0.5 text-[10px] font-bold"
                style={{ background: selected ? 'rgba(59,130,246,0.15)' : 'var(--border)', color: 'var(--brand-strong)' }}
              >
                {badge}
              </span>
            )}
          </button>
        )
      })}
    </div>
  )
}
