import { useState, useEffect } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Loader2, CreditCard, CheckCircle2, XCircle, RefreshCw } from "lucide-react";
import DashboardLayout from "@/components/DashboardLayout";

export default function ReaderManagement() {
  const [isConnecting, setIsConnecting] = useState(false);
  const [terminal, setTerminal] = useState<any>(null);
  const [discoveredReaders, setDiscoveredReaders] = useState<any[]>([]);
  const [connectedReader, setConnectedReader] = useState<any>(null);

  // Get connection token from backend
  const connectionTokenMutation = trpc.stripeTerminal.createConnectionToken.useMutation();

  // List registered readers from Stripe account
  const { data: registeredReaders, isLoading: loadingReaders, refetch: refetchReaders } = 
    trpc.stripeTerminal.listReaders.useQuery({});

  // Initialize Stripe Terminal SDK
  useEffect(() => {
    const initializeTerminal = async () => {
      try {
        // @ts-ignore - Stripe Terminal SDK loaded via script tag
        if (typeof StripeTerminal === "undefined") {
          console.error("Stripe Terminal SDK not loaded");
          return;
        }

        // @ts-ignore
        const terminal = StripeTerminal.create({
          onFetchConnectionToken: async () => {
            const result = await connectionTokenMutation.mutateAsync({});
            return result.secret;
          },
          onUnexpectedReaderDisconnect: () => {
            toast.error("قارئ البطاقات انقطع بشكل غير متوقع", {
              description: "يرجى إعادة الاتصال",
            });
            setConnectedReader(null);
          },
        });

        setTerminal(terminal);
        console.log("Stripe Terminal initialized");
      } catch (error) {
        console.error("Error initializing Stripe Terminal:", error);
        toast.error("فشل تهيئة نظام البطاقات", {
          description: "يرجى التحقق من إعدادات Stripe",
        });
      }
    };

    initializeTerminal();
  }, []);

  // Discover readers
  const discoverReaders = async () => {
    if (!terminal) {
      toast.error("نظام البطاقات غير جاهز", {
        description: "يرجى الانتظار قليلاً وإعادة المحاولة",
      });
      return;
    }

    setIsConnecting(true);
    setDiscoveredReaders([]);

    try {
      const config = {
        simulated: true, // Set to false for real readers
        location: undefined,
      };

      const discoverResult = await terminal.discoverReaders(config);

      if (discoverResult.error) {
        console.error("Discover error:", discoverResult.error);
        toast.error("فشل البحث عن قارئات البطاقات", {
          description: discoverResult.error.message,
        });
      } else {
        setDiscoveredReaders(discoverResult.discoveredReaders);
        if (discoverResult.discoveredReaders.length === 0) {
          toast.info("لم يتم العثور على قارئات بطاقات", {
            description: "تأكد من تشغيل القارئ واتصاله بالشبكة",
          });
        } else {
          toast.success(`تم العثور على ${discoverResult.discoveredReaders.length} قارئ`);
        }
      }
    } catch (error: any) {
      console.error("Error discovering readers:", error);
      toast.error("خطأ في البحث عن القارئات", {
        description: error.message || "حدث خطأ غير متوقع",
      });
    } finally {
      setIsConnecting(false);
    }
  };

  // Connect to a reader
  const connectToReader = async (reader: any) => {
    if (!terminal) {
      toast.error("نظام البطاقات غير جاهز");
      return;
    }

    setIsConnecting(true);

    try {
      const connectResult = await terminal.connectReader(reader);

      if (connectResult.error) {
        console.error("Connect error:", connectResult.error);
        toast.error("فشل الاتصال بالقارئ", {
          description: connectResult.error.message,
        });
      } else {
        setConnectedReader(connectResult.reader);
        toast.success("تم الاتصال بالقارئ بنجاح", {
          description: `متصل بـ: ${reader.label || reader.id}`,
        });
      }
    } catch (error: any) {
      console.error("Error connecting to reader:", error);
      toast.error("خطأ في الاتصال", {
        description: error.message || "حدث خطأ غير متوقع",
      });
    } finally {
      setIsConnecting(false);
    }
  };

  // Disconnect from reader
  const disconnectReader = async () => {
    if (!terminal) return;

    try {
      await terminal.disconnectReader();
      setConnectedReader(null);
      toast.success("تم قطع الاتصال بالقارئ");
    } catch (error: any) {
      console.error("Error disconnecting reader:", error);
      toast.error("فشل قطع الاتصال", {
        description: error.message,
      });
    }
  };

  return (
    <DashboardLayout>
      <div className="container mx-auto py-8">
        <div className="mb-6">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-orange-500 bg-clip-text text-transparent">
            إدارة قارئ البطاقات
          </h1>
          <p className="text-muted-foreground mt-1">
            اتصل بقارئ البطاقات لمعالجة المدفوعات
          </p>
        </div>

        {/* Connection Status */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CreditCard className="h-5 w-5" />
              حالة الاتصال
            </CardTitle>
            <CardDescription>
              حالة الاتصال الحالية بقارئ البطاقات
            </CardDescription>
          </CardHeader>
          <CardContent>
            {connectedReader ? (
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <CheckCircle2 className="h-6 w-6 text-green-500" />
                  <div>
                    <p className="font-medium">متصل</p>
                    <p className="text-sm text-muted-foreground">
                      {connectedReader.label || connectedReader.id}
                    </p>
                  </div>
                </div>
                <Button
                  variant="outline"
                  onClick={disconnectReader}
                >
                  قطع الاتصال
                </Button>
              </div>
            ) : (
              <div className="flex items-center gap-3">
                <XCircle className="h-6 w-6 text-gray-400" />
                <div>
                  <p className="font-medium">غير متصل</p>
                  <p className="text-sm text-muted-foreground">
                    لا يوجد قارئ بطاقات متصل حالياً
                  </p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Discover Readers */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>البحث عن قارئات البطاقات</CardTitle>
            <CardDescription>
              ابحث عن قارئات البطاقات المتاحة على الشبكة
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button
              onClick={discoverReaders}
              disabled={isConnecting || !terminal}
              className="mb-4"
            >
              {isConnecting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  جاري البحث...
                </>
              ) : (
                <>
                  <RefreshCw className="mr-2 h-4 w-4" />
                  بحث عن قارئات
                </>
              )}
            </Button>

            {discoveredReaders.length > 0 && (
              <div className="space-y-3">
                <p className="text-sm font-medium">
                  القارئات المكتشفة ({discoveredReaders.length}):
                </p>
                {discoveredReaders.map((reader) => (
                  <Card key={reader.id}>
                    <CardContent className="pt-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium">
                            {reader.label || "قارئ بدون اسم"}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            {reader.device_type} - {reader.id}
                          </p>
                          <Badge
                            variant={reader.status === "online" ? "default" : "secondary"}
                            className="mt-2"
                          >
                            {reader.status}
                          </Badge>
                        </div>
                        <Button
                          onClick={() => connectToReader(reader)}
                          disabled={isConnecting || connectedReader?.id === reader.id}
                        >
                          {connectedReader?.id === reader.id ? "متصل" : "اتصال"}
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Registered Readers */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>القارئات المسجلة</span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => refetchReaders()}
                disabled={loadingReaders}
              >
                {loadingReaders ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <RefreshCw className="h-4 w-4" />
                )}
              </Button>
            </CardTitle>
            <CardDescription>
              جميع القارئات المسجلة في حساب Stripe الخاص بك
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loadingReaders ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin" />
              </div>
            ) : registeredReaders && registeredReaders.length > 0 ? (
              <div className="space-y-3">
                {registeredReaders.map((reader: any) => (
                  <Card key={reader.id}>
                    <CardContent className="pt-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium">
                            {reader.label || "قارئ بدون اسم"}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            {reader.device_type} - {reader.serial_number || reader.id}
                          </p>
                          {reader.ip_address && (
                            <p className="text-xs text-muted-foreground mt-1">
                              IP: {reader.ip_address}
                            </p>
                          )}
                          <Badge
                            variant={reader.status === "online" ? "default" : "secondary"}
                            className="mt-2"
                          >
                            {reader.status}
                          </Badge>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <p className="text-center text-muted-foreground py-8">
                لا توجد قارئات مسجلة
              </p>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
