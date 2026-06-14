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
import { LoadingSpinner } from '../components/ui/LoadingSpinner'

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
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-zinc-100">Medewerkers</h1>
          <p className="text-sm text-zinc-500">
            Team beheren en rollen instellen · {memberCount} / {maxEmployees} plekken gebruikt
          </p>
        </div>
        {atLimit ? (
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
        )}
      </div>

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
        <LoadingSpinner />
      ) : (
        <Card>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-white/8 text-left">
                  <th className="pb-3 pr-4 text-xs font-semibold uppercase tracking-wide text-zinc-600">Naam</th>
                  <th className="pb-3 pr-4 text-xs font-semibold uppercase tracking-wide text-zinc-600">E-mail</th>
                  <th className="pb-3 pr-4 text-xs font-semibold uppercase tracking-wide text-zinc-600">Rol</th>
                  <th className="pb-3 pr-4 text-xs font-semibold uppercase tracking-wide text-zinc-600">Uurloon</th>
                  <th className="pb-3 text-xs font-semibold uppercase tracking-wide text-zinc-600">Acties</th>
                </tr>
              </thead>
              <tbody>
                {users.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-8 text-center text-sm text-zinc-600">
                      Nog geen medewerkers toegevoegd
                    </td>
                  </tr>
                ) : (
                  users.map((u) => (
                    <tr key={u.id} className="border-b border-white/5 last:border-0">
                      <td className="py-3 pr-4 font-medium text-zinc-200">{u.full_name}</td>
                      <td className="py-3 pr-4 text-zinc-400">{u.email}</td>
                      <td className="py-3 pr-4">
                        <Badge variant={u.role}>{u.role === 'admin' ? 'Manager' : 'Medewerker'}</Badge>
                      </td>
                      <td className="py-3 pr-4 text-zinc-300">€ {Number(u.hourly_rate).toFixed(2)}</td>
                      <td className="py-3">
                        <div className="flex gap-2">
                          <Button size="sm" variant="secondary" onClick={() => startEdit(u)}>Bewerken</Button>
                          <Button size="sm" variant="danger" onClick={() => handleDelete(u)}>Verwijderen</Button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </Card>
      )}
    </div>
  )
}
