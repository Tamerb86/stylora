import { useState } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Upload, Download, Database, Users, Briefcase, Package, FileText, AlertCircle, CheckCircle2, Clock } from "lucide-react";
import { format } from "date-fns";
import { nb } from "date-fns/locale";
import { toast } from "sonner";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function DataImport() {
  const [uploading, setUploading] = useState(false);
  const [activeTab, setActiveTab] = useState("customers");

  const { data: imports, refetch } = trpc.imports.list.useQuery();

  const importCustomers = trpc.imports.importCustomers.useMutation({
    onSuccess: (data) => {
      toast.success(`Importert ${data.imported} av ${data.total} kunder`);
      if (data.failed > 0) {
        toast.warning(`${data.failed} kunder feilet`);
      }
      setUploading(false);
      refetch();
    },
    onError: (error) => {
      toast.error(error.message || "Kunne ikke importere kunder");
      setUploading(false);
    },
  });

  const importServices = trpc.imports.importServices.useMutation({
    onSuccess: (data) => {
      toast.success(`Importert ${data.imported} av ${data.total} tjenester`);
      if (data.failed > 0) {
        toast.warning(`${data.failed} tjenester feilet`);
      }
      setUploading(false);
      refetch();
    },
    onError: (error) => {
      toast.error(error.message || "Kunne ikke importere tjenester");
      setUploading(false);
    },
  });

  const importProducts = trpc.imports.importProducts.useMutation({
    onSuccess: (data) => {
      toast.success(`Importert ${data.imported} av ${data.total} produkter`);
      if (data.failed > 0) {
        toast.warning(`${data.failed} produkter feilet`);
      }
      setUploading(false);
      refetch();
    },
    onError: (error) => {
      toast.error(error.message || "Kunne ikke importere produkter");
      setUploading(false);
    },
  });

  const restoreSQL = trpc.imports.restoreSQL.useMutation({
    onSuccess: (data) => {
      toast.success(`Utført ${data.executed} av ${data.total} SQL-setninger`);
      if (data.failed > 0) {
        toast.warning(`${data.failed} setninger feilet`);
      }
      setUploading(false);
      refetch();
    },
    onError: (error) => {
      toast.error(error.message || "Kunne ikke gjenopprette sikkerhetskopi");
      setUploading(false);
    },
  });

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>, type: string) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    const validExtensions = type === "sql" ? [".sql"] : [".csv", ".xlsx", ".xls"];
    const fileExtension = file.name.substring(file.name.lastIndexOf(".")).toLowerCase();
    
    if (!validExtensions.includes(fileExtension)) {
      toast.error(`Ugyldig filtype. Tillatte typer: ${validExtensions.join(", ")}`);
      return;
    }

    // Validate file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      toast.error("Filen er for stor. Maksimal størrelse: 10MB");
      return;
    }

    setUploading(true);

    try {
      // Read file as base64
      const reader = new FileReader();
      reader.onload = async (e) => {
        const base64Content = e.target?.result as string;
        const base64Data = base64Content.split(",")[1]; // Remove data:*/*;base64, prefix

        // Upload based on type
        switch (type) {
          case "customers":
            await importCustomers.mutateAsync({
              fileContent: base64Data,
              fileName: file.name,
            });
            break;
          case "services":
            await importServices.mutateAsync({
              fileContent: base64Data,
              fileName: file.name,
            });
            break;
          case "products":
            await importProducts.mutateAsync({
              fileContent: base64Data,
              fileName: file.name,
            });
            break;
          case "sql":
            if (confirm("ADVARSEL: Dette vil gjenopprette databasen fra sikkerhetskopien. Er du sikker?")) {
              await restoreSQL.mutateAsync({
                fileContent: base64Data,
                fileName: file.name,
              });
            } else {
              setUploading(false);
            }
            break;
        }
      };

      reader.onerror = () => {
        toast.error("Kunne ikke lese filen");
        setUploading(false);
      };

      reader.readAsDataURL(file);
    } catch (error: any) {
      toast.error(error.message || "En feil oppstod");
      setUploading(false);
    }

    // Reset input
    event.target.value = "";
  };

  const downloadTemplate = (type: string) => {
    let csvContent = "";
    let fileName = "";

    switch (type) {
      case "customers":
        csvContent = "firstName,lastName,phone,email,notes\n";
        csvContent += "Ola,Nordmann,12345678,ola@example.com,Stamkunde\n";
        csvContent += "Kari,Hansen,87654321,kari@example.com,\n";
        fileName = "customers_template.csv";
        break;
      case "services":
        csvContent = "name,description,price,duration\n";
        csvContent += "Herreklipp,Standard herreklipp,350,30\n";
        csvContent += "Dameklipp,Standard dameklipp,450,45\n";
        fileName = "services_template.csv";
        break;
      case "products":
        csvContent = "name,description,price,costPrice,stock,lowStockThreshold,sku,barcode\n";
        csvContent += "Shampoo,Profesjonell shampoo,150,75,50,10,SH001,1234567890123\n";
        csvContent += "Voks,Stylingvoks,120,60,30,5,WX001,9876543210987\n";
        fileName = "products_template.csv";
        break;
    }

    // Create and download file
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = fileName;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    toast.success("Mal lastet ned!");
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "completed":
        return (
          <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400">
            <CheckCircle2 className="h-4 w-4" />
            Fullført
          </span>
        );
      case "failed":
        return (
          <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400">
            <AlertCircle className="h-4 w-4" />
            Feilet
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400">
            <Clock className="h-4 w-4" />
            Pågår
          </span>
        );
    }
  };

  const getImportTypeLabel = (type: string) => {
    switch (type) {
      case "customers": return "Kunder";
      case "services": return "Tjenester";
      case "products": return "Produkter";
      case "sql_restore": return "SQL Gjenoppretting";
      default: return type;
    }
  };

  const formatFileSize = (bytes?: number | null) => {
    if (!bytes) return "Ukjent størrelse";
    const mb = bytes / (1024 * 1024);
    if (mb < 1) {
      const kb = bytes / 1024;
      return `${kb.toFixed(1)} KB`;
    }
    return `${mb.toFixed(1)} MB`;
  };

  return (
    <DashboardLayout>
      <div className="container py-8 max-w-6xl">
        <div className="mb-8">
          <h1 className="text-4xl font-bold">Importer Data</h1>
          <p className="text-muted-foreground mt-2">
            Last opp CSV/Excel-filer eller gjenopprett fra sikkerhetskopi
          </p>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="mb-8">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="customers">
              <Users className="h-4 w-4 mr-2" />
              Kunder
            </TabsTrigger>
            <TabsTrigger value="services">
              <Briefcase className="h-4 w-4 mr-2" />
              Tjenester
            </TabsTrigger>
            <TabsTrigger value="products">
              <Package className="h-4 w-4 mr-2" />
              Produkter
            </TabsTrigger>
            <TabsTrigger value="sql">
              <Database className="h-4 w-4 mr-2" />
              SQL Gjenoppretting
            </TabsTrigger>
          </TabsList>

          {/* Customers Tab */}
          <TabsContent value="customers">
            <Card>
              <CardHeader>
                <CardTitle>Importer Kunder</CardTitle>
                <CardDescription>
                  Last opp en CSV eller Excel-fil med kundedata
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex gap-4">
                  <Button
                    variant="outline"
                    onClick={() => downloadTemplate("customers")}
                  >
                    <Download className="h-4 w-4 mr-2" />
                    Last ned mal
                  </Button>

                  <label htmlFor="customers-upload">
                    <Button
                      variant="default"
                      disabled={uploading}
                      asChild
                    >
                      <span>
                        <Upload className="h-4 w-4 mr-2" />
                        {uploading ? "Laster opp..." : "Last opp fil"}
                      </span>
                    </Button>
                    <input
                      id="customers-upload"
                      type="file"
                      accept=".csv,.xlsx,.xls"
                      className="hidden"
                      onChange={(e) => handleFileUpload(e, "customers")}
                      disabled={uploading}
                    />
                  </label>
                </div>

                <div className="bg-blue-50 dark:bg-blue-900/10 border border-blue-200 dark:border-blue-900/50 rounded-lg p-4">
                  <div className="flex gap-3">
                    <AlertCircle className="h-5 w-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
                    <div className="text-sm text-blue-900 dark:text-blue-100">
                      <p className="font-semibold mb-2">Påkrevde kolonner:</p>
                      <ul className="list-disc list-inside space-y-1">
                        <li><code>firstName</code> - Fornavn (påkrevd)</li>
                        <li><code>phone</code> - Telefonnummer (påkrevd)</li>
                        <li><code>lastName</code> - Etternavn (valgfritt)</li>
                        <li><code>email</code> - E-post (valgfritt)</li>
                        <li><code>notes</code> - Notater (valgfritt)</li>
                      </ul>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Services Tab */}
          <TabsContent value="services">
            <Card>
              <CardHeader>
                <CardTitle>Importer Tjenester</CardTitle>
                <CardDescription>
                  Last opp en CSV eller Excel-fil med tjenestedata
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex gap-4">
                  <Button
                    variant="outline"
                    onClick={() => downloadTemplate("services")}
                  >
                    <Download className="h-4 w-4 mr-2" />
                    Last ned mal
                  </Button>

                  <label htmlFor="services-upload">
                    <Button
                      variant="default"
                      disabled={uploading}
                      asChild
                    >
                      <span>
                        <Upload className="h-4 w-4 mr-2" />
                        {uploading ? "Laster opp..." : "Last opp fil"}
                      </span>
                    </Button>
                    <input
                      id="services-upload"
                      type="file"
                      accept=".csv,.xlsx,.xls"
                      className="hidden"
                      onChange={(e) => handleFileUpload(e, "services")}
                      disabled={uploading}
                    />
                  </label>
                </div>

                <div className="bg-blue-50 dark:bg-blue-900/10 border border-blue-200 dark:border-blue-900/50 rounded-lg p-4">
                  <div className="flex gap-3">
                    <AlertCircle className="h-5 w-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
                    <div className="text-sm text-blue-900 dark:text-blue-100">
                      <p className="font-semibold mb-2">Påkrevde kolonner:</p>
                      <ul className="list-disc list-inside space-y-1">
                        <li><code>name</code> - Tjenestenavn (påkrevd)</li>
                        <li><code>price</code> - Pris i NOK (påkrevd)</li>
                        <li><code>duration</code> - Varighet i minutter (påkrevd)</li>
                        <li><code>description</code> - Beskrivelse (valgfritt)</li>
                      </ul>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Products Tab */}
          <TabsContent value="products">
            <Card>
              <CardHeader>
                <CardTitle>Importer Produkter</CardTitle>
                <CardDescription>
                  Last opp en CSV eller Excel-fil med produktdata
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex gap-4">
                  <Button
                    variant="outline"
                    onClick={() => downloadTemplate("products")}
                  >
                    <Download className="h-4 w-4 mr-2" />
                    Last ned mal
                  </Button>

                  <label htmlFor="products-upload">
                    <Button
                      variant="default"
                      disabled={uploading}
                      asChild
                    >
                      <span>
                        <Upload className="h-4 w-4 mr-2" />
                        {uploading ? "Laster opp..." : "Last opp fil"}
                      </span>
                    </Button>
                    <input
                      id="products-upload"
                      type="file"
                      accept=".csv,.xlsx,.xls"
                      className="hidden"
                      onChange={(e) => handleFileUpload(e, "products")}
                      disabled={uploading}
                    />
                  </label>
                </div>

                <div className="bg-blue-50 dark:bg-blue-900/10 border border-blue-200 dark:border-blue-900/50 rounded-lg p-4">
                  <div className="flex gap-3">
                    <AlertCircle className="h-5 w-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
                    <div className="text-sm text-blue-900 dark:text-blue-100">
                      <p className="font-semibold mb-2">Påkrevde kolonner:</p>
                      <ul className="list-disc list-inside space-y-1">
                        <li><code>name</code> - Produktnavn (påkrevd)</li>
                        <li><code>price</code> - Salgspris i NOK (påkrevd)</li>
                        <li><code>description</code> - Beskrivelse (valgfritt)</li>
                        <li><code>costPrice</code> - Innkjøpspris (valgfritt)</li>
                        <li><code>stock</code> - Lagerbeholdning (valgfritt)</li>
                        <li><code>lowStockThreshold</code> - Lavt lager-terskel (valgfritt)</li>
                        <li><code>sku</code> - Varenummer (valgfritt)</li>
                        <li><code>barcode</code> - Strekkode (valgfritt)</li>
                      </ul>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* SQL Restore Tab */}
          <TabsContent value="sql">
            <Card>
              <CardHeader>
                <CardTitle>Gjenopprett fra Sikkerhetskopi</CardTitle>
                <CardDescription>
                  Last opp en SQL-fil for å gjenopprette databasen
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <label htmlFor="sql-upload">
                  <Button
                    variant="default"
                    disabled={uploading}
                    asChild
                  >
                    <span>
                      <Upload className="h-4 w-4 mr-2" />
                      {uploading ? "Laster opp..." : "Last opp SQL-fil"}
                    </span>
                  </Button>
                  <input
                    id="sql-upload"
                    type="file"
                    accept=".sql"
                    className="hidden"
                    onChange={(e) => handleFileUpload(e, "sql")}
                    disabled={uploading}
                  />
                </label>

                <div className="bg-red-50 dark:bg-red-900/10 border border-red-200 dark:border-red-900/50 rounded-lg p-4">
                  <div className="flex gap-3">
                    <AlertCircle className="h-5 w-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
                    <div className="text-sm text-red-900 dark:text-red-100">
                      <p className="font-semibold mb-2">ADVARSEL:</p>
                      <ul className="list-disc list-inside space-y-1">
                        <li>Dette vil utføre SQL-setninger fra sikkerhetskopien</li>
                        <li>Sørg for at SQL-filen er fra en sikker kilde</li>
                        <li>Ta en sikkerhetskopi før du gjenoppretter</li>
                        <li>Prosessen kan ikke angres</li>
                      </ul>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Import History */}
        <Card>
          <CardHeader>
            <CardTitle>Importhistorikk</CardTitle>
            <CardDescription>
              Alle dataimpor ter sortert etter dato
            </CardDescription>
          </CardHeader>
          <CardContent>
            {!imports || imports.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p className="text-lg">Ingen importer ennå</p>
                <p className="text-sm mt-2">Last opp en fil for å komme i gang</p>
              </div>
            ) : (
              <div className="space-y-3">
                {imports.map((imp: any) => (
                  <div
                    key={imp.id}
                    className="flex items-center justify-between p-4 border rounded-lg hover:bg-accent/50 transition-colors"
                  >
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <FileText className="h-5 w-5 text-muted-foreground" />
                        <span className="font-semibold">{imp.fileName}</span>
                        {getStatusBadge(imp.status)}
                        <span className="px-2 py-1 rounded text-xs bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400">
                          {getImportTypeLabel(imp.importType)}
                        </span>
                      </div>

                      <div className="text-sm text-muted-foreground space-y-1">
                        <div>
                          {format(new Date(imp.createdAt), "PPP 'kl.' HH:mm", { locale: nb })}
                        </div>
                        <div>
                          Størrelse: {formatFileSize(imp.fileSize)} | 
                          Totalt: {imp.recordsTotal} | 
                          Importert: {imp.recordsImported} | 
                          Feilet: {imp.recordsFailed}
                        </div>
                      </div>

                      {imp.status === "failed" && imp.errorMessage && (
                        <div className="text-sm mt-2 text-red-600 dark:text-red-400">
                          Feil: {imp.errorMessage}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
