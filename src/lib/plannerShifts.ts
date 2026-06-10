import type { Shift, User } from '../types/database'

/** Vul user-relatie aan voor weergave na een assign-update */
export function enrichShift(shift: Shift, employees: User[]): Shift {
  if (!shift.user_id) {
    return { ...shift, user: null }
  }
  const user =
    (shift.user as User | undefined) ?? employees.find((e) => e.id === shift.user_id)
  return { ...shift, user: user ?? null }
}

export function patchShiftInList(
  shifts: Shift[],
  updated: Shift,
  employees: User[]
): Shift[] {
  const enriched = enrichShift(updated, employees)
  return shifts.map((s) => (s.id === enriched.id ? enriched : s))
}
