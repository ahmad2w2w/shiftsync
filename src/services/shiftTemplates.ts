import { supabase } from '../lib/supabase'
import type { ShiftTemplate } from '../types/database'

export async function getShiftTemplates(): Promise<ShiftTemplate[]> {
  const { data, error } = await supabase
    .from('shift_templates')
    .select('*')
    .order('day_of_week')
    .order('start_time')

  if (error) throw error
  return (data ?? []) as ShiftTemplate[]
}

export async function createShiftTemplate(
  template: Omit<ShiftTemplate, 'id' | 'created_at'>
): Promise<ShiftTemplate> {
  const { data, error } = await supabase
    .from('shift_templates')
    .insert(template)
    .select()
    .single()

  if (error) throw error
  return data as ShiftTemplate
}

export async function updateShiftTemplate(
  id: string,
  updates: Partial<Omit<ShiftTemplate, 'id' | 'created_at' | 'organization_id'>>
): Promise<ShiftTemplate> {
  const { data, error } = await supabase
    .from('shift_templates')
    .update(updates)
    .eq('id', id)
    .select()
    .single()

  if (error) throw error
  return data as ShiftTemplate
}

export async function deleteShiftTemplate(id: string): Promise<void> {
  const { error } = await supabase.from('shift_templates').delete().eq('id', id)
  if (error) throw error
}
