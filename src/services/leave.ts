import { supabase } from '../lib/supabase'
import type { LeaveRequest, LeaveStatus } from '../types/database'

export async function getLeaveRequests(userId?: string): Promise<LeaveRequest[]> {
  let query = supabase
    .from('leave_requests')
    .select('*, user:users(id, full_name, email)')
    .order('created_at', { ascending: false })

  if (userId) query = query.eq('user_id', userId)

  const { data, error } = await query
  if (error) throw error
  return (data ?? []) as LeaveRequest[]
}

export async function createLeaveRequest(
  request: Omit<LeaveRequest, 'id' | 'status' | 'manager_note' | 'created_at' | 'user'>
): Promise<LeaveRequest> {
  const { data, error } = await supabase
    .from('leave_requests')
    .insert({ ...request, status: 'pending' as LeaveStatus })
    .select()
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
