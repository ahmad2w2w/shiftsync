export type UserRole = 'admin' | 'employee'
export type LeaveStatus = 'pending' | 'approved' | 'rejected'
export type ShiftStatus = 'scheduled' | 'completed' | 'cancelled'
export type OrgPlan = 'free' | 'pro' | 'business'

export interface Organization {
  id: string
  name: string
  slug: string | null
  plan: OrgPlan
  stripe_customer_id: string | null
  stripe_subscription_id: string | null
  max_employees: number
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

export const PLAN_LIMITS: Record<OrgPlan, { maxEmployees: number; label: string; price: string }> = {
  free: { maxEmployees: 5, label: 'Free', price: '€0' },
  pro: { maxEmployees: 25, label: 'Pro', price: '€29' },
  business: { maxEmployees: Infinity, label: 'Business', price: '€79' },
}
