import { supabase } from '../lib/supabase'
import type { ClockRecord } from '../types/database'
import { format, startOfMonth, endOfMonth, startOfWeek, endOfWeek } from 'date-fns'

export async function getActiveClock(userId: string): Promise<ClockRecord | null> {
  const { data, error } = await supabase
    .from('clock_records')
    .select('*')
    .eq('user_id', userId)
    .is('clock_out', null)
    .maybeSingle()

  if (error) throw error
  return data as ClockRecord | null
}

export async function clockIn(
  userId: string,
  organizationId: string,
  note?: string
): Promise<ClockRecord> {
  const active = await getActiveClock(userId)
  if (active) throw new Error('Je bent al ingeklokt')

  const { data, error } = await supabase
    .from('clock_records')
    .insert({ user_id: userId, organization_id: organizationId, note: note ?? null })
    .select()
    .single()

  if (error) throw error
  return data as ClockRecord
}

export async function clockOut(recordId: string): Promise<ClockRecord> {
  const { data, error } = await supabase
    .from('clock_records')
    .update({ clock_out: new Date().toISOString() })
    .eq('id', recordId)
    .select()
    .single()

  if (error) throw error
  return data as ClockRecord
}

export async function getClockRecords(
  userId: string,
  range: 'week' | 'month',
  anchor: Date
): Promise<ClockRecord[]> {
  const start =
    range === 'week'
      ? format(startOfWeek(anchor, { weekStartsOn: 1 }), "yyyy-MM-dd'T'00:00:00")
      : format(startOfMonth(anchor), "yyyy-MM-dd'T'00:00:00")

  const end =
    range === 'week'
      ? format(endOfWeek(anchor, { weekStartsOn: 1 }), "yyyy-MM-dd'T'23:59:59")
      : format(endOfMonth(anchor), "yyyy-MM-dd'T'23:59:59")

  const { data, error } = await supabase
    .from('clock_records')
    .select('*')
    .eq('user_id', userId)
    .gte('clock_in', start)
    .lte('clock_in', end)
    .order('clock_in', { ascending: false })

  if (error) throw error
  return (data ?? []) as ClockRecord[]
}

export async function getAllClockRecords(limit = 50): Promise<ClockRecord[]> {
  const { data, error } = await supabase
    .from('clock_records')
    .select('*, user:users(id, full_name)')
    .order('clock_in', { ascending: false })
    .limit(limit)

  if (error) throw error
  return (data ?? []) as ClockRecord[]
}

export function sumHours(records: ClockRecord[]): number {
  return records.reduce((sum, r) => sum + (r.total_hours ?? 0), 0)
}
