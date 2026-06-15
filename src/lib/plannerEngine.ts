import type { Shift, User, Availability, LeaveRequest } from '../types/database'

export interface PlannerWarning {
  type: 'unavailable' | 'leave' | 'overlap' | 'hours'
  message: string
}

export function shiftHours(start: string, end: string): number {
  const toMinutes = (t: string) => {
    const [h, m] = t.slice(0, 5).split(':').map(Number)
    return h * 60 + m
  }
  const startMin = toMinutes(start)
  let endMin = toMinutes(end)
  // Handle overnight shifts (e.g. 22:00 → 02:00)
  if (endMin <= startMin) endMin += 24 * 60
  return (endMin - startMin) / 60
}

export function monthlyHoursForUser(userId: string, shifts: Shift[]): number {
  return shifts
    .filter((s) => s.user_id === userId)
    .reduce((sum, s) => sum + shiftHours(s.start_time, s.end_time), 0)
}

function timesOverlap(aStart: string, aEnd: string, bStart: string, bEnd: string): boolean {
  const toM = (t: string) => {
    const [h, m] = t.slice(0, 5).split(':').map(Number)
    return h * 60 + m
  }
  const as = toM(aStart), ae = toM(aEnd), bs = toM(bStart), be = toM(bEnd)
  return as < be && bs < ae
}

/** Average weeks per month, used to derive a monthly limit from a weekly contract. */
const WEEKS_PER_MONTH = 4.33

/** Resolve the monthly hour cap: prefer the employee's weekly contract, else the org default. */
export function monthlyLimitFor(contractHoursPerWeek: number | null | undefined, fallback: number): number {
  if (contractHoursPerWeek != null && contractHoursPerWeek > 0) {
    return Math.round(contractHoursPerWeek * WEEKS_PER_MONTH)
  }
  return fallback
}

export function getWarnings(
  userId: string,
  slot: Pick<Shift, 'date' | 'start_time' | 'end_time' | 'id'>,
  availability: Availability[],
  leave: LeaveRequest[],
  allShifts: Shift[],
  maxHours: number,
  contractHoursPerWeek?: number | null
): PlannerWarning[] {
  const warnings: PlannerWarning[] = []

  const avail = availability.some((a) => a.user_id === userId && a.date === slot.date)
  if (!avail) {
    warnings.push({ type: 'unavailable', message: 'Niet beschikbaar op deze dag' })
  }

  const onLeave = leave.some(
    (l) =>
      l.user_id === userId &&
      l.status === 'approved' &&
      slot.date >= l.start_date &&
      slot.date <= l.end_date
  )
  if (onLeave) {
    warnings.push({ type: 'leave', message: 'Goedgekeurd verlof' })
  }

  const overlap = allShifts.some(
    (s) =>
      s.user_id === userId &&
      s.id !== slot.id &&
      s.date === slot.date &&
      timesOverlap(s.start_time, s.end_time, slot.start_time, slot.end_time)
  )
  if (overlap) {
    warnings.push({ type: 'overlap', message: 'Al ingepland op hetzelfde tijdstip' })
  }

  const effectiveMax = monthlyLimitFor(contractHoursPerWeek, maxHours)
  const projected =
    monthlyHoursForUser(userId, allShifts) + shiftHours(slot.start_time, slot.end_time)
  if (projected > effectiveMax) {
    warnings.push({
      type: 'hours',
      message: `Boven ${contractHoursPerWeek ? 'contract' : 'maand'}limiet (${projected.toFixed(0)}u / ${effectiveMax}u)`,
    })
  }

  return warnings
}

export interface RankedEmployee {
  user: User
  score: number
  reasons: string[]
  warnings: PlannerWarning[]
}

export function rankEmployeesForSlot(
  slot: Pick<Shift, 'date' | 'start_time' | 'end_time' | 'position' | 'id'>,
  employees: User[],
  availability: Availability[],
  leave: LeaveRequest[],
  allShifts: Shift[],
  maxHours: number
): RankedEmployee[] {
  return employees
    .map((user) => {
      const warnings = getWarnings(user.id, slot, availability, leave, allShifts, maxHours, user.contract_hours_per_week)
      const hours = monthlyHoursForUser(user.id, allShifts)
      const positionMatch =
        (user.primary_position ?? '').toLowerCase() === slot.position.toLowerCase()

      const isAvailable = !warnings.some((w) => w.type === 'unavailable')
      const isOnLeave = warnings.some((w) => w.type === 'leave')
      const hasOverlap = warnings.some((w) => w.type === 'overlap')

      let score = 0
      const reasons: string[] = []

      if (isAvailable) { score += 1000; reasons.push('Beschikbaar') }
      if (positionMatch) { score += 500; reasons.push('Juiste functie') }
      if (!isOnLeave) score += 300
      if (!hasOverlap) score += 200
      if (warnings.length === 0) score += 100
      score -= hours * 10
      reasons.push(`${hours.toFixed(0)}u deze maand`)

      return { user, score, reasons, warnings }
    })
    .sort((a, b) => b.score - a.score)
}

export const DAY_NAMES = ['Zo', 'Ma', 'Di', 'Wo', 'Do', 'Vr', 'Za']
