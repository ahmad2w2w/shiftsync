# ShiftSync — Personeelsplanning SaaS

Slimme, multi-tenant personeelsbeheersoftware voor horeca en retail. Gebouwd met React 19, Vite, TypeScript, Tailwind CSS v4 en Supabase.

---

## Functies

- **Multi-tenant** — elk bedrijf heeft zijn eigen afgeschermde omgeving
- **Roosterplanning** — week- en maandplanner met drag-and-drop en sjablonen
- **Tijdregistratie** — in/uitklokken met automatische urenberekening
- **Verlofbeheer** — aanvragen, goedkeuren en afwijzen
- **Beschikbaarheidsbeheer** — medewerkers geven aan wanneer ze kunnen
- **Export** — PDF en Excel voor roosters en urenoverzichten
- **E-mailnotificaties** — via Resend bij roosterpublicatie en verlofbeslissing
- **Abonnementen** — Free / Pro / Business via Stripe

---

## Technische stack

| Laag | Technologie |
|---|---|
| Frontend | React 19, Vite 8, TypeScript 6, Tailwind CSS v4 |
| Routing | React Router 7 |
| Backend | Supabase (Auth, PostgreSQL, RLS, Edge Functions) |
| Betalingen | Stripe (Checkout + Customer Portal + Webhooks) |
| E-mail | Resend |
| Export | jsPDF + xlsx |
| Drag & drop | @dnd-kit |
| Datum | date-fns (nl locale) |

---

## Lokale installatie

### 1. Vereisten

- Node.js 18+
- Supabase CLI
- Supabase project (cloud of lokaal)

### 2. Kloon en installeer

```bash
git clone <repo>
cd shiftsync
npm install
```

### 3. Omgevingsvariabelen

Kopieer `.env.example` naar `.env` en vul in:

```bash
cp .env.example .env
```

```env
VITE_SUPABASE_URL=https://jouwproject.supabase.co
VITE_SUPABASE_ANON_KEY=jouw-anon-key
```

### 4. Database schema

Voer `supabase/schema.sql` uit in de Supabase SQL Editor van je project.

### 5. Start de app

```bash
npm run dev
```

De app draait op [http://localhost:5173](http://localhost:5173).

---

## Deployment

### Vercel (aanbevolen)

1. Importeer het project in Vercel
2. Voeg de environment variables toe (`VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`)
3. Deploy — `vercel.json` zorgt al voor de SPA rewrites

### Supabase Edge Functions deployen

```bash
supabase functions deploy create-checkout
supabase functions deploy stripe-webhook
supabase functions deploy send-notification
```

Stel de secrets in:

```bash
supabase secrets set STRIPE_SECRET_KEY=sk_live_...
supabase secrets set STRIPE_WEBHOOK_SECRET=whsec_...
supabase secrets set STRIPE_PRICE_PRO=price_...
supabase secrets set STRIPE_PRICE_BUSINESS=price_...
supabase secrets set RESEND_API_KEY=re_...
supabase secrets set FROM_EMAIL=noreply@shiftsync.nl
```

---

## Abonnementen (Stripe)

| Plan | Prijs | Medewerkers | Functies |
|---|---|---|---|
| Free | €0/mnd | Max 5 | Basis planning |
| Pro | €29/mnd | Max 25 | + Maandplanner, export |
| Business | €79/mnd | Onbeperkt | + E-mailnotificaties |

Maak in Stripe twee recurring products aan (Pro en Business) en voeg de `price_...` IDs toe als secrets.

Stel de webhook URL in op:
`https://jouwproject.supabase.co/functions/v1/stripe-webhook`

Events: `checkout.session.completed`, `customer.subscription.updated`, `customer.subscription.deleted`

---

## Projectstructuur

```
src/
├── App.tsx                    # Routes
├── context/
│   ├── AuthContext.tsx         # Auth + sessie
│   └── OrganizationContext.tsx # Organisatie + plan
├── pages/
│   ├── LandingPage.tsx         # Marketingpagina
│   ├── PricingPage.tsx         # Prijzenpagina
│   ├── LoginPage.tsx           # Inloggen
│   ├── RegisterPage.tsx        # Registreren
│   ├── OnboardingPage.tsx      # Organisatie aanmaken
│   ├── BillingPage.tsx         # Abonnement beheren
│   └── ...                     # App-pagina's
├── services/                  # Supabase data-laag
├── components/                # UI-componenten
├── lib/                       # Utils, plannerEngine
└── types/
    └── database.ts             # TypeScript types

supabase/
├── schema.sql                  # Volledig DB-schema
├── migrations/                 # Migraties
└── functions/
    ├── create-checkout/        # Stripe Checkout Edge Function
    ├── stripe-webhook/         # Webhook handler
    └── send-notification/      # E-mail via Resend
```

---

## Licentie

Proprietary — alle rechten voorbehouden.
