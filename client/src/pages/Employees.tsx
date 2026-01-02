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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Plus,
  UserCog,
  Mail,
  Phone,
  Edit,
  Lock,
  Unlock,
  Key,
  Users,
  Award,
  TrendingUp,
} from "lucide-react";
import { toast } from "sonner";
import { safeToFixed } from "@/lib/utils";

export default function Employees() {
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState<any>(null);

  const [createFormData, setCreateFormData] = useState({
    name: "",
    email: "",
    phone: "",
    role: "employee" as "admin" | "employee",
    commissionType: "percentage" as "percentage" | "fixed" | "tiered",
    commissionRate: "40",
  });

  const [editFormData, setEditFormData] = useState({
    name: "",
    email: "",
    phone: "",
    pin: "",
    commissionType: "percentage" as "percentage" | "fixed" | "tiered",
    commissionRate: "",
  });

  const {
    data: employees,
    isLoading,
    refetch,
  } = trpc.employees.list.useQuery();

  const createEmployee = trpc.employees.create.useMutation({
    onSuccess: () => {
      toast.success("Ansatt opprettet!");
      setIsCreateDialogOpen(false);
      refetch();
      setCreateFormData({
        name: "",
        email: "",
        phone: "",
        role: "employee",
        commissionType: "percentage",
        commissionRate: "40",
      });
    },
    onError: error => {
      toast.error(`Feil: ${error.message}`);
    },
  });

  const updateEmployee = trpc.employees.update.useMutation({
    onSuccess: () => {
      toast.success("Ansatt oppdatert!");
      setIsEditDialogOpen(false);
      setSelectedEmployee(null);
      refetch();
    },
    onError: error => {
      toast.error(`Feil: ${error.message}`);
    },
  });

  const deactivateEmployee = trpc.employees.deactivate.useMutation({
    onSuccess: () => {
      toast.success("Ansatt deaktivert!");
      refetch();
    },
    onError: error => {
      toast.error(`Feil: ${error.message}`);
    },
  });

  const activateEmployee = trpc.employees.activate.useMutation({
    onSuccess: () => {
      toast.success("Ansatt aktivert!");
      refetch();
    },
    onError: error => {
      toast.error(`Feil: ${error.message}`);
    },
  });

  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createEmployee.mutate(createFormData);
  };

  const handleEditSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedEmployee) return;

    updateEmployee.mutate({
      id: selectedEmployee.id,
      name: editFormData.name,
      email: editFormData.email,
      phone: editFormData.phone,
      pin: editFormData.pin || undefined,
      commissionType: editFormData.commissionType,
      commissionRate: editFormData.commissionRate,
    });
  };

  const openEditDialog = (employee: any) => {
    setSelectedEmployee(employee);
    setEditFormData({
      name: employee.name,
      email: employee.email || "",
      phone: employee.phone || "",
      pin: employee.pin || "",
      commissionType: (employee.commissionType as any) || "percentage",
      commissionRate: employee.commissionRate || "",
    });
    setIsEditDialogOpen(true);
  };

  const handleToggleActive = (employee: any) => {
    if (employee.isActive) {
      if (confirm(`Er du sikker på at du vil deaktivere ${employee.name}?`)) {
        deactivateEmployee.mutate({ id: employee.id });
      }
    } else {
      activateEmployee.mutate({ id: employee.id });
    }
  };

  // Calculate stats
  const totalEmployees = employees?.length || 0;
  const activeEmployees = employees?.filter(e => e.isActive).length || 0;
  const avgCommission = employees?.length
    ? employees.reduce(
        (sum, e) => sum + parseFloat(e.commissionRate || "0"),
        0
      ) / employees.length
    : 0;
  const employeesWithPin = employees?.filter(e => e.pin).length || 0;

  return (
    <DashboardLayout
      breadcrumbs={[
        { label: "Dashboard", href: "/dashboard" },
        { label: "Ansatte" },
      ]}
    >
      {/* Background gradient */}
      <div className="fixed inset-0 -z-10 bg-gradient-to-br from-indigo-50 via-blue-50 to-cyan-50 dark:from-gray-900 dark:via-blue-900/20 dark:to-gray-900"></div>

      <div className="p-8 space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center animate-fade-in">
          <div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-indigo-600 via-blue-600 to-cyan-500 bg-clip-text text-transparent">
              Ansatte
            </h1>
            <p className="text-muted-foreground mt-1">
              Administrer behandlere og personale
            </p>
          </div>

          {/* Create Dialog */}
          <Dialog
            open={isCreateDialogOpen}
            onOpenChange={setIsCreateDialogOpen}
          >
            <DialogTrigger asChild>
              <Button className="bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-700 hover:to-blue-700 text-white shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105">
                <Plus className="mr-2 h-4 w-4" />
                Ny ansatt
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Opprett ny ansatt</DialogTitle>
                <DialogDescription>
                  Legg til en ny behandler eller administrator
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleCreateSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="create-name">Navn *</Label>
                  <Input
                    id="create-name"
                    required
                    value={createFormData.name}
                    onChange={e =>
                      setCreateFormData({
                        ...createFormData,
                        name: e.target.value,
                      })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="create-email">E-post</Label>
                  <Input
                    id="create-email"
                    type="email"
                    value={createFormData.email}
                    onChange={e =>
                      setCreateFormData({
                        ...createFormData,
                        email: e.target.value,
                      })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="create-phone">Telefon</Label>
                  <Input
                    id="create-phone"
                    value={createFormData.phone}
                    onChange={e =>
                      setCreateFormData({
                        ...createFormData,
                        phone: e.target.value,
                      })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="create-role">Rolle</Label>
                  <Select
                    value={createFormData.role}
                    onValueChange={(value: any) =>
                      setCreateFormData({ ...createFormData, role: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="employee">Behandler</SelectItem>
                      <SelectItem value="admin">Administrator</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="create-commissionType">
                      Provisjonstype
                    </Label>
                    <Select
                      value={createFormData.commissionType}
                      onValueChange={(value: any) =>
                        setCreateFormData({
                          ...createFormData,
                          commissionType: value,
                        })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="percentage">Prosent</SelectItem>
                        <SelectItem value="fixed">Fast beløp</SelectItem>
                        <SelectItem value="tiered">Trinnvis</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="create-commissionRate">
                      Provisjonssats
                    </Label>
                    <Input
                      id="create-commissionRate"
                      type="number"
                      step="0.01"
                      value={createFormData.commissionRate}
                      onChange={e =>
                        setCreateFormData({
                          ...createFormData,
                          commissionRate: e.target.value,
                        })
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
                    Avbryt
                  </Button>
                  <Button type="submit" disabled={createEmployee.isPending}>
                    {createEmployee.isPending
                      ? "Oppretter..."
                      : "Opprett ansatt"}
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
            <div className="absolute inset-0 bg-gradient-to-br from-indigo-500 to-indigo-600 opacity-90"></div>
            <CardHeader className="relative pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-medium text-white/90">
                  Totalt ansatte
                </CardTitle>
                <div className="p-2 bg-white/20 backdrop-blur-sm rounded-lg">
                  <Users className="h-4 w-4 text-white" />
                </div>
              </div>
            </CardHeader>
            <CardContent className="relative">
              <div className="text-3xl font-bold text-white">
                {totalEmployees}
              </div>
              <p className="text-xs text-white/80 mt-1">Registrerte ansatte</p>
            </CardContent>
          </Card>

          <Card className="relative overflow-hidden border-none shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105">
            <div className="absolute inset-0 bg-gradient-to-br from-blue-500 to-blue-600 opacity-90"></div>
            <CardHeader className="relative pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-medium text-white/90">
                  Aktive ansatte
                </CardTitle>
                <div className="p-2 bg-white/20 backdrop-blur-sm rounded-lg">
                  <UserCog className="h-4 w-4 text-white" />
                </div>
              </div>
            </CardHeader>
            <CardContent className="relative">
              <div className="text-3xl font-bold text-white">
                {activeEmployees}
              </div>
              <p className="text-xs text-white/80 mt-1">Kan booke avtaler</p>
            </CardContent>
          </Card>

          <Card className="relative overflow-hidden border-none shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105">
            <div className="absolute inset-0 bg-gradient-to-br from-cyan-500 to-cyan-600 opacity-90"></div>
            <CardHeader className="relative pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-medium text-white/90">
                  Snitt provisjon
                </CardTitle>
                <div className="p-2 bg-white/20 backdrop-blur-sm rounded-lg">
                  <Award className="h-4 w-4 text-white" />
                </div>
              </div>
            </CardHeader>
            <CardContent className="relative">
              <div className="text-3xl font-bold text-white">
                {safeToFixed(avgCommission, 0)}%
              </div>
              <p className="text-xs text-white/80 mt-1">Gjennomsnittlig sats</p>
            </CardContent>
          </Card>

          <Card className="relative overflow-hidden border-none shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105">
            <div className="absolute inset-0 bg-gradient-to-br from-emerald-500 to-emerald-600 opacity-90"></div>
            <CardHeader className="relative pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-medium text-white/90">
                  Med PIN-kode
                </CardTitle>
                <div className="p-2 bg-white/20 backdrop-blur-sm rounded-lg">
                  <Key className="h-4 w-4 text-white" />
                </div>
              </div>
            </CardHeader>
            <CardContent className="relative">
              <div className="text-3xl font-bold text-white">
                {employeesWithPin}
              </div>
              <p className="text-xs text-white/80 mt-1">Kan stemple inn/ut</p>
            </CardContent>
          </Card>
        </div>

        {/* Edit Dialog */}
        <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Rediger ansatt</DialogTitle>
              <DialogDescription>
                Oppdater informasjon for {selectedEmployee?.name}
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleEditSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="edit-name">Navn *</Label>
                <Input
                  id="edit-name"
                  required
                  value={editFormData.name}
                  onChange={e =>
                    setEditFormData({ ...editFormData, name: e.target.value })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-email">E-post</Label>
                <Input
                  id="edit-email"
                  type="email"
                  value={editFormData.email}
                  onChange={e =>
                    setEditFormData({ ...editFormData, email: e.target.value })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-phone">Telefon</Label>
                <Input
                  id="edit-phone"
                  value={editFormData.phone}
                  onChange={e =>
                    setEditFormData({ ...editFormData, phone: e.target.value })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-pin">PIN-kode (4-6 siffer)</Label>
                <div className="flex items-center gap-2">
                  <Key className="h-4 w-4 text-muted-foreground" />
                  <Input
                    id="edit-pin"
                    type="text"
                    maxLength={6}
                    placeholder={selectedEmployee?.pin ? "••••" : "Ikke satt"}
                    value={editFormData.pin}
                    onChange={e => {
                      const value = e.target.value.replace(/\D/g, "");
                      setEditFormData({ ...editFormData, pin: value });
                    }}
                  />
                </div>
                <p className="text-xs text-muted-foreground">
                  Brukes for inn/ut-stempling på tidsuret
                </p>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="edit-commissionType">Provisjonstype</Label>
                  <Select
                    value={editFormData.commissionType}
                    onValueChange={(value: any) =>
                      setEditFormData({
                        ...editFormData,
                        commissionType: value,
                      })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="percentage">Prosent</SelectItem>
                      <SelectItem value="fixed">Fast beløp</SelectItem>
                      <SelectItem value="tiered">Trinnvis</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-commissionRate">Provisjonssats</Label>
                  <Input
                    id="edit-commissionRate"
                    type="number"
                    step="0.01"
                    value={editFormData.commissionRate}
                    onChange={e =>
                      setEditFormData({
                        ...editFormData,
                        commissionRate: e.target.value,
                      })
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
                  Avbryt
                </Button>
                <Button type="submit" disabled={updateEmployee.isPending}>
                  {updateEmployee.isPending ? "Lagrer..." : "Lagre endringer"}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>

        {/* Employees Grid */}
        {isLoading ? (
          <div className="grid gap-4 md:grid-cols-2">
            {[1, 2].map(i => (
              <div
                key={i}
                className="h-40 bg-gradient-to-r from-gray-100 to-gray-200 animate-pulse rounded-lg"
              ></div>
            ))}
          </div>
        ) : employees && employees.length > 0 ? (
          <div
            className="grid gap-4 md:grid-cols-2 animate-fade-in"
            style={{ animationDelay: "0.2s" }}
          >
            {employees.map((employee, index) => (
              <Card
                key={employee.id}
                className={`hover:shadow-xl transition-all duration-300 hover:scale-[1.02] border-none bg-white/80 backdrop-blur-sm animate-slide-in ${!employee.isActive ? "opacity-60" : ""}`}
                style={{ animationDelay: `${0.05 * index}s` }}
              >
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div
                        className={`p-3 rounded-lg ${employee.isActive ? "bg-gradient-to-br from-indigo-100 to-blue-100" : "bg-gray-100"}`}
                      >
                        <UserCog
                          className={`h-6 w-6 ${employee.isActive ? "text-indigo-600" : "text-gray-400"}`}
                        />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <CardTitle
                            className={
                              employee.isActive
                                ? "bg-gradient-to-r from-indigo-600 to-blue-600 bg-clip-text text-transparent"
                                : ""
                            }
                          >
                            {employee.name}
                          </CardTitle>
                          {!employee.isActive && (
                            <span className="text-xs bg-red-100 text-red-700 px-2 py-0.5 rounded-full">
                              Deaktivert
                            </span>
                          )}
                          {employee.pin && (
                            <div className="p-1 bg-green-100 rounded">
                              <Key className="h-3 w-3 text-green-600" />
                            </div>
                          )}
                        </div>
                        <CardDescription className="mt-1">
                          {employee.role === "owner"
                            ? "Eier"
                            : employee.role === "admin"
                              ? "Administrator"
                              : "Behandler"}
                        </CardDescription>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => openEditDialog(employee)}
                        className="hover:bg-indigo-50 transition-colors"
                      >
                        <Edit className="h-4 w-4 text-indigo-600" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleToggleActive(employee)}
                        disabled={
                          deactivateEmployee.isPending ||
                          activateEmployee.isPending
                        }
                        className={
                          employee.isActive
                            ? "hover:bg-red-50"
                            : "hover:bg-green-50"
                        }
                      >
                        {employee.isActive ? (
                          <Lock className="h-4 w-4 text-red-600" />
                        ) : (
                          <Unlock className="h-4 w-4 text-green-600" />
                        )}
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-2">
                  {employee.email && (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground bg-gray-50 p-2 rounded">
                      <Mail className="h-3 w-3" />
                      {employee.email}
                    </div>
                  )}
                  {employee.phone && (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground bg-gray-50 p-2 rounded">
                      <Phone className="h-3 w-3" />
                      {employee.phone}
                    </div>
                  )}
                  {employee.commissionRate && (
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-gradient-to-r from-cyan-100 to-blue-100">
                      <Award className="h-3 w-3 text-cyan-700" />
                      <span className="text-sm font-semibold text-cyan-700">
                        Provisjon: {employee.commissionRate}% (
                        {employee.commissionType})
                      </span>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <Card className="border-none bg-white/80 backdrop-blur-sm shadow-lg">
            <CardContent className="flex flex-col items-center justify-center py-12">
              <div className="p-4 bg-gradient-to-br from-indigo-100 to-blue-100 rounded-full mb-4">
                <UserCog className="h-12 w-12 text-indigo-600" />
              </div>
              <h3 className="text-lg font-semibold mb-2">Ingen ansatte ennå</h3>
              <p className="text-muted-foreground mb-6">
                Opprett din første ansatt for å begynne å administrere
                personalet ditt!
              </p>
              <Button
                onClick={() => setIsCreateDialogOpen(true)}
                className="bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-700 hover:to-blue-700 text-white"
              >
                <Plus className="h-4 w-4 mr-2" />
                Opprett første ansatt
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </DashboardLayout>
  );
}
