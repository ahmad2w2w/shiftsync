import { supabase } from '../lib/supabase'
import type { ClockRecord } from '../types/database'
import { format, startOfMonth, endOfMonth, startOfWeek, endOfWeek } from 'date-fns'
import { isWithinRadius } from '../lib/geo'
import type { Location } from '../types/database'

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

export interface ClockInOptions {
  note?: string
  lat?: number
  lng?: number
  locationId?: string
}

export async function clockIn(
  userId: string,
  organizationId: string,
  options?: ClockInOptions,
  gpsCheck?: { location: Location; radiusMeters: number }
): Promise<ClockRecord> {
  const active = await getActiveClock(userId)
  if (active) throw new Error('Je bent al ingeklokt')

  if (gpsCheck && options?.lat != null && options?.lng != null) {
    const { location, radiusMeters } = gpsCheck
    const radius = location.radius_meters || radiusMeters
    if (!isWithinRadius(options.lat, options.lng, Number(location.latitude), Number(location.longitude), radius)) {
      throw new Error(`Je moet binnen ${radius} meter van ${location.name} zijn om in te klokken.`)
    }
  }

  const { data, error } = await supabase
    .from('clock_records')
    .insert({
      user_id: userId,
      organization_id: organizationId,
      note: options?.note ?? null,
      clock_in_lat: options?.lat ?? null,
      clock_in_lng: options?.lng ?? null,
      location_id: options?.locationId ?? gpsCheck?.location.id ?? null,
    })
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

export async function startBreak(recordId: string): Promise<ClockRecord> {
  const { data, error } = await supabase
    .from('clock_records')
    .update({ break_started_at: new Date().toISOString() })
    .eq('id', recordId)
    .is('break_started_at', null)
    .select()
    .single()

  if (error) throw error
  return data as ClockRecord
}

export async function endBreak(recordId: string): Promise<ClockRecord> {
  const { data: current, error: fetchErr } = await supabase
    .from('clock_records')
    .select('break_started_at, total_break_minutes')
    .eq('id', recordId)
    .single()

  if (fetchErr) throw fetchErr
  if (!current?.break_started_at) throw new Error('Geen actieve pauze')

  const extraMinutes = Math.floor(
    (Date.now() - new Date(current.break_started_at).getTime()) / 60000
  )

  const { data, error } = await supabase
    .from('clock_records')
    .update({
      break_started_at: null,
      total_break_minutes: (current.total_break_minutes ?? 0) + extraMinutes,
    })
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

export function isOnBreak(record: ClockRecord): boolean {
  return record.break_started_at != null && !record.clock_out
}
