import { useEffect, useState } from 'react'
import { Users } from 'lucide-react'
import type { Shift } from '../../types/database'
import type { Availability } from '../../types/database'
import { createShift, updateShift, deleteShift } from '../../services/shifts'
import { useOrganization } from '../../context/OrganizationContext'
import { Button } from '../ui/Button'
import { Input } from '../ui/Input'
import { Select } from '../ui/Select'
import { formatDayHeader } from '../calendar/MonthCalendar'
import { cn, SHIFT_POSITIONS, DEFAULT_SHIFT_POSITION } from '../../lib/utils'

export const DEFAULT_SHIFT_START = '16:00'
export const DEFAULT_SHIFT_END = '21:00'

export interface DayAssignment {
  user_id: string
  user_name: string
  selected: boolean
  start_time: string
  end_time: string
  position: string
  existingShiftId?: string
}

function buildAssignments(
  date: string,
  availability: (Availability & { users?: { full_name: string } })[],
  shifts: Shift[]
): DayAssignment[] {
  const dayAvail = availability.filter((a) => a.date === date)
  const dayShifts = shifts.filter((s) => s.date === date && s.user_id)

  return dayAvail.map((a) => {
    const shift = dayShifts.find((s) => s.user_id === a.user_id)
    return {
      user_id: a.user_id,
      user_name: a.users?.full_name ?? 'Medewerker',
      selected: !!shift,
      start_time: shift?.start_time.slice(0, 5) ?? DEFAULT_SHIFT_START,
      end_time: shift?.end_time.slice(0, 5) ?? DEFAULT_SHIFT_END,
      position: shift?.position ?? DEFAULT_SHIFT_POSITION,
      existingShiftId: shift?.id,
    }
  })
}

interface DayScheduleEditorProps {
  date: string
  availability: (Availability & { users?: { full_name: string } })[]
  shifts: Shift[]
  onSaved: () => Promise<void>
}

export function DayScheduleEditor({
  date,
  availability,
  shifts,
  onSaved,
}: DayScheduleEditorProps) {
  const { organization } = useOrganization()
  const [rows, setRows] = useState<DayAssignment[]>([])
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)

  useEffect(() => {
    setRows(buildAssignments(date, availability, shifts))
    setError('')
    setSuccess(false)
  }, [date, availability, shifts])

  const updateRow = (userId: string, patch: Partial<DayAssignment>) => {
    setSuccess(false)
    setRows((prev) => prev.map((r) => (r.user_id === userId ? { ...r, ...patch } : r)))
  }

  const selectedCount = rows.filter((r) => r.selected).length

  const handleSave = async () => {
    setSaving(true)
    setError('')
    setSuccess(false)
    try {
      for (const row of rows) {
        if (row.selected) {
          if (row.existingShiftId) {
            await updateShift(row.existingShiftId, {
              start_time: row.start_time,
              end_time: row.end_time,
              position: row.position,
              published: true,
            })
          } else {
            await createShift({
              organization_id: organization!.id,
              user_id: row.user_id,
              date,
              start_time: row.start_time,
              end_time: row.end_time,
              position: row.position,
              status: 'scheduled',
              published: true,
              template_id: null,
              slot_index: 0,
            })
          }
        } else if (row.existingShiftId) {
          await deleteShift(row.existingShiftId)
        }
      }
      await onSaved()
      setSuccess(true)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Opslaan mislukt')
    } finally {
      setSaving(false)
    }
  }

  if (rows.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-gray-200 bg-gray-50/80 px-6 py-12 text-center">
        <Users className="mb-3 h-10 w-10 text-gray-300" />
        <p className="font-medium text-navy-900">Geen beschikbaarheid</p>
        <p className="mt-1 max-w-sm text-sm text-gray-500">
          Op {formatDayHeader(date)} heeft nog niemand zich beschikbaar gemeld.
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold text-navy-900 capitalize">
            {formatDayHeader(date)}
          </h2>
          <p className="text-sm text-gray-500">
            {selectedCount} van {rows.length} beschikbare medewerkers ingepland
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => setRows((prev) => prev.map((r) => ({ ...r, selected: true })))}
          >
            Allen
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() =>
              setRows((prev) =>
                prev.map((r) =>
                  r.selected
                    ? {
                        ...r,
                        start_time: DEFAULT_SHIFT_START,
                        end_time: DEFAULT_SHIFT_END,
                      }
                    : r
                )
              )
            }
          >
            {DEFAULT_SHIFT_START}–{DEFAULT_SHIFT_END}
          </Button>
        </div>
      </div>

      <ul className="space-y-2">
        {rows.map((row) => (
          <li
            key={row.user_id}
            className={cn(
              'rounded-xl border transition-colors',
              row.selected
                ? 'border-navy-200 bg-white shadow-sm'
                : 'border-gray-100 bg-gray-50/50'
            )}
          >
            <label className="flex cursor-pointer items-center gap-3 px-4 py-3">
              <input
                type="checkbox"
                checked={row.selected}
                onChange={(e) => updateRow(row.user_id, { selected: e.target.checked })}
                className="h-4 w-4 rounded border-gray-300 text-navy-900"
              />
              <span className="flex-1 font-medium text-navy-900">{row.user_name}</span>
              {row.selected && (
                <span className="text-xs text-navy-600">
                  {row.start_time}–{row.end_time}
                </span>
              )}
            </label>

            {row.selected && (
              <div className="grid gap-3 border-t border-gray-100 px-4 pb-4 pt-3 sm:grid-cols-3">
                <Input
                  label="Start"
                  type="time"
                  value={row.start_time}
                  onChange={(e) => updateRow(row.user_id, { start_time: e.target.value })}
                />
                <Input
                  label="Eind"
                  type="time"
                  value={row.end_time}
                  onChange={(e) => updateRow(row.user_id, { end_time: e.target.value })}
                />
                <Select
                  label="Functie"
                  value={row.position}
                  onChange={(e) => updateRow(row.user_id, { position: e.target.value })}
                  options={[...SHIFT_POSITIONS]}
                />
              </div>
            )}
          </li>
        ))}
      </ul>

      {error && (
        <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700" role="alert">
          {error}
        </p>
      )}
      {success && (
        <p className="rounded-lg bg-emerald-50 px-3 py-2 text-sm text-emerald-800" role="status">
          Rooster opgeslagen voor deze dag.
        </p>
      )}

      <Button className="w-full sm:w-auto" loading={saving} onClick={handleSave}>
        Opslaan
      </Button>
    </div>
  )
}
