import { useEffect, useState, type FormEvent } from 'react'
import { Navigate, Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useOrganization } from '../context/OrganizationContext'
import { useOrgConfig } from '../context/OrgConfigContext'
import { useToast } from '../context/ToastContext'
import { useConfirm } from '../context/ConfirmContext'
import { getAllUsers, updateUser, deleteUser, createEmployeeAccount, setUserActive, resendInvite } from '../services/users'
import type { User, UserRole } from '../types/database'
import { PRICE_PER_EMPLOYEE } from '../types/database'
import { Card, CardHeader } from '../components/ui/Card'
import { Button } from '../components/ui/Button'
import { Input } from '../components/ui/Input'
import { Select } from '../components/ui/Select'
import { Badge } from '../components/ui/Badge'
import { PageHeader } from '../components/ui/PageHeader'
import { EmptyState } from '../components/ui/EmptyState'
import { TableSkeleton } from '../components/ui/Skeleton'
import { Table, TableHead, TableHeaderCell, TableBody, TableRow, TableCell } from '../components/ui/Table'
import { Users, Mail, UserPlus, Send, ChevronRight } from 'lucide-react'

export function EmployeesPage() {
  const { profile, isAdmin } = useAuth()
  const { organization } = useOrganization()
  const { departments } = useOrgConfig()
  const toast = useToast()
  const confirm = useConfirm()
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editing, setEditing] = useState<User | null>(null)
  const [form, setForm] = useState({
    full_name: '',
    email: '',
    hourly_rate: '0',
    role: 'employee' as UserRole,
    contract_hours_per_week: '',
    department_id: '',
  })
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [busyId, setBusyId] = useState<string | null>(null)

  const load = async () => {
    setLoading(true)
    try {
      const data = await getAllUsers()
      setUsers(data.filter((u) => u.id !== profile?.id))
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (isAdmin) load()
  }, [isAdmin])

  if (!isAdmin) return <Navigate to="/app/dashboard" replace />

  const resetForm = () => {
    setForm({ full_name: '', email: '', hourly_rate: '0', role: 'employee', contract_hours_per_week: '', department_id: '' })
    setEditing(null)
    setShowForm(false)
    setError('')
  }

  const memberCount = users.length + 1

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setSubmitting(true)
    setError('')
    try {
      if (editing) {
        await updateUser(editing.id, {
          full_name: form.full_name,
          hourly_rate: parseFloat(form.hourly_rate),
          role: form.role,
          contract_hours_per_week: form.contract_hours_per_week ? parseFloat(form.contract_hours_per_week) : null,
          department_id: form.department_id || null,
        })
        toast.success('Medewerker bijgewerkt')
      } else {
        const message = await createEmployeeAccount({
          email: form.email,
          full_name: form.full_name,
          hourly_rate: parseFloat(form.hourly_rate),
          organization_id: organization!.id,
        })
        toast.success(message)
      }
      resetForm()
      load()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Opslaan mislukt')
    } finally {
      setSubmitting(false)
    }
  }

  const startEdit = (user: User) => {
    setEditing(user)
    setForm({
      full_name: user.full_name,
      email: user.email,
      hourly_rate: String(user.hourly_rate),
      role: user.role,
      contract_hours_per_week: user.contract_hours_per_week != null ? String(user.contract_hours_per_week) : '',
      department_id: user.department_id ?? '',
    })
    setShowForm(true)
  }

  const handleToggleActive = async (user: User) => {
    const deactivating = user.active !== false
    setBusyId(user.id)
    try {
      await setUserActive(user.id, !deactivating)
      toast.success(deactivating ? 'Medewerker gedeactiveerd' : 'Medewerker geactiveerd')
      setUsers((prev) => prev.map((u) => (u.id === user.id ? { ...u, active: !deactivating } : u)))
    } catch {
      toast.error('Bijwerken mislukt')
    } finally {
      setBusyId(null)
    }
  }

  const handleResend = async (user: User) => {
    setBusyId(user.id)
    try {
      const msg = await resendInvite({ email: user.email, full_name: user.full_name, hourly_rate: Number(user.hourly_rate) })
      toast.success(msg)
    } catch {
      toast.error('Opnieuw uitnodigen mislukt')
    } finally {
      setBusyId(null)
    }
  }

  const handleDelete = async (user: User) => {
    const ok = await confirm({
      title: 'Medewerker verwijderen?',
      message: `${user.full_name} wordt permanent verwijderd. Overweeg deactiveren als je de gegevens wilt bewaren.`,
      confirmLabel: 'Verwijderen',
      danger: true,
    })
    if (!ok) return
    try {
      await deleteUser(user.id)
      toast.success('Medewerker verwijderd')
      load()
    } catch {
      toast.error('Verwijderen mislukt')
    }
  }

  const deptName = (id?: string | null) => departments.find((d) => d.id === id)?.name

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <PageHeader
        title="Medewerkers"
        subtitle={`Team beheren · ${memberCount} teamleden · €${memberCount * PRICE_PER_EMPLOYEE}/maand`}
        action={
          <Button onClick={() => { resetForm(); setShowForm(true) }}>
            <UserPlus className="h-4 w-4" /> Uitnodigen
          </Button>
        }
      />

      {showForm && (
        <Card>
          <CardHeader
            title={editing ? 'Medewerker bewerken' : 'Medewerker uitnodigen'}
            subtitle={!editing ? 'We sturen een e-mail met een link om het account te activeren en een wachtwoord in te stellen.' : undefined}
          />
          <form onSubmit={handleSubmit} className="grid gap-4 sm:grid-cols-2">
            <Input
              label="Naam"
              value={form.full_name}
              onChange={(e) => setForm({ ...form, full_name: e.target.value })}
              required
            />
            {!editing && (
              <Input
                label="E-mail"
                type="email"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                required
                hint="Medewerker ontvangt een uitnodigingsmail"
              />
            )}
            <Input
              label="Uurloon (€)"
              type="number"
              step="0.01"
              value={form.hourly_rate}
              onChange={(e) => setForm({ ...form, hourly_rate: e.target.value })}
            />
            <Select
              label="Rol"
              value={form.role}
              onChange={(e) => setForm({ ...form, role: e.target.value as UserRole })}
              options={[
                { value: 'employee', label: 'Medewerker' },
                { value: 'admin', label: 'Manager / Admin' },
              ]}
            />
            {editing && (
              <>
                <Input
                  label="Contracturen per week"
                  type="number"
                  step="1"
                  min={0}
                  value={form.contract_hours_per_week}
                  onChange={(e) => setForm({ ...form, contract_hours_per_week: e.target.value })}
                  placeholder="Bijv. 32"
                  hint="Gebruikt voor planningswaarschuwingen"
                />
                {departments.length > 0 && (
                  <Select
                    label="Afdeling"
                    value={form.department_id}
                    onChange={(e) => setForm({ ...form, department_id: e.target.value })}
                    options={[{ value: '', label: 'Geen afdeling' }, ...departments.map((d) => ({ value: d.id, label: d.name }))]}
                  />
                )}
              </>
            )}
            <div className="flex gap-2 sm:col-span-2">
              <Button type="submit" loading={submitting}>
                {!editing && <Mail className="h-4 w-4" />}
                {editing ? 'Opslaan' : 'Uitnodiging versturen'}
              </Button>
              <Button type="button" variant="secondary" onClick={resetForm}>Annuleren</Button>
            </div>
          </form>
          {error && (
            <p className="mt-3 rounded-xl px-4 py-3 text-sm text-amber-400" style={{ background: 'rgba(245,158,11,0.1)', border: '1px solid rgba(245,158,11,0.2)' }}>
              {error}
            </p>
          )}
        </Card>
      )}

      {loading ? (
        <TableSkeleton />
      ) : (
        <Card className="overflow-hidden p-0">
          {users.length === 0 ? (
            <EmptyState
              icon={Users}
              title="Nog geen medewerkers"
              description="Voeg je eerste teamlid toe om te beginnen met roosterplanning."
              action={<Button onClick={() => { resetForm(); setShowForm(true) }}><UserPlus className="h-4 w-4" /> Uitnodigen</Button>}
            />
          ) : (
            <Table>
              <TableHead>
                <TableHeaderCell>Naam</TableHeaderCell>
                <TableHeaderCell>Rol</TableHeaderCell>
                <TableHeaderCell>Afdeling</TableHeaderCell>
                <TableHeaderCell>Contract</TableHeaderCell>
                <TableHeaderCell>Uurloon</TableHeaderCell>
                <TableHeaderCell>Acties</TableHeaderCell>
              </TableHead>
              <TableBody>
                {users.map((u) => {
                  const inactive = u.active === false
                  return (
                    <TableRow key={u.id}>
                      <TableCell style={{ color: 'var(--text-primary)' }}>
                        <Link to={`/app/medewerkers/${u.id}`} className="group inline-flex items-center gap-1.5 font-medium hover:underline" style={{ color: inactive ? 'var(--text-muted)' : 'var(--text-primary)' }}>
                          {u.full_name}
                          {inactive && <Badge variant="default" className="text-[10px]">Inactief</Badge>}
                          <ChevronRight className="h-3.5 w-3.5 opacity-0 transition-opacity group-hover:opacity-60" />
                        </Link>
                        <p className="text-xs" style={{ color: 'var(--text-muted)' }}>{u.email}</p>
                      </TableCell>
                      <TableCell>
                        <Badge variant={u.role}>{u.role === 'admin' ? 'Manager' : 'Medewerker'}</Badge>
                      </TableCell>
                      <TableCell>{deptName(u.department_id) ?? '—'}</TableCell>
                      <TableCell>{u.contract_hours_per_week != null ? `${u.contract_hours_per_week} u/wk` : '—'}</TableCell>
                      <TableCell>€ {Number(u.hourly_rate).toFixed(2)}</TableCell>
                      <TableCell>
                        <div className="flex flex-wrap gap-2">
                          <Button size="sm" variant="secondary" onClick={() => startEdit(u)}>Bewerken</Button>
                          <Button size="sm" variant="secondary" loading={busyId === u.id} onClick={() => handleToggleActive(u)}>
                            {inactive ? 'Activeren' : 'Deactiveren'}
                          </Button>
                          <Button size="sm" variant="secondary" loading={busyId === u.id} onClick={() => handleResend(u)}>
                            <Send className="h-3.5 w-3.5" /> Opnieuw
                          </Button>
                          <Button size="sm" variant="danger" onClick={() => handleDelete(u)}>Verwijderen</Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          )}
        </Card>
      )}
    </div>
  )
}
