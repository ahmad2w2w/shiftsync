import { Link } from 'react-router-dom'
import { CheckCircle, Zap, ArrowLeft } from 'lucide-react'
import { PRODUCT } from '../types/database'

const faqs = [
  {
    q: 'Waarom per medewerker?',
    a: 'Zo betaal je alleen voor wat je gebruikt. Eén team van 5 medewerkers kost €15 per maand, een team van 20 kost €60.',
  },
  {
    q: 'Zitten alle functies in het pakket?',
    a: 'Ja. Maandplanner, export, GPS-inklokken, notificaties en rapportages — alles is inbegrepen. Geen Pro of Business tiers.',
  },
  {
    q: 'Kan ik op elk moment opzeggen?',
    a: 'Ja. Je kunt je abonnement maandelijks beheren en opzeggen via het Stripe klantportaal.',
  },
  {
    q: 'Hoe worden mijn gegevens beveiligd?',
    a: 'Alle data is opgeslagen op Supabase met row-level security: elke organisatie ziet alleen zijn eigen data.',
  },
]

export function PricingPage() {
  return (
    <div className="marketing-light min-h-screen">
      <header className="sticky top-0 z-40 backdrop-blur-xl" style={{ background: 'rgba(255,255,255,0.85)', borderBottom: '1px solid var(--border)' }}>
        <div className="mx-auto flex max-w-7xl items-center justify-between px-5 py-4">
          <Link to="/" className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-brand-600 shadow-md shadow-brand-600/25">
              <Zap className="h-4 w-4 text-white" />
            </div>
            <span className="text-base font-bold" style={{ color: 'var(--color-navy)' }}>ShiftSync</span>
          </Link>
          <div className="flex items-center gap-3">
            <Link to="/login" className="text-sm font-medium transition-colors hover:text-brand-600" style={{ color: 'var(--text-secondary)' }}>Inloggen</Link>
            <Link to="/register" className="rounded-xl bg-brand-600 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-700 transition-colors">
              Gratis starten
            </Link>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-7xl px-5 py-16">
        <Link to="/" className="mb-10 inline-flex items-center gap-1.5 text-sm transition-colors hover:text-brand-600" style={{ color: 'var(--text-muted)' }}>
          <ArrowLeft className="h-4 w-4" />
          Terug naar home
        </Link>

        <div className="mb-16 text-center">
          <p className="mb-3 text-sm font-semibold uppercase tracking-widest text-brand-600">Prijzen</p>
          <h1 className="text-4xl font-bold tracking-tight" style={{ color: 'var(--color-navy)' }}>Eén pakket. Alles inbegrepen.</h1>
          <p className="mt-4 text-lg" style={{ color: 'var(--text-muted)' }}>
            €{PRODUCT.pricePerEmployee} per medewerker per maand — geen Pro, geen Business, geen verrassingen.
          </p>
        </div>

        <div className="mx-auto max-w-lg">
          <div className="rounded-2xl p-8 shadow-xl ring-2 ring-brand-500/30" style={{ background: 'var(--surface-card)' }}>
            <h2 className="text-2xl font-bold" style={{ color: 'var(--color-navy)' }}>{PRODUCT.name}</h2>
            <p className="mt-1 text-sm" style={{ color: 'var(--text-muted)' }}>Volledige personeelsplanning voor modern teams</p>
            <div className="mt-6 flex items-end gap-1">
              <span className="text-5xl font-bold tracking-tight" style={{ color: 'var(--color-navy)' }}>{PRODUCT.priceLabel}</span>
              <span className="mb-1.5 text-sm" style={{ color: 'var(--text-muted)' }}>/ medewerker / maand</span>
            </div>
            <p className="mt-2 text-sm" style={{ color: 'var(--text-muted)' }}>
              Voorbeeld: 10 medewerkers = €{10 * PRODUCT.pricePerEmployee}/maand
            </p>
            <Link
              to="/register"
              className="mt-8 flex w-full items-center justify-center rounded-xl bg-brand-600 py-3.5 text-sm font-semibold text-white shadow-md hover:bg-brand-700 transition-all"
            >
              Gratis starten
            </Link>
            <ul className="mt-8 space-y-3">
              {PRODUCT.features.map((f) => (
                <li key={f} className="flex items-start gap-2.5 text-sm">
                  <CheckCircle className="mt-0.5 h-4 w-4 shrink-0 text-brand-600" />
                  <span style={{ color: 'var(--text-secondary)' }}>{f}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="mt-24">
          <h2 className="mb-12 text-center text-2xl font-bold" style={{ color: 'var(--color-navy)' }}>Veelgestelde vragen</h2>
          <div className="mx-auto max-w-3xl grid gap-4 sm:grid-cols-2">
            {faqs.map(({ q, a }) => (
              <div key={q} className="rounded-2xl p-6" style={{ background: 'var(--surface-card)', border: '1px solid var(--border)' }}>
                <h3 className="mb-2 font-semibold" style={{ color: 'var(--color-navy)' }}>{q}</h3>
                <p className="text-sm leading-relaxed" style={{ color: 'var(--text-muted)' }}>{a}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
