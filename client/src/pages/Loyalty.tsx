import { useState } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Gift, Settings as SettingsIcon, Plus, Percent, DollarSign } from "lucide-react";

export default function Loyalty() {
  const [showCreateReward, setShowCreateReward] = useState(false);
  const [rewardForm, setRewardForm] = useState({
    name: "",
    description: "",
    pointsCost: "",
    discountType: "percentage" as "percentage" | "fixed_amount",
    discountValue: "",
    validityDays: "30",
  });

  const { data: rewards, isLoading: loadingRewards, refetch: refetchRewards } = trpc.loyalty.listRewards.useQuery();
  const { data: settings, isLoading: loadingSettings, refetch: refetchSettings } = trpc.loyalty.getSettings.useQuery();

  const createReward = trpc.loyalty.createReward.useMutation({
    onSuccess: () => {
      toast.success("Belønning opprettet");
      setShowCreateReward(false);
      setRewardForm({
        name: "",
        description: "",
        pointsCost: "",
        discountType: "percentage",
        discountValue: "",
        validityDays: "30",
      });
      refetchRewards();
    },
    onError: (error) => {
      toast.error(`Feil: ${error.message}`);
    },
  });

  const updateSettings = trpc.loyalty.updateSettings.useMutation({
    onSuccess: () => {
      toast.success("Innstillinger lagret");
      refetchSettings();
    },
    onError: (error) => {
      toast.error(`Feil: ${error.message}`);
    },
  });

  const handleCreateReward = () => {
    if (!rewardForm.name || !rewardForm.pointsCost || !rewardForm.discountValue) {
      toast.error("Vennligst fyll ut alle obligatoriske felt");
      return;
    }

    createReward.mutate({
      name: rewardForm.name,
      description: rewardForm.description || undefined,
      pointsCost: parseInt(rewardForm.pointsCost),
      discountType: rewardForm.discountType,
      discountValue: rewardForm.discountValue,
      validityDays: parseInt(rewardForm.validityDays),
    });
  };

  const handleUpdateSettings = (updates: { enabled?: boolean; pointsPerVisit?: number; pointsPerNOK?: number }) => {
    if (!settings) return;

    updateSettings.mutate({
      enabled: updates.enabled ?? settings.enabled,
      pointsPerVisit: updates.pointsPerVisit ?? settings.pointsPerVisit,
      pointsPerNOK: updates.pointsPerNOK ?? settings.pointsPerNOK,
    });
  };

  return (
    <DashboardLayout>
      <div className="p-6 max-w-6xl">
        <div className="mb-6">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-orange-500 bg-clip-text text-transparent mb-2">Lojalitetsprogram</h1>
          <p className="text-muted-foreground">
            Administrer lojalitetspoeng, belønninger og innstillinger
          </p>
        </div>

        <Tabs defaultValue="rewards" className="space-y-6">
          <TabsList>
            <TabsTrigger value="rewards">
              <Gift className="w-4 h-4 mr-2" />
              Belønninger
            </TabsTrigger>
            <TabsTrigger value="settings">
              <SettingsIcon className="w-4 h-4 mr-2" />
              Innstillinger
            </TabsTrigger>
          </TabsList>

          {/* Rewards Tab */}
          <TabsContent value="rewards" className="space-y-4">
            <div className="flex justify-between items-center">
              <div>
                <h2 className="text-xl font-semibold">Tilgjengelige belønninger</h2>
                <p className="text-sm text-muted-foreground">
                  Kunder kan løse inn poeng for disse belønningene
                </p>
              </div>
              <Button onClick={() => setShowCreateReward(true)} className="bg-gradient-to-r from-blue-600 to-orange-500 hover:from-blue-700 hover:to-orange-600 text-white shadow-lg">
                <Plus className="w-4 h-4 mr-2" />
                Ny belønning
              </Button>
            </div>

            {loadingRewards ? (
              <Card>
                <CardContent className="py-8 text-center text-muted-foreground">
                  Laster belønninger...
                </CardContent>
              </Card>
            ) : !rewards || rewards.length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center">
                  <Gift className="w-16 h-16 mx-auto mb-4 text-muted-foreground opacity-50" />
                  <p className="text-lg font-medium mb-2">Ingen belønninger ennå</p>
                  <p className="text-sm text-muted-foreground mb-4">
                    Opprett din første belønning for å komme i gang
                  </p>
                  <Button onClick={() => setShowCreateReward(true)} className="bg-gradient-to-r from-blue-600 to-orange-500 hover:from-blue-700 hover:to-orange-600 text-white shadow-lg">
                    <Plus className="w-4 h-4 mr-2" />
                    Opprett belønning
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {rewards.map((reward) => (
                  <Card key={reward.id}>
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <CardTitle className="text-lg">{reward.name}</CardTitle>
                          {reward.description && (
                            <CardDescription className="mt-1">{reward.description}</CardDescription>
                          )}
                        </div>
                        <Badge variant="secondary">{reward.pointsCost} poeng</Badge>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="flex items-center gap-2 text-sm">
                        {reward.discountType === "percentage" ? (
                          <>
                            <Percent className="w-4 h-4 text-primary" />
                            <span className="font-medium">{reward.discountValue}% rabatt</span>
                          </>
                        ) : (
                          <>
                            <DollarSign className="w-4 h-4 text-primary" />
                            <span className="font-medium">{reward.discountValue} NOK rabatt</span>
                          </>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground mt-2">
                        Gyldig i {reward.validityDays} dager etter innløsning
                      </p>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          {/* Settings Tab */}
          <TabsContent value="settings" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Lojalitetsinnstillinger</CardTitle>
                <CardDescription>
                  Konfigurer hvordan kunder tjener poeng
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {loadingSettings ? (
                  <p className="text-center text-muted-foreground py-4">Laster innstillinger...</p>
                ) : settings ? (
                  <>
                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label>Aktiver lojalitetsprogram</Label>
                        <p className="text-sm text-muted-foreground">
                          Slå på eller av lojalitetsprogrammet
                        </p>
                      </div>
                      <Switch
                        checked={settings.enabled}
                        onCheckedChange={(checked) => handleUpdateSettings({ enabled: checked })}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="pointsPerVisit">Poeng per besøk</Label>
                      <Input
                        id="pointsPerVisit"
                        type="number"
                        min="0"
                        value={settings.pointsPerVisit}
                        onChange={(e) => {
                          const value = parseInt(e.target.value) || 0;
                          handleUpdateSettings({ pointsPerVisit: value });
                        }}
                      />
                      <p className="text-sm text-muted-foreground">
                        Antall poeng kunden får for hver fullførte avtale
                      </p>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="pointsPerNOK">Poeng per NOK brukt</Label>
                      <Input
                        id="pointsPerNOK"
                        type="number"
                        min="0"
                        step="0.1"
                        value={settings.pointsPerNOK}
                        onChange={(e) => {
                          const value = parseFloat(e.target.value) || 0;
                          handleUpdateSettings({ pointsPerNOK: value });
                        }}
                      />
                      <p className="text-sm text-muted-foreground">
                        Antall poeng kunden får per krone brukt (f.eks. 1.0 = 1 poeng per NOK)
                      </p>
                    </div>

                    <div className="pt-4 border-t">
                      <h3 className="font-medium mb-2">Eksempel</h3>
                      <p className="text-sm text-muted-foreground">
                        Med nåværende innstillinger: En kunde som fullfører en avtale til 500 NOK vil få{" "}
                        <strong>{settings.pointsPerVisit + Math.floor(500 * settings.pointsPerNOK)} poeng</strong>
                        {" "}({settings.pointsPerVisit} for besøket + {Math.floor(500 * settings.pointsPerNOK)} for beløpet)
                      </p>
                    </div>
                  </>
                ) : null}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Create Reward Dialog */}
        <Dialog open={showCreateReward} onOpenChange={setShowCreateReward}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Opprett ny belønning</DialogTitle>
              <DialogDescription>
                Lag en belønning som kunder kan løse inn med poeng
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="rewardName">Navn *</Label>
                <Input
                  id="rewardName"
                  value={rewardForm.name}
                  onChange={(e) => setRewardForm({ ...rewardForm, name: e.target.value })}
                  placeholder="F.eks. 10% rabatt på neste besøk"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="rewardDesc">Beskrivelse</Label>
                <Textarea
                  id="rewardDesc"
                  value={rewardForm.description}
                  onChange={(e) => setRewardForm({ ...rewardForm, description: e.target.value })}
                  placeholder="Valgfri beskrivelse"
                  rows={2}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="pointsCost">Poengkostnad *</Label>
                <Input
                  id="pointsCost"
                  type="number"
                  min="1"
                  value={rewardForm.pointsCost}
                  onChange={(e) => setRewardForm({ ...rewardForm, pointsCost: e.target.value })}
                  placeholder="100"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="discountType">Rabatttype *</Label>
                <Select
                  value={rewardForm.discountType}
                  onValueChange={(value: "percentage" | "fixed_amount") =>
                    setRewardForm({ ...rewardForm, discountType: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="percentage">Prosent (%)</SelectItem>
                    <SelectItem value="fixed_amount">Fast beløp (NOK)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="discountValue">
                  Rabattverdi * {rewardForm.discountType === "percentage" ? "(%)" : "(NOK)"}
                </Label>
                <Input
                  id="discountValue"
                  type="number"
                  min="0"
                  step={rewardForm.discountType === "percentage" ? "1" : "0.01"}
                  value={rewardForm.discountValue}
                  onChange={(e) => setRewardForm({ ...rewardForm, discountValue: e.target.value })}
                  placeholder={rewardForm.discountType === "percentage" ? "10" : "50.00"}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="validityDays">Gyldighetsdager</Label>
                <Input
                  id="validityDays"
                  type="number"
                  min="1"
                  value={rewardForm.validityDays}
                  onChange={(e) => setRewardForm({ ...rewardForm, validityDays: e.target.value })}
                />
                <p className="text-xs text-muted-foreground">
                  Hvor lenge belønningen er gyldig etter innløsning
                </p>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowCreateReward(false)}>
                Avbryt
              </Button>
              <Button onClick={handleCreateReward} disabled={createReward.isPending}>
                {createReward.isPending ? "Oppretter..." : "Opprett belønning"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
}
