import { Link } from 'react-router-dom'
import {
  Calendar,
  Clock,
  Users,
  Zap,
  CheckCircle,
  ArrowRight,
  Star,
  Palmtree,
  Bell,
  FileText,
  UtensilsCrossed,
  ShoppingBag,
  Building2,
  Sparkles,
  ChevronDown,
} from 'lucide-react'

const features = [
  { icon: Calendar, title: 'Slimme roosterplanning', desc: 'Week- en maandweergave met drag-and-drop, templates en automatische suggesties op basis van beschikbaarheid.' },
  { icon: Clock, title: 'Tijdregistratie', desc: 'Medewerkers klokken in en uit via mobiel. Uren worden automatisch berekend en zijn direct zichtbaar voor managers.' },
  { icon: Users, title: 'Teambeheer', desc: 'Medewerkers toevoegen, rollen instellen, uurlonen beheren en je team overzichtelijk houden.' },
  { icon: Palmtree, title: 'Verlof & ziekmelding', desc: 'Medewerkers vragen verlof aan, managers keuren goed. Alles netjes verwerkt in je planning.' },
  { icon: FileText, title: 'Rapportages & export', desc: 'Urenoverzichten, loonkosten en roosters exporteren naar PDF of Excel voor de administratie.' },
  { icon: Bell, title: 'Notificaties', desc: 'Automatische e-mails bij roosterpublicatie en verlofbeslissingen. Iedereen blijft op de hoogte.' },
]

const audiences = [
  { icon: UtensilsCrossed, title: 'Horeca', desc: 'Restaurants, cafés en bars met wisselende diensten en piekuren.' },
  { icon: ShoppingBag, title: 'Retail', desc: 'Winkels en filialen met flexibele weekend- en avondroosters.' },
  { icon: Building2, title: 'Dienstverlening', desc: 'Teams met meerdere locaties, contracturen en uurloon.' },
]

const steps = [
  { step: '01', title: 'Stel je team samen', desc: 'Voeg medewerkers toe en stel functies en uurlonen in. Klaar in enkele minuten.' },
  { step: '02', title: 'Verzamel beschikbaarheid', desc: 'Medewerkers geven door wanneer ze kunnen werken. Jij plant met templates en slimme suggesties.' },
  { step: '03', title: 'Publiceer & volg uren', desc: 'Publiceer het rooster met één klik. Medewerkers klokken in en uren worden automatisch bijgehouden.' },
]

const plans = [
  { name: 'Free', price: '€0', desc: 'Tot 5 medewerkers', features: ['Roosterplanning', 'Tijdregistratie', 'Verlofbeheer', 'Beschikbaarheid'], cta: 'Gratis starten', href: '/register', highlighted: false },
  { name: 'Pro', price: '€29', desc: 'Tot 25 medewerkers', features: ['Maandplanner', 'PDF & Excel export', 'Slimme suggesties', 'Prioriteit support'], cta: '14 dagen gratis', href: '/register?plan=pro', highlighted: true },
  { name: 'Business', price: '€79', desc: 'Onbeperkt', features: ['E-mailnotificaties', 'Geavanceerde rapporten', 'Persoonlijke onboarding', 'Alles van Pro'], cta: 'Contact opnemen', href: 'mailto:sales@shiftsync.nl', highlighted: false },
]

const faqs = [
  { q: 'Hoe snel kan ik starten?', a: 'Account aanmaken duurt 2 minuten. Daarna voeg je medewerkers toe en plan je je eerste rooster.' },
  { q: 'Werkt het op mobiel?', a: 'Ja. Medewerkers kunnen op hun telefoon rooster bekijken, inklokken, verlof aanvragen en beschikbaarheid invullen.' },
  { q: 'Kan ik upgraden of downgraden?', a: 'Op elk moment. Upgrades gaan direct in, downgrades aan het einde van je factureringsperiode.' },
  { q: 'Is mijn data veilig?', a: 'Ja. Elke organisatie heeft een eigen afgeschermde omgeving met versleutelde verbindingen.' },
]

export function LandingPage() {
  return (
    <div className="marketing-light min-h-screen">

      {/* NAV */}
      <header className="fixed inset-x-0 top-0 z-50 backdrop-blur-xl" style={{ background: 'rgba(255,255,255,0.85)', borderBottom: '1px solid var(--border)' }}>
        <div className="mx-auto flex max-w-6xl items-center justify-between px-5 py-4">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand-600 shadow-lg shadow-brand-600/25">
              <Zap className="h-4 w-4 text-white" />
            </div>
            <span className="text-base font-bold tracking-tight" style={{ color: 'var(--color-navy)' }}>ShiftSync</span>
          </div>
          <nav className="hidden items-center gap-8 md:flex">
            <a href="#features" className="text-sm font-medium transition-colors hover:text-brand-600" style={{ color: 'var(--text-secondary)' }}>Functies</a>
            <a href="#pricing" className="text-sm font-medium transition-colors hover:text-brand-600" style={{ color: 'var(--text-secondary)' }}>Prijzen</a>
            <Link to="/login" className="text-sm font-medium transition-colors hover:text-brand-600" style={{ color: 'var(--text-secondary)' }}>Inloggen</Link>
          </nav>
          <Link to="/register" className="flex items-center gap-1.5 rounded-xl bg-brand-600 px-4 py-2.5 text-sm font-semibold text-white shadow-md shadow-brand-600/20 hover:bg-brand-700 transition-all">
            Gratis starten <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>
      </header>

      {/* HERO */}
      <section className="gradient-hero relative overflow-hidden px-5 pb-24 pt-32 sm:pt-40">
        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          <div className="absolute -right-32 -top-32 h-96 w-96 rounded-full bg-brand-500/10 blur-3xl" />
          <div className="absolute -bottom-20 -left-20 h-72 w-72 rounded-full bg-sky-400/10 blur-3xl" />
        </div>
        <div className="relative mx-auto max-w-4xl text-center">
          <div className="mb-6 inline-flex items-center gap-2 rounded-full px-4 py-1.5 text-xs font-semibold" style={{ background: 'var(--brand-muted)', color: 'var(--brand-strong)', border: '1px solid rgba(59,130,246,0.2)' }}>
            <Sparkles className="h-3.5 w-3.5" />
            Personeelsplanning voor moderne teams
          </div>
          <h1 className="text-4xl font-bold leading-[1.1] tracking-tight sm:text-5xl lg:text-[3.25rem]" style={{ color: 'var(--color-navy)' }}>
            Stop met roosters maken in WhatsApp en Excel
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-lg leading-relaxed sm:text-xl" style={{ color: 'var(--text-secondary)' }}>
            Plan medewerkers, verzamel beschikbaarheid, registreer uren en beheer verlof op één plek.
          </p>
          <div className="mt-10 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Link to="/register" className="flex w-full items-center justify-center gap-2 rounded-2xl bg-brand-600 px-8 py-4 text-base font-semibold text-white shadow-xl shadow-brand-600/25 hover:bg-brand-700 transition-all hover:-translate-y-0.5 sm:w-auto">
              Start gratis proefperiode <ArrowRight className="h-4 w-4" />
            </Link>
            <a href="#demo" className="flex w-full items-center justify-center gap-2 rounded-2xl px-8 py-4 text-base font-semibold transition-colors hover:bg-white sm:w-auto" style={{ color: 'var(--color-navy)', border: '1px solid var(--border-strong)', background: 'var(--surface-card)' }}>
              Bekijk demo
            </a>
          </div>
          <p className="mt-5 text-sm" style={{ color: 'var(--text-muted)' }}>Geen creditcard · Gratis tot 5 medewerkers · Opzegbaar per maand</p>
          <ChevronDown className="mx-auto mt-12 h-5 w-5 animate-bounce" style={{ color: 'var(--text-disabled)' }} />
        </div>
      </section>

      {/* DEMO MOCKUP */}
      <section id="demo" className="px-5 pb-20">
        <div className="mx-auto max-w-5xl">
          <div className="overflow-hidden rounded-2xl shadow-2xl" style={{ border: '1px solid var(--border)', boxShadow: '0 25px 50px -12px rgba(15,23,42,0.15)' }}>
            <div className="dark rounded-2xl p-1" style={{ background: '#0F172A' }}>
              <div className="rounded-xl p-5" style={{ background: '#111113' }}>
                <div className="mb-5 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand-600"><Zap className="h-4 w-4 text-white" /></div>
                    <div><p className="text-sm font-bold text-white">Command Center</p><p className="text-xs text-zinc-500">Manager dashboard</p></div>
                  </div>
                  <span className="rounded-lg px-3 py-1 text-xs font-semibold text-emerald-400" style={{ background: 'rgba(16,185,129,0.12)' }}>6 ingeklokt</span>
                </div>
                <div className="grid gap-3 sm:grid-cols-4">
                  {[
                    { l: 'Vandaag ingepland', v: '12', c: '#3B82F6' },
                    { l: 'Open diensten', v: '3', c: '#F59E0B' },
                    { l: 'Uren deze week', v: '284', c: '#10B981' },
                    { l: 'Verlof open', v: '2', c: '#8B5CF6' },
                  ].map(({ l, v, c }) => (
                    <div key={l} className="rounded-xl p-4" style={{ background: '#18181b', border: '1px solid rgba(255,255,255,0.06)' }}>
                      <p className="text-[10px] font-medium uppercase tracking-wide text-zinc-500">{l}</p>
                      <p className="mt-1 text-2xl font-bold text-white">{v}</p>
                      <div className="mt-2 h-1 rounded-full" style={{ background: `${c}33` }}>
                        <div className="h-1 w-2/3 rounded-full" style={{ background: c }} />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* FEATURES */}
      <section id="features" className="px-5 py-20" style={{ background: 'var(--surface-card)' }}>
        <div className="mx-auto max-w-6xl">
          <div className="mb-14 text-center">
            <p className="mb-2 text-sm font-semibold uppercase tracking-widest text-brand-600">Functies</p>
            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl" style={{ color: 'var(--color-navy)' }}>Alles wat je team nodig heeft</h2>
            <p className="mx-auto mt-4 max-w-xl text-lg" style={{ color: 'var(--text-muted)' }}>Van planning tot urenregistratie — één platform, nul spreadsheet-stress.</p>
          </div>
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {features.map(({ icon: Icon, title, desc }) => (
              <div key={title} className="group rounded-2xl p-6 transition-all duration-200 hover:-translate-y-1 hover:shadow-lg" style={{ background: 'var(--surface-page)', border: '1px solid var(--border)' }}>
                <div className="mb-4 inline-flex h-11 w-11 items-center justify-center rounded-xl bg-brand-600/10 transition-colors group-hover:bg-brand-600/15">
                  <Icon className="h-5 w-5 text-brand-600" />
                </div>
                <h3 className="font-semibold" style={{ color: 'var(--color-navy)' }}>{title}</h3>
                <p className="mt-2 text-sm leading-relaxed" style={{ color: 'var(--text-muted)' }}>{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* AUDIENCE */}
      <section className="px-5 py-20">
        <div className="mx-auto max-w-6xl">
          <div className="mb-12 text-center">
            <h2 className="text-2xl font-bold tracking-tight sm:text-3xl" style={{ color: 'var(--color-navy)' }}>Voor wie is ShiftSync?</h2>
          </div>
          <div className="grid gap-5 sm:grid-cols-3">
            {audiences.map(({ icon: Icon, title, desc }) => (
              <div key={title} className="rounded-2xl p-6 text-center" style={{ background: 'var(--surface-card)', border: '1px solid var(--border)', boxShadow: 'var(--shadow-card)' }}>
                <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-brand-600/10">
                  <Icon className="h-6 w-6 text-brand-600" />
                </div>
                <h3 className="font-semibold" style={{ color: 'var(--color-navy)' }}>{title}</h3>
                <p className="mt-2 text-sm" style={{ color: 'var(--text-muted)' }}>{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* STEPS */}
      <section className="px-5 py-20" style={{ background: 'var(--surface-card)' }}>
        <div className="mx-auto max-w-6xl">
          <div className="mb-12 text-center">
            <p className="mb-2 text-sm font-semibold uppercase tracking-widest text-brand-600">Zo werkt het</p>
            <h2 className="text-3xl font-bold tracking-tight" style={{ color: 'var(--color-navy)' }}>In drie stappen aan de slag</h2>
          </div>
          <div className="grid gap-6 sm:grid-cols-3">
            {steps.map(({ step, title, desc }) => (
              <div key={step} className="relative rounded-2xl p-6" style={{ background: 'var(--surface-page)', border: '1px solid var(--border)' }}>
                <span className="text-5xl font-bold text-brand-600/15">{step}</span>
                <h3 className="mt-2 font-semibold" style={{ color: 'var(--color-navy)' }}>{title}</h3>
                <p className="mt-2 text-sm leading-relaxed" style={{ color: 'var(--text-muted)' }}>{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* PRICING */}
      <section id="pricing" className="px-5 py-20">
        <div className="mx-auto max-w-6xl">
          <div className="mb-14 text-center">
            <p className="mb-2 text-sm font-semibold uppercase tracking-widest text-brand-600">Prijzen</p>
            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl" style={{ color: 'var(--color-navy)' }}>Transparant en eerlijk</h2>
          </div>
          <div className="grid gap-6 lg:grid-cols-3">
            {plans.map((plan) => (
              <div key={plan.name} className={`relative flex flex-col rounded-2xl p-7 ${plan.highlighted ? 'shadow-xl ring-2 ring-brand-500/30 lg:-mt-2 lg:pb-9 lg:pt-9' : ''}`} style={{ background: 'var(--surface-card)', border: plan.highlighted ? undefined : '1px solid var(--border)' }}>
                {plan.highlighted && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                    <span className="inline-flex items-center gap-1 rounded-full bg-brand-600 px-3 py-1 text-xs font-bold text-white"><Star className="h-3 w-3 fill-white" /> Populair</span>
                  </div>
                )}
                <h3 className="font-bold" style={{ color: 'var(--color-navy)' }}>{plan.name}</h3>
                <p className="text-sm" style={{ color: 'var(--text-muted)' }}>{plan.desc}</p>
                <div className="mt-4 flex items-end gap-1">
                  <span className="text-4xl font-bold" style={{ color: 'var(--color-navy)' }}>{plan.price}</span>
                  <span className="mb-1 text-sm" style={{ color: 'var(--text-muted)' }}>/maand</span>
                </div>
                <ul className="my-6 flex-1 space-y-2.5">
                  {plan.features.map((f) => (
                    <li key={f} className="flex items-center gap-2 text-sm"><CheckCircle className="h-4 w-4 shrink-0 text-brand-600" /><span style={{ color: 'var(--text-secondary)' }}>{f}</span></li>
                  ))}
                </ul>
                <Link to={plan.href} className={`flex w-full items-center justify-center rounded-xl py-3 text-sm font-semibold transition-all ${plan.highlighted ? 'bg-brand-600 text-white hover:bg-brand-700 shadow-md' : 'hover:bg-slate-50'}`} style={plan.highlighted ? {} : { color: 'var(--color-navy)', border: '1px solid var(--border-strong)' }}>
                  {plan.cta}
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* TESTIMONIALS PLACEHOLDER */}
      <section className="px-5 py-16" style={{ background: 'var(--surface-card)', borderTop: '1px solid var(--border)' }}>
        <div className="mx-auto max-w-3xl text-center">
          <p className="text-sm font-semibold uppercase tracking-widest text-brand-600">Ervaringen</p>
          <h2 className="mt-2 text-2xl font-bold" style={{ color: 'var(--color-navy)' }}>Vertrouwd door teams in Nederland</h2>
          <div className="mt-8 grid gap-4 sm:grid-cols-2">
            {['"Eindelijk geen WhatsApp-groep meer voor roosters."', '"Onze medewerkers klokken nu zelf in — scheelt veel tijd."'].map((quote) => (
              <div key={quote} className="rounded-2xl p-6 text-left" style={{ background: 'var(--surface-page)', border: '1px solid var(--border)' }}>
                <p className="text-sm italic leading-relaxed" style={{ color: 'var(--text-secondary)' }}>{quote}</p>
                <p className="mt-3 text-xs font-medium" style={{ color: 'var(--text-muted)' }}>— ShiftSync gebruiker</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="px-5 py-20">
        <div className="mx-auto max-w-3xl">
          <h2 className="mb-10 text-center text-2xl font-bold" style={{ color: 'var(--color-navy)' }}>Veelgestelde vragen</h2>
          <div className="space-y-3">
            {faqs.map(({ q, a }) => (
              <details key={q} className="group rounded-2xl" style={{ background: 'var(--surface-card)', border: '1px solid var(--border)' }}>
                <summary className="cursor-pointer list-none px-5 py-4 font-semibold marker:hidden" style={{ color: 'var(--color-navy)' }}>{q}</summary>
                <p className="border-t px-5 py-4 text-sm leading-relaxed" style={{ color: 'var(--text-muted)', borderColor: 'var(--border)' }}>{a}</p>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="gradient-hero px-5 py-20">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-3xl font-bold tracking-tight" style={{ color: 'var(--color-navy)' }}>Klaar om slimmer te plannen?</h2>
          <p className="mt-4 text-lg" style={{ color: 'var(--text-secondary)' }}>Start vandaag. Geen creditcard, geen verplichting.</p>
          <Link to="/register" className="mt-8 inline-flex items-center gap-2 rounded-2xl bg-brand-600 px-8 py-4 text-base font-semibold text-white shadow-xl hover:bg-brand-700 transition-all hover:-translate-y-0.5">
            Start gratis proefperiode <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="px-5 py-12" style={{ background: '#0F172A' }}>
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-6 sm:flex-row">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-600"><Zap className="h-4 w-4 text-white" /></div>
            <span className="font-bold text-white">ShiftSync</span>
          </div>
          <div className="flex flex-wrap justify-center gap-6 text-sm text-slate-400">
            <Link to="/pricing" className="hover:text-white transition-colors">Prijzen</Link>
            <Link to="/login" className="hover:text-white transition-colors">Inloggen</Link>
            <Link to="/register" className="hover:text-white transition-colors">Registreren</Link>
            <a href="mailto:support@shiftsync.nl" className="hover:text-white transition-colors">Support</a>
          </div>
        </div>
        <p className="mx-auto mt-8 max-w-6xl border-t border-white/10 pt-8 text-center text-xs text-slate-600">
          © {new Date().getFullYear()} ShiftSync. Alle rechten voorbehouden.
        </p>
      </footer>
    </div>
  )
}
