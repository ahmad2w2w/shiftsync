import { supabase } from '../lib/supabase'
import type { LeaveType, LeaveBalance } from '../types/database'

export async function getLeaveTypes(): Promise<LeaveType[]> {
  const { data, error } = await supabase.from('leave_types').select('*').order('name')
  if (error) throw error
  return (data ?? []) as LeaveType[]
}

export async function createLeaveType(
  organizationId: string,
  values: Pick<LeaveType, 'name' | 'color' | 'paid' | 'default_balance_hours'>
): Promise<LeaveType> {
  const { data, error } = await supabase
    .from('leave_types')
    .insert({ organization_id: organizationId, ...values })
    .select()
    .single()
  if (error) throw error
  return data as LeaveType
}

export async function updateLeaveType(
  id: string,
  updates: Partial<Pick<LeaveType, 'name' | 'color' | 'paid' | 'default_balance_hours'>>
): Promise<LeaveType> {
  const { data, error } = await supabase.from('leave_types').update(updates).eq('id', id).select().single()
  if (error) throw error
  return data as LeaveType
}

export async function deleteLeaveType(id: string): Promise<void> {
  const { error } = await supabase.from('leave_types').delete().eq('id', id)
  if (error) throw error
}

export async function getLeaveBalances(year: number, userId?: string): Promise<LeaveBalance[]> {
  let query = supabase
    .from('leave_balances')
    .select('*, leave_type:leave_types(*), user:users(id, full_name, email)')
    .eq('year', year)
  if (userId) query = query.eq('user_id', userId)
  const { data, error } = await query
  if (error) throw error
  return (data ?? []) as LeaveBalance[]
}
