import { useEffect, useState, type FormEvent } from 'react'
import { Navigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useOrganization } from '../context/OrganizationContext'
import { useToast } from '../context/ToastContext'
import { useConfirm } from '../context/ConfirmContext'
import { getAllUsers, updateUser, deleteUser, createEmployeeAccount } from '../services/users'
import type { User, UserRole } from '../types/database'
import { PRICE_PER_EMPLOYEE } from '../types/database'
import { Card, CardHeader } from '../components/ui/Card'
import { Button } from '../components/ui/Button'
import { Input } from '../components/ui/Input'
import { Select } from '../components/ui/Select'
import { Badge } from '../components/ui/Badge'
import { PageHeader } from '../components/ui/PageHeader'
import { EmptyState } from '../components/ui/EmptyState'
import { DashboardSkeleton } from '../components/ui/Skeleton'
import { Table, TableHead, TableHeaderCell, TableBody, TableRow, TableCell } from '../components/ui/Table'
import { Users, Mail, UserPlus } from 'lucide-react'

export function EmployeesPage() {
  const { profile, isAdmin } = useAuth()
  const { organization } = useOrganization()
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
  })
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)

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
    setForm({ full_name: '', email: '', hourly_rate: '0', role: 'employee' })
    setEditing(null)
    setShowForm(false)
    setError('')
  }

  const memberCount = users.length + 1 // include the current admin

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
    })
    setShowForm(true)
  }

  const handleDelete = async (user: User) => {
    const ok = await confirm({
      title: 'Medewerker verwijderen?',
      message: `${user.full_name} wordt uit je team verwijderd. Hun rooster- en uurgegevens blijven bewaard.`,
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
        <DashboardSkeleton />
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
                <TableHeaderCell>E-mail</TableHeaderCell>
                <TableHeaderCell>Rol</TableHeaderCell>
                <TableHeaderCell>Uurloon</TableHeaderCell>
                <TableHeaderCell>Acties</TableHeaderCell>
              </TableHead>
              <TableBody>
                {users.map((u) => (
                  <TableRow key={u.id}>
                    <TableCell className="font-medium" style={{ color: 'var(--text-primary)' }}>{u.full_name}</TableCell>
                    <TableCell>{u.email}</TableCell>
                    <TableCell>
                      <Badge variant={u.role}>{u.role === 'admin' ? 'Manager' : 'Medewerker'}</Badge>
                    </TableCell>
                    <TableCell>€ {Number(u.hourly_rate).toFixed(2)}</TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button size="sm" variant="secondary" onClick={() => startEdit(u)}>Bewerken</Button>
                        <Button size="sm" variant="danger" onClick={() => handleDelete(u)}>Verwijderen</Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </Card>
      )}
    </div>
  )
}
