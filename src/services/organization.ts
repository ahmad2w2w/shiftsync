import { supabase } from '../lib/supabase'

export async function updateOrganizationName(organizationId: string, name: string): Promise<void> {
  const { error } = await supabase.from('organizations').update({ name }).eq('id', organizationId)
  if (error) throw error
}
