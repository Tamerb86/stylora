import { useState } from "react";
import { trpc } from "@/lib/trpc";
import DashboardLayout from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { toast } from "sonner";
import { TrendingUp, TrendingDown, DollarSign, PieChart, Plus, Trash2, Calendar, FileText, Download } from "lucide-react";
import { format, subDays, startOfMonth, endOfMonth } from "date-fns";

const EXPENSE_CATEGORIES = [
  { value: "rent", label: "Husleie" },
  { value: "utilities", label: "Strøm og vann" },
  { value: "supplies", label: "Forsyninger" },
  { value: "salaries", label: "Lønninger" },
  { value: "marketing", label: "Markedsføring" },
  { value: "maintenance", label: "Vedlikehold" },
  { value: "insurance", label: "Forsikring" },
  { value: "taxes", label: "Skatter" },
  { value: "other", label: "Annet" },
];

export default function Financial() {
  return (
    <DashboardLayout>
      <FinancialContent />
    </DashboardLayout>
  );
}

function FinancialContent() {
  const today = new Date();
  const [dateRange, setDateRange] = useState({
    startDate: format(startOfMonth(today), "yyyy-MM-dd"),
    endDate: format(endOfMonth(today), "yyyy-MM-dd"),
  });

  const [newExpense, setNewExpense] = useState({
    category: "supplies" as const,
    amount: "",
    description: "",
    expenseDate: format(today, "yyyy-MM-dd"),
  });

  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);

  // Queries
  const { data: summary, refetch: refetchSummary } = trpc.financial.getSummary.useQuery(dateRange);
  const { data: expenses, refetch: refetchExpenses } = trpc.financial.listExpenses.useQuery({ ...dateRange, limit: 50 });
  const { data: expensesByCategory } = trpc.financial.getExpensesByCategory.useQuery(dateRange);

  // Mutations
  const createExpense = trpc.financial.createExpense.useMutation({
    onSuccess: () => {
      toast.success("Utgift lagt til");
      refetchSummary();
      refetchExpenses();
      setIsAddDialogOpen(false);
      setNewExpense({ category: "supplies", amount: "", description: "", expenseDate: format(today, "yyyy-MM-dd") });
    },
    onError: (error) => toast.error(`Feil: ${error.message}`),
  });

  const deleteExpense = trpc.financial.deleteExpense.useMutation({
    onSuccess: () => {
      toast.success("Utgift slettet");
      refetchSummary();
      refetchExpenses();
    },
    onError: (error) => toast.error(`Feil: ${error.message}`),
  });

  const handleAddExpense = () => {
    if (!newExpense.amount || parseFloat(newExpense.amount) <= 0) {
      toast.error("Vennligst angi et gyldig beløp");
      return;
    }
    createExpense.mutate(newExpense);
  };

  const setPresetRange = (preset: "today" | "week" | "month" | "year") => {
    const end = format(today, "yyyy-MM-dd");
    let start = end;

    switch (preset) {
      case "today":
        start = end;
        break;
      case "week":
        start = format(subDays(today, 7), "yyyy-MM-dd");
        break;
      case "month":
        start = format(startOfMonth(today), "yyyy-MM-dd");
        break;
      case "year":
        start = format(new Date(today.getFullYear(), 0, 1), "yyyy-MM-dd");
        break;
    }

    setDateRange({ startDate: start, endDate: end });
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("nb-NO", { style: "currency", currency: "NOK" }).format(amount);
  };

  // Export mutations
  const exportPDF = trpc.export.financialPDF.useMutation({
    onSuccess: (data) => {
      const blob = new Blob([data.html], { type: "text/html" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `finansiell-rapport-${dateRange.startDate}-${dateRange.endDate}.html`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success("PDF-rapport generert");
    },
    onError: (error) => toast.error(`Feil: ${error.message}`),
  });

  const exportExcel = trpc.export.financialExcel.useMutation({
    onSuccess: (data) => {
      const blob = new Blob([data.csv], { type: "text/csv" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `utgifter-${dateRange.startDate}-${dateRange.endDate}.csv`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success("Excel-fil generert");
    },
    onError: (error) => toast.error(`Feil: ${error.message}`),
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-orange-500 bg-clip-text text-transparent">Økonomi</h1>
          <p className="text-muted-foreground">Inntekter, utgifter og lønnsomhet</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => exportPDF.mutate(dateRange)} disabled={exportPDF.isPending}>
            <FileText className="mr-2 h-4 w-4" />
            {exportPDF.isPending ? "Genererer..." : "Eksporter PDF"}
          </Button>
          <Button variant="outline" onClick={() => exportExcel.mutate(dateRange)} disabled={exportExcel.isPending}>
            <Download className="mr-2 h-4 w-4" />
            {exportExcel.isPending ? "Genererer..." : "Eksporter Excel"}
          </Button>
            <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
            <DialogTrigger asChild>
              <Button className="bg-gradient-to-r from-blue-600 to-orange-500 hover:from-blue-700 hover:to-orange-600 text-white shadow-lg">
                <Plus className="mr-2 h-4 w-4" />
                Ny utgift
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Legg til utgift</DialogTitle>
              <DialogDescription>Registrer en ny utgift for salongen</DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="category">Kategori</Label>
                <Select value={newExpense.category} onValueChange={(value: any) => setNewExpense({ ...newExpense, category: value })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {EXPENSE_CATEGORIES.map((cat) => (
                      <SelectItem key={cat.value} value={cat.value}>
                        {cat.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="amount">Beløp (NOK)</Label>
                <Input
                  id="amount"
                  type="number"
                  step="0.01"
                  value={newExpense.amount}
                  onChange={(e) => setNewExpense({ ...newExpense, amount: e.target.value })}
                  placeholder="0.00"
                />
              </div>
              <div>
                <Label htmlFor="expenseDate">Dato</Label>
                <Input
                  id="expenseDate"
                  type="date"
                  value={newExpense.expenseDate}
                  onChange={(e) => setNewExpense({ ...newExpense, expenseDate: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="description">Beskrivelse (valgfritt)</Label>
                <Textarea
                  id="description"
                  value={newExpense.description}
                  onChange={(e) => setNewExpense({ ...newExpense, description: e.target.value })}
                  placeholder="Detaljer om utgiften..."
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                Avbryt
              </Button>
              <Button onClick={handleAddExpense} disabled={createExpense.isPending}>
                {createExpense.isPending ? "Lagrer..." : "Legg til"}
              </Button>
            </DialogFooter>
          </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Date Range Filter */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Tidsperiode
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-4 items-end">
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={() => setPresetRange("today")}>
                I dag
              </Button>
              <Button variant="outline" size="sm" onClick={() => setPresetRange("week")}>
                Siste 7 dager
              </Button>
              <Button variant="outline" size="sm" onClick={() => setPresetRange("month")}>
                Denne måneden
              </Button>
              <Button variant="outline" size="sm" onClick={() => setPresetRange("year")}>
                Dette året
              </Button>
            </div>
            <div className="flex gap-2 items-center">
              <div>
                <Label htmlFor="startDate" className="text-xs">
                  Fra
                </Label>
                <Input
                  id="startDate"
                  type="date"
                  value={dateRange.startDate}
                  onChange={(e) => setDateRange({ ...dateRange, startDate: e.target.value })}
                  className="w-40"
                />
              </div>
              <div>
                <Label htmlFor="endDate" className="text-xs">
                  Til
                </Label>
                <Input
                  id="endDate"
                  type="date"
                  value={dateRange.endDate}
                  onChange={(e) => setDateRange({ ...dateRange, endDate: e.target.value })}
                  className="w-40"
                />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Inntekter</CardTitle>
            <TrendingUp className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{formatCurrency(summary?.revenue || 0)}</div>
            <p className="text-xs text-muted-foreground">Fra fullførte avtaler</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Utgifter</CardTitle>
            <TrendingDown className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{formatCurrency(summary?.expenses || 0)}</div>
            <p className="text-xs text-muted-foreground">Totale utgifter</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Fortjeneste</CardTitle>
            <DollarSign className="h-4 w-4" />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${(summary?.profit || 0) >= 0 ? "text-green-600" : "text-red-600"}`}>
              {formatCurrency(summary?.profit || 0)}
            </div>
            <p className="text-xs text-muted-foreground">Netto resultat</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Margin</CardTitle>
            <PieChart className="h-4 w-4" />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${(summary?.profitMargin || 0) >= 0 ? "text-green-600" : "text-red-600"}`}>
              {(summary?.profitMargin || 0).toFixed(1)}%
            </div>
            <p className="text-xs text-muted-foreground">Fortjenestemargin</p>
          </CardContent>
        </Card>
      </div>

      {/* Expense Breakdown */}
      <Card>
        <CardHeader>
          <CardTitle>Utgifter per kategori</CardTitle>
          <CardDescription>Fordeling av utgifter i valgt periode</CardDescription>
        </CardHeader>
        <CardContent>
          {expensesByCategory && expensesByCategory.length > 0 ? (
            <div className="space-y-4">
              {expensesByCategory.map((item) => {
                const category = EXPENSE_CATEGORIES.find((c) => c.value === item.category);
                const percentage = summary?.expenses ? (parseFloat(item.total) / summary.expenses) * 100 : 0;

                return (
                  <div key={item.category} className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="font-medium">{category?.label || item.category}</span>
                      <span className="text-muted-foreground">
                        {formatCurrency(parseFloat(item.total))} ({percentage.toFixed(1)}%)
                      </span>
                    </div>
                    <div className="h-2 bg-secondary rounded-full overflow-hidden">
                      <div className="h-full bg-primary" style={{ width: `${percentage}%` }} />
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground text-center py-8">Ingen utgifter i denne perioden</p>
          )}
        </CardContent>
      </Card>

      {/* Expenses List */}
      <Card>
        <CardHeader>
          <CardTitle>Utgiftsliste</CardTitle>
          <CardDescription>Alle registrerte utgifter</CardDescription>
        </CardHeader>
        <CardContent>
          {expenses && expenses.length > 0 ? (
            <div className="space-y-2">
              {expenses.map((expense) => {
                const category = EXPENSE_CATEGORIES.find((c) => c.value === expense.category);
                return (
                  <div key={expense.id} className="flex items-center justify-between p-3 border rounded-lg hover:bg-accent">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{category?.label || expense.category}</span>
                        <span className="text-sm text-muted-foreground">
                          {expense.expenseDate ? format(new Date(expense.expenseDate), "dd.MM.yyyy") : "N/A"}
                        </span>
                      </div>
                      {expense.description && <p className="text-sm text-muted-foreground mt-1">{expense.description}</p>}
                    </div>
                    <div className="flex items-center gap-4">
                      <span className="font-semibold text-red-600">{formatCurrency(parseFloat(expense.amount))}</span>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          if (confirm("Er du sikker på at du vil slette denne utgiften?")) {
                            deleteExpense.mutate({ id: expense.id });
                          }
                        }}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground text-center py-8">Ingen utgifter å vise</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
