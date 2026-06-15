import { supabase } from '../lib/supabase'
import type { Department } from '../types/database'

export async function getDepartments(): Promise<Department[]> {
  const { data, error } = await supabase
    .from('departments')
    .select('*')
    .order('name')
  if (error) throw error
  return (data ?? []) as Department[]
}

export async function createDepartment(organizationId: string, name: string, color: string): Promise<Department> {
  const { data, error } = await supabase
    .from('departments')
    .insert({ organization_id: organizationId, name, color })
    .select()
    .single()
  if (error) throw error
  return data as Department
}

export async function updateDepartment(id: string, updates: Partial<Pick<Department, 'name' | 'color'>>): Promise<Department> {
  const { data, error } = await supabase.from('departments').update(updates).eq('id', id).select().single()
  if (error) throw error
  return data as Department
}

export async function deleteDepartment(id: string): Promise<void> {
  const { error } = await supabase.from('departments').delete().eq('id', id)
  if (error) throw error
}
