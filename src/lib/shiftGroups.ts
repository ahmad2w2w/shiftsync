import type { Shift } from '../types/database'
import { formatTime } from './utils'

export interface ShiftGroup {
  key: string
  position: string
  start_time: string
  end_time: string
  shifts: Shift[]
}

export function groupShiftsBySlot(shifts: Shift[]): ShiftGroup[] {
  const map = new Map<string, Shift[]>()
  for (const s of shifts) {
    const key = `${s.position}|${s.start_time}|${s.end_time}`
    const list = map.get(key) ?? []
    list.push(s)
    map.set(key, list)
  }
  return [...map.entries()]
    .map(([key, list]) => ({
      key,
      position: list[0].position,
      start_time: list[0].start_time,
      end_time: list[0].end_time,
      shifts: list.sort((a, b) => (a.slot_index ?? 0) - (b.slot_index ?? 0)),
    }))
    .sort(
      (a, b) =>
        a.start_time.localeCompare(b.start_time) ||
        a.position.localeCompare(b.position)
    )
}

export function groupLabel(g: ShiftGroup): string {
  return `${g.position} ${formatTime(g.start_time)}–${formatTime(g.end_time)}`
}
