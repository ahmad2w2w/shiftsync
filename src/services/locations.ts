import { supabase } from '../lib/supabase'
import type { Location } from '../types/database'

export async function getLocations(organizationId: string): Promise<Location[]> {
  const { data, error } = await supabase
    .from('locations')
    .select('*')
    .eq('organization_id', organizationId)
    .order('is_primary', { ascending: false })
    .order('name')

  if (error) throw error
  return (data ?? []) as Location[]
}

export async function getPrimaryLocation(organizationId: string): Promise<Location | null> {
  const { data, error } = await supabase
    .from('locations')
    .select('*')
    .eq('organization_id', organizationId)
    .order('is_primary', { ascending: false })
    .limit(1)
    .maybeSingle()

  if (error) throw error
  return data as Location | null
}

export async function createLocation(
  location: Omit<Location, 'id' | 'created_at'>
): Promise<Location> {
  if (location.is_primary) {
    await supabase
      .from('locations')
      .update({ is_primary: false })
      .eq('organization_id', location.organization_id)
  }

  const { data, error } = await supabase.from('locations').insert(location).select().single()
  if (error) throw error
  return data as Location
}

export async function updateLocation(
  id: string,
  updates: Partial<Omit<Location, 'id' | 'organization_id' | 'created_at'>>
): Promise<Location> {
  if (updates.is_primary) {
    const { data: loc } = await supabase.from('locations').select('organization_id').eq('id', id).single()
    if (loc) {
      await supabase
        .from('locations')
        .update({ is_primary: false })
        .eq('organization_id', loc.organization_id)
        .neq('id', id)
    }
  }

  const { data, error } = await supabase.from('locations').update(updates).eq('id', id).select().single()
  if (error) throw error
  return data as Location
}

export async function deleteLocation(id: string): Promise<void> {
  const { error } = await supabase.from('locations').delete().eq('id', id)
  if (error) throw error
}

export async function updateOrganizationGps(
  organizationId: string,
  settings: { gps_enabled?: boolean; gps_radius_meters?: number }
): Promise<void> {
  const { error } = await supabase.from('organizations').update(settings).eq('id', organizationId)
  if (error) throw error
}
