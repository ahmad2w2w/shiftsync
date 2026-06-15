import { useEffect, useMemo, useRef, useState } from 'react'
import { NavLink, Outlet, useNavigate, useLocation } from 'react-router-dom'
import {
  LayoutDashboard,
  Calendar,
  CalendarCheck,
  CalendarRange,
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
  Sun,
  Moon,
  Settings,
  Thermometer,
  ArrowLeftRight,
  Search,
  Plus,
  ChevronDown,
  PanelLeftClose,
  PanelLeftOpen,
  UserPlus,
  CalendarPlus,
  Megaphone,
} from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import { useOrganization } from '../../context/OrganizationContext'
import { OrgConfigProvider } from '../../context/OrgConfigContext'
import { useTheme } from '../../context/ThemeContext'
import { ErrorBoundary } from '../ErrorBoundary'
import { MobileBottomNav } from './MobileBottomNav'
import { TrialBanner } from './TrialBanner'
import { NotificationCenter } from './NotificationCenter'
import { AnnouncementModal } from './AnnouncementModal'
import { Avatar } from '../ui/Avatar'
import { CountBadge } from '../ui/Badge'
import { Kbd } from '../ui/Kbd'
import { Popover } from '../ui/Popover'
import { CommandMenu, type Command } from '../ui/CommandMenu'
import { useAttention } from '../../lib/useAttention'
import { getAllUsers } from '../../services/users'
import type { User } from '../../types/database'
import { cn } from '../../lib/utils'

type BadgeKey = 'leave' | 'sick' | 'swaps'

interface NavItem {
  to: string
  label: string
  icon: typeof LayoutDashboard
  badge?: BadgeKey
}

interface NavGroup {
  label: string
  items: NavItem[]
}

const managerGroups: NavGroup[] = [
  { label: 'Overzicht', items: [{ to: '/app/dashboard', label: 'Dashboard', icon: LayoutDashboard }] },
  {
    label: 'Planning',
    items: [
      { to: '/app/rooster', label: 'Rooster', icon: Calendar },
      { to: '/app/maandplanner', label: 'Maandplanner', icon: CalendarRange },
    ],
  },
  {
    label: 'Tijd & verlof',
    items: [
      { to: '/app/klok', label: 'Klokregistratie', icon: Clock },
      { to: '/app/uren', label: 'Urenoverzicht', icon: Timer },
      { to: '/app/verlof', label: 'Verlofaanvragen', icon: Palmtree, badge: 'leave' },
      { to: '/app/ziek', label: 'Ziekmeldingen', icon: Thermometer, badge: 'sick' },
      { to: '/app/ruilen', label: 'Diensten ruilen', icon: ArrowLeftRight, badge: 'swaps' },
    ],
  },
  { label: 'Team', items: [{ to: '/app/medewerkers', label: 'Medewerkers', icon: Users }] },
  { label: 'Beheer', items: [{ to: '/app/instellingen', label: 'Instellingen', icon: Settings }] },
]

const employeeGroups: NavGroup[] = [
  { label: 'Overzicht', items: [{ to: '/app/dashboard', label: 'Dashboard', icon: LayoutDashboard }] },
  {
    label: 'Planning',
    items: [
      { to: '/app/rooster', label: 'Mijn rooster', icon: Calendar },
      { to: '/app/team', label: 'Team', icon: Users },
      { to: '/app/beschikbaarheid', label: 'Beschikbaarheid', icon: CalendarCheck },
    ],
  },
  {
    label: 'Tijd & verlof',
    items: [
      { to: '/app/klok', label: 'In-/Uitklokken', icon: Clock },
      { to: '/app/uren', label: 'Mijn uren', icon: Timer },
      { to: '/app/verlof', label: 'Verlof', icon: Palmtree },
      { to: '/app/ziek', label: 'Ziekmelden', icon: Thermometer },
      { to: '/app/ruilen', label: 'Diensten ruilen', icon: ArrowLeftRight, badge: 'swaps' },
    ],
  },
]

const COLLAPSE_KEY = 'shiftsync-sidebar-collapsed'

export function AppLayout() {
  const { profile, isAdmin, signOut } = useAuth()
  const { organization, isSubscribed, pricePerEmployee } = useOrganization()
  const { theme, toggleTheme } = useTheme()
  const navigate = useNavigate()
  const location = useLocation()
  const [mobileOpen, setMobileOpen] = useState(false)
  const [collapsed, setCollapsed] = useState(() => localStorage.getItem(COLLAPSE_KEY) === '1')
  const [paletteOpen, setPaletteOpen] = useState(false)
  const [announceOpen, setAnnounceOpen] = useState(false)
  const [searchUsers, setSearchUsers] = useState<User[]>([])
  const mobileNavRef = useRef<HTMLElement>(null)

  // Load colleagues once for global search (managers see all, employees see team)
  useEffect(() => {
    if (!organization) return
    getAllUsers().then(setSearchUsers).catch(() => {})
  }, [organization])

  const groups = isAdmin ? managerGroups : employeeGroups
  const attention = useAttention(true)

  const badgeCount = (key?: BadgeKey) => {
    if (!key) return 0
    if (key === 'leave') return attention.pendingLeave
    if (key === 'sick') return attention.activeSick
    return attention.openSwaps
  }

  // Refresh badges when navigating (an approval likely changed counts)
  useEffect(() => { attention.refresh() }, [location.pathname]) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    localStorage.setItem(COLLAPSE_KEY, collapsed ? '1' : '0')
  }, [collapsed])

  // Cmd/Ctrl+K opens command palette
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault()
        setPaletteOpen((v) => !v)
      }
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [])

  useEffect(() => {
    if (!mobileOpen) return
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setMobileOpen(false) }
    document.addEventListener('keydown', onKey)
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = ''
    }
  }, [mobileOpen])

  const handleSignOut = async () => {
    await signOut()
    navigate('/login')
  }

  const planLabel = isSubscribed ? 'Actief' : `€${pricePerEmployee}/medew.`

  const currentTitle = useMemo(() => {
    for (const g of groups) {
      const match = g.items.find((i) => location.pathname.startsWith(i.to))
      if (match) return match.label
    }
    if (location.pathname.startsWith('/app/profiel')) return 'Profiel'
    if (location.pathname.startsWith('/app/abonnement')) return 'Abonnement'
    return 'ShiftSync'
  }, [location.pathname, groups])

  const commands = useMemo<Command[]>(() => {
    const navCommands: Command[] = groups.flatMap((g) =>
      g.items.map((i) => ({
        id: `nav-${i.to}`,
        label: i.label,
        group: 'Navigatie',
        icon: <i.icon className="h-4 w-4" style={{ color: 'var(--text-muted)' }} />,
        perform: () => navigate(i.to),
      }))
    )
    const actions: Command[] = []
    if (isAdmin) {
      actions.push(
        { id: 'act-shift', label: 'Nieuwe dienst plannen', hint: 'Rooster', group: 'Acties', icon: <CalendarPlus className="h-4 w-4" style={{ color: 'var(--brand-strong)' }} />, perform: () => navigate('/app/rooster') },
        { id: 'act-invite', label: 'Medewerker uitnodigen', hint: 'Medewerkers', group: 'Acties', icon: <UserPlus className="h-4 w-4" style={{ color: 'var(--brand-strong)' }} />, perform: () => navigate('/app/medewerkers') },
        { id: 'act-announce', label: 'Mededeling versturen', hint: 'Team', group: 'Acties', icon: <Megaphone className="h-4 w-4" style={{ color: 'var(--brand-strong)' }} />, perform: () => setAnnounceOpen(true) },
        { id: 'act-billing', label: 'Abonnement beheren', group: 'Acties', icon: <CreditCard className="h-4 w-4" style={{ color: 'var(--text-muted)' }} />, perform: () => navigate('/app/abonnement') },
      )
    }
    actions.push(
      { id: 'act-profile', label: 'Profiel', group: 'Acties', icon: <UserCircle className="h-4 w-4" style={{ color: 'var(--text-muted)' }} />, perform: () => navigate('/app/profiel') },
      { id: 'act-theme', label: theme === 'dark' ? 'Licht thema' : 'Donker thema', group: 'Acties', icon: theme === 'dark' ? <Sun className="h-4 w-4" style={{ color: 'var(--text-muted)' }} /> : <Moon className="h-4 w-4" style={{ color: 'var(--text-muted)' }} />, perform: toggleTheme },
      { id: 'act-signout', label: 'Uitloggen', group: 'Acties', icon: <LogOut className="h-4 w-4" style={{ color: 'var(--text-muted)' }} />, perform: handleSignOut },
    )

    // Searchable people — managers jump to the detail page, employees to the team roster
    const peopleCommands: Command[] = searchUsers.map((u) => ({
      id: `user-${u.id}`,
      label: u.full_name,
      hint: u.role === 'admin' ? 'Manager' : 'Medewerker',
      group: 'Medewerkers',
      keywords: u.email,
      icon: <Users className="h-4 w-4" style={{ color: 'var(--text-muted)' }} />,
      perform: () => navigate(isAdmin ? `/app/medewerkers/${u.id}` : '/app/team'),
    }))

    return [...navCommands, ...actions, ...peopleCommands]
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [groups, isAdmin, theme, searchUsers])

  const NavSection = ({ onNavigate, showLabels }: { onNavigate?: () => void; showLabels: boolean }) => (
    <div className="space-y-4">
      {groups.map((group) => (
        <div key={group.label}>
          {showLabels && (
            <p className="mb-1 px-3 text-[10px] font-semibold uppercase tracking-wider text-white/35">
              {group.label}
            </p>
          )}
          <div className="space-y-0.5">
            {group.items.map(({ to, label, icon: Icon, badge }) => {
              const count = badgeCount(badge)
              return (
                <NavLink
                  key={to}
                  to={to}
                  onClick={onNavigate}
                  title={!showLabels ? label : undefined}
                  className={({ isActive }) =>
                    cn(
                      'group relative flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-150',
                      !showLabels && 'justify-center px-0',
                      isActive
                        ? 'bg-white/10 text-white shadow-sm before:absolute before:left-0 before:top-1/2 before:h-6 before:w-1 before:-translate-y-1/2 before:rounded-r-full before:bg-brand-500'
                        : 'text-white/55 hover:bg-white/8 hover:text-white/95'
                    )
                  }
                >
                  <span className="relative shrink-0">
                    <Icon className="h-[18px] w-[18px]" />
                    {!showLabels && count > 0 && (
                      <span className="absolute -right-2 -top-2">
                        <CountBadge count={count} tone="danger" />
                      </span>
                    )}
                  </span>
                  {showLabels && <span className="flex-1">{label}</span>}
                  {showLabels && count > 0 && <CountBadge count={count} tone="danger" />}
                </NavLink>
              )
            })}
          </div>
        </div>
      ))}
    </div>
  )

  const SidebarBrand = ({ compact }: { compact: boolean }) => (
    <div className={cn('flex items-center gap-3 px-4 py-5', compact && 'justify-center px-0')} style={{ borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-brand-500 shadow-lg shadow-brand-500/30">
        <Zap className="h-5 w-5 text-white" />
      </div>
      {!compact && (
        <div className="min-w-0">
          <p className="text-sm font-bold tracking-tight text-white">ShiftSync</p>
          <p className="truncate text-xs text-white/40">{organization?.name ?? '...'}</p>
        </div>
      )}
    </div>
  )

  return (
    <div className="flex min-h-screen" style={{ background: 'var(--surface-page)' }}>
      <a href="#main-content" className="skip-link">Naar hoofdinhoud</a>

      {/* Desktop sidebar */}
      <aside
        className={cn('app-sidebar hidden shrink-0 flex-col transition-[width] duration-200 lg:flex', collapsed ? 'w-[76px]' : 'w-64')}
        style={{ background: 'var(--sidebar-bg)', borderRight: '1px solid rgba(255,255,255,0.06)' }}
      >
        <SidebarBrand compact={collapsed} />
        <nav className={cn('flex-1 overflow-y-auto py-4', collapsed ? 'px-2' : 'px-3')}>
          <NavSection showLabels={!collapsed} />
        </nav>
        <div className={cn('py-3', collapsed ? 'px-2' : 'px-3')} style={{ borderTop: '1px solid rgba(255,255,255,0.08)' }}>
          <button
            type="button"
            onClick={() => setCollapsed((v) => !v)}
            className={cn('flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-white/45 transition-all hover:bg-white/8 hover:text-white/85', collapsed && 'justify-center px-0')}
            title={collapsed ? 'Menu uitklappen' : 'Menu inklappen'}
          >
            {collapsed ? <PanelLeftOpen className="h-[18px] w-[18px]" /> : <PanelLeftClose className="h-[18px] w-[18px]" />}
            {!collapsed && <span>Inklappen</span>}
          </button>
        </div>
      </aside>

      {/* Mobile drawer */}
      {mobileOpen && (
        <div className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm lg:hidden" onClick={() => setMobileOpen(false)} aria-hidden="true" />
      )}
      <aside
        ref={mobileNavRef}
        className={cn(
          'app-sidebar fixed inset-y-0 left-0 z-50 flex w-64 flex-col transition-transform duration-200 lg:hidden',
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
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-500">
              <Zap className="h-4 w-4 text-white" />
            </div>
            <span className="text-sm font-bold text-white">ShiftSync</span>
          </div>
          <button type="button" onClick={() => setMobileOpen(false)} className="rounded-lg p-1 text-white/40 hover:text-white/80" aria-label="Menu sluiten">
            <X className="h-4 w-4" />
          </button>
        </div>
        <nav className="flex-1 overflow-y-auto px-3 py-4">
          <NavSection showLabels onNavigate={() => setMobileOpen(false)} />
        </nav>
        <div className="px-3 py-3" style={{ borderTop: '1px solid rgba(255,255,255,0.08)' }}>
          <button onClick={handleSignOut} className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-white/45 transition-all hover:bg-white/8 hover:text-white/85">
            <LogOut className="h-[18px] w-[18px]" />
            Uitloggen
          </button>
        </div>
      </aside>

      {/* Main column */}
      <div className="flex min-w-0 flex-1 flex-col">
        <header
          className="sticky top-0 z-30 flex items-center gap-3 px-4 py-3 backdrop-blur-md lg:px-6"
          style={{ background: 'var(--topbar-bg)', borderBottom: '1px solid var(--topbar-border)' }}
        >
          <button
            type="button"
            className="press rounded-xl p-2 transition-colors hover:bg-black/5 dark:hover:bg-white/5 lg:hidden"
            style={{ color: 'var(--text-muted)' }}
            onClick={() => setMobileOpen(true)}
            aria-label="Menu openen"
          >
            <Menu className="h-5 w-5" />
          </button>

          <h1 className="shrink-0 text-base font-semibold lg:text-lg" style={{ color: 'var(--text-primary)' }}>
            {currentTitle}
          </h1>

          {/* Global search → command palette */}
          <button
            type="button"
            onClick={() => setPaletteOpen(true)}
            className="press group ml-auto hidden items-center gap-2 rounded-xl px-3 py-2 text-sm transition-colors hover:bg-black/[0.03] dark:hover:bg-white/5 sm:flex"
            style={{ color: 'var(--text-muted)', border: '1px solid var(--border)', minWidth: 220 }}
          >
            <Search className="h-4 w-4" />
            <span className="flex-1 text-left">Zoeken...</span>
            <span className="flex items-center gap-0.5">
              <Kbd>⌘</Kbd>
              <Kbd>K</Kbd>
            </span>
          </button>

          <div className="ml-auto flex items-center gap-2 sm:ml-0">
            <button
              type="button"
              onClick={() => setPaletteOpen(true)}
              className="press flex h-9 w-9 items-center justify-center rounded-xl transition-colors hover:bg-black/5 dark:hover:bg-white/8 sm:hidden"
              style={{ color: 'var(--text-muted)', border: '1px solid var(--border)' }}
              aria-label="Zoeken"
            >
              <Search className="h-4 w-4" />
            </button>

            {isAdmin && <QuickAdd onNavigate={navigate} onAnnounce={() => setAnnounceOpen(true)} />}

            <NotificationCenter />

            <button
              type="button"
              onClick={toggleTheme}
              className="press flex h-9 w-9 items-center justify-center rounded-xl transition-colors hover:bg-black/5 dark:hover:bg-white/8"
              style={{ color: 'var(--text-muted)', border: '1px solid var(--border)' }}
              aria-label={theme === 'dark' ? 'Licht thema' : 'Donker thema'}
            >
              {theme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            </button>

            <UserMenu
              name={profile?.full_name}
              avatarUrl={profile?.avatar_url}
              roleLabel={isAdmin ? 'Manager' : 'Medewerker'}
              isAdmin={isAdmin}
              planLabel={planLabel}
              isSubscribed={isSubscribed}
              onNavigate={navigate}
              onSignOut={handleSignOut}
            />
          </div>
        </header>

        <TrialBanner />

        <main id="main-content" className={cn('print-page flex-1 p-4 lg:p-6', !isAdmin && 'pb-20 lg:pb-6')}>
          <ErrorBoundary>
            <OrgConfigProvider>
              <Outlet />
            </OrgConfigProvider>
          </ErrorBoundary>
        </main>
      </div>

      {!isAdmin && <MobileBottomNav onOpenMenu={() => setMobileOpen(true)} />}

      <CommandMenu open={paletteOpen} onClose={() => setPaletteOpen(false)} commands={commands} />
      {isAdmin && <AnnouncementModal open={announceOpen} onClose={() => setAnnounceOpen(false)} />}
    </div>
  )
}

function QuickAdd({ onNavigate, onAnnounce }: { onNavigate: (to: string) => void; onAnnounce: () => void }) {
  return (
    <Popover
      width={240}
      trigger={({ toggle, ref, open }) => (
        <button
          ref={ref}
          type="button"
          onClick={toggle}
          aria-expanded={open}
          className="press hidden items-center gap-1.5 rounded-xl bg-brand-500 px-3 py-2 text-sm font-semibold text-white shadow-sm shadow-brand-500/25 transition-colors hover:bg-brand-600 sm:flex"
        >
          <Plus className="h-4 w-4" />
          Snel toevoegen
          <ChevronDown className="h-3.5 w-3.5 opacity-80" />
        </button>
      )}
    >
      {({ close }) => (
        <div className="p-1.5">
          {[
            { label: 'Nieuwe dienst', icon: CalendarPlus, action: () => onNavigate('/app/rooster') },
            { label: 'Medewerker uitnodigen', icon: UserPlus, action: () => onNavigate('/app/medewerkers') },
            { label: 'Maandplanner', icon: CalendarRange, action: () => onNavigate('/app/maandplanner') },
            { label: 'Mededeling versturen', icon: Megaphone, action: onAnnounce },
          ].map(({ label, icon: Icon, action }) => (
            <button
              key={label}
              type="button"
              onClick={() => { action(); close() }}
              className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm font-medium transition-colors hover:bg-black/5 dark:hover:bg-white/8"
              style={{ color: 'var(--text-primary)' }}
            >
              <Icon className="h-4 w-4" style={{ color: 'var(--brand-strong)' }} />
              {label}
            </button>
          ))}
        </div>
      )}
    </Popover>
  )
}

function UserMenu({
  name,
  avatarUrl,
  roleLabel,
  isAdmin,
  planLabel,
  isSubscribed,
  onNavigate,
  onSignOut,
}: {
  name?: string
  avatarUrl?: string | null
  roleLabel: string
  isAdmin: boolean
  planLabel: string
  isSubscribed: boolean
  onNavigate: (to: string) => void
  onSignOut: () => void
}) {
  return (
    <Popover
      width={240}
      trigger={({ toggle, ref, open }) => (
        <button
          ref={ref}
          type="button"
          onClick={toggle}
          aria-expanded={open}
          aria-label="Accountmenu"
          className="press flex items-center gap-2 rounded-xl py-1 pl-1 pr-2 transition-colors hover:bg-black/5 dark:hover:bg-white/8"
          style={{ border: '1px solid var(--border)' }}
        >
          <Avatar name={name} src={avatarUrl} size="sm" />
          <ChevronDown className="hidden h-3.5 w-3.5 sm:block" style={{ color: 'var(--text-muted)' }} />
        </button>
      )}
    >
      {({ close }) => (
        <div>
          <div className="flex items-center gap-3 px-4 py-3" style={{ borderBottom: '1px solid var(--border)' }}>
            <Avatar name={name} src={avatarUrl} size="md" />
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>{name}</p>
              <p className="text-xs" style={{ color: 'var(--text-muted)' }}>{roleLabel}</p>
            </div>
          </div>
          <div className="p-1.5">
            <MenuButton icon={UserCircle} label="Profiel" onClick={() => { onNavigate('/app/profiel'); close() }} />
            {isAdmin && (
              <MenuButton
                icon={CreditCard}
                label="Abonnement"
                trailing={<span className="text-xs font-semibold" style={{ color: isSubscribed ? 'var(--color-success)' : 'var(--brand-strong)' }}>{planLabel}</span>}
                onClick={() => { onNavigate('/app/abonnement'); close() }}
              />
            )}
            {isAdmin && <MenuButton icon={Settings} label="Instellingen" onClick={() => { onNavigate('/app/instellingen'); close() }} />}
          </div>
          <div className="p-1.5" style={{ borderTop: '1px solid var(--border)' }}>
            <button
              type="button"
              onClick={() => { onSignOut(); close() }}
              className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm font-medium text-red-500 transition-colors hover:bg-red-500/10"
            >
              <LogOut className="h-4 w-4" />
              Uitloggen
            </button>
          </div>
        </div>
      )}
    </Popover>
  )
}

function MenuButton({
  icon: Icon,
  label,
  trailing,
  onClick,
}: {
  icon: typeof UserCircle
  label: string
  trailing?: React.ReactNode
  onClick: () => void
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm font-medium transition-colors hover:bg-black/5 dark:hover:bg-white/8"
      style={{ color: 'var(--text-primary)' }}
    >
      <Icon className="h-4 w-4" style={{ color: 'var(--text-muted)' }} />
      <span className="flex-1">{label}</span>
      {trailing}
    </button>
  )
}
