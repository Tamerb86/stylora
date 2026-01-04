import { useState } from "react";
import { trpc } from "@/lib/trpc";
import DashboardLayout from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Plus,
  Scissors,
  Clock,
  Pencil,
  Trash2,
  DollarSign,
  TrendingUp,
} from "lucide-react";
import { toast } from "sonner";
import { safeToFixed } from "@/lib/utils";
import { useTranslation } from "react-i18next";

type Service = {
  id: number;
  name: string;
  description: string | null;
  durationMinutes: number;
  price: string;
};

export default function Services() {
  const { t } = useTranslation();
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedService, setSelectedService] = useState<Service | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    durationMinutes: "30",
    price: "",
  });

  const { data: services, isLoading, refetch } = trpc.services.list.useQuery();

  const createService = trpc.services.create.useMutation({
    onSuccess: () => {
      toast.success(t("toasts.success.serviceCreated"));
      setIsCreateDialogOpen(false);
      refetch();
      resetForm();
    },
    onError: error => {
      toast.error(t("toasts.error.generic", { message: error.message }));
    },
  });

  const updateService = trpc.services.update.useMutation({
    onSuccess: () => {
      toast.success(t("toasts.success.serviceUpdated"));
      setIsEditDialogOpen(false);
      refetch();
      setSelectedService(null);
    },
    onError: error => {
      toast.error(t("toasts.error.generic", { message: error.message }));
    },
  });

  const deleteService = trpc.services.delete.useMutation({
    onSuccess: () => {
      toast.success(t("toasts.success.serviceDeleted"));
      setIsDeleteDialogOpen(false);
      refetch();
      setSelectedService(null);
    },
    onError: error => {
      toast.error(t("toasts.error.generic", { message: error.message }));
    },
  });

  const resetForm = () => {
    setFormData({
      name: "",
      description: "",
      durationMinutes: "30",
      price: "",
    });
  };

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    createService.mutate({
      ...formData,
      durationMinutes: parseInt(formData.durationMinutes),
    });
  };

  const handleEdit = (service: Service) => {
    setSelectedService(service);
    setFormData({
      name: service.name,
      description: service.description || "",
      durationMinutes: service.durationMinutes.toString(),
      price: service.price,
    });
    setIsEditDialogOpen(true);
  };

  const handleUpdate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedService) return;

    updateService.mutate({
      id: selectedService.id,
      name: formData.name,
      description: formData.description,
      durationMinutes: parseInt(formData.durationMinutes),
      price: formData.price,
    });
  };

  const handleDelete = (service: Service) => {
    setSelectedService(service);
    setIsDeleteDialogOpen(true);
  };

  const confirmDelete = () => {
    if (!selectedService) return;
    deleteService.mutate({ id: selectedService.id });
  };

  // Calculate stats
  const totalServices = services?.length || 0;
  const avgPrice = services?.length
    ? services.reduce((sum, s) => sum + parseFloat(s.price), 0) /
      services.length
    : 0;
  const avgDuration = services?.length
    ? services.reduce((sum, s) => sum + s.durationMinutes, 0) / services.length
    : 0;
  const totalRevenuePotential =
    services?.reduce((sum, s) => sum + parseFloat(s.price), 0) || 0;

  return (
    <DashboardLayout
      breadcrumbs={[
        { label: t("nav.dashboard"), href: "/dashboard" },
        { label: t("services.title") },
      ]}
    >
      {/* Background gradient */}
      <div className="fixed inset-0 -z-10 bg-gradient-to-br from-purple-50 via-pink-50 to-orange-50 dark:from-gray-900 dark:via-purple-900/20 dark:to-gray-900"></div>

      <div className="p-8 space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center animate-fade-in">
          <div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-purple-600 via-pink-600 to-orange-500 bg-clip-text text-transparent">
              {t("services.title")}
            </h1>
            <p className="text-muted-foreground mt-1">
              {t("services.subtitle")}
            </p>
          </div>

          {/* Create Dialog */}
          <Dialog
            open={isCreateDialogOpen}
            onOpenChange={setIsCreateDialogOpen}
          >
            <DialogTrigger asChild>
              <Button className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105">
                <Plus className="mr-2 h-4 w-4" />
                {t("services.newService")}
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>{t("services.dialog.createTitle")}</DialogTitle>
                <DialogDescription>
                  {t("services.dialog.createDescription")}
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleCreate} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="create-name">{t("services.dialog.name")} *</Label>
                  <Input
                    id="create-name"
                    required
                    placeholder={t("services.dialog.namePlaceholder")}
                    value={formData.name}
                    onChange={e =>
                      setFormData({ ...formData, name: e.target.value })
                    }
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="create-description">{t("services.dialog.description")}</Label>
                  <Textarea
                    id="create-description"
                    placeholder={t("services.dialog.descriptionPlaceholder")}
                    value={formData.description}
                    onChange={e =>
                      setFormData({ ...formData, description: e.target.value })
                    }
                    rows={3}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="create-duration">
                      {t("services.dialog.duration")} *
                    </Label>
                    <Input
                      id="create-duration"
                      type="number"
                      required
                      min="5"
                      step="5"
                      value={formData.durationMinutes}
                      onChange={e =>
                        setFormData({
                          ...formData,
                          durationMinutes: e.target.value,
                        })
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="create-price">{t("services.dialog.price")} *</Label>
                    <Input
                      id="create-price"
                      type="number"
                      required
                      min="0"
                      step="0.01"
                      placeholder={t("services.dialog.pricePlaceholder")}
                      value={formData.price}
                      onChange={e =>
                        setFormData({ ...formData, price: e.target.value })
                      }
                    />
                  </div>
                </div>

                <DialogFooter>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setIsCreateDialogOpen(false)}
                  >
                    {t("services.dialog.cancel")}
                  </Button>
                  <Button type="submit" disabled={createService.isPending}>
                    {createService.isPending
                      ? t("services.dialog.creating")
                      : t("services.dialog.createButton")}
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {/* Stats Cards */}
        <div
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 animate-fade-in"
          style={{ animationDelay: "0.1s" }}
        >
          <Card className="relative overflow-hidden border-none shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105">
            <div className="absolute inset-0 bg-gradient-to-br from-purple-500 to-purple-600 opacity-90"></div>
            <CardHeader className="relative pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-medium text-white/90">
                  {t("services.totalServices")}
                </CardTitle>
                <div className="p-2 bg-white/20 backdrop-blur-sm rounded-lg">
                  <Scissors className="h-4 w-4 text-white" />
                </div>
              </div>
            </CardHeader>
            <CardContent className="relative">
              <div className="text-3xl font-bold text-white">
                {totalServices}
              </div>
              <p className="text-xs text-white/80 mt-1">{t("services.activeServices")}</p>
            </CardContent>
          </Card>

          <Card className="relative overflow-hidden border-none shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105">
            <div className="absolute inset-0 bg-gradient-to-br from-pink-500 to-pink-600 opacity-90"></div>
            <CardHeader className="relative pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-medium text-white/90">
                  {t("services.avgPrice")}
                </CardTitle>
                <div className="p-2 bg-white/20 backdrop-blur-sm rounded-lg">
                  <DollarSign className="h-4 w-4 text-white" />
                </div>
              </div>
            </CardHeader>
            <CardContent className="relative">
              <div className="text-3xl font-bold text-white">
                {safeToFixed(avgPrice, 0)} kr
              </div>
              <p className="text-xs text-white/80 mt-1">{t("services.perService")}</p>
            </CardContent>
          </Card>

          <Card className="relative overflow-hidden border-none shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105">
            <div className="absolute inset-0 bg-gradient-to-br from-orange-500 to-orange-600 opacity-90"></div>
            <CardHeader className="relative pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-medium text-white/90">
                  {t("services.avgDuration")}
                </CardTitle>
                <div className="p-2 bg-white/20 backdrop-blur-sm rounded-lg">
                  <Clock className="h-4 w-4 text-white" />
                </div>
              </div>
            </CardHeader>
            <CardContent className="relative">
              <div className="text-3xl font-bold text-white">
                {safeToFixed(avgDuration, 0)} {t("services.minutes")}
              </div>
              <p className="text-xs text-white/80 mt-1">{t("services.averageTime")}</p>
            </CardContent>
          </Card>

          <Card className="relative overflow-hidden border-none shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105">
            <div className="absolute inset-0 bg-gradient-to-br from-emerald-500 to-emerald-600 opacity-90"></div>
            <CardHeader className="relative pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-medium text-white/90">
                  {t("services.revenuePotential")}
                </CardTitle>
                <div className="p-2 bg-white/20 backdrop-blur-sm rounded-lg">
                  <TrendingUp className="h-4 w-4 text-white" />
                </div>
              </div>
            </CardHeader>
            <CardContent className="relative">
              <div className="text-3xl font-bold text-white">
                {safeToFixed(totalRevenuePotential, 0)} kr
              </div>
              <p className="text-xs text-white/80 mt-1">{t("services.sumAllServices")}</p>
            </CardContent>
          </Card>
        </div>

        {/* Edit Dialog */}
        <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{t("services.dialog.editTitle")}</DialogTitle>
              <DialogDescription>
                {t("services.dialog.editDescription")}
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleUpdate} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="edit-name">{t("services.dialog.name")} *</Label>
                <Input
                  id="edit-name"
                  required
                  placeholder={t("services.dialog.namePlaceholder")}
                  value={formData.name}
                  onChange={e =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="edit-description">{t("services.dialog.description")}</Label>
                <Textarea
                  id="edit-description"
                  placeholder={t("services.dialog.descriptionPlaceholder")}
                  value={formData.description}
                  onChange={e =>
                    setFormData({ ...formData, description: e.target.value })
                  }
                  rows={3}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="edit-duration">{t("services.dialog.duration")} *</Label>
                  <Input
                    id="edit-duration"
                    type="number"
                    required
                    min="5"
                    step="5"
                    value={formData.durationMinutes}
                    onChange={e =>
                      setFormData({
                        ...formData,
                        durationMinutes: e.target.value,
                      })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-price">{t("services.dialog.price")} *</Label>
                  <Input
                    id="edit-price"
                    type="number"
                    required
                    min="0"
                    step="0.01"
                    placeholder={t("services.dialog.pricePlaceholder")}
                    value={formData.price}
                    onChange={e =>
                      setFormData({ ...formData, price: e.target.value })
                    }
                  />
                </div>
              </div>

              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsEditDialogOpen(false)}
                >
                  {t("services.dialog.cancel")}
                </Button>
                <Button type="submit" disabled={updateService.isPending}>
                  {updateService.isPending ? t("services.dialog.updating") : t("services.dialog.updateButton")}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>

        {/* Delete Confirmation Dialog */}
        <AlertDialog
          open={isDeleteDialogOpen}
          onOpenChange={setIsDeleteDialogOpen}
        >
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>{t("services.deleteDialog.title")}</AlertDialogTitle>
              <AlertDialogDescription>
                {t("services.deleteDialog.message", { name: selectedService?.name })}
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>{t("services.deleteDialog.cancelButton")}</AlertDialogCancel>
              <AlertDialogAction
                onClick={confirmDelete}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              >
                {deleteService.isPending ? t("services.deleting") : t("services.deleteDialog.confirmButton")}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        {/* Services Grid */}
        {isLoading ? (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3].map(i => (
              <div
                key={i}
                className="h-48 bg-gradient-to-r from-gray-100 to-gray-200 animate-pulse rounded-lg"
              ></div>
            ))}
          </div>
        ) : services && services.length > 0 ? (
          <div
            className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 animate-fade-in"
            style={{ animationDelay: "0.2s" }}
          >
            {services.map((service, index) => (
              <Card
                key={service.id}
                className="hover:shadow-xl transition-all duration-300 hover:scale-105 border-none bg-white/80 backdrop-blur-sm animate-slide-in"
                style={{ animationDelay: `${0.05 * index}s` }}
              >
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-2">
                      <div className="p-2 bg-gradient-to-br from-purple-100 to-pink-100 rounded-lg">
                        <Scissors className="h-5 w-5 text-purple-600" />
                      </div>
                      <CardTitle className="text-lg bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                        {service.name}
                      </CardTitle>
                    </div>
                  </div>
                  {service.description && (
                    <CardDescription className="mt-2">
                      {service.description}
                    </CardDescription>
                  )}
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Clock className="h-4 w-4" />
                      {service.durationMinutes} {t("services.minutes")}
                    </div>
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-gradient-to-r from-emerald-100 to-green-100">
                      <span className="text-lg font-bold text-emerald-700">
                        {service.price} kr
                      </span>
                    </div>
                  </div>
                  <div className="flex gap-2 pt-2 border-t">
                    <Button
                      size="sm"
                      variant="outline"
                      className="flex-1 hover:bg-gradient-to-r hover:from-purple-50 hover:to-pink-50 transition-all duration-300"
                      onClick={() => handleEdit(service)}
                    >
                      <Pencil className="h-3 w-3 mr-1" />
                      {t("services.edit")}
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      className="flex-1 text-destructive hover:bg-destructive hover:text-destructive-foreground transition-all duration-300"
                      onClick={() => handleDelete(service)}
                    >
                      <Trash2 className="h-3 w-3 mr-1" />
                      {t("services.delete")}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <Card className="border-none bg-white/80 backdrop-blur-sm shadow-lg">
            <CardContent className="flex flex-col items-center justify-center py-12">
              <div className="p-4 bg-gradient-to-br from-purple-100 to-pink-100 rounded-full mb-4">
                <Scissors className="h-12 w-12 text-purple-600" />
              </div>
              <h3 className="text-lg font-semibold mb-2">
                {t("services.noServices")}
              </h3>
              <p className="text-muted-foreground mb-6 text-center max-w-md">
                {t("services.addServicesDescription")}
              </p>
              <Button
                onClick={() => setIsCreateDialogOpen(true)}
                className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white"
              >
                <Plus className="h-4 w-4 mr-2" />
                {t("services.createFirstService")}
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </DashboardLayout>
  );
}
