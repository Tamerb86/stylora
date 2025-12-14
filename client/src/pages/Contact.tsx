import React, { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Mail, Phone, MapPin, Send, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";
import Footer from "@/components/Footer";

const TENANT_ID = "goeasychargeco@gmail.com"; // Hardcoded for demo

export default function Contact() {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    subject: "",
    message: "",
  });
  const [submitted, setSubmitted] = useState(false);

  const submitMutation = trpc.contact.submit.useMutation({
    onSuccess: () => {
      setSubmitted(true);
      setFormData({ name: "", email: "", phone: "", subject: "", message: "" });
      toast.success("Melding sendt!", {
        description: "Vi vil svare deg så snart som mulig.",
      });
    },
    onError: (error) => {
      toast.error("Feil ved sending", {
        description: error.message,
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    submitMutation.mutate({
      tenantId: TENANT_ID,
      ...formData,
    });
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  if (submitted) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-orange-50 flex items-center justify-center p-4">
        <Card className="max-w-md w-full text-center shadow-2xl">
          <CardHeader>
            <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
              <CheckCircle2 className="w-10 h-10 text-green-600" />
            </div>
            <CardTitle className="text-2xl">Takk for din melding!</CardTitle>
            <CardDescription className="text-base mt-2">
              Vi har mottatt din henvendelse og vil svare deg så snart som mulig.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button
              onClick={() => setSubmitted(false)}
              variant="outline"
              className="w-full"
            >
              Send en ny melding
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <>
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-orange-50">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-orange-500 text-white py-16 shadow-xl">
          <div className="container max-w-6xl">
            <h1 className="text-4xl md:text-5xl font-bold mb-4">Kontakt oss</h1>
            <p className="text-xl opacity-90">
              Vi er her for å hjelpe deg. Send oss en melding så svarer vi så snart som mulig.
            </p>
          </div>
        </div>

        {/* Content */}
        <div className="container max-w-6xl py-12 px-4">
          <div className="grid md:grid-cols-2 gap-8">
            {/* Contact Form */}
            <Card className="shadow-xl">
              <CardHeader>
                <CardTitle className="text-2xl">Send oss en melding</CardTitle>
                <CardDescription>
                  Fyll ut skjemaet under så tar vi kontakt med deg.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">
                      Navn <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id="name"
                      name="name"
                      value={formData.name}
                      onChange={handleChange}
                      placeholder="Ditt fulle navn"
                      required
                      disabled={submitMutation.isPending}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="email">
                      E-post <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id="email"
                      name="email"
                      type="email"
                      value={formData.email}
                      onChange={handleChange}
                      placeholder="din@epost.no"
                      required
                      disabled={submitMutation.isPending}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="phone">Telefon</Label>
                    <Input
                      id="phone"
                      name="phone"
                      type="tel"
                      value={formData.phone}
                      onChange={handleChange}
                      placeholder="+47 123 45 678"
                      disabled={submitMutation.isPending}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="subject">Emne</Label>
                    <Input
                      id="subject"
                      name="subject"
                      value={formData.subject}
                      onChange={handleChange}
                      placeholder="Hva gjelder henvendelsen?"
                      disabled={submitMutation.isPending}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="message">
                      Melding <span className="text-red-500">*</span>
                    </Label>
                    <Textarea
                      id="message"
                      name="message"
                      value={formData.message}
                      onChange={handleChange}
                      placeholder="Skriv din melding her..."
                      rows={6}
                      required
                      disabled={submitMutation.isPending}
                      className="resize-none"
                    />
                  </div>

                  <Button
                    type="submit"
                    className="w-full bg-gradient-to-r from-blue-600 to-orange-500 hover:from-blue-700 hover:to-orange-600 text-white"
                    disabled={submitMutation.isPending}
                  >
                    {submitMutation.isPending ? (
                      <>
                        <span className="animate-spin mr-2">⏳</span>
                        Sender...
                      </>
                    ) : (
                      <>
                        <Send className="w-4 h-4 mr-2" />
                        Send melding
                      </>
                    )}
                  </Button>
                </form>
              </CardContent>
            </Card>

            {/* Contact Information */}
            <div className="space-y-6">
              <Card className="shadow-lg">
                <CardHeader>
                  <CardTitle className="text-xl">Kontaktinformasjon</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-start gap-3">
                    <div className="bg-blue-100 p-3 rounded-lg">
                      <Mail className="w-5 h-5 text-blue-600" />
                    </div>
                    <div>
                      <p className="font-semibold">E-post</p>
                      <p className="text-muted-foreground">kontakt@stylora.no</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <div className="bg-orange-100 p-3 rounded-lg">
                      <Phone className="w-5 h-5 text-orange-600" />
                    </div>
                    <div>
                      <p className="font-semibold">Telefon</p>
                      <p className="text-muted-foreground">+47 123 45 678</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <div className="bg-green-100 p-3 rounded-lg">
                      <MapPin className="w-5 h-5 text-green-600" />
                    </div>
                    <div>
                      <p className="font-semibold">Adresse</p>
                      <p className="text-muted-foreground">
                        Eksempelveien 123<br />
                        0123 Oslo, Norge
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="shadow-lg bg-gradient-to-br from-blue-50 to-orange-50">
                <CardHeader>
                  <CardTitle className="text-xl">Åpningstider</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <div className="flex justify-between">
                    <span className="font-medium">Mandag - Fredag:</span>
                    <span className="text-muted-foreground">09:00 - 17:00</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="font-medium">Lørdag:</span>
                    <span className="text-muted-foreground">10:00 - 14:00</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="font-medium">Søndag:</span>
                    <span className="text-muted-foreground">Stengt</span>
                  </div>
                </CardContent>
              </Card>

              <Card className="shadow-lg border-2 border-blue-200">
                <CardContent className="pt-6">
                  <p className="text-sm text-muted-foreground">
                    <strong>Responstid:</strong> Vi svarer vanligvis innen 24 timer på hverdager.
                    For akutte saker, vennligst ring oss direkte.
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
      <Footer />
    </>
  );
}
