import { useEffect, useState } from 'react'
import { Plus, Trash2, Building2, Tag, Palmtree } from 'lucide-react'
import { useOrganization } from '../../context/OrganizationContext'
import { useToast } from '../../context/ToastContext'
import { useConfirm } from '../../context/ConfirmContext'
import { getDepartments, createDepartment, deleteDepartment } from '../../services/departments'
import { getPositions, createPosition, deletePosition } from '../../services/positions'
import { getLeaveTypes, createLeaveType, deleteLeaveType } from '../../services/leaveTypes'
import type { Department, Position, LeaveType } from '../../types/database'
import { Card, CardHeader } from '../ui/Card'
import { Input } from '../ui/Input'
import { Button } from '../ui/Button'
import { cn } from '../../lib/utils'

const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899', '#06B6D4', '#F97316']

function ColorPicker({ value, onChange }: { value: string; onChange: (c: string) => void }) {
  return (
    <div className="flex flex-wrap items-center gap-1.5">
      {COLORS.map((c) => (
        <button
          key={c}
          type="button"
          onClick={() => onChange(c)}
          aria-label={`Kleur ${c}`}
          className={cn('h-6 w-6 rounded-full transition-transform', value === c ? 'scale-110 ring-2 ring-offset-2' : 'hover:scale-105')}
          style={{ background: c, boxShadow: value === c ? `0 0 0 2px var(--surface-card), 0 0 0 4px ${c}` : undefined }}
        />
      ))}
    </div>
  )
}

export function OrgStructure() {
  const { organization } = useOrganization()
  const toast = useToast()
  const confirm = useConfirm()

  const [departments, setDepartments] = useState<Department[]>([])
  const [positions, setPositions] = useState<Position[]>([])
  const [leaveTypes, setLeaveTypes] = useState<LeaveType[]>([])
  const [loading, setLoading] = useState(true)

  const [deptName, setDeptName] = useState('')
  const [deptColor, setDeptColor] = useState(COLORS[0])
  const [posName, setPosName] = useState('')
  const [posColor, setPosColor] = useState(COLORS[0])
  const [ltName, setLtName] = useState('')
  const [ltColor, setLtColor] = useState(COLORS[4])
  const [ltPaid, setLtPaid] = useState(true)
  const [ltBalance, setLtBalance] = useState('0')
  const [busy, setBusy] = useState<string | null>(null)

  const load = async () => {
    setLoading(true)
    try {
      const [d, p, l] = await Promise.all([
        getDepartments().catch(() => []),
        getPositions().catch(() => []),
        getLeaveTypes().catch(() => []),
      ])
      setDepartments(d)
      setPositions(p)
      setLeaveTypes(l)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (organization) load()
  }, [organization?.id]) // eslint-disable-line react-hooks/exhaustive-deps

  const addDept = async () => {
    if (!organization || !deptName.trim()) return
    setBusy('dept')
    try {
      await createDepartment(organization.id, deptName.trim(), deptColor)
      setDeptName('')
      await load()
      toast.success('Afdeling toegevoegd')
    } catch {
      toast.error('Toevoegen mislukt')
    } finally {
      setBusy(null)
    }
  }

  const addPos = async () => {
    if (!organization || !posName.trim()) return
    setBusy('pos')
    try {
      await createPosition(organization.id, posName.trim(), posColor)
      setPosName('')
      await load()
      toast.success('Functie toegevoegd')
    } catch {
      toast.error('Toevoegen mislukt (bestaat de naam al?)')
    } finally {
      setBusy(null)
    }
  }

  const addLt = async () => {
    if (!organization || !ltName.trim()) return
    setBusy('lt')
    try {
      await createLeaveType(organization.id, {
        name: ltName.trim(),
        color: ltColor,
        paid: ltPaid,
        default_balance_hours: parseFloat(ltBalance) || 0,
      })
      setLtName('')
      setLtBalance('0')
      await load()
      toast.success('Verloftype toegevoegd')
    } catch {
      toast.error('Toevoegen mislukt')
    } finally {
      setBusy(null)
    }
  }

  const remove = async (kind: 'dept' | 'pos' | 'lt', id: string, name: string) => {
    const ok = await confirm({ title: `"${name}" verwijderen?`, message: 'Dit kan niet ongedaan worden gemaakt.', confirmLabel: 'Verwijderen', danger: true })
    if (!ok) return
    try {
      if (kind === 'dept') await deleteDepartment(id)
      else if (kind === 'pos') await deletePosition(id)
      else await deleteLeaveType(id)
      await load()
      toast.success('Verwijderd')
    } catch {
      toast.error('Verwijderen mislukt')
    }
  }

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      {/* Departments */}
      <Card>
        <CardHeader title="Afdelingen" subtitle="Groepeer je team en diensten" />
        <Chips
          icon={Building2}
          items={departments.map((d) => ({ id: d.id, name: d.name, color: d.color }))}
          loading={loading}
          emptyText="Nog geen afdelingen"
          onDelete={(id, name) => remove('dept', id, name)}
        />
        <div className="mt-4 space-y-3 border-t pt-4" style={{ borderColor: 'var(--border)' }}>
          <Input placeholder="Naam afdeling (bijv. Keuken)" value={deptName} onChange={(e) => setDeptName(e.target.value)} />
          <ColorPicker value={deptColor} onChange={setDeptColor} />
          <Button size="sm" onClick={addDept} loading={busy === 'dept'} disabled={!deptName.trim()}>
            <Plus className="h-4 w-4" /> Toevoegen
          </Button>
        </div>
      </Card>

      {/* Positions */}
      <Card>
        <CardHeader title="Functies" subtitle="Rollen die je inplant in het rooster" />
        <Chips
          icon={Tag}
          items={positions.map((p) => ({ id: p.id, name: p.name, color: p.color }))}
          loading={loading}
          emptyText="Nog geen functies"
          onDelete={(id, name) => remove('pos', id, name)}
        />
        <div className="mt-4 space-y-3 border-t pt-4" style={{ borderColor: 'var(--border)' }}>
          <Input placeholder="Naam functie (bijv. Bediening)" value={posName} onChange={(e) => setPosName(e.target.value)} />
          <ColorPicker value={posColor} onChange={setPosColor} />
          <Button size="sm" onClick={addPos} loading={busy === 'pos'} disabled={!posName.trim()}>
            <Plus className="h-4 w-4" /> Toevoegen
          </Button>
        </div>
      </Card>

      {/* Leave types */}
      <Card className="lg:col-span-2">
        <CardHeader title="Verloftypes" subtitle="Soorten verlof met standaard saldo" />
        <div className="space-y-2">
          {leaveTypes.length === 0 && !loading && (
            <p className="text-sm" style={{ color: 'var(--text-muted)' }}>Nog geen verloftypes — voeg er hieronder een toe.</p>
          )}
          {leaveTypes.map((lt) => (
            <div key={lt.id} className="flex items-center gap-3 rounded-xl px-3 py-2.5" style={{ background: 'var(--surface-subtle)', border: '1px solid var(--border)' }}>
              <span className="h-3 w-3 shrink-0 rounded-full" style={{ background: lt.color }} />
              <span className="flex items-center gap-2 text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
                <Palmtree className="h-4 w-4" style={{ color: lt.color }} /> {lt.name}
              </span>
              <span className="text-xs" style={{ color: 'var(--text-muted)' }}>
                {lt.paid ? 'Betaald' : 'Onbetaald'} · {lt.default_balance_hours}u standaard
              </span>
              <button type="button" onClick={() => remove('lt', lt.id, lt.name)} className="ml-auto press rounded-lg p-1.5 hover:bg-red-500/10" aria-label="Verwijderen">
                <Trash2 className="h-4 w-4" style={{ color: '#EF4444' }} />
              </button>
            </div>
          ))}
        </div>
        <div className="mt-4 grid gap-3 border-t pt-4 sm:grid-cols-2 lg:grid-cols-4" style={{ borderColor: 'var(--border)' }}>
          <Input placeholder="Naam (bijv. Vakantie)" value={ltName} onChange={(e) => setLtName(e.target.value)} />
          <Input type="number" placeholder="Saldo in uren" value={ltBalance} onChange={(e) => setLtBalance(e.target.value)} />
          <label className="flex items-center gap-2 text-sm" style={{ color: 'var(--text-primary)' }}>
            <input type="checkbox" checked={ltPaid} onChange={(e) => setLtPaid(e.target.checked)} className="h-4 w-4 rounded" />
            Betaald verlof
          </label>
          <div className="flex items-center justify-between gap-2">
            <ColorPicker value={ltColor} onChange={setLtColor} />
          </div>
          <div className="sm:col-span-2 lg:col-span-4">
            <Button size="sm" onClick={addLt} loading={busy === 'lt'} disabled={!ltName.trim()}>
              <Plus className="h-4 w-4" /> Verloftype toevoegen
            </Button>
          </div>
        </div>
      </Card>
    </div>
  )
}

function Chips({
  items,
  loading,
  emptyText,
  onDelete,
  icon: Icon,
}: {
  items: { id: string; name: string; color: string }[]
  loading: boolean
  emptyText: string
  onDelete: (id: string, name: string) => void
  icon: typeof Building2
}) {
  if (loading) return <p className="text-sm" style={{ color: 'var(--text-muted)' }}>Laden...</p>
  if (items.length === 0) return <p className="text-sm" style={{ color: 'var(--text-muted)' }}>{emptyText}</p>
  return (
    <div className="flex flex-wrap gap-2">
      {items.map((it) => (
        <span
          key={it.id}
          className="group inline-flex items-center gap-1.5 rounded-full py-1 pl-2.5 pr-1.5 text-sm font-medium"
          style={{ background: `${it.color}1a`, color: it.color, boxShadow: `0 0 0 1px ${it.color}40` }}
        >
          <Icon className="h-3.5 w-3.5" />
          {it.name}
          <button type="button" onClick={() => onDelete(it.id, it.name)} className="rounded-full p-0.5 transition-colors hover:bg-black/10" aria-label={`${it.name} verwijderen`}>
            <Trash2 className="h-3 w-3" />
          </button>
        </span>
      ))}
    </div>
  )
}
