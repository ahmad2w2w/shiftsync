import { useCallback, useEffect, useState } from 'react'
import { useAuth } from '../context/AuthContext'
import {
  getNotifications,
  markNotificationRead,
  markAllNotificationsRead,
  subscribeToNotifications,
} from '../services/notifications'
import type { AppNotification } from '../types/database'

export interface NotificationsState {
  items: AppNotification[]
  unread: number
  loading: boolean
  refresh: () => Promise<void>
  markRead: (id: string) => Promise<void>
  markAll: () => Promise<void>
}

export function useNotifications(): NotificationsState {
  const { profile } = useAuth()
  const [items, setItems] = useState<AppNotification[]>([])
  const [loading, setLoading] = useState(true)

  const refresh = useCallback(async () => {
    try {
      setItems(await getNotifications(30))
    } catch {
      setItems([])
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    refresh()
    if (!profile?.id) return
    const unsub = subscribeToNotifications(profile.id, (n) =>
      setItems((prev) => (prev.some((p) => p.id === n.id) ? prev : [n, ...prev]))
    )
    return unsub
  }, [profile?.id, refresh])

  const unread = items.filter((i) => !i.read_at).length

  const markRead = useCallback(async (id: string) => {
    setItems((prev) => prev.map((i) => (i.id === id ? { ...i, read_at: new Date().toISOString() } : i)))
    try {
      await markNotificationRead(id)
    } catch {
      /* optimistic */
    }
  }, [])

  const markAll = useCallback(async () => {
    setItems((prev) => prev.map((i) => ({ ...i, read_at: i.read_at ?? new Date().toISOString() })))
    try {
      await markAllNotificationsRead()
    } catch {
      /* optimistic */
    }
  }, [])

  return { items, unread, loading, refresh, markRead, markAll }
}
