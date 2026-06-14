import { Link } from 'react-router-dom'
import {
  Calendar,
  Clock,
  Users,
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
  },
  {
    icon: Clock,
    title: 'Tijdregistratie',
    desc: 'Medewerkers klokken in en uit via de app. Uren worden automatisch berekend.',
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
    icon: FileText,
    title: 'Export PDF & Excel',
    desc: 'Urenoverzichten exporteren voor de loonadministratie. Klaar in één klik.',
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

const steps = [
  {
    step: '01',
    title: 'Stel je team samen',
    desc: 'Voeg medewerkers toe, stel functies en uurlonen in. Klaar in een paar minuten.',
  },
  {
    step: '02',
    title: 'Plan slim in',
    desc: 'Medewerkers geven hun beschikbaarheid door. Jij plant met sjablonen en drag-and-drop.',
  },
  {
    step: '03',
    title: 'Publiceer & volg',
    desc: 'Publiceer het rooster, medewerkers klokken in en uit, en uren worden automatisch berekend.',
  },
]

const benefits = [
  { stat: 'Minuten', label: 'in plaats van uren aan roosteren per week' },
  { stat: '1 plek', label: 'voor rooster, verlof, uren en tijdregistratie' },
  { stat: '0 fouten', label: 'door automatische urenberekening en export' },
]

export function LandingPage() {
  return (
    <div className="marketing-light min-h-screen">

      {/* ── NAVBAR ── */}
      <header
        className="fixed inset-x-0 top-0 z-50 backdrop-blur-md"
        style={{ background: 'rgba(255,255,255,0.9)', borderBottom: '1px solid var(--border)' }}
      >
        <div className="mx-auto flex max-w-7xl items-center justify-between px-5 py-4">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-brand-600 shadow-md shadow-brand-600/30">
              <Zap className="h-4 w-4 text-white" />
            </div>
            <span className="text-base font-bold tracking-tight" style={{ color: 'var(--text-primary)' }}>ShiftSync</span>
          </div>

          <nav className="hidden items-center gap-8 md:flex">
            <a href="#features" className="text-sm transition-colors hover:text-brand-600" style={{ color: 'var(--text-secondary)' }}>Functies</a>
            <Link to="/pricing" className="text-sm transition-colors hover:text-brand-600" style={{ color: 'var(--text-secondary)' }}>Prijzen</Link>
            <Link to="/login" className="text-sm transition-colors hover:text-brand-600" style={{ color: 'var(--text-secondary)' }}>Inloggen</Link>
          </nav>

          <div className="flex items-center gap-2">
            <Link to="/login" className="hidden text-sm font-medium transition-colors hover:text-brand-600 md:block" style={{ color: 'var(--text-secondary)' }}>
              Inloggen
            </Link>
            <Link
              to="/register"
              className="flex items-center gap-1.5 rounded-xl bg-brand-600 px-4 py-2 text-sm font-semibold text-white shadow-md shadow-brand-600/25 hover:bg-brand-700 transition-all"
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
          <div
            className="mb-5 inline-flex items-center gap-2 rounded-full px-4 py-1.5 text-xs font-medium"
            style={{ background: 'rgba(59,130,246,0.1)', border: '1px solid rgba(59,130,246,0.2)', color: 'var(--brand-strong)' }}
          >
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
            Personeelsplanning voor horeca & retail
          </div>

          <h1 className="text-4xl font-bold leading-tight tracking-tight sm:text-5xl lg:text-[3.75rem]" style={{ color: 'var(--text-primary)' }}>
            Slimmer plannen,{' '}
            <span className="bg-gradient-to-r from-brand-600 to-sky-500 bg-clip-text text-transparent">
              minder stress
            </span>
          </h1>

          <p className="mx-auto mt-6 max-w-2xl text-lg leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
            Het complete personeelsbeheersysteem voor restaurants, cafés en retailers.
            Roosters, verlof, uren en tijdregistratie — alles op één plek.
          </p>

          <div className="mt-10 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
            <Link
              to="/register"
              className="flex items-center gap-2 rounded-2xl bg-brand-600 px-8 py-3.5 text-base font-semibold text-white shadow-xl shadow-brand-600/25 hover:bg-brand-700 transition-all hover:-translate-y-0.5"
            >
              Gratis beginnen
              <ArrowRight className="h-4 w-4" />
            </Link>
            <a
              href="#features"
              className="flex items-center gap-2 rounded-2xl px-8 py-3.5 text-base font-medium transition-colors hover:bg-slate-100"
              style={{ color: 'var(--text-primary)', border: '1px solid var(--border-strong)' }}
            >
              Bekijk functies
            </a>
          </div>
          <p className="mt-4 text-sm" style={{ color: 'var(--text-muted)' }}>Geen creditcard · Gratis tot 5 medewerkers</p>
        </div>

        {/* Dashboard mockup — dark preview of the app */}
        <div className="mx-auto mt-20 max-w-5xl">
          <div
            className="overflow-hidden rounded-2xl p-1.5 shadow-2xl"
            style={{ background: 'var(--surface-card)', border: '1px solid var(--border)', boxShadow: 'var(--shadow-card-md)' }}
          >
            <div className="dark rounded-xl p-5" style={{ background: '#111113' }}>
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

              <div className="grid gap-3 sm:grid-cols-3">
                {[
                  { label: 'Medewerkers', value: '14', icon: Users, bg: 'rgba(37,99,235,0.12)', ic: 'text-brand-400' },
                  { label: 'Ingeklokt', value: '6', icon: Timer, bg: 'rgba(16,185,129,0.12)', ic: 'text-emerald-400' },
                  { label: 'Openstaand verlof', value: '2', icon: Palmtree, bg: 'rgba(245,158,11,0.12)', ic: 'text-amber-400' },
                ].map(({ label, value, icon: Icon, bg, ic }) => (
                  <div key={label} className="rounded-2xl p-4" style={{ background: '#18181b', border: '1px solid rgba(255,255,255,0.08)' }}>
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

              <div className="mt-4 rounded-2xl p-4" style={{ background: '#18181b', border: '1px solid rgba(255,255,255,0.08)' }}>
                <p className="mb-3 text-sm font-semibold text-zinc-200">Rooster deze week</p>
                <div className="grid grid-cols-7 gap-1.5">
                  {['Ma', 'Di', 'Wo', 'Do', 'Vr', 'Za', 'Zo'].map((dag, i) => (
                    <div key={dag} className="text-center">
                      <p className="mb-1.5 text-xs font-medium text-zinc-600">{dag}</p>
                      <div
                        className={`rounded-xl py-1.5 text-xs font-semibold ${i < 5 ? 'bg-brand-600/15 text-brand-400' : 'text-zinc-700'}`}
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

      {/* ── BENEFITS STRIP ── */}
      <section className="py-12" style={{ background: 'var(--surface-card)', borderTop: '1px solid var(--border)', borderBottom: '1px solid var(--border)' }}>
        <div className="mx-auto grid max-w-5xl gap-8 px-5 sm:grid-cols-3">
          {benefits.map(({ stat, label }) => (
            <div key={stat} className="text-center">
              <p className="text-3xl font-bold" style={{ color: 'var(--text-primary)' }}>{stat}</p>
              <p className="mt-1 text-sm" style={{ color: 'var(--text-muted)' }}>{label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── FEATURES ── */}
      <section id="features" className="px-5 py-24">
        <div className="mx-auto max-w-7xl">
          <div className="mb-16 text-center">
            <p className="mb-3 text-sm font-semibold uppercase tracking-widest text-brand-600">Functies</p>
            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl" style={{ color: 'var(--text-primary)' }}>
              Alles wat je nodig hebt
            </h2>
            <p className="mx-auto mt-4 max-w-2xl text-lg" style={{ color: 'var(--text-muted)' }}>
              Van roosterplanning tot loonadministratie — één platform voor je hele team.
            </p>
          </div>

          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {features.map(({ icon: Icon, title, desc }) => (
              <div
                key={title}
                className="group rounded-2xl p-6 transition-all hover:-translate-y-0.5"
                style={{ background: 'var(--surface-card)', border: '1px solid var(--border)', boxShadow: 'var(--shadow-card)' }}
              >
                <div className="mb-4 inline-flex h-10 w-10 items-center justify-center rounded-xl bg-brand-600/10">
                  <Icon className="h-5 w-5 text-brand-600" />
                </div>
                <h3 className="mb-2 font-semibold" style={{ color: 'var(--text-primary)' }}>{title}</h3>
                <p className="text-sm leading-relaxed" style={{ color: 'var(--text-muted)' }}>{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── PRICING ── */}
      <section id="pricing" className="px-5 py-24" style={{ background: 'var(--surface-card)', borderTop: '1px solid var(--border)' }}>
        <div className="mx-auto max-w-7xl">
          <div className="mb-16 text-center">
            <p className="mb-3 text-sm font-semibold uppercase tracking-widest text-brand-600">Prijzen</p>
            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl" style={{ color: 'var(--text-primary)' }}>
              Transparante prijzen
            </h2>
            <p className="mt-4 text-lg" style={{ color: 'var(--text-muted)' }}>Begin gratis. Upgrade wanneer je groeit.</p>
          </div>

          <div className="grid gap-6 lg:grid-cols-3">
            {plans.map((plan) => (
              <div
                key={plan.name}
                className={`relative flex flex-col rounded-2xl p-7 ${
                  plan.highlighted ? 'shadow-xl ring-2 ring-brand-500/40 lg:-mt-3 lg:pb-10 lg:pt-10' : ''
                }`}
                style={
                  plan.highlighted
                    ? { background: 'var(--surface-card)', border: '2px solid rgba(59,130,246,0.35)', boxShadow: '0 8px 32px rgba(59,130,246,0.12)' }
                    : { background: 'var(--surface-page)', border: '1px solid var(--border)' }
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
                  <h3 className="text-base font-bold" style={{ color: 'var(--text-primary)' }}>{plan.name}</h3>
                  <p className="mt-0.5 text-sm" style={{ color: 'var(--text-muted)' }}>{plan.desc}</p>
                  <div className="mt-5 flex items-end gap-1">
                    <span className="text-4xl font-bold tracking-tight" style={{ color: 'var(--text-primary)' }}>{plan.price}</span>
                    <span className="mb-1 text-sm" style={{ color: 'var(--text-muted)' }}>/maand</span>
                  </div>
                </div>

                <ul className="my-7 flex-1 space-y-3">
                  {plan.features.map((f) => (
                    <li key={f} className="flex items-center gap-2.5 text-sm">
                      <CheckCircle className="h-4 w-4 shrink-0 text-brand-600" />
                      <span style={{ color: 'var(--text-secondary)' }}>{f}</span>
                    </li>
                  ))}
                </ul>

                <Link
                  to={plan.href}
                  className={`flex w-full items-center justify-center rounded-xl py-3 text-sm font-semibold transition-all ${
                    plan.highlighted
                      ? 'bg-brand-600 text-white hover:bg-brand-700 shadow-md shadow-brand-600/25'
                      : 'hover:bg-slate-50'
                  }`}
                  style={plan.highlighted ? {} : { color: 'var(--text-primary)', border: '1px solid var(--border-strong)' }}
                >
                  {plan.cta}
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── HOW IT WORKS ── */}
      <section className="px-5 py-24">
        <div className="mx-auto max-w-7xl">
          <div className="mb-16 text-center">
            <p className="mb-3 text-sm font-semibold uppercase tracking-widest text-brand-600">Zo werkt het</p>
            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl" style={{ color: 'var(--text-primary)' }}>
              In drie stappen geregeld
            </h2>
            <p className="mx-auto mt-4 max-w-2xl text-lg" style={{ color: 'var(--text-muted)' }}>
              Van lege agenda naar een gepubliceerd rooster — zonder gedoe.
            </p>
          </div>
          <div className="grid gap-5 sm:grid-cols-3">
            {steps.map(({ step, title, desc }) => (
              <div
                key={step}
                className="relative rounded-2xl p-6"
                style={{ background: 'var(--surface-card)', border: '1px solid var(--border)', boxShadow: 'var(--shadow-card)' }}
              >
                <span className="text-4xl font-bold text-brand-600/20">{step}</span>
                <h3 className="mt-3 font-semibold" style={{ color: 'var(--text-primary)' }}>{title}</h3>
                <p className="mt-2 text-sm leading-relaxed" style={{ color: 'var(--text-muted)' }}>{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA ── */}
      <section className="gradient-hero px-5 py-24">
        <div className="mx-auto max-w-3xl text-center">
          <h2 className="text-3xl font-bold tracking-tight sm:text-4xl" style={{ color: 'var(--text-primary)' }}>
            Klaar om slimmer te plannen?
          </h2>
          <p className="mt-4 text-lg" style={{ color: 'var(--text-secondary)' }}>
            Start vandaag gratis. Geen creditcard, geen verplichting.
          </p>
          <Link
            to="/register"
            className="mt-10 inline-flex items-center gap-2 rounded-2xl bg-brand-600 px-8 py-4 text-base font-bold text-white shadow-xl shadow-brand-600/25 hover:bg-brand-700 transition-all hover:-translate-y-0.5"
          >
            Gratis account aanmaken
            <ArrowRight className="h-4 w-4" />
          </Link>
          <div className="mt-6 flex flex-wrap justify-center gap-6 text-sm" style={{ color: 'var(--text-muted)' }}>
            {['Gratis tot 5 medewerkers', 'Geen creditcard', 'Opzegbaar per maand'].map((item) => (
              <div key={item} className="flex items-center gap-1.5">
                <CheckCircle className="h-4 w-4 text-brand-600" />
                {item}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer className="px-5 py-12" style={{ background: '#0F172A' }}>
        <div className="mx-auto max-w-7xl">
          <div className="flex flex-col items-center justify-between gap-6 sm:flex-row">
            <div className="flex items-center gap-2.5">
              <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-brand-600">
                <Zap className="h-3.5 w-3.5 text-white" />
              </div>
              <span className="font-bold text-white">ShiftSync</span>
            </div>
            <div className="flex flex-wrap justify-center gap-6 text-sm text-slate-400">
              <Link to="/pricing" className="hover:text-white transition-colors">Prijzen</Link>
              <Link to="/login" className="hover:text-white transition-colors">Inloggen</Link>
              <Link to="/register" className="hover:text-white transition-colors">Registreren</Link>
              <a href="mailto:support@shiftsync.nl" className="hover:text-white transition-colors">Support</a>
            </div>
          </div>
          <div className="mt-8 border-t border-white/10 pt-8 text-center text-xs text-slate-600">
            © {new Date().getFullYear()} ShiftSync. Alle rechten voorbehouden.
          </div>
        </div>
      </footer>
    </div>
  )
}
