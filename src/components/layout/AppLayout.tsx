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
  { to: '/app/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/app/rooster', label: 'Mijn rooster', icon: Calendar },
  { to: '/app/beschikbaarheid', label: 'Beschikbaarheid', icon: Calendar },
  { to: '/app/klok', label: 'In-/Uitklokken', icon: Clock },
  { to: '/app/uren', label: 'Mijn uren', icon: Timer },
  { to: '/app/verlof', label: 'Verlof', icon: Palmtree },
  { to: '/app/profiel', label: 'Profiel', icon: UserCircle },
]

const managerNav = [
  { to: '/app/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/app/medewerkers', label: 'Medewerkers', icon: Users },
  { to: '/app/rooster', label: 'Rooster', icon: Calendar },
  { to: '/app/maandplanner', label: 'Maandplanner', icon: BarChart3 },
  { to: '/app/beschikbaarheid', label: 'Beschikbaarheid', icon: Calendar },
  { to: '/app/klok', label: 'Klokregistratie', icon: Clock },
  { to: '/app/uren', label: 'Urenoverzicht', icon: Timer },
  { to: '/app/verlof', label: 'Verlofaanvragen', icon: Palmtree },
  { to: '/app/profiel', label: 'Profiel', icon: UserCircle },
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

  const NavItems = () => (
    <>
      {nav.map(({ to, label, icon: Icon }) => (
        <NavLink
          key={to}
          to={to}
          onClick={() => setMobileOpen(false)}
          className={({ isActive }) =>
            cn(
              'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors',
              isActive
                ? 'bg-white/15 text-white'
                : 'text-navy-200 hover:bg-white/10 hover:text-white'
            )
          }
        >
          <Icon className="h-5 w-5 shrink-0" />
          {label}
        </NavLink>
      ))}
    </>
  )

  return (
    <div className="flex min-h-screen bg-gray-50">
      {/* Desktop sidebar */}
      <aside className="hidden w-64 shrink-0 flex-col bg-navy-900 lg:flex">
        <div className="flex items-center gap-2.5 border-b border-white/10 px-5 py-5">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-brand-600">
            <Zap className="h-5 w-5 text-white" />
          </div>
          <div className="min-w-0">
            <p className="font-bold text-white">ShiftSync</p>
            <p className="truncate text-xs text-navy-300">{organization?.name ?? 'Laden...'}</p>
          </div>
        </div>

        <nav className="flex-1 space-y-0.5 p-3">
          <NavItems />
        </nav>

        <div className="border-t border-white/10 p-3">
          {/* Plan badge */}
          {isAdmin && (
            <Link
              to="/app/abonnement"
              onClick={() => setMobileOpen(false)}
              className="mb-2 flex items-center justify-between rounded-lg px-3 py-2 hover:bg-white/10 transition-colors"
            >
              <span className="text-xs text-navy-300">Abonnement</span>
              <span className={cn(
                'rounded-full px-2 py-0.5 text-xs font-semibold',
                plan === 'free' ? 'bg-gray-700 text-gray-300' :
                plan === 'pro' ? 'bg-brand-700 text-brand-200' :
                'bg-amber-700 text-amber-200'
              )}>
                {plan.charAt(0).toUpperCase() + plan.slice(1)}
              </span>
            </Link>
          )}
          {isAdmin && (
            <NavLink
              to="/app/abonnement"
              onClick={() => setMobileOpen(false)}
              className={({ isActive }) =>
                cn(
                  'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors mb-1',
                  isActive ? 'bg-white/15 text-white' : 'text-navy-200 hover:bg-white/10 hover:text-white'
                )
              }
            >
              <CreditCard className="h-5 w-5 shrink-0" />
              Abonnement
            </NavLink>
          )}
          <div className="px-3 py-2">
            <p className="truncate text-sm font-medium text-white">{profile?.full_name}</p>
            <p className="text-xs text-navy-300">{isAdmin ? 'Manager' : 'Medewerker'}</p>
          </div>
          <button
            onClick={handleSignOut}
            className="mt-1 flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-navy-200 hover:bg-white/10 hover:text-white transition-colors"
          >
            <LogOut className="h-4 w-4" />
            Uitloggen
          </button>
        </div>
      </aside>

      {/* Mobile overlay */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 lg:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Mobile sidebar */}
      <aside
        className={cn(
          'fixed inset-y-0 left-0 z-50 flex w-64 flex-col bg-navy-900 transition-transform lg:hidden',
          mobileOpen ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        <div className="flex items-center justify-between border-b border-white/10 px-4 py-4">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-600">
              <Zap className="h-4 w-4 text-white" />
            </div>
            <span className="font-bold text-white">ShiftSync</span>
          </div>
          <button onClick={() => setMobileOpen(false)} className="text-navy-300 hover:text-white">
            <X className="h-5 w-5" />
          </button>
        </div>
        <nav className="flex-1 space-y-0.5 p-3">
          <NavItems />
        </nav>
        <div className="border-t border-white/10 p-3">
          <div className="px-3 py-2">
            <p className="truncate text-sm font-medium text-white">{profile?.full_name}</p>
            <p className="text-xs text-navy-300">{isAdmin ? 'Manager' : 'Medewerker'}</p>
          </div>
          <button
            onClick={handleSignOut}
            className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-navy-200 hover:bg-white/10 hover:text-white"
          >
            <LogOut className="h-4 w-4" />
            Uitloggen
          </button>
        </div>
      </aside>

      {/* Main content */}
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-30 flex items-center gap-4 border-b border-gray-200 bg-white px-4 py-3 lg:px-8">
          <button
            className="rounded-lg p-2 text-navy-800 hover:bg-gray-100 lg:hidden"
            onClick={() => setMobileOpen(true)}
          >
            <Menu className="h-5 w-5" />
          </button>
          <div className="flex flex-1 items-center justify-between">
            <div>
              <p className="text-xs text-gray-400">{organization?.name}</p>
              <p className="font-semibold text-navy-900">{profile?.full_name}</p>
            </div>
          </div>
        </header>
        <main className="flex-1 p-4 lg:p-8">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
