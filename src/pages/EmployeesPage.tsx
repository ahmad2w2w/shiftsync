import { useEffect, useState, type FormEvent } from 'react'
import { Navigate, Link } from 'react-router-dom'
import { Sparkles } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { useOrganization } from '../context/OrganizationContext'
import { useToast } from '../context/ToastContext'
import { useConfirm } from '../context/ConfirmContext'
import { getAllUsers, updateUser, deleteUser, createEmployeeAccount } from '../services/users'
import type { User, UserRole } from '../types/database'
import { Card, CardHeader } from '../components/ui/Card'
import { Button } from '../components/ui/Button'
import { Input } from '../components/ui/Input'
import { Select } from '../components/ui/Select'
import { Badge } from '../components/ui/Badge'
import { PageHeader } from '../components/ui/PageHeader'
import { EmptyState } from '../components/ui/EmptyState'
import { DashboardSkeleton } from '../components/ui/Skeleton'
import { Table, TableHead, TableHeaderCell, TableBody, TableRow, TableCell } from '../components/ui/Table'
import { Users } from 'lucide-react'

export function EmployeesPage() {
  const { profile, isAdmin } = useAuth()
  const { organization, maxEmployees, plan } = useOrganization()
  const toast = useToast()
  const confirm = useConfirm()
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editing, setEditing] = useState<User | null>(null)
  const [form, setForm] = useState({
    full_name: '',
    email: '',
    password: '',
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
    setForm({ full_name: '', email: '', password: '', hourly_rate: '0', role: 'employee' })
    setEditing(null)
    setShowForm(false)
    setError('')
  }

  const memberCount = users.length + 1 // include the current admin
  const atLimit = memberCount >= maxEmployees

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    if (!editing && atLimit) {
      setError(`Je ${plan}-abonnement staat maximaal ${maxEmployees} teamleden toe. Upgrade om meer toe te voegen.`)
      return
    }
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
        await createEmployeeAccount({
          email: form.email,
          password: form.password,
          full_name: form.full_name,
          hourly_rate: parseFloat(form.hourly_rate),
          organization_id: organization!.id,
        })
        toast.success('Medewerker toegevoegd')
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
      password: '',
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
        subtitle={`Team beheren en rollen instellen · ${memberCount} / ${maxEmployees} plekken gebruikt`}
        action={
          atLimit ? (
            <Link
              to="/app/abonnement"
              className="inline-flex items-center gap-2 rounded-xl bg-brand-600 px-4 py-2.5 text-sm font-semibold text-white transition-all hover:bg-brand-700"
            >
              <Sparkles className="h-4 w-4" />
              Upgrade voor meer plekken
            </Link>
          ) : (
            <Button onClick={() => { resetForm(); setShowForm(true) }}>
              Medewerker toevoegen
            </Button>
          )
        }
      />

      {atLimit && (
        <div
          className="flex items-center gap-2 rounded-xl px-4 py-3 text-sm"
          style={{ background: 'rgba(245,158,11,0.1)', border: '1px solid rgba(245,158,11,0.25)', color: '#B45309' }}
        >
          <Sparkles className="h-4 w-4 shrink-0" style={{ color: '#F59E0B' }} />
          Je hebt de limiet van {maxEmployees} teamleden bereikt op je {plan}-abonnement. Upgrade om je team uit te breiden.
        </div>
      )}

      {showForm && (
        <Card>
          <CardHeader title={editing ? 'Medewerker bewerken' : 'Nieuwe medewerker'} />
          <form onSubmit={handleSubmit} className="grid gap-4 sm:grid-cols-2">
            <Input
              label="Naam"
              value={form.full_name}
              onChange={(e) => setForm({ ...form, full_name: e.target.value })}
              required
            />
            {!editing && (
              <>
                <Input
                  label="E-mail"
                  type="email"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  required
                />
                <Input
                  label="Tijdelijk wachtwoord"
                  type="password"
                  value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                  required
                  minLength={6}
                />
              </>
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
              <Button type="submit" loading={submitting}>Opslaan</Button>
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
              action={<Button onClick={() => { resetForm(); setShowForm(true) }}>Medewerker toevoegen</Button>}
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
