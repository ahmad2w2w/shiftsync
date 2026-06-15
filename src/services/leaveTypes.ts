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

/** Set the starting balance for a user/type/year (admin only). */
export async function setLeaveBalance(
  organizationId: string,
  userId: string,
  leaveTypeId: string,
  year: number,
  balanceHours: number
): Promise<void> {
  const { error } = await supabase
    .from('leave_balances')
    .upsert(
      { organization_id: organizationId, user_id: userId, leave_type_id: leaveTypeId, year, balance_hours: balanceHours },
      { onConflict: 'user_id,leave_type_id,year' }
    )
  if (error) throw error
}

/** Add (or subtract, with a negative delta) used hours against a balance. Auto-creates the row. */
export async function addLeaveUsage(
  organizationId: string,
  userId: string,
  leaveTypeId: string,
  year: number,
  deltaHours: number
): Promise<void> {
  const { data: existing } = await supabase
    .from('leave_balances')
    .select('id, used_hours')
    .eq('user_id', userId)
    .eq('leave_type_id', leaveTypeId)
    .eq('year', year)
    .maybeSingle()

  if (existing) {
    const next = Math.max(0, Number(existing.used_hours ?? 0) + deltaHours)
    const { error } = await supabase.from('leave_balances').update({ used_hours: next }).eq('id', existing.id)
    if (error) throw error
    return
  }

  const { data: lt } = await supabase
    .from('leave_types')
    .select('default_balance_hours')
    .eq('id', leaveTypeId)
    .maybeSingle()

  const { error } = await supabase.from('leave_balances').insert({
    organization_id: organizationId,
    user_id: userId,
    leave_type_id: leaveTypeId,
    year,
    balance_hours: Number(lt?.default_balance_hours ?? 0),
    used_hours: Math.max(0, deltaHours),
  })
  if (error) throw error
}
