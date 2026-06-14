import { useEffect, useState, type FormEvent } from 'react'
import { Navigate } from 'react-router-dom'
import { MapPin, Navigation, Trash2, Plus } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { useOrganization } from '../context/OrganizationContext'
import { useToast } from '../context/ToastContext'
import {
  getLocations,
  createLocation,
  deleteLocation,
  updateOrganizationGps,
} from '../services/locations'
import type { Location } from '../types/database'
import { PageHeader } from '../components/ui/PageHeader'
import { HelpTooltip } from '../components/ui/Tooltip'
import { Card, CardHeader } from '../components/ui/Card'
import { Badge } from '../components/ui/Badge'
import { Input } from '../components/ui/Input'
import { Button } from '../components/ui/Button'

export function SettingsPage() {
  const { isAdmin } = useAuth()
  const { organization, refreshOrganization } = useOrganization()
  const toast = useToast()
  const [locations, setLocations] = useState<Location[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [gpsEnabled, setGpsEnabled] = useState(false)
  const [gpsRadius, setGpsRadius] = useState('100')
  const [showForm, setShowForm] = useState(false)
  const [locForm, setLocForm] = useState({
    name: '',
    address: '',
    latitude: '',
    longitude: '',
    radius_meters: '100',
    is_primary: true,
  })

  const canUseGps = true

  const load = async () => {
    if (!organization) return
    setLoading(true)
    try {
      const locs = await getLocations(organization.id)
      setLocations(locs)
      setGpsEnabled(organization.gps_enabled ?? false)
      setGpsRadius(String(organization.gps_radius_meters ?? 100))
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (organization) load()
  }, [organization?.id])

  if (!isAdmin) return <Navigate to="/app/dashboard" replace />

  const handleGpsSave = async (e: FormEvent) => {
    e.preventDefault()
    if (!organization) return
    setSaving(true)
    try {
      await updateOrganizationGps(organization.id, {
        gps_enabled: gpsEnabled,
        gps_radius_meters: parseInt(gpsRadius, 10) || 100,
      })
      await refreshOrganization()
      toast.success('GPS-instellingen opgeslagen')
    } catch {
      toast.error('Opslaan mislukt')
    } finally {
      setSaving(false)
    }
  }

  const handleAddLocation = async (e: FormEvent) => {
    e.preventDefault()
    if (!organization) return
    setSaving(true)
    try {
      await createLocation({
        organization_id: organization.id,
        name: locForm.name,
        address: locForm.address || null,
        latitude: parseFloat(locForm.latitude),
        longitude: parseFloat(locForm.longitude),
        radius_meters: parseInt(locForm.radius_meters, 10) || 100,
        is_primary: locForm.is_primary,
      })
      setLocForm({ name: '', address: '', latitude: '', longitude: '', radius_meters: '100', is_primary: locations.length === 0 })
      setShowForm(false)
      toast.success('Locatie toegevoegd')
      load()
    } catch {
      toast.error('Locatie toevoegen mislukt')
    } finally {
      setSaving(false)
    }
  }

  const handleDeleteLocation = async (id: string) => {
    try {
      await deleteLocation(id)
      toast.success('Locatie verwijderd')
      load()
    } catch {
      toast.error('Verwijderen mislukt')
    }
  }

  const useCurrentPosition = () => {
    if (!navigator.geolocation) {
      toast.error('Geolocatie niet beschikbaar')
      return
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLocForm((f) => ({
          ...f,
          latitude: pos.coords.latitude.toFixed(6),
          longitude: pos.coords.longitude.toFixed(6),
        }))
        toast.success('Huidige locatie ingevuld')
      },
      () => toast.error('Kon locatie niet ophalen')
    )
  }

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <PageHeader title="Instellingen" subtitle="Bedrijfsgegevens, locaties en GPS-inklokken" />

      <Card>
        <CardHeader title="Bedrijfsgegevens" />
        <div className="grid gap-4 sm:grid-cols-2">
          <Input label="Bedrijfsnaam" value={organization?.name ?? ''} readOnly />
          <Input label="Abonnement" value={organization?.plan?.toUpperCase() ?? ''} readOnly />
        </div>
      </Card>

      <Card>
        <CardHeader
          title="Locaties & vestigingen"
          subtitle="Werkplekken voor GPS-controle bij inklokken"
          action={
            <Button size="sm" variant="secondary" onClick={() => setShowForm(!showForm)}>
              <Plus className="h-4 w-4" /> Locatie
            </Button>
          }
        />

        {!canUseGps ? null : loading ? (
          <p className="text-sm" style={{ color: 'var(--text-muted)' }}>Laden…</p>
        ) : (
          <>
            {showForm && (
              <form onSubmit={handleAddLocation} className="mb-5 grid gap-4 rounded-xl p-4 sm:grid-cols-2" style={{ background: 'var(--surface-subtle)', border: '1px solid var(--border)' }}>
                <Input label="Naam" value={locForm.name} onChange={(e) => setLocForm({ ...locForm, name: e.target.value })} required />
                <Input label="Adres" value={locForm.address} onChange={(e) => setLocForm({ ...locForm, address: e.target.value })} />
                <Input label="Latitude" value={locForm.latitude} onChange={(e) => setLocForm({ ...locForm, latitude: e.target.value })} required />
                <Input label="Longitude" value={locForm.longitude} onChange={(e) => setLocForm({ ...locForm, longitude: e.target.value })} required />
                <Input label="Radius (meter)" type="number" value={locForm.radius_meters} onChange={(e) => setLocForm({ ...locForm, radius_meters: e.target.value })} />
                <div className="flex items-end sm:col-span-2">
                  <Button type="button" variant="secondary" size="sm" onClick={useCurrentPosition}>
                    <Navigation className="h-4 w-4" /> Huidige GPS-locatie
                  </Button>
                </div>
                <div className="flex gap-2 sm:col-span-2">
                  <Button type="submit" loading={saving}>Opslaan</Button>
                  <Button type="button" variant="secondary" onClick={() => setShowForm(false)}>Annuleren</Button>
                </div>
              </form>
            )}

            {locations.length === 0 ? (
              <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
                Nog geen locaties. Voeg je werkplek toe om GPS-inklokken te activeren.
              </p>
            ) : (
              <ul className="space-y-2">
                {locations.map((loc) => (
                  <li
                    key={loc.id}
                    className="flex items-center justify-between gap-3 rounded-xl px-4 py-3"
                    style={{ background: 'var(--surface-subtle)', border: '1px solid var(--border)' }}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <MapPin className="h-4 w-4 shrink-0" style={{ color: 'var(--brand)' }} />
                      <div className="min-w-0">
                        <p className="font-medium truncate" style={{ color: 'var(--text-primary)' }}>
                          {loc.name}
                          {loc.is_primary && (
                            <Badge variant="scheduled" className="ml-2">Primair</Badge>
                          )}
                        </p>
                        <p className="text-xs truncate" style={{ color: 'var(--text-muted)' }}>
                          {loc.latitude}, {loc.longitude} · {loc.radius_meters}m radius
                        </p>
                      </div>
                    </div>
                    <Button size="sm" variant="danger" onClick={() => handleDeleteLocation(loc.id)}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </li>
                ))}
              </ul>
            )}
          </>
        )}
      </Card>

      {canUseGps && (
        <Card>
          <CardHeader title="GPS-inklokken" subtitle="Medewerkers moeten op locatie zijn om in én uit te klokken" />
          <form onSubmit={handleGpsSave} className="space-y-4">
            <label className="flex cursor-pointer items-center gap-3">
              <input
                type="checkbox"
                checked={gpsEnabled}
                onChange={(e) => setGpsEnabled(e.target.checked)}
                className="h-4 w-4 rounded border-gray-300"
              />
              <span className="flex items-center gap-2 text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
                GPS-controle inschakelen
                <HelpTooltip text="Medewerkers moeten binnen de ingestelde radius van de werkplek zijn om in en uit te klokken. Locatie wordt alleen op het moment van klokken opgevraagd." />
              </span>
            </label>
            <div className="flex items-end gap-2">
              <div className="flex-1">
                <Input
                  label="Standaard radius (meter)"
                  type="number"
                  min={25}
                  max={500}
                  value={gpsRadius}
                  onChange={(e) => setGpsRadius(e.target.value)}
                />
              </div>
              <HelpTooltip text="Radius in meters rondom de ingestelde GPS-coördinaten van je werkplek. Typisch 50–150m voor horeca." className="mb-2.5" />
            </div>
            <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
              Medewerkers zien bij in- én uitklokken: &quot;Je moet binnen {gpsRadius || 100} meter van de locatie zijn.&quot;
            </p>
            <Button type="submit" loading={saving}>Instellingen opslaan</Button>
          </form>
        </Card>
      )}
    </div>
  )
}
