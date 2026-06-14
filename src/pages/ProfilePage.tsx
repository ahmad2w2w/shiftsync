import { useState, useRef, type FormEvent } from 'react'
import { useAuth } from '../context/AuthContext'
import { updateUser, uploadAvatar, updatePassword } from '../services/users'
import { Card, CardHeader } from '../components/ui/Card'
import { Input } from '../components/ui/Input'
import { Button } from '../components/ui/Button'
import { Badge } from '../components/ui/Badge'
import { PageHeader } from '../components/ui/PageHeader'
import { useToast } from '../context/ToastContext'
import { Camera } from 'lucide-react'

export function ProfilePage() {
  const { profile, refreshProfile, isAdmin } = useAuth()
  const toast = useToast()
  const fileRef = useRef<HTMLInputElement>(null)
  const [fullName, setFullName] = useState(profile?.full_name ?? '')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [saving, setSaving] = useState(false)
  const [uploading, setUploading] = useState(false)

  const handleSave = async (e: FormEvent) => {
    e.preventDefault()
    if (!profile) return
    setSaving(true)
    try {
      await updateUser(profile.id, { full_name: fullName })
      await refreshProfile()
      toast.success('Profiel opgeslagen')
    } catch {
      toast.error('Opslaan mislukt')
    } finally {
      setSaving(false)
    }
  }

  const handlePassword = async (e: FormEvent) => {
    e.preventDefault()
    if (newPassword.length < 6) {
      toast.error('Wachtwoord moet minimaal 6 tekens zijn')
      return
    }
    if (newPassword !== confirmPassword) {
      toast.error('Wachtwoorden komen niet overeen')
      return
    }
    setSaving(true)
    try {
      await updatePassword(newPassword)
      setNewPassword('')
      setConfirmPassword('')
      toast.success('Wachtwoord gewijzigd')
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Wachtwoord wijzigen mislukt')
    } finally {
      setSaving(false)
    }
  }

  const handleAvatar = async (file: File) => {
    if (!profile) return
    if (!file.type.startsWith('image/')) {
      toast.error('Alleen afbeeldingen zijn toegestaan')
      return
    }
    if (file.size > 2 * 1024 * 1024) {
      toast.error('Maximaal 2 MB')
      return
    }
    setUploading(true)
    try {
      await uploadAvatar(profile.id, file)
      await refreshProfile()
      toast.success('Profielfoto bijgewerkt')
    } catch {
      toast.error('Upload mislukt. Probeer een kleinere afbeelding (max. 2 MB).')
    } finally {
      setUploading(false)
    }
  }

  if (!profile) return null

  return (
    <div className="mx-auto max-w-lg space-y-6">
      <PageHeader title="Profiel" subtitle="Je accountgegevens en beveiliging" />

      <Card>
        <div className="flex items-center gap-4 mb-5">
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            className="group relative flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-2xl transition-opacity hover:opacity-90"
            style={{ background: 'var(--brand-muted)' }}
            aria-label="Profielfoto wijzigen"
          >
            {profile.avatar_url ? (
              <img src={profile.avatar_url} alt="" className="h-full w-full object-cover" />
            ) : (
              <span className="text-xl font-bold" style={{ color: 'var(--brand-strong)' }}>
                {profile.full_name?.[0]?.toUpperCase() ?? '?'}
              </span>
            )}
            <span className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 transition-opacity group-hover:opacity-100">
              <Camera className="h-5 w-5 text-white" />
            </span>
          </button>
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            className="sr-only"
            onChange={(e) => {
              const f = e.target.files?.[0]
              if (f) handleAvatar(f)
              e.target.value = ''
            }}
          />
          <div>
            <p className="font-semibold" style={{ color: 'var(--text-primary)' }}>{profile.full_name}</p>
            <Badge variant={profile.role} className="mt-1">
              {isAdmin ? 'Manager' : 'Medewerker'}
            </Badge>
            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              className="mt-2 block text-xs font-medium text-brand-600 hover:text-brand-700"
              disabled={uploading}
            >
              {uploading ? 'Uploaden…' : 'Foto wijzigen'}
            </button>
          </div>
        </div>
        <dl className="space-y-3 border-t pt-4 text-sm" style={{ borderColor: 'var(--border)' }}>
          <div className="flex justify-between gap-4">
            <dt style={{ color: 'var(--text-muted)' }}>E-mail</dt>
            <dd className="font-medium text-right" style={{ color: 'var(--text-primary)' }}>{profile.email}</dd>
          </div>
          {!isAdmin && (
            <div className="flex justify-between gap-4">
              <dt style={{ color: 'var(--text-muted)' }}>Uurloon</dt>
              <dd className="font-medium" style={{ color: 'var(--text-primary)' }}>€ {Number(profile.hourly_rate).toFixed(2)}</dd>
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
        </form>
      </Card>

      <Card>
        <CardHeader title="Wachtwoord wijzigen" subtitle="Minimaal 6 tekens" />
        <form onSubmit={handlePassword} className="space-y-4">
          <Input
            label="Nieuw wachtwoord"
            type="password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            autoComplete="new-password"
            minLength={6}
          />
          <Input
            label="Bevestig wachtwoord"
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            autoComplete="new-password"
            minLength={6}
          />
          <Button type="submit" variant="secondary" loading={saving}>Wachtwoord opslaan</Button>
        </form>
      </Card>
    </div>
  )
}
