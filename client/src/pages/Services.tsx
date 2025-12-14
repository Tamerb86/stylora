import { useState } from "react";
import { trpc } from "@/lib/trpc";
import DashboardLayout from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Plus, Scissors, Clock, CalendarPlus, ShoppingCart } from "lucide-react";
import { toast } from "sonner";

export default function Services() {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    durationMinutes: "30",
    price: "",
  });

  const { data: services, isLoading, refetch } = trpc.services.list.useQuery();
  const createService = trpc.services.create.useMutation({
    onSuccess: () => {
      toast.success("Tjeneste opprettet!");
      setIsDialogOpen(false);
      refetch();
      setFormData({
        name: "",
        description: "",
        durationMinutes: "30",
        price: "",
      });
    },
    onError: (error) => {
      toast.error(`Feil: ${error.message}`);
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createService.mutate({
      ...formData,
      durationMinutes: parseInt(formData.durationMinutes),
    });
  };

  return (
    <DashboardLayout>
      <div className="p-8 space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-orange-500 bg-clip-text text-transparent">Tjenester</h1>
            <p className="text-muted-foreground">Administrer behandlinger og priser</p>
          </div>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button className="bg-gradient-to-r from-blue-600 to-orange-500 hover:from-blue-700 hover:to-orange-600 text-white shadow-lg">
                <Plus className="mr-2 h-4 w-4" />
                Ny tjeneste
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Opprett ny tjeneste</DialogTitle>
                <DialogDescription>
                  Legg til en ny behandling i systemet
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Navn *</Label>
                  <Input
                    id="name"
                    required
                    placeholder="F.eks. Herreklipp"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">Beskrivelse</Label>
                  <Textarea
                    id="description"
                    placeholder="Kort beskrivelse av tjenesten"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    rows={3}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="duration">Varighet (minutter) *</Label>
                    <Input
                      id="duration"
                      type="number"
                      required
                      min="5"
                      step="5"
                      value={formData.durationMinutes}
                      onChange={(e) => setFormData({ ...formData, durationMinutes: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="price">Pris (NOK) *</Label>
                    <Input
                      id="price"
                      type="number"
                      required
                      min="0"
                      step="0.01"
                      placeholder="299.00"
                      value={formData.price}
                      onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                    />
                  </div>
                </div>

                <DialogFooter>
                  <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                    Avbryt
                  </Button>
                  <Button type="submit" disabled={createService.isPending}>
                    {createService.isPending ? "Oppretter..." : "Opprett tjeneste"}
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {isLoading ? (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-40 bg-muted animate-pulse rounded-lg"></div>
            ))}
          </div>
        ) : services && services.length > 0 ? (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {services.map((service) => (
              <Card key={service.id} className="hover:shadow-md transition-shadow">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-2">
                      <Scissors className="h-5 w-5 text-primary" />
                      <CardTitle className="text-lg">{service.name}</CardTitle>
                    </div>
                    <div className="text-right">
                      <div className="text-2xl font-bold text-primary">
                        {service.price} NOK
                      </div>
                    </div>
                  </div>
                  {service.description && (
                    <CardDescription className="mt-2">{service.description}</CardDescription>
                  )}
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Clock className="h-4 w-4" />
                    {service.durationMinutes} minutter
                  </div>
                  <div className="flex gap-2 pt-2 border-t">
                    <Button
                      size="sm"
                      variant="outline"
                      className="flex-1"
                      onClick={() => window.location.href = "/appointments"}
                    >
                      <CalendarPlus className="h-3 w-3 mr-1" />
                      Book
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      className="flex-1"
                      onClick={() => window.location.href = "/pos"}
                    >
                      <ShoppingCart className="h-3 w-3 mr-1" />
                      Kasse
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <Scissors className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">Ingen tjenester ennå</h3>
              <p className="text-muted-foreground mb-6 text-center max-w-md">
                Legg til tjenester som du tilbyr (klipp, farge, styling, etc.) for å kunne booke avtaler og selge i kassen.
              </p>
              <div className="flex gap-3">
                <Button onClick={() => setIsDialogOpen(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Opprett første tjeneste
                </Button>
                <Button variant="outline" onClick={() => window.location.href = "/appointments"}>
                  <CalendarPlus className="h-4 w-4 mr-2" />
                  Se kalender
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </DashboardLayout>
  );
}
