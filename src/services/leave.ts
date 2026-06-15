import { supabase } from '../lib/supabase'
import type { LeaveRequest, LeaveStatus } from '../types/database'

export async function getLeaveRequests(userId?: string): Promise<LeaveRequest[]> {
  let query = supabase
    .from('leave_requests')
    .select('*, user:users(id, full_name, email), leave_type:leave_types(*)')
    .order('created_at', { ascending: false })

  if (userId) query = query.eq('user_id', userId)

  const { data, error } = await query
  if (error) throw error
  return (data ?? []) as LeaveRequest[]
}

export interface NewLeaveRequest {
  organization_id: string
  user_id: string
  start_date: string
  end_date: string
  reason: string
  leave_type_id?: string | null
  hours?: number | null
}

export async function createLeaveRequest(request: NewLeaveRequest): Promise<LeaveRequest> {
  const { data, error } = await supabase
    .from('leave_requests')
    .insert({
      organization_id: request.organization_id,
      user_id: request.user_id,
      start_date: request.start_date,
      end_date: request.end_date,
      reason: request.reason,
      leave_type_id: request.leave_type_id ?? null,
      hours: request.hours ?? null,
      status: 'pending' as LeaveStatus,
    })
    .select('*, leave_type:leave_types(*)')
    .single()

  if (error) throw error
  return data as LeaveRequest
}

export async function updateLeaveStatus(
  id: string,
  status: 'approved' | 'rejected',
  manager_note?: string
): Promise<LeaveRequest> {
  const { data, error } = await supabase
    .from('leave_requests')
    .update({ status, manager_note: manager_note ?? null })
    .eq('id', id)
    .select()
    .single()

  if (error) throw error
  return data as LeaveRequest
}

export async function getPendingLeaveCount(): Promise<number> {
  const { count, error } = await supabase
    .from('leave_requests')
    .select('*', { count: 'exact', head: true })
    .eq('status', 'pending')

  if (error) throw error
  return count ?? 0
}
