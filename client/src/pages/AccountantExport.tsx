import { useState } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  FileSpreadsheet,
  FileText,
  Download,
  Calendar,
  DollarSign,
  Users,
  Receipt,
  TrendingUp,
  Loader2,
  CheckCircle,
  Building2,
  Clock,
} from "lucide-react";
import { toast } from "sonner";
import { trpc } from "@/lib/trpc";

interface ExportSection {
  id: string;
  name: string;
  description: string;
  icon: React.ReactNode;
  included: boolean;
}

export default function AccountantExport() {
  const [dateFrom, setDateFrom] = useState(() => {
    const date = new Date();
    date.setMonth(date.getMonth() - 1);
    date.setDate(1);
    return date.toISOString().split("T")[0];
  });
  const [dateTo, setDateTo] = useState(() => {
    const date = new Date();
    date.setDate(0); // Last day of previous month
    return date.toISOString().split("T")[0];
  });
  const [exportFormat, setExportFormat] = useState<"excel" | "pdf">("excel");
  const [isExporting, setIsExporting] = useState(false);
  const [sections, setSections] = useState<ExportSection[]>([
    {
      id: "revenue",
      name: "Inntekter",
      description: "Alle inntekter fra tjenester og produktsalg",
      icon: <DollarSign className="h-5 w-5 text-green-500" />,
      included: true,
    },
    {
      id: "expenses",
      name: "Utgifter",
      description: "Alle registrerte utgifter med kategori",
      icon: <Receipt className="h-5 w-5 text-red-500" />,
      included: true,
    },
    {
      id: "customers",
      name: "Kundeliste",
      description: "Oversikt over alle kunder med kontaktinfo",
      icon: <Users className="h-5 w-5 text-blue-500" />,
      included: false,
    },
    {
      id: "appointments",
      name: "Timebestillinger",
      description: "Alle fullførte timebestillinger med detaljer",
      icon: <Calendar className="h-5 w-5 text-purple-500" />,
      included: true,
    },
    {
      id: "employees",
      name: "Ansattrapport",
      description: "Timer, provisjon og ytelse per ansatt",
      icon: <Building2 className="h-5 w-5 text-orange-500" />,
      included: true,
    },
    {
      id: "timesheets",
      name: "Timelister",
      description: "Arbeidstimer og fremmøte for alle ansatte",
      icon: <Clock className="h-5 w-5 text-cyan-500" />,
      included: true,
    },
    {
      id: "vat",
      name: "MVA-oversikt",
      description: "Beregnet MVA for perioden",
      icon: <TrendingUp className="h-5 w-5 text-indigo-500" />,
      included: true,
    },
  ]);

  // Fetch summary data
  const { data: financialSummary } = trpc.financial.getSummary.useQuery({
    startDate: dateFrom,
    endDate: dateTo,
  });

  const toggleSection = (id: string) => {
    setSections(prev =>
      prev.map(s => (s.id === id ? { ...s, included: !s.included } : s))
    );
  };

  const handleExport = async () => {
    const includedSections = sections.filter(s => s.included).map(s => s.id);

    if (includedSections.length === 0) {
      toast.error("Velg minst én seksjon å eksportere");
      return;
    }

    setIsExporting(true);

    try {
      // Build export URL with parameters
      const params = new URLSearchParams({
        dateFrom,
        dateTo,
        format: exportFormat,
        sections: includedSections.join(","),
      });

      const response = await fetch(`/api/reports/accountant-export?${params}`, {
        method: "GET",
        credentials: "include",
      });

      if (!response.ok) {
        throw new Error("Export failed");
      }

      // Get filename from response headers or generate one
      const contentDisposition = response.headers.get("content-disposition");
      let filename = `regnskapsrapport_${dateFrom}_${dateTo}.${exportFormat === "excel" ? "xlsx" : "pdf"}`;
      if (contentDisposition) {
        const match = contentDisposition.match(/filename="(.+)"/);
        if (match) filename = match[1];
      }

      // Download the file
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      toast.success("Rapport eksportert!");
    } catch (error) {
      console.error("Export error:", error);
      toast.error("Kunne ikke eksportere rapport. Prøv igjen.");
    } finally {
      setIsExporting(false);
    }
  };

  const setPresetPeriod = (
    preset: "last_month" | "last_quarter" | "last_year" | "ytd"
  ) => {
    const now = new Date();
    let from: Date;
    let to: Date;

    switch (preset) {
      case "last_month":
        from = new Date(now.getFullYear(), now.getMonth() - 1, 1);
        to = new Date(now.getFullYear(), now.getMonth(), 0);
        break;
      case "last_quarter":
        const currentQuarter = Math.floor(now.getMonth() / 3);
        from = new Date(now.getFullYear(), (currentQuarter - 1) * 3, 1);
        to = new Date(now.getFullYear(), currentQuarter * 3, 0);
        break;
      case "last_year":
        from = new Date(now.getFullYear() - 1, 0, 1);
        to = new Date(now.getFullYear() - 1, 11, 31);
        break;
      case "ytd":
        from = new Date(now.getFullYear(), 0, 1);
        to = now;
        break;
    }

    setDateFrom(from.toISOString().split("T")[0]);
    setDateTo(to.toISOString().split("T")[0]);
  };

  return (
    <DashboardLayout
      breadcrumbs={[
        { label: "Dashboard", href: "/dashboard" },
        { label: "Regnskap", href: "/accounting" },
        { label: "Eksport til regnskapsfører" },
      ]}
    >
      <div className="space-y-8">
        {/* Header */}
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent">
              Eksport til regnskapsfører
            </h1>
            <p className="text-muted-foreground mt-2">
              Generer rapporter for din regnskapsfører i Excel eller PDF-format
            </p>
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          {/* Left Column - Settings */}
          <div className="lg:col-span-2 space-y-6">
            {/* Period Selection */}
            <Card className="p-6 border-0 shadow-lg">
              <h3 className="font-semibold text-lg mb-4 flex items-center gap-2">
                <Calendar className="h-5 w-5 text-blue-500" />
                Velg periode
              </h3>

              <div className="flex flex-wrap gap-2 mb-4">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPresetPeriod("last_month")}
                >
                  Forrige måned
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPresetPeriod("last_quarter")}
                >
                  Forrige kvartal
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPresetPeriod("last_year")}
                >
                  Forrige år
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPresetPeriod("ytd")}
                >
                  Hittil i år
                </Button>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <Label htmlFor="dateFrom">Fra dato</Label>
                  <Input
                    id="dateFrom"
                    type="date"
                    value={dateFrom}
                    onChange={e => setDateFrom(e.target.value)}
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label htmlFor="dateTo">Til dato</Label>
                  <Input
                    id="dateTo"
                    type="date"
                    value={dateTo}
                    onChange={e => setDateTo(e.target.value)}
                    className="mt-1"
                  />
                </div>
              </div>
            </Card>

            {/* Sections Selection */}
            <Card className="p-6 border-0 shadow-lg">
              <h3 className="font-semibold text-lg mb-4">Velg innhold</h3>

              <div className="space-y-3">
                {sections.map(section => (
                  <div
                    key={section.id}
                    className={`flex items-center gap-4 p-4 rounded-lg border transition-colors cursor-pointer ${
                      section.included
                        ? "border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-950/20"
                        : "border-gray-200 hover:border-gray-300 dark:border-gray-700"
                    }`}
                    onClick={() => toggleSection(section.id)}
                  >
                    <Checkbox
                      checked={section.included}
                      onCheckedChange={() => toggleSection(section.id)}
                    />
                    <div className="flex-shrink-0">{section.icon}</div>
                    <div className="flex-1">
                      <div className="font-medium">{section.name}</div>
                      <div className="text-sm text-muted-foreground">
                        {section.description}
                      </div>
                    </div>
                    {section.included && (
                      <CheckCircle className="h-5 w-5 text-green-500" />
                    )}
                  </div>
                ))}
              </div>
            </Card>

            {/* Export Format */}
            <Card className="p-6 border-0 shadow-lg">
              <h3 className="font-semibold text-lg mb-4">Eksportformat</h3>

              <div className="grid gap-4 md:grid-cols-2">
                <div
                  className={`flex items-center gap-4 p-4 rounded-lg border-2 cursor-pointer transition-colors ${
                    exportFormat === "excel"
                      ? "border-green-500 bg-green-50 dark:bg-green-950/20"
                      : "border-gray-200 hover:border-gray-300 dark:border-gray-700"
                  }`}
                  onClick={() => setExportFormat("excel")}
                >
                  <FileSpreadsheet className="h-8 w-8 text-green-600" />
                  <div>
                    <div className="font-medium">Excel (.xlsx)</div>
                    <div className="text-sm text-muted-foreground">
                      Redigerbart regneark
                    </div>
                  </div>
                </div>
                <div
                  className={`flex items-center gap-4 p-4 rounded-lg border-2 cursor-pointer transition-colors ${
                    exportFormat === "pdf"
                      ? "border-red-500 bg-red-50 dark:bg-red-950/20"
                      : "border-gray-200 hover:border-gray-300 dark:border-gray-700"
                  }`}
                  onClick={() => setExportFormat("pdf")}
                >
                  <FileText className="h-8 w-8 text-red-600" />
                  <div>
                    <div className="font-medium">PDF</div>
                    <div className="text-sm text-muted-foreground">
                      Ferdig formatert rapport
                    </div>
                  </div>
                </div>
              </div>
            </Card>
          </div>

          {/* Right Column - Preview & Export */}
          <div className="space-y-6">
            {/* Summary Preview */}
            <Card className="p-6 border-0 shadow-lg">
              <h3 className="font-semibold text-lg mb-4">Forhåndsvisning</h3>

              {financialSummary ? (
                <div className="space-y-4">
                  <div className="flex justify-between items-center py-2 border-b">
                    <span className="text-muted-foreground">Inntekter</span>
                    <span className="font-semibold text-green-600">
                      {Number(financialSummary.revenue || 0).toLocaleString(
                        "nb-NO"
                      )}{" "}
                      kr
                    </span>
                  </div>
                  <div className="flex justify-between items-center py-2 border-b">
                    <span className="text-muted-foreground">Utgifter</span>
                    <span className="font-semibold text-red-600">
                      {Number(financialSummary.expenses || 0).toLocaleString(
                        "nb-NO"
                      )}{" "}
                      kr
                    </span>
                  </div>
                  <div className="flex justify-between items-center py-2 border-b">
                    <span className="text-muted-foreground">Resultat</span>
                    <span
                      className={`font-semibold ${Number(financialSummary.profit || 0) >= 0 ? "text-green-600" : "text-red-600"}`}
                    >
                      {Number(financialSummary.profit || 0).toLocaleString(
                        "nb-NO"
                      )}{" "}
                      kr
                    </span>
                  </div>
                  <div className="flex justify-between items-center py-2">
                    <span className="text-muted-foreground">MVA (25%)</span>
                    <span className="font-semibold">
                      {(
                        Number(financialSummary.revenue || 0) * 0.25
                      ).toLocaleString("nb-NO")}{" "}
                      kr
                    </span>
                  </div>
                </div>
              ) : (
                <div className="text-center text-muted-foreground py-8">
                  Velg periode for å se forhåndsvisning
                </div>
              )}
            </Card>

            {/* Export Button */}
            <Card className="p-6 border-0 shadow-lg bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-950/20 dark:to-emerald-950/20">
              <div className="text-center space-y-4">
                <div className="text-sm text-muted-foreground">
                  {sections.filter(s => s.included).length} seksjoner valgt
                </div>
                <Button
                  size="lg"
                  className="w-full bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700"
                  onClick={handleExport}
                  disabled={isExporting}
                >
                  {isExporting ? (
                    <>
                      <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                      Eksporterer...
                    </>
                  ) : (
                    <>
                      <Download className="h-5 w-5 mr-2" />
                      Last ned {exportFormat === "excel" ? "Excel" : "PDF"}
                    </>
                  )}
                </Button>
                <p className="text-xs text-muted-foreground">
                  Rapporten inneholder data fra {dateFrom} til {dateTo}
                </p>
              </div>
            </Card>

            {/* Tips */}
            <Card className="p-6 border-0 shadow-lg">
              <h3 className="font-semibold text-lg mb-3">Tips</h3>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li className="flex items-start gap-2">
                  <CheckCircle className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                  Excel-format er best for videre bearbeiding
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                  PDF er ideelt for arkivering og deling
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                  Eksporter månedlig for enkel bokføring
                </li>
              </ul>
            </Card>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
