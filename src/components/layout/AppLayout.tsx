import { useState } from 'react'
import { NavLink, Outlet, useNavigate, Link } from 'react-router-dom'
import {
  LayoutDashboard,
  Calendar,
  Clock,
  Users,
  Palmtree,
  Timer,
  UserCircle,
  LogOut,
  Menu,
  X,
  Zap,
  CreditCard,
  BarChart3,
} from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import { useOrganization } from '../../context/OrganizationContext'
import { cn } from '../../lib/utils'

const employeeNav = [
  { to: '/app/dashboard',       label: 'Dashboard',       icon: LayoutDashboard },
  { to: '/app/rooster',         label: 'Mijn rooster',    icon: Calendar },
  { to: '/app/beschikbaarheid', label: 'Beschikbaarheid', icon: Calendar },
  { to: '/app/klok',            label: 'In-/Uitklokken',  icon: Clock },
  { to: '/app/uren',            label: 'Mijn uren',       icon: Timer },
  { to: '/app/verlof',          label: 'Verlof',          icon: Palmtree },
  { to: '/app/profiel',         label: 'Profiel',         icon: UserCircle },
]

const managerNav = [
  { to: '/app/dashboard',       label: 'Dashboard',       icon: LayoutDashboard },
  { to: '/app/medewerkers',     label: 'Medewerkers',     icon: Users },
  { to: '/app/rooster',         label: 'Rooster',         icon: Calendar },
  { to: '/app/maandplanner',    label: 'Maandplanner',    icon: BarChart3 },
  { to: '/app/beschikbaarheid', label: 'Beschikbaarheid', icon: Calendar },
  { to: '/app/klok',            label: 'Klokregistratie', icon: Clock },
  { to: '/app/uren',            label: 'Urenoverzicht',   icon: Timer },
  { to: '/app/verlof',          label: 'Verlofaanvragen', icon: Palmtree },
  { to: '/app/profiel',         label: 'Profiel',         icon: UserCircle },
]

export function AppLayout() {
  const { profile, isAdmin, signOut } = useAuth()
  const { organization, plan } = useOrganization()
  const navigate = useNavigate()
  const [mobileOpen, setMobileOpen] = useState(false)
  const nav = isAdmin ? managerNav : employeeNav

  const handleSignOut = async () => {
    await signOut()
    navigate('/login')
  }

  const planColors: Record<string, string> = {
    free:     'text-zinc-500',
    pro:      'text-brand-400',
    business: 'text-amber-400',
  }

  const NavItems = () => (
    <div className="space-y-0.5">
      {nav.map(({ to, label, icon: Icon }) => (
        <NavLink
          key={to}
          to={to}
          onClick={() => setMobileOpen(false)}
          className={({ isActive }) =>
            cn(
              'flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all',
              isActive
                ? 'bg-brand-600/15 text-brand-400'
                : 'text-zinc-500 hover:bg-white/5 hover:text-zinc-200'
            )
          }
        >
          <Icon className="h-[17px] w-[17px] shrink-0" />
          {label}
        </NavLink>
      ))}
    </div>
  )

  const SidebarContent = () => (
    <>
      {/* Logo */}
      <div className="flex items-center gap-3 px-4 py-5 border-b border-white/6">
        <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-brand-600 shadow-lg shadow-brand-600/30">
          <Zap className="h-4 w-4 text-white" />
        </div>
        <div className="min-w-0">
          <p className="font-bold text-white tracking-tight text-sm">ShiftSync</p>
          <p className="truncate text-xs text-zinc-600">{organization?.name ?? '...'}</p>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-3">
        <NavItems />
      </nav>

      {/* Footer */}
      <div className="border-t border-white/6 px-3 py-3 space-y-0.5">
        {isAdmin && (
          <NavLink
            to="/app/abonnement"
            onClick={() => setMobileOpen(false)}
            className={({ isActive }) =>
              cn(
                'flex items-center justify-between rounded-xl px-3 py-2.5 text-sm transition-all',
                isActive
                  ? 'bg-brand-600/15 text-brand-400'
                  : 'text-zinc-500 hover:bg-white/5 hover:text-zinc-200'
              )
            }
          >
            <div className="flex items-center gap-3">
              <CreditCard className="h-[17px] w-[17px] shrink-0" />
              <span className="font-medium">Abonnement</span>
            </div>
            <span className={cn('text-xs font-semibold', planColors[plan] ?? planColors.free)}>
              {plan.charAt(0).toUpperCase() + plan.slice(1)}
            </span>
          </NavLink>
        )}

        {/* User row */}
        <div className="flex items-center gap-3 rounded-xl px-3 py-2.5">
          <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-brand-600/20 text-xs font-bold text-brand-400">
            {profile?.full_name?.[0]?.toUpperCase() ?? '?'}
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium text-zinc-200">{profile?.full_name}</p>
            <p className="text-xs text-zinc-600">{isAdmin ? 'Manager' : 'Medewerker'}</p>
          </div>
        </div>

        <button
          onClick={handleSignOut}
          className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-zinc-600 transition-all hover:bg-white/5 hover:text-zinc-200"
        >
          <LogOut className="h-[17px] w-[17px] shrink-0" />
          Uitloggen
        </button>
      </div>
    </>
  )

  return (
    <div className="flex min-h-screen" style={{ background: '#09090b' }}>
      {/* Desktop sidebar */}
      <aside className="hidden w-56 shrink-0 flex-col lg:flex" style={{ background: '#000000', borderRight: '1px solid rgba(255,255,255,0.06)' }}>
        <SidebarContent />
      </aside>

      {/* Mobile overlay */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm lg:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Mobile sidebar */}
      <aside
        className={cn(
          'fixed inset-y-0 left-0 z-50 flex w-56 flex-col transition-transform duration-200 lg:hidden',
          mobileOpen ? 'translate-x-0' : '-translate-x-full'
        )}
        style={{ background: '#000000', borderRight: '1px solid rgba(255,255,255,0.06)' }}
      >
        <div className="flex items-center justify-between border-b border-white/6 px-4 py-4">
          <div className="flex items-center gap-2.5">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-brand-600">
              <Zap className="h-3.5 w-3.5 text-white" />
            </div>
            <span className="font-bold text-white text-sm">ShiftSync</span>
          </div>
          <button onClick={() => setMobileOpen(false)} className="rounded-lg p-1 text-zinc-600 hover:text-zinc-200">
            <X className="h-4 w-4" />
          </button>
        </div>
        <div className="flex flex-1 flex-col overflow-y-auto">
          <SidebarContent />
        </div>
      </aside>

      {/* Main */}
      <div className="flex min-w-0 flex-1 flex-col">
        {/* Top bar */}
        <header
          className="sticky top-0 z-30 flex items-center gap-3 px-4 py-3 lg:px-6"
          style={{ background: 'rgba(9,9,11,0.85)', borderBottom: '1px solid rgba(255,255,255,0.06)', backdropFilter: 'blur(12px)' }}
        >
          <button
            className="rounded-xl p-2 text-zinc-600 hover:bg-white/5 hover:text-zinc-200 lg:hidden"
            onClick={() => setMobileOpen(true)}
          >
            <Menu className="h-4 w-4" />
          </button>
          <div className="flex flex-1 items-center justify-between min-w-0">
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold text-zinc-100">{organization?.name}</p>
              <p className="text-xs text-zinc-600">{profile?.full_name}</p>
            </div>
            {isAdmin && (
              <Link
                to="/app/abonnement"
                className="hidden sm:flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium text-zinc-500 hover:text-zinc-200 transition-colors"
                style={{ border: '1px solid rgba(255,255,255,0.08)' }}
              >
                <span className={cn('h-1.5 w-1.5 rounded-full', plan === 'free' ? 'bg-zinc-600' : 'bg-brand-500')} />
                {plan.charAt(0).toUpperCase() + plan.slice(1)} plan
              </Link>
            )}
          </div>
        </header>

        <main className="flex-1 p-4 lg:p-6">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
