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

export const DEFAULT_SHIFT_START = '16:00'
export const DEFAULT_SHIFT_END = '21:00'

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

const POSITION_COLOR_MAP: Record<string, { bg: string; text: string; border: string; accent: string }> = {
  Bediening: { bg: 'rgba(59,130,246,0.12)', text: '#2563EB', border: 'rgba(59,130,246,0.28)', accent: '#3B82F6' },
  Keuken:    { bg: 'rgba(249,115,22,0.12)', text: '#EA580C', border: 'rgba(249,115,22,0.28)', accent: '#F97316' },
  Bezorging: { bg: 'rgba(245,158,11,0.12)', text: '#D97706', border: 'rgba(245,158,11,0.28)', accent: '#F59E0B' },
  Kassa:     { bg: 'rgba(16,185,129,0.12)', text: '#059669', border: 'rgba(16,185,129,0.28)', accent: '#10B981' },
  Manager:   { bg: 'rgba(139,92,246,0.12)', text: '#7C3AED', border: 'rgba(139,92,246,0.28)', accent: '#8B5CF6' },
}

const DEFAULT_POSITION_COLOR = { bg: 'rgba(59,130,246,0.12)', text: '#2563EB', border: 'rgba(59,130,246,0.28)', accent: '#3B82F6' }

/** Convert a hex color (#RRGGBB) into the tinted swatch shape used for positions. */
export function colorObjFromHex(hex: string) {
  const m = /^#?([0-9a-f]{6})$/i.exec(hex.trim())
  if (!m) return DEFAULT_POSITION_COLOR
  const int = parseInt(m[1], 16)
  const r = (int >> 16) & 255
  const g = (int >> 8) & 255
  const b = int & 255
  return {
    bg: `rgba(${r},${g},${b},0.12)`,
    text: hex,
    border: `rgba(${r},${g},${b},0.28)`,
    accent: hex,
  }
}

/** Colors registered at runtime from the org's configured positions. */
const runtimePositionColors: Record<string, { bg: string; text: string; border: string; accent: string }> = {}

export function registerPositionColors(positions: { name: string; color: string }[]) {
  for (const p of positions) {
    if (p?.name && p?.color) runtimePositionColors[p.name] = colorObjFromHex(p.color)
  }
}

export function getPositionColor(position: string) {
  return runtimePositionColors[position] ?? POSITION_COLOR_MAP[position] ?? DEFAULT_POSITION_COLOR
}

export const cn = (...classes: (string | false | undefined | null)[]) =>
  classes.filter(Boolean).join(' ')

/** Count weekdays (Mon–Fri) between two ISO dates, inclusive. */
export function countWeekdays(startISO: string, endISO: string): number {
  const start = new Date(startISO + 'T12:00:00')
  const end = new Date(endISO + 'T12:00:00')
  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime()) || end < start) return 0
  let count = 0
  const d = new Date(start)
  while (d <= end) {
    const day = d.getDay()
    if (day !== 0 && day !== 6) count++
    d.setDate(d.getDate() + 1)
  }
  return count
}

/** Estimate leave hours from a date range (weekdays × hours/day). */
export function estimateLeaveHours(startISO: string, endISO: string, hoursPerDay = 8): number {
  return countWeekdays(startISO, endISO) * hoursPerDay
}
