import { useState } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Checkbox } from "@/components/ui/checkbox";
import { CalendarIcon, Plus, Trash2, CalendarDays } from "lucide-react";
import { format } from "date-fns";
import { nb } from "date-fns/locale";
import { toast } from "sonner";

export default function SalonHolidays() {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [name, setName] = useState("");
  const [date, setDate] = useState<Date>();
  const [isRecurring, setIsRecurring] = useState(false);
  const [description, setDescription] = useState("");

  const { data: holidays, refetch } = trpc.holidays.list.useQuery();
  const createHoliday = trpc.holidays.create.useMutation({
    onSuccess: () => {
      toast.success("Helligdag lagt til!");
      setIsDialogOpen(false);
      refetch();
      // Reset form
      setName("");
      setDate(undefined);
      setIsRecurring(false);
      setDescription("");
    },
    onError: (error) => {
      toast.error(error.message || "Kunne ikke legge til helligdag");
    },
  });

  const deleteHoliday = trpc.holidays.delete.useMutation({
    onSuccess: () => {
      toast.success("Helligdag slettet");
      refetch();
    },
    onError: (error) => {
      toast.error(error.message || "Kunne ikke slette helligdag");
    },
  });

  const handleSubmit = () => {
    if (!name.trim()) {
      toast.error("Oppgi navn på helligdagen");
      return;
    }
    if (!date) {
      toast.error("Velg dato");
      return;
    }

    createHoliday.mutate({
      name,
      date,
      isRecurring,
      description: description || undefined,
    });
  };

  const handleDelete = (id: number, holidayName: string) => {
    if (confirm(`Er du sikker på at du vil slette "${holidayName}"?`)) {
      deleteHoliday.mutate({ id });
    }
  };

  // Group holidays by year
  const groupedHolidays = holidays?.reduce((acc: any, holiday: any) => {
    const year = new Date(holiday.date).getFullYear();
    if (!acc[year]) acc[year] = [];
    acc[year].push(holiday);
    return acc;
  }, {}) || {};

  const sortedYears = Object.keys(groupedHolidays).sort((a, b) => Number(b) - Number(a));

  return (
    <DashboardLayout>
    <div className="container py-8 max-w-6xl">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-4xl font-bold">Helligdager</h1>
          <p className="text-muted-foreground mt-2">
            Administrer salonghelligdager og stengetider
          </p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button size="lg" className="h-14 gap-2">
              <Plus className="h-5 w-5" />
              Ny Helligdag
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>Legg til Helligdag</DialogTitle>
              <DialogDescription>
                Definer en helligdag hvor salongen er stengt
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-6 py-4">
              <div className="space-y-2">
                <Label>Navn *</Label>
                <Input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="f.eks. 1. nyttårsdag, Påskedag"
                  className="h-12"
                />
              </div>

              <div className="space-y-2">
                <Label>Dato *</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className="w-full h-12 justify-start text-left font-normal">
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {date ? format(date, "PPP", { locale: nb }) : "Velg dato"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar
                      mode="single"
                      selected={date}
                      onSelect={setDate}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="recurring"
                  checked={isRecurring}
                  onCheckedChange={(checked) => setIsRecurring(checked as boolean)}
                />
                <Label htmlFor="recurring" className="cursor-pointer">
                  Gjentas hvert år (samme dato)
                </Label>
              </div>

              <div className="space-y-2">
                <Label>Beskrivelse (valgfritt)</Label>
                <Textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Tilleggsinformasjon om helligdagen..."
                  rows={3}
                />
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                Avbryt
              </Button>
              <Button onClick={handleSubmit} disabled={createHoliday.isPending}>
                {createHoliday.isPending ? "Legger til..." : "Legg til Helligdag"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Holidays List */}
      {!holidays || holidays.length === 0 ? (
        <Card>
          <CardContent className="py-12">
            <div className="text-center text-muted-foreground">
              <CalendarDays className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p className="text-lg">Ingen helligdager definert</p>
              <p className="text-sm mt-2">Klikk "Ny Helligdag" for å legge til stengetider</p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          {sortedYears.map((year) => (
            <Card key={year}>
              <CardHeader>
                <CardTitle>{year}</CardTitle>
                <CardDescription>
                  {groupedHolidays[year].length} helligdag{groupedHolidays[year].length !== 1 ? "er" : ""}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {groupedHolidays[year]
                    .sort((a: any, b: any) => new Date(a.date).getTime() - new Date(b.date).getTime())
                    .map((holiday: any) => (
                      <div
                        key={holiday.id}
                        className="flex items-center justify-between p-4 border rounded-lg hover:bg-accent/50 transition-colors"
                      >
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-1">
                            <span className="font-semibold text-lg">{holiday.name}</span>
                            {holiday.isRecurring && (
                              <span className="px-2 py-1 rounded text-xs bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400">
                                Gjentas årlig
                              </span>
                            )}
                          </div>
                          <div className="text-sm text-muted-foreground">
                            {format(new Date(holiday.date), "EEEE, d. MMMM yyyy", { locale: nb })}
                          </div>
                          {holiday.description && (
                            <div className="text-sm mt-2 text-muted-foreground">
                              {holiday.description}
                            </div>
                          )}
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-10 w-10 text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20"
                          onClick={() => handleDelete(holiday.id, holiday.name)}
                          disabled={deleteHoliday.isPending}
                        >
                          <Trash2 className="h-5 w-5" />
                        </Button>
                      </div>
                    ))}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Common Norwegian Holidays Suggestion */}
      {(!holidays || holidays.length === 0) && (
        <Card className="mt-6 border-blue-200 dark:border-blue-900/50 bg-blue-50 dark:bg-blue-900/10">
          <CardHeader>
            <CardTitle className="text-blue-900 dark:text-blue-100">Forslag til helligdager</CardTitle>
            <CardDescription className="text-blue-700 dark:text-blue-300">
              Vanlige norske helligdager du kan legge til
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-2 text-sm text-blue-800 dark:text-blue-200">
              <div>• 1. nyttårsdag (1. januar)</div>
              <div>• Skjærtorsdag, Langfredag, 1. og 2. påskedag</div>
              <div>• 1. mai (Arbeidernes dag)</div>
              <div>• 17. mai (Grunnlovsdag)</div>
              <div>• Kristi himmelfartsdag</div>
              <div>• 1. og 2. pinsedag</div>
              <div>• 1. og 2. juledag (25. og 26. desember)</div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
    </DashboardLayout>
  );
}
