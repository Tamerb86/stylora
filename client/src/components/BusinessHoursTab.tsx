import { useState, useEffect } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { Clock, Save } from "lucide-react";

interface DayHours {
  dayOfWeek: number;
  isOpen: boolean;
  openTime: string;
  closeTime: string;
}

const dayNames = [
  "Søndag",
  "Mandag",
  "Tirsdag",
  "Onsdag",
  "Torsdag",
  "Fredag",
  "Lørdag",
];

export function BusinessHoursTab() {
  const [hours, setHours] = useState<DayHours[]>([]);
  const [hasChanges, setHasChanges] = useState(false);

  const { data: businessHours, isLoading } = trpc.businessHours.getAll.useQuery();
  const updateAll = trpc.businessHours.updateAll.useMutation({
    onSuccess: () => {
      toast.success("Åpningstider lagret", {
        description: "Åpningstidene er oppdatert",
      });
      setHasChanges(false);
    },
    onError: (error) => {
      toast.error("Feil ved lagring", {
        description: error.message,
      });
    },
  });

  // Initialize hours from API data
  useEffect(() => {
    if (businessHours) {
      const initialHours: DayHours[] = [];
      for (let i = 0; i <= 6; i++) {
        const dayData = businessHours.find((h) => h.dayOfWeek === i);
        initialHours.push({
          dayOfWeek: i,
          isOpen: dayData?.isOpen ?? false,
          openTime: dayData?.openTime ?? "09:00",
          closeTime: dayData?.closeTime ?? "17:00",
        });
      }
      setHours(initialHours);
    }
  }, [businessHours]);

  const handleToggle = (dayOfWeek: number) => {
    setHours((prev) =>
      prev.map((h) =>
        h.dayOfWeek === dayOfWeek ? { ...h, isOpen: !h.isOpen } : h
      )
    );
    setHasChanges(true);
  };

  const handleTimeChange = (
    dayOfWeek: number,
    field: "openTime" | "closeTime",
    value: string
  ) => {
    setHours((prev) =>
      prev.map((h) =>
        h.dayOfWeek === dayOfWeek ? { ...h, [field]: value } : h
      )
    );
    setHasChanges(true);
  };

  const handleSave = () => {
    updateAll.mutate(hours);
  };

  const handleCopyToAll = (sourceDay: number) => {
    const source = hours.find((h) => h.dayOfWeek === sourceDay);
    if (!source) return;

    setHours((prev) =>
      prev.map((h) => ({
        ...h,
        isOpen: source.isOpen,
        openTime: source.openTime,
        closeTime: source.closeTime,
      }))
    );
    setHasChanges(true);
    toast.success("Kopiert til alle dager");
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-muted-foreground">Laster åpningstider...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium">Åpningstider</h3>
        <p className="text-sm text-muted-foreground">
          Angi når salongen din er åpen for booking
        </p>
      </div>

      <div className="space-y-4">
        {hours.map((day) => (
          <Card key={day.dayOfWeek} className="p-4">
            <div className="flex items-center gap-4">
              {/* Day name and toggle */}
              <div className="flex items-center gap-3 w-32">
                <Switch
                  checked={day.isOpen}
                  onCheckedChange={() => handleToggle(day.dayOfWeek)}
                />
                <Label className="font-medium">
                  {dayNames[day.dayOfWeek]}
                </Label>
              </div>

              {/* Time inputs */}
              {day.isOpen ? (
                <div className="flex items-center gap-3 flex-1">
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4 text-muted-foreground" />
                    <Input
                      type="time"
                      value={day.openTime}
                      onChange={(e) =>
                        handleTimeChange(day.dayOfWeek, "openTime", e.target.value)
                      }
                      className="w-32"
                    />
                  </div>
                  <span className="text-muted-foreground">til</span>
                  <Input
                    type="time"
                    value={day.closeTime}
                    onChange={(e) =>
                      handleTimeChange(day.dayOfWeek, "closeTime", e.target.value)
                    }
                    className="w-32"
                  />
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleCopyToAll(day.dayOfWeek)}
                  >
                    Kopier til alle
                  </Button>
                </div>
              ) : (
                <div className="flex-1 text-muted-foreground">Stengt</div>
              )}
            </div>
          </Card>
        ))}
      </div>

      {/* Save button */}
      <div className="flex items-center justify-between pt-4 border-t">
        <div className="text-sm text-muted-foreground">
          {hasChanges && "Du har ulagrede endringer"}
        </div>
        <Button
          onClick={handleSave}
          disabled={!hasChanges || updateAll.isPending}
          className="bg-gradient-to-r from-blue-600 to-orange-500 hover:from-blue-700 hover:to-orange-600"
        >
          <Save className="w-4 h-4 mr-2" />
          {updateAll.isPending ? "Lagrer..." : "Lagre åpningstider"}
        </Button>
      </div>
    </div>
  );
}
