import { supabase } from '../lib/supabase'
import type { SickReport } from '../types/database'

export async function getSickReports(userId?: string): Promise<SickReport[]> {
  let query = supabase
    .from('sick_reports')
    .select('*, user:users(id, full_name, email)')
    .order('created_at', { ascending: false })

  if (userId) query = query.eq('user_id', userId)

  const { data, error } = await query
  if (error) throw error
  return (data ?? []) as SickReport[]
}

export async function getActiveSickCount(): Promise<number> {
  const { count, error } = await supabase
    .from('sick_reports')
    .select('*', { count: 'exact', head: true })
    .eq('status', 'active')

  if (error) throw error
  return count ?? 0
}

export async function reportSick(
  payload: Pick<SickReport, 'organization_id' | 'user_id' | 'start_date'> & {
    end_date?: string | null
    note?: string | null
  }
): Promise<SickReport> {
  const { data, error } = await supabase
    .from('sick_reports')
    .insert({
      organization_id: payload.organization_id,
      user_id: payload.user_id,
      start_date: payload.start_date,
      end_date: payload.end_date ?? null,
      note: payload.note ?? null,
      status: 'active',
    })
    .select()
    .single()

  if (error) throw error
  return data as SickReport
}

export async function resolveSickReport(id: string, endDate?: string): Promise<SickReport> {
  const { data, error } = await supabase
    .from('sick_reports')
    .update({
      status: 'resolved',
      end_date: endDate ?? new Date().toISOString().slice(0, 10),
    })
    .eq('id', id)
    .select()
    .single()

  if (error) throw error
  return data as SickReport
}
