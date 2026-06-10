import { supabase } from '../lib/supabase'
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
  updates: Partial<Pick<User, 'full_name' | 'hourly_rate' | 'role' | 'primary_position'>>
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
  password: string
  full_name: string
  hourly_rate?: number
  organization_id: string
}): Promise<User> {
  const { data: authData, error: authError } = await supabase.auth.signUp({
    email: params.email,
    password: params.password,
    options: {
      data: {
        full_name: params.full_name,
        role: 'employee',
        organization_id: params.organization_id,
      },
    },
  })

  if (authError) throw authError
  if (!authData.user) throw new Error('Gebruiker kon niet worden aangemaakt')

  const { data, error } = await supabase
    .from('users')
    .update({
      full_name: params.full_name,
      hourly_rate: params.hourly_rate ?? 0,
      role: 'employee' as UserRole,
      organization_id: params.organization_id,
    })
    .eq('id', authData.user.id)
    .select()
    .single()

  if (error) throw error
  return data as User
}
