import { supabase } from '../lib/supabase'
import type { AppNotification, NotificationType as AppNotificationType } from '../types/database'

type NotificationType =
  | 'shift_published'
  | 'leave_approved'
  | 'leave_rejected'
  | 'shift_assigned'

interface NotificationPayload {
  type: NotificationType
  recipientEmail: string
  recipientName: string
  data: Record<string, string>
}

export async function sendNotification(payload: NotificationPayload): Promise<void> {
  try {
    const { error } = await supabase.functions.invoke('send-notification', {
      body: payload,
    })
    if (error) throw error
  } catch (err) {
    console.warn('Notificatie kon niet worden verzonden:', err)
  }
}

export async function notifyLeaveDecision(
  recipientEmail: string,
  recipientName: string,
  status: 'approved' | 'rejected',
  startDate: string,
  endDate: string,
  managerNote?: string
): Promise<void> {
  await sendNotification({
    type: status === 'approved' ? 'leave_approved' : 'leave_rejected',
    recipientEmail,
    recipientName,
    data: { startDate, endDate, managerNote: managerNote ?? '' },
  })
}

export async function notifyShiftPublished(
  recipientEmail: string,
  recipientName: string,
  monthLabel: string
): Promise<void> {
  await sendNotification({
    type: 'shift_published',
    recipientEmail,
    recipientName,
    data: { monthLabel },
  })
}

// ── In-app notification center (backed by the notifications table) ──────────

export async function getNotifications(limit = 30): Promise<AppNotification[]> {
  const { data, error } = await supabase
    .from('notifications')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(limit)
  if (error) throw error
  return (data ?? []) as AppNotification[]
}

export async function getUnreadNotificationCount(): Promise<number> {
  const { count, error } = await supabase
    .from('notifications')
    .select('*', { count: 'exact', head: true })
    .is('read_at', null)
  if (error) throw error
  return count ?? 0
}

export async function markNotificationRead(id: string): Promise<void> {
  const { error } = await supabase
    .from('notifications')
    .update({ read_at: new Date().toISOString() })
    .eq('id', id)
  if (error) throw error
}

export async function markAllNotificationsRead(): Promise<void> {
  const { error } = await supabase
    .from('notifications')
    .update({ read_at: new Date().toISOString() })
    .is('read_at', null)
  if (error) throw error
}

export interface CreateNotificationInput {
  organizationId: string
  userId: string
  type: AppNotificationType
  title: string
  body?: string
  link?: string
}

export async function createNotification(input: CreateNotificationInput): Promise<void> {
  const { error } = await supabase.from('notifications').insert({
    organization_id: input.organizationId,
    user_id: input.userId,
    type: input.type,
    title: input.title,
    body: input.body ?? null,
    link: input.link ?? null,
  })
  if (error) throw error
}

export async function createNotificationsBulk(inputs: CreateNotificationInput[]): Promise<void> {
  if (inputs.length === 0) return
  const { error } = await supabase.from('notifications').insert(
    inputs.map((i) => ({
      organization_id: i.organizationId,
      user_id: i.userId,
      type: i.type,
      title: i.title,
      body: i.body ?? null,
      link: i.link ?? null,
    }))
  )
  if (error) throw error
}

/** Subscribe to new notifications for a user. Returns an unsubscribe fn. */
export function subscribeToNotifications(userId: string, onInsert: (n: AppNotification) => void): () => void {
  const channel = supabase
    .channel(`notifications:${userId}`)
    .on(
      'postgres_changes',
      { event: 'INSERT', schema: 'public', table: 'notifications', filter: `user_id=eq.${userId}` },
      (payload) => onInsert(payload.new as AppNotification)
    )
    .subscribe()
  return () => {
    supabase.removeChannel(channel)
  }
}
