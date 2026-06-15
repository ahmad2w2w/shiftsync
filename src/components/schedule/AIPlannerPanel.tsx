import { useState } from 'react'
import { Sparkles, Wand2 } from 'lucide-react'
import type { Shift, User, Availability, LeaveRequest } from '../../types/database'
import { rankEmployeesForSlot } from '../../lib/plannerEngine'
import { createShift } from '../../services/shifts'
import { useOrganization } from '../../context/OrganizationContext'
import { useOrgConfig } from '../../context/OrgConfigContext'
import { useToast } from '../../context/ToastContext'
import { Button } from '../ui/Button'
import { Input } from '../ui/Input'
import { DEFAULT_SHIFT_END, DEFAULT_SHIFT_START } from '../../lib/utils'

interface AIPlannerPanelProps {
  date: string
  employees: User[]
  availability: Availability[]
  leave: LeaveRequest[]
  shifts: Shift[]
  maxHours?: number
  onSaved: () => Promise<void>
}

type NeedRow = { position: string; count: number; start: string; end: string }

type PreviewItem = {
  position: string
  userId: string | null
  start: string
  end: string
  name: string
  warnings: string[]
}

export function AIPlannerPanel({
  date,
  employees,
  availability,
  leave,
  shifts,
  maxHours = 160,
  onSaved,
}: AIPlannerPanelProps) {
  const { positionOptions } = useOrgConfig()
  const { organization } = useOrganization()
  const toast = useToast()
  const [needs, setNeeds] = useState<NeedRow[]>([
    { position: 'Keuken', count: 2, start: DEFAULT_SHIFT_START, end: DEFAULT_SHIFT_END },
    { position: 'Bezorging', count: 1, start: DEFAULT_SHIFT_START, end: DEFAULT_SHIFT_END },
    { position: 'Bediening', count: 2, start: DEFAULT_SHIFT_START, end: DEFAULT_SHIFT_END },
  ])
  const [generating, setGenerating] = useState(false)
  const [preview, setPreview] = useState<PreviewItem[]>([])

  const updateNeed = (idx: number, patch: Partial<NeedRow>) => {
    setNeeds((rows) => rows.map((r, i) => (i === idx ? { ...r, ...patch } : r)))
  }

  const generate = async () => {
    setGenerating(true)
    setPreview([])
    try {
      const proposals: PreviewItem[] = []
      const used = new Set<string>()

      for (const need of needs) {
        if (need.count <= 0) continue
        for (let n = 0; n < need.count; n++) {
          const slot = {
            id: `ai-${need.position}-${n}`,
            date,
            start_time: need.start,
            end_time: need.end,
            position: need.position,
          }
          const ranked = rankEmployeesForSlot(slot, employees, availability, leave, shifts, maxHours)
          const pick = ranked.find((r) => !used.has(r.user.id))
          if (pick) {
            used.add(pick.user.id)
            proposals.push({
              position: need.position,
              userId: pick.user.id,
              start: need.start,
              end: need.end,
              name: pick.user.full_name,
              warnings: pick.warnings.map((w) => w.message),
            })
          } else {
            proposals.push({
              position: need.position,
              userId: null,
              start: need.start,
              end: need.end,
              name: 'Open dienst',
              warnings: ['Geen geschikte medewerker'],
            })
          }
        }
      }

      setPreview(proposals)
      toast.success('AI-voorstel gegenereerd')
    } finally {
      setGenerating(false)
    }
  }

  const apply = async () => {
    if (!organization || preview.length === 0) return
    setGenerating(true)
    try {
      let created = 0
      for (const item of preview) {
        await createShift({
          organization_id: organization.id,
          user_id: item.userId,
          date,
          start_time: item.start,
          end_time: item.end,
          position: item.position,
          status: 'scheduled',
          published: false,
          template_id: null,
          slot_index: created,
        })
        created++
      }
      await onSaved()
      setPreview([])
      toast.success(`${created} diensten aangemaakt als concept`)
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Toepassen mislukt')
    } finally {
      setGenerating(false)
    }
  }

  return (
    <div className="space-y-6">
      <div
        className="rounded-2xl p-5"
        style={{ background: 'linear-gradient(135deg, rgba(59,130,246,0.12) 0%, rgba(139,92,246,0.08) 100%)', border: '1px solid rgba(59,130,246,0.2)' }}
      >
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-brand-600 shadow-lg shadow-brand-600/30">
            <Sparkles className="h-6 w-6 text-white" />
          </div>
          <div>
            <h3 className="text-lg font-bold" style={{ color: 'var(--text-primary)' }}>AI Roosterplanner</h3>
            <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
              Vul behoefte in — AI stelt team samen op basis van beschikbaarheid, verlof en uren.
            </p>
          </div>
        </div>
      </div>

      <div className="space-y-3">
        {needs.map((row, idx) => (
          <div key={idx} className="grid gap-3 rounded-2xl p-4 sm:grid-cols-4" style={{ background: 'var(--surface-card)', border: '1px solid var(--border)' }}>
            <select
              value={row.position}
              onChange={(e) => updateNeed(idx, { position: e.target.value })}
              className="rounded-xl border px-3 py-2 text-sm"
              style={{ background: 'var(--surface-input)', borderColor: 'var(--border-input)', color: 'var(--text-primary)' }}
            >
              {positionOptions.map((p) => (
                <option key={p.value} value={p.value}>{p.label}</option>
              ))}
            </select>
            <Input type="number" min={0} max={10} value={String(row.count)} onChange={(e) => updateNeed(idx, { count: parseInt(e.target.value, 10) || 0 })} label="Aantal" />
            <Input type="time" value={row.start} onChange={(e) => updateNeed(idx, { start: e.target.value })} label="Start" />
            <Input type="time" value={row.end} onChange={(e) => updateNeed(idx, { end: e.target.value })} label="Eind" />
          </div>
        ))}
      </div>

      <Button onClick={generate} loading={generating} className="w-full sm:w-auto">
        <Wand2 className="h-4 w-4" /> Genereer voorstel
      </Button>

      {preview.length > 0 && (
        <div className="rounded-2xl p-5 space-y-3" style={{ background: 'var(--surface-subtle)', border: '1px solid var(--border)' }}>
          <h4 className="font-semibold" style={{ color: 'var(--text-primary)' }}>Voorstel preview</h4>
          <ul className="space-y-2">
            {preview.map((p, i) => (
              <li key={i} className="flex flex-wrap items-center justify-between gap-2 rounded-xl px-4 py-3" style={{ background: 'var(--surface-card)', border: '1px solid var(--border)' }}>
                <span className="font-medium" style={{ color: 'var(--text-primary)' }}>{p.position} → {p.name}</span>
                {p.warnings.length > 0 && (
                  <span className="text-xs" style={{ color: '#F59E0B' }}>{p.warnings.join(' · ')}</span>
                )}
              </li>
            ))}
          </ul>
          <div className="flex gap-2 pt-2">
            <Button onClick={apply} loading={generating}>Accepteren & aanmaken</Button>
            <Button variant="secondary" onClick={() => setPreview([])}>Opnieuw</Button>
          </div>
        </div>
      )}
    </div>
  )
}
