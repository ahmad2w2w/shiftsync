import { supabase } from '../lib/supabase'
import type { Organization } from '../types/database'

export async function getOrganization(id: string): Promise<Organization> {
  const { data, error } = await supabase
    .from('organizations')
    .select('*')
    .eq('id', id)
    .single()

  if (error) throw error
  return data as Organization
}

export async function createOrganization(name: string): Promise<Organization> {
  const { data, error } = await supabase.rpc('create_organization', { org_name: name })
  if (error) throw error
  return data as Organization
}

export async function updateOrganization(
  id: string,
  updates: Partial<Pick<Organization, 'name' | 'slug'>>
): Promise<Organization> {
  const { data, error } = await supabase
    .from('organizations')
    .update(updates)
    .eq('id', id)
    .select()
    .single()

  if (error) throw error
  return data as Organization
}
