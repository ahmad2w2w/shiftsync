import { supabase } from '../lib/supabase'
import { updateShift } from './shifts'
import type { ShiftSwap, ShiftSwapStatus } from '../types/database'

const SWAP_SELECT = '*, shift:shifts(id, date, start_time, end_time, position, user_id, published)'

export async function getShiftSwaps(options?: {
  userId?: string
  status?: ShiftSwapStatus | ShiftSwapStatus[]
}): Promise<ShiftSwap[]> {
  let query = supabase.from('shift_swaps').select(SWAP_SELECT).order('created_at', { ascending: false })

  if (options?.status) {
    const statuses = Array.isArray(options.status) ? options.status : [options.status]
    query = query.in('status', statuses)
  }

  const { data, error } = await query
  if (error) throw error

  let rows = (data ?? []) as ShiftSwap[]
  if (options?.userId) {
    const uid = options.userId
    rows = rows.filter((s) => s.offered_by === uid || s.accepted_by === uid)
  }
  return rows
}

export async function getOpenSwapCount(): Promise<number> {
  const { count, error } = await supabase
    .from('shift_swaps')
    .select('*', { count: 'exact', head: true })
    .in('status', ['offered', 'accepted'])

  if (error) throw error
  return count ?? 0
}

export async function offerShiftSwap(
  shiftId: string,
  organizationId: string,
  offeredBy: string
): Promise<ShiftSwap> {
  const { data, error } = await supabase
    .from('shift_swaps')
    .insert({
      shift_id: shiftId,
      organization_id: organizationId,
      offered_by: offeredBy,
      status: 'offered',
    })
    .select(SWAP_SELECT)
    .single()

  if (error) throw error
  return data as ShiftSwap
}

export async function acceptShiftSwap(swapId: string, userId: string): Promise<ShiftSwap> {
  const { data, error } = await supabase
    .from('shift_swaps')
    .update({
      accepted_by: userId,
      status: 'accepted',
      updated_at: new Date().toISOString(),
    })
    .eq('id', swapId)
    .eq('status', 'offered')
    .select(SWAP_SELECT)
    .single()

  if (error) throw error
  return data as ShiftSwap
}

export async function approveShiftSwap(swapId: string): Promise<ShiftSwap> {
  const { data: swap, error: fetchErr } = await supabase
    .from('shift_swaps')
    .select('*')
    .eq('id', swapId)
    .single()

  if (fetchErr) throw fetchErr
  if (!swap.accepted_by) throw new Error('Nog geen medewerker die deze dienst heeft geaccepteerd')

  await updateShift(swap.shift_id, { user_id: swap.accepted_by })

  const { data, error } = await supabase
    .from('shift_swaps')
    .update({ status: 'approved', updated_at: new Date().toISOString() })
    .eq('id', swapId)
    .select(SWAP_SELECT)
    .single()

  if (error) throw error
  return data as ShiftSwap
}

export async function rejectShiftSwap(swapId: string, managerNote?: string): Promise<ShiftSwap> {
  const { data, error } = await supabase
    .from('shift_swaps')
    .update({
      status: 'rejected',
      manager_note: managerNote ?? null,
      updated_at: new Date().toISOString(),
    })
    .eq('id', swapId)
    .select(SWAP_SELECT)
    .single()

  if (error) throw error
  return data as ShiftSwap
}

export async function cancelShiftSwap(swapId: string): Promise<ShiftSwap> {
  const { data, error } = await supabase
    .from('shift_swaps')
    .update({ status: 'cancelled', updated_at: new Date().toISOString() })
    .eq('id', swapId)
    .in('status', ['offered', 'accepted'])
    .select(SWAP_SELECT)
    .single()

  if (error) throw error
  return data as ShiftSwap
}
