import { useEffect, useRef, useState } from 'react'
import { NavLink, Outlet, useNavigate, Link } from 'react-router-dom'
import {
  LayoutDashboard,
  Calendar,
  CalendarCheck,
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
  Sun,
  Moon,
  Settings,
  Thermometer,
  ArrowLeftRight,
} from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import { useOrganization } from '../../context/OrganizationContext'
import { useTheme } from '../../context/ThemeContext'
import { ErrorBoundary } from '../ErrorBoundary'
import { MobileBottomNav } from './MobileBottomNav'
import { TrialBanner } from './TrialBanner'
import { cn } from '../../lib/utils'

const employeeNav = [
  { to: '/app/dashboard',       label: 'Dashboard',        icon: LayoutDashboard },
  { to: '/app/rooster',         label: 'Mijn rooster',     icon: Calendar },
  { to: '/app/beschikbaarheid', label: 'Beschikbaarheid',  icon: CalendarCheck },
  { to: '/app/klok',            label: 'In-/Uitklokken',   icon: Clock },
  { to: '/app/uren',            label: 'Mijn uren',        icon: Timer },
  { to: '/app/verlof',          label: 'Verlof',           icon: Palmtree },
  { to: '/app/ziek',            label: 'Ziekmelden',       icon: Thermometer },
  { to: '/app/ruilen',          label: 'Diensten ruilen',  icon: ArrowLeftRight },
  { to: '/app/profiel',         label: 'Profiel',          icon: UserCircle },
]

type NavItem = {
  to: string
  label: string
  icon: typeof LayoutDashboard
}

const employeeNavTyped: NavItem[] = employeeNav

const managerNav: NavItem[] = [
  { to: '/app/dashboard',       label: 'Dashboard',        icon: LayoutDashboard },
  { to: '/app/medewerkers',     label: 'Medewerkers',      icon: Users },
  { to: '/app/rooster',         label: 'Rooster',          icon: Calendar },
  { to: '/app/maandplanner',    label: 'Maandplanner',     icon: BarChart3 },
  { to: '/app/klok',            label: 'Klokregistratie',  icon: Clock },
  { to: '/app/uren',            label: 'Urenoverzicht',    icon: Timer },
  { to: '/app/verlof',          label: 'Verlofaanvragen',  icon: Palmtree },
  { to: '/app/ziek',            label: 'Ziekmeldingen',    icon: Thermometer },
  { to: '/app/ruilen',          label: 'Diensten ruilen',  icon: ArrowLeftRight },
  { to: '/app/instellingen',    label: 'Instellingen',     icon: Settings },
  { to: '/app/profiel',         label: 'Profiel',          icon: UserCircle },
]

function UserAvatar({ name, avatarUrl, size = 'md' }: { name?: string; avatarUrl?: string | null; size?: 'sm' | 'md' }) {
  const dim = size === 'sm' ? 'h-7 w-7 text-xs' : 'h-8 w-8 text-sm'
  if (avatarUrl) {
    return (
      <img
        src={avatarUrl}
        alt=""
        className={cn('shrink-0 rounded-full object-cover', dim)}
      />
    )
  }
  return (
    <div className={cn('flex shrink-0 items-center justify-center rounded-full bg-brand-500/20 font-bold text-brand-400', dim)}>
      {name?.[0]?.toUpperCase() ?? '?'}
    </div>
  )
}

export function AppLayout() {
  const { profile, isAdmin, signOut } = useAuth()
  const { organization, isSubscribed, pricePerEmployee } = useOrganization()
  const { theme, toggleTheme } = useTheme()
  const navigate = useNavigate()
  const [mobileOpen, setMobileOpen] = useState(false)
  const mobileNavRef = useRef<HTMLElement>(null)
  const nav = isAdmin ? managerNav : employeeNavTyped

  useEffect(() => {
    if (mobileOpen && mobileNavRef.current) {
      const first = mobileNavRef.current.querySelector<HTMLElement>('a, button')
      first?.focus()
    }
  }, [mobileOpen])

  useEffect(() => {
    if (!mobileOpen) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setMobileOpen(false)
    }
    document.addEventListener('keydown', onKey)
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = ''
    }
  }, [mobileOpen])

  useEffect(() => {
    if (!mobileOpen || !mobileNavRef.current) return
    const panel = mobileNavRef.current
    const focusable = panel.querySelectorAll<HTMLElement>(
      'a, button, [tabindex]:not([tabindex="-1"])'
    )
    const first = focusable[0]
    const last = focusable[focusable.length - 1]
    const trap = (e: KeyboardEvent) => {
      if (e.key !== 'Tab' || focusable.length === 0) return
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault()
        last?.focus()
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault()
        first?.focus()
      }
    }
    panel.addEventListener('keydown', trap)
    return () => panel.removeEventListener('keydown', trap)
  }, [mobileOpen])

  const handleSignOut = async () => {
    await signOut()
    navigate('/login')
  }

  const planLabel = isSubscribed ? 'Actief' : `€${pricePerEmployee}/medew.`

  const NavItems = () => (
    <div className="space-y-0.5">
      {nav.map(({ to, label, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            onClick={() => setMobileOpen(false)}
            className={({ isActive }) =>
              cn(
                'relative flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-150',
                isActive
                  ? 'bg-brand-500/15 text-white shadow-sm before:absolute before:left-0 before:top-1/2 before:h-6 before:w-1 before:-translate-y-1/2 before:rounded-r-full before:bg-brand-500'
                  : 'text-white/55 hover:bg-white/8 hover:text-white/95'
              )
            }
          >
            <Icon className="h-[17px] w-[17px] shrink-0" />
            <span className="flex-1">{label}</span>
          </NavLink>
        ))}
    </div>
  )

  const SidebarContent = () => (
    <>
      <div className="flex items-center gap-3 px-4 py-5" style={{ borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
        <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-brand-500 shadow-lg shadow-brand-500/30">
          <Zap className="h-4 w-4 text-white" />
        </div>
        <div className="min-w-0">
          <p className="font-bold text-white tracking-tight text-sm">ShiftSync</p>
          <p className="truncate text-xs text-white/40">{organization?.name ?? '...'}</p>
        </div>
      </div>

      <nav className="flex-1 px-3 py-3">
        <NavItems />
      </nav>

      <div className="px-3 py-3 space-y-0.5" style={{ borderTop: '1px solid rgba(255,255,255,0.08)' }}>
        {isAdmin && (
          <NavLink
            to="/app/abonnement"
            onClick={() => setMobileOpen(false)}
            className={({ isActive }) =>
              cn(
                'flex items-center justify-between rounded-xl px-3 py-2.5 text-sm transition-all',
                isActive
                  ? 'bg-brand-500/15 text-brand-400'
                  : 'text-white/50 hover:bg-white/8 hover:text-white/90'
              )
            }
          >
            <div className="flex items-center gap-3">
              <CreditCard className="h-[17px] w-[17px] shrink-0" />
              <span className="font-medium">Abonnement</span>
            </div>
            <span className="text-xs font-semibold text-brand-400">
              {planLabel}
            </span>
          </NavLink>
        )}

        <div className="flex items-center gap-3 rounded-xl px-3 py-2.5">
          <UserAvatar name={profile?.full_name} avatarUrl={profile?.avatar_url} size="sm" />
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium text-white/80">{profile?.full_name}</p>
            <p className="text-xs text-white/40">{isAdmin ? 'Manager' : 'Medewerker'}</p>
          </div>
        </div>

        <button
          onClick={handleSignOut}
          className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-white/40 transition-all hover:bg-white/8 hover:text-white/80"
        >
          <LogOut className="h-[17px] w-[17px] shrink-0" />
          Uitloggen
        </button>
      </div>
    </>
  )

  return (
    <div className="flex min-h-screen" style={{ background: 'var(--surface-page)' }}>
      <a href="#main-content" className="skip-link">
        Naar hoofdinhoud
      </a>
      <aside
        className="app-sidebar hidden w-60 shrink-0 flex-col lg:flex"
        style={{ background: 'var(--sidebar-bg)', borderRight: '1px solid rgba(255,255,255,0.06)' }}
      >
        <SidebarContent />
      </aside>

      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm lg:hidden"
          onClick={() => setMobileOpen(false)}
          aria-hidden="true"
        />
      )}

      <aside
        ref={mobileNavRef}
        className={cn(
          'app-sidebar fixed inset-y-0 left-0 z-50 flex w-60 flex-col transition-transform duration-200 lg:hidden',
          mobileOpen ? 'translate-x-0' : '-translate-x-full'
        )}
        style={{ background: 'var(--sidebar-bg)', borderRight: '1px solid rgba(255,255,255,0.06)' }}
        aria-hidden={!mobileOpen}
        role="dialog"
        aria-modal={mobileOpen}
        aria-label="Navigatiemenu"
      >
        <div className="flex items-center justify-between px-4 py-4" style={{ borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
          <div className="flex items-center gap-2.5">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-brand-500">
              <Zap className="h-3.5 w-3.5 text-white" />
            </div>
            <span className="font-bold text-white text-sm">ShiftSync</span>
          </div>
          <button
            type="button"
            onClick={() => setMobileOpen(false)}
            className="rounded-lg p-1 text-white/40 hover:text-white/80"
            aria-label="Menu sluiten"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
        <div className="flex flex-1 flex-col overflow-y-auto">
          <SidebarContent />
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header
          className="sticky top-0 z-30 flex items-center gap-3 px-4 py-3 lg:px-6 backdrop-blur-md"
          style={{
            background: 'var(--topbar-bg)',
            borderBottom: '1px solid var(--topbar-border)',
          }}
        >
          <button
            type="button"
            className="rounded-xl p-2 transition-colors hover:bg-black/5 dark:hover:bg-white/5 lg:hidden"
            style={{ color: 'var(--text-muted)' }}
            onClick={() => setMobileOpen(true)}
            aria-label="Menu openen"
            aria-expanded={mobileOpen}
          >
            <Menu className="h-4 w-4" />
          </button>
          <div className="flex flex-1 items-center justify-between min-w-0">
            <div className="flex min-w-0 items-center gap-3">
              <div className="hidden sm:block">
                <UserAvatar name={profile?.full_name} avatarUrl={profile?.avatar_url} size="md" />
              </div>
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>
                  {organization?.name}
                </p>
                <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
                  {profile?.full_name}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {isAdmin && (
                <Link
                  to="/app/abonnement"
                  className="hidden sm:flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition-colors hover:opacity-80"
                  style={{ color: 'var(--text-muted)', border: '1px solid var(--border)' }}
                >
                  <span className={cn('h-1.5 w-1.5 rounded-full', isSubscribed ? 'bg-brand-500' : 'bg-[#94A3B8]')} />
                  {planLabel}
                </Link>
              )}
              <button
                type="button"
                onClick={toggleTheme}
                className="flex h-8 w-8 items-center justify-center rounded-lg transition-colors hover:bg-black/5 dark:hover:bg-white/5"
                style={{ color: 'var(--text-muted)', border: '1px solid var(--border)' }}
                aria-label={theme === 'dark' ? 'Schakel naar licht thema' : 'Schakel naar donker thema'}
              >
                {theme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
              </button>
            </div>
          </div>
        </header>

        <TrialBanner />

        <main id="main-content" className={cn('flex-1 p-4 lg:p-6 print-page', !isAdmin && 'pb-20 lg:pb-6')}>
          <ErrorBoundary>
            <Outlet />
          </ErrorBoundary>
        </main>
      </div>

      {!isAdmin && <MobileBottomNav onOpenMenu={() => setMobileOpen(true)} />}
    </div>
  )
}
