import { useState, useEffect } from "react";
import { Link } from "wouter";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { UserPlus, Play, X, Clock, Users, MessageSquare, SkipForward, AlertCircle, Crown, Zap, Tv } from "lucide-react";
import { toast } from "sonner";
import { format, formatDistanceToNow } from "date-fns";
import { nb } from "date-fns/locale";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

export function WalkInQueue() {
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [editPriorityDialog, setEditPriorityDialog] = useState<{ open: boolean; queueId: number | null; currentPriority: string; currentReason: string }>({
    open: false,
    queueId: null,
    currentPriority: "normal",
    currentReason: "",
  });
  const [newCustomer, setNewCustomer] = useState({
    customerName: "",
    customerPhone: "",
    serviceId: "",
    preferredEmployeeId: "",
    priority: "normal" as "normal" | "urgent" | "vip",
    priorityReason: "",
  });

  // Fetch queue with auto-refresh every 30 seconds
  const { data: queue, refetch } = trpc.walkInQueue.getQueue.useQuery(undefined, {
    refetchInterval: 30000, // 30 seconds
  });

  const { data: barberStats } = trpc.walkInQueue.getAvailableBarbers.useQuery(undefined, {
    refetchInterval: 30000,
  });

  const { data: services } = trpc.services.list.useQuery();
  // Get tenantId from auth context
  const { data: authData } = trpc.auth.me.useQuery();
  const { data: employees } = trpc.publicBooking.getAvailableEmployees.useQuery(
    { tenantId: authData?.tenantId || "" },
    { enabled: !!authData?.tenantId }
  );

  const addToQueue = trpc.walkInQueue.addToQueue.useMutation({
    onSuccess: () => {
      toast.success("Kunde lagt til i kø");
      setIsAddDialogOpen(false);
      setNewCustomer({ 
        customerName: "", 
        customerPhone: "", 
        serviceId: "", 
        preferredEmployeeId: "",
        priority: "normal",
        priorityReason: "",
      });
      refetch();
    },
    onError: (error: any) => {
      toast.error(error.message || "Kunne ikke legge til kunde");
    },
  });

  const startService = trpc.walkInQueue.startService.useMutation({
    onSuccess: () => {
      toast.success("Tjeneste startet");
      refetch();
    },
    onError: (error: any) => {
      toast.error(error.message || "Kunne ikke starte tjeneste");
    },
  });

  const removeFromQueue = trpc.walkInQueue.removeFromQueue.useMutation({
    onSuccess: () => {
      toast.success("Fjernet fra kø");
      refetch();
    },
    onError: (error: any) => {
      toast.error(error.message || "Kunne ikke fjerne fra kø");
    },
  });

  const updatePriority = trpc.walkInQueue.updatePriority.useMutation({
    onSuccess: () => {
      toast.success("Prioritet oppdatert");
      setEditPriorityDialog({ open: false, queueId: null, currentPriority: "normal", currentReason: "" });
      refetch();
    },
    onError: (error: any) => {
      toast.error(error.message || "Kunne ikke oppdatere prioritet");
    },
  });

  const handleAddToQueue = () => {
    if (!newCustomer.customerName || !newCustomer.customerPhone) {
      toast.error("Vennligst fyll ut navn og telefon");
      return;
    }

    if (!newCustomer.serviceId) {
      toast.error("Vennligst velg en tjeneste");
      return;
    }

    if ((newCustomer.priority === "urgent" || newCustomer.priority === "vip") && !newCustomer.priorityReason) {
      toast.error("Vennligst oppgi grunn for prioritering");
      return;
    }

    addToQueue.mutate({
      customerName: newCustomer.customerName,
      customerPhone: newCustomer.customerPhone,
      serviceId: Number(newCustomer.serviceId),
      employeeId: newCustomer.preferredEmployeeId ? Number(newCustomer.preferredEmployeeId) : undefined,
      priority: newCustomer.priority,
      priorityReason: newCustomer.priorityReason || undefined,
    });
  };

  const handleStartService = (queueId: number) => {
    if (confirm("Er du sikker på at du vil starte tjenesten for denne kunden?")) {
      startService.mutate({ queueId });
    }
  };

  const handleRemove = (queueId: number, customerName: string) => {
    if (confirm(`Er du sikker på at du vil fjerne ${customerName} fra køen?`)) {
      removeFromQueue.mutate({ queueId });
    }
  };

  const handleUpdatePriority = () => {
    if (!editPriorityDialog.queueId) return;

    updatePriority.mutate({
      queueId: editPriorityDialog.queueId,
      priority: editPriorityDialog.currentPriority as "normal" | "urgent" | "vip",
      priorityReason: editPriorityDialog.currentReason || undefined,
    });
  };

  const handleNotify = (queueId: number) => {
    toast.info("SMS-varsel funksjon kommer snart");
  };

  // Calculate dynamic wait time based on priority and available barbers
  const calculateDynamicWaitTime = (position: number, priority: string, serviceDuration: number) => {
    const availableBarbers = barberStats?.available || 1;
    const priorityMultiplier = priority === "vip" ? 0.5 : priority === "urgent" ? 0.75 : 1;
    
    // Base calculation: (position × service duration) / available barbers
    const baseWaitTime = (position * serviceDuration) / availableBarbers;
    const adjustedWaitTime = Math.round(baseWaitTime * priorityMultiplier);
    
    // Return range (±5 minutes)
    const minWait = Math.max(0, adjustedWaitTime - 5);
    const maxWait = adjustedWaitTime + 5;
    
    return { min: minWait, max: maxWait, estimated: adjustedWaitTime };
  };

  const getPriorityBadge = (priority: string, reason?: string) => {
    const badges = {
      vip: {
        icon: <Crown className="h-3 w-3" />,
        label: "VIP",
        className: "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200 border-purple-300",
      },
      urgent: {
        icon: <Zap className="h-3 w-3" />,
        label: "Haster",
        className: "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200 border-orange-300",
      },
      normal: {
        icon: <Users className="h-3 w-3" />,
        label: "Normal",
        className: "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200 border-gray-300",
      },
    };

    const badge = badges[priority as keyof typeof badges] || badges.normal;

    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Badge variant="outline" className={`gap-1 ${badge.className}`}>
              {badge.icon}
              {badge.label}
            </Badge>
          </TooltipTrigger>
          {reason && (
            <TooltipContent>
              <p className="text-sm">Grunn: {reason}</p>
            </TooltipContent>
          )}
        </Tooltip>
      </TooltipProvider>
    );
  };

  const getWaitTimeColor = (minutes: number) => {
    if (minutes < 15) return "text-green-600 dark:text-green-400";
    if (minutes < 30) return "text-yellow-600 dark:text-yellow-400";
    return "text-red-600 dark:text-red-400";
  };

  const getWaitTimeBg = (minutes: number) => {
    if (minutes < 15) return "bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800";
    if (minutes < 30) return "bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800";
    return "bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800";
  };

  // Sort queue by priority (VIP → Urgent → Normal) then by position
  const sortedQueue = [...(queue || [])].sort((a, b) => {
    const priorityOrder = { vip: 0, urgent: 1, normal: 2 };
    const aPriority = priorityOrder[a.priority as keyof typeof priorityOrder] ?? 2;
    const bPriority = priorityOrder[b.priority as keyof typeof priorityOrder] ?? 2;
    
    if (aPriority !== bPriority) return aPriority - bPriority;
    return a.position - b.position;
  });

  const waitingCustomers = sortedQueue.filter((q: any) => q.status === "waiting") || [];
  const averageWaitTime = waitingCustomers.length > 0
    ? Math.floor(waitingCustomers.reduce((sum: number, q: any) => {
        const service = services?.find((s: any) => s.id === q.serviceId);
        const waitTime = calculateDynamicWaitTime(q.position, q.priority, service?.durationMinutes || 30);
        return sum + waitTime.estimated;
      }, 0) / waitingCustomers.length)
    : 0;

  return (
    <Card className="col-span-full">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Walk-in Kø
            </CardTitle>
            <CardDescription>
              Administrer kunder som venter uten avtale
            </CardDescription>
          </div>
          <div className="flex items-center gap-3">
            <Link href="/queue-display" target="_blank">
              <Button size="lg" variant="outline" className="h-14 gap-2">
                <Tv className="h-5 w-5" />
                TV-modus
              </Button>
            </Link>
            <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
              <DialogTrigger asChild>
                <Button size="lg" className="h-14 gap-2">
                  <UserPlus className="h-5 w-5" />
                  Legg til Kunde
                </Button>
              </DialogTrigger>
            <DialogContent className="sm:max-w-[500px]">
              <DialogHeader>
                <DialogTitle>Legg til kunde i kø</DialogTitle>
                <DialogDescription>
                  Registrer kunde som venter på ledig time
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <Label htmlFor="name">Kundens navn *</Label>
                  <Input
                    id="name"
                    placeholder="Ola Nordmann"
                    value={newCustomer.customerName}
                    onChange={(e) => setNewCustomer({ ...newCustomer, customerName: e.target.value })}
                    className="h-12"
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="phone">Telefonnummer *</Label>
                  <Input
                    id="phone"
                    placeholder="+47 123 45 678"
                    value={newCustomer.customerPhone}
                    onChange={(e) => setNewCustomer({ ...newCustomer, customerPhone: e.target.value })}
                    className="h-12"
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="service">Tjeneste *</Label>
                  <Select
                    value={newCustomer.serviceId}
                    onValueChange={(value) => setNewCustomer({ ...newCustomer, serviceId: value })}
                  >
                    <SelectTrigger className="h-12">
                      <SelectValue placeholder="Velg tjeneste" />
                    </SelectTrigger>
                    <SelectContent>
                      {services?.map((e: any) => (
                        <SelectItem key={e.id} value={String(e.id)}>
                          {e.name} ({e.durationMinutes} min)
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="employee">Foretrukket frisør (valgfritt)</Label>
                  <Select
                    value={newCustomer.preferredEmployeeId}
                    onValueChange={(value) => setNewCustomer({ ...newCustomer, preferredEmployeeId: value })}
                  >
                    <SelectTrigger className="h-12">
                      <SelectValue placeholder="Velg frisør" />
                    </SelectTrigger>
                    <SelectContent>
                      {employees?.map((e: any) => (
                        <SelectItem key={e.id} value={String(e.id)}>
                          {e.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="priority">Prioritet *</Label>
                  <Select
                    value={newCustomer.priority}
                    onValueChange={(value) => setNewCustomer({ ...newCustomer, priority: value as "normal" | "urgent" | "vip" })}
                  >
                    <SelectTrigger className="h-12">
                      <SelectValue placeholder="Velg prioritet" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="normal">
                        <div className="flex items-center gap-2">
                          <Users className="h-4 w-4" />
                          Normal
                        </div>
                      </SelectItem>
                      <SelectItem value="urgent">
                        <div className="flex items-center gap-2">
                          <Zap className="h-4 w-4 text-orange-500" />
                          Haster
                        </div>
                      </SelectItem>
                      <SelectItem value="vip">
                        <div className="flex items-center gap-2">
                          <Crown className="h-4 w-4 text-purple-500" />
                          VIP
                        </div>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                  {(newCustomer.priority === "urgent" || newCustomer.priority === "vip") && (
                    <div className="mt-2">
                      <Label htmlFor="priorityReason">Grunn for prioritering *</Label>
                      <Textarea
                        id="priorityReason"
                        placeholder="F.eks: Stamkunde, spesiell anledning, etc."
                        value={newCustomer.priorityReason}
                        onChange={(e) => setNewCustomer({ ...newCustomer, priorityReason: e.target.value })}
                        className="mt-1"
                        rows={3}
                      />
                    </div>
                  )}
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsAddDialogOpen(false)} className="h-12">
                  Avbryt
                </Button>
                <Button onClick={handleAddToQueue} disabled={addToQueue.isPending} className="h-12">
                  {addToQueue.isPending ? "Legger til..." : "Legg til i kø"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {/* Stats */}
        <div className="grid gap-4 md:grid-cols-4 mb-6">
          <div className="flex items-center gap-3 p-4 rounded-lg bg-accent/50">
            <Users className="h-8 w-8 text-primary" />
            <div>
              <div className="text-2xl font-bold">{waitingCustomers.length}</div>
              <div className="text-sm text-muted-foreground">I kø</div>
            </div>
          </div>
          <div className="flex items-center gap-3 p-4 rounded-lg bg-accent/50">
            <Clock className="h-8 w-8 text-primary" />
            <div>
              <div className="text-2xl font-bold">{averageWaitTime} min</div>
              <div className="text-sm text-muted-foreground">Gjennomsnittlig ventetid</div>
            </div>
          </div>
          <div className="flex items-center gap-3 p-4 rounded-lg bg-accent/50">
            <Users className="h-8 w-8 text-green-600" />
            <div>
              <div className="text-2xl font-bold">{barberStats?.available || 0}</div>
              <div className="text-sm text-muted-foreground">Ledige frisører</div>
            </div>
          </div>
          <div className="flex items-center gap-3 p-4 rounded-lg bg-accent/50">
            <Users className="h-8 w-8 text-orange-600" />
            <div>
              <div className="text-2xl font-bold">{barberStats?.busy || 0}</div>
              <div className="text-sm text-muted-foreground">Opptatt</div>
            </div>
          </div>
        </div>

        {/* Queue List */}
        {waitingCustomers.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p className="text-lg">Ingen kunder i kø</p>
            <p className="text-sm mt-2">Klikk "Legg til Kunde" for å registrere walk-in kunder</p>
          </div>
        ) : (
          <div className="space-y-3">
            {waitingCustomers.map((customer: any, index: number) => {
              const service = services?.find((s: any) => s.id === customer.serviceId);
              const employee = employees?.find((e: any) => e.id === customer.employeeId);
              const waitTime = calculateDynamicWaitTime(
                index + 1, 
                customer.priority, 
                service?.durationMinutes || 30
              );
              
              return (
                <div
                  key={customer.id}
                  className={`flex items-center justify-between p-4 border-2 rounded-lg transition-colors ${getWaitTimeBg(waitTime.estimated)}`}
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <div className="flex items-center justify-center w-10 h-10 rounded-full bg-primary text-primary-foreground font-bold text-lg">
                        {index + 1}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <div className="font-semibold text-lg">{customer.customerName}</div>
                          {getPriorityBadge(customer.priority, customer.priorityReason)}
                        </div>
                        <div className="text-sm text-muted-foreground">{customer.customerPhone}</div>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-sm ml-13">
                      <div>
                        <span className="text-muted-foreground">Tjeneste:</span>{" "}
                        <span className="font-medium">{service?.name || "Ukjent"}</span>
                      </div>
                      {employee && (
                        <div>
                          <span className="text-muted-foreground">Frisør:</span>{" "}
                          <span className="font-medium">{employee.name}</span>
                        </div>
                      )}
                      <div className={`flex items-center gap-1 ${getWaitTimeColor(waitTime.estimated)}`}>
                        <Clock className="h-4 w-4" />
                        <span className="font-semibold">
                          {waitTime.min}-{waitTime.max} min
                        </span>
                      </div>
                      <div className="text-muted-foreground">
                        Lagt til: {customer.addedAt ? format(new Date(customer.addedAt), "HH:mm", { locale: nb }) : "Ukjent"}
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            size="icon"
                            variant="outline"
                            onClick={() => setEditPriorityDialog({
                              open: true,
                              queueId: customer.id,
                              currentPriority: customer.priority,
                              currentReason: customer.priorityReason || "",
                            })}
                          >
                            <SkipForward className="h-4 w-4" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>Endre prioritet</TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            size="icon"
                            variant="default"
                            onClick={() => handleStartService(customer.id)}
                          >
                            <Play className="h-4 w-4" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>Start tjeneste</TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            size="icon"
                            variant="destructive"
                            onClick={() => handleRemove(customer.id, customer.customerName)}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>Fjern fra kø</TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>

      {/* Edit Priority Dialog */}
      <Dialog open={editPriorityDialog.open} onOpenChange={(open) => setEditPriorityDialog({ ...editPriorityDialog, open })}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Endre prioritet</DialogTitle>
            <DialogDescription>
              Oppdater kundens prioritet i køen
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="edit-priority">Prioritet</Label>
              <Select
                value={editPriorityDialog.currentPriority}
                onValueChange={(value) => setEditPriorityDialog({ ...editPriorityDialog, currentPriority: value })}
              >
                <SelectTrigger className="h-12">
                  <SelectValue placeholder="Velg prioritet" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="normal">
                    <div className="flex items-center gap-2">
                      <Users className="h-4 w-4" />
                      Normal
                    </div>
                  </SelectItem>
                  <SelectItem value="urgent">
                    <div className="flex items-center gap-2">
                      <Zap className="h-4 w-4 text-orange-500" />
                      Haster
                    </div>
                  </SelectItem>
                  <SelectItem value="vip">
                    <div className="flex items-center gap-2">
                      <Crown className="h-4 w-4 text-purple-500" />
                      VIP
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
            {(editPriorityDialog.currentPriority === "urgent" || editPriorityDialog.currentPriority === "vip") && (
              <div className="grid gap-2">
                <Label htmlFor="edit-reason">Grunn for prioritering</Label>
                <Textarea
                  id="edit-reason"
                  placeholder="F.eks: Stamkunde, spesiell anledning, etc."
                  value={editPriorityDialog.currentReason}
                  onChange={(e) => setEditPriorityDialog({ ...editPriorityDialog, currentReason: e.target.value })}
                  rows={3}
                />
              </div>
            )}
          </div>
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => setEditPriorityDialog({ open: false, queueId: null, currentPriority: "normal", currentReason: "" })} 
              className="h-12"
            >
              Avbryt
            </Button>
            <Button onClick={handleUpdatePriority} disabled={updatePriority.isPending} className="h-12">
              {updatePriority.isPending ? "Oppdaterer..." : "Oppdater"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
}
