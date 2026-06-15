import { useState } from 'react'
import { Megaphone, Send } from 'lucide-react'
import { Sheet } from '../ui/Sheet'
import { Button } from '../ui/Button'
import { Input } from '../ui/Input'
import { useOrganization } from '../../context/OrganizationContext'
import { useToast } from '../../context/ToastContext'
import { getAllUsers } from '../../services/users'
import { createNotificationsBulk } from '../../services/notifications'

export function AnnouncementModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { organization } = useOrganization()
  const toast = useToast()
  const [title, setTitle] = useState('')
  const [body, setBody] = useState('')
  const [sending, setSending] = useState(false)

  const send = async () => {
    if (!organization || !title.trim()) return
    setSending(true)
    try {
      const users = await getAllUsers()
      const recipients = users.filter((u) => u.role === 'employee')
      if (recipients.length === 0) {
        toast.info('Geen medewerkers om te informeren')
        return
      }
      await createNotificationsBulk(
        recipients.map((u) => ({
          organizationId: organization.id,
          userId: u.id,
          type: 'announcement' as const,
          title: title.trim(),
          body: body.trim() || undefined,
          link: '/app/dashboard',
        }))
      )
      toast.success(`Mededeling verstuurd naar ${recipients.length} medewerker${recipients.length !== 1 ? 's' : ''}`)
      setTitle('')
      setBody('')
      onClose()
    } catch {
      toast.error('Versturen mislukt')
    } finally {
      setSending(false)
    }
  }

  return (
    <Sheet open={open} onClose={onClose} title="Mededeling versturen">
      <div className="space-y-4 p-5">
        <div className="flex items-center gap-3 rounded-xl px-4 py-3" style={{ background: 'var(--brand-muted)' }}>
          <Megaphone className="h-5 w-5" style={{ color: 'var(--brand-strong)' }} />
          <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
            Dit verschijnt in de meldingen van al je medewerkers.
          </p>
        </div>
        <Input label="Titel" placeholder="Bijv. Personeelsuitje vrijdag" value={title} onChange={(e) => setTitle(e.target.value)} />
        <div>
          <label className="mb-1.5 block text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>Bericht (optioneel)</label>
          <textarea
            value={body}
            onChange={(e) => setBody(e.target.value)}
            rows={4}
            placeholder="Voeg meer details toe..."
            className="w-full rounded-xl px-3 py-2.5 text-sm outline-none transition-shadow focus:shadow-[var(--focus-ring)]"
            style={{ background: 'var(--surface-card)', border: '1px solid var(--border)', color: 'var(--text-primary)' }}
          />
        </div>
        <div className="flex gap-2">
          <Button onClick={send} loading={sending} disabled={!title.trim()}>
            <Send className="h-4 w-4" /> Versturen
          </Button>
          <Button variant="secondary" onClick={onClose}>Annuleren</Button>
        </div>
      </div>
    </Sheet>
  )
}
