import { LegalLayout } from '../components/layout/LegalLayout'

export function PrivacyPage() {
  return (
    <LegalLayout title="Privacyverklaring">
      <p className="text-xs" style={{ color: 'var(--text-muted)' }}>Laatst bijgewerkt: {new Date().toLocaleDateString('nl-NL')}</p>

      <section>
        <h2 className="text-lg font-semibold" style={{ color: 'var(--color-navy)' }}>1. Wie zijn wij?</h2>
        <p>
          ShiftSync (&quot;wij&quot;) levert software voor personeelsplanning. Deze privacyverklaring geldt voor
          het gebruik van onze website en applicatie door managers en medewerkers van klantorganisaties.
        </p>
      </section>

      <section>
        <h2 className="text-lg font-semibold" style={{ color: 'var(--color-navy)' }}>2. Welke gegevens verwerken wij?</h2>
        <ul className="list-disc space-y-1 pl-5">
          <li>Accountgegevens: naam, e-mailadres, rol</li>
          <li>Planningsgegevens: roosters, beschikbaarheid, verlof, ziekmeldingen</li>
          <li>Tijdregistratie: in- en uitkloktijden, pauzes</li>
          <li>Locatiegegevens (optioneel): GPS-coördinaten bij in-/uitklokken indien ingeschakeld door de werkgever</li>
          <li>Facturatiegegevens via Stripe (abonnement, betalingen)</li>
        </ul>
      </section>

      <section>
        <h2 className="text-lg font-semibold" style={{ color: 'var(--color-navy)' }}>3. Doeleinden & rechtsgrond</h2>
        <p>
          Wij verwerken gegevens om de dienst te leveren (uitvoering overeenkomst), voor beveiliging en
          fraudepreventie (gerechtvaardigd belang), en waar nodig op basis van toestemming (bijv. optionele
          GPS-controle, ingesteld door de werkgever).
        </p>
        <p className="mt-2">
          <strong>Let op voor werkgevers:</strong> jij bent verwerkingsverantwoordelijke voor personeelsgegevens
          van je medewerkers. ShiftSync treedt op als verwerker. Een verwerkersovereenkomst (DPA) is beschikbaar
          op aanvraag via <a href="mailto:support@shiftsync.nl" className="text-brand-600 hover:underline">support@shiftsync.nl</a>.
        </p>
      </section>

      <section>
        <h2 className="text-lg font-semibold" style={{ color: 'var(--color-navy)' }}>4. Bewaartermijn</h2>
        <p>
          Gegevens worden bewaard zolang het account actief is. Na beëindiging van het abonnement worden
          gegevens binnen 90 dagen verwijderd, tenzij wettelijke bewaarplicht anders vereist.
        </p>
      </section>

      <section>
        <h2 className="text-lg font-semibold" style={{ color: 'var(--color-navy)' }}>5. Jouw rechten (AVG)</h2>
        <p>Je hebt recht op inzage, rectificatie, verwijdering, beperking, dataportabiliteit en bezwaar. Neem contact op via support@shiftsync.nl. Medewerkers kunnen gegevens opvragen via hun manager of via het profiel in de app.</p>
      </section>

      <section>
        <h2 className="text-lg font-semibold" style={{ color: 'var(--color-navy)' }}>6. Beveiliging</h2>
        <p>
          Gegevens worden versleuteld verzonden (HTTPS/TLS). Elke organisatie heeft een afgeschermde omgeving
          (multi-tenant isolatie via Row Level Security). Toegang is beperkt tot geautoriseerde gebruikers.
        </p>
      </section>

      <section>
        <h2 className="text-lg font-semibold" style={{ color: 'var(--color-navy)' }}>7. Cookies</h2>
        <p>
          Wij gebruiken functionele cookies en lokale opslag voor authenticatie en thema-voorkeur. Geen
          tracking-cookies van derden voor advertenties.
        </p>
      </section>

      <section>
        <h2 className="text-lg font-semibold" style={{ color: 'var(--color-navy)' }}>8. Contact</h2>
        <p>
          Vragen over privacy? Mail naar{' '}
          <a href="mailto:support@shiftsync.nl" className="text-brand-600 hover:underline">support@shiftsync.nl</a>.
        </p>
      </section>
    </LegalLayout>
  )
}
