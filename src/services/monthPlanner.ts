import { format, eachDayOfInterval, startOfMonth, endOfMonth } from 'date-fns'
import { supabase } from '../lib/supabase'
import type { Shift, ScheduleMonth } from '../types/database'
import { getShiftTemplates } from './shiftTemplates'

export function monthKey(anchor: Date): string {
  return format(anchor, 'yyyy-MM')
}

export async function getScheduleMonth(anchor: Date): Promise<ScheduleMonth | null> {
  const key = monthKey(anchor)
  const { data, error } = await supabase
    .from('schedule_months')
    .select('*')
    .eq('month_key', key)
    .maybeSingle()

  if (error) throw error
  return data as ScheduleMonth | null
}

export async function getPlannerShifts(
  periodStart: Date,
  periodEnd: Date,
  publishedOnly = false
): Promise<Shift[]> {
  let query = supabase
    .from('shifts')
    .select('*, user:users(id, full_name, email, primary_position)')
    .gte('date', format(periodStart, 'yyyy-MM-dd'))
    .lte('date', format(periodEnd, 'yyyy-MM-dd'))
    .order('date')
    .order('start_time')
    .order('slot_index')

  if (publishedOnly) {
    query = query.eq('published', true).not('user_id', 'is', null)
  }

  const { data, error } = await query
  if (error) throw error
  return (data ?? []) as Shift[]
}

export function previewMonthGeneration(
  monthAnchor: Date,
  templates: { day_of_week: number; required_count: number; position: string }[]
): { total: number; perWeekday: Record<number, number> } {
  const start = startOfMonth(monthAnchor)
  const end = endOfMonth(monthAnchor)
  const days = eachDayOfInterval({ start, end })
  const perWeekday: Record<number, number> = {}
  let total = 0
  for (const day of days) {
    const dow = day.getDay()
    const dayTotal = templates
      .filter((t) => t.day_of_week === dow)
      .reduce((sum, t) => sum + t.required_count, 0)
    perWeekday[dow] = (perWeekday[dow] ?? 0) + dayTotal
    total += dayTotal
  }
  return { total, perWeekday }
}

export async function removeDuplicateOpenShifts(
  periodStart: Date,
  periodEnd: Date
): Promise<number> {
  const { data, error } = await supabase
    .from('shifts')
    .select('id, date, position, start_time, end_time, slot_index, template_id')
    .gte('date', format(periodStart, 'yyyy-MM-dd'))
    .lte('date', format(periodEnd, 'yyyy-MM-dd'))
    .is('user_id', null)
    .order('date')
    .order('position')
    .order('start_time')

  if (error) throw error
  const rows = data ?? []
  const seen = new Map<string, string>()
  const toDelete: string[] = []

  for (const row of rows) {
    const key = `${row.date}|${row.position}|${row.start_time}|${row.end_time}|${row.slot_index ?? 0}|${row.template_id ?? ''}`
    if (seen.has(key)) {
      toDelete.push(row.id)
    } else {
      seen.set(key, row.id)
    }
  }

  if (toDelete.length === 0) return 0

  const { error: delError } = await supabase.from('shifts').delete().in('id', toDelete)
  if (delError) throw delError
  return toDelete.length
}

export async function generateMonthFromTemplates(
  monthAnchor: Date,
  organizationId: string,
  replaceExisting = false
): Promise<number> {
  const start = startOfMonth(monthAnchor)
  const end = endOfMonth(monthAnchor)
  const templates = await getShiftTemplates()
  const days = eachDayOfInterval({ start, end })

  if (replaceExisting) {
    await supabase
      .from('shifts')
      .delete()
      .gte('date', format(start, 'yyyy-MM-dd'))
      .lte('date', format(end, 'yyyy-MM-dd'))
      .is('user_id', null)
    await removeDuplicateOpenShifts(start, end)
  }

  const toInsert: Omit<Shift, 'id' | 'created_at' | 'user'>[] = []

  for (const day of days) {
    const dow = day.getDay()
    const date = format(day, 'yyyy-MM-dd')
    const dayTemplates = templates.filter((t) => t.day_of_week === dow)

    for (const tmpl of dayTemplates) {
      for (let i = 0; i < tmpl.required_count; i++) {
        toInsert.push({
          organization_id: organizationId,
          user_id: null,
          date,
          start_time: tmpl.start_time,
          end_time: tmpl.end_time,
          position: tmpl.position,
          status: 'scheduled',
          published: false,
          template_id: tmpl.id,
          slot_index: i,
        })
      }
    }
  }

  if (toInsert.length === 0) return 0

  const batchSize = 100
  for (let i = 0; i < toInsert.length; i += batchSize) {
    const batch = toInsert.slice(i, i + batchSize)
    const { error } = await supabase.from('shifts').insert(batch)
    if (error) throw error
  }

  return toInsert.length
}

export async function assignShift(slotId: string, userId: string | null): Promise<Shift> {
  const { data, error } = await supabase
    .from('shifts')
    .update({ user_id: userId })
    .eq('id', slotId)
    .select('*, user:users(id, full_name, email, primary_position)')
    .single()

  if (error) throw error
  return data as Shift
}

export async function publishMonth(
  monthAnchor: Date,
  publishedBy: string,
  organizationId: string,
  maxHours = 160
): Promise<void> {
  const start = startOfMonth(monthAnchor)
  const end = endOfMonth(monthAnchor)
  const key = monthKey(monthAnchor)

  const { error: shiftError } = await supabase
    .from('shifts')
    .update({ published: true })
    .gte('date', format(start, 'yyyy-MM-dd'))
    .lte('date', format(end, 'yyyy-MM-dd'))
    .not('user_id', 'is', null)

  if (shiftError) throw shiftError

  const { error: metaError } = await supabase.from('schedule_months').upsert(
    {
      organization_id: organizationId,
      month_key: key,
      published_at: new Date().toISOString(),
      published_by: publishedBy,
      max_hours_per_employee: maxHours,
    },
    { onConflict: 'organization_id,month_key' }
  )

  if (metaError) throw metaError
}

export async function unpublishMonth(monthAnchor: Date): Promise<void> {
  const start = startOfMonth(monthAnchor)
  const end = endOfMonth(monthAnchor)

  await supabase
    .from('shifts')
    .update({ published: false })
    .gte('date', format(start, 'yyyy-MM-dd'))
    .lte('date', format(end, 'yyyy-MM-dd'))

  await supabase
    .from('schedule_months')
    .delete()
    .eq('month_key', monthKey(monthAnchor))
}

export function plannerStats(shifts: Shift[]) {
  const open = shifts.filter((s) => !s.user_id).length
  const filled = shifts.filter((s) => s.user_id).length
  const published = shifts.filter((s) => s.published && s.user_id).length
  return { total: shifts.length, open, filled, published }
}
