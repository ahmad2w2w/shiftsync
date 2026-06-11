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
    <div className="min-h-screen" style={{ background: '#09090b' }}>
      {/* Navbar */}
      <header
        className="sticky top-0 z-40 backdrop-blur-md"
        style={{ background: 'rgba(9,9,11,0.92)', borderBottom: '1px solid rgba(255,255,255,0.07)' }}
      >
        <div className="mx-auto flex max-w-7xl items-center justify-between px-5 py-4">
          <Link to="/" className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-brand-600 shadow-md shadow-brand-600/30">
              <Zap className="h-4 w-4 text-white" />
            </div>
            <span className="text-base font-bold text-white">ShiftSync</span>
          </Link>
          <div className="flex items-center gap-3">
            <Link to="/login" className="text-sm text-zinc-500 hover:text-white transition-colors">Inloggen</Link>
            <Link
              to="/register"
              className="rounded-xl bg-brand-600 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-500 transition-colors"
            >
              Gratis starten
            </Link>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-7xl px-5 py-16">
        <Link to="/" className="mb-10 inline-flex items-center gap-1.5 text-sm text-zinc-600 hover:text-white transition-colors">
          <ArrowLeft className="h-4 w-4" />
          Terug naar home
        </Link>

        <div className="mb-16 text-center">
          <p className="mb-3 text-sm font-semibold uppercase tracking-widest text-brand-500">Prijzen</p>
          <h1 className="text-4xl font-bold tracking-tight text-white">Transparante prijzen</h1>
          <p className="mt-4 text-lg text-zinc-500">Begin gratis. Betaal alleen als je groeit.</p>
        </div>

        {/* Plans */}
        <div className="grid gap-6 lg:grid-cols-3">
          {plans.map((plan) => (
            <div
              key={plan.name}
              className="relative flex flex-col rounded-2xl p-7"
              style={
                plan.highlighted
                  ? { background: '#0f1825', border: '2px solid rgba(37,99,235,0.5)', boxShadow: '0 0 40px rgba(37,99,235,0.12)' }
                  : { background: '#111113', border: '1px solid rgba(255,255,255,0.08)' }
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

              <h2 className="text-xl font-bold text-white">{plan.name}</h2>
              <p className="mt-1 text-sm text-zinc-500">{plan.desc}</p>

              <div className="mt-6 flex items-end gap-1">
                <span className="text-5xl font-bold tracking-tight text-white">{plan.price}</span>
                <span className="mb-1.5 text-sm text-zinc-500">{plan.period}</span>
              </div>

              <Link
                to={plan.href}
                className={`mt-7 flex w-full items-center justify-center rounded-xl py-3 text-sm font-semibold transition-all ${
                  plan.highlighted
                    ? 'bg-brand-600 text-white hover:bg-brand-500 shadow-md shadow-brand-600/25'
                    : 'text-zinc-300 hover:bg-white/6'
                }`}
                style={plan.highlighted ? {} : { border: '1px solid rgba(255,255,255,0.1)' }}
              >
                {plan.cta}
              </Link>

              <div className="mt-7 flex-1">
                <p className="mb-4 text-xs font-semibold uppercase tracking-widest text-zinc-600">
                  Inbegrepen
                </p>
                <ul className="space-y-3">
                  {plan.features.map((f) => (
                    <li key={f} className="flex items-start gap-2.5 text-sm">
                      <CheckCircle className="mt-0.5 h-4 w-4 shrink-0 text-brand-500" />
                      <span className="text-zinc-300">{f}</span>
                    </li>
                  ))}
                  {plan.notIncluded.map((f) => (
                    <li key={f} className="flex items-start gap-2.5 text-sm opacity-30">
                      <X className="mt-0.5 h-4 w-4 shrink-0 text-zinc-500" />
                      <span className="text-zinc-500">{f}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          ))}
        </div>

        {/* FAQ */}
        <div className="mt-24">
          <h2 className="mb-12 text-center text-2xl font-bold text-white">
            Veelgestelde vragen
          </h2>
          <div className="mx-auto max-w-3xl grid gap-4 sm:grid-cols-2">
            {faqs.map(({ q, a }) => (
              <div
                key={q}
                className="rounded-2xl p-6"
                style={{ background: '#111113', border: '1px solid rgba(255,255,255,0.07)' }}
              >
                <h3 className="mb-2 font-semibold text-zinc-100">{q}</h3>
                <p className="text-sm leading-relaxed text-zinc-500">{a}</p>
              </div>
            ))}
          </div>
        </div>

        {/* CTA */}
        <div className="mt-20 text-center">
          <p className="text-zinc-500">Nog vragen?{' '}
            <a href="mailto:support@shiftsync.nl" className="text-brand-400 hover:text-brand-300 transition-colors">
              Neem contact op
            </a>
          </p>
        </div>
      </div>
    </div>
  )
}
