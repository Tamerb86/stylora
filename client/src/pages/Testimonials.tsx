import { Button } from "@/components/ui/button";
import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Link } from "wouter";
import { 
  Star, 
  Quote, 
  Play,
  TrendingUp,
  Users,
  Clock,
  Award,
  ArrowRight,
  Menu,
  X
} from "lucide-react";

export default function Testimonials() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = React.useState(false);
  const testimonials = [
    {
      name: "Maria Johnsen",
      role: "Eier",
      salon: "Glamour Frisør Oslo",
      image: "/testimonial-maria.webp",
      salonImage: "/salon-interior-1.webp",
      rating: 5,
      quote: "Stylora har revolusjonert hvordan vi driver salongen. Online booking har økt våre bestillinger med 45%, og SMS-påminnelsene har nesten eliminert no-shows. Kundene elsker hvor enkelt det er å bestille time!",
      fullStory: "Vi drev Glamour Frisør i 8 år med tradisjonell telefonbooking før vi fant Stylora. Det var kaos – telefonen ringte konstant, vi glemte å bekrefte avtaler, og vi hadde 3-4 no-shows hver uke. Etter vi implementerte Stylora endret alt seg. Nå kan kundene bestille når som helst på døgnet, systemet sender automatiske påminnelser, og vi har full oversikt over alle avtaler. Det beste? Vi har spart minst 10 timer i uken på administrasjon, og omsetningen har økt med 36% på bare 6 måneder.",
      results: [
        { metric: "45%", label: "Flere bookinger" },
        { metric: "85%", label: "Færre no-shows" },
        { metric: "10t/uke", label: "Spart tid" }
      ],
      videoPlaceholder: true
    },
    {
      name: "Hassan Al-Rashid",
      role: "Eier",
      salon: "Classic Barbershop Bergen",
      image: "/testimonial-hassan.webp",
      salonImage: "/salon-interior-1.webp",
      rating: 5,
      quote: "Som barbershop med høy gjennomstrømming trengte vi et system som var raskt og enkelt. Stylora leverer på alle punkter. Walk-in køstyringen er genial, og kundene våre setter pris på å kunne se ventetid i sanntid.",
      fullStory: "Classic Barbershop har alltid vært kjent for god service og klassisk håndverk. Men vi slet med å håndtere både bookinger og walk-ins effektivt. Køen kunne bli lang på lørdager, og vi mistet kunder som ikke ville vente. Med Stylora kan kundene nå sjekke ventetid på nettet før de kommer, og de kan reservere plass i køen digitalt. Vi har også fått bedre oversikt over hvilke tjenester som er mest populære, og kan planlegge bemanningen bedre. Resultatet? Fornøyde kunder, mindre stress, og 28% økning i omsetning.",
      results: [
        { metric: "28%", label: "Omsetningsøkning" },
        { metric: "4.9/5", label: "Kundetilfredshet" },
        { metric: "60%", label: "Flere stammekunder" }
      ],
      videoPlaceholder: true
    },
    {
      name: "Linda Svendsen",
      role: "Daglig leder",
      salon: "Beauty Studio Trondheim",
      image: "/testimonial-linda.webp",
      salonImage: "/salon-interior-2.webp",
      rating: 5,
      quote: "Rapporteringsfunksjonene i Stylora er uvurderlige. Vi kan nå se nøyaktig hvilke behandlinger som gir best lønnsomhet, hvilke tider som er mest populære, og hvordan hver behandler presterer. Dette har hjulpet oss å optimalisere driften betydelig.",
      fullStory: "Beauty Studio tilbyr alt fra ansiktsbehandlinger til massasje og negledesign. Med så mange forskjellige tjenester og 6 behandlere var det umulig å holde oversikt uten et ordentlig system. Stylora har gitt oss full kontroll. Vi ser hvilke behandlinger som bookes mest, hvilke tider som er ledige, og kan tilpasse tilbudene våre basert på reelle data. Provisjonsberegningen gjør det også enkelt å gi behandlerne rettferdig betaling. Etter 4 måneder med Stylora har vi økt gjennomsnittlig bookingverdi med 42% ved å tilby pakkebehandlinger på riktig tidspunkt.",
      results: [
        { metric: "42%", label: "Høyere bookingverdi" },
        { metric: "95%", label: "Kapasitetsutnyttelse" },
        { metric: "8t/uke", label: "Spart administrasjon" }
      ],
      videoPlaceholder: true
    }
  ];

  const stats = [
    { number: "5000+", label: "Fornøyde salonger", icon: Users },
    { number: "4.9/5", label: "Gjennomsnittlig rating", icon: Star },
    { number: "2M+", label: "Bookinger håndtert", icon: Clock },
    { number: "98%", label: "Vil anbefale oss", icon: Award }
  ];

  return (
    <>
      {/* Structured Data for Testimonials */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "ItemList",
            "itemListElement": testimonials.map((t, index) => ({
              "@type": "Review",
              "position": index + 1,
              "author": {
                "@type": "Person",
                "name": t.name,
                "jobTitle": t.role
              },
              "reviewRating": {
                "@type": "Rating",
                "ratingValue": t.rating,
                "bestRating": 5
              },
              "reviewBody": t.quote,
              "itemReviewed": {
                "@type": "SoftwareApplication",
                "name": "Stylora"
              }
            }))
          })
        }}
      />

      <div className="min-h-screen bg-background">
        {/* Navigation */}
        <nav className="border-b bg-background/80 backdrop-blur-xl supports-[backdrop-filter]:bg-background/60 sticky top-0 z-50 shadow-sm">
          <div className="container flex h-16 items-center justify-between">
            <div className="flex items-center gap-3">
              <img src="/stylora-logo.webp" alt="Stylora" className="h-8 w-auto" loading="lazy" />
              <span className="text-xl font-bold bg-gradient-to-r from-blue-600 to-orange-500 bg-clip-text text-transparent">
                Stylora
              </span>
            </div>
            <div className="hidden md:flex items-center gap-6">
              <Link to="/" className="text-sm font-medium hover:text-primary transition-colors">
                Hjem
              </Link>
              <Link to="/about" className="text-sm font-medium hover:text-primary transition-colors">
                Om oss
              </Link>
              <Link to="/case-study" className="text-sm font-medium hover:text-primary transition-colors">
                Case Study
              </Link>
              <Link to="/testimonials" className="text-sm font-medium text-primary">
                Kundehistorier
              </Link>
            </div>
            <div className="flex items-center gap-3">
              <Button asChild variant="ghost" size="sm" className="hidden md:inline-flex">
                <Link to="/book">Se demo</Link>
              </Button>
              <Button asChild size="sm" className="hidden md:inline-flex bg-gradient-to-r from-blue-600 to-orange-500 hover:from-blue-700 hover:to-orange-600 text-white">
                <Link to="/signup">
                  Kom i gang
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
                {/* Navigation Links */}
                <Link 
                  to="/" 
                  className="block py-3 px-4 text-lg font-medium hover:bg-accent rounded-lg transition-colors"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  Hjem
                </Link>
                <Link 
                  to="/about" 
                  className="block py-3 px-4 text-lg font-medium hover:bg-accent rounded-lg transition-colors"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  Om oss
                </Link>
                <Link 
                  to="/case-study" 
                  className="block py-3 px-4 text-lg font-medium hover:bg-accent rounded-lg transition-colors"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  Case Study
                </Link>
                <Link 
                  to="/testimonials" 
                  className="block py-3 px-4 text-lg font-medium text-primary bg-accent rounded-lg"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  Kundehistorier
                </Link>
                
                {/* Divider */}
                <div className="border-t my-4" />
                
                {/* CTA Buttons */}
                <div className="space-y-3">
                  <Button asChild variant="outline" className="w-full">
                    <Link to="/book" onClick={() => setIsMobileMenuOpen(false)}>
                      Se demo
                    </Link>
                  </Button>
                  <Button asChild className="w-full bg-gradient-to-r from-blue-600 to-orange-500 hover:from-blue-700 hover:to-orange-600 text-white">
                    <Link to="/signup" onClick={() => setIsMobileMenuOpen(false)}>
                      Kom i gang
                    </Link>
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Hero Section */}
        <section className="py-20 md:py-32 bg-gradient-to-b from-accent/30 to-background">
          <div className="container">
            <div className="text-center max-w-4xl mx-auto space-y-6">
              <Badge variant="outline" className="px-4 py-1.5">
                Kundehistorier
              </Badge>
              <h1 className="text-5xl md:text-6xl font-extrabold tracking-tight">
                Ekte resultater fra <span className="bg-gradient-to-r from-blue-600 to-orange-500 bg-clip-text text-transparent">ekte salonger</span>
              </h1>
              <p className="text-xl md:text-2xl text-muted-foreground leading-relaxed">
                Oppdag hvordan norske salonger har transformert sin virksomhet med Stylora. 
                Fra reduserte no-shows til økt omsetning – her er historiene deres.
              </p>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mt-16">
              {stats.map((stat, index) => (
                <div key={index} className="text-center space-y-2">
                  <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-gradient-to-br from-blue-600 to-orange-500 text-white mb-3">
                    <stat.icon className="h-6 w-6" />
                  </div>
                  <div className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-orange-500 bg-clip-text text-transparent">
                    {stat.number}
                  </div>
                  <div className="text-sm text-muted-foreground">{stat.label}</div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Detailed Testimonials */}
        <section className="py-20">
          <div className="container">
            <div className="space-y-32">
              {testimonials.map((testimonial, index) => (
                <div key={index} className="space-y-12">
                  {/* Testimonial Header */}
                  <div className="grid md:grid-cols-2 gap-12 items-center">
                    <div className={`space-y-6 ${index % 2 === 1 ? 'md:order-2' : ''}`}>
                      <div className="flex items-center gap-4">
                        <img 
                          src={testimonial.image} 
                          alt={testimonial.name}
                          className="w-20 h-20 rounded-full object-cover border-4 border-primary/20"
                          loading="lazy"
                        />
                        <div>
                          <h3 className="text-2xl font-bold">{testimonial.name}</h3>
                          <p className="text-muted-foreground">{testimonial.role}, {testimonial.salon}</p>
                          <div className="flex gap-1 mt-2">
                            {Array.from({ length: testimonial.rating }).map((_, i) => (
                              <Star key={i} className="h-5 w-5 fill-yellow-400 text-yellow-400" />
                            ))}
                          </div>
                        </div>
                      </div>

                      <div className="relative">
                        <Quote className="absolute -top-2 -left-2 h-8 w-8 text-primary/20" />
                        <p className="text-lg leading-relaxed pl-6 italic text-foreground/90">
                          "{testimonial.quote}"
                        </p>
                      </div>

                      {/* Results Cards */}
                      <div className="grid grid-cols-3 gap-4">
                        {testimonial.results.map((result, idx) => (
                          <Card key={idx} className="text-center p-4 border-2 hover:border-primary/50 transition-colors">
                            <CardContent className="p-0 space-y-1">
                              <div className="text-2xl font-bold text-primary">{result.metric}</div>
                              <div className="text-xs text-muted-foreground">{result.label}</div>
                            </CardContent>
                          </Card>
                        ))}
                      </div>
                    </div>

                    {/* Video/Image Placeholder */}
                    <div className={index % 2 === 1 ? 'md:order-1' : ''}>
                      <div className="relative group cursor-pointer rounded-xl overflow-hidden shadow-2xl">
                        <img 
                          src={testimonial.salonImage} 
                          alt={`${testimonial.salon} interior`}
                          className="w-full h-[400px] object-cover"
                          loading="lazy"
                        />
                        {testimonial.videoPlaceholder && (
                          <div className="absolute inset-0 bg-black/40 flex items-center justify-center group-hover:bg-black/50 transition-colors">
                            <div className="w-20 h-20 rounded-full bg-white/90 flex items-center justify-center group-hover:scale-110 transition-transform">
                              <Play className="h-10 w-10 text-primary ml-1" />
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Full Story */}
                  <Card className="bg-accent/30 border-2">
                    <CardContent className="p-8">
                      <h4 className="text-xl font-bold mb-4 flex items-center gap-2">
                        <TrendingUp className="h-6 w-6 text-primary" />
                        Hele historien
                      </h4>
                      <p className="text-muted-foreground leading-relaxed">
                        {testimonial.fullStory}
                      </p>
                    </CardContent>
                  </Card>

                  {index < testimonials.length - 1 && (
                    <div className="border-t border-border/50" />
                  )}
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-20 bg-gradient-to-r from-blue-600 via-purple-600 to-orange-600 text-white">
          <div className="container">
            <div className="max-w-3xl mx-auto text-center space-y-6">
              <h2 className="text-4xl md:text-5xl font-bold">
                Klar til å skrive din egen suksesshistorie?
              </h2>
              <p className="text-xl opacity-90">
                Bli med over 5000 fornøyde salonger som allerede bruker Stylora. 
                Start din gratis prøveperiode i dag – ingen kredittkort nødvendig.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4">
                <Button asChild size="lg" variant="secondary" className="text-lg h-14 px-10 shadow-2xl transform hover:scale-105 transition-all duration-200">
                  <Link to="/signup">
                    Kom i gang gratis
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </Link>
                </Button>
                <Button asChild size="lg" variant="outline" className="text-lg h-14 px-10 bg-white/10 border-white/30 hover:bg-white/20 text-white transform hover:scale-105 transition-all duration-200">
                  <Link to="/book">
                    Se demo
                  </Link>
                </Button>
              </div>
            </div>
          </div>
        </section>

        {/* Footer */}
        <footer className="py-12 border-t bg-accent/20">
          <div className="container">
            <div className="text-center space-y-4">
              <div className="flex items-center justify-center gap-3">
                <img src="/stylora-logo.webp" alt="Stylora" className="h-8 w-auto" loading="lazy" />
                <span className="text-xl font-bold">Stylora</span>
              </div>
              <p className="text-sm text-muted-foreground">
                Komplett bookingsystem for moderne salonger
              </p>
              <div className="flex justify-center gap-6 text-sm">
                <Link to="/about" className="hover:text-primary transition-colors">Om oss</Link>
                <Link to="/case-study" className="hover:text-primary transition-colors">Case Study</Link>
                <Link to="/" className="hover:text-primary transition-colors">Kontakt</Link>
              </div>
              <div className="border-t mt-8 pt-8 text-center text-sm text-muted-foreground">
                <p>&copy; 2025 Stylora. Alle rettigheter reservert.</p>
              </div>
            </div>
          </div>
        </footer>
      </div>
    </>
  );
}
