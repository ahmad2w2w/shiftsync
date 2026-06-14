export type UserRole = 'admin' | 'employee'
export type LeaveStatus = 'pending' | 'approved' | 'rejected'
export type ShiftStatus = 'scheduled' | 'completed' | 'cancelled'
export type OrgPlan = 'trial' | 'active'

/** Legacy DB values map to active subscription state. */
export function normalizeOrgPlan(raw: string | undefined | null): OrgPlan {
  if (raw === 'active' || raw === 'pro' || raw === 'business') return 'active'
  return 'trial'
}

export const PRICE_PER_EMPLOYEE = 3

export const PRODUCT = {
  name: 'ShiftSync',
  label: 'ShiftSync',
  pricePerEmployee: PRICE_PER_EMPLOYEE,
  priceLabel: `€${PRICE_PER_EMPLOYEE}`,
  period: 'per medewerker / maand',
  features: [
    'Onbeperkt medewerkers (betaal per persoon)',
    'Roosterplanning & maandplanner',
    'Tijdregistratie met pauzes',
    'GPS-inklokken op locatie',
    'Verlof, ziekmelding & diensten ruilen',
    'PDF & Excel export',
    'E-mailnotificaties',
    'Rapportages & loonkosten',
  ],
} as const
export type SickStatus = 'active' | 'resolved'
export type ShiftSwapStatus = 'offered' | 'accepted' | 'approved' | 'rejected' | 'cancelled'

export interface Organization {
  id: string
  name: string
  slug: string | null
  plan: OrgPlan
  stripe_customer_id: string | null
  stripe_subscription_id: string | null
  max_employees: number
  gps_enabled?: boolean
  gps_radius_meters?: number
  created_at: string
}

export interface User {
  id: string
  organization_id: string | null
  full_name: string
  email: string
  role: UserRole
  hourly_rate: number
  primary_position?: string
  avatar_url?: string | null
  created_at: string
}

export interface Availability {
  id: string
  organization_id: string
  user_id: string
  date: string
  available_from: string | null
  available_until: string | null
  note: string | null
  created_at: string
}

export interface Shift {
  id: string
  organization_id: string
  user_id: string | null
  date: string
  start_time: string
  end_time: string
  position: string
  status: ShiftStatus
  published: boolean
  template_id: string | null
  slot_index: number
  created_at: string
  user?: User | null
}

export interface ShiftTemplate {
  id: string
  organization_id: string
  day_of_week: number
  position: string
  start_time: string
  end_time: string
  required_count: number
  label: string | null
  created_at: string
}

export interface ScheduleMonth {
  id: string
  organization_id: string
  month_key: string
  published_at: string | null
  published_by: string | null
  max_hours_per_employee: number
  created_at: string
}

export interface ClockRecord {
  id: string
  organization_id: string
  user_id: string
  clock_in: string
  clock_out: string | null
  total_hours: number | null
  note: string | null
  break_started_at?: string | null
  total_break_minutes?: number
  clock_in_lat?: number | null
  clock_in_lng?: number | null
  clock_out_lat?: number | null
  clock_out_lng?: number | null
  location_id?: string | null
  created_at: string
  user?: User
}

export interface LeaveRequest {
  id: string
  organization_id: string
  user_id: string
  start_date: string
  end_date: string
  reason: string
  status: LeaveStatus
  manager_note: string | null
  created_at: string
  user?: User
}

export interface Location {
  id: string
  organization_id: string
  name: string
  address: string | null
  latitude: number
  longitude: number
  radius_meters: number
  is_primary: boolean
  created_at: string
}

export interface SickReport {
  id: string
  organization_id: string
  user_id: string
  start_date: string
  end_date: string | null
  note: string | null
  status: SickStatus
  created_at: string
  user?: User
}

export interface ShiftSwap {
  id: string
  organization_id: string
  shift_id: string
  offered_by: string
  accepted_by: string | null
  status: ShiftSwapStatus
  manager_note: string | null
  created_at: string
  updated_at: string
  shift?: Shift
  offerer?: User
  accepter?: User
}

