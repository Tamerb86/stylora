import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Scissors,
  Package,
  Download,
  CheckCircle2,
  AlertCircle,
  Loader2,
  ChevronDown,
  ChevronUp,
  Sparkles,
} from "lucide-react";
import { toast } from "sonner";
import { trpc } from "@/lib/trpc";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export function DefaultDataTab() {
  const [loadServices, setLoadServices] = useState(true);
  const [loadProducts, setLoadProducts] = useState(true);
  const [servicesOpen, setServicesOpen] = useState(false);
  const [productsOpen, setProductsOpen] = useState(false);

  const utils = trpc.useUtils();

  // Get preview data
  const { data: preview, isLoading: previewLoading } =
    trpc.salonSettings.getDefaultDataPreview.useQuery();

  // Load default data mutation
  const loadDefaultDataMutation =
    trpc.salonSettings.loadDefaultData.useMutation({
      onSuccess: result => {
        toast.success(result.message, {
          description: `Tjenester: ${result.stats.servicesAdded}, Produkter: ${result.stats.productsAdded}`,
          duration: 5000,
        });
        // Invalidate services and products queries
        utils.services.list.invalidate();
        utils.products.list.invalidate();
      },
      onError: error => {
        toast.error("Kunne ikke laste inn standarddata", {
          description: error.message,
        });
      },
    });

  const handleLoadDefaultData = () => {
    if (!loadServices && !loadProducts) {
      toast.error("Velg minst én type data å laste inn");
      return;
    }

    loadDefaultDataMutation.mutate({
      loadServices,
      loadProducts,
    });
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("nb-NO", {
      style: "currency",
      currency: "NOK",
      minimumFractionDigits: 0,
    }).format(price);
  };

  return (
    <div className="space-y-6">
      {/* Introduction Card */}
      <Card className="border-blue-200 bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-950/30 dark:to-indigo-950/30">
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-gradient-to-br from-blue-500 to-indigo-600 text-white">
              <Sparkles className="h-6 w-6" />
            </div>
            <div>
              <CardTitle className="text-xl">Kom raskt i gang!</CardTitle>
              <CardDescription className="text-base">
                Last inn ferdiglagde tjenester og produkter som er vanlige i
                frisør- og barbersalonger
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex items-center gap-3 p-3 bg-white/60 dark:bg-white/5 rounded-lg">
              <Scissors className="h-5 w-5 text-blue-600" />
              <div>
                <p className="font-medium">
                  {preview?.summary.services || 0} Tjenester
                </p>
                <p className="text-sm text-muted-foreground">
                  {preview?.summary.serviceCategories || 0} kategorier
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3 p-3 bg-white/60 dark:bg-white/5 rounded-lg">
              <Package className="h-5 w-5 text-orange-600" />
              <div>
                <p className="font-medium">
                  {preview?.summary.products || 0} Produkter
                </p>
                <p className="text-sm text-muted-foreground">
                  {preview?.summary.productCategories || 0} kategorier
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Selection Card */}
      <Card>
        <CardHeader>
          <CardTitle>Velg hva du vil laste inn</CardTitle>
          <CardDescription>
            Du kan alltid redigere eller slette elementene etterpå
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Services Selection */}
          <div className="flex items-start space-x-3 p-4 border rounded-lg hover:bg-muted/50 transition-colors">
            <Checkbox
              id="loadServices"
              checked={loadServices}
              onCheckedChange={checked => setLoadServices(checked as boolean)}
            />
            <div className="flex-1">
              <Label
                htmlFor="loadServices"
                className="text-base font-medium cursor-pointer flex items-center gap-2"
              >
                <Scissors className="h-4 w-4 text-blue-600" />
                Tjenester
              </Label>
              <p className="text-sm text-muted-foreground mt-1">
                Herreklipp, dameklipp, skjeggpleie, farging, behandlinger,
                styling og mer
              </p>
              <div className="flex flex-wrap gap-2 mt-2">
                {preview?.serviceCategories.map(cat => (
                  <Badge key={cat.name} variant="secondary" className="text-xs">
                    {cat.name}
                  </Badge>
                ))}
              </div>
            </div>
          </div>

          {/* Products Selection */}
          <div className="flex items-start space-x-3 p-4 border rounded-lg hover:bg-muted/50 transition-colors">
            <Checkbox
              id="loadProducts"
              checked={loadProducts}
              onCheckedChange={checked => setLoadProducts(checked as boolean)}
            />
            <div className="flex-1">
              <Label
                htmlFor="loadProducts"
                className="text-base font-medium cursor-pointer flex items-center gap-2"
              >
                <Package className="h-4 w-4 text-orange-600" />
                Produkter
              </Label>
              <p className="text-sm text-muted-foreground mt-1">
                Stylingprodukter, hårpleie, skjeggpleie, verktøy og gavekort
              </p>
              <div className="flex flex-wrap gap-2 mt-2">
                {preview?.productCategories.map(cat => (
                  <Badge key={cat.name} variant="secondary" className="text-xs">
                    {cat.name}
                  </Badge>
                ))}
              </div>
            </div>
          </div>

          <Separator />

          {/* Load Button */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <AlertCircle className="h-4 w-4" />
              <span>Eksisterende data vil ikke bli overskrevet</span>
            </div>
            <Button
              onClick={handleLoadDefaultData}
              disabled={
                loadDefaultDataMutation.isPending ||
                (!loadServices && !loadProducts)
              }
              className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700"
            >
              {loadDefaultDataMutation.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Laster inn...
                </>
              ) : (
                <>
                  <Download className="h-4 w-4 mr-2" />
                  Last inn standarddata
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Preview Services */}
      <Collapsible open={servicesOpen} onOpenChange={setServicesOpen}>
        <Card>
          <CollapsibleTrigger asChild>
            <CardHeader className="cursor-pointer hover:bg-muted/50 transition-colors">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Scissors className="h-5 w-5 text-blue-600" />
                  <div>
                    <CardTitle className="text-lg">
                      Forhåndsvisning av tjenester
                    </CardTitle>
                    <CardDescription>
                      Se alle {preview?.summary.services || 0} tjenester som vil
                      bli lagt til
                    </CardDescription>
                  </div>
                </div>
                {servicesOpen ? (
                  <ChevronUp className="h-5 w-5 text-muted-foreground" />
                ) : (
                  <ChevronDown className="h-5 w-5 text-muted-foreground" />
                )}
              </div>
            </CardHeader>
          </CollapsibleTrigger>
          <CollapsibleContent>
            <CardContent>
              {previewLoading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                </div>
              ) : (
                <div className="rounded-md border max-h-[500px] overflow-y-auto">
                  <Table>
                    <TableHeader className="sticky top-0 bg-background">
                      <TableRow>
                        <TableHead>Tjeneste</TableHead>
                        <TableHead>Kategori</TableHead>
                        <TableHead className="text-right">Varighet</TableHead>
                        <TableHead className="text-right">Pris</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {preview?.services.map((service, index) => (
                        <TableRow key={index}>
                          <TableCell>
                            <div>
                              <p className="font-medium">{service.name}</p>
                              <p className="text-sm text-muted-foreground line-clamp-1">
                                {service.description}
                              </p>
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline">
                              {service.categoryName}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right">
                            {service.durationMinutes} min
                          </TableCell>
                          <TableCell className="text-right font-medium">
                            {formatPrice(service.price)}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
              <p className="text-sm text-muted-foreground mt-3 text-center">
                Totalt {preview?.summary.services || 0} tjenester i{" "}
                {preview?.summary.serviceCategories || 0} kategorier
              </p>
            </CardContent>
          </CollapsibleContent>
        </Card>
      </Collapsible>

      {/* Preview Products */}
      <Collapsible open={productsOpen} onOpenChange={setProductsOpen}>
        <Card>
          <CollapsibleTrigger asChild>
            <CardHeader className="cursor-pointer hover:bg-muted/50 transition-colors">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Package className="h-5 w-5 text-orange-600" />
                  <div>
                    <CardTitle className="text-lg">
                      Forhåndsvisning av produkter
                    </CardTitle>
                    <CardDescription>
                      Se alle {preview?.summary.products || 0} produkter som vil
                      bli lagt til
                    </CardDescription>
                  </div>
                </div>
                {productsOpen ? (
                  <ChevronUp className="h-5 w-5 text-muted-foreground" />
                ) : (
                  <ChevronDown className="h-5 w-5 text-muted-foreground" />
                )}
              </div>
            </CardHeader>
          </CollapsibleTrigger>
          <CollapsibleContent>
            <CardContent>
              {previewLoading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                </div>
              ) : (
                <div className="rounded-md border max-h-[500px] overflow-y-auto">
                  <Table>
                    <TableHeader className="sticky top-0 bg-background">
                      <TableRow>
                        <TableHead>Produkt</TableHead>
                        <TableHead>Kategori</TableHead>
                        <TableHead className="text-right">
                          Innkjøpspris
                        </TableHead>
                        <TableHead className="text-right">
                          Utsalgspris
                        </TableHead>
                        <TableHead className="text-right">Lager</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {preview?.products.map((product, index) => (
                        <TableRow key={index}>
                          <TableCell>
                            <div>
                              <p className="font-medium">{product.name}</p>
                              <p className="text-sm text-muted-foreground line-clamp-1">
                                {product.description}
                              </p>
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline">
                              {product.categoryName}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right text-muted-foreground">
                            {formatPrice(product.costPrice)}
                          </TableCell>
                          <TableCell className="text-right font-medium">
                            {formatPrice(product.retailPrice)}
                          </TableCell>
                          <TableCell className="text-right">
                            {product.stockQuantity}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
              <p className="text-sm text-muted-foreground mt-3 text-center">
                Totalt {preview?.summary.products || 0} produkter i{" "}
                {preview?.summary.productCategories || 0} kategorier
              </p>
            </CardContent>
          </CollapsibleContent>
        </Card>
      </Collapsible>

      {/* Success State */}
      {loadDefaultDataMutation.isSuccess && (
        <Card className="border-green-200 bg-green-50 dark:bg-green-950/30">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <CheckCircle2 className="h-6 w-6 text-green-600" />
              <div>
                <p className="font-medium text-green-800 dark:text-green-200">
                  Standarddata lastet inn!
                </p>
                <p className="text-sm text-green-600 dark:text-green-400">
                  Gå til Tjenester eller Produkter for å se og redigere dataene
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
