# Lokale setup (automatisch geconfigureerd)

## Wat draait er?

| Service | URL |
|---------|-----|
| **App** | http://localhost:5173 |
| **Supabase API** | http://127.0.0.1:54321 |
| **Supabase Studio** | http://127.0.0.1:54323 |
| **E-mail (Mailpit)** | http://127.0.0.1:54324 |

## Inloggen

### Manager

| Veld | Waarde |
|------|--------|
| E-mail | `manager@otoro.nl` |
| Wachtwoord | `OtoroAdmin123!` |

### Medewerker (normale user)

| Veld | Waarde |
|------|--------|
| E-mail | `medewerker@otoro.nl` |
| Wachtwoord | `OtoroMedewerker123!` |
| Naam in app | Yuki Tanaka |

### 10 testmedewerkers (juni 2026 beschikbaarheid)

Wachtwoord voor alle: **`OtoroTeam123!`**

| Naam | E-mail | Patroon |
|------|--------|---------|
| Yuki Tanaka | yuki@otoro.nl | door de week |
| Sofia de Vries | sofia@otoro.nl | weekenden |
| Marco Jansen | marco@otoro.nl | doordeweeks |
| Lin Wei | lin@otoro.nl | avonden |
| Emma Bakker | emma@otoro.nl | ochtenden |
| Ahmed Hassan | ahmed@otoro.nl | gemengd |
| Julia Smit | julia@otoro.nl | di–za |
| Kenji Yamamoto | kenji@otoro.nl | door de week |
| Fatima El Amrani | fatima@otoro.nl | weekenden |
| Tom de Groot | tom@otoro.nl | flexibel |

Opnieuw aanmaken: `npm run seed:team` (Supabase moet draaien)

Log eerst uit als manager, daarna in met het medewerker-account. Je ziet dan het medewerker-dashboard (rooster, klok, beschikbaarheid, verlof — geen medewerkersbeheer).

## Rooster & beschikbaarheid (hele maand)

**Medewerker:** klik dagen in de kalender aan/uit — alleen “beschikbaar”, **geen tijden**.

**Manager:**
1. **Beschikbaarheid** → klik een dag → zie wie beschikbaar is.
2. **Rooster** → klik dezelfde dag → vink mensen aan → standaard **16:00–21:00** (aanpasbaar per persoon) → opslaan.

Zo werk je **per dag** (niet per medewerker over de hele maand).

## Commando's

```powershell
# Supabase lokaal starten (Docker moet draaien)
npx supabase start

# Database opnieuw + schema
npx supabase db reset

# Testaccounts opnieuw aanmaken na reset
.\scripts\seed-users.ps1

# App starten
npm run dev

# Alles stoppen
npx supabase stop
```

## Cloud Supabase (productie)

Voor Vercel: maak een project op supabase.com, voer `supabase/schema.sql` uit in de SQL Editor, zet `VITE_SUPABASE_URL` en `VITE_SUPABASE_ANON_KEY` in Vercel en lokaal in `.env`.
