import { useEffect, useMemo, useState, type ReactNode } from 'react'
import { format, addWeeks, startOfWeek } from 'date-fns'
import { ArrowLeftRight, Calendar, Store } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { useOrganization } from '../context/OrganizationContext'
import { useToast } from '../context/ToastContext'
import { useConfirm } from '../context/ConfirmContext'
import { getShiftsForPeriod } from '../services/shifts'
import { getAllUsers } from '../services/users'
import {
  getShiftSwaps,
  offerShiftSwap,
  acceptShiftSwap,
  approveShiftSwap,
  rejectShiftSwap,
  cancelShiftSwap,
} from '../services/shiftSwaps'
import type { Shift, ShiftSwap, User } from '../types/database'
import { Card, CardHeader } from '../components/ui/Card'
import { Button } from '../components/ui/Button'
import { Badge } from '../components/ui/Badge'
import { PageHeader } from '../components/ui/PageHeader'
import { EmptyState } from '../components/ui/EmptyState'
import { DashboardSkeleton } from '../components/ui/Skeleton'
import { formatDate, formatTime, shiftSwapStatusLabel, cn } from '../lib/utils'

type Tab = 'mine' | 'market' | 'pending'

export function ShiftSwapPage() {
  const { profile, isAdmin } = useAuth()
  const { organization } = useOrganization()
  const toast = useToast()
  const confirm = useConfirm()
  const [tab, setTab] = useState<Tab>(isAdmin ? 'pending' : 'mine')
  const [myShifts, setMyShifts] = useState<Shift[]>([])
  const [swaps, setSwaps] = useState<ShiftSwap[]>([])
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [busy, setBusy] = useState<string | null>(null)

  const weekStart = startOfWeek(new Date(), { weekStartsOn: 1 })
  const weekEnd = addWeeks(weekStart, 4)

  const load = async () => {
    if (!profile || !organization) return
    setLoading(true)
    try {
      const [shifts, swapData, allUsers] = await Promise.all([
        isAdmin ? Promise.resolve([]) : getShiftsForPeriod(weekStart, weekEnd, { userId: profile.id, publishedOnly: true }),
        getShiftSwaps(isAdmin ? { status: ['offered', 'accepted'] } : undefined),
        getAllUsers(),
      ])
      setMyShifts(shifts)
      setSwaps(swapData)
      setUsers(allUsers)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
  }, [profile, isAdmin, organization])

  const userMap = useMemo(() => new Map(users.map((u) => [u.id, u.full_name])), [users])
  const openSwapShiftIds = useMemo(
    () => new Set(swaps.filter((s) => ['offered', 'accepted'].includes(s.status)).map((s) => s.shift_id)),
    [swaps]
  )

  const myOfferableShifts = myShifts.filter(
    (s) => s.date >= format(new Date(), 'yyyy-MM-dd') && !openSwapShiftIds.has(s.id)
  )

  const marketplace = swaps.filter(
    (s) =>
      s.status === 'offered' &&
      s.offered_by !== profile?.id &&
      s.shift?.date &&
      s.shift.date >= format(new Date(), 'yyyy-MM-dd')
  )

  const pendingApproval = swaps.filter((s) => s.status === 'accepted')

  const mySwaps = swaps.filter((s) => s.offered_by === profile?.id || s.accepted_by === profile?.id)

  const run = async (id: string, fn: () => Promise<void>, success: string) => {
    setBusy(id)
    try {
      await fn()
      toast.success(success)
      load()
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Actie mislukt')
    } finally {
      setBusy(null)
    }
  }

  const SwapCard = ({ swap, actions }: { swap: ShiftSwap; actions?: ReactNode }) => {
    const shift = swap.shift
    if (!shift) return null
    return (
      <Card key={swap.id}>
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="font-semibold capitalize" style={{ color: 'var(--text-primary)' }}>
              {formatDate(shift.date, 'EEE d MMM')} · {formatTime(shift.start_time)}–{formatTime(shift.end_time)}
            </p>
            <p className="text-sm" style={{ color: 'var(--text-muted)' }}>{shift.position}</p>
            <p className="mt-1 text-sm" style={{ color: 'var(--text-secondary)' }}>
              Aangeboden door {userMap.get(swap.offered_by) ?? '—'}
              {swap.accepted_by && ` · Geaccepteerd door ${userMap.get(swap.accepted_by) ?? '—'}`}
            </p>
          </div>
          <div className="flex flex-col items-end gap-2">
            <Badge variant={swap.status === 'approved' ? 'approved' : swap.status === 'rejected' ? 'rejected' : 'pending'}>
              {shiftSwapStatusLabel[swap.status]}
            </Badge>
            {actions}
          </div>
        </div>
      </Card>
    )
  }

  const tabs: { id: Tab; label: string; count?: number }[] = isAdmin
    ? [{ id: 'pending', label: 'Goedkeuring', count: pendingApproval.length }]
    : [
        { id: 'mine', label: 'Mijn diensten', count: myOfferableShifts.length },
        { id: 'market', label: 'Marktplaats', count: marketplace.length },
      ]

  if (loading) return <DashboardSkeleton />

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <PageHeader
        title="Diensten ruilen"
        subtitle={
          isAdmin
            ? 'Keur ruilverzoeken goed nadat een collega heeft geaccepteerd'
            : 'Bied diensten aan of neem openstaande diensten over'
        }
      />

      <div className="flex flex-wrap gap-2">
        {tabs.map(({ id, label, count }) => (
          <button
            key={id}
            type="button"
            onClick={() => setTab(id)}
            className={cn(
              'rounded-xl px-4 py-2 text-sm font-medium transition-all',
              tab === id ? 'bg-brand-600 text-white shadow-sm' : 'hover:opacity-80'
            )}
            style={
              tab !== id
                ? { background: 'var(--surface-card)', border: '1px solid var(--border)', color: 'var(--text-secondary)' }
                : undefined
            }
          >
            {label}
            {count != null && count > 0 && (
              <span className="ml-1.5 rounded-full bg-white/20 px-1.5 text-xs">{count}</span>
            )}
          </button>
        ))}
      </div>

      {/* Employee: offer own shifts */}
      {!isAdmin && tab === 'mine' && (
        <div className="space-y-4">
          <Card>
            <CardHeader title="Diensten aanbieden" subtitle="Collega's kunnen je dienst overnemen na goedkeuring van je manager" />
            {myOfferableShifts.length === 0 ? (
              <EmptyState icon={Calendar} title="Geen diensten om aan te bieden" description="Je hebt geen toekomstige diensten die je kunt ruilen." />
            ) : (
              <ul className="space-y-2">
                {myOfferableShifts.map((s) => (
                  <li
                    key={s.id}
                    className="flex flex-wrap items-center justify-between gap-3 rounded-xl px-4 py-3"
                    style={{ background: 'var(--surface-subtle)', border: '1px solid var(--border)' }}
                  >
                    <div>
                      <p className="font-medium capitalize" style={{ color: 'var(--text-primary)' }}>
                        {formatDate(s.date, 'EEE d MMM')} · {formatTime(s.start_time)}–{formatTime(s.end_time)}
                      </p>
                      <p className="text-sm" style={{ color: 'var(--text-muted)' }}>{s.position}</p>
                    </div>
                    <Button
                      size="sm"
                      variant="secondary"
                      loading={busy === s.id}
                      onClick={() =>
                        run(
                          s.id,
                          () => offerShiftSwap(s.id, organization!.id, profile!.id).then(() => {}),
                          'Dienst aangeboden op de marktplaats'
                        )
                      }
                    >
                      <ArrowLeftRight className="h-4 w-4" />
                      Aanbieden
                    </Button>
                  </li>
                ))}
              </ul>
            )}
          </Card>

          {mySwaps.length > 0 && (
            <div className="space-y-3">
              <h2 className="text-sm font-semibold uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>
                Mijn ruilverzoeken
              </h2>
              {mySwaps.map((swap) => (
                <SwapCard
                  key={swap.id}
                  swap={swap}
                  actions={
                    swap.offered_by === profile?.id && ['offered', 'accepted'].includes(swap.status) ? (
                      <Button
                        size="sm"
                        variant="danger"
                        loading={busy === swap.id}
                        onClick={async () => {
                          const ok = await confirm({
                            title: 'Aanbod annuleren?',
                            message: 'Je dienst wordt niet meer aangeboden op de marktplaats.',
                            confirmLabel: 'Annuleren',
                            danger: true,
                          })
                          if (!ok) return
                          run(swap.id, () => cancelShiftSwap(swap.id).then(() => {}), 'Ruilverzoek geannuleerd')
                        }}
                      >
                        Intrekken
                      </Button>
                    ) : undefined
                  }
                />
              ))}
            </div>
          )}
        </div>
      )}

      {/* Employee: marketplace */}
      {!isAdmin && tab === 'market' && (
        <div className="space-y-3">
          {marketplace.length === 0 ? (
            <Card>
              <EmptyState icon={Store} title="Geen open diensten" description="Er zijn momenteel geen diensten aangeboden door collega's." />
            </Card>
          ) : (
            marketplace.map((swap) => (
              <SwapCard
                key={swap.id}
                swap={swap}
                actions={
                  <Button
                    size="sm"
                    loading={busy === swap.id}
                    onClick={() =>
                      run(
                        swap.id,
                        () => acceptShiftSwap(swap.id, profile!.id).then(() => {}),
                        'Dienst geaccepteerd — wacht op goedkeuring manager'
                      )
                    }
                  >
                    Accepteren
                  </Button>
                }
              />
            ))
          )}
        </div>
      )}

      {/* Manager: pending approval */}
      {isAdmin && (
        <div className="space-y-3">
          {pendingApproval.length === 0 ? (
            <Card>
              <EmptyState icon={ArrowLeftRight} title="Geen ruilverzoeken" description="Ruilverzoeken verschijnen hier zodra een medewerker een dienst accepteert." />
            </Card>
          ) : (
            pendingApproval.map((swap) => (
              <SwapCard
                key={swap.id}
                swap={swap}
                actions={
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      loading={busy === `approve-${swap.id}`}
                      onClick={() =>
                        run(
                          `approve-${swap.id}`,
                          () => approveShiftSwap(swap.id).then(() => {}),
                          'Ruil goedgekeurd — rooster bijgewerkt'
                        )
                      }
                    >
                      Goedkeuren
                    </Button>
                    <Button
                      size="sm"
                      variant="danger"
                      loading={busy === `reject-${swap.id}`}
                      onClick={() =>
                        run(
                          `reject-${swap.id}`,
                          () => rejectShiftSwap(swap.id).then(() => {}),
                          'Ruilverzoek afgewezen'
                        )
                      }
                    >
                      Afwijzen
                    </Button>
                  </div>
                }
              />
            ))
          )}
        </div>
      )}
    </div>
  )
}
