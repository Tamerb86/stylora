import { Button } from "@/components/ui/button";
import React from "react";
import Footer from "@/components/Footer";
import { useAuth, getLoginUrl } from "@/_core/hooks/useAuth";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Badge } from "@/components/ui/badge";
import { Link } from "wouter";
import { 
  Calendar, 
  CreditCard, 
  Globe, 
  MessageSquare, 
  FileText, 
  Calculator, 
  ShoppingCart, 
  Users, 
  Scissors, 
  UserCog, 
  Package, 
  BarChart3,
  Check,
  CheckCircle2,
  ArrowRight,
  Clock,
  TrendingUp,
  Shield,
  Zap,
  Star,
  Sparkles,
  Heart,
  Award,
  Settings,
  Menu,
  X
} from "lucide-react";

export default function Home() {
  const { user } = useAuth();
  const isOwner = user?.openId === import.meta.env.VITE_OWNER_OPEN_ID;
  const [isMobileMenuOpen, setIsMobileMenuOpen] = React.useState(false);
  const features = [
    {
      icon: Calendar,
      title: "Smart Timebok",
      description: "Intelligent kalender som forstår din virksomhet. Automatisk planlegging, ingen dobbeltbookinger, og full kontroll over alle avtaler.",
      color: "from-blue-500 to-cyan-500"
    },
    {
      icon: Globe,
      title: "24/7 Online Booking",
      description: "Kundene dine bestiller når det passer dem – selv når du sover. Automatiske bekreftelser og påminnelser holder kalenderen full.",
      color: "from-purple-500 to-pink-500"
    },
    {
      icon: MessageSquare,
      title: "Smarte Påminnelser",
      description: "Automatiske SMS-varsler 24 og 2 timer før timen. Våre kunder rapporterer opptil 80% reduksjon i no-shows.",
      color: "from-orange-500 to-red-500"
    },
    {
      icon: CreditCard,
      title: "Enkel Betaling",
      description: "Integrasjon med Vipps og kortterminaler. Få betalt raskt, og hold oversikt over all omsetning på étt sted.",
      color: "from-green-500 to-emerald-500"
    },
    {
      icon: Users,
      title: "Komplett Kunderegister",
      description: "Alt du trenger å vite om kundene dine. Besøkshistorikk, preferanser, notater og GDPR-kompatibel databehandling.",
      color: "from-indigo-500 to-blue-500"
    },
    {
      icon: BarChart3,
      title: "Kraftige Analyser",
      description: "Omsetning, trender og ansattes ytelse – alt visualisert og lett å forstå. Ta datadrevne beslutninger som øker lønnsomheten.",
      color: "from-pink-500 to-rose-500"
    }
  ];

  const stats = [
    { number: "5000+", label: "Fornøyde salonger", icon: Heart },
    { number: "98%", label: "Kundetilfredshet", icon: Star },
    { number: "24/7", label: "Online booking", icon: Clock },
    { number: "80%", label: "Færre uteblitte timer", icon: TrendingUp }
  ];

  const testimonials = [
    {
      name: "Maria Johnsen",
      role: "Eier, Glamour Frisør Oslo",
      content: "Stylora har transformert hvordan vi driver salongen. Vi sparer 5+ timer hver uke på administrasjon, og kundene elsker hvor enkelt det er å bestille time!",
      rating: 5
    },
    {
      name: "Hassan Al-Rashid",
      role: "Eier, Classic Barbershop Bergen",
      content: "Endelig et system som forstår norske salonger. SMS-påminnelsene har redusert no-shows med 75%, og rapportene gir oss innsikt vi aldri har hatt før!",
      rating: 5
    },
    {
      name: "Linda Svendsen",
      role: "Daglig leder, Beauty Studio Trondheim",
      content: "Utrolig intuitivt! Hele teamet var i gang på under 10 minutter. Stylora har gjort oss mer profesjonelle og effektive – kundene merker forskjellen.",
      rating: 5
    }
  ];

  const plans = [
    {
      name: "Start",
      price: "299",
      description: "Perfekt for enkeltpersoner og små salonger",
      features: [
        "1 behandler",
        "100 SMS per måned",
        "Online booking",
        "Kunderegister",
        "Grunnleggende rapporter",
        "E-post support"
      ],
      highlighted: false
    },
    {
      name: "Pro",
      price: "799",
      description: "For voksende salonger med flere ansatte",
      features: [
        "Opptil 5 behandlere",
        "500 SMS per måned",
        "Alt i Start, pluss:",
        "Varelager",
        "Provisjonsberegning",
        "Avanserte rapporter",
        "Prioritert support"
      ],
      highlighted: true
    },
    {
      name: "Premium",
      price: "1499",
      description: "For salonger med flere avdelinger",
      features: [
        "Ubegrenset behandlere",
        "2000 SMS per måned",
        "Alt i Pro, pluss:",
        "Flerlokalitetsstyring",
        "API-tilgang",
        "Tilpassede rapporter",
        "Dedikert kontaktperson"
      ],
      highlighted: false
    }
  ];

  const faqs = [
    {
      question: "Må jeg være teknisk for å bruke Stylora?",
      answer: "Nei, absolutt ikke. Stylora er designet med enkelhet i fokus. Du trenger ingen teknisk erfaring – systemet er intuitivt og selvforklarende. Vi guider deg gjennom oppsettet, og de fleste salonger er oppe og kjører på under 10 minutter."
    },
    {
      question: "Fungerer dette med regnskapsfører?",
      answer: "Ja! Stylora eksporterer alle salgsdata i formater som er kompatible med norske regnskapssystemer. Du kan enkelt dele rapporter med regnskapsføreren din, og all MVA er automatisk beregnet etter norske regler. Perfekt for årsoppgjør og revisjon."
    },
    {
      question: "Støtter dere Vipps?",
      answer: "Vipps-integrasjon er planlagt og kommer snart. Akkurat nå støtter vi kortbetaling via Stripe, samt manuell registrering av kontant- og Vipps-betalinger i kassen."
    },
    {
      question: "Hva med GDPR og personvern?",
      answer: "Stylora er fullt GDPR-kompatibel og tar personvern på alvor. Vi lagrer kun nødvendig informasjon, all data er kryptert, og kundene dine har full kontroll. De kan når som helst be om innsyn eller sletting av sine data. Trygt for deg og kundene dine."
    },
    {
      question: "Kan ansatte ha egne innlogginger?",
      answer: "Ja! Hver ansatt får sin egen innlogging med tilpassede rettigheter basert på rolle. De kan se sin timeplan, registrere salg, få oversikt over provisjon, og mye mer. Full kontroll og oversikt for alle."
    },
    {
      question: "Kan jeg prøve før jeg kjøper?",
      answer: "Ja! Vi tilbyr 14 dagers gratis prøveperiode uten kredittkort. Du får full tilgang til alle funksjoner og kan teste Stylora grundig med dine egne data. Ingen forpliktelser, ingen skjulte kostnader."
    }
  ];

  // Structured Data for SEO
  const structuredData = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Organization",
        "@id": "https://stylora.no/#organization",
        "name": "Stylora",
        "url": "https://stylora.no",
        "logo": {
          "@type": "ImageObject",
          "url": "https://stylora.no/stylora-logo.webp"
        },
        "description": "Komplett bookingsystem for norske frisørsalonger, barbershops og skjønnhetssalonger",
        "address": {
          "@type": "PostalAddress",
          "addressCountry": "NO"
        },
        "sameAs": [
          "https://www.facebook.com/stylora",
          "https://www.instagram.com/stylora"
        ]
      },
      {
        "@type": "SoftwareApplication",
        "@id": "https://stylora.no/#software",
        "name": "Stylora",
        "applicationCategory": "BusinessApplication",
        "operatingSystem": "Web",
        "offers": {
          "@type": "AggregateOffer",
          "priceCurrency": "NOK",
          "lowPrice": "299",
          "highPrice": "1299",
          "priceSpecification": [
            {
              "@type": "UnitPriceSpecification",
              "price": "299",
              "priceCurrency": "NOK",
              "name": "Start",
              "billingDuration": "P1M"
            },
            {
              "@type": "UnitPriceSpecification",
              "price": "699",
              "priceCurrency": "NOK",
              "name": "Pro",
              "billingDuration": "P1M"
            },
            {
              "@type": "UnitPriceSpecification",
              "price": "1299",
              "priceCurrency": "NOK",
              "name": "Enterprise",
              "billingDuration": "P1M"
            }
          ]
        },
        "aggregateRating": {
          "@type": "AggregateRating",
          "ratingValue": "4.9",
          "ratingCount": "127",
          "bestRating": "5"
        }
      },
      {
        "@type": "WebSite",
        "@id": "https://stylora.no/#website",
        "url": "https://stylora.no",
        "name": "Stylora",
        "publisher": {
          "@id": "https://stylora.no/#organization"
        },
        "inLanguage": "nb-NO"
      }
    ]
  };

  return (
    <>
      {/* Structured Data */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
      />
      
      <div className="min-h-screen bg-background">
      {/* Navigation */}
      <nav className="border-b bg-background/80 backdrop-blur-xl supports-[backdrop-filter]:bg-background/60 sticky top-0 z-50 shadow-sm">
        <div className="container flex h-16 items-center justify-between">
          <div className="flex items-center gap-3">
            <img src="/stylora-logo.webp" alt="Stylora Logo" className="h-10 w-10" loading="lazy" />
            <span className="text-xl font-bold bg-gradient-to-r from-blue-600 to-orange-500 bg-clip-text text-transparent">
              Stylora
            </span>
          </div>
          <div className="flex items-center gap-4">
            {/* Desktop Navigation */}
            <Button variant="ghost" asChild className="hidden md:inline-flex">
              <a href="#features">Funksjoner</a>
            </Button>
            <Button variant="ghost" asChild className="hidden md:inline-flex">
              <a href="#pricing">Priser</a>
            </Button>
            <Button variant="ghost" asChild className="hidden md:inline-flex">
              <a href="#faq">FAQ</a>
            </Button>
            <Button variant="ghost" asChild className="hidden md:inline-flex">
              <Link to="/about">Om oss</Link>
            </Button>
            <Button variant="ghost" asChild className="hidden md:inline-flex">
              <Link to="/testimonials">Kundehistorier</Link>
            </Button>
            {isOwner && (
              <Button asChild variant="outline" className="hidden md:inline-flex border-2 border-primary/50 hover:bg-primary/10">
                <Link to="/saas-admin">
                  <Shield className="mr-2 h-4 w-4" />
                  SaaS Admin
                </Link>
              </Button>
            )}
            <Button asChild variant="outline" className="hidden md:inline-flex">
              <a href={getLoginUrl()}>
                Logg inn
              </a>
            </Button>
            <Button asChild className="hidden md:inline-flex bg-gradient-to-r from-blue-600 to-orange-500 hover:from-blue-700 hover:to-orange-600 text-white shadow-lg">
              <Link to="/signup">
                Prøv gratis i 14 dager
                <ArrowRight className="ml-2 h-4 w-4" />
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
              <a 
                href="#features" 
                className="block py-3 px-4 text-lg font-medium hover:bg-accent rounded-lg transition-colors"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                Funksjoner
              </a>
              <a 
                href="#pricing" 
                className="block py-3 px-4 text-lg font-medium hover:bg-accent rounded-lg transition-colors"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                Priser
              </a>
              <a 
                href="#faq" 
                className="block py-3 px-4 text-lg font-medium hover:bg-accent rounded-lg transition-colors"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                FAQ
              </a>
              <Link 
                to="/about" 
                className="block py-3 px-4 text-lg font-medium hover:bg-accent rounded-lg transition-colors"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                Om oss
              </Link>
              <Link 
                to="/testimonials" 
                className="block py-3 px-4 text-lg font-medium hover:bg-accent rounded-lg transition-colors"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                Kundehistorier
              </Link>
              
              {/* Divider */}
              <div className="border-t my-4" />
              
              {/* CTA Buttons */}
              <div className="space-y-3">
                {isOwner && (
                  <Button asChild variant="outline" className="w-full border-2 border-primary/50">
                    <Link to="/saas-admin" onClick={() => setIsMobileMenuOpen(false)}>
                      <Shield className="mr-2 h-4 w-4" />
                      SaaS Admin
                    </Link>
                  </Button>
                )}
                <Button asChild variant="outline" className="w-full">
                  <a href={getLoginUrl()} onClick={() => setIsMobileMenuOpen(false)}>
                    Logg inn
                  </a>
                </Button>
                <Button asChild className="w-full bg-gradient-to-r from-blue-600 to-orange-500 hover:from-blue-700 hover:to-orange-600 text-white shadow-lg">
                  <Link to="/signup" onClick={() => setIsMobileMenuOpen(false)}>
                    Prøv gratis i 14 dager
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Hero Section - Enhanced */}
      <section className="relative py-20 md:py-32 overflow-hidden">
        {/* Animated background gradient */}
        <div className="absolute inset-0 bg-gradient-to-br from-blue-50 via-orange-50 to-purple-50 dark:from-blue-950/20 dark:via-orange-950/20 dark:to-purple-950/20"></div>
        
        {/* Decorative circles */}
        <div className="absolute top-20 left-10 w-72 h-72 bg-blue-400/20 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-20 right-10 w-96 h-96 bg-orange-400/20 rounded-full blur-3xl animate-pulse delay-1000"></div>
        
        <div className="container relative z-10">
          <div className="max-w-4xl mx-auto text-center space-y-8">
            <Badge variant="secondary" className="px-6 py-2 text-sm font-medium shadow-lg animate-bounce">
              <Sparkles className="w-4 h-4 mr-2 inline" />
              Bygget for norske salonger
            </Badge>
            
            <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight">
              <span className="bg-gradient-to-r from-blue-600 via-purple-600 to-orange-600 bg-clip-text text-transparent">
                Alt du trenger
              </span>
              <br />
              <span className="text-foreground">
                for å drive en moderne salong
              </span>
            </h1>
            
            <p className="text-xl md:text-2xl text-muted-foreground max-w-3xl mx-auto leading-relaxed">
              Stylora er det komplette styringssystemet for moderne salonger. Timebok, online booking, betaling og innsikt – alt i én elegant løsning. 
              Designet for norske frisørsalonger, barbershops og skjønnhetssalonger som vil vokse.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4">
              <Button asChild size="lg" className="text-lg h-14 px-10 bg-gradient-to-r from-blue-600 to-orange-500 hover:from-blue-700 hover:to-orange-600 text-white shadow-2xl transform hover:scale-105 transition-all duration-200">
                <Link to="/signup">
                  Kom i gang gratis
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Link>
              </Button>
              <Button asChild size="lg" variant="outline" className="text-lg h-14 px-10 border-2 hover:bg-accent transform hover:scale-105 transition-all duration-200">
                <Link to="/book">
                  Se demo
                  <Zap className="ml-2 h-5 w-5" />
                </Link>
              </Button>
            </div>
            
            <div className="flex items-center justify-center gap-8 pt-8 text-sm text-muted-foreground">
              <div className="flex items-center gap-2">
                <Check className="h-5 w-5 text-green-500" />
                <span>Ingen bindingstid</span>
              </div>
              <div className="flex items-center gap-2">
                <Check className="h-5 w-5 text-green-500" />
                <span>Ingen kredittkort nødvendig</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section - New */}
      <section className="py-16 bg-gradient-to-r from-blue-600 to-orange-500 text-white">
        <div className="container">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {stats.map((stat, index) => (
              <div key={index} className="text-center space-y-2 transform hover:scale-110 transition-transform duration-200">
                <stat.icon className="h-8 w-8 mx-auto mb-2 opacity-80" />
                <div className="text-4xl md:text-5xl font-bold">{stat.number}</div>
                <div className="text-sm md:text-base opacity-90">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Demo Video Section */}
      <section className="py-20 md:py-32 bg-gradient-to-b from-background to-accent/20">
        <div className="container">
          <div className="max-w-5xl mx-auto">
            <div className="text-center mb-12 space-y-4">
              <Badge variant="outline" className="px-4 py-1.5">
                Se systemet i aksjon
              </Badge>
              <h2 className="text-4xl md:text-5xl font-bold tracking-tight">
                Se hvordan <span className="bg-gradient-to-r from-blue-600 to-orange-500 bg-clip-text text-transparent">Stylora fungerer</span>
              </h2>
              <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
                Få en rask gjennomgang av systemet og se hvor enkelt det er å komme i gang
              </p>
            </div>

            <div className="relative rounded-2xl overflow-hidden shadow-2xl bg-black">
              <video 
                controls
                poster="/video-thumbnail.webp"
                className="w-full h-auto"
                preload="metadata"
              >
                <source src="https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4" type="video/mp4" />
                <p className="text-white p-8">
                  Din nettleser støtter ikke video-avspilling. 
                  <a href="https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4" className="underline">Last ned videoen her</a>.
                </p>
              </video>
              <div className="absolute top-4 left-4 bg-black/70 backdrop-blur-sm px-4 py-2 rounded-full">
                <p className="text-white text-sm font-medium flex items-center gap-2">
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                    <circle cx="12" cy="12" r="10" fill="#ef4444" />
                    <circle cx="12" cy="12" r="3" fill="white" />
                  </svg>
                  Live Demo
                </p>
              </div>
            </div>

            <div className="grid md:grid-cols-3 gap-6 mt-12">
              <div className="text-center p-6 bg-card rounded-xl border-2 border-border hover:border-primary/50 transition-colors">
                <div className="w-12 h-12 rounded-full bg-blue-100 dark:bg-blue-900/20 flex items-center justify-center mx-auto mb-4">
                  <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <h3 className="font-semibold mb-2">Rask oppsett</h3>
                <p className="text-sm text-muted-foreground">Kom i gang på under 5 minutter</p>
              </div>
              <div className="text-center p-6 bg-card rounded-xl border-2 border-border hover:border-primary/50 transition-colors">
                <div className="w-12 h-12 rounded-full bg-orange-100 dark:bg-orange-900/20 flex items-center justify-center mx-auto mb-4">
                  <svg className="w-6 h-6 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                  </svg>
                </div>
                <h3 className="font-semibold mb-2">Intuitiv design</h3>
                <p className="text-sm text-muted-foreground">Ingen opplæring nødvendig</p>
              </div>
              <div className="text-center p-6 bg-card rounded-xl border-2 border-border hover:border-primary/50 transition-colors">
                <div className="w-12 h-12 rounded-full bg-purple-100 dark:bg-purple-900/20 flex items-center justify-center mx-auto mb-4">
                  <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 5.636l-3.536 3.536m0 5.656l3.536 3.536M9.172 9.172L5.636 5.636m3.536 9.192l-3.536 3.536M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-5 0a4 4 0 11-8 0 4 4 0 018 0z" />
                  </svg>
                </div>
                <h3 className="font-semibold mb-2">Full support</h3>
                <p className="text-sm text-muted-foreground">Vi hjelper deg hele veien</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Trust Badges Section - New */}
      <section className="py-12 border-y bg-accent/30">
        <div className="container">
          <div className="flex flex-wrap items-center justify-center gap-8 md:gap-12">
            <div className="flex items-center gap-3 text-sm">
              <div className="w-12 h-12 rounded-full bg-green-100 dark:bg-green-900/20 flex items-center justify-center">
                <Shield className="h-6 w-6 text-green-600" />
              </div>
              <div>
                <div className="font-semibold">GDPR-kompatibel</div>
                <div className="text-xs text-muted-foreground">100% personvernsikker</div>
              </div>
            </div>
            <div className="flex items-center gap-3 text-sm">
              <div className="w-12 h-12 rounded-full bg-blue-100 dark:bg-blue-900/20 flex items-center justify-center">
                <Globe className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <div className="font-semibold">EU-servere</div>
                <div className="text-xs text-muted-foreground">Data lagres i Europa</div>
              </div>
            </div>
            <div className="flex items-center gap-3 text-sm">
              <div className="w-12 h-12 rounded-full bg-orange-100 dark:bg-orange-900/20 flex items-center justify-center">
                <Check className="h-6 w-6 text-orange-600" />
              </div>
              <div>
                <div className="font-semibold">Ingen bindingstid</div>
                <div className="text-xs text-muted-foreground">Avslutt når du vil</div>
              </div>
            </div>
            <div className="flex items-center gap-3 text-sm">
              <div className="w-12 h-12 rounded-full bg-purple-100 dark:bg-purple-900/20 flex items-center justify-center">
                <Shield className="h-6 w-6 text-purple-600" />
              </div>
              <div>
                <div className="font-semibold">SSL-kryptert</div>
                <div className="text-xs text-muted-foreground">Sikker dataoverføring</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section - Enhanced */}
      <section id="features" className="py-20 md:py-32">
        <div className="container">
          <div className="text-center max-w-3xl mx-auto mb-16 space-y-4">
            <Badge variant="outline" className="px-4 py-1.5">
              Funksjoner
            </Badge>
            <h2 className="text-4xl md:text-5xl font-bold tracking-tight">
              Alt du trenger i <span className="bg-gradient-to-r from-blue-600 to-orange-500 bg-clip-text text-transparent">én løsning</span>
            </h2>
            <p className="text-xl text-muted-foreground">
              Kraftige verktøy designet for å gjøre hverdagen din enklere
            </p>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <Card 
                key={index} 
                className="group relative overflow-hidden border-2 hover:border-primary/50 transition-all duration-300 hover:shadow-2xl transform hover:-translate-y-2"
              >
                <div className={`absolute inset-0 bg-gradient-to-br ${feature.color} opacity-0 group-hover:opacity-5 transition-opacity duration-300`}></div>
                <CardHeader>
                  <div className={`w-14 h-14 rounded-xl bg-gradient-to-br ${feature.color} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300 shadow-lg`}>
                    <feature.icon className="h-7 w-7 text-white" />
                  </div>
                  <CardTitle className="text-xl">{feature.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription className="text-base leading-relaxed">
                    {feature.description}
                  </CardDescription>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Screenshots Showcase Section */}
      <section className="py-20 md:py-32 bg-accent/30">
        <div className="container">
          <div className="text-center max-w-3xl mx-auto mb-16 space-y-4">
            <Badge variant="outline" className="px-4 py-1.5">
              Se systemet i aksjon
            </Badge>
            <h2 className="text-4xl md:text-5xl font-bold tracking-tight">
              Intuitivt design som <span className="bg-gradient-to-r from-blue-600 to-orange-500 bg-clip-text text-transparent">alle kan bruke</span>
            </h2>
            <p className="text-xl text-muted-foreground">
              Moderne grensesnitt designet for effektivitet og enkelhet
            </p>
          </div>

          <div className="space-y-24">
            {/* Calendar Screenshot */}
            <div className="grid md:grid-cols-2 gap-12 items-center">
              <div className="space-y-6 order-2 md:order-1">
                <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-blue-100 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300">
                  <Calendar className="h-5 w-5" />
                  <span className="font-semibold">Smart Timebok</span>
                </div>
                <h3 className="text-3xl font-bold">Oversiktlig kalender med drag & drop</h3>
                <p className="text-lg text-muted-foreground leading-relaxed">
                  Se hele uken eller måneden på ett øyeblikk. Dra og slipp avtaler for å endre tid. Fargekodet etter status. Ingen dobbeltbookinger.
                </p>
                <ul className="space-y-3">
                  <li className="flex items-start gap-3">
                    <CheckCircle2 className="h-6 w-6 text-green-500 shrink-0 mt-0.5" />
                    <span>Automatisk tidsplanlegging basert på tjenestelengde</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <CheckCircle2 className="h-6 w-6 text-green-500 shrink-0 mt-0.5" />
                    <span>Filtrer etter ansatt eller behandlingstype</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <CheckCircle2 className="h-6 w-6 text-green-500 shrink-0 mt-0.5" />
                    <span>Kommende avtaler vises i sanntid</span>
                  </li>
                </ul>
              </div>
              <div className="order-1 md:order-2">
                <div className="relative group">
                  <div className="absolute -inset-4 bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl opacity-20 group-hover:opacity-30 blur-xl transition-opacity"></div>
                  <img 
                    src="/screenshot-calendar.webp"
                    loading="lazy" 
                    alt="Stylora Calendar Interface" 
                    className="relative rounded-xl shadow-2xl border-2 border-border"
                  />
                </div>
              </div>
            </div>

            {/* Booking Screenshot */}
            <div className="grid md:grid-cols-2 gap-12 items-center">
              <div className="relative group">
                <div className="absolute -inset-4 bg-gradient-to-r from-purple-600 to-pink-600 rounded-2xl opacity-20 group-hover:opacity-30 blur-xl transition-opacity"></div>
                <img 
                  src="/screenshot-booking.webp"
                  loading="lazy" 
                  alt="Stylora Online Booking" 
                  className="relative rounded-xl shadow-2xl border-2 border-border"
                />
              </div>
              <div className="space-y-6">
                <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-purple-100 dark:bg-purple-900/20 text-purple-700 dark:text-purple-300">
                  <Globe className="h-5 w-5" />
                  <span className="font-semibold">Online Booking</span>
                </div>
                <h3 className="text-3xl font-bold">Kundene bestiller selv, 24/7</h3>
                <p className="text-lg text-muted-foreground leading-relaxed">
                  Elegant bookingside som matcher din salong. Kundene velger tjeneste, ansatt, dato og tid – alt på under 2 minutter.
                </p>
                <ul className="space-y-3">
                  <li className="flex items-start gap-3">
                    <CheckCircle2 className="h-6 w-6 text-green-500 shrink-0 mt-0.5" />
                    <span>Kun ledige tider vises automatisk</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <CheckCircle2 className="h-6 w-6 text-green-500 shrink-0 mt-0.5" />
                    <span>Automatisk bekreftelse via SMS og e-post</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <CheckCircle2 className="h-6 w-6 text-green-500 shrink-0 mt-0.5" />
                    <span>Mobiloptimalisert for booking på farten</span>
                  </li>
                </ul>
              </div>
            </div>

            {/* Customer Management Screenshot */}
            <div className="grid md:grid-cols-2 gap-12 items-center">
              <div className="space-y-6 order-2 md:order-1">
                <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-cyan-100 dark:bg-cyan-900/20 text-cyan-700 dark:text-cyan-300">
                  <Users className="h-5 w-5" />
                  <span className="font-semibold">Kunderegister</span>
                </div>
                <h3 className="text-3xl font-bold">Alt du trenger å vite om kundene</h3>
                <p className="text-lg text-muted-foreground leading-relaxed">
                  Komplett oversikt over hver kunde. Besøkshistorikk, preferanser, notater og lojalitetspoeng – alt på ett sted.
                </p>
                <ul className="space-y-3">
                  <li className="flex items-start gap-3">
                    <CheckCircle2 className="h-6 w-6 text-green-500 shrink-0 mt-0.5" />
                    <span>Detaljert kundehistorikk med tidslinje</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <CheckCircle2 className="h-6 w-6 text-green-500 shrink-0 mt-0.5" />
                    <span>Lagre preferanser og allergier</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <CheckCircle2 className="h-6 w-6 text-green-500 shrink-0 mt-0.5" />
                    <span>GDPR-kompatibel databehandling</span>
                  </li>
                </ul>
              </div>
              <div className="order-1 md:order-2">
                <div className="relative group">
                  <div className="absolute -inset-4 bg-gradient-to-r from-cyan-600 to-blue-600 rounded-2xl opacity-20 group-hover:opacity-30 blur-xl transition-opacity"></div>
                  <img 
                    src="/screenshot-customers.webp"
                    loading="lazy" 
                    alt="Stylora Customer Management" 
                    className="relative rounded-xl shadow-2xl border-2 border-border"
                  />
                </div>
              </div>
            </div>

            {/* Analytics Screenshot */}
            <div className="grid md:grid-cols-2 gap-12 items-center">
              <div className="relative group">
                <div className="absolute -inset-4 bg-gradient-to-r from-orange-600 to-red-600 rounded-2xl opacity-20 group-hover:opacity-30 blur-xl transition-opacity"></div>
                <img 
                  src="/screenshot-analytics.webp"
                  loading="lazy" 
                  alt="Stylora Analytics Dashboard" 
                  className="relative rounded-xl shadow-2xl border-2 border-border"
                />
              </div>
              <div className="space-y-6">
                <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-orange-100 dark:bg-orange-900/20 text-orange-700 dark:text-orange-300">
                  <BarChart3 className="h-5 w-5" />
                  <span className="font-semibold">Analyser & Rapporter</span>
                </div>
                <h3 className="text-3xl font-bold">Datadrevne beslutninger</h3>
                <p className="text-lg text-muted-foreground leading-relaxed">
                  Kraftige analyser som viser deg nøyaktig hvordan salongen presterer. Omsetning, trender, populære tjenester og mer.
                </p>
                <ul className="space-y-3">
                  <li className="flex items-start gap-3">
                    <CheckCircle2 className="h-6 w-6 text-green-500 shrink-0 mt-0.5" />
                    <span>Sanntidsrapportering av omsetning og bookinger</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <CheckCircle2 className="h-6 w-6 text-green-500 shrink-0 mt-0.5" />
                    <span>Identifiser mest populære tjenester</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <CheckCircle2 className="h-6 w-6 text-green-500 shrink-0 mt-0.5" />
                    <span>Eksporter data til Excel for videre analyse</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials Section - New */}
      <section className="py-20 bg-gradient-to-b from-background to-accent/20">
        <div className="container">
          <div className="text-center max-w-3xl mx-auto mb-16 space-y-4">
            <Badge variant="outline" className="px-4 py-1.5">
              Tilbakemeldinger
            </Badge>
            <h2 className="text-4xl md:text-5xl font-bold tracking-tight">
              Hva sier <span className="bg-gradient-to-r from-blue-600 to-orange-500 bg-clip-text text-transparent">våre kunder?</span>
            </h2>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8">
            {testimonials.map((testimonial, index) => (
              <Card key={index} className="relative overflow-hidden hover:shadow-xl transition-shadow duration-300">
                <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-blue-500/10 to-orange-500/10 rounded-full -mr-16 -mt-16"></div>
                <CardHeader>
                  <div className="flex gap-1 mb-3">
                    {[...Array(testimonial.rating)].map((_, i) => (
                      <Star key={i} className="h-5 w-5 fill-yellow-400 text-yellow-400" />
                    ))}
                  </div>
                  <CardDescription className="text-base italic leading-relaxed text-foreground">
                    "{testimonial.content}"
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-orange-500 flex items-center justify-center text-white font-bold text-lg">
                      {testimonial.name.charAt(0)}
                    </div>
                    <div>
                      <div className="font-semibold">{testimonial.name}</div>
                      <div className="text-sm text-muted-foreground">{testimonial.role}</div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
          
          <div className="text-center mt-12">
            <p className="text-muted-foreground mb-6">
              Vil du se konkrete resultater? Les hvordan Salon Elegance økte omsetningen med 36%
            </p>
            <Button asChild size="lg" variant="outline" className="border-2 hover:bg-accent">
              <Link to="/case-study">
                <BarChart3 className="mr-2 h-5 w-5" />
                Les kundesuksess-historien
                <ArrowRight className="ml-2 h-5 w-5" />
              </Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Why Choose Us Section - New */}
      <section className="py-20 md:py-32 bg-gradient-to-b from-background to-accent/20">
        <div className="container">
          <div className="text-center max-w-3xl mx-auto mb-16 space-y-4">
            <Badge variant="outline" className="px-4 py-1.5">
              Hvorfor velge oss?
            </Badge>
            <h2 className="text-4xl md:text-5xl font-bold tracking-tight">
              Vi er <span className="bg-gradient-to-r from-blue-600 to-orange-500 bg-clip-text text-transparent">annerledes</span>
            </h2>
            <p className="text-xl text-muted-foreground">
              Ikke bare et bookingsystem – en komplett løsning for moderne salonger
            </p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
            <Card className="border-2 hover:shadow-xl transition-all duration-300 relative overflow-hidden group">
              <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-cyan-500/5 opacity-0 group-hover:opacity-100 transition-opacity"></div>
              <CardHeader>
                <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center mb-4 shadow-lg group-hover:scale-110 transition-transform">
                  <Zap className="h-8 w-8 text-white" />
                </div>
                <CardTitle className="text-2xl">Raskere enn konkurrentene</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <p className="text-muted-foreground leading-relaxed">
                  Mens andre systemer tar dager å sette opp, er du i gang med Stylora på under 10 minutter. Null teknisk kunnskap nødvendig.
                </p>
                <ul className="space-y-2">
                  <li className="flex items-start gap-2 text-sm">
                    <Check className="h-4 w-4 text-green-500 mt-0.5 shrink-0" />
                    <span>Automatisk import av eksisterende kunder</span>
                  </li>
                  <li className="flex items-start gap-2 text-sm">
                    <Check className="h-4 w-4 text-green-500 mt-0.5 shrink-0" />
                    <span>Ferdigkonfigurerte maler for norske salonger</span>
                  </li>
                  <li className="flex items-start gap-2 text-sm">
                    <Check className="h-4 w-4 text-green-500 mt-0.5 shrink-0" />
                    <span>Gratis onboarding-hjelp fra eksperter</span>
                  </li>
                </ul>
              </CardContent>
            </Card>

            <Card className="border-2 hover:shadow-xl transition-all duration-300 relative overflow-hidden group border-primary">
              <div className="absolute -top-3 -right-3">
                <Badge className="bg-gradient-to-r from-blue-600 to-orange-500 text-white shadow-lg">
                  <Award className="w-3 h-3 mr-1" />
                  Mest valgt
                </Badge>
              </div>
              <div className="absolute inset-0 bg-gradient-to-br from-orange-500/5 to-red-500/5 opacity-0 group-hover:opacity-100 transition-opacity"></div>
              <CardHeader>
                <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-orange-500 to-red-500 flex items-center justify-center mb-4 shadow-lg group-hover:scale-110 transition-transform">
                  <Heart className="h-8 w-8 text-white" />
                </div>
                <CardTitle className="text-2xl">Laget for Norge</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <p className="text-muted-foreground leading-relaxed">
                  Ikke en oversatt versjon av et utenlandsk system. Stylora er bygget fra bunnen av for norske salonger, med norske regler og behov i fokus.
                </p>
                <ul className="space-y-2">
                  <li className="flex items-start gap-2 text-sm">
                    <Check className="h-4 w-4 text-green-500 mt-0.5 shrink-0" />
                    <span>Norsk MVA-håndtering innebygd</span>
                  </li>
                  <li className="flex items-start gap-2 text-sm">
                    <Check className="h-4 w-4 text-green-500 mt-0.5 shrink-0" />
                    <span>Vipps-integrasjon (kommer snart)</span>
                  </li>
                  <li className="flex items-start gap-2 text-sm">
                    <Check className="h-4 w-4 text-green-500 mt-0.5 shrink-0" />
                    <span>Support på norsk, norsk tidssone</span>
                  </li>
                </ul>
              </CardContent>
            </Card>

            <Card className="border-2 hover:shadow-xl transition-all duration-300 relative overflow-hidden group">
              <div className="absolute inset-0 bg-gradient-to-br from-green-500/5 to-emerald-500/5 opacity-0 group-hover:opacity-100 transition-opacity"></div>
              <CardHeader>
                <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-green-500 to-emerald-500 flex items-center justify-center mb-4 shadow-lg group-hover:scale-110 transition-transform">
                  <TrendingUp className="h-8 w-8 text-white" />
                </div>
                <CardTitle className="text-2xl">Bevist ROI</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <p className="text-muted-foreground leading-relaxed">
                  Gjennomsnittlig salong tjener inn kostnaden på under 2 uker. Reduserte no-shows og bedre kundelojalitet gir direkte økt inntekt.
                </p>
                <ul className="space-y-2">
                  <li className="flex items-start gap-2 text-sm">
                    <Check className="h-4 w-4 text-green-500 mt-0.5 shrink-0" />
                    <span>80% færre uteblitte timer med SMS-påminnelser</span>
                  </li>
                  <li className="flex items-start gap-2 text-sm">
                    <Check className="h-4 w-4 text-green-500 mt-0.5 shrink-0" />
                    <span>35% flere bookinger med online booking</span>
                  </li>
                  <li className="flex items-start gap-2 text-sm">
                    <Check className="h-4 w-4 text-green-500 mt-0.5 shrink-0" />
                    <span>5+ timer spart per uke på administrasjon</span>
                  </li>
                </ul>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="py-20 md:py-32">
        <div className="container">
          <div className="text-center max-w-3xl mx-auto mb-16 space-y-4">
            <Badge variant="outline" className="px-4 py-1.5">
              Priser
            </Badge>
            <h2 className="text-4xl md:text-5xl font-bold tracking-tight">
              Velg planen som <span className="bg-gradient-to-r from-blue-600 to-orange-500 bg-clip-text text-transparent">passer deg</span>
            </h2>
            <p className="text-xl text-muted-foreground">
              Ingen skjulte kostnader. Ingen bindingstid. Avslutt når du vil.
            </p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
            {plans.map((plan, index) => (
              <Card 
                key={index} 
                className={`relative ${
                  plan.highlighted 
                    ? 'border-primary border-2 shadow-2xl scale-105 bg-gradient-to-b from-primary/5 to-background' 
                    : 'hover:shadow-xl'
                } transition-all duration-300`}
              >
                {plan.highlighted && (
                  <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                    <Badge className="bg-gradient-to-r from-blue-600 to-orange-500 text-white px-4 py-1 shadow-lg">
                      <Award className="w-3 h-3 mr-1 inline" />
                      Mest populær
                    </Badge>
                  </div>
                )}
                <CardHeader className="text-center pb-8">
                  <CardTitle className="text-2xl mb-2">{plan.name}</CardTitle>
                  <div className="mb-2">
                    <span className="text-5xl font-bold">{plan.price}</span>
                    <span className="text-muted-foreground"> kr/mnd</span>
                  </div>
                  <CardDescription className="text-base">{plan.description}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <ul className="space-y-3">
                    {plan.features.map((feature, featureIndex) => (
                      <li key={featureIndex} className="flex items-start gap-3">
                        <Check className="h-5 w-5 text-green-500 shrink-0 mt-0.5" />
                        <span className="text-sm">{feature}</span>
                      </li>
                    ))}
                  </ul>
                  <Button 
                    asChild
                    className={`w-full ${
                      plan.highlighted 
                        ? 'bg-gradient-to-r from-blue-600 to-orange-500 hover:from-blue-700 hover:to-orange-600 text-white shadow-lg' 
                        : ''
                    }`}
                    variant={plan.highlighted ? 'default' : 'outline'}
                    size="lg"
                  >
                    <Link to="/signup">Start gratis prøveperiode</Link>
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Detailed Comparison Table */}
          <div className="mt-24">
            <div className="text-center mb-12">
              <h3 className="text-3xl font-bold mb-4">Detaljert sammenligning</h3>
              <p className="text-muted-foreground">Se nøyaktig hva som er inkludert i hver plan</p>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full border-collapse bg-card rounded-xl overflow-hidden shadow-lg">
                <thead>
                  <tr className="bg-accent/50">
                    <th className="text-left p-6 font-semibold text-lg">Funksjoner</th>
                    <th className="text-center p-6 font-semibold text-lg">Start</th>
                    <th className="text-center p-6 font-semibold text-lg bg-primary/10">Pro</th>
                    <th className="text-center p-6 font-semibold text-lg">Enterprise</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {/* Grunnleggende */}
                  <tr className="bg-accent/20">
                    <td colSpan={4} className="p-4 font-semibold text-sm uppercase tracking-wide text-muted-foreground">
                      Grunnleggende
                    </td>
                  </tr>
                  <tr className="hover:bg-accent/10 transition-colors">
                    <td className="p-4">Antall behandlere</td>
                    <td className="text-center p-4">1</td>
                    <td className="text-center p-4 bg-primary/5">Opptil 5</td>
                    <td className="text-center p-4">Ubegrenset</td>
                  </tr>
                  <tr className="hover:bg-accent/10 transition-colors">
                    <td className="p-4">SMS per måned</td>
                    <td className="text-center p-4">100</td>
                    <td className="text-center p-4 bg-primary/5">500</td>
                    <td className="text-center p-4">2000</td>
                  </tr>
                  <tr className="hover:bg-accent/10 transition-colors">
                    <td className="p-4">Online booking</td>
                    <td className="text-center p-4"><Check className="h-5 w-5 text-green-500 mx-auto" /></td>
                    <td className="text-center p-4 bg-primary/5"><Check className="h-5 w-5 text-green-500 mx-auto" /></td>
                    <td className="text-center p-4"><Check className="h-5 w-5 text-green-500 mx-auto" /></td>
                  </tr>
                  <tr className="hover:bg-accent/10 transition-colors">
                    <td className="p-4">Kunderegister</td>
                    <td className="text-center p-4"><Check className="h-5 w-5 text-green-500 mx-auto" /></td>
                    <td className="text-center p-4 bg-primary/5"><Check className="h-5 w-5 text-green-500 mx-auto" /></td>
                    <td className="text-center p-4"><Check className="h-5 w-5 text-green-500 mx-auto" /></td>
                  </tr>
                  <tr className="hover:bg-accent/10 transition-colors">
                    <td className="p-4">Timeplanlegging</td>
                    <td className="text-center p-4"><Check className="h-5 w-5 text-green-500 mx-auto" /></td>
                    <td className="text-center p-4 bg-primary/5"><Check className="h-5 w-5 text-green-500 mx-auto" /></td>
                    <td className="text-center p-4"><Check className="h-5 w-5 text-green-500 mx-auto" /></td>
                  </tr>

                  {/* Avanserte funksjoner */}
                  <tr className="bg-accent/20">
                    <td colSpan={4} className="p-4 font-semibold text-sm uppercase tracking-wide text-muted-foreground">
                      Avanserte funksjoner
                    </td>
                  </tr>
                  <tr className="hover:bg-accent/10 transition-colors">
                    <td className="p-4">Varelager</td>
                    <td className="text-center p-4 text-muted-foreground">–</td>
                    <td className="text-center p-4 bg-primary/5"><Check className="h-5 w-5 text-green-500 mx-auto" /></td>
                    <td className="text-center p-4"><Check className="h-5 w-5 text-green-500 mx-auto" /></td>
                  </tr>
                  <tr className="hover:bg-accent/10 transition-colors">
                    <td className="p-4">Provisjonsberegning</td>
                    <td className="text-center p-4 text-muted-foreground">–</td>
                    <td className="text-center p-4 bg-primary/5"><Check className="h-5 w-5 text-green-500 mx-auto" /></td>
                    <td className="text-center p-4"><Check className="h-5 w-5 text-green-500 mx-auto" /></td>
                  </tr>
                  <tr className="hover:bg-accent/10 transition-colors">
                    <td className="p-4">Avanserte rapporter</td>
                    <td className="text-center p-4 text-muted-foreground">–</td>
                    <td className="text-center p-4 bg-primary/5"><Check className="h-5 w-5 text-green-500 mx-auto" /></td>
                    <td className="text-center p-4"><Check className="h-5 w-5 text-green-500 mx-auto" /></td>
                  </tr>
                  <tr className="hover:bg-accent/10 transition-colors">
                    <td className="p-4">Lojalitetsprogram</td>
                    <td className="text-center p-4 text-muted-foreground">–</td>
                    <td className="text-center p-4 bg-primary/5"><Check className="h-5 w-5 text-green-500 mx-auto" /></td>
                    <td className="text-center p-4"><Check className="h-5 w-5 text-green-500 mx-auto" /></td>
                  </tr>
                  <tr className="hover:bg-accent/10 transition-colors">
                    <td className="p-4">Flerlokalitetsstyring</td>
                    <td className="text-center p-4 text-muted-foreground">–</td>
                    <td className="text-center p-4 bg-primary/5 text-muted-foreground">–</td>
                    <td className="text-center p-4"><Check className="h-5 w-5 text-green-500 mx-auto" /></td>
                  </tr>
                  <tr className="hover:bg-accent/10 transition-colors">
                    <td className="p-4">API-tilgang</td>
                    <td className="text-center p-4 text-muted-foreground">–</td>
                    <td className="text-center p-4 bg-primary/5 text-muted-foreground">–</td>
                    <td className="text-center p-4"><Check className="h-5 w-5 text-green-500 mx-auto" /></td>
                  </tr>
                  <tr className="hover:bg-accent/10 transition-colors">
                    <td className="p-4">Tilpassede rapporter</td>
                    <td className="text-center p-4 text-muted-foreground">–</td>
                    <td className="text-center p-4 bg-primary/5 text-muted-foreground">–</td>
                    <td className="text-center p-4"><Check className="h-5 w-5 text-green-500 mx-auto" /></td>
                  </tr>

                  {/* Support */}
                  <tr className="bg-accent/20">
                    <td colSpan={4} className="p-4 font-semibold text-sm uppercase tracking-wide text-muted-foreground">
                      Support
                    </td>
                  </tr>
                  <tr className="hover:bg-accent/10 transition-colors">
                    <td className="p-4">Supportkanal</td>
                    <td className="text-center p-4">E-post</td>
                    <td className="text-center p-4 bg-primary/5">E-post + Chat</td>
                    <td className="text-center p-4">Dedikert kontaktperson</td>
                  </tr>
                  <tr className="hover:bg-accent/10 transition-colors">
                    <td className="p-4">Responstid</td>
                    <td className="text-center p-4">24 timer</td>
                    <td className="text-center p-4 bg-primary/5">4 timer</td>
                    <td className="text-center p-4">1 time</td>
                  </tr>
                  <tr className="hover:bg-accent/10 transition-colors">
                    <td className="p-4">Onboarding-hjelp</td>
                    <td className="text-center p-4">Selvbetjening</td>
                    <td className="text-center p-4 bg-primary/5">Veiledning</td>
                    <td className="text-center p-4">Personlig oppsett</td>
                  </tr>
                  <tr className="hover:bg-accent/10 transition-colors">
                    <td className="p-4">Opplæring</td>
                    <td className="text-center p-4">Video-guider</td>
                    <td className="text-center p-4 bg-primary/5">Video + Webinar</td>
                    <td className="text-center p-4">Personlig opplæring</td>
                  </tr>
                </tbody>
              </table>
            </div>

            <div className="text-center mt-12">
              <p className="text-muted-foreground mb-6">Alle planer inkluderer 14 dagers gratis prøveperiode</p>
              <Button asChild size="lg" className="bg-gradient-to-r from-blue-600 to-orange-500 hover:from-blue-700 hover:to-orange-600 text-white shadow-xl">
                <Link to="/signup">
                  Kom i gang gratis
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section id="faq" className="py-20 md:py-32 bg-accent/20">
        <div className="container max-w-4xl">
          <div className="text-center mb-16 space-y-4">
            <Badge variant="outline" className="px-4 py-1.5">
              Ofte stilte spørsmål
            </Badge>
            <h2 className="text-4xl md:text-5xl font-bold tracking-tight">
              Har du <span className="bg-gradient-to-r from-blue-600 to-orange-500 bg-clip-text text-transparent">spørsmål?</span>
            </h2>
            <p className="text-xl text-muted-foreground">
              Vi har svaret
            </p>
          </div>
          
          <Accordion type="single" collapsible className="space-y-4">
            {faqs.map((faq, index) => (
              <AccordionItem 
                key={index} 
                value={`item-${index}`}
                className="bg-background border-2 rounded-lg px-6 hover:border-primary/50 transition-colors"
              >
                <AccordionTrigger className="text-left text-lg font-semibold hover:no-underline py-6">
                  {faq.question}
                </AccordionTrigger>
                <AccordionContent className="text-base text-muted-foreground pb-6 leading-relaxed">
                  {faq.answer}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      </section>

      {/* Industry-Specific Section - New */}
      <section className="py-20 md:py-32">
        <div className="container">
          <div className="text-center max-w-3xl mx-auto mb-16 space-y-4">
            <Badge variant="outline" className="px-4 py-1.5">
              Skreddersydd for din bransje
            </Badge>
            <h2 className="text-4xl md:text-5xl font-bold tracking-tight">
              Uansett type salong – <span className="bg-gradient-to-r from-blue-600 to-orange-500 bg-clip-text text-transparent">vi har deg dekket</span>
            </h2>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
            <Card className="border-2 hover:border-primary/50 hover:shadow-xl transition-all duration-300 group">
              <CardHeader>
                <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-pink-500 to-rose-500 flex items-center justify-center mb-4 shadow-lg group-hover:scale-110 transition-transform mx-auto">
                  <Scissors className="h-10 w-10 text-white" />
                </div>
                <CardTitle className="text-2xl text-center">For frisører</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-muted-foreground text-center leading-relaxed">
                  Perfekt for frisørsalonger med fokus på hårpleie, farging og styling
                </p>
                <ul className="space-y-2">
                  <li className="flex items-start gap-2 text-sm">
                    <Check className="h-4 w-4 text-green-500 mt-0.5 shrink-0" />
                    <span>Fleksibel timeplanlegging for lange behandlinger</span>
                  </li>
                  <li className="flex items-start gap-2 text-sm">
                    <Check className="h-4 w-4 text-green-500 mt-0.5 shrink-0" />
                    <span>Fargenotater og kundepreferanser</span>
                  </li>
                  <li className="flex items-start gap-2 text-sm">
                    <Check className="h-4 w-4 text-green-500 mt-0.5 shrink-0" />
                    <span>Produktsalg og varelager</span>
                  </li>
                  <li className="flex items-start gap-2 text-sm">
                    <Check className="h-4 w-4 text-green-500 mt-0.5 shrink-0" />
                    <span>Lojalitetsprogram for faste kunder</span>
                  </li>
                </ul>
              </CardContent>
            </Card>

            <Card className="border-2 hover:border-primary/50 hover:shadow-xl transition-all duration-300 group">
              <CardHeader>
                <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-blue-600 to-cyan-600 flex items-center justify-center mb-4 shadow-lg group-hover:scale-110 transition-transform mx-auto">
                  <UserCog className="h-10 w-10 text-white" />
                </div>
                <CardTitle className="text-2xl text-center">For barbere</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-muted-foreground text-center leading-relaxed">
                  Optimalisert for barbershops med rask gjennomstrømming og walk-ins
                </p>
                <ul className="space-y-2">
                  <li className="flex items-start gap-2 text-sm">
                    <Check className="h-4 w-4 text-green-500 mt-0.5 shrink-0" />
                    <span>Rask booking for korte behandlinger (15-45 min)</span>
                  </li>
                  <li className="flex items-start gap-2 text-sm">
                    <Check className="h-4 w-4 text-green-500 mt-0.5 shrink-0" />
                    <span>Walk-in køstyring</span>
                  </li>
                  <li className="flex items-start gap-2 text-sm">
                    <Check className="h-4 w-4 text-green-500 mt-0.5 shrink-0" />
                    <span>Medlemskap og klippekort</span>
                  </li>
                  <li className="flex items-start gap-2 text-sm">
                    <Check className="h-4 w-4 text-green-500 mt-0.5 shrink-0" />
                    <span>Enkel kassefunksjon</span>
                  </li>
                </ul>
              </CardContent>
            </Card>

            <Card className="border-2 hover:border-primary/50 hover:shadow-xl transition-all duration-300 group">
              <CardHeader>
                <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center mb-4 shadow-lg group-hover:scale-110 transition-transform mx-auto">
                  <Sparkles className="h-10 w-10 text-white" />
                </div>
                <CardTitle className="text-2xl text-center">For skjønnhetssalonger</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-muted-foreground text-center leading-relaxed">
                  Komplett løsning for salonger med flere behandlingstyper
                </p>
                <ul className="space-y-2">
                  <li className="flex items-start gap-2 text-sm">
                    <Check className="h-4 w-4 text-green-500 mt-0.5 shrink-0" />
                    <span>Flere rom og behandlere samtidig</span>
                  </li>
                  <li className="flex items-start gap-2 text-sm">
                    <Check className="h-4 w-4 text-green-500 mt-0.5 shrink-0" />
                    <span>Pakkebehandlinger og gavekort</span>
                  </li>
                  <li className="flex items-start gap-2 text-sm">
                    <Check className="h-4 w-4 text-green-500 mt-0.5 shrink-0" />
                    <span>Detaljert kundehistorikk</span>
                  </li>
                  <li className="flex items-start gap-2 text-sm">
                    <Check className="h-4 w-4 text-green-500 mt-0.5 shrink-0" />
                    <span>Provisjonsberegning per behandler</span>
                  </li>
                </ul>
              </CardContent>
            </Card>
          </div>

          <div className="text-center mt-12">
            <p className="text-muted-foreground mb-6">
              Uansett hvilken type salong du driver, har Stylora funksjonene du trenger
            </p>
            <Button asChild size="lg" className="bg-gradient-to-r from-blue-600 to-orange-500 hover:from-blue-700 hover:to-orange-600 text-white shadow-lg">
              <a href="#features">
                Se alle funksjoner
                <ArrowRight className="ml-2 h-5 w-5" />
              </a>
            </Button>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 md:py-32 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-blue-600 to-orange-500"></div>
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmYiIGZpbGwtb3BhY2l0eT0iMC4xIj48cGF0aCBkPSJNMzYgMzRjMC0yLjIxLTEuNzktNC00LTRzLTQgMS43OS00IDQgMS43OSA0IDQgNCA0LTEuNzkgNC00em0wLTEwYzAtMi4yMS0xLjc5LTQtNC00cy00IDEuNzktNCA0IDEuNzkgNCA0IDQgNC0xLjc5IDQtNHptMC0xMGMwLTIuMjEtMS43OS00LTQtNHMtNCAxLjc5LTQgNCAxLjc5IDQgNCA0IDQtMS43OSA0LTR6Ii8+PC9nPjwvZz48L3N2Zz4=')] opacity-10"></div>
        
        <div className="container relative z-10">
          <div className="max-w-3xl mx-auto text-center space-y-8 text-white">
            <h2 className="text-4xl md:text-5xl font-bold">
              Klar til å modernisere salongen din?
            </h2>
            <p className="text-xl opacity-90">
              Bli med over 5000 fornøyde salonger som allerede bruker Stylora. 
              Start din gratis prøveperiode i dag – ingen kredittkort nødvendig.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4">
              <Button asChild size="lg" variant="secondary" className="text-lg h-14 px-10 bg-white text-blue-600 hover:bg-gray-100 shadow-2xl transform hover:scale-105 transition-all duration-200">
                <Link to="/signup">
                  Prøv gratis i 14 dager
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Link>
              </Button>
              <Button asChild size="lg" variant="outline" className="text-lg h-14 px-10 border-2 border-white text-white hover:bg-white/10 transform hover:scale-105 transition-all duration-200">
                <a href="mailto:support@stylora.no">
                  Kontakt oss
                </a>
              </Button>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
    </>
  );
}
