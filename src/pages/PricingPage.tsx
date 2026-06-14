import { Link } from 'react-router-dom'
import { CheckCircle, Zap, ArrowLeft, Star, X } from 'lucide-react'

const plans = [
  {
    name: 'Free',
    price: '€0',
    period: 'per maand',
    desc: 'Perfect om te starten met personeelsplanning.',
    features: [
      'Tot 5 medewerkers',
      'Roosterplanning',
      'Tijdregistratie (in/uitklokken)',
      'Verlofaanvragen & -beheer',
      'Beschikbaarheidsbeheer',
      'Medewerkersdashboard',
    ],
    notIncluded: ['Maandplanner', 'PDF & Excel export', 'E-mailnotificaties'],
    cta: 'Gratis starten',
    href: '/register',
    highlighted: false,
  },
  {
    name: 'Pro',
    price: '€29',
    period: 'per maand',
    desc: 'Voor groeiende horeca- en retailbedrijven.',
    features: [
      'Tot 25 medewerkers',
      'Alles van Free',
      'Maandplanner met sjablonen',
      'Automatisch rooster genereren',
      'PDF & Excel export',
      'Urenoverzicht per medewerker',
      'Prioriteit e-mailsupport',
    ],
    notIncluded: ['E-mailnotificaties'],
    cta: 'Probeer 14 dagen gratis',
    href: '/register?plan=pro',
    highlighted: true,
  },
  {
    name: 'Business',
    price: '€79',
    period: 'per maand',
    desc: 'Voor grote teams en restaurantgroepen.',
    features: [
      'Onbeperkt medewerkers',
      'Alles van Pro',
      'Automatische e-mailnotificaties',
      'Geavanceerde urenrapporten',
      'Prioriteit telefonische support',
      'Persoonlijke onboarding',
    ],
    notIncluded: [],
    cta: 'Contact opnemen',
    href: 'mailto:sales@shiftsync.nl',
    highlighted: false,
  },
]

const comparison: { label: string; values: (boolean | string)[] }[] = [
  { label: 'Medewerkers', values: ['5', '25', 'Onbeperkt'] },
  { label: 'Roosterplanning', values: [true, true, true] },
  { label: 'Tijdregistratie', values: [true, true, true] },
  { label: 'Verlofbeheer', values: [true, true, true] },
  { label: 'Maandplanner', values: [false, true, true] },
  { label: 'PDF & Excel export', values: [false, true, true] },
  { label: 'E-mailnotificaties', values: [false, false, true] },
  { label: 'Persoonlijke onboarding', values: [false, false, true] },
]

const faqs = [
  {
    q: 'Kan ik tussentijds upgraden of downgraden?',
    a: 'Ja, je kunt op elk moment je abonnement aanpassen. Upgrades gaan direct in, downgrades aan het eind van de factureringsperiode.',
  },
  {
    q: 'Zijn er extra kosten per medewerker?',
    a: 'Nee. De prijs is vast per plan, ongeacht het aantal medewerkers binnen de limiet.',
  },
  {
    q: 'Hoe werkt de gratis proefperiode van Pro?',
    a: 'Je krijgt 14 dagen volledige toegang tot Pro, zonder creditcard. Na 14 dagen ga je automatisch terug naar Free als je niet betaalt.',
  },
  {
    q: 'Hoe worden mijn gegevens beveiligd?',
    a: 'Alle data is opgeslagen op Supabase met row-level security: elke organisatie ziet alleen zijn eigen data. Verbindingen zijn versleuteld via HTTPS/TLS.',
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
          <h1 className="text-4xl font-bold tracking-tight" style={{ color: 'var(--color-navy)' }}>Transparante prijzen</h1>
          <p className="mt-4 text-lg" style={{ color: 'var(--text-muted)' }}>Begin gratis. Betaal alleen als je groeit.</p>
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          {plans.map((plan) => (
            <div
              key={plan.name}
              className={`relative flex flex-col rounded-2xl p-7 ${plan.highlighted ? 'shadow-xl ring-2 ring-brand-500/30' : ''}`}
              style={
                plan.highlighted
                  ? { background: 'var(--surface-card)', border: '2px solid rgba(59,130,246,0.35)' }
                  : { background: 'var(--surface-card)', border: '1px solid var(--border)' }
              }
            >
              {plan.highlighted && (
                <div className="absolute -top-3.5 left-1/2 -translate-x-1/2">
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-brand-600 px-3 py-1 text-xs font-bold text-white shadow-lg">
                    <Star className="h-3 w-3 fill-white" />
                    Meest populair
                  </span>
                </div>
              )}

              <h2 className="text-xl font-bold" style={{ color: 'var(--color-navy)' }}>{plan.name}</h2>
              <p className="mt-1 text-sm" style={{ color: 'var(--text-muted)' }}>{plan.desc}</p>

              <div className="mt-6 flex items-end gap-1">
                <span className="text-5xl font-bold tracking-tight" style={{ color: 'var(--color-navy)' }}>{plan.price}</span>
                <span className="mb-1.5 text-sm" style={{ color: 'var(--text-muted)' }}>{plan.period}</span>
              </div>

              <Link
                to={plan.href}
                className={`mt-7 flex w-full items-center justify-center rounded-xl py-3 text-sm font-semibold transition-all ${
                  plan.highlighted ? 'bg-brand-600 text-white hover:bg-brand-700 shadow-md' : 'hover:bg-slate-50'
                }`}
                style={plan.highlighted ? {} : { color: 'var(--color-navy)', border: '1px solid var(--border-strong)' }}
              >
                {plan.cta}
              </Link>

              <div className="mt-7 flex-1">
                <p className="mb-4 text-xs font-semibold uppercase tracking-widest" style={{ color: 'var(--text-muted)' }}>Inbegrepen</p>
                <ul className="space-y-3">
                  {plan.features.map((f) => (
                    <li key={f} className="flex items-start gap-2.5 text-sm">
                      <CheckCircle className="mt-0.5 h-4 w-4 shrink-0 text-brand-600" />
                      <span style={{ color: 'var(--text-secondary)' }}>{f}</span>
                    </li>
                  ))}
                  {plan.notIncluded.map((f) => (
                    <li key={f} className="flex items-start gap-2.5 text-sm opacity-50">
                      <X className="mt-0.5 h-4 w-4 shrink-0" style={{ color: 'var(--text-disabled)' }} />
                      <span style={{ color: 'var(--text-muted)' }}>{f}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-24">
          <h2 className="mb-10 text-center text-2xl font-bold" style={{ color: 'var(--color-navy)' }}>Functies vergelijken</h2>
          <div className="mx-auto max-w-3xl overflow-hidden rounded-2xl" style={{ border: '1px solid var(--border)', background: 'var(--surface-card)' }}>
            <div className="grid grid-cols-4 gap-2 px-5 py-3 text-xs font-semibold uppercase tracking-wider" style={{ background: 'var(--surface-subtle)', color: 'var(--text-muted)', borderBottom: '1px solid var(--border)' }}>
              <span />
              <span className="text-center">Free</span>
              <span className="text-center">Pro</span>
              <span className="text-center">Business</span>
            </div>
            {comparison.map((row, i) => (
              <div
                key={row.label}
                className="grid grid-cols-4 items-center gap-2 px-5 py-3.5 text-sm"
                style={{
                  background: i % 2 === 0 ? 'var(--surface-page)' : 'var(--surface-card)',
                  borderBottom: i < comparison.length - 1 ? '1px solid var(--border)' : 'none',
                }}
              >
                <span className="col-span-1 font-medium" style={{ color: 'var(--text-primary)' }}>{row.label}</span>
                {row.values.map((v, idx) => (
                  <span key={idx} className="text-center">
                    {v === true ? (
                      <CheckCircle className="mx-auto h-4 w-4 text-brand-600" />
                    ) : v === false ? (
                      <X className="mx-auto h-4 w-4" style={{ color: 'var(--text-disabled)' }} />
                    ) : (
                      <span style={{ color: 'var(--text-secondary)' }}>{v}</span>
                    )}
                  </span>
                ))}
              </div>
            ))}
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

        <div className="mt-20 text-center">
          <p style={{ color: 'var(--text-muted)' }}>Nog vragen?{' '}
            <a href="mailto:support@shiftsync.nl" className="font-medium text-brand-600 hover:text-brand-700 transition-colors">
              Neem contact op
            </a>
          </p>
        </div>
      </div>
    </div>
  )
}
