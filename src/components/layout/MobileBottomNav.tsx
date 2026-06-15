import { NavLink } from 'react-router-dom'
import { LayoutDashboard, Calendar, Clock, Menu } from 'lucide-react'
import { cn } from '../../lib/utils'

const tabs = [
  { to: '/app/dashboard', label: 'Home', icon: LayoutDashboard },
  { to: '/app/rooster', label: 'Rooster', icon: Calendar },
  { to: '/app/klok', label: 'Klok', icon: Clock },
] as const

interface MobileBottomNavProps {
  onOpenMenu: () => void
}

export function MobileBottomNav({ onOpenMenu }: MobileBottomNavProps) {
  return (
    <nav
      className="fixed inset-x-0 bottom-0 z-40 flex items-stretch border-t pb-[env(safe-area-inset-bottom)] lg:hidden"
      style={{ background: 'var(--surface-card)', borderColor: 'var(--border)' }}
      aria-label="Hoofdnavigatie"
    >
      {tabs.map(({ to, label, icon: Icon }) => (
        <NavLink
          key={to}
          to={to}
          className={({ isActive }) =>
            cn(
              'flex flex-1 flex-col items-center justify-center gap-1 py-2 text-[10px] font-medium transition-colors',
              isActive ? 'text-brand-600' : 'text-[var(--text-muted)]'
            )
          }
        >
          {({ isActive }) => (
            <>
              <span
                className={cn('flex h-7 w-12 items-center justify-center rounded-full transition-colors')}
                style={isActive ? { background: 'var(--brand-muted)' } : undefined}
              >
                <Icon className="h-5 w-5" />
              </span>
              {label}
            </>
          )}
        </NavLink>
      ))}
      <button
        type="button"
        onClick={onOpenMenu}
        className="flex flex-1 flex-col items-center justify-center gap-1 py-2 text-[10px] font-medium"
        style={{ color: 'var(--text-muted)' }}
        aria-label="Meer menu openen"
      >
        <span className="flex h-7 w-12 items-center justify-center rounded-full">
          <Menu className="h-5 w-5" />
        </span>
        Meer
      </button>
    </nav>
  )
}
