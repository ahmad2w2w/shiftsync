import { useState, type FormEvent } from 'react'
import { useAuth } from '../context/AuthContext'
import { updateUser } from '../services/users'
import { Card, CardHeader } from '../components/ui/Card'
import { Input } from '../components/ui/Input'
import { Button } from '../components/ui/Button'
import { Badge } from '../components/ui/Badge'
import { PageHeader } from '../components/ui/PageHeader'

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
    <div className="mx-auto max-w-lg space-y-6">
      <PageHeader title="Profiel" subtitle="Je accountgegevens" />

      <Card>
        <div className="flex items-center gap-4 mb-5">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-brand-500/15 text-xl font-bold text-brand-400">
            {profile.full_name?.[0]?.toUpperCase() ?? '?'}
          </div>
          <div>
            <p className="font-semibold text-zinc-100">{profile.full_name}</p>
            <Badge variant={profile.role} className="mt-1">
              {isAdmin ? 'Manager' : 'Medewerker'}
            </Badge>
          </div>
        </div>
        <dl className="space-y-3 text-sm border-t border-white/8 pt-4">
          <div className="flex justify-between">
            <dt className="text-zinc-500">E-mail</dt>
            <dd className="font-medium text-zinc-200">{profile.email}</dd>
          </div>
          {!isAdmin && (
            <div className="flex justify-between">
              <dt className="text-zinc-500">Uurloon</dt>
              <dd className="font-medium text-zinc-200">€ {Number(profile.hourly_rate).toFixed(2)}</dd>
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
            <p className="text-sm text-emerald-400">{message}</p>
          )}
        </form>
      </Card>
    </div>
  )
}
