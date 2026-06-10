import { Link } from 'react-router-dom'
import { CheckCircle, Zap, ArrowLeft, Star } from 'lucide-react'

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
    <div className="min-h-screen bg-white">
      {/* Navbar */}
      <header className="border-b border-gray-100 bg-white/90 backdrop-blur-sm sticky top-0 z-40">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 sm:px-6 lg:px-8">
          <Link to="/" className="flex items-center gap-2 text-navy-900">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-600">
              <Zap className="h-4 w-4 text-white" />
            </div>
            <span className="text-lg font-bold">ShiftSync</span>
          </Link>
          <div className="flex items-center gap-3">
            <Link to="/login" className="text-sm text-gray-500 hover:text-navy-900">Inloggen</Link>
            <Link to="/register" className="rounded-lg bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700">
              Gratis starten
            </Link>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        <Link to="/" className="mb-8 inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-navy-900">
          <ArrowLeft className="h-4 w-4" />
          Terug naar home
        </Link>

        <div className="text-center mb-16">
          <h1 className="text-4xl font-bold text-navy-900">Transparante prijzen</h1>
          <p className="mt-4 text-lg text-gray-500">Begin gratis. Betaal alleen als je groeit.</p>
        </div>

        <div className="grid gap-8 lg:grid-cols-3">
          {plans.map((plan) => (
            <div
              key={plan.name}
              className={`rounded-2xl p-8 ${
                plan.highlighted
                  ? 'bg-navy-900 ring-2 ring-brand-500 shadow-2xl'
                  : 'border border-gray-200 bg-white shadow-sm'
              }`}
            >
              {plan.highlighted && (
                <div className="mb-4 inline-flex items-center gap-1.5 rounded-full bg-brand-600 px-3 py-1 text-xs font-semibold text-white">
                  <Star className="h-3 w-3 fill-white" />
                  Meest populair
                </div>
              )}
              <h2 className={`text-2xl font-bold ${plan.highlighted ? 'text-white' : 'text-navy-900'}`}>
                {plan.name}
              </h2>
              <p className={`mt-1 text-sm ${plan.highlighted ? 'text-navy-300' : 'text-gray-500'}`}>
                {plan.desc}
              </p>
              <div className="mt-6 flex items-end gap-1">
                <span className={`text-5xl font-bold ${plan.highlighted ? 'text-white' : 'text-navy-900'}`}>
                  {plan.price}
                </span>
                <span className={`mb-1.5 ${plan.highlighted ? 'text-navy-300' : 'text-gray-500'}`}>
                  {plan.period}
                </span>
              </div>

              <Link
                to={plan.href}
                className={`mt-8 flex w-full items-center justify-center rounded-xl py-3.5 text-sm font-semibold transition-colors ${
                  plan.highlighted
                    ? 'bg-brand-600 text-white hover:bg-brand-700'
                    : 'border-2 border-navy-200 text-navy-900 hover:border-brand-500 hover:text-brand-700'
                }`}
              >
                {plan.cta}
              </Link>

              <div className="mt-8">
                <p className={`mb-4 text-xs font-semibold uppercase tracking-wide ${plan.highlighted ? 'text-navy-300' : 'text-gray-400'}`}>
                  Inbegrepen
                </p>
                <ul className="space-y-3">
                  {plan.features.map((f) => (
                    <li key={f} className="flex items-start gap-2.5 text-sm">
                      <CheckCircle className={`mt-0.5 h-4 w-4 shrink-0 ${plan.highlighted ? 'text-brand-400' : 'text-brand-600'}`} />
                      <span className={plan.highlighted ? 'text-navy-200' : 'text-gray-700'}>{f}</span>
                    </li>
                  ))}
                  {plan.notIncluded.map((f) => (
                    <li key={f} className="flex items-start gap-2.5 text-sm opacity-40">
                      <div className={`mt-0.5 h-4 w-4 shrink-0 rounded-full border-2 ${plan.highlighted ? 'border-navy-600' : 'border-gray-300'}`} />
                      <span className={plan.highlighted ? 'text-navy-400' : 'text-gray-400'}>{f}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          ))}
        </div>

        {/* FAQ */}
        <div className="mt-24">
          <h2 className="text-2xl font-bold text-navy-900 text-center mb-12">
            Veelgestelde vragen
          </h2>
          <div className="mx-auto max-w-3xl grid gap-6 sm:grid-cols-2">
            {faqs.map(({ q, a }) => (
              <div key={q} className="rounded-xl border border-gray-100 bg-gray-50 p-6">
                <h3 className="font-semibold text-navy-900 mb-2">{q}</h3>
                <p className="text-sm text-gray-500 leading-relaxed">{a}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
