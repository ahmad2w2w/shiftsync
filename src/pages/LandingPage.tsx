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
  FileText,
} from 'lucide-react'

const features = [
  {
    icon: Calendar,
    title: 'Slimme roosterplanning',
    desc: 'Maandelijkse roosters met drag-and-drop. Automatisch gegenereerd op basis van beschikbaarheid en sjablonen.',
    color: 'bg-brand-100 text-brand-600',
  },
  {
    icon: Clock,
    title: 'Tijdregistratie',
    desc: 'Medewerkers klokken in en uit via de app. Uren worden automatisch berekend.',
    color: 'bg-emerald-100 text-emerald-600',
  },
  {
    icon: Users,
    title: 'Teambeheer',
    desc: 'Medewerkers toevoegen, rollen instellen en functies beheren. Alles op één plek.',
    color: 'bg-sky-100 text-sky-600',
  },
  {
    icon: Palmtree,
    title: 'Verlofbeheer',
    desc: 'Medewerkers vragen verlof aan, managers keuren goed. Automatisch verwerkt in het rooster.',
    color: 'bg-amber-100 text-amber-600',
  },
  {
    icon: FileText,
    title: 'Export PDF & Excel',
    desc: 'Urenoverzichten exporteren voor de loonadministratie. Klaar in één klik.',
    color: 'bg-rose-100 text-rose-600',
  },
  {
    icon: Bell,
    title: 'E-mailnotificaties',
    desc: 'Medewerkers ontvangen automatisch een e-mail bij roosterpublicatie of verlofbeslissing.',
    color: 'bg-violet-100 text-violet-600',
  },
]

const plans = [
  {
    name: 'Free',
    price: '€0',
    desc: 'Voor kleine teams',
    features: ['Tot 5 medewerkers', 'Roosterplanning', 'Tijdregistratie', 'Verlofbeheer'],
    cta: 'Gratis starten',
    href: '/register',
    highlighted: false,
  },
  {
    name: 'Pro',
    price: '€29',
    desc: 'Voor groeiende teams',
    features: ['Tot 25 medewerkers', 'Maandplanner', 'PDF & Excel export', 'Prioriteit support'],
    cta: '14 dagen gratis proberen',
    href: '/register?plan=pro',
    highlighted: true,
  },
  {
    name: 'Business',
    price: '€79',
    desc: 'Onbeperkt groeien',
    features: ['Onbeperkt medewerkers', 'E-mailnotificaties', 'Geavanceerde rapporten', 'Persoonlijke onboarding'],
    cta: 'Contact opnemen',
    href: 'mailto:sales@shiftsync.nl',
    highlighted: false,
  },
]

const testimonials = [
  {
    name: 'Sarah van den Berg',
    role: 'Eigenaar, Bistro de Linde',
    text: 'ShiftSync heeft ons roosterproces compleet getransformeerd. Wat vroeger uren kostte, is nu in minuten gedaan.',
    avatar: 'S',
    color: 'bg-brand-100 text-brand-700',
  },
  {
    name: 'Marco Jansen',
    role: 'Vestigingsmanager, Coffeebar Central',
    text: 'Eindelijk een app die medewerkers ook echt gebruiken. De in/uitklok functie is super handig.',
    avatar: 'M',
    color: 'bg-emerald-100 text-emerald-700',
  },
  {
    name: 'Fatima El Amrani',
    role: 'HR Manager, Restaurantgroep Noord',
    text: 'De Excel-export bespaart ons elke maand uren aan loonadministratie. Absolute aanrader.',
    avatar: 'F',
    color: 'bg-amber-100 text-amber-700',
  },
]

export function LandingPage() {
  return (
    <div className="min-h-screen" style={{ background: '#09090b' }}>

      {/* ── NAVBAR ── */}
      <header className="fixed inset-x-0 top-0 z-50 backdrop-blur-md" style={{ background: 'rgba(9,9,11,0.92)', borderBottom: '1px solid rgba(255,255,255,0.07)' }}>
        <div className="mx-auto flex max-w-7xl items-center justify-between px-5 py-4">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-brand-600 shadow-md shadow-brand-600/40">
              <Zap className="h-4 w-4 text-white" />
            </div>
            <span className="text-base font-bold tracking-tight text-white">ShiftSync</span>
          </div>

          <nav className="hidden items-center gap-8 md:flex">
            <a href="#features" className="text-sm text-navy-300 hover:text-white transition-colors">Functies</a>
            <Link to="/pricing" className="text-sm text-navy-300 hover:text-white transition-colors">Prijzen</Link>
            <Link to="/login" className="text-sm text-navy-300 hover:text-white transition-colors">Inloggen</Link>
          </nav>

          <div className="flex items-center gap-2">
            <Link to="/login" className="hidden text-sm font-medium text-navy-300 hover:text-white md:block transition-colors">
              Inloggen
            </Link>
            <Link
              to="/register"
              className="flex items-center gap-1.5 rounded-xl bg-brand-600 px-4 py-2 text-sm font-semibold text-white shadow-md shadow-brand-600/30 hover:bg-brand-700 transition-all"
            >
              Gratis starten
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>
        </div>
      </header>

      {/* ── HERO ── */}
      <section className="gradient-hero px-5 pb-28 pt-36 sm:pt-44">
        <div className="mx-auto max-w-4xl text-center">
          <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-4 py-1.5 text-xs font-medium text-white/80">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
            Personeelsplanning voor horeca & retail
          </div>

          <h1 className="text-4xl font-bold leading-tight tracking-tight text-white sm:text-5xl lg:text-[3.75rem]">
            Slimmer plannen,{' '}
            <span className="bg-gradient-to-r from-brand-400 to-sky-300 bg-clip-text text-transparent">
              minder stress
            </span>
          </h1>

          <p className="mx-auto mt-6 max-w-2xl text-lg leading-relaxed text-navy-300">
            Het complete personeelsbeheersysteem voor restaurants, cafés en retailers.
            Roosters, verlof, uren en tijdregistratie — alles op één plek.
          </p>

          <div className="mt-10 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
            <Link
              to="/register"
              className="flex items-center gap-2 rounded-2xl bg-brand-600 px-8 py-3.5 text-base font-semibold text-white shadow-xl shadow-brand-600/30 hover:bg-brand-700 transition-all hover:-translate-y-0.5"
            >
              Gratis beginnen
              <ArrowRight className="h-4 w-4" />
            </Link>
            <a
              href="#features"
              className="flex items-center gap-2 rounded-2xl border border-white/15 px-8 py-3.5 text-base font-medium text-white hover:bg-white/8 transition-colors"
            >
              Bekijk functies
            </a>
          </div>
          <p className="mt-4 text-sm text-navy-500">Geen creditcard · Gratis tot 5 medewerkers</p>
        </div>

        {/* Dashboard mockup */}
        <div className="mx-auto mt-20 max-w-5xl">
          <div className="overflow-hidden rounded-2xl p-1.5 shadow-2xl" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}>
            <div className="rounded-xl p-5" style={{ background: '#111113' }}>
              {/* Mock topbar */}
              <div className="mb-5 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-brand-600">
                    <Zap className="h-4 w-4 text-white" />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-zinc-100">Restaurant de Linde</p>
                    <p className="text-xs text-zinc-600">Manager</p>
                  </div>
                </div>
                <div className="hidden items-center gap-2 sm:flex">
                  <span className="rounded-lg px-3 py-1 text-xs font-medium text-brand-400" style={{ background: 'rgba(37,99,235,0.12)', border: '1px solid rgba(37,99,235,0.2)' }}>Pro plan</span>
                </div>
              </div>

              {/* Stats */}
              <div className="grid gap-3 sm:grid-cols-3">
                  {[
                  { label: 'Medewerkers', value: '14', icon: Users, bg: 'rgba(37,99,235,0.12)', ic: 'text-brand-400' },
                  { label: 'Ingeklokt', value: '6', icon: Timer, bg: 'rgba(16,185,129,0.12)', ic: 'text-emerald-400' },
                  { label: 'Openstaand verlof', value: '2', icon: Palmtree, bg: 'rgba(245,158,11,0.12)', ic: 'text-amber-400' },
                ].map(({ label, value, icon: Icon, bg, ic }) => (
                  <div key={label} className="rounded-2xl p-4 card-shadow" style={{ background: '#18181b', border: '1px solid rgba(255,255,255,0.08)' }}>
                    <div className="flex items-center justify-between">
                        <div>
                          <p className="text-xs font-medium text-zinc-600">{label}</p>
                          <p className="mt-0.5 text-2xl font-bold text-white">{value}</p>
                        </div>
                        <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${ic}`} style={{ background: bg }}>
                          <Icon className="h-5 w-5" />
                        </div>
                      </div>
                  </div>
                ))}
              </div>

              {/* Rooster preview */}
              <div className="mt-4 rounded-2xl p-4 card-shadow" style={{ background: '#18181b', border: '1px solid rgba(255,255,255,0.08)' }}>
                <p className="mb-3 text-sm font-semibold text-zinc-200">Rooster deze week</p>
                <div className="grid grid-cols-7 gap-1.5">
                  {['Ma', 'Di', 'Wo', 'Do', 'Vr', 'Za', 'Zo'].map((dag, i) => (
                    <div key={dag} className="text-center">
                      <p className="mb-1.5 text-xs font-medium text-zinc-600">{dag}</p>
                      <div className={`rounded-xl py-1.5 text-xs font-semibold ${
                        i < 5
                          ? 'bg-brand-600/15 text-brand-400'
                          : 'text-zinc-700'
                      }`}
                      style={i >= 5 ? { background: 'rgba(255,255,255,0.04)' } : {}}
                      >
                        {i < 5 ? `${3 + i}` : '—'}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── SOCIAL PROOF ── */}
      <section className="py-12" style={{ borderTop: '1px solid rgba(255,255,255,0.07)', borderBottom: '1px solid rgba(255,255,255,0.07)', background: '#111113' }}>
        <div className="mx-auto max-w-7xl px-5">
          <p className="mb-8 text-center text-xs font-semibold uppercase tracking-widest text-zinc-700">
            Vertrouwd door bedrijven in Nederland
          </p>
          <div className="flex flex-wrap items-center justify-center gap-x-12 gap-y-3">
            {['Restaurant Noord', 'Café de Hoek', 'Bistro Linde', 'Sushi Bar X', 'Bakery 24'].map((name) => (
              <span key={name} className="text-sm font-semibold text-zinc-700">{name}</span>
            ))}
          </div>
        </div>
      </section>

      {/* ── FEATURES ── */}
      <section id="features" className="px-5 py-24" style={{ background: '#09090b' }}>
        <div className="mx-auto max-w-7xl">
          <div className="mb-16 text-center">
            <p className="mb-3 text-sm font-semibold uppercase tracking-widest text-brand-500">Functies</p>
            <h2 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">
              Alles wat je nodig hebt
            </h2>
            <p className="mx-auto mt-4 max-w-2xl text-lg text-zinc-500">
              Van roosterplanning tot loonadministratie — één platform voor je hele team.
            </p>
          </div>

          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {features.map(({ icon: Icon, title, desc }) => (
              <div
                key={title}
                className="group rounded-2xl p-6 card-shadow transition-all hover:card-shadow-md hover:-translate-y-0.5"
                style={{ background: '#111113', border: '1px solid rgba(255,255,255,0.07)' }}
              >
                <div className="mb-4 inline-flex h-10 w-10 items-center justify-center rounded-xl bg-brand-600/15">
                  <Icon className="h-5 w-5 text-brand-400" />
                </div>
                <h3 className="mb-2 font-semibold text-zinc-100">{title}</h3>
                <p className="text-sm leading-relaxed text-zinc-500">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── PRICING ── */}
      <section id="pricing" className="px-5 py-24" style={{ background: '#111113', borderTop: '1px solid rgba(255,255,255,0.07)' }}>
        <div className="mx-auto max-w-7xl">
          <div className="mb-16 text-center">
            <p className="mb-3 text-sm font-semibold uppercase tracking-widest text-brand-500">Prijzen</p>
            <h2 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">
              Transparante prijzen
            </h2>
            <p className="mt-4 text-lg text-zinc-500">Begin gratis. Upgrade wanneer je groeit.</p>
          </div>

          <div className="grid gap-6 lg:grid-cols-3">
            {plans.map((plan) => (
              <div
                key={plan.name}
                className={`relative flex flex-col rounded-2xl p-7 ${
                  plan.highlighted
                    ? 'shadow-2xl ring-2 ring-brand-500/60 lg:-mt-3 lg:pb-10 lg:pt-10'
                    : 'card-shadow'
                }`}
                style={plan.highlighted
                  ? { background: '#0f1825' }
                  : { background: '#18181b', border: '1px solid rgba(255,255,255,0.08)' }
                }
              >
                {plan.highlighted && (
                  <div className="absolute -top-3.5 left-1/2 -translate-x-1/2">
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-brand-600 px-3 py-1 text-xs font-bold text-white shadow-md">
                      <Star className="h-3 w-3 fill-white" />
                      Meest populair
                    </span>
                  </div>
                )}

                <div>
                <h3 className="text-base font-bold text-white">
                  {plan.name}
                </h3>
                <p className="mt-0.5 text-sm text-zinc-500">
                  {plan.desc}
                </p>
                <div className="mt-5 flex items-end gap-1">
                  <span className="text-4xl font-bold tracking-tight text-white">
                    {plan.price}
                  </span>
                  <span className="mb-1 text-sm text-zinc-500">/maand</span>
                </div>
                </div>

                <ul className="my-7 flex-1 space-y-3">
                  {plan.features.map((f) => (
                    <li key={f} className="flex items-center gap-2.5 text-sm">
                      <CheckCircle className="h-4 w-4 shrink-0 text-brand-500" />
                      <span className="text-zinc-400">{f}</span>
                    </li>
                  ))}
                </ul>

                <Link
                  to={plan.href}
                  className={`flex w-full items-center justify-center rounded-xl py-3 text-sm font-semibold transition-all ${
                    plan.highlighted
                      ? 'bg-brand-600 text-white hover:bg-brand-500 shadow-md shadow-brand-600/30'
                      : 'text-zinc-300 hover:bg-white/5'
                  }`}
                  style={plan.highlighted ? {} : { border: '1px solid rgba(255,255,255,0.1)' }}
                >
                  {plan.cta}
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── TESTIMONIALS ── */}
      <section className="px-5 py-24" style={{ background: '#09090b', borderTop: '1px solid rgba(255,255,255,0.07)' }}>
        <div className="mx-auto max-w-7xl">
          <div className="mb-16 text-center">
            <p className="mb-3 text-sm font-semibold uppercase tracking-widest text-brand-500">Reviews</p>
            <h2 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">
              Wat klanten zeggen
            </h2>
          </div>
          <div className="grid gap-5 sm:grid-cols-3">
            {testimonials.map(({ name, role, text, avatar }) => (
              <div key={name} className="rounded-2xl p-6 card-shadow" style={{ background: '#111113', border: '1px solid rgba(255,255,255,0.07)' }}>
                <div className="mb-4 flex gap-0.5">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="h-4 w-4 fill-amber-400 text-amber-400" />
                  ))}
                </div>
                <p className="text-sm leading-relaxed text-zinc-400">"{text}"</p>
                <div className="mt-5 flex items-center gap-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-full bg-brand-600/15 text-sm font-bold text-brand-400">
                    {avatar}
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-zinc-200">{name}</p>
                    <p className="text-xs text-zinc-600">{role}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA ── */}
      <section className="gradient-hero px-5 py-24">
        <div className="mx-auto max-w-3xl text-center">
          <h2 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">
            Klaar om slimmer te plannen?
          </h2>
          <p className="mt-4 text-lg text-navy-300">
            Start vandaag gratis. Geen creditcard, geen verplichting.
          </p>
          <Link
            to="/register"
            className="mt-10 inline-flex items-center gap-2 rounded-2xl bg-white px-8 py-4 text-base font-bold text-zinc-900 shadow-xl hover:bg-zinc-100 transition-all hover:-translate-y-0.5"
          >
            Gratis account aanmaken
            <ArrowRight className="h-4 w-4" />
          </Link>
          <div className="mt-6 flex flex-wrap justify-center gap-6 text-sm text-navy-400">
            {['Gratis tot 5 medewerkers', 'Geen creditcard', 'Opzegbaar per maand'].map((item) => (
              <div key={item} className="flex items-center gap-1.5">
                <CheckCircle className="h-4 w-4 text-brand-400" />
                {item}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer className="px-5 py-12" style={{ background: '#000000', borderTop: '1px solid rgba(255,255,255,0.07)' }}>
        <div className="mx-auto max-w-7xl">
          <div className="flex flex-col items-center justify-between gap-6 sm:flex-row">
            <div className="flex items-center gap-2.5">
              <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-brand-600">
                <Zap className="h-3.5 w-3.5 text-white" />
              </div>
              <span className="font-bold text-white">ShiftSync</span>
            </div>
            <div className="flex flex-wrap justify-center gap-6 text-sm text-zinc-600">
              <Link to="/pricing" className="hover:text-white transition-colors">Prijzen</Link>
              <Link to="/login" className="hover:text-white transition-colors">Inloggen</Link>
              <Link to="/register" className="hover:text-white transition-colors">Registreren</Link>
              <a href="mailto:support@shiftsync.nl" className="hover:text-white transition-colors">Support</a>
            </div>
          </div>
          <div className="mt-8 pt-8 text-center text-xs text-zinc-800" style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}>
            © {new Date().getFullYear()} ShiftSync. Alle rechten voorbehouden.
          </div>
        </div>
      </footer>
    </div>
  )
}
