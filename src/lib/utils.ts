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
  Bediening: 'bg-blue-50 text-blue-900 border-blue-200',
  Keuken: 'bg-orange-50 text-orange-900 border-orange-200',
  Bezorging: 'bg-amber-50 text-amber-900 border-amber-200',
  Kassa: 'bg-emerald-50 text-emerald-900 border-emerald-200',
  Manager: 'bg-purple-50 text-purple-900 border-purple-200',
}

export const cn = (...classes: (string | false | undefined | null)[]) =>
  classes.filter(Boolean).join(' ')
