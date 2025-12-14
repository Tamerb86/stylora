import { Button } from "@/components/ui/button";
import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  ArrowRight, 
  TrendingUp, 
  Users, 
  Clock, 
  Star,
  Quote,
  CheckCircle2,
  BarChart3,
  Calendar,
  Menu,
  X
} from "lucide-react";
import { Link } from "wouter";

export default function CaseStudy() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = React.useState(false);
  const beforeAfterMetrics = [
    {
      metric: "Månedlig omsetning",
      before: "kr 180,000",
      after: "kr 245,000",
      increase: "+36%",
      icon: TrendingUp,
      color: "from-green-500 to-emerald-500"
    },
    {
      metric: "Uteblitte timer",
      before: "18%",
      after: "3%",
      increase: "-83%",
      icon: Calendar,
      color: "from-blue-500 to-cyan-500"
    },
    {
      metric: "Online bookinger",
      before: "12%",
      after: "58%",
      increase: "+383%",
      icon: Users,
      color: "from-purple-500 to-pink-500"
    },
    {
      metric: "Admin-tid per uke",
      before: "12 timer",
      after: "4 timer",
      increase: "-67%",
      icon: Clock,
      color: "from-orange-500 to-red-500"
    }
  ];

  const keyChanges = [
    "Automatiske SMS-påminnelser 24 timer før time",
    "Online booking tilgjengelig 24/7 på nettside og sosiale medier",
    "Lojalitetsprogram med 10% rabatt etter 5 besøk",
    "Automatisk kundeoppfølging etter behandling",
    "Detaljert rapportering og innsikt i trender",
    "Integrert betalingsløsning med Vipps og kort"
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Navigation */}
      <nav className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-50">
        <div className="container flex h-16 items-center justify-between">
          <Button asChild variant="ghost" className="flex items-center gap-2 hover:bg-transparent">
            <Link to="/">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-600 to-orange-500 flex items-center justify-center">
                <span className="text-white font-bold text-sm">BT</span>
              </div>
              <span className="font-bold text-xl bg-gradient-to-r from-blue-600 to-orange-500 bg-clip-text text-transparent">
                Stylora
              </span>
            </Link>
          </Button>
          <div className="flex items-center gap-4">
            <Button asChild variant="ghost" className="hidden md:inline-flex">
              <Link to="/">
                Tilbake til hovedsiden
              </Link>
            </Button>
            
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
              <Button 
                asChild 
                variant="outline" 
                className="w-full justify-start text-lg"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                <Link to="/">
                  Tilbake til hovedsiden
                </Link>
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Hero Section */}
      <section className="py-20 md:py-32 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-50 via-orange-50 to-purple-50 dark:from-blue-950/20 dark:via-orange-950/20 dark:to-purple-950/20"></div>
        <div className="container relative z-10">
          <div className="max-w-4xl mx-auto text-center space-y-6">
            <Badge variant="secondary" className="px-6 py-2">
              <Star className="w-4 h-4 mr-2 inline fill-current" />
              Kundesuksess
            </Badge>
            <h1 className="text-5xl md:text-6xl font-extrabold tracking-tight">
              Hvordan <span className="bg-gradient-to-r from-blue-600 to-orange-500 bg-clip-text text-transparent">Studio Bella</span> økte omsetningen med 36%
            </h1>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              En moderne skjønnhetssalong i Oslo transformerte sin virksomhet med Stylora – og doblet antall online bookinger på bare 3 måneder
            </p>
          </div>
        </div>
      </section>

      {/* Salon Info */}
      <section className="py-16 border-y bg-accent/30">
        <div className="container">
          <div className="grid md:grid-cols-4 gap-8 max-w-4xl mx-auto text-center">
            <div>
              <div className="text-3xl font-bold text-primary">Studio Bella</div>
              <div className="text-sm text-muted-foreground mt-1">Oslo, Norge</div>
            </div>
            <div>
              <div className="text-3xl font-bold">7</div>
              <div className="text-sm text-muted-foreground mt-1">Ansatte stylister</div>
            </div>
            <div>
              <div className="text-3xl font-bold">6 år</div>
              <div className="text-sm text-muted-foreground mt-1">I drift</div>
            </div>
            <div>
              <div className="text-3xl font-bold">520+</div>
              <div className="text-sm text-muted-foreground mt-1">Aktive kunder</div>
            </div>
          </div>
        </div>
      </section>

      {/* Challenge Section */}
      <section className="py-20 md:py-32">
        <div className="container max-w-4xl">
          <div className="space-y-8">
            <div>
              <Badge variant="outline" className="mb-4">Utfordringen</Badge>
              <h2 className="text-4xl font-bold mb-6">
                Fra papirkalender til <span className="bg-gradient-to-r from-blue-600 to-orange-500 bg-clip-text text-transparent">digital transformasjon</span>
              </h2>
            </div>
            
            <Card className="border-l-4 border-l-orange-500">
              <CardContent className="pt-6">
                <Quote className="h-8 w-8 text-orange-500 mb-4" />
                <p className="text-lg text-muted-foreground italic mb-4">
                  "Som eier av en moderne skjønnhetssalong følte jeg vi sakket akterut. Vi hadde fortsatt papirkalender, dobbeltbookinger var vanlig, og jeg brukte timer daglig på å bekrefte avtaler. Vi trengte en digital løsning som passet vår virksomhet."
                </p>
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-pink-500 to-rose-500 flex items-center justify-center text-white font-bold">
                    SA
                  </div>
                  <div>
                    <div className="font-semibold">Sofia Andersen</div>
                    <div className="text-sm text-muted-foreground">Eier, Studio Bella</div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <div className="grid md:grid-cols-3 gap-6 pt-8">
              <Card className="bg-red-50 dark:bg-red-950/20 border-red-200 dark:border-red-900">
                <CardContent className="pt-6">
                  <div className="text-4xl font-bold text-red-600 mb-2">18%</div>
                  <div className="text-sm text-muted-foreground">av kundene møtte ikke opp til avtalt time</div>
                </CardContent>
              </Card>
              <Card className="bg-orange-50 dark:bg-orange-950/20 border-orange-200 dark:border-orange-900">
                <CardContent className="pt-6">
                  <div className="text-4xl font-bold text-orange-600 mb-2">12 timer</div>
                  <div className="text-sm text-muted-foreground">brukt på admin per uke</div>
                </CardContent>
              </Card>
              <Card className="bg-yellow-50 dark:bg-yellow-950/20 border-yellow-200 dark:border-yellow-900">
                <CardContent className="pt-6">
                  <div className="text-4xl font-bold text-yellow-600 mb-2">88%</div>
                  <div className="text-sm text-muted-foreground">av bookingene kom via telefon</div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </section>

      {/* Solution Section */}
      <section className="py-20 md:py-32 bg-accent/30">
        <div className="container max-w-4xl">
          <div className="space-y-8">
            <div>
              <Badge variant="outline" className="mb-4">Løsningen</Badge>
              <h2 className="text-4xl font-bold mb-6">
                Implementering av <span className="bg-gradient-to-r from-blue-600 to-orange-500 bg-clip-text text-transparent">Stylora</span>
              </h2>
              <p className="text-lg text-muted-foreground">
                I mars 2024 tok Studio Bella steget og gikk over til Stylora. Implementeringen tok bare én dag, og allerede etter første uke så de resultater.
              </p>
            </div>

            <div className="space-y-4">
              <h3 className="text-2xl font-semibold">Nøkkelendringer som ble gjort:</h3>
              <div className="grid gap-3">
                {keyChanges.map((change, index) => (
                  <div key={index} className="flex items-start gap-3 p-4 rounded-lg bg-background border">
                    <CheckCircle2 className="h-5 w-5 text-green-500 mt-0.5 shrink-0" />
                    <span>{change}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Results Section */}
      <section className="py-20 md:py-32">
        <div className="container max-w-6xl">
          <div className="text-center mb-16">
            <Badge variant="outline" className="mb-4">Resultatene</Badge>
            <h2 className="text-4xl md:text-5xl font-bold mb-6">
              Før og etter <span className="bg-gradient-to-r from-blue-600 to-orange-500 bg-clip-text text-transparent">3 måneder</span>
            </h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Tallene snakker for seg selv – dramatisk forbedring på alle nøkkeltall
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-8">
            {beforeAfterMetrics.map((item, index) => (
              <Card key={index} className="border-2 hover:shadow-xl transition-all duration-300 group">
                <CardContent className="pt-6">
                  <div className="flex items-start justify-between mb-6">
                    <div>
                      <div className="text-sm text-muted-foreground mb-1">{item.metric}</div>
                      <div className="flex items-baseline gap-4">
                        <div>
                          <div className="text-xs text-muted-foreground mb-1">Før</div>
                          <div className="text-2xl font-bold text-muted-foreground/60 line-through">{item.before}</div>
                        </div>
                        <ArrowRight className="h-5 w-5 text-muted-foreground" />
                        <div>
                          <div className="text-xs text-muted-foreground mb-1">Etter</div>
                          <div className="text-3xl font-bold">{item.after}</div>
                        </div>
                      </div>
                    </div>
                    <div className={`w-16 h-16 rounded-xl bg-gradient-to-br ${item.color} flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform`}>
                      <item.icon className="h-8 w-8 text-white" />
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge className="bg-green-100 text-green-700 dark:bg-green-900/20 dark:text-green-400">
                      <TrendingUp className="h-3 w-3 mr-1" />
                      {item.increase}
                    </Badge>
                    <span className="text-sm text-muted-foreground">forbedring</span>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonial Section */}
      <section className="py-20 md:py-32 bg-gradient-to-br from-blue-50 to-orange-50 dark:from-blue-950/20 dark:to-orange-950/20">
        <div className="container max-w-4xl">
          <Card className="border-2 shadow-2xl">
            <CardContent className="pt-12 pb-12">
              <Quote className="h-12 w-12 text-primary mb-6 mx-auto" />
              <blockquote className="text-2xl md:text-3xl font-medium text-center mb-8 leading-relaxed">
                "Stylora har fullstendig transformert hvordan vi driver salongen. Vi har mer tid til det vi elsker – å jobbe med kundene – og mindre tid på papirarbeid. Den beste investeringen vi har gjort."
              </blockquote>
              <div className="flex items-center justify-center gap-4">
                <div className="w-16 h-16 rounded-full bg-gradient-to-br from-pink-500 to-rose-500 flex items-center justify-center text-white font-bold text-xl">
                  SA
                </div>
                <div className="text-left">
                  <div className="font-semibold text-lg">Sofia Andersen</div>
                  <div className="text-muted-foreground">Eier, Studio Bella</div>
                  <div className="flex gap-1 mt-1">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <Star key={star} className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                    ))}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 md:py-32 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-blue-600 to-orange-500"></div>
        <div className="container relative z-10">
          <div className="max-w-3xl mx-auto text-center space-y-8 text-white">
            <h2 className="text-4xl md:text-5xl font-bold">
              Klar til å få samme resultater?
            </h2>
            <p className="text-xl opacity-90">
              Bli med hundrevis av norske salonger som allerede har transformert virksomheten sin med Stylora
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button asChild size="lg" variant="secondary" className="text-lg h-14 px-10">
                <Link to="/">
                  Prøv gratis i 14 dager
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Link>
              </Button>
              <Button asChild size="lg" variant="outline" className="text-lg h-14 px-10 border-2 border-white text-white hover:bg-white/10">
                <Link to="/">
                  <BarChart3 className="mr-2 h-5 w-5" />
                  Se flere case studies
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
