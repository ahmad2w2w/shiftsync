import {
  format,
  parseISO,
  startOfWeek,
  endOfWeek,
  startOfMonth,
  endOfMonth,
  addWeeks,
  subWeeks,
  addMonths,
  subMonths,
  eachDayOfInterval,
  isSameDay,
  isSameMonth,
} from 'date-fns'
import { nl } from 'date-fns/locale'

export const formatDate = (date: string | Date, pattern = 'd MMM yyyy') =>
  format(typeof date === 'string' ? parseISO(date) : date, pattern, { locale: nl })

export const formatTime = (time: string) => time.slice(0, 5)

export const formatDateTime = (iso: string) =>
  format(parseISO(iso), 'd MMM yyyy HH:mm', { locale: nl })

export const getWeekRange = (anchor: Date) => {
  const start = startOfWeek(anchor, { weekStartsOn: 1 })
  const end = endOfWeek(anchor, { weekStartsOn: 1 })
  return { start, end, days: eachDayOfInterval({ start, end }) }
}

export const weekLabel = (anchor: Date) => {
  const { start, end } = getWeekRange(anchor)
  return `${format(start, 'd MMM', { locale: nl })} – ${format(end, 'd MMM yyyy', { locale: nl })}`
}

export const getMonthRange = (anchor: Date) => {
  const start = startOfMonth(anchor)
  const end = endOfMonth(anchor)
  return { start, end, days: eachDayOfInterval({ start, end }) }
}

export const getCalendarGrid = (anchor: Date) => {
  const { start: monthStart, end: monthEnd } = getMonthRange(anchor)
  const gridStart = startOfWeek(monthStart, { weekStartsOn: 1 })
  const gridEnd = endOfWeek(monthEnd, { weekStartsOn: 1 })
  return eachDayOfInterval({ start: gridStart, end: gridEnd })
}

export const monthLabel = (anchor: Date) =>
  format(anchor, 'MMMM yyyy', { locale: nl })

export {
  addWeeks,
  subWeeks,
  addMonths,
  subMonths,
  isSameDay,
  isSameMonth,
  format,
  parseISO,
  startOfWeek,
  startOfMonth,
}

export const leaveStatusLabel: Record<string, string> = {
  pending: 'In behandeling',
  approved: 'Goedgekeurd',
  rejected: 'Afgewezen',
}

export const shiftStatusLabel: Record<string, string> = {
  scheduled: 'Gepland',
  completed: 'Afgerond',
  cancelled: 'Geannuleerd',
}

export const sickStatusLabel: Record<string, string> = {
  active: 'Ziek gemeld',
  resolved: 'Hersteld',
}

export const shiftSwapStatusLabel: Record<string, string> = {
  offered: 'Aangeboden',
  accepted: 'Geaccepteerd',
  approved: 'Goedgekeurd',
  rejected: 'Afgewezen',
  cancelled: 'Geannuleerd',
}

export const DEFAULT_SHIFT_POSITIONS = [
  { value: 'Bediening', label: 'Bediening' },
  { value: 'Keuken', label: 'Keuken' },
  { value: 'Bezorging', label: 'Bezorging' },
  { value: 'Kassa', label: 'Kassa' },
  { value: 'Manager', label: 'Manager' },
]

export const SHIFT_POSITIONS = DEFAULT_SHIFT_POSITIONS
export const DEFAULT_SHIFT_POSITION = 'Bediening'

export const POSITION_STYLES: Record<string, string> = {
  Bediening: 'bg-brand-500/15 text-brand-400 border-brand-500/20',
  Keuken:    'bg-orange-500/15 text-orange-400 border-orange-500/20',
  Bezorging: 'bg-amber-500/15 text-amber-400 border-amber-500/20',
  Kassa:     'bg-emerald-500/15 text-emerald-400 border-emerald-500/20',
  Manager:   'bg-violet-500/15 text-violet-400 border-violet-500/20',
}

export const cn = (...classes: (string | false | undefined | null)[]) =>
  classes.filter(Boolean).join(' ')
