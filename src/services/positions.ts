import { supabase } from '../lib/supabase'
import type { Position } from '../types/database'

export async function getPositions(): Promise<Position[]> {
  const { data, error } = await supabase
    .from('positions')
    .select('*')
    .order('sort_order')
    .order('name')
  if (error) throw error
  return (data ?? []) as Position[]
}

export async function createPosition(
  organizationId: string,
  name: string,
  color: string,
  departmentId?: string | null
): Promise<Position> {
  const { data, error } = await supabase
    .from('positions')
    .insert({ organization_id: organizationId, name, color, department_id: departmentId ?? null })
    .select()
    .single()
  if (error) throw error
  return data as Position
}

export async function updatePosition(
  id: string,
  updates: Partial<Pick<Position, 'name' | 'color' | 'department_id' | 'sort_order'>>
): Promise<Position> {
  const { data, error } = await supabase.from('positions').update(updates).eq('id', id).select().single()
  if (error) throw error
  return data as Position
}

export async function deletePosition(id: string): Promise<void> {
  const { error } = await supabase.from('positions').delete().eq('id', id)
  if (error) throw error
}
