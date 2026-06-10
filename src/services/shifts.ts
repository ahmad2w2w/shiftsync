import { supabase } from '../lib/supabase'
import type { Shift } from '../types/database'
import { format } from 'date-fns'

export async function getShiftsForPeriod(
  periodStart: Date,
  periodEnd: Date,
  options?: { userId?: string; publishedOnly?: boolean }
): Promise<Shift[]> {
  let query = supabase
    .from('shifts')
    .select('*, user:users(id, full_name, email, primary_position)')
    .gte('date', format(periodStart, 'yyyy-MM-dd'))
    .lte('date', format(periodEnd, 'yyyy-MM-dd'))
    .order('date')
    .order('start_time')

  if (options?.userId) {
    query = query.eq('user_id', options.userId)
  }

  if (options?.publishedOnly) {
    query = query.eq('published', true)
  }

  const { data, error } = await query
  if (error) throw error
  return (data ?? []) as Shift[]
}

export const getShiftsForWeek = getShiftsForPeriod

export async function createShift(
  shift: Omit<Shift, 'id' | 'created_at' | 'user'>
): Promise<Shift> {
  const { published = true, template_id = null, slot_index = 0, ...rest } = shift
  const { data, error } = await supabase
    .from('shifts')
    .insert({ ...rest, published, template_id, slot_index })
    .select()
    .single()

  if (error) throw error
  return data as Shift
}

export async function updateShift(
  id: string,
  updates: Partial<
    Pick<Shift, 'date' | 'start_time' | 'end_time' | 'position' | 'status' | 'user_id' | 'published'>
  >
): Promise<Shift> {
  const { data, error } = await supabase
    .from('shifts')
    .update(updates)
    .eq('id', id)
    .select()
    .single()

  if (error) throw error
  return data as Shift
}

export async function deleteShift(id: string): Promise<void> {
  const { error } = await supabase.from('shifts').delete().eq('id', id)
  if (error) throw error
}

export async function deleteShiftsForPeriod(
  periodStart: Date,
  periodEnd: Date,
  options?: { publishedOnly?: boolean }
): Promise<void> {
  let query = supabase
    .from('shifts')
    .delete()
    .gte('date', format(periodStart, 'yyyy-MM-dd'))
    .lte('date', format(periodEnd, 'yyyy-MM-dd'))

  if (options?.publishedOnly) {
    query = query.eq('published', true)
  }

  const { error } = await query
  if (error) throw error
}

export const deleteShiftsForWeek = deleteShiftsForPeriod

export async function deleteShiftsForEmployeesInPeriod(
  employeeIds: string[],
  periodStart: Date,
  periodEnd: Date
): Promise<void> {
  if (employeeIds.length === 0) return

  const { error } = await supabase
    .from('shifts')
    .delete()
    .in('user_id', employeeIds)
    .gte('date', format(periodStart, 'yyyy-MM-dd'))
    .lte('date', format(periodEnd, 'yyyy-MM-dd'))

  if (error) throw error
}

export async function createShiftsBulk(
  shifts: Omit<Shift, 'id' | 'created_at' | 'user'>[]
): Promise<Shift[]> {
  if (shifts.length === 0) return []
  const { data, error } = await supabase.from('shifts').insert(shifts).select()
  if (error) throw error
  return (data ?? []) as Shift[]
}
