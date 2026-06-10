import { useState, type FormEvent } from 'react'
import { useAuth } from '../context/AuthContext'
import { updateUser } from '../services/users'
import { Card, CardHeader } from '../components/ui/Card'
import { Input } from '../components/ui/Input'
import { Button } from '../components/ui/Button'
import { Badge } from '../components/ui/Badge'

export function ProfilePage() {
  const { profile, refreshProfile, isAdmin } = useAuth()
  const [fullName, setFullName] = useState(profile?.full_name ?? '')
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState('')

  const handleSave = async (e: FormEvent) => {
    e.preventDefault()
    if (!profile) return
    setSaving(true)
    setMessage('')
    try {
      await updateUser(profile.id, { full_name: fullName })
      await refreshProfile()
      setMessage('Profiel opgeslagen')
    } catch {
      setMessage('Opslaan mislukt')
    } finally {
      setSaving(false)
    }
  }

  if (!profile) return null

  return (
    <div className="max-w-lg space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-navy-900">Profiel</h1>
        <p className="text-sm text-gray-500">Je accountgegevens</p>
      </div>

      <Card>
        <CardHeader title={profile.full_name} />
        <dl className="space-y-3 text-sm">
          <div className="flex justify-between">
            <dt className="text-gray-500">E-mail</dt>
            <dd className="font-medium">{profile.email}</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-gray-500">Rol</dt>
            <dd>
              <Badge variant={profile.role}>
                {isAdmin ? 'Manager' : 'Medewerker'}
              </Badge>
            </dd>
          </div>
          {!isAdmin && (
            <div className="flex justify-between">
              <dt className="text-gray-500">Uurloon</dt>
              <dd className="font-medium">€ {Number(profile.hourly_rate).toFixed(2)}</dd>
            </div>
          )}
        </dl>
      </Card>

      <Card>
        <CardHeader title="Naam wijzigen" />
        <form onSubmit={handleSave} className="space-y-4">
          <Input
            label="Volledige naam"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            required
          />
          <Button type="submit" loading={saving}>Opslaan</Button>
          {message && (
            <p className="text-sm text-emerald-600">{message}</p>
          )}
        </form>
      </Card>
    </div>
  )
}
