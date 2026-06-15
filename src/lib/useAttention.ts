import { useCallback, useEffect, useState } from 'react'
import { getPendingLeaveCount } from '../services/leave'
import { getOpenSwapCount } from '../services/shiftSwaps'
import { getActiveSickCount } from '../services/sick'

export interface AttentionItem {
  id: string
  title: string
  description: string
  to: string
  tone: 'leave' | 'sick' | 'swaps'
  count: number
}

export interface Attention {
  pendingLeave: number
  openSwaps: number
  activeSick: number
  total: number
  items: AttentionItem[]
  loading: boolean
  refresh: () => Promise<void>
}

const EMPTY: Omit<Attention, 'refresh'> = {
  pendingLeave: 0,
  openSwaps: 0,
  activeSick: 0,
  total: 0,
  items: [],
  loading: true,
}

export function useAttention(enabled: boolean): Attention {
  const [state, setState] = useState(EMPTY)

  const refresh = useCallback(async () => {
    if (!enabled) {
      setState({ ...EMPTY, loading: false })
      return
    }
    try {
      const [pendingLeave, openSwaps, activeSick] = await Promise.all([
        getPendingLeaveCount().catch(() => 0),
        getOpenSwapCount().catch(() => 0),
        getActiveSickCount().catch(() => 0),
      ])
      const items: AttentionItem[] = []
      if (pendingLeave > 0)
        items.push({
          id: 'leave',
          title: 'Verlofaanvragen',
          description: `${pendingLeave} aanvraag${pendingLeave !== 1 ? 'en' : ''} wacht op je beoordeling`,
          to: '/app/verlof',
          tone: 'leave',
          count: pendingLeave,
        })
      if (openSwaps > 0)
        items.push({
          id: 'swaps',
          title: 'Dienstruil',
          description: `${openSwaps} ruilverzoek${openSwaps !== 1 ? 'en' : ''} openstaand`,
          to: '/app/ruilen',
          tone: 'swaps',
          count: openSwaps,
        })
      if (activeSick > 0)
        items.push({
          id: 'sick',
          title: 'Ziekmeldingen',
          description: `${activeSick} medewerker${activeSick !== 1 ? 's' : ''} actief ziek gemeld`,
          to: '/app/ziek',
          tone: 'sick',
          count: activeSick,
        })
      setState({
        pendingLeave,
        openSwaps,
        activeSick,
        total: pendingLeave + openSwaps + activeSick,
        items,
        loading: false,
      })
    } catch {
      setState({ ...EMPTY, loading: false })
    }
  }, [enabled])

  useEffect(() => {
    refresh()
    if (!enabled) return
    const interval = setInterval(refresh, 60_000)
    return () => clearInterval(interval)
  }, [refresh, enabled])

  return { ...state, refresh }
}
