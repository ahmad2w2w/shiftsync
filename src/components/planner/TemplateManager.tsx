import { useState, type FormEvent } from 'react'
import { Plus, Trash2 } from 'lucide-react'
import type { ShiftTemplate } from '../../types/database'
import { createShiftTemplate, deleteShiftTemplate } from '../../services/shiftTemplates'
import { useOrganization } from '../../context/OrganizationContext'
import { useOrgConfig } from '../../context/OrgConfigContext'
import { useConfirm } from '../../context/ConfirmContext'
import { useToast } from '../../context/ToastContext'
import { DAY_NAMES } from '../../lib/plannerEngine'
import { Card, CardHeader } from '../ui/Card'
import { Button } from '../ui/Button'
import { Input } from '../ui/Input'
import { Select } from '../ui/Select'

interface TemplateManagerProps {
  templates: ShiftTemplate[]
  onChange: () => void
}

export function TemplateManager({ templates, onChange }: TemplateManagerProps) {
  const { organization } = useOrganization()
  const { positionOptions } = useOrgConfig()
  const confirm = useConfirm()
  const toast = useToast()
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({
    day_of_week: '5',
    position: 'Keuken',
    start_time: '17:00',
    end_time: '22:00',
    required_count: '2',
    label: '',
  })

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    if (!organization) return
    try {
      await createShiftTemplate({
        organization_id: organization.id,
        day_of_week: Number(form.day_of_week),
        position: form.position,
        start_time: form.start_time,
        end_time: form.end_time,
        required_count: Number(form.required_count),
        label: form.label || null,
      })
      setShowForm(false)
      toast.success('Template toegevoegd')
      onChange()
    } catch {
      toast.error('Template opslaan mislukt')
    }
  }

  const byDay = DAY_NAMES.map((_, dow) => templates.filter((t) => t.day_of_week === dow))

  const duplicateKeys = new Set<string>()
  const seen = new Set<string>()
  for (const t of templates) {
    const k = `${t.day_of_week}|${t.position}|${t.start_time}|${t.end_time}`
    if (seen.has(k)) duplicateKeys.add(k)
    seen.add(k)
  }

  return (
    <Card>
      <CardHeader
        title="Dienst-templates"
        subtitle="Elke regel = één blok (bv. 2× Keuken op vrijdag)."
        action={
          <Button size="sm" onClick={() => setShowForm(!showForm)}>
            <Plus className="h-4 w-4" />
            Template
          </Button>
        }
      />

      {duplicateKeys.size > 0 && (
        <p className="mb-4 rounded-xl px-4 py-3 text-sm text-amber-600 dark:text-amber-400" style={{ background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.2)' }}>
          Let op: je hebt dubbele templates. Verwijder ze of pas het aantal aan.
        </p>
      )}

      {showForm && (
        <form onSubmit={handleSubmit} className="mb-6 grid gap-3 pb-6 sm:grid-cols-3" style={{ borderBottom: '1px solid var(--border)' }}>
          <Select label="Weekdag" value={form.day_of_week} onChange={(e) => setForm({ ...form, day_of_week: e.target.value })} options={DAY_NAMES.map((d, i) => ({ value: String(i), label: d }))} />
          <Select label="Functie" value={form.position} onChange={(e) => setForm({ ...form, position: e.target.value })} options={positionOptions} />
          <Input label="Aantal" type="number" min={1} value={form.required_count} onChange={(e) => setForm({ ...form, required_count: e.target.value })} />
          <Input label="Start" type="time" value={form.start_time} onChange={(e) => setForm({ ...form, start_time: e.target.value })} />
          <Input label="Einde" type="time" value={form.end_time} onChange={(e) => setForm({ ...form, end_time: e.target.value })} />
          <Input label="Label (optioneel)" value={form.label} onChange={(e) => setForm({ ...form, label: e.target.value })} placeholder="bv. Vrijdag" />
          <div className="flex gap-2 sm:col-span-3">
            <Button type="submit">Opslaan</Button>
            <Button type="button" variant="secondary" onClick={() => setShowForm(false)}>Annuleren</Button>
          </div>
        </form>
      )}

      <div className="space-y-5">
        {DAY_NAMES.map((dayName, dow) => {
          const items = byDay[dow]
          if (items.length === 0) return null
          const dayTotal = items.reduce((s, t) => s + t.required_count, 0)
          return (
            <div key={dow}>
              <p className="mb-2 text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>
                {dayName}
                <span className="ml-2 font-normal" style={{ color: 'var(--text-muted)' }}>
                  → {dayTotal} dienst{dayTotal !== 1 ? 'en' : ''} per {dayName.toLowerCase()}
                </span>
              </p>
              <ul className="space-y-2">
                {items.map((t) => (
                  <li
                    key={t.id}
                    className="flex items-center justify-between rounded-xl px-4 py-3 text-sm"
                    style={{ background: 'var(--surface-subtle)', border: '1px solid var(--border)' }}
                  >
                    <span style={{ color: 'var(--text-secondary)' }}>
                      <strong style={{ color: 'var(--text-primary)' }}>{t.required_count}×</strong> {t.position}{' '}
                      <span style={{ color: 'var(--text-muted)' }}>{t.start_time.slice(0, 5)}–{t.end_time.slice(0, 5)}</span>
                      {t.label && <span className="ml-2 text-xs" style={{ color: 'var(--text-disabled)' }}>({t.label})</span>}
                    </span>
                    <button
                      type="button"
                      onClick={async () => {
                        const ok = await confirm({
                          title: 'Template verwijderen?',
                          message: `${t.required_count}× ${t.position} (${t.start_time.slice(0, 5)}–${t.end_time.slice(0, 5)})`,
                          confirmLabel: 'Verwijderen',
                          danger: true,
                        })
                        if (!ok) return
                        try {
                          await deleteShiftTemplate(t.id)
                          toast.success('Template verwijderd')
                          onChange()
                        } catch {
                          toast.error('Verwijderen mislukt')
                        }
                      }}
                      className="transition-colors hover:text-red-500"
                      style={{ color: 'var(--text-disabled)' }}
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          )
        })}
        {templates.length === 0 && (
          <p className="py-4 text-center text-sm" style={{ color: 'var(--text-muted)' }}>Nog geen templates aangemaakt.</p>
        )}
      </div>
    </Card>
  )
}
