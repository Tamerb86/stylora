import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Shield, Database, Eye, Lock, UserX, Globe, Mail, Clock, FileText } from "lucide-react";
import Footer from "@/components/Footer";

export default function Privacy() {
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
            <div className="p-3 rounded-xl bg-gradient-to-br from-green-500 to-green-600 text-white">
              <Shield className="h-6 w-6" />
            </div>
            <div>
              <h1 className="text-3xl font-bold">Personvernerklæring</h1>
              <p className="text-muted-foreground">Sist oppdatert: {lastUpdated}</p>
            </div>
          </div>
        </div>

        <div className="prose prose-slate max-w-none space-y-8">
          {/* Introduction */}
          <section className="bg-green-50 rounded-xl p-6 border border-green-100">
            <p className="text-lg leading-relaxed m-0">
              Denne personvernerklæringen beskriver hvordan <strong>Nexify CRM Systems AS</strong> 
              (org.nr. 936 300 278), heretter kalt "vi" eller "Stylora", samler inn, bruker, lagrer 
              og beskytter personopplysninger i forbindelse med vår tjeneste. Vi er opptatt av å 
              beskytte ditt personvern og behandler alle data i samsvar med EUs personvernforordning 
              (GDPR) og norsk personopplysningslov.
            </p>
          </section>

          {/* Section 1 */}
          <section>
            <div className="flex items-center gap-2 mb-4">
              <Database className="h-5 w-5 text-green-600" />
              <h2 className="text-xl font-bold m-0">1. Behandlingsansvarlig</h2>
            </div>
            <div className="bg-white rounded-lg border p-4">
              <p><strong>Nexify CRM Systems AS</strong></p>
              <p>Organisasjonsnummer: 936 300 278</p>
              <p>E-post: <a href="mailto:personvern@stylora.no" className="text-green-600 hover:underline">personvern@stylora.no</a></p>
              <p className="mt-4">
                Vi er behandlingsansvarlig for personopplysninger vi samler inn direkte fra deg. 
                For personopplysninger som våre kunder (salonger) registrerer om sine sluttkunder, 
                er salongen behandlingsansvarlig og vi er databehandler.
              </p>
            </div>
          </section>

          {/* Section 2 */}
          <section>
            <div className="flex items-center gap-2 mb-4">
              <Eye className="h-5 w-5 text-green-600" />
              <h2 className="text-xl font-bold m-0">2. Hvilke personopplysninger samler vi inn?</h2>
            </div>
            
            <h3 className="text-lg font-semibold mt-4">2.1 Kontoinformasjon (Salongkunder)</h3>
            <ul className="list-disc pl-6 space-y-1">
              <li>Navn og kontaktinformasjon (e-post, telefon)</li>
              <li>Bedriftsinformasjon (firmanavn, organisasjonsnummer, adresse)</li>
              <li>Påloggingsinformasjon (e-post, kryptert passord)</li>
              <li>Betalingsinformasjon (via sikker betalingsleverandør)</li>
              <li>Bruksmønstre og preferanser i tjenesten</li>
            </ul>

            <h3 className="text-lg font-semibold mt-4">2.2 Sluttkundedata (Salongenes kunder)</h3>
            <p>Salonger kan registrere følgende om sine kunder:</p>
            <ul className="list-disc pl-6 space-y-1">
              <li>Navn og kontaktinformasjon</li>
              <li>Avtalehistorikk og preferanser</li>
              <li>Notater (f.eks. allergier, ønsker)</li>
              <li>Kjøps- og betalingshistorikk</li>
              <li>Samtykke til markedsføring</li>
            </ul>

            <h3 className="text-lg font-semibold mt-4">2.3 Tekniske data</h3>
            <ul className="list-disc pl-6 space-y-1">
              <li>IP-adresse og enhetstype</li>
              <li>Nettlesertype og operativsystem</li>
              <li>Tidspunkt for innlogging og aktivitet</li>
              <li>Feillogger for feilsøking</li>
            </ul>
          </section>

          {/* Section 3 */}
          <section>
            <div className="flex items-center gap-2 mb-4">
              <FileText className="h-5 w-5 text-green-600" />
              <h2 className="text-xl font-bold m-0">3. Formål og rettslig grunnlag</h2>
            </div>
            
            <div className="overflow-x-auto">
              <table className="w-full border-collapse bg-white rounded-lg overflow-hidden">
                <thead className="bg-slate-100">
                  <tr>
                    <th className="text-left p-3 border-b">Formål</th>
                    <th className="text-left p-3 border-b">Rettslig grunnlag</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td className="p-3 border-b">Levere og administrere tjenesten</td>
                    <td className="p-3 border-b">Avtale (GDPR art. 6(1)(b))</td>
                  </tr>
                  <tr>
                    <td className="p-3 border-b">Fakturering og betaling</td>
                    <td className="p-3 border-b">Avtale og rettslig forpliktelse</td>
                  </tr>
                  <tr>
                    <td className="p-3 border-b">Kundeservice og support</td>
                    <td className="p-3 border-b">Avtale og berettiget interesse</td>
                  </tr>
                  <tr>
                    <td className="p-3 border-b">Forbedre tjenesten</td>
                    <td className="p-3 border-b">Berettiget interesse (GDPR art. 6(1)(f))</td>
                  </tr>
                  <tr>
                    <td className="p-3 border-b">Markedsføring (med samtykke)</td>
                    <td className="p-3 border-b">Samtykke (GDPR art. 6(1)(a))</td>
                  </tr>
                  <tr>
                    <td className="p-3 border-b">Oppfylle lovkrav (regnskap, skatt)</td>
                    <td className="p-3 border-b">Rettslig forpliktelse (GDPR art. 6(1)(c))</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </section>

          {/* Section 4 */}
          <section>
            <div className="flex items-center gap-2 mb-4">
              <Globe className="h-5 w-5 text-green-600" />
              <h2 className="text-xl font-bold m-0">4. Deling av personopplysninger</h2>
            </div>
            <p>Vi deler kun personopplysninger med tredjeparter når det er nødvendig:</p>
            
            <h3 className="text-lg font-semibold mt-4">4.1 Underleverandører (databehandlere)</h3>
            <ul className="list-disc pl-6 space-y-1">
              <li><strong>Skyinfrastruktur:</strong> Amazon Web Services (AWS) - EU-region</li>
              <li><strong>Betalingsbehandling:</strong> Stripe, Vipps</li>
              <li><strong>SMS-tjenester:</strong> PSWinCom, Link Mobility</li>
              <li><strong>E-posttjenester:</strong> Amazon SES</li>
            </ul>
            <p className="mt-4">
              Alle underleverandører er bundet av databehandleravtaler og behandler data kun 
              på våre instrukser.
            </p>

            <h3 className="text-lg font-semibold mt-4">4.2 Lovpålagt utlevering</h3>
            <p>
              Vi kan utlevere data dersom det kreves av norsk lov, domstolsavgjørelse eller 
              offentlig myndighet med lovlig hjemmel.
            </p>
          </section>

          {/* Section 5 */}
          <section>
            <div className="flex items-center gap-2 mb-4">
              <Lock className="h-5 w-5 text-green-600" />
              <h2 className="text-xl font-bold m-0">5. Sikkerhet</h2>
            </div>
            <p>Vi implementerer omfattende sikkerhetstiltak:</p>
            <ul className="list-disc pl-6 space-y-1">
              <li><strong>Kryptering:</strong> All dataoverføring skjer via HTTPS/TLS</li>
              <li><strong>Passord:</strong> Lagres med bcrypt-hashing (aldri i klartekst)</li>
              <li><strong>Tilgangskontroll:</strong> Rollebasert tilgang og minste privilegiums prinsipp</li>
              <li><strong>Logging:</strong> Alle kritiske handlinger logges for revisjon</li>
              <li><strong>Backup:</strong> Regelmessige sikkerhetskopier med kryptering</li>
              <li><strong>Servere:</strong> Alle data lagres på sikre servere i EU/EØS</li>
            </ul>
          </section>

          {/* Section 6 */}
          <section>
            <div className="flex items-center gap-2 mb-4">
              <Clock className="h-5 w-5 text-green-600" />
              <h2 className="text-xl font-bold m-0">6. Lagringstid</h2>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full border-collapse bg-white rounded-lg overflow-hidden">
                <thead className="bg-slate-100">
                  <tr>
                    <th className="text-left p-3 border-b">Datatype</th>
                    <th className="text-left p-3 border-b">Lagringstid</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td className="p-3 border-b">Kontoinformasjon</td>
                    <td className="p-3 border-b">Så lenge kontoen er aktiv + 30 dager</td>
                  </tr>
                  <tr>
                    <td className="p-3 border-b">Transaksjonsdata</td>
                    <td className="p-3 border-b">5 år (regnskapsloven)</td>
                  </tr>
                  <tr>
                    <td className="p-3 border-b">Sluttkundedata</td>
                    <td className="p-3 border-b">Styres av salongen (behandlingsansvarlig)</td>
                  </tr>
                  <tr>
                    <td className="p-3 border-b">Tekniske logger</td>
                    <td className="p-3 border-b">90 dager</td>
                  </tr>
                  <tr>
                    <td className="p-3 border-b">Markedsføringssamtykke</td>
                    <td className="p-3 border-b">Til samtykket trekkes tilbake</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </section>

          {/* Section 7 - GDPR Rights */}
          <section className="bg-blue-50 rounded-xl p-6 border border-blue-100">
            <div className="flex items-center gap-2 mb-4">
              <UserX className="h-5 w-5 text-blue-600" />
              <h2 className="text-xl font-bold m-0">7. Dine rettigheter (GDPR)</h2>
            </div>
            <p className="mb-4">Som registrert har du følgende rettigheter:</p>
            
            <div className="grid md:grid-cols-2 gap-4">
              <div className="bg-white rounded-lg p-4 border">
                <h4 className="font-semibold text-blue-600">Rett til innsyn</h4>
                <p className="text-sm">Du kan be om kopi av alle personopplysninger vi har om deg.</p>
              </div>
              <div className="bg-white rounded-lg p-4 border">
                <h4 className="font-semibold text-blue-600">Rett til retting</h4>
                <p className="text-sm">Du kan be om at feilaktige opplysninger rettes.</p>
              </div>
              <div className="bg-white rounded-lg p-4 border">
                <h4 className="font-semibold text-blue-600">Rett til sletting</h4>
                <p className="text-sm">Du kan be om at dine data slettes ("retten til å bli glemt").</p>
              </div>
              <div className="bg-white rounded-lg p-4 border">
                <h4 className="font-semibold text-blue-600">Rett til dataportabilitet</h4>
                <p className="text-sm">Du kan be om å få dine data i et maskinlesbart format.</p>
              </div>
              <div className="bg-white rounded-lg p-4 border">
                <h4 className="font-semibold text-blue-600">Rett til å protestere</h4>
                <p className="text-sm">Du kan protestere mot behandling basert på berettiget interesse.</p>
              </div>
              <div className="bg-white rounded-lg p-4 border">
                <h4 className="font-semibold text-blue-600">Rett til begrensning</h4>
                <p className="text-sm">Du kan be om at behandlingen begrenses i visse tilfeller.</p>
              </div>
            </div>

            <div className="mt-6 p-4 bg-white rounded-lg border-2 border-blue-200">
              <h4 className="font-semibold mb-2">Hvordan utøve dine rettigheter?</h4>
              <p className="text-sm mb-3">
                Send en forespørsel til <a href="mailto:personvern@stylora.no" className="text-blue-600 hover:underline">personvern@stylora.no</a> 
                eller bruk "Slett mine data"-funksjonen i innstillingene. Vi svarer innen 30 dager.
              </p>
              <p className="text-sm text-muted-foreground">
                <strong>For sluttkunder av salonger:</strong> Kontakt salongen direkte, da de er 
                behandlingsansvarlig for dine data.
              </p>
            </div>
          </section>

          {/* Section 8 */}
          <section>
            <div className="flex items-center gap-2 mb-4">
              <Globe className="h-5 w-5 text-green-600" />
              <h2 className="text-xl font-bold m-0">8. Overføring til tredjeland</h2>
            </div>
            <p>
              Vi lagrer primært alle data på servere i EU/EØS. Dersom data overføres til land 
              utenfor EU/EØS (f.eks. ved bruk av visse skytjenester), sikrer vi at det foreligger 
              tilstrekkelig beskyttelsesnivå gjennom:
            </p>
            <ul className="list-disc pl-6 space-y-1">
              <li>EU-kommisjonens standard kontraktsklausuler (SCCs)</li>
              <li>Binding Corporate Rules (BCRs)</li>
              <li>Tilstrekkelighetsbeslutninger fra EU-kommisjonen</li>
            </ul>
          </section>

          {/* Section 9 */}
          <section>
            <div className="flex items-center gap-2 mb-4">
              <FileText className="h-5 w-5 text-green-600" />
              <h2 className="text-xl font-bold m-0">9. Informasjonskapsler (Cookies)</h2>
            </div>
            <p>Vi bruker følgende typer informasjonskapsler:</p>
            <ul className="list-disc pl-6 space-y-1">
              <li><strong>Nødvendige:</strong> For pålogging og sikkerhet (krever ikke samtykke)</li>
              <li><strong>Funksjonelle:</strong> For å huske preferanser</li>
              <li><strong>Analytiske:</strong> For å forstå bruksmønstre (anonymisert)</li>
            </ul>
            <p className="mt-4">
              Vi bruker ikke informasjonskapsler for reklame eller sporing på tvers av nettsteder.
            </p>
          </section>

          {/* Section 10 */}
          <section>
            <div className="flex items-center gap-2 mb-4">
              <Shield className="h-5 w-5 text-green-600" />
              <h2 className="text-xl font-bold m-0">10. Endringer i personvernerklæringen</h2>
            </div>
            <p>
              Vi kan oppdatere denne personvernerklæringen ved behov. Vesentlige endringer varsles 
              via e-post og/eller i tjenesten minimum 30 dager før de trer i kraft. Vi oppfordrer 
              deg til å gjennomgå denne siden regelmessig.
            </p>
          </section>

          {/* Section 11 - Complaints */}
          <section>
            <div className="flex items-center gap-2 mb-4">
              <Mail className="h-5 w-5 text-green-600" />
              <h2 className="text-xl font-bold m-0">11. Klagerett</h2>
            </div>
            <p>
              Dersom du mener at vi behandler personopplysninger i strid med personvernregelverket, 
              har du rett til å klage til Datatilsynet:
            </p>
            <div className="bg-white rounded-lg border p-4 mt-4">
              <p><strong>Datatilsynet</strong></p>
              <p>Postboks 458 Sentrum</p>
              <p>0105 Oslo</p>
              <p>Telefon: 22 39 69 00</p>
              <p>E-post: <a href="mailto:postkasse@datatilsynet.no" className="text-green-600 hover:underline">postkasse@datatilsynet.no</a></p>
              <p>Nettside: <a href="https://www.datatilsynet.no" target="_blank" rel="noopener noreferrer" className="text-green-600 hover:underline">www.datatilsynet.no</a></p>
            </div>
          </section>

          {/* Contact */}
          <section className="bg-slate-50 rounded-xl p-6 border">
            <div className="flex items-center gap-2 mb-4">
              <Mail className="h-5 w-5 text-green-600" />
              <h2 className="text-xl font-bold m-0">12. Kontakt oss</h2>
            </div>
            <p className="mb-4">For spørsmål om personvern, kontakt oss:</p>
            <div className="bg-white rounded-lg border p-4 space-y-2">
              <p><strong>Nexify CRM Systems AS</strong></p>
              <p>Organisasjonsnummer: 936 300 278</p>
              <p>E-post for personvern: <a href="mailto:personvern@stylora.no" className="text-green-600 hover:underline">personvern@stylora.no</a></p>
              <p>Generell support: <a href="mailto:support@stylora.no" className="text-green-600 hover:underline">support@stylora.no</a></p>
            </div>
          </section>
        </div>

        {/* Back to top */}
        <div className="mt-12 text-center">
          <Link href="/terms">
            <Button variant="outline" className="mr-4">
              Les vilkår for bruk
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
