import { useEffect, useState, type FormEvent } from 'react'
import { Trash2 } from 'lucide-react'
import type { Availability } from '../../types/database'
import { Button } from '../ui/Button'
import { Input } from '../ui/Input'
import { formatDate } from '../../lib/utils'

export function toTimeInput(value: string | null): string {
  if (!value) return ''
  return value.slice(0, 5)
}

export function toDbTime(value: string): string | null {
  const trimmed = value.trim()
  if (!trimmed) return null
  return trimmed.length === 5 ? `${trimmed}:00` : trimmed
}

interface AvailabilityEntryPanelProps {
  entry: Availability
  subtitle?: string
  onSave: (updates: {
    available_from: string | null
    available_until: string | null
    note: string | null
  }) => Promise<void>
  onDelete: () => Promise<void>
}

export function AvailabilityEntryPanel({
  entry,
  subtitle,
  onSave,
  onDelete,
}: AvailabilityEntryPanelProps) {
  const [from, setFrom] = useState('')
  const [until, setUntil] = useState('')
  const [note, setNote] = useState('')
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    setFrom(toTimeInput(entry.available_from))
    setUntil(toTimeInput(entry.available_until))
    setNote(entry.note ?? '')
    setError('')
  }, [entry.id, entry.available_from, entry.available_until, entry.note])

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setSaving(true)
    setError('')
    try {
      await onSave({
        available_from: toDbTime(from),
        available_until: toDbTime(until),
        note: note.trim() || null,
      })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Opslaan mislukt')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async () => {
    if (!confirm('Beschikbaarheid voor deze dag verwijderen?')) return
    setDeleting(true)
    setError('')
    try {
      await onDelete()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Verwijderen mislukt')
    } finally {
      setDeleting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <h3 className="font-semibold capitalize" style={{ color: 'var(--text-primary)' }}>
          {formatDate(entry.date, 'EEEE d MMMM yyyy')}
        </h3>
        {subtitle && (
          <p className="mt-0.5 text-sm" style={{ color: 'var(--text-muted)' }}>{subtitle}</p>
        )}
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <Input
          label="Beschikbaar van (optioneel)"
          type="time"
          value={from}
          onChange={(e) => setFrom(e.target.value)}
        />
        <Input
          label="Beschikbaar tot (optioneel)"
          type="time"
          value={until}
          onChange={(e) => setUntil(e.target.value)}
        />
        <div className="sm:col-span-2">
          <Input
            label="Opmerking (optioneel)"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="Bijv. alleen avond, liever niet keuken"
          />
        </div>
      </div>

      {error && (
        <p
          className="rounded-xl px-4 py-3 text-sm"
          style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)', color: '#EF4444' }}
        >
          {error}
        </p>
      )}

      <div className="flex flex-wrap gap-2">
        <Button type="submit" loading={saving}>Opslaan</Button>
        <Button type="button" variant="danger" loading={deleting} onClick={handleDelete}>
          <Trash2 className="h-4 w-4" />
          Verwijderen
        </Button>
      </div>
    </form>
  )
}
