import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { ArrowLeft, FileText, Scale, Shield, AlertTriangle, Clock, CreditCard, Ban, Mail } from "lucide-react";
import Footer from "@/components/Footer";

export default function Terms() {
  const lastUpdated = "16. desember 2024";

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white">
      {/* Header */}
      <header className="border-b bg-white/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="container flex items-center justify-between h-16">
          <Link href="/">
            <span className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-orange-500 bg-clip-text text-transparent">
              Stylora
            </span>
          </Link>
          <Link href="/">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Tilbake til forsiden
            </Button>
          </Link>
        </div>
      </header>

      {/* Content */}
      <main className="container py-12 max-w-4xl">
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-3 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 text-white">
              <FileText className="h-6 w-6" />
            </div>
            <div>
              <h1 className="text-3xl font-bold">Vilkår for bruk</h1>
              <p className="text-muted-foreground">Sist oppdatert: {lastUpdated}</p>
            </div>
          </div>
        </div>

        <div className="prose prose-slate max-w-none space-y-8">
          {/* Introduction */}
          <section className="bg-blue-50 rounded-xl p-6 border border-blue-100">
            <p className="text-lg leading-relaxed m-0">
              Disse vilkårene regulerer din bruk av Stylora, en skybasert programvare for salongstyring 
              levert av <strong>Nexify CRM Systems AS</strong> (org.nr. 936 300 278). Ved å opprette en 
              konto eller bruke tjenesten, aksepterer du disse vilkårene i sin helhet.
            </p>
          </section>

          {/* Section 1 */}
          <section>
            <div className="flex items-center gap-2 mb-4">
              <Scale className="h-5 w-5 text-blue-600" />
              <h2 className="text-xl font-bold m-0">1. Definisjoner</h2>
            </div>
            <div className="bg-white rounded-lg border p-4 space-y-2">
              <p><strong>"Tjenesten"</strong> refererer til Stylora-plattformen, inkludert alle funksjoner, applikasjoner og tilknyttede tjenester.</p>
              <p><strong>"Bruker"</strong> refererer til enhver person eller enhet som oppretter en konto eller bruker Tjenesten.</p>
              <p><strong>"Abonnement"</strong> refererer til den betalte tilgangen til Tjenesten basert på valgt prisplan.</p>
              <p><strong>"Kundedata"</strong> refererer til all informasjon som Brukeren lagrer i Tjenesten, inkludert kundeinformasjon, avtaler og transaksjoner.</p>
              <p><strong>"Leverandør"</strong> refererer til Nexify CRM Systems AS.</p>
            </div>
          </section>

          {/* Section 2 */}
          <section>
            <div className="flex items-center gap-2 mb-4">
              <Shield className="h-5 w-5 text-blue-600" />
              <h2 className="text-xl font-bold m-0">2. Tjenestebeskrivelse</h2>
            </div>
            <p>Stylora er en skybasert programvare (SaaS) som tilbyr:</p>
            <ul className="list-disc pl-6 space-y-1">
              <li>Timebestilling og kalenderadministrasjon</li>
              <li>Kunderegistrering og -administrasjon</li>
              <li>Ansattadministrasjon og provisjonsberegning</li>
              <li>Kassasystem (POS) og betalingsintegrasjon</li>
              <li>SMS- og e-postvarsler</li>
              <li>Rapportering og analyse</li>
              <li>Integrasjon med regnskapssystemer</li>
            </ul>
            <p className="mt-4">
              Leverandøren forbeholder seg retten til å endre, oppdatere eller fjerne funksjoner 
              med rimelig varsel til Brukeren.
            </p>
          </section>

          {/* Section 3 */}
          <section>
            <div className="flex items-center gap-2 mb-4">
              <CreditCard className="h-5 w-5 text-blue-600" />
              <h2 className="text-xl font-bold m-0">3. Abonnement og betaling</h2>
            </div>
            
            <h3 className="text-lg font-semibold mt-4">3.1 Prisplaner</h3>
            <p>
              Tjenesten tilbys i ulike prisplaner som beskrevet på vår nettside. Prisene er oppgitt 
              i norske kroner (NOK) og er eksklusive merverdiavgift (MVA) med mindre annet er angitt.
            </p>

            <h3 className="text-lg font-semibold mt-4">3.2 Prøveperiode</h3>
            <p>
              Nye brukere kan få tilgang til en gratis prøveperiode på 14 dager. Etter prøveperioden 
              kreves et aktivt abonnement for fortsatt bruk.
            </p>

            <h3 className="text-lg font-semibold mt-4">3.3 Fakturering</h3>
            <p>
              Abonnementet faktureres månedlig eller årlig forskuddsvis, avhengig av valgt plan. 
              Betalingen skjer via de betalingsmetodene som er tilgjengelige i Tjenesten.
            </p>

            <h3 className="text-lg font-semibold mt-4">3.4 Prisendringer</h3>
            <p>
              Leverandøren kan endre prisene med minimum 30 dagers skriftlig varsel. Eksisterende 
              abonnementer påvirkes først ved neste fornyelsesperiode.
            </p>
          </section>

          {/* Section 4 */}
          <section>
            <div className="flex items-center gap-2 mb-4">
              <Clock className="h-5 w-5 text-blue-600" />
              <h2 className="text-xl font-bold m-0">4. Oppsigelse og refusjon</h2>
            </div>
            
            <h3 className="text-lg font-semibold mt-4">4.1 Oppsigelse av Bruker</h3>
            <p>
              Brukeren kan si opp abonnementet når som helst via kontrollpanelet eller ved å kontakte 
              kundeservice. Oppsigelsen trer i kraft ved slutten av gjeldende faktureringsperiode.
            </p>

            <h3 className="text-lg font-semibold mt-4">4.2 Ingen bindingstid</h3>
            <p>
              Det er ingen bindingstid på abonnementet. Brukeren kan avslutte når som helst uten 
              ekstra kostnader.
            </p>

            <h3 className="text-lg font-semibold mt-4">4.3 Refusjon</h3>
            <p>
              Forhåndsbetalte beløp refunderes ikke ved oppsigelse midt i en faktureringsperiode, 
              med mindre annet er avtalt eller påkrevd av gjeldende forbrukerlovgivning.
            </p>

            <h3 className="text-lg font-semibold mt-4">4.4 Dataeksport</h3>
            <p>
              Ved oppsigelse har Brukeren rett til å eksportere sine data i 30 dager etter 
              oppsigelsesdatoen. Etter denne perioden slettes dataene permanent.
            </p>
          </section>

          {/* Section 5 */}
          <section>
            <div className="flex items-center gap-2 mb-4">
              <Ban className="h-5 w-5 text-blue-600" />
              <h2 className="text-xl font-bold m-0">5. Brukerens forpliktelser</h2>
            </div>
            <p>Ved å bruke Tjenesten forplikter Brukeren seg til å:</p>
            <ul className="list-disc pl-6 space-y-1">
              <li>Oppgi korrekt og oppdatert informasjon ved registrering</li>
              <li>Holde påloggingsinformasjon konfidensiell og sikker</li>
              <li>Ikke dele kontotilgang med uautoriserte personer</li>
              <li>Overholde gjeldende lover og forskrifter, inkludert personvernlovgivning (GDPR)</li>
              <li>Ikke bruke Tjenesten til ulovlige eller skadelige formål</li>
              <li>Ikke forsøke å omgå sikkerhetstiltak eller tekniske begrensninger</li>
              <li>Varsle Leverandøren umiddelbart ved mistanke om uautorisert tilgang</li>
            </ul>
          </section>

          {/* Section 6 */}
          <section>
            <div className="flex items-center gap-2 mb-4">
              <Shield className="h-5 w-5 text-blue-600" />
              <h2 className="text-xl font-bold m-0">6. Personvern og datasikkerhet</h2>
            </div>
            <p>
              Behandling av personopplysninger reguleres av vår <Link href="/privacy" className="text-blue-600 hover:underline">Personvernerklæring</Link>. 
              Leverandøren forplikter seg til å:
            </p>
            <ul className="list-disc pl-6 space-y-1">
              <li>Behandle alle data i samsvar med GDPR og norsk personvernlovgivning</li>
              <li>Lagre data på sikre servere innenfor EU/EØS</li>
              <li>Implementere tekniske og organisatoriske sikkerhetstiltak</li>
              <li>Ikke dele data med tredjeparter uten samtykke eller lovlig grunnlag</li>
              <li>Varsle om eventuelle sikkerhetsbrudd innen 72 timer</li>
            </ul>
          </section>

          {/* Section 7 */}
          <section>
            <div className="flex items-center gap-2 mb-4">
              <AlertTriangle className="h-5 w-5 text-blue-600" />
              <h2 className="text-xl font-bold m-0">7. Ansvarsbegrensning</h2>
            </div>
            
            <h3 className="text-lg font-semibold mt-4">7.1 Tilgjengelighet</h3>
            <p>
              Leverandøren tilstreber 99,9% oppetid, men garanterer ikke uavbrutt tilgang. 
              Planlagt vedlikehold varsles minimum 24 timer i forveien.
            </p>

            <h3 className="text-lg font-semibold mt-4">7.2 Ansvarsbegrensning</h3>
            <p>
              Leverandørens totale ansvar er begrenset til beløpet Brukeren har betalt for 
              Tjenesten de siste 12 månedene. Leverandøren er ikke ansvarlig for:
            </p>
            <ul className="list-disc pl-6 space-y-1">
              <li>Indirekte tap, følgeskader eller tapt fortjeneste</li>
              <li>Tap som skyldes Brukerens egen uaktsomhet</li>
              <li>Tap som skyldes tredjepartstjenester (betalingsleverandører, SMS-tjenester, etc.)</li>
              <li>Force majeure-hendelser</li>
            </ul>

            <h3 className="text-lg font-semibold mt-4">7.3 Backup</h3>
            <p>
              Leverandøren tar regelmessige sikkerhetskopier, men Brukeren oppfordres til å 
              eksportere viktige data jevnlig.
            </p>
          </section>

          {/* Section 8 */}
          <section>
            <div className="flex items-center gap-2 mb-4">
              <Scale className="h-5 w-5 text-blue-600" />
              <h2 className="text-xl font-bold m-0">8. Immaterielle rettigheter</h2>
            </div>
            <p>
              Alle immaterielle rettigheter til Tjenesten, inkludert programvare, design, 
              varemerker og dokumentasjon, tilhører Leverandøren. Brukeren får en begrenset, 
              ikke-eksklusiv lisens til å bruke Tjenesten i abonnementsperioden.
            </p>
            <p className="mt-4">
              Brukeren beholder alle rettigheter til sine egne data (Kundedata) som lagres i Tjenesten.
            </p>
          </section>

          {/* Section 9 */}
          <section>
            <div className="flex items-center gap-2 mb-4">
              <Ban className="h-5 w-5 text-blue-600" />
              <h2 className="text-xl font-bold m-0">9. Suspensjon og opphør</h2>
            </div>
            <p>Leverandøren kan suspendere eller avslutte Brukerens tilgang ved:</p>
            <ul className="list-disc pl-6 space-y-1">
              <li>Manglende betaling etter purring</li>
              <li>Brudd på disse vilkårene</li>
              <li>Ulovlig eller skadelig bruk av Tjenesten</li>
              <li>Mistanke om svindel eller misbruk</li>
            </ul>
            <p className="mt-4">
              Ved suspensjon gis Brukeren rimelig tid til å rette opp forholdet før eventuell 
              permanent avslutning.
            </p>
          </section>

          {/* Section 10 */}
          <section>
            <div className="flex items-center gap-2 mb-4">
              <FileText className="h-5 w-5 text-blue-600" />
              <h2 className="text-xl font-bold m-0">10. Endringer i vilkårene</h2>
            </div>
            <p>
              Leverandøren kan endre disse vilkårene med minimum 30 dagers varsel. Vesentlige 
              endringer varsles via e-post og/eller i Tjenesten. Fortsatt bruk etter 
              endringstidspunktet anses som aksept av de nye vilkårene.
            </p>
          </section>

          {/* Section 11 */}
          <section>
            <div className="flex items-center gap-2 mb-4">
              <Scale className="h-5 w-5 text-blue-600" />
              <h2 className="text-xl font-bold m-0">11. Lovvalg og tvisteløsning</h2>
            </div>
            <p>
              Disse vilkårene er underlagt norsk lov. Eventuelle tvister skal først forsøkes 
              løst gjennom forhandlinger. Dersom enighet ikke oppnås, skal tvisten avgjøres 
              av de ordinære norske domstolene med Oslo tingrett som verneting.
            </p>
          </section>

          {/* Contact */}
          <section className="bg-slate-50 rounded-xl p-6 border">
            <div className="flex items-center gap-2 mb-4">
              <Mail className="h-5 w-5 text-blue-600" />
              <h2 className="text-xl font-bold m-0">12. Kontaktinformasjon</h2>
            </div>
            <p className="mb-4">For spørsmål om disse vilkårene, kontakt oss:</p>
            <div className="bg-white rounded-lg border p-4 space-y-2">
              <p><strong>Nexify CRM Systems AS</strong></p>
              <p>Organisasjonsnummer: 936 300 278</p>
              <p>E-post: <a href="mailto:support@stylora.no" className="text-blue-600 hover:underline">support@stylora.no</a></p>
              <p>Nettside: <a href="https://stylora.no" className="text-blue-600 hover:underline">stylora.no</a></p>
            </div>
          </section>
        </div>

        {/* Back to top */}
        <div className="mt-12 text-center">
          <Link href="/privacy">
            <Button variant="outline" className="mr-4">
              Les personvernerklæringen
            </Button>
          </Link>
          <Link href="/">
            <Button>
              Tilbake til forsiden
            </Button>
          </Link>
        </div>
      </main>

      <Footer />
    </div>
  );
}
