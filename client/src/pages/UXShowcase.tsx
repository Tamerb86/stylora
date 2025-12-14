import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { 
  Calendar, 
  Users, 
  Scissors, 
  Package, 
  DollarSign, 
  Settings,
  Plus,
  Edit,
  Trash2,
  Check,
  X,
  ArrowRight,
  Download,
  Upload,
  Search,
  Filter,
  BarChart3,
  TrendingUp,
  Clock,
  UserCog,
  Sparkles,
  LogIn,
  LogOut,
  Save,
  Send,
  Mail,
  Phone,
  MapPin,
  Star
} from "lucide-react";

export default function UXShowcase() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 py-12 px-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-5xl font-bold bg-gradient-to-r from-blue-600 to-orange-500 bg-clip-text text-transparent mb-4">
            Stylora UX Showcase
          </h1>
          <p className="text-xl text-muted-foreground">
            Alle knapper, komponenter og interaktive elementer i systemet
          </p>
        </div>

        {/* Primary Buttons Section */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="text-2xl">Primary Buttons (Primærknapper)</CardTitle>
            <CardDescription>Hovedhandlinger med gradient-stil</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold mb-3">Standard Primary Buttons</h3>
              <div className="flex flex-wrap gap-3">
                <Button className="bg-gradient-to-r from-blue-600 to-orange-500 hover:from-blue-700 hover:to-orange-600">
                  <Plus className="mr-2 h-4 w-4" />
                  Ny kunde
                </Button>
                <Button className="bg-gradient-to-r from-blue-600 to-orange-500 hover:from-blue-700 hover:to-orange-600">
                  <Calendar className="mr-2 h-4 w-4" />
                  Ny avtale
                </Button>
                <Button className="bg-gradient-to-r from-blue-600 to-orange-500 hover:from-blue-700 hover:to-orange-600">
                  <Scissors className="mr-2 h-4 w-4" />
                  Ny tjeneste
                </Button>
                <Button className="bg-gradient-to-r from-blue-600 to-orange-500 hover:from-blue-700 hover:to-orange-600">
                  <Users className="mr-2 h-4 w-4" />
                  Ny ansatt
                </Button>
                <Button className="bg-gradient-to-r from-blue-600 to-orange-500 hover:from-blue-700 hover:to-orange-600">
                  <Package className="mr-2 h-4 w-4" />
                  Nytt produkt
                </Button>
              </div>
            </div>

            <div>
              <h3 className="text-lg font-semibold mb-3">Action Buttons with Icons</h3>
              <div className="flex flex-wrap gap-3">
                <Button className="bg-gradient-to-r from-blue-600 to-orange-500 hover:from-blue-700 hover:to-orange-600">
                  <Save className="mr-2 h-4 w-4" />
                  Lagre
                </Button>
                <Button className="bg-gradient-to-r from-blue-600 to-orange-500 hover:from-blue-700 hover:to-orange-600">
                  <Send className="mr-2 h-4 w-4" />
                  Send
                </Button>
                <Button className="bg-gradient-to-r from-blue-600 to-orange-500 hover:from-blue-700 hover:to-orange-600">
                  <Download className="mr-2 h-4 w-4" />
                  Last ned
                </Button>
                <Button className="bg-gradient-to-r from-blue-600 to-orange-500 hover:from-blue-700 hover:to-orange-600">
                  <Upload className="mr-2 h-4 w-4" />
                  Last opp
                </Button>
                <Button className="bg-gradient-to-r from-blue-600 to-orange-500 hover:from-blue-700 hover:to-orange-600">
                  <ArrowRight className="ml-2 h-4 w-4" />
                  Neste
                </Button>
              </div>
            </div>

            <div>
              <h3 className="text-lg font-semibold mb-3">Large CTA Buttons</h3>
              <div className="flex flex-wrap gap-3">
                <Button size="lg" className="bg-gradient-to-r from-blue-600 to-orange-500 hover:from-blue-700 hover:to-orange-600 text-lg">
                  <ArrowRight className="mr-2 h-5 w-5" />
                  Kom i gang gratis
                </Button>
                <Button size="lg" className="bg-gradient-to-r from-blue-600 to-orange-500 hover:from-blue-700 hover:to-orange-600 text-lg">
                  <Calendar className="mr-2 h-5 w-5" />
                  Prøv gratis i 14 dager
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Secondary & Outline Buttons */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="text-2xl">Secondary & Outline Buttons</CardTitle>
            <CardDescription>Sekundære handlinger og alternativer</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold mb-3">Secondary Buttons</h3>
              <div className="flex flex-wrap gap-3">
                <Button variant="secondary">
                  <Filter className="mr-2 h-4 w-4" />
                  Filtrer
                </Button>
                <Button variant="secondary">
                  <Search className="mr-2 h-4 w-4" />
                  Søk
                </Button>
                <Button variant="secondary">
                  Avbryt
                </Button>
                <Button variant="secondary">
                  Tilbake
                </Button>
              </div>
            </div>

            <div>
              <h3 className="text-lg font-semibold mb-3">Outline Buttons</h3>
              <div className="flex flex-wrap gap-3">
                <Button variant="outline">
                  <Edit className="mr-2 h-4 w-4" />
                  Rediger
                </Button>
                <Button variant="outline">
                  <BarChart3 className="mr-2 h-4 w-4" />
                  Se rapport
                </Button>
                <Button variant="outline">
                  <Settings className="mr-2 h-4 w-4" />
                  Innstillinger
                </Button>
                <Button variant="outline">
                  Se demo
                </Button>
              </div>
            </div>

            <div>
              <h3 className="text-lg font-semibold mb-3">Ghost Buttons</h3>
              <div className="flex flex-wrap gap-3">
                <Button variant="ghost">
                  <LogIn className="mr-2 h-4 w-4" />
                  Logg inn
                </Button>
                <Button variant="ghost">
                  <LogOut className="mr-2 h-4 w-4" />
                  Logg ut
                </Button>
                <Button variant="ghost">
                  Hopp over
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Destructive & Status Buttons */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="text-2xl">Destructive & Status Buttons</CardTitle>
            <CardDescription>Fargerike knapper for spesifikke handlinger</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold mb-3">Destructive Buttons (Sletting)</h3>
              <div className="flex flex-wrap gap-3">
                <Button variant="destructive">
                  <Trash2 className="mr-2 h-4 w-4" />
                  Slett kunde
                </Button>
                <Button variant="destructive">
                  <X className="mr-2 h-4 w-4" />
                  Kanseller avtale
                </Button>
                <Button variant="destructive">
                  Fjern
                </Button>
              </div>
            </div>

            <div>
              <h3 className="text-lg font-semibold mb-3">Success Buttons (Grønn)</h3>
              <div className="flex flex-wrap gap-3">
                <Button className="bg-green-600 hover:bg-green-700">
                  <Check className="mr-2 h-4 w-4" />
                  Bekreft
                </Button>
                <Button className="bg-green-600 hover:bg-green-700">
                  <Check className="mr-2 h-4 w-4" />
                  Godkjenn
                </Button>
                <Button className="bg-green-600 hover:bg-green-700">
                  <LogIn className="mr-2 h-4 w-4" />
                  Inn
                </Button>
              </div>
            </div>

            <div>
              <h3 className="text-lg font-semibold mb-3">Warning Buttons (Oransje)</h3>
              <div className="flex flex-wrap gap-3">
                <Button className="bg-orange-600 hover:bg-orange-700">
                  <Clock className="mr-2 h-4 w-4" />
                  Ut
                </Button>
                <Button className="bg-orange-600 hover:bg-orange-700">
                  Advarsel
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Icon Buttons */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="text-2xl">Icon Buttons (Kun ikoner)</CardTitle>
            <CardDescription>Kompakte knapper for verktøylinjer</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold mb-3">Small Icon Buttons</h3>
              <div className="flex flex-wrap gap-3">
                <Button size="icon" variant="outline">
                  <Edit className="h-4 w-4" />
                </Button>
                <Button size="icon" variant="outline">
                  <Trash2 className="h-4 w-4" />
                </Button>
                <Button size="icon" variant="outline">
                  <Plus className="h-4 w-4" />
                </Button>
                <Button size="icon" variant="outline">
                  <Search className="h-4 w-4" />
                </Button>
                <Button size="icon" variant="outline">
                  <Filter className="h-4 w-4" />
                </Button>
                <Button size="icon" variant="outline">
                  <Download className="h-4 w-4" />
                </Button>
              </div>
            </div>

            <div>
              <h3 className="text-lg font-semibold mb-3">Gradient Icon Buttons</h3>
              <div className="flex flex-wrap gap-3">
                <Button size="icon" className="bg-gradient-to-r from-blue-600 to-cyan-500">
                  <Calendar className="h-4 w-4" />
                </Button>
                <Button size="icon" className="bg-gradient-to-r from-orange-600 to-red-500">
                  <Users className="h-4 w-4" />
                </Button>
                <Button size="icon" className="bg-gradient-to-r from-green-600 to-emerald-500">
                  <DollarSign className="h-4 w-4" />
                </Button>
                <Button size="icon" className="bg-gradient-to-r from-purple-600 to-pink-500">
                  <Sparkles className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Badges */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="text-2xl">Badges (Merker)</CardTitle>
            <CardDescription>Status-indikatorer og kategorier</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold mb-3">Status Badges</h3>
              <div className="flex flex-wrap gap-3">
                <Badge variant="default">Bekreftet</Badge>
                <Badge variant="secondary">Venter</Badge>
                <Badge variant="destructive">Kansellert</Badge>
                <Badge variant="outline">Utkast</Badge>
                <Badge className="bg-green-600">Fullført</Badge>
                <Badge className="bg-orange-600">Møtte ikke opp</Badge>
                <Badge className="bg-blue-600">Aktiv</Badge>
                <Badge className="bg-gray-600">Inaktiv</Badge>
              </div>
            </div>

            <div>
              <h3 className="text-lg font-semibold mb-3">Feature Badges</h3>
              <div className="flex flex-wrap gap-3">
                <Badge className="bg-gradient-to-r from-blue-600 to-orange-500">
                  <Sparkles className="mr-1 h-3 w-3" />
                  Mest populær
                </Badge>
                <Badge className="bg-gradient-to-r from-green-600 to-emerald-500">
                  <Star className="mr-1 h-3 w-3" />
                  Mest valgt
                </Badge>
                <Badge className="bg-gradient-to-r from-purple-600 to-pink-500">
                  <TrendingUp className="mr-1 h-3 w-3" />
                  Nytt
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Form Elements */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="text-2xl">Form Elements (Skjemaelementer)</CardTitle>
            <CardDescription>Input-felt, tekstområder og etiketter</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="name">Navn</Label>
                <Input id="name" placeholder="Skriv inn navn..." />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">E-post</Label>
                <Input id="email" type="email" placeholder="eksempel@email.com" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone">Telefon</Label>
                <Input id="phone" type="tel" placeholder="+47 123 45 678" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="search">Søk</Label>
                <div className="relative">
                  <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input id="search" placeholder="Søk..." className="pl-10" />
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="notes">Notater</Label>
              <Textarea id="notes" placeholder="Skriv notater her..." rows={4} />
            </div>
          </CardContent>
        </Card>

        {/* Navigation Icons */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="text-2xl">Navigation Icons (Navigasjonsikoner)</CardTitle>
            <CardDescription>Ikoner brukt i sidebar og menyer</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-6">
              <div className="flex flex-col items-center gap-2 p-4 border rounded-lg hover:bg-accent transition-colors">
                <Calendar className="h-8 w-8 text-blue-600" />
                <span className="text-sm font-medium">Timebok</span>
              </div>
              <div className="flex flex-col items-center gap-2 p-4 border rounded-lg hover:bg-accent transition-colors">
                <Users className="h-8 w-8 text-purple-600" />
                <span className="text-sm font-medium">Kunder</span>
              </div>
              <div className="flex flex-col items-center gap-2 p-4 border rounded-lg hover:bg-accent transition-colors">
                <Scissors className="h-8 w-8 text-pink-600" />
                <span className="text-sm font-medium">Tjenester</span>
              </div>
              <div className="flex flex-col items-center gap-2 p-4 border rounded-lg hover:bg-accent transition-colors">
                <UserCog className="h-8 w-8 text-orange-600" />
                <span className="text-sm font-medium">Ansatte</span>
              </div>
              <div className="flex flex-col items-center gap-2 p-4 border rounded-lg hover:bg-accent transition-colors">
                <Package className="h-8 w-8 text-green-600" />
                <span className="text-sm font-medium">Produkter</span>
              </div>
              <div className="flex flex-col items-center gap-2 p-4 border rounded-lg hover:bg-accent transition-colors">
                <BarChart3 className="h-8 w-8 text-cyan-600" />
                <span className="text-sm font-medium">Rapporter</span>
              </div>
              <div className="flex flex-col items-center gap-2 p-4 border rounded-lg hover:bg-accent transition-colors">
                <DollarSign className="h-8 w-8 text-emerald-600" />
                <span className="text-sm font-medium">Økonomi</span>
              </div>
              <div className="flex flex-col items-center gap-2 p-4 border rounded-lg hover:bg-accent transition-colors">
                <TrendingUp className="h-8 w-8 text-indigo-600" />
                <span className="text-sm font-medium">Analyse</span>
              </div>
              <div className="flex flex-col items-center gap-2 p-4 border rounded-lg hover:bg-accent transition-colors">
                <Sparkles className="h-8 w-8 text-yellow-600" />
                <span className="text-sm font-medium">Lojalitet</span>
              </div>
              <div className="flex flex-col items-center gap-2 p-4 border rounded-lg hover:bg-accent transition-colors">
                <Clock className="h-8 w-8 text-red-600" />
                <span className="text-sm font-medium">Tidur</span>
              </div>
              <div className="flex flex-col items-center gap-2 p-4 border rounded-lg hover:bg-accent transition-colors">
                <Settings className="h-8 w-8 text-gray-600" />
                <span className="text-sm font-medium">Innstillinger</span>
              </div>
              <div className="flex flex-col items-center gap-2 p-4 border rounded-lg hover:bg-accent transition-colors">
                <Mail className="h-8 w-8 text-blue-500" />
                <span className="text-sm font-medium">Varsler</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Interactive Cards */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="text-2xl">Interactive Cards (Interaktive kort)</CardTitle>
            <CardDescription>Kort med hover-effekter og gradient-bakgrunner</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {/* Stat Card 1 */}
              <Card className="border-blue-200 hover:border-blue-400 hover:shadow-xl transition-all duration-300 hover:-translate-y-1 cursor-pointer bg-gradient-to-br from-blue-50 to-cyan-50">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg">Dagens avtaler</CardTitle>
                    <div className="p-3 bg-gradient-to-br from-blue-600 to-cyan-500 rounded-xl group-hover:scale-110 transition-transform">
                      <Calendar className="h-6 w-6 text-white" />
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-blue-600">24</div>
                  <p className="text-sm text-muted-foreground mt-1">+12% fra i går</p>
                </CardContent>
              </Card>

              {/* Stat Card 2 */}
              <Card className="border-orange-200 hover:border-orange-400 hover:shadow-xl transition-all duration-300 hover:-translate-y-1 cursor-pointer bg-gradient-to-br from-orange-50 to-red-50">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg">Inntekt i dag</CardTitle>
                    <div className="p-3 bg-gradient-to-br from-orange-600 to-red-500 rounded-xl group-hover:scale-110 transition-transform">
                      <DollarSign className="h-6 w-6 text-white" />
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-orange-600">kr 8,450</div>
                  <p className="text-sm text-muted-foreground mt-1">+8% fra i går</p>
                </CardContent>
              </Card>

              {/* Stat Card 3 */}
              <Card className="border-green-200 hover:border-green-400 hover:shadow-xl transition-all duration-300 hover:-translate-y-1 cursor-pointer bg-gradient-to-br from-green-50 to-emerald-50">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg">Nye kunder</CardTitle>
                    <div className="p-3 bg-gradient-to-br from-green-600 to-emerald-500 rounded-xl group-hover:scale-110 transition-transform">
                      <Users className="h-6 w-6 text-white" />
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-green-600">7</div>
                  <p className="text-sm text-muted-foreground mt-1">Denne uken</p>
                </CardContent>
              </Card>
            </div>
          </CardContent>
        </Card>

        {/* Size Variants */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="text-2xl">Button Sizes (Knappestørrelser)</CardTitle>
            <CardDescription>Alle tilgjengelige størrelser</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex flex-wrap items-center gap-3">
              <Button size="sm" className="bg-gradient-to-r from-blue-600 to-orange-500">
                Liten
              </Button>
              <Button size="default" className="bg-gradient-to-r from-blue-600 to-orange-500">
                Standard
              </Button>
              <Button size="lg" className="bg-gradient-to-r from-blue-600 to-orange-500">
                Stor
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Footer */}
        <div className="text-center mt-12 pb-8">
          <p className="text-muted-foreground">
            Totalt: 50+ unike knapper og komponenter • Konsistent design system
          </p>
        </div>
      </div>
    </div>
  );
}
