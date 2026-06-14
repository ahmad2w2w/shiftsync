import { LegalLayout } from '../components/layout/LegalLayout'
import { PRODUCT } from '../types/database'

export function TermsPage() {
  return (
    <LegalLayout title="Algemene voorwaarden">
      <p className="text-xs" style={{ color: 'var(--text-muted)' }}>Laatst bijgewerkt: {new Date().toLocaleDateString('nl-NL')}</p>

      <section>
        <h2 className="text-lg font-semibold" style={{ color: 'var(--color-navy)' }}>1. Toepasselijkheid</h2>
        <p>
          Deze voorwaarden gelden voor het gebruik van {PRODUCT.name} door zakelijke klanten (werkgevers/managers)
          en hun medewerkers. Door een account aan te maken ga je akkoord met deze voorwaarden.
        </p>
      </section>

      <section>
        <h2 className="text-lg font-semibold" style={{ color: 'var(--color-navy)' }}>2. Dienst</h2>
        <p>
          ShiftSync biedt online software voor roosterplanning, tijdregistratie, verlofbeheer en gerelateerde
          HR-processen. Wij streven naar hoge beschikbaarheid maar garanderen geen ononderbroken werking.
        </p>
      </section>

      <section>
        <h2 className="text-lg font-semibold" style={{ color: 'var(--color-navy)' }}>3. Abonnement & prijs</h2>
        <p>
          Het abonnement wordt gefactureerd per medewerker per maand ({PRODUCT.priceLabel} {PRODUCT.period}).
          Betaling verloopt via Stripe. Opzegging kan per maand via het klantportaal. Geen restitutie voor
          reeds betaalde perioden, tenzij wettelijk verplicht.
        </p>
      </section>

      <section>
        <h2 className="text-lg font-semibold" style={{ color: 'var(--color-navy)' }}>4. Proefperiode</h2>
        <p>
          Nieuwe organisaties kunnen starten met een proefperiode. Na afloop is een actief abonnement vereist
          voor voortgezet gebruik, tenzij anders overeengekomen.
        </p>
      </section>

      <section>
        <h2 className="text-lg font-semibold" style={{ color: 'var(--color-navy)' }}>5. Verantwoordelijkheden klant</h2>
        <ul className="list-disc space-y-1 pl-5">
          <li>Juiste en actuele gegevens van medewerkers aanleveren</li>
          <li>Medewerkers informeren over verwerking van persoonsgegevens (AVG)</li>
          <li>Accountgegevens vertrouwelijk houden</li>
          <li>Gebruik conform toepasselijke arbeids- en privacywetgeving</li>
        </ul>
      </section>

      <section>
        <h2 className="text-lg font-semibold" style={{ color: 'var(--color-navy)' }}>6. Aansprakelijkheid</h2>
        <p>
          ShiftSync is een hulpmiddel; de klant blijft verantwoordelijk voor correcte salarisadministratie en
          naleving van cao/OR-verplichtingen. Onze aansprakelijkheid is beperkt tot het bedrag dat in de
          voorgaande 12 maanden is betaald, met uitzondering van opzet of grove schuld.
        </p>
      </section>

      <section>
        <h2 className="text-lg font-semibold" style={{ color: 'var(--color-navy)' }}>7. Intellectueel eigendom</h2>
        <p>
          Alle rechten op de software blijven bij ShiftSync. Klantgegevens blijven eigendom van de klant.
        </p>
      </section>

      <section>
        <h2 className="text-lg font-semibold" style={{ color: 'var(--color-navy)' }}>8. Wijzigingen</h2>
        <p>
          Wij kunnen deze voorwaarden wijzigen. Materiële wijzigingen communiceren wij minimaal 30 dagen
          van tevoren per e-mail of in-app melding.
        </p>
      </section>

      <section>
        <h2 className="text-lg font-semibold" style={{ color: 'var(--color-navy)' }}>9. Toepasselijk recht</h2>
        <p>
          Op deze voorwaarden is Nederlands recht van toepassing. Geschillen worden voorgelegd aan de bevoegde
          rechter in Nederland.
        </p>
      </section>

      <section>
        <h2 className="text-lg font-semibold" style={{ color: 'var(--color-navy)' }}>10. Contact</h2>
        <p>
          <a href="mailto:support@shiftsync.nl" className="text-brand-600 hover:underline">support@shiftsync.nl</a>
        </p>
      </section>
    </LegalLayout>
  )
}
