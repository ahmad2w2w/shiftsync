import { Navigate } from 'react-router-dom'
import {
  Building2,
  MapPin,
  Navigation,
  Users,
  Clock,
  Bell,
  Lock,
} from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { useOrganization } from '../context/OrganizationContext'
import { PageHeader } from '../components/ui/PageHeader'
import { Card, CardHeader } from '../components/ui/Card'
import { Badge } from '../components/ui/Badge'
import { Input } from '../components/ui/Input'

const sections = [
  {
    icon: Building2,
    title: 'Bedrijfsgegevens',
    description: 'Naam, branche en contactgegevens van je organisatie.',
    available: true,
  },
  {
    icon: MapPin,
    title: 'Locaties & vestigingen',
    description: 'Beheer meerdere werkplekken voor roosters en klokregistratie.',
    badge: 'Business',
  },
  {
    icon: Navigation,
    title: 'GPS-radius',
    description: 'Stel de geofence in voor inklokken op locatie (standaard 100 meter).',
    badge: 'Business',
  },
  {
    icon: Users,
    title: 'Teams & afdelingen',
    description: 'Groepeer medewerkers voor filters en rapportages.',
    badge: 'Pro',
  },
  {
    icon: Clock,
    title: 'Openingstijden',
    description: 'Standaard openingstijden voor automatische dienstsuggesties.',
    badge: 'Pro',
  },
  {
    icon: Bell,
    title: 'Notificaties',
    description: 'E-mail en push voor verlof, rooster en ziekmeldingen.',
    badge: 'Business',
  },
]

export function SettingsPage() {
  const { isAdmin } = useAuth()
  const { organization } = useOrganization()

  if (!isAdmin) return <Navigate to="/app/dashboard" replace />

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <PageHeader
        title="Instellingen"
        subtitle="Beheer bedrijfsgegevens, locaties en voorkeuren"
      />

      <Card>
        <CardHeader title="Bedrijfsgegevens" subtitle="Basisinformatie van je organisatie" />
        <div className="grid gap-4 sm:grid-cols-2">
          <Input label="Bedrijfsnaam" value={organization?.name ?? ''} readOnly />
          <Input label="Organisatie-ID" value={organization?.id ?? ''} readOnly />
        </div>
        <p className="mt-4 text-xs" style={{ color: 'var(--text-muted)' }}>
          Uitgebreide bedrijfsinstellingen worden binnenkort toegevoegd.
        </p>
      </Card>

      <div className="grid gap-4 sm:grid-cols-2">
        {sections.slice(1).map(({ icon: Icon, title, description, badge }) => (
          <Card key={title} className="relative opacity-90">
            <div className="flex items-start gap-3">
              <div
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl"
                style={{ background: 'var(--brand-muted)' }}
              >
                <Icon className="h-5 w-5" style={{ color: 'var(--brand-strong)' }} />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <h3 className="font-semibold" style={{ color: 'var(--text-primary)' }}>{title}</h3>
                  {badge && (
                    <Badge variant="business">
                      <Lock className="mr-1 inline h-3 w-3" />
                      {badge}
                    </Badge>
                  )}
                </div>
                <p className="mt-1 text-sm leading-relaxed" style={{ color: 'var(--text-muted)' }}>
                  {description}
                </p>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  )
}
