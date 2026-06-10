import { supabase } from '../lib/supabase'

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
