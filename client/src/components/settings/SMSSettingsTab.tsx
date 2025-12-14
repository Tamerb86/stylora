import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { trpc } from "@/lib/trpc";
import { MessageSquare, Send } from "lucide-react";

export function SMSSettingsTab() {
  const [smsPhoneNumber, setSmsPhoneNumber] = useState("");
  const [smsProvider, setSmsProvider] = useState<"mock" | "pswincom" | "linkmobility" | "twilio">("mock");
  const [smsApiKey, setSmsApiKey] = useState("");
  const [smsApiSecret, setSmsApiSecret] = useState("");
  const [testPhoneNumber, setTestPhoneNumber] = useState("");

  // Load SMS settings
  const { data: smsSettings, isLoading } = trpc.salonSettings.getSmsSettings.useQuery();
  const updateSmsMutation = trpc.salonSettings.updateSmsSettings.useMutation({
    onSuccess: () => {
      toast.success("SMS-innstillinger lagret!");
    },
    onError: (error) => {
      toast.error(error.message || "Kunne ikke lagre SMS-innstillinger");
    },
  });

  const testSmsMutation = trpc.salonSettings.testSmsConnection.useMutation({
    onSuccess: () => {
      toast.success("Test-SMS sendt! Sjekk telefonen din.");
    },
    onError: (error) => {
      toast.error(error.message || "Kunne ikke sende test-SMS");
    },
  });

  // Populate form when data loads
  useEffect(() => {
    if (smsSettings) {
      setSmsPhoneNumber(smsSettings.smsPhoneNumber);
      setSmsProvider(smsSettings.smsProvider as any);
      setSmsApiKey(smsSettings.smsApiKey);
      setSmsApiSecret(smsSettings.smsApiSecret);
    }
  }, [smsSettings]);

  const handleSaveSmsSettings = () => {
    updateSmsMutation.mutate({
      smsPhoneNumber: smsPhoneNumber || undefined,
      smsProvider,
      smsApiKey: smsApiKey || undefined,
      smsApiSecret: smsApiSecret || undefined,
    });
  };

  const handleTestSms = () => {
    if (!testPhoneNumber) {
      toast.error("Vennligst skriv inn et telefonnummer for test");
      return;
    }
    testSmsMutation.mutate({ phoneNumber: testPhoneNumber });
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MessageSquare className="h-5 w-5" />
            SMS-innstillinger
          </CardTitle>
          <CardDescription>
            Konfigurer SMS-leverandør og avsendernummer for denne salonen
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* SMS Provider */}
          <div className="space-y-2">
            <Label htmlFor="smsProvider">SMS-leverandør</Label>
            <Select value={smsProvider} onValueChange={(value: any) => setSmsProvider(value)}>
              <SelectTrigger id="smsProvider">
                <SelectValue placeholder="Velg SMS-leverandør" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="mock">Mock (Test)</SelectItem>
                <SelectItem value="pswincom">PSWinCom</SelectItem>
                <SelectItem value="linkmobility">Link Mobility</SelectItem>
                <SelectItem value="twilio">Twilio</SelectItem>
              </SelectContent>
            </Select>
            <p className="text-sm text-muted-foreground">
              Velg "Mock" for testing uten å sende ekte SMS-er
            </p>
          </div>

          {/* SMS Phone Number */}
          <div className="space-y-2">
            <Label htmlFor="smsPhoneNumber">Avsendernummer</Label>
            <Input
              id="smsPhoneNumber"
              value={smsPhoneNumber}
              onChange={(e) => setSmsPhoneNumber(e.target.value)}
              placeholder="+4712345678"
            />
            <p className="text-sm text-muted-foreground">
              Telefonnummeret som vises som avsender i SMS-er til kunder (format: +47xxxxxxxx)
            </p>
          </div>

          {/* API Credentials (only show if not mock) */}
          {smsProvider !== "mock" && (
            <>
              <div className="space-y-2">
                <Label htmlFor="smsApiKey">API-nøkkel</Label>
                <Input
                  id="smsApiKey"
                  type="password"
                  value={smsApiKey}
                  onChange={(e) => setSmsApiKey(e.target.value)}
                  placeholder="Din API-nøkkel fra SMS-leverandøren"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="smsApiSecret">API-hemmelighet</Label>
                <Input
                  id="smsApiSecret"
                  type="password"
                  value={smsApiSecret}
                  onChange={(e) => setSmsApiSecret(e.target.value)}
                  placeholder="Din API-hemmelighet fra SMS-leverandøren"
                />
              </div>

              {/* Provider-specific help text */}
              <div className="rounded-lg bg-muted p-4 text-sm">
                <p className="font-medium mb-2">Slik får du API-tilgang:</p>
                {smsProvider === "pswincom" && (
                  <ul className="list-disc list-inside space-y-1 text-muted-foreground">
                    <li>Gå til <a href="https://www.pswin.com/" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">PSWinCom</a></li>
                    <li>Opprett en konto eller logg inn</li>
                    <li>Gå til API-innstillinger og generer en API-nøkkel</li>
                    <li>Kopier API-nøkkelen og passordet hit</li>
                  </ul>
                )}
                {smsProvider === "linkmobility" && (
                  <ul className="list-disc list-inside space-y-1 text-muted-foreground">
                    <li>Gå til <a href="https://www.linkmobility.com/" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">Link Mobility</a></li>
                    <li>Opprett en konto eller logg inn</li>
                    <li>Gå til API-innstillinger og generer en API-nøkkel</li>
                    <li>Kopier Platform ID og Partner ID hit</li>
                  </ul>
                )}
                {smsProvider === "twilio" && (
                  <ul className="list-disc list-inside space-y-1 text-muted-foreground">
                    <li>Gå til <a href="https://www.twilio.com/" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">Twilio</a></li>
                    <li>Opprett en konto eller logg inn</li>
                    <li>Gå til Console Dashboard</li>
                    <li>Kopier Account SID (API-nøkkel) og Auth Token (API-hemmelighet)</li>
                  </ul>
                )}
              </div>
            </>
          )}

          <Button 
            onClick={handleSaveSmsSettings}
            disabled={updateSmsMutation.isPending || isLoading}
            className="w-full"
          >
            {updateSmsMutation.isPending ? "Lagrer..." : "Lagre SMS-innstillinger"}
          </Button>
        </CardContent>
      </Card>

      {/* Test SMS */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Send className="h-5 w-5" />
            Test SMS-forbindelse
          </CardTitle>
          <CardDescription>
            Send en test-SMS for å bekrefte at innstillingene fungerer
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="testPhoneNumber">Telefonnummer for test</Label>
            <Input
              id="testPhoneNumber"
              value={testPhoneNumber}
              onChange={(e) => setTestPhoneNumber(e.target.value)}
              placeholder="+4712345678"
            />
            <p className="text-sm text-muted-foreground">
              Skriv inn et norsk mobilnummer for å motta test-SMS
            </p>
          </div>

          <Button 
            onClick={handleTestSms}
            disabled={testSmsMutation.isPending || !testPhoneNumber}
            variant="outline"
            className="w-full"
          >
            {testSmsMutation.isPending ? "Sender..." : "Send test-SMS"}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
