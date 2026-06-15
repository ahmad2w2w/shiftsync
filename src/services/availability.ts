import { supabase } from '../lib/supabase'
import type { Availability } from '../types/database'
import { format } from 'date-fns'

export async function getAvailabilityForPeriod(
  userId: string,
  periodStart: Date,
  periodEnd: Date
): Promise<Availability[]> {
  const { data, error } = await supabase
    .from('availability')
    .select('*')
    .eq('user_id', userId)
    .gte('date', format(periodStart, 'yyyy-MM-dd'))
    .lte('date', format(periodEnd, 'yyyy-MM-dd'))
    .order('date')

  if (error) throw error
  return (data ?? []) as Availability[]
}

export async function getAllAvailabilityForPeriod(
  periodStart: Date,
  periodEnd: Date
): Promise<(Availability & { users?: { full_name: string } })[]> {
  const { data, error } = await supabase
    .from('availability')
    .select('*, users(full_name)')
    .gte('date', format(periodStart, 'yyyy-MM-dd'))
    .lte('date', format(periodEnd, 'yyyy-MM-dd'))
    .order('date')

  if (error) throw error
  return data ?? []
}

export const getAvailabilityForWeek = getAvailabilityForPeriod
export const getAllAvailabilityForWeek = getAllAvailabilityForPeriod

export async function upsertAvailability(
  entry: Pick<Availability, 'user_id' | 'date' | 'available_from' | 'available_until' | 'note' | 'organization_id'>
): Promise<Availability> {
  const { data, error } = await supabase
    .from('availability')
    .upsert(entry, { onConflict: 'user_id,date' })
    .select()
    .single()

  if (error) throw error
  return data as Availability
}

export async function deleteAvailability(id: string): Promise<void> {
  const { error } = await supabase.from('availability').delete().eq('id', id)
  if (error) throw error
}

export async function setDayAvailable(
  userId: string,
  date: string,
  organizationId: string
): Promise<Availability> {
  return upsertAvailability({
    user_id: userId,
    date,
    organization_id: organizationId,
    available_from: null,
    available_until: null,
    note: null,
  })
}

export async function removeDayAvailable(userId: string, date: string): Promise<void> {
  const { error } = await supabase
    .from('availability')
    .delete()
    .eq('user_id', userId)
    .eq('date', date)

  if (error) throw error
}

/**
 * Apply a recurring weekly availability pattern across a period.
 * `weekdays` uses JS getDay() values (0=Sunday … 6=Saturday).
 * Only dates from today onward are written.
 */
export async function applyWeeklyPattern(params: {
  userId: string
  organizationId: string
  periodStart: Date
  periodEnd: Date
  weekdays: number[]
  from?: string | null
  until?: string | null
}): Promise<number> {
  const { userId, organizationId, periodStart, periodEnd, weekdays, from = null, until = null } = params
  const set = new Set(weekdays)
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const rows: Pick<Availability, 'user_id' | 'date' | 'available_from' | 'available_until' | 'note' | 'organization_id'>[] = []
  const d = new Date(periodStart)
  d.setHours(12, 0, 0, 0)
  while (d <= periodEnd) {
    if (set.has(d.getDay()) && d >= today) {
      rows.push({
        user_id: userId,
        organization_id: organizationId,
        date: format(d, 'yyyy-MM-dd'),
        available_from: from,
        available_until: until,
        note: null,
      })
    }
    d.setDate(d.getDate() + 1)
  }

  if (rows.length === 0) return 0
  const { error } = await supabase.from('availability').upsert(rows, { onConflict: 'user_id,date' })
  if (error) throw error
  return rows.length
}
