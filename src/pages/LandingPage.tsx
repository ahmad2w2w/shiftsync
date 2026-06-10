import { Link } from 'react-router-dom'
import {
  Calendar,
  Clock,
  Users,
  BarChart3,
  Zap,
  CheckCircle,
  ArrowRight,
  Star,
  Timer,
  Palmtree,
  Bell,
} from 'lucide-react'

const features = [
  {
    icon: Calendar,
    title: 'Slimme roosterplanning',
    desc: 'Plan maandelijkse roosters met drag-and-drop. Automatisch gegenereerd op basis van sjablonen en beschikbaarheid.',
  },
  {
    icon: Clock,
    title: 'Tijdregistratie',
    desc: 'Medewerkers klokken in en uit via de app. Alle uren worden automatisch bijgehouden en berekend.',
  },
  {
    icon: Users,
    title: 'Teambeheer',
    desc: 'Medewerkers toevoegen, rollen instellen en functies beheren. Alles op één plek.',
  },
  {
    icon: Palmtree,
    title: 'Verlofbeheer',
    desc: 'Medewerkers vragen verlof aan, managers keuren goed. Automatisch verwerkt in het rooster.',
  },
  {
    icon: BarChart3,
    title: 'Urenoverzicht & export',
    desc: 'Gedetailleerde urenrapporten per medewerker. Exporteer naar Excel of PDF voor de loonadministratie.',
  },
  {
    icon: Bell,
    title: 'E-mailnotificaties',
    desc: 'Medewerkers ontvangen automatisch een e-mail bij roosterpublicatie of verlofbeslissing.',
  },
]

const plans = [
  {
    name: 'Free',
    price: '€0',
    period: 'per maand',
    desc: 'Perfect om te beginnen',
    features: [
      'Tot 5 medewerkers',
      'Roosterbeheer',
      'Tijdregistratie',
      'Verlofbeheer',
      'Beschikbaarheidsbeheer',
    ],
    cta: 'Gratis starten',
    href: '/register',
    highlighted: false,
  },
  {
    name: 'Pro',
    price: '€29',
    period: 'per maand',
    desc: 'Voor groeiende teams',
    features: [
      'Tot 25 medewerkers',
      'Alles van Free',
      'Maandplanner met sjablonen',
      'PDF & Excel export',
      'Prioriteit support',
    ],
    cta: 'Probeer 14 dagen gratis',
    href: '/register?plan=pro',
    highlighted: true,
  },
  {
    name: 'Business',
    price: '€79',
    period: 'per maand',
    desc: 'Voor grote organisaties',
    features: [
      'Onbeperkt medewerkers',
      'Alles van Pro',
      'E-mailnotificaties',
      'Geavanceerde rapporten',
      'Prioriteit support',
    ],
    cta: 'Contact opnemen',
    href: '/register?plan=business',
    highlighted: false,
  },
]

const testimonials = [
  {
    name: 'Sarah van den Berg',
    role: 'Eigenaar, Bistro de Linde',
    text: 'ShiftSync heeft ons roosterproces compleet getransformeerd. Wat vroeger uren kostte, is nu in minuten gedaan.',
    stars: 5,
  },
  {
    name: 'Marco Jansen',
    role: 'Vestigingsmanager, Coffeebar Central',
    text: 'Eindelijk een app die medewerkers ook echt gebruiken. De in/uitklok functie is super handig.',
    stars: 5,
  },
  {
    name: 'Fatima El Amrani',
    role: 'HR Manager, Restaurantgroep Noord',
    text: 'De Excel-export bespaart ons elke maand uren aan loonadministratie. Absolute aanrader.',
    stars: 5,
  },
]

export function LandingPage() {
  return (
    <div className="min-h-screen bg-white">
      {/* Navbar */}
      <header className="fixed inset-x-0 top-0 z-50 border-b border-white/10 bg-navy-950/90 backdrop-blur-md">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-600">
              <Zap className="h-4 w-4 text-white" />
            </div>
            <span className="text-lg font-bold text-white">ShiftSync</span>
          </div>
          <nav className="hidden items-center gap-8 md:flex">
            <a href="#features" className="text-sm text-navy-300 hover:text-white transition-colors">
              Functies
            </a>
            <Link to="/pricing" className="text-sm text-navy-300 hover:text-white transition-colors">
              Prijzen
            </Link>
            <Link to="/login" className="text-sm text-navy-300 hover:text-white transition-colors">
              Inloggen
            </Link>
            <Link
              to="/register"
              className="rounded-lg bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700 transition-colors"
            >
              Gratis starten
            </Link>
          </nav>
          <div className="flex items-center gap-3 md:hidden">
            <Link to="/login" className="text-sm text-navy-300">
              Inloggen
            </Link>
            <Link
              to="/register"
              className="rounded-lg bg-brand-600 px-3 py-1.5 text-sm font-medium text-white"
            >
              Starten
            </Link>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="gradient-hero px-4 pb-24 pt-32 sm:px-6 sm:pt-40 lg:px-8">
        <div className="mx-auto max-w-4xl text-center">
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-4 py-1.5 text-sm text-white/80">
            <Zap className="h-3.5 w-3.5 text-brand-400" />
            Personeelsplanning voor horeca & retail
          </div>
          <h1 className="text-4xl font-bold tracking-tight text-white sm:text-5xl lg:text-6xl">
            Slimmer plannen,{' '}
            <span className="bg-gradient-to-r from-brand-400 to-blue-400 bg-clip-text text-transparent">
              minder stress
            </span>
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-lg text-navy-200">
            ShiftSync is het complete personeelsbeheersysteem voor restaurants, cafés en retailers.
            Roosters, verlof, uren en tijdregistratie — alles op één plek.
          </p>
          <div className="mt-10 flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
            <Link
              to="/register"
              className="flex items-center gap-2 rounded-xl bg-brand-600 px-8 py-3.5 text-base font-semibold text-white shadow-lg hover:bg-brand-700 transition-all hover:shadow-brand-600/25 hover:shadow-xl"
            >
              Gratis beginnen
              <ArrowRight className="h-4 w-4" />
            </Link>
            <a
              href="#features"
              className="flex items-center gap-2 rounded-xl border border-white/20 px-8 py-3.5 text-base font-medium text-white hover:bg-white/10 transition-colors"
            >
              Bekijk functies
            </a>
          </div>
          <p className="mt-4 text-sm text-navy-400">
            Geen creditcard nodig · Gratis tot 5 medewerkers
          </p>
        </div>

        {/* App preview */}
        <div className="mx-auto mt-16 max-w-5xl">
          <div className="rounded-2xl border border-white/10 bg-white/5 p-2 shadow-2xl">
            <div className="rounded-xl bg-gray-50 p-6">
              <div className="grid gap-4 sm:grid-cols-3">
                {[
                  { label: 'Medewerkers', value: '12', icon: Users, color: 'bg-brand-100 text-brand-700' },
                  { label: 'Ingeklokt', value: '5', icon: Timer, color: 'bg-emerald-100 text-emerald-700' },
                  { label: 'Open verlof', value: '2', icon: Palmtree, color: 'bg-amber-100 text-amber-700' },
                ].map(({ label, value, icon: Icon, color }) => (
                  <div key={label} className="rounded-xl bg-white p-4 shadow-sm border border-gray-100">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-xs text-gray-500">{label}</p>
                        <p className="text-2xl font-bold text-navy-900">{value}</p>
                      </div>
                      <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${color}`}>
                        <Icon className="h-5 w-5" />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              <div className="mt-4 rounded-xl bg-white p-4 shadow-sm border border-gray-100">
                <p className="mb-3 text-sm font-semibold text-navy-900">Rooster deze week</p>
                <div className="grid grid-cols-7 gap-1">
                  {['Ma', 'Di', 'Wo', 'Do', 'Vr', 'Za', 'Zo'].map((dag, i) => (
                    <div key={dag} className="text-center">
                      <p className="text-xs text-gray-400 mb-1">{dag}</p>
                      <div className={`rounded-lg p-1.5 text-xs font-medium ${i < 5 ? 'bg-brand-100 text-brand-700' : 'bg-gray-100 text-gray-400'}`}>
                        {i < 5 ? `${2 + i}` : '—'}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Social proof */}
      <section className="border-y border-gray-100 bg-gray-50 py-12">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <p className="text-center text-sm font-medium text-gray-400 uppercase tracking-wider mb-8">
            Vertrouwd door bedrijven in heel Nederland
          </p>
          <div className="flex flex-wrap items-center justify-center gap-x-12 gap-y-4">
            {['Restaurant Noord', 'Café de Hoek', 'Bistro Linde', 'Sushi Bar X', 'Bakery 24'].map((name) => (
              <span key={name} className="text-gray-400 font-semibold text-sm">
                {name}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="py-24 px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-navy-900 sm:text-4xl">
              Alles wat je nodig hebt
            </h2>
            <p className="mt-4 text-lg text-gray-500">
              Van roosterplanning tot loonadministratie — ShiftSync dekt het allemaal.
            </p>
          </div>
          <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
            {features.map(({ icon: Icon, title, desc }) => (
              <div
                key={title}
                className="group rounded-2xl border border-gray-100 bg-white p-6 shadow-sm hover:shadow-md hover:border-brand-200 transition-all"
              >
                <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-brand-50 group-hover:bg-brand-100 transition-colors">
                  <Icon className="h-6 w-6 text-brand-600" />
                </div>
                <h3 className="font-semibold text-navy-900 mb-2">{title}</h3>
                <p className="text-sm text-gray-500 leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="py-24 px-4 bg-gray-50 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-navy-900 sm:text-4xl">
              Transparante prijzen
            </h2>
            <p className="mt-4 text-lg text-gray-500">
              Begin gratis. Upgrade wanneer je groeit.
            </p>
          </div>
          <div className="grid gap-8 lg:grid-cols-3">
            {plans.map((plan) => (
              <div
                key={plan.name}
                className={`rounded-2xl p-8 ${
                  plan.highlighted
                    ? 'bg-navy-900 text-white shadow-2xl ring-2 ring-brand-500 scale-105'
                    : 'bg-white border border-gray-200 shadow-sm'
                }`}
              >
                {plan.highlighted && (
                  <div className="mb-4 inline-flex items-center gap-1.5 rounded-full bg-brand-600 px-3 py-1 text-xs font-semibold text-white">
                    <Star className="h-3 w-3 fill-white" />
                    Meest populair
                  </div>
                )}
                <h3 className={`text-xl font-bold ${plan.highlighted ? 'text-white' : 'text-navy-900'}`}>
                  {plan.name}
                </h3>
                <p className={`mt-1 text-sm ${plan.highlighted ? 'text-navy-300' : 'text-gray-500'}`}>
                  {plan.desc}
                </p>
                <div className="mt-6 flex items-end gap-1">
                  <span className={`text-4xl font-bold ${plan.highlighted ? 'text-white' : 'text-navy-900'}`}>
                    {plan.price}
                  </span>
                  <span className={`mb-1 text-sm ${plan.highlighted ? 'text-navy-300' : 'text-gray-500'}`}>
                    {plan.period}
                  </span>
                </div>
                <ul className="mt-8 space-y-3">
                  {plan.features.map((f) => (
                    <li key={f} className="flex items-center gap-3 text-sm">
                      <CheckCircle
                        className={`h-4 w-4 shrink-0 ${plan.highlighted ? 'text-brand-400' : 'text-brand-600'}`}
                      />
                      <span className={plan.highlighted ? 'text-navy-200' : 'text-gray-600'}>
                        {f}
                      </span>
                    </li>
                  ))}
                </ul>
                <Link
                  to={plan.href}
                  className={`mt-8 flex w-full items-center justify-center rounded-xl py-3 text-sm font-semibold transition-colors ${
                    plan.highlighted
                      ? 'bg-brand-600 text-white hover:bg-brand-700'
                      : 'border border-gray-200 text-navy-900 hover:bg-gray-50'
                  }`}
                >
                  {plan.cta}
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-24 px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-navy-900 sm:text-4xl">
              Wat klanten zeggen
            </h2>
          </div>
          <div className="grid gap-8 sm:grid-cols-3">
            {testimonials.map(({ name, role, text, stars }) => (
              <div key={name} className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
                <div className="flex gap-0.5 mb-4">
                  {Array.from({ length: stars }).map((_, i) => (
                    <Star key={i} className="h-4 w-4 fill-amber-400 text-amber-400" />
                  ))}
                </div>
                <p className="text-gray-600 leading-relaxed text-sm">"{text}"</p>
                <div className="mt-6 flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-brand-100 text-sm font-bold text-brand-700">
                    {name[0]}
                  </div>
                  <div>
                    <p className="font-semibold text-navy-900 text-sm">{name}</p>
                    <p className="text-xs text-gray-500">{role}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="gradient-hero py-24 px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-3xl text-center">
          <h2 className="text-3xl font-bold text-white sm:text-4xl">
            Klaar om slimmer te plannen?
          </h2>
          <p className="mt-4 text-lg text-navy-200">
            Start vandaag gratis. Geen creditcard nodig, geen verplichting.
          </p>
          <div className="mt-10 flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
            <Link
              to="/register"
              className="flex items-center gap-2 rounded-xl bg-white px-8 py-3.5 text-base font-semibold text-navy-900 hover:bg-gray-100 transition-colors"
            >
              Gratis account aanmaken
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
          <div className="mt-6 flex flex-wrap justify-center gap-6 text-sm text-navy-300">
            {['Gratis tot 5 medewerkers', 'Geen creditcard', 'Opzegbaar per maand'].map((item) => (
              <div key={item} className="flex items-center gap-1.5">
                <CheckCircle className="h-4 w-4 text-brand-400" />
                {item}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-navy-950 py-12 px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <div className="flex flex-col items-center justify-between gap-6 sm:flex-row">
            <div className="flex items-center gap-2">
              <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-brand-600">
                <Zap className="h-3.5 w-3.5 text-white" />
              </div>
              <span className="font-bold text-white">ShiftSync</span>
            </div>
            <div className="flex flex-wrap justify-center gap-6 text-sm text-navy-400">
              <Link to="/pricing" className="hover:text-white transition-colors">Prijzen</Link>
              <Link to="/login" className="hover:text-white transition-colors">Inloggen</Link>
              <Link to="/register" className="hover:text-white transition-colors">Registreren</Link>
              <a href="mailto:support@shiftsync.nl" className="hover:text-white transition-colors">Support</a>
            </div>
          </div>
          <div className="mt-8 border-t border-white/10 pt-8 text-center text-sm text-navy-500">
            © {new Date().getFullYear()} ShiftSync. Alle rechten voorbehouden.
          </div>
        </div>
      </footer>
    </div>
  )
}
