import { supabase } from '../lib/supabase'
import { invokeEdgeFunction } from '../lib/edgeFunctions'
import type { User, UserRole } from '../types/database'
import type { User as AuthUser } from '@supabase/supabase-js'

export async function getCurrentUserProfile(userId: string): Promise<User | null> {
  const { data, error } = await supabase
    .from('users')
    .select('*')
    .eq('id', userId)
    .single()

  if (error) throw error
  return data as User
}

export async function ensureUserProfile(authUser: AuthUser): Promise<User | null> {
  try {
    return await getCurrentUserProfile(authUser.id)
  } catch {
    const { data, error } = await supabase
      .from('users')
      .insert({
        id: authUser.id,
        email: authUser.email ?? '',
        full_name:
          (authUser.user_metadata?.full_name as string) ??
          authUser.email?.split('@')[0] ??
          'Gebruiker',
        role: (authUser.user_metadata?.role as UserRole) ?? 'employee',
        organization_id: (authUser.user_metadata?.organization_id as string) ?? null,
      })
      .select()
      .single()

    if (error) return null
    return data as User
  }
}

export async function getAllUsers(): Promise<User[]> {
  const { data, error } = await supabase
    .from('users')
    .select('*')
    .order('full_name')

  if (error) throw error
  return (data ?? []) as User[]
}

export async function updateUser(
  id: string,
  updates: Partial<Pick<User, 'full_name' | 'hourly_rate' | 'role' | 'primary_position' | 'avatar_url'>>
): Promise<User> {
  const { data, error } = await supabase
    .from('users')
    .update(updates)
    .eq('id', id)
    .select()
    .single()

  if (error) throw error
  return data as User
}

export async function deleteUser(id: string): Promise<void> {
  const { error } = await supabase.from('users').delete().eq('id', id)
  if (error) throw error
}

export async function createEmployeeAccount(params: {
  email: string
  full_name: string
  hourly_rate?: number
  organization_id: string
}): Promise<void> {
  await invokeEdgeFunction('invite-employee', {
    email: params.email,
    full_name: params.full_name,
    hourly_rate: params.hourly_rate ?? 0,
  })
}

export async function uploadAvatar(userId: string, file: File): Promise<string> {
  const ext = file.name.split('.').pop()?.toLowerCase() || 'jpg'
  const path = `${userId}/avatar.${ext}`
  const { error: uploadError } = await supabase.storage
    .from('avatars')
    .upload(path, file, { upsert: true, contentType: file.type })
  if (uploadError) throw uploadError
  const { data } = supabase.storage.from('avatars').getPublicUrl(path)
  const url = `${data.publicUrl}?t=${Date.now()}`
  await updateUser(userId, { avatar_url: url })
  return url
}

export async function updatePassword(newPassword: string): Promise<void> {
  const { error } = await supabase.auth.updateUser({ password: newPassword })
  if (error) throw error
}
