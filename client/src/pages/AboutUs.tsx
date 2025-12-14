import { Button } from "@/components/ui/button";
import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  Heart, 
  Target, 
  Users, 
  Sparkles,
  CheckCircle2,
  ArrowRight,
  Mail,
  Menu,
  X
} from "lucide-react";
import { Link } from "wouter";

export default function AboutUs() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = React.useState(false);
  const values = [
    {
      icon: Heart,
      title: "Kundefokus",
      description: "Vi setter alltid kundenes behov først. Hver funksjon vi utvikler er designet for å gjøre hverdagen enklere for salongene våre.",
      color: "from-pink-500 to-rose-500"
    },
    {
      icon: Target,
      title: "Innovasjon",
      description: "Vi tror på kontinuerlig forbedring. Teknologien utvikler seg, og det gjør også vi. Vi lytter til tilbakemeldinger og implementerer nye løsninger.",
      color: "from-blue-500 to-cyan-500"
    },
    {
      icon: Users,
      title: "Partnerskap",
      description: "Vi er ikke bare en leverandør – vi er din partner. Din suksess er vår suksess, og vi jobber sammen for å nå dine mål.",
      color: "from-purple-500 to-pink-500"
    },
    {
      icon: Sparkles,
      title: "Enkelhet",
      description: "Komplekse problemer krever enkle løsninger. Vi designer intuitive systemer som alle kan bruke, uansett teknisk bakgrunn.",
      color: "from-orange-500 to-red-500"
    }
  ];

  const milestones = [
    { year: "2023", event: "Stylora grunnlegges med visjonen om å digitalisere skjønnhetsbransjen" },
    { year: "2024", event: "Lansering av første versjon med booking, kalender og kundeadministrasjon" },
    { year: "2024", event: "Over 100 salonger i Norge bruker Stylora daglig" },
    { year: "2025", event: "Utvidelse med betalingsintegrasjon, lojalitetsprogram og avansert rapportering" }
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Navigation */}
      <nav className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-50">
        <div className="container flex h-16 items-center justify-between">
          <Link href="/">
            <Button variant="ghost" className="flex items-center gap-2 hover:bg-transparent">
              <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-blue-600 via-purple-600 to-orange-500 flex items-center justify-center shadow-lg">
                <svg viewBox="0 0 24 24" className="w-6 h-6" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M 16 4 C 16 4 18 4 18 6 C 18 8 16 8 14 8 L 10 8 C 8 8 6 8 6 10 C 6 12 8 12 10 12 L 14 12 C 16 12 18 12 18 14 C 18 16 16 16 14 16 L 10 16 C 8 16 6 16 6 18 C 6 20 8 20 8 20" 
                        stroke="white" 
                        strokeWidth="2" 
                        strokeLinecap="round" 
                        fill="none"/>
                  <line x1="18" y1="6" x2="20" y2="6" stroke="white" strokeWidth="1.5" strokeLinecap="round"/>
                  <line x1="18" y1="9" x2="20" y2="9" stroke="white" strokeWidth="1.5" strokeLinecap="round"/>
                  <line x1="18" y1="12" x2="20" y2="12" stroke="white" strokeWidth="1.5" strokeLinecap="round"/>
                  <line x1="18" y1="15" x2="20" y2="15" stroke="white" strokeWidth="1.5" strokeLinecap="round"/>
                  <line x1="6" y1="10" x2="4" y2="10" stroke="white" strokeWidth="1.5" strokeLinecap="round"/>
                  <line x1="6" y1="13" x2="4" y2="13" stroke="white" strokeWidth="1.5" strokeLinecap="round"/>
                  <line x1="6" y1="16" x2="4" y2="16" stroke="white" strokeWidth="1.5" strokeLinecap="round"/>
                </svg>
              </div>
              <span className="font-bold text-xl bg-gradient-to-r from-blue-600 via-purple-600 to-orange-500 bg-clip-text text-transparent">
                Stylora
              </span>
            </Button>
          </Link>
          <div className="flex items-center gap-4">
            <Link href="/">
              <Button variant="ghost" className="hidden md:inline-flex">
                Tilbake til hovedsiden
              </Button>
            </Link>
            
            {/* Mobile Menu Button */}
            <Button
              variant="ghost"
              size="icon"
              className="md:hidden"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            >
              {isMobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </Button>
          </div>
        </div>
      </nav>

      {/* Mobile Menu Overlay */}
      {isMobileMenuOpen && (
        <div className="fixed inset-0 z-40 md:hidden">
          {/* Backdrop */}
          <div 
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={() => setIsMobileMenuOpen(false)}
          />
          
          {/* Menu Panel */}
          <div className="absolute top-16 right-0 left-0 bg-background border-b shadow-2xl">
            <div className="container py-6 space-y-4">
              <Link href="/">
                <Button 
                  variant="outline" 
                  className="w-full justify-start text-lg"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  Tilbake til hovedsiden
                </Button>
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* Hero Section */}
      <section className="py-20 md:py-32 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-50 via-purple-50 to-orange-50 dark:from-blue-950/20 dark:via-purple-950/20 dark:to-orange-950/20"></div>
        <div className="container relative z-10">
          <div className="max-w-4xl mx-auto text-center space-y-6">
            <Badge variant="secondary" className="px-6 py-2">
              <Heart className="w-4 h-4 mr-2 inline fill-current" />
              Om Stylora
            </Badge>
            <h1 className="text-5xl md:text-6xl font-extrabold tracking-tight">
              Fortelling om <span className="bg-gradient-to-r from-blue-600 via-purple-600 to-orange-500 bg-clip-text text-transparent">Stylora</span>
            </h1>
            <div className="text-lg text-muted-foreground max-w-3xl mx-auto space-y-6 text-left">
              <p className="leading-relaxed">
                Stylora startet med en enkel observasjon: Mange norske salonger bruker for kompliserte systemer som stjeler tid, skaper frustrasjon og gjør arbeidshverdagen unødvendig tung. Vi ønsket å gjøre det motsatte – å skape et verktøy som gir ro, oversikt og flyt.
              </p>
              <p className="leading-relaxed">
                Navnet Stylora ble valgt fordi det kombinerer to verdier vi mener er grunnleggende for bransjen: <strong>stil</strong> og <strong>harmoni</strong>. «Style» representerer skjønnhet, presisjon og faglig stolthet. Endelsen «-ora» gir en myk, nordisk klang og signaliserer ro og balanse. Sammen danner de et navn som er både moderne og tidløst, lett å uttale på flere språk, og som speiler vår ambisjon om å skape et system som føles naturlig i den norske hverdagen.
              </p>
              <p className="leading-relaxed">
                Historien vår begynte med å lytte til salongeiere: hva hindrer dem, hva savner de, hva bruker de for mye tid på? Svarene var tydelige. De trengte en løsning som er enkel å forstå, behagelig å bruke og som faktisk hjelper dem å fokusere på det viktigste – kundene sine.
              </p>
              <p className="leading-relaxed">
                Derfor ble Stylora utviklet med et nordisk, minimalistisk uttrykk og funksjoner som gjør arbeidshverdagen lettere, ikke tyngre. Vårt mål er ikke bare å levere teknologi, men å skape en opplevelse som gir trygghet, struktur og profesjonell flyt.
              </p>
              <p className="leading-relaxed font-semibold text-foreground">
                Stylora er resultatet av et ønske om å forenkle, forbedre og løfte hverdagen til norske salonger – med et navn som gjenspeiler akkurat det.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Vision & Mission */}
      <section className="py-20 md:py-32">
        <div className="container max-w-6xl">
          <div className="grid md:grid-cols-2 gap-12">
            {/* Vision */}
            <Card className="border-2 hover:shadow-xl transition-all duration-300">
              <CardContent className="pt-8 pb-8">
                <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center mb-6 shadow-lg">
                  <Target className="h-8 w-8 text-white" />
                </div>
                <h2 className="text-3xl font-bold mb-4">Vår visjon</h2>
                <p className="text-lg text-muted-foreground leading-relaxed">
                  Å bli Norges ledende plattform for salongadministrasjon, hvor hver frisør, barber og skjønnhetsekspert kan fokusere på det de elsker – å skape vakre opplevelser for sine kunder – mens vi tar oss av resten.
                </p>
              </CardContent>
            </Card>

            {/* Mission */}
            <Card className="border-2 hover:shadow-xl transition-all duration-300">
              <CardContent className="pt-8 pb-8">
                <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center mb-6 shadow-lg">
                  <Sparkles className="h-8 w-8 text-white" />
                </div>
                <h2 className="text-3xl font-bold mb-4">Vårt oppdrag</h2>
                <p className="text-lg text-muted-foreground leading-relaxed">
                  Vi forenkler hverdagen for norske salonger ved å tilby intuitive, kraftige verktøy som automatiserer booking, kundeadministrasjon, betalinger og rapportering – alt i én plattform.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Values Section */}
      <section className="py-20 md:py-32 bg-accent/30">
        <div className="container max-w-6xl">
          <div className="text-center mb-16">
            <Badge variant="outline" className="mb-4">Våre verdier</Badge>
            <h2 className="text-4xl md:text-5xl font-bold mb-6">
              Hva vi <span className="bg-gradient-to-r from-blue-600 to-orange-500 bg-clip-text text-transparent">står for</span>
            </h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Våre verdier styrer alt vi gjør – fra produktutvikling til kundeservice
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-8">
            {values.map((value, index) => (
              <Card key={index} className="border-2 hover:shadow-xl transition-all duration-300 group">
                <CardContent className="pt-8 pb-8">
                  <div className={`w-16 h-16 rounded-xl bg-gradient-to-br ${value.color} flex items-center justify-center mb-6 shadow-lg group-hover:scale-110 transition-transform`}>
                    <value.icon className="h-8 w-8 text-white" />
                  </div>
                  <h3 className="text-2xl font-bold mb-3">{value.title}</h3>
                  <p className="text-muted-foreground leading-relaxed">
                    {value.description}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Timeline/Milestones */}
      <section className="py-20 md:py-32">
        <div className="container max-w-4xl">
          <div className="text-center mb-16">
            <Badge variant="outline" className="mb-4">Vår reise</Badge>
            <h2 className="text-4xl md:text-5xl font-bold mb-6">
              Fra idé til <span className="bg-gradient-to-r from-blue-600 to-orange-500 bg-clip-text text-transparent">virkelighet</span>
            </h2>
          </div>

          <div className="space-y-8">
            {milestones.map((milestone, index) => (
              <div key={index} className="flex items-start gap-6 group">
                <div className="shrink-0">
                  <div className="w-16 h-16 rounded-full bg-gradient-to-br from-blue-600 to-orange-500 flex items-center justify-center text-white font-bold text-lg shadow-lg group-hover:scale-110 transition-transform">
                    {milestone.year}
                  </div>
                </div>
                <Card className="flex-1 border-2 hover:shadow-xl transition-all duration-300">
                  <CardContent className="pt-6 pb-6">
                    <div className="flex items-start gap-3">
                      <CheckCircle2 className="h-6 w-6 text-green-500 mt-0.5 shrink-0" />
                      <p className="text-lg">{milestone.event}</p>
                    </div>
                  </CardContent>
                </Card>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Why Choose Us */}
      <section className="py-20 md:py-32 bg-accent/30">
        <div className="container max-w-4xl">
          <div className="text-center mb-12">
            <Badge variant="outline" className="mb-4">Hvorfor Stylora?</Badge>
            <h2 className="text-4xl md:text-5xl font-bold mb-6">
              Bygget <span className="bg-gradient-to-r from-blue-600 to-orange-500 bg-clip-text text-transparent">for Norge</span>
            </h2>
          </div>

          <div className="space-y-6">
            <Card className="border-2">
              <CardContent className="pt-6 pb-6">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-green-500 to-emerald-500 flex items-center justify-center shrink-0">
                    <CheckCircle2 className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold mb-2">Norsk språk og valuta</h3>
                    <p className="text-muted-foreground">
                      Alt på norsk (bokmål), med norske kroner, MVA-håndtering og integrering med norske betalingsløsninger som Vipps.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-2">
              <CardContent className="pt-6 pb-6">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center shrink-0">
                    <CheckCircle2 className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold mb-2">GDPR-kompatibel</h3>
                    <p className="text-muted-foreground">
                      Alle data lagres sikkert på EU-servere i samsvar med GDPR og norsk personvernlovgivning.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-2">
              <CardContent className="pt-6 pb-6">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center shrink-0">
                    <CheckCircle2 className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold mb-2">Norsk kundeservice</h3>
                    <p className="text-muted-foreground">
                      Vi snakker ditt språk og forstår din virksomhet. Vårt supportteam er tilgjengelig på norsk i norsk arbeidstid.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-2">
              <CardContent className="pt-6 pb-6">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-orange-500 to-red-500 flex items-center justify-center shrink-0">
                    <CheckCircle2 className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold mb-2">Ingen bindingstid</h3>
                    <p className="text-muted-foreground">
                      Vi tror på at du skal velge oss fordi vi er best, ikke fordi du er låst. Ingen bindingstid eller skjulte kostnader.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 md:py-32 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-blue-600 via-purple-600 to-orange-500"></div>
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGRlZnM+PHBhdHRlcm4gaWQ9ImdyaWQiIHdpZHRoPSI2MCIgaGVpZ2h0PSI2MCIgcGF0dGVyblVuaXRzPSJ1c2VyU3BhY2VPblVzZSI+PHBhdGggZD0iTSAxMCAwIEwgMCAwIDAgMTAiIGZpbGw9Im5vbmUiIHN0cm9rZT0id2hpdGUiIHN0cm9rZS1vcGFjaXR5PSIwLjEiIHN0cm9rZS13aWR0aD0iMSIvPjwvcGF0dGVybj48L2RlZnM+PHJlY3Qgd2lkdGg9IjEwMCUiIGhlaWdodD0iMTAwJSIgZmlsbD0idXJsKCNncmlkKSIvPjwvc3ZnPg==')] opacity-20"></div>
        <div className="container relative z-10">
          <div className="max-w-4xl mx-auto text-center text-white space-y-8">
            <h2 className="text-4xl md:text-5xl font-extrabold">
              Klar til å transformere din salong?
            </h2>
            <p className="text-xl opacity-90 max-w-2xl mx-auto">
              Bli med over 100 norske salonger som allerede har digitalisert sin virksomhet med Stylora
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/signup">
                <Button size="lg" variant="secondary" className="text-lg px-8 py-6 h-auto">
                  Prøv gratis i 14 dager
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </Link>
              <Link href="/">
                <Button size="lg" variant="outline" className="text-lg px-8 py-6 h-auto bg-white/10 border-white/30 text-white hover:bg-white/20">
                  <Mail className="mr-2 h-5 w-5" />
                  Kontakt oss
                </Button>
              </Link>
            </div>
            <p className="text-sm opacity-75">
              Ingen kredittkort nødvendig • Ingen bindingstid • Norsk support
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
