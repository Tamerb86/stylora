// @ts-nocheck
import React from "react";
import Footer from "@/components/Footer";
import { useAuth, getLoginUrl } from "@/_core/hooks/useAuth";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
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
  X,
  ChevronRight,
  Play,
  Rocket,
  Target,
  Smile,
} from "lucide-react";

export default function Home() {
  const { user } = useAuth();
  const isOwner = user?.openId === import.meta.env.VITE_OWNER_OPEN_ID;
  const [isMobileMenuOpen, setIsMobileMenuOpen] = React.useState(false);

  const features = [
    {
      icon: Calendar,
      title: "Smart Timebok",
      description:
        "Intelligent kalender som forstår din virksomhet. Automatisk planlegging, ingen dobbeltbookinger, og full kontroll over alle avtaler.",
      color: "from-blue-500 to-cyan-500",
      benefits: [
        "Drag & drop",
        "Automatisk planlegging",
        "Fargekodet oversikt",
      ],
      image: "/images/real-photos/dashboard-calendar.webp",
    },
    {
      icon: Globe,
      title: "24/7 Online Booking",
      description:
        "Kundene dine bestiller når det passer dem – selv når du sover. Automatiske bekreftelser og påminnelser holder kalenderen full.",
      color: "from-purple-500 to-pink-500",
      benefits: [
        "Mobilvennlig",
        "Automatiske bekreftelser",
        "Ingen dobbeltbookinger",
      ],
      image: "/images/real-photos/salon-modern-minimalist.webp",
    },
    {
      icon: MessageSquare,
      title: "Smarte Påminnelser",
      description:
        "Automatiske SMS-varsler 24 og 2 timer før timen. Våre kunder rapporterer opptil 80% reduksjon i no-shows.",
      color: "from-orange-500 to-red-500",
      benefits: ["80% færre no-shows", "Automatiske SMS", "E-post varsler"],
      image: "/images/real-photos/salon-white-clean.webp",
    },
    {
      icon: CreditCard,
      title: "Enkel Betaling",
      description:
        "Integrasjon med Vipps og kortterminaler. Få betalt raskt, og hold oversikt over all omsetning på étt sted.",
      color: "from-green-500 to-emerald-500",
      benefits: ["Vipps", "Stripe", "Kontant registrering"],
      image: "/images/real-photos/dashboard-modern.webp",
    },
    {
      icon: Users,
      title: "Komplett Kunderegister",
      description:
        "Alt du trenger å vite om kundene dine. Besøkshistorikk, preferanser, notater og GDPR-kompatibel databehandling.",
      color: "from-indigo-500 to-blue-500",
      benefits: ["Besøkshistorikk", "Lojalitetsprogram", "GDPR-sikker"],
      image: "/images/real-photos/salon-active-customers.webp",
    },
    {
      icon: BarChart3,
      title: "Kraftige Analyser",
      description:
        "Omsetning, trender og ansattes ytelse – alt visualisert og lett å forstå. Ta datadrevne beslutninger som øker lønnsomheten.",
      color: "from-pink-500 to-rose-500",
      benefits: ["Sanntidsrapporter", "Eksport til Excel", "Visuell analyse"],
      image: "/images/real-photos/dashboard-analytics.webp",
    },
  ];

  const stats = [
    {
      number: "5000+",
      label: "Fornøyde salonger",
      icon: Heart,
      color: "from-red-500 to-pink-500",
    },
    {
      number: "98%",
      label: "Kundetilfredshet",
      icon: Star,
      color: "from-yellow-500 to-orange-500",
    },
    {
      number: "24/7",
      label: "Online booking",
      icon: Clock,
      color: "from-blue-500 to-cyan-500",
    },
    {
      number: "80%",
      label: "Færre uteblitte timer",
      icon: TrendingUp,
      color: "from-green-500 to-emerald-500",
    },
  ];

  const salonImages = [
    "/images/real-photos/salon-luxury-interior.webp",
    "/images/real-photos/salon-modern-minimalist.webp",
    "/images/real-photos/salon-active-customers.webp",
  ];

  const testimonials = [
    {
      name: "Maria Johnsen",
      role: "Eier, Glamour Frisør Oslo",
      content:
        "Stylora har transformert hvordan vi driver salongen. Vi sparer 5+ timer hver uke på administrasjon, og kundene elsker hvor enkelt det er å bestille time!",
      rating: 5,
      avatar: "MJ",
      color: "from-purple-500 to-pink-500",
    },
    {
      name: "Hassan Al-Rashid",
      role: "Eier, Classic Barbershop Bergen",
      content:
        "Endelig et system som forstår norske salonger. SMS-påminnelsene har redusert no-shows med 75%, og rapportene gir oss innsikt vi aldri har hatt før!",
      rating: 5,
      avatar: "HA",
      color: "from-blue-500 to-cyan-500",
    },
    {
      name: "Linda Svendsen",
      role: "Daglig leder, Beauty Studio Trondheim",
      content:
        "Utrolig intuitivt! Hele teamet var i gang på under 10 minutter. Stylora har gjort oss mer profesjonelle og effektive – kundene merker forskjellen.",
      rating: 5,
      avatar: "LS",
      color: "from-orange-500 to-red-500",
    },
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
        "E-post support",
      ],
      highlighted: false,
      icon: Rocket,
      color: "from-blue-500 to-cyan-500",
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
        "Prioritert support",
      ],
      highlighted: true,
      icon: Target,
      color: "from-purple-500 to-pink-500",
      badge: "Mest populær",
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
        "Dedikert kontaktperson",
      ],
      highlighted: false,
      icon: Award,
      color: "from-orange-500 to-red-500",
    },
  ];

  const faqs = [
    {
      question: "Må jeg være teknisk for å bruke Stylora?",
      answer:
        "Nei, absolutt ikke. Stylora er designet med enkelhet i fokus. Du trenger ingen teknisk erfaring – systemet er intuitivt og selvforklarende. Vi guider deg gjennom oppsettet, og de fleste salonger er oppe og kjører på under 10 minutter.",
    },
    {
      question: "Fungerer dette med regnskapsfører?",
      answer:
        "Ja! Stylora eksporterer alle salgsdata i formater som er kompatible med norske regnskapssystemer. Du kan enkelt dele rapporter med regnskapsføreren din, og all MVA er automatisk beregnet etter norske regler. Perfekt for årsoppgjør og revisjon.",
    },
    {
      question: "Støtter dere Vipps?",
      answer:
        "Vipps-integrasjon er planlagt og kommer snart. Akkurat nå støtter vi kortbetaling via Stripe, samt manuell registrering av kontant- og Vipps-betalinger i kassen.",
    },
    {
      question: "Hva med GDPR og personvern?",
      answer:
        "Stylora er fullt GDPR-kompatibel og tar personvern på alvor. Vi lagrer kun nødvendig informasjon, all data er kryptert, og kundene dine har full kontroll. De kan når som helst be om innsyn eller sletting av sine data. Trygt for deg og kundene dine.",
    },
    {
      question: "Kan ansatte ha egne innlogginger?",
      answer:
        "Ja! Hver ansatt får sin egen innlogging med tilpassede rettigheter basert på rolle. De kan se sin timeplan, registrere salg, få oversikt over provisjon, og mye mer. Full kontroll og oversikt for alle.",
    },
    {
      question: "Kan jeg prøve før jeg kjøper?",
      answer:
        "Ja! Vi tilbyr 14 dagers gratis prøveperiode uten kredittkort. Du får full tilgang til alle funksjoner og kan teste Stylora grundig med dine egne data. Ingen forpliktelser, ingen skjulte kostnader.",
    },
  ];

  const trustBadges = [
    { icon: Shield, text: "GDPR-kompatibel", color: "text-green-600" },
    { icon: Globe, text: "EU-servere", color: "text-blue-600" },
    { icon: Zap, text: "Ingen bindingstid", color: "text-purple-600" },
    { icon: CheckCircle2, text: "SSL-kryptert", color: "text-orange-600" },
  ];

  // Structured Data for SEO
  const structuredData = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Organization",
        "@id": "https://stylora.no/#organization",
        name: "Stylora",
        url: "https://stylora.no",
        logo: {
          "@type": "ImageObject",
          url: "https://stylora.no/stylora-logo.webp",
        },
        description:
          "Komplett bookingsystem for norske frisørsalonger, barbershops og skjønnhetssalonger",
        address: {
          "@type": "PostalAddress",
          addressCountry: "NO",
        },
        sameAs: [
          "https://www.facebook.com/stylora",
          "https://www.instagram.com/stylora",
        ],
      },
      {
        "@type": "SoftwareApplication",
        "@id": "https://stylora.no/#software",
        name: "Stylora",
        applicationCategory: "BusinessApplication",
        operatingSystem: "Web",
        offers: {
          "@type": "AggregateOffer",
          priceCurrency: "NOK",
          lowPrice: "299",
          highPrice: "1299",
          priceSpecification: [
            {
              "@type": "UnitPriceSpecification",
              price: "299",
              priceCurrency: "NOK",
              name: "Start",
              billingDuration: "P1M",
            },
            {
              "@type": "UnitPriceSpecification",
              price: "699",
              priceCurrency: "NOK",
              name: "Pro",
              billingDuration: "P1M",
            },
            {
              "@type": "UnitPriceSpecification",
              price: "1299",
              priceCurrency: "NOK",
              name: "Enterprise",
              billingDuration: "P1M",
            },
          ],
        },
        aggregateRating: {
          "@type": "AggregateRating",
          ratingValue: "4.9",
          ratingCount: "127",
          bestRating: "5",
        },
      },
      {
        "@type": "LocalBusiness",
        "@id": "https://stylora.no/#localbusiness",
        name: "Stylora",
        image: "https://stylora.no/stylora-logo.webp",
        url: "https://stylora.no",
        telephone: "+47-XXX-XXXXX",
        priceRange: "299-1299 NOK/måned",
        address: {
          "@type": "PostalAddress",
          addressCountry: "NO",
        },
        geo: {
          "@type": "GeoCoordinates",
          latitude: 59.9139,
          longitude: 10.7522,
        },
        openingHoursSpecification: {
          "@type": "OpeningHoursSpecification",
          dayOfWeek: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"],
          opens: "09:00",
          closes: "17:00",
        },
        sameAs: [
          "https://www.facebook.com/stylora",
          "https://www.instagram.com/stylora",
        ],
      },
      {
        "@type": "WebSite",
        "@id": "https://stylora.no/#website",
        url: "https://stylora.no",
        name: "Stylora",
        publisher: {
          "@id": "https://stylora.no/#organization",
        },
        inLanguage: "nb-NO",
      },
    ],
  };

  return (
    <>
      {/* Structured Data */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
      />

      <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
        {/* Enhanced Navigation */}
        <nav className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-gray-200 shadow-sm">
          <div className="container mx-auto px-4 py-4">
            <div className="flex items-center justify-between">
              {/* Logo */}
              <Link href="/">
                <a className="flex items-center gap-2 group">
                  <div className="w-10 h-10 bg-gradient-to-br from-purple-600 to-orange-500 rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                    <Scissors className="w-6 h-6 text-white" />
                  </div>
                  <span className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-orange-500 bg-clip-text text-transparent">
                    Stylora
                  </span>
                </a>
              </Link>

              {/* Desktop Navigation */}
              <div className="hidden md:flex items-center gap-8">
                <a
                  href="#funksjoner"
                  className="text-gray-700 hover:text-purple-600 transition-colors font-medium"
                >
                  Funksjoner
                </a>
                <a
                  href="#priser"
                  className="text-gray-700 hover:text-purple-600 transition-colors font-medium"
                >
                  Priser
                </a>
                <a
                  href="#faq"
                  className="text-gray-700 hover:text-purple-600 transition-colors font-medium"
                >
                  FAQ
                </a>
                <Link href="/about">
                  <a className="text-gray-700 hover:text-purple-600 transition-colors font-medium">
                    Om oss
                  </a>
                </Link>
                <Link href="/gallery">
                  <a className="text-gray-700 hover:text-purple-600 transition-colors font-medium">
                    Galleri
                  </a>
                </Link>
                <Link href="/case-study">
                  <a className="text-gray-700 hover:text-purple-600 transition-colors font-medium">
                    Kundehistorier
                  </a>
                </Link>
                {isOwner && (
                  <Link href="/saas-admin">
                    <a className="text-gray-700 hover:text-purple-600 transition-colors font-medium flex items-center gap-1">
                      <Shield className="w-4 h-4" />
                      SaaS Admin
                    </a>
                  </Link>
                )}
                {user ? (
                  <Link href="/dashboard">
                    <a className="px-6 py-2.5 bg-gradient-to-r from-purple-600 to-orange-500 text-white rounded-lg font-semibold hover:shadow-lg hover:scale-105 transition-all duration-300">
                      Dashboard
                    </a>
                  </Link>
                ) : (
                  <>
                    <Link href="/login">
                      <a className="text-gray-700 hover:text-purple-600 transition-colors font-medium">
                        Logg inn
                      </a>
                    </Link>
                    <Link href="/onboard">
                      <a className="px-6 py-2.5 bg-gradient-to-r from-purple-600 to-orange-500 text-white rounded-lg font-semibold hover:shadow-lg hover:scale-105 transition-all duration-300 flex items-center gap-2">
                        Prøv gratis i 14 dager
                        <ArrowRight className="w-4 h-4" />
                      </a>
                    </Link>
                  </>
                )}
              </div>

              {/* Mobile Menu Button */}
              <button
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                className="md:hidden p-2 rounded-lg hover:bg-gray-100 transition-colors"
              >
                {isMobileMenuOpen ? (
                  <X className="w-6 h-6 text-gray-700" />
                ) : (
                  <Menu className="w-6 h-6 text-gray-700" />
                )}
              </button>
            </div>

            {/* Mobile Menu */}
            {isMobileMenuOpen && (
              <div className="md:hidden mt-4 pb-4 space-y-3 animate-in slide-in-from-top duration-300">
                <a
                  href="#funksjoner"
                  className="block px-4 py-2 text-gray-700 hover:bg-purple-50 hover:text-purple-600 rounded-lg transition-colors font-medium"
                >
                  Funksjoner
                </a>
                <a
                  href="#priser"
                  className="block px-4 py-2 text-gray-700 hover:bg-purple-50 hover:text-purple-600 rounded-lg transition-colors font-medium"
                >
                  Priser
                </a>
                <a
                  href="#faq"
                  className="block px-4 py-2 text-gray-700 hover:bg-purple-50 hover:text-purple-600 rounded-lg transition-colors font-medium"
                >
                  FAQ
                </a>
                <Link href="/about">
                  <a className="block px-4 py-2 text-gray-700 hover:bg-purple-50 hover:text-purple-600 rounded-lg transition-colors font-medium">
                    Om oss
                  </a>
                </Link>
                <Link href="/gallery">
                  <a className="block px-4 py-2 text-gray-700 hover:bg-purple-50 hover:text-purple-600 rounded-lg transition-colors font-medium">
                    Galleri
                  </a>
                </Link>
                <Link href="/case-study">
                  <a className="block px-4 py-2 text-gray-700 hover:bg-purple-50 hover:text-purple-600 rounded-lg transition-colors font-medium">
                    Kundehistorier
                  </a>
                </Link>
                {isOwner && (
                  <Link href="/saas-admin">
                    <a className="block px-4 py-2 text-gray-700 hover:bg-purple-50 hover:text-purple-600 rounded-lg transition-colors font-medium flex items-center gap-2">
                      <Shield className="w-4 h-4" />
                      SaaS Admin
                    </a>
                  </Link>
                )}
                {user ? (
                  <Link href="/dashboard">
                    <a className="block px-4 py-2.5 bg-gradient-to-r from-purple-600 to-orange-500 text-white rounded-lg font-semibold text-center">
                      Dashboard
                    </a>
                  </Link>
                ) : (
                  <>
                    <Link href="/login">
                      <a className="block px-4 py-2 text-gray-700 hover:bg-purple-50 hover:text-purple-600 rounded-lg transition-colors font-medium">
                        Logg inn
                      </a>
                    </Link>
                    <Link href="/onboard">
                      <a className="block px-4 py-2.5 bg-gradient-to-r from-purple-600 to-orange-500 text-white rounded-lg font-semibold text-center">
                        Prøv gratis i 14 dager
                      </a>
                    </Link>
                  </>
                )}
              </div>
            )}
          </div>
        </nav>

        {/* Enhanced Hero Section */}
        <section className="relative overflow-hidden">
          {/* Animated Background */}
          <div className="absolute inset-0 bg-gradient-to-br from-purple-50 via-white to-orange-50">
            <div className="absolute top-20 left-10 w-72 h-72 bg-purple-300 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob"></div>
            <div className="absolute top-40 right-10 w-72 h-72 bg-orange-300 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob animation-delay-2000"></div>
            <div className="absolute -bottom-8 left-1/2 w-72 h-72 bg-pink-300 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob animation-delay-4000"></div>
          </div>

          <div className="relative container mx-auto px-4 py-20 md:py-32">
            <div className="max-w-5xl mx-auto text-center space-y-8">
              {/* Badge */}
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/80 backdrop-blur-sm rounded-full border border-purple-200 shadow-sm animate-in fade-in slide-in-from-top duration-700">
                <Sparkles className="w-4 h-4 text-purple-600" />
                <span className="text-sm font-semibold text-gray-700">
                  Bygget for norske salonger
                </span>
              </div>

              {/* Main Headline */}
              <h1 className="text-5xl md:text-7xl font-bold leading-tight animate-in fade-in slide-in-from-bottom duration-700 delay-100">
                <span className="bg-gradient-to-r from-purple-600 via-pink-600 to-orange-600 bg-clip-text text-transparent">
                  Alt du trenger
                </span>
                <br />
                <span className="text-gray-900">
                  for å drive en moderne salong
                </span>
              </h1>

              {/* Subheadline */}
              <p className="text-xl md:text-2xl text-gray-600 max-w-3xl mx-auto leading-relaxed animate-in fade-in slide-in-from-bottom duration-700 delay-200">
                Stylora er det komplette styringssystemet for moderne salonger.
                Timebok, online booking, betaling og innsikt – alt i én elegant
                løsning. Designet for norske frisørsalonger, barbershops og
                skjønnhetssalonger som vil vokse.
              </p>

              {/* CTA Buttons */}
              <div className="flex flex-col sm:flex-row items-center justify-center gap-4 animate-in fade-in slide-in-from-bottom duration-700 delay-300">
                <Link href="/onboard">
                  <a className="group px-8 py-4 bg-gradient-to-r from-purple-600 to-orange-500 text-white rounded-xl font-bold text-lg hover:shadow-2xl hover:scale-105 transition-all duration-300 flex items-center gap-2">
                    Kom i gang gratis
                    <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                  </a>
                </Link>
                <Link href="/demo">
                  <a className="group px-8 py-4 bg-white text-gray-900 rounded-xl font-bold text-lg hover:shadow-xl hover:scale-105 transition-all duration-300 flex items-center gap-2 border-2 border-gray-200">
                    <Play className="w-5 h-5" />
                    Se demo
                  </a>
                </Link>
              </div>

              {/* Trust Indicators */}
              <div className="flex flex-wrap items-center justify-center gap-6 pt-8 animate-in fade-in slide-in-from-bottom duration-700 delay-400">
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <CheckCircle2 className="w-5 h-5 text-green-600" />
                  <span className="font-medium">Ingen bindingstid</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <CheckCircle2 className="w-5 h-5 text-green-600" />
                  <span className="font-medium">
                    Ingen kredittkort nødvendig
                  </span>
                </div>
              </div>

              {/* Video Demo Section */}
              <div className="mt-12 animate-in fade-in slide-in-from-bottom duration-700 delay-500">
                <div className="relative rounded-2xl overflow-hidden shadow-2xl border-4 border-white/50 backdrop-blur-sm">
                  {/* Video Placeholder with Play Button */}
                  <div className="relative group cursor-pointer">
                    <img
                      src="/images/real-photos/salon-vintage-barber.webp"
                      alt="Stylora system demo preview"
                      className="w-full h-auto object-cover"
                      loading="eager"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent"></div>

                    {/* Play Button Overlay */}
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="relative">
                        <div className="absolute inset-0 bg-purple-600 rounded-full blur-2xl opacity-50 animate-pulse"></div>
                        <button
                          onClick={() =>
                            window.open(
                              "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
                              "_blank"
                            )
                          }
                          className="relative w-20 h-20 bg-white rounded-full flex items-center justify-center shadow-2xl group-hover:scale-110 transition-transform duration-300"
                        >
                          <Play
                            className="w-8 h-8 text-purple-600 ml-1"
                            fill="currentColor"
                          />
                        </button>
                      </div>
                    </div>

                    {/* Video Duration Badge */}
                    <div className="absolute bottom-4 right-4 px-3 py-1.5 bg-black/80 backdrop-blur-sm rounded-lg text-white text-sm font-semibold">
                      <Clock className="w-4 h-4 inline mr-1" />
                      2:30
                    </div>

                    {/* Video Title */}
                    <div className="absolute bottom-4 left-4 text-white">
                      <p className="text-lg font-bold drop-shadow-lg">
                        Se Stylora i aksjon
                      </p>
                      <p className="text-sm opacity-90">
                        Komplett systemgjennomgang
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Decorative Wave */}
          <div className="absolute bottom-0 left-0 right-0">
            <svg
              className="w-full h-16 md:h-24 fill-white"
              viewBox="0 0 1440 120"
              preserveAspectRatio="none"
            >
              <path d="M0,64L48,69.3C96,75,192,85,288,80C384,75,480,53,576,48C672,43,768,53,864,64C960,75,1056,85,1152,80C1248,75,1344,53,1392,42.7L1440,32L1440,120L1392,120C1344,120,1248,120,1152,120C1056,120,960,120,864,120C768,120,672,120,576,120C480,120,384,120,288,120C192,120,96,120,48,120L0,120Z"></path>
            </svg>
          </div>
        </section>

        {/* Enhanced Stats Section */}
        <section className="py-16 bg-white">
          <div className="container mx-auto px-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
              {stats.map((stat, index) => {
                const Icon = stat.icon;
                return (
                  <div
                    key={index}
                    className="text-center group animate-in fade-in slide-in-from-bottom duration-700"
                    style={{ animationDelay: `${index * 100}ms` }}
                  >
                    <div
                      className={`inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br ${stat.color} mb-4 group-hover:scale-110 transition-transform duration-300 shadow-lg`}
                    >
                      <Icon className="w-8 h-8 text-white" />
                    </div>
                    <div className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-purple-600 to-orange-500 bg-clip-text text-transparent mb-2">
                      {stat.number}
                    </div>
                    <div className="text-gray-600 font-medium">
                      {stat.label}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* Trust Badges Bar */}
        <section className="py-8 bg-gradient-to-r from-purple-50 to-orange-50 border-y border-gray-200">
          <div className="container mx-auto px-4">
            <div className="flex flex-wrap items-center justify-center gap-8">
              {trustBadges.map((badge, index) => {
                const Icon = badge.icon;
                return (
                  <div
                    key={index}
                    className="flex items-center gap-2 animate-in fade-in slide-in-from-bottom duration-700"
                    style={{ animationDelay: `${index * 100}ms` }}
                  >
                    <Icon className={`w-5 h-5 ${badge.color}`} />
                    <span className="text-sm font-semibold text-gray-700">
                      {badge.text}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* Enhanced Features Section */}
        <section id="funksjoner" className="py-20 bg-white">
          <div className="container mx-auto px-4">
            <div className="text-center max-w-3xl mx-auto mb-16 space-y-4">
              <Badge className="bg-purple-100 text-purple-700 hover:bg-purple-100 px-4 py-1.5 text-sm font-semibold">
                Funksjoner
              </Badge>
              <h2 className="text-4xl md:text-5xl font-bold text-gray-900">
                Alt du trenger i én løsning
              </h2>
              <p className="text-xl text-gray-600">
                Kraftige verktøy designet for å gjøre hverdagen din enklere
              </p>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
              {features.map((feature, index) => {
                const Icon = feature.icon;
                return (
                  <Card
                    key={index}
                    className="group hover:shadow-2xl transition-all duration-300 border-2 hover:border-purple-200 animate-in fade-in slide-in-from-bottom duration-700 overflow-hidden"
                    style={{ animationDelay: `${index * 100}ms` }}
                  >
                    {/* Feature Image */}
                    {feature.image && (
                      <div className="relative h-48 overflow-hidden">
                        <img
                          src={feature.image}
                          alt={feature.title}
                          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                          loading="lazy"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"></div>
                        <div
                          className={`absolute top-4 left-4 inline-flex items-center justify-center w-12 h-12 rounded-xl bg-gradient-to-br ${feature.color} shadow-lg`}
                        >
                          <Icon className="w-6 h-6 text-white" />
                        </div>
                      </div>
                    )}
                    <CardHeader>
                      <CardTitle className="text-xl font-bold text-gray-900 mb-2">
                        {feature.title}
                      </CardTitle>
                      <CardDescription className="text-base text-gray-600">
                        {feature.description}
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <ul className="space-y-2">
                        {feature.benefits.map((benefit, i) => (
                          <li
                            key={i}
                            className="flex items-center gap-2 text-sm text-gray-700"
                          >
                            <CheckCircle2 className="w-4 h-4 text-green-600 flex-shrink-0" />
                            <span>{benefit}</span>
                          </li>
                        ))}
                      </ul>
                    </CardContent>
                  </Card>
                );
              })}
            </div>

            <div className="text-center mt-12">
              <a
                href="#priser"
                className="inline-flex items-center gap-2 px-8 py-4 bg-gradient-to-r from-purple-600 to-orange-500 text-white rounded-xl font-bold text-lg hover:shadow-2xl hover:scale-105 transition-all duration-300"
              >
                Se systemet i aksjon
                <ChevronRight className="w-5 h-5" />
              </a>
            </div>
          </div>
        </section>

        {/* Enhanced Testimonials Section */}
        <section className="py-20 bg-gradient-to-br from-purple-50 via-white to-orange-50">
          <div className="container mx-auto px-4">
            <div className="text-center max-w-3xl mx-auto mb-16 space-y-4">
              <Badge className="bg-orange-100 text-orange-700 hover:bg-orange-100 px-4 py-1.5 text-sm font-semibold">
                Kundehistorier
              </Badge>
              <h2 className="text-4xl md:text-5xl font-bold text-gray-900">
                Hva kundene våre sier
              </h2>
              <p className="text-xl text-gray-600">
                Bli med i familien av fornøyde salonger over hele Norge
              </p>
            </div>

            <div className="grid md:grid-cols-3 gap-8">
              {testimonials.map((testimonial, index) => (
                <Card
                  key={index}
                  className="group hover:shadow-2xl transition-all duration-300 border-2 hover:border-purple-200 animate-in fade-in slide-in-from-bottom duration-700 overflow-hidden"
                  style={{ animationDelay: `${index * 100}ms` }}
                >
                  {/* Salon Image */}
                  <div className="relative h-48 overflow-hidden">
                    <img
                      src={salonImages[index]}
                      alt={`${testimonial.name} salon`}
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                      loading="lazy"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent"></div>
                    <div className="absolute bottom-4 left-4 flex gap-1">
                      {[...Array(testimonial.rating)].map((_, i) => (
                        <Star
                          key={i}
                          className="w-5 h-5 fill-yellow-400 text-yellow-400"
                        />
                      ))}
                    </div>
                  </div>
                  <CardHeader>
                    <div className="flex items-center gap-4 mb-4">
                      <div
                        className={`w-14 h-14 rounded-full bg-gradient-to-br ${testimonial.color} flex items-center justify-center text-white font-bold text-lg shadow-lg`}
                      >
                        {testimonial.avatar}
                      </div>
                      <div>
                        <div className="font-bold text-gray-900">
                          {testimonial.name}
                        </div>
                        <div className="text-sm text-gray-600">
                          {testimonial.role}
                        </div>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="text-gray-700 leading-relaxed italic">
                      "{testimonial.content}"
                    </p>
                  </CardContent>
                </Card>
              ))}
            </div>

            <div className="text-center mt-12">
              <Link href="/case-study">
                <a className="inline-flex items-center gap-2 text-purple-600 hover:text-purple-700 font-semibold text-lg group">
                  Les kundesuksess-historien
                  <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </a>
              </Link>
            </div>
          </div>
        </section>

        {/* Enhanced Pricing Section */}
        <section id="priser" className="py-20 bg-white">
          <div className="container mx-auto px-4">
            <div className="text-center max-w-3xl mx-auto mb-16 space-y-4">
              <Badge className="bg-green-100 text-green-700 hover:bg-green-100 px-4 py-1.5 text-sm font-semibold">
                Priser
              </Badge>
              <h2 className="text-4xl md:text-5xl font-bold text-gray-900">
                Enkel og transparent prising
              </h2>
              <p className="text-xl text-gray-600">
                Velg planen som passer din salong. Ingen skjulte kostnader.
              </p>
            </div>

            <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
              {plans.map((plan, index) => {
                const Icon = plan.icon;
                return (
                  <Card
                    key={index}
                    className={`relative group transition-all duration-300 ${
                      plan.highlighted
                        ? "border-4 border-purple-500 shadow-2xl scale-105 md:scale-110"
                        : "border-2 hover:border-purple-200 hover:shadow-xl"
                    } animate-in fade-in slide-in-from-bottom duration-700`}
                    style={{ animationDelay: `${index * 100}ms` }}
                  >
                    {plan.badge && (
                      <div className="absolute -top-4 left-1/2 -translate-x-1/2 px-4 py-1.5 bg-gradient-to-r from-purple-600 to-orange-500 text-white text-sm font-bold rounded-full shadow-lg">
                        {plan.badge}
                      </div>
                    )}
                    <CardHeader className="text-center pb-8">
                      <div
                        className={`inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br ${plan.color} mb-4 mx-auto shadow-lg`}
                      >
                        <Icon className="w-8 h-8 text-white" />
                      </div>
                      <CardTitle className="text-2xl font-bold text-gray-900 mb-2">
                        {plan.name}
                      </CardTitle>
                      <div className="flex items-baseline justify-center gap-2 mb-2">
                        <span className="text-5xl font-bold bg-gradient-to-r from-purple-600 to-orange-500 bg-clip-text text-transparent">
                          {plan.price}
                        </span>
                        <span className="text-gray-600 font-medium">
                          NOK/mnd
                        </span>
                      </div>
                      <CardDescription className="text-base text-gray-600">
                        {plan.description}
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                      <ul className="space-y-3">
                        {plan.features.map((feature, i) => (
                          <li
                            key={i}
                            className="flex items-start gap-3 text-gray-700"
                          >
                            <CheckCircle2 className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                            <span className="text-sm">{feature}</span>
                          </li>
                        ))}
                      </ul>
                      <Link href="/onboard">
                        <a
                          className={`block w-full py-3 rounded-xl font-bold text-center transition-all duration-300 ${
                            plan.highlighted
                              ? "bg-gradient-to-r from-purple-600 to-orange-500 text-white hover:shadow-xl hover:scale-105"
                              : "bg-gray-100 text-gray-900 hover:bg-gray-200"
                          }`}
                        >
                          Start gratis prøveperiode
                        </a>
                      </Link>
                    </CardContent>
                  </Card>
                );
              })}
            </div>

            <div className="text-center mt-12 space-y-4">
              <p className="text-gray-600">
                Alle planer inkluderer 14 dagers gratis prøveperiode. Ingen
                kredittkort nødvendig.
              </p>
              <div className="flex flex-wrap items-center justify-center gap-6 text-sm text-gray-600">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-green-600" />
                  <span>Ingen bindingstid</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-green-600" />
                  <span>Avslutt når som helst</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-green-600" />
                  <span>Norsk support</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* FAQ Section */}
        <section
          id="faq"
          className="py-20 bg-gradient-to-br from-gray-50 to-white"
        >
          <div className="container mx-auto px-4">
            <div className="text-center max-w-3xl mx-auto mb-16 space-y-4">
              <Badge className="bg-blue-100 text-blue-700 hover:bg-blue-100 px-4 py-1.5 text-sm font-semibold">
                FAQ
              </Badge>
              <h2 className="text-4xl md:text-5xl font-bold text-gray-900">
                Ofte stilte spørsmål
              </h2>
              <p className="text-xl text-gray-600">
                Alt du trenger å vite om Stylora
              </p>
            </div>

            <div className="max-w-3xl mx-auto">
              <Accordion type="single" collapsible className="space-y-4">
                {faqs.map((faq, index) => (
                  <AccordionItem
                    key={index}
                    value={`item-${index}`}
                    className="bg-white border-2 rounded-xl px-6 hover:border-purple-200 transition-colors animate-in fade-in slide-in-from-bottom duration-700"
                    style={{ animationDelay: `${index * 50}ms` }}
                  >
                    <AccordionTrigger className="text-left font-semibold text-gray-900 hover:text-purple-600 text-lg py-6">
                      {faq.question}
                    </AccordionTrigger>
                    <AccordionContent className="text-gray-600 leading-relaxed pb-6">
                      {faq.answer}
                    </AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            </div>
          </div>
        </section>

        {/* Enhanced Final CTA Section */}
        <section className="relative py-24 overflow-hidden">
          {/* Animated Background */}
          <div className="absolute inset-0 bg-gradient-to-br from-purple-600 via-pink-600 to-orange-600">
            <div className="absolute top-0 left-0 w-96 h-96 bg-white rounded-full mix-blend-overlay filter blur-3xl opacity-20 animate-blob"></div>
            <div className="absolute bottom-0 right-0 w-96 h-96 bg-white rounded-full mix-blend-overlay filter blur-3xl opacity-20 animate-blob animation-delay-2000"></div>
          </div>

          <div className="relative container mx-auto px-4 text-center">
            <div className="max-w-4xl mx-auto space-y-8">
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/20 backdrop-blur-sm rounded-full border border-white/30">
                <Sparkles className="w-4 h-4 text-white" />
                <span className="text-sm font-semibold text-white">
                  Klar for å ta salongen din til neste nivå?
                </span>
              </div>

              <h2 className="text-4xl md:text-6xl font-bold text-white leading-tight">
                Start din gratis prøveperiode i dag
              </h2>

              <p className="text-xl md:text-2xl text-white/90 max-w-2xl mx-auto">
                Bli med 5000+ fornøyde salonger som allerede bruker Stylora.
                Ingen kredittkort nødvendig.
              </p>

              <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
                <Link href="/onboard">
                  <a className="group px-10 py-5 bg-white text-purple-600 rounded-xl font-bold text-lg hover:shadow-2xl hover:scale-105 transition-all duration-300 flex items-center gap-2">
                    Kom i gang gratis
                    <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                  </a>
                </Link>
                <Link href="/contact">
                  <a className="px-10 py-5 bg-white/10 backdrop-blur-sm text-white rounded-xl font-bold text-lg hover:bg-white/20 transition-all duration-300 border-2 border-white/30">
                    Kontakt oss
                  </a>
                </Link>
              </div>

              <div className="flex flex-wrap items-center justify-center gap-8 pt-8 text-white/90">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-5 h-5" />
                  <span className="font-medium">
                    14 dagers gratis prøveperiode
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-5 h-5" />
                  <span className="font-medium">Ingen bindingstid</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-5 h-5" />
                  <span className="font-medium">Norsk support</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Footer */}
        <Footer />
      </div>

      {/* Add custom animations */}
      <style jsx>{`
        @keyframes blob {
          0% {
            transform: translate(0px, 0px) scale(1);
          }
          33% {
            transform: translate(30px, -50px) scale(1.1);
          }
          66% {
            transform: translate(-20px, 20px) scale(0.9);
          }
          100% {
            transform: translate(0px, 0px) scale(1);
          }
        }
        .animate-blob {
          animation: blob 7s infinite;
        }
        .animation-delay-2000 {
          animation-delay: 2s;
        }
        .animation-delay-4000 {
          animation-delay: 4s;
        }
      `}</style>
    </>
  );
}
