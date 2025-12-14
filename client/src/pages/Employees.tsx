import { useState } from "react";
import { trpc } from "@/lib/trpc";
import DashboardLayout from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, UserCog, Mail, Phone, Edit, Lock, Unlock, Key } from "lucide-react";
import { toast } from "sonner";

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

  const { data: employees, isLoading, refetch } = trpc.employees.list.useQuery();
  
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
    onError: (error) => {
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
    onError: (error) => {
      toast.error(`Feil: ${error.message}`);
    },
  });

  const deactivateEmployee = trpc.employees.deactivate.useMutation({
    onSuccess: () => {
      toast.success("Ansatt deaktivert!");
      refetch();
    },
    onError: (error) => {
      toast.error(`Feil: ${error.message}`);
    },
  });

  const activateEmployee = trpc.employees.activate.useMutation({
    onSuccess: () => {
      toast.success("Ansatt aktivert!");
      refetch();
    },
    onError: (error) => {
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

  return (
    <DashboardLayout>
      <div className="p-8 space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-orange-500 bg-clip-text text-transparent">Ansatte</h1>
            <p className="text-muted-foreground">Administrer behandlere og personale</p>
          </div>
          
          {/* Create Dialog */}
          <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button className="bg-gradient-to-r from-blue-600 to-orange-500 hover:from-blue-700 hover:to-orange-600 text-white shadow-lg">
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
                    onChange={(e) => setCreateFormData({ ...createFormData, name: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="create-email">E-post</Label>
                  <Input
                    id="create-email"
                    type="email"
                    value={createFormData.email}
                    onChange={(e) => setCreateFormData({ ...createFormData, email: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="create-phone">Telefon</Label>
                  <Input
                    id="create-phone"
                    value={createFormData.phone}
                    onChange={(e) => setCreateFormData({ ...createFormData, phone: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="create-role">Rolle</Label>
                  <Select value={createFormData.role} onValueChange={(value: any) => setCreateFormData({ ...createFormData, role: value })}>
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
                    <Label htmlFor="create-commissionType">Provisjonstype</Label>
                    <Select value={createFormData.commissionType} onValueChange={(value: any) => setCreateFormData({ ...createFormData, commissionType: value })}>
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
                    <Label htmlFor="create-commissionRate">Provisjonssats</Label>
                    <Input
                      id="create-commissionRate"
                      type="number"
                      step="0.01"
                      value={createFormData.commissionRate}
                      onChange={(e) => setCreateFormData({ ...createFormData, commissionRate: e.target.value })}
                    />
                  </div>
                </div>

                <DialogFooter>
                  <Button type="button" variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                    Avbryt
                  </Button>
                  <Button type="submit" disabled={createEmployee.isPending}>
                    {createEmployee.isPending ? "Oppretter..." : "Opprett ansatt"}
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
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
                  onChange={(e) => setEditFormData({ ...editFormData, name: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-email">E-post</Label>
                <Input
                  id="edit-email"
                  type="email"
                  value={editFormData.email}
                  onChange={(e) => setEditFormData({ ...editFormData, email: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-phone">Telefon</Label>
                <Input
                  id="edit-phone"
                  value={editFormData.phone}
                  onChange={(e) => setEditFormData({ ...editFormData, phone: e.target.value })}
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
                    onChange={(e) => {
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
                  <Select value={editFormData.commissionType} onValueChange={(value: any) => setEditFormData({ ...editFormData, commissionType: value })}>
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
                    onChange={(e) => setEditFormData({ ...editFormData, commissionRate: e.target.value })}
                  />
                </div>
              </div>

              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setIsEditDialogOpen(false)}>
                  Avbryt
                </Button>
                <Button type="submit" disabled={updateEmployee.isPending}>
                  {updateEmployee.isPending ? "Lagrer..." : "Lagre endringer"}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>

        {isLoading ? (
          <div className="grid gap-4 md:grid-cols-2">
            {[1, 2].map((i) => (
              <div key={i} className="h-32 bg-muted animate-pulse rounded-lg"></div>
            ))}
          </div>
        ) : employees && employees.length > 0 ? (
          <div className="grid gap-4 md:grid-cols-2">
            {employees.map((employee) => (
              <Card 
                key={employee.id} 
                className={`hover:shadow-md transition-shadow ${!employee.isActive ? "opacity-60 border-red-300" : ""}`}
              >
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-2">
                      <UserCog className={`h-5 w-5 ${employee.isActive ? "text-primary" : "text-muted-foreground"}`} />
                      <div>
                        <div className="flex items-center gap-2">
                          <CardTitle>{employee.name}</CardTitle>
                          {!employee.isActive && (
                            <span className="text-xs bg-red-100 text-red-700 px-2 py-0.5 rounded">
                              Deaktivert
                            </span>
                          )}
                          {employee.pin && (
                            <Key className="h-3 w-3 text-green-600" />
                          )}
                        </div>
                        <CardDescription className="mt-1">
                          {employee.role === "owner" ? "Eier" : employee.role === "admin" ? "Administrator" : "Behandler"}
                        </CardDescription>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => openEditDialog(employee)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleToggleActive(employee)}
                        disabled={deactivateEmployee.isPending || activateEmployee.isPending}
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
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Mail className="h-3 w-3" />
                      {employee.email}
                    </div>
                  )}
                  {employee.phone && (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Phone className="h-3 w-3" />
                      {employee.phone}
                    </div>
                  )}
                  {employee.commissionRate && (
                    <div className="text-sm text-muted-foreground">
                      Provisjon: {employee.commissionRate}% ({employee.commissionType})
                    </div>
                  )}
                  {employee.pin && (
                    <div className="flex items-center gap-2 text-sm text-green-600">
                      <Key className="h-3 w-3" />
                      PIN: ••••
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <UserCog className="h-12 w-12 text-muted-foreground mb-4" />
              <p className="text-muted-foreground">
                Ingen ansatte ennå. Opprett din første ansatt!
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </DashboardLayout>
  );
}
