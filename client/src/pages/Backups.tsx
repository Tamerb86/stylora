import { useState } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Database, Download, Trash2, AlertCircle, CheckCircle2, Clock } from "lucide-react";
import { format } from "date-fns";
import { nb } from "date-fns/locale";
import { toast } from "sonner";

export default function Backups() {
  const [isCreating, setIsCreating] = useState(false);

  const { data: backups, refetch } = trpc.backups.list.useQuery();
  const createBackup = trpc.backups.create.useMutation({
    onSuccess: () => {
      toast.success("Sikkerhetskopi opprettet!");
      setIsCreating(false);
      refetch();
    },
    onError: (error) => {
      toast.error(error.message || "Kunne ikke opprette sikkerhetskopi");
      setIsCreating(false);
    },
  });

  const deleteBackup = trpc.backups.delete.useMutation({
    onSuccess: () => {
      toast.success("Sikkerhetskopi slettet");
      refetch();
    },
    onError: (error) => {
      toast.error(error.message || "Kunne ikke slette sikkerhetskopi");
    },
  });

  const handleCreateBackup = () => {
    if (confirm("Er du sikker på at du vil opprette en sikkerhetskopi av databasen?")) {
      setIsCreating(true);
      createBackup.mutate();
    }
  };

  const handleDelete = (id: number, createdAt: Date) => {
    const dateStr = format(new Date(createdAt), "PPP 'kl.' HH:mm", { locale: nb });
    if (confirm(`Er du sikker på at du vil slette sikkerhetskopien fra ${dateStr}?`)) {
      deleteBackup.mutate({ id });
    }
  };

  const formatFileSize = (bytes?: number | null) => {
    if (!bytes) return "Ukjent størrelse";
    const mb = bytes / (1024 * 1024);
    if (mb < 1) {
      const kb = bytes / 1024;
      return `${kb.toFixed(1)} KB`;
    }
    return `${mb.toFixed(1)} MB`;
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "completed":
        return (
          <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400">
            <CheckCircle2 className="h-4 w-4" />
            Fullført
          </span>
        );
      case "failed":
        return (
          <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400">
            <AlertCircle className="h-4 w-4" />
            Feilet
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400">
            <Clock className="h-4 w-4" />
            Pågår
          </span>
        );
    }
  };

  const completedBackups = backups?.filter(b => b.status === "completed") || [];
  const totalSize = completedBackups.reduce((sum, b) => sum + (Number(b.fileSize) || 0), 0);

  return (
    <DashboardLayout>
    <div className="container py-8 max-w-6xl">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-4xl font-bold">Sikkerhetskopier</h1>
          <p className="text-muted-foreground mt-2">
            Administrer databasesikkerhetskopier
          </p>
        </div>
        <Button
          size="lg"
          className="h-14 gap-2"
          onClick={handleCreateBackup}
          disabled={isCreating || createBackup.isPending}
        >
          <Database className="h-5 w-5" />
          {isCreating || createBackup.isPending ? "Oppretter..." : "Opprett Sikkerhetskopi"}
        </Button>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-3 mb-8">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Totalt Antall
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{completedBackups.length}</div>
            <p className="text-xs text-muted-foreground mt-1">Fullførte sikkerhetskopier</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Størrelse
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{formatFileSize(totalSize)}</div>
            <p className="text-xs text-muted-foreground mt-1">Lagringsplass brukt</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Siste Sikkerhetskopi
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-lg font-bold">
              {completedBackups.length > 0
                ? format(new Date(completedBackups[0].createdAt), "PPP", { locale: nb })
                : "Ingen"}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {completedBackups.length > 0
                ? format(new Date(completedBackups[0].createdAt), "HH:mm", { locale: nb })
                : "Opprett din første sikkerhetskopi"}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Info Card */}
      <Card className="mb-6 border-blue-200 dark:border-blue-900/50 bg-blue-50 dark:bg-blue-900/10">
        <CardContent className="pt-6">
          <div className="flex gap-3">
            <AlertCircle className="h-5 w-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
            <div className="text-sm text-blue-900 dark:text-blue-100">
              <p className="font-semibold mb-2">Viktig informasjon om sikkerhetskopier:</p>
              <ul className="list-disc list-inside space-y-1 text-blue-800 dark:text-blue-200">
                <li>Sikkerhetskopier lagres sikkert i skyen (S3)</li>
                <li>Opprett sikkerhetskopi før viktige oppdateringer eller endringer</li>
                <li>Gamle sikkerhetskopier slettes ikke automatisk - administrer manuelt</li>
                <li>Nedlasting av sikkerhetskopier er tilgjengelig via S3-lenken</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Backups List */}
      <Card>
        <CardHeader>
          <CardTitle>Tilgjengelige Sikkerhetskopier</CardTitle>
          <CardDescription>
            Alle databasesikkerhetskopier sortert etter dato
          </CardDescription>
        </CardHeader>
        <CardContent>
          {!backups || backups.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <Database className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p className="text-lg">Ingen sikkerhetskopier ennå</p>
              <p className="text-sm mt-2">Klikk "Opprett Sikkerhetskopi" for å komme i gang</p>
            </div>
          ) : (
            <div className="space-y-3">
              {backups.map((backup: any) => (
                <div
                  key={backup.id}
                  className="flex items-center justify-between p-4 border rounded-lg hover:bg-accent/50 transition-colors"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <Database className="h-5 w-5 text-muted-foreground" />
                      <span className="font-semibold">
                        {format(new Date(backup.createdAt), "PPP 'kl.' HH:mm", { locale: nb })}
                      </span>
                      {getStatusBadge(backup.status)}
                      {backup.backupType === "manual" && (
                        <span className="px-2 py-1 rounded text-xs bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400">
                          Manuell
                        </span>
                      )}
                    </div>

                    <div className="text-sm text-muted-foreground">
                      Størrelse: {formatFileSize(backup.fileSize)}
                    </div>

                    {backup.status === "failed" && backup.errorMessage && (
                      <div className="text-sm mt-2 text-red-600 dark:text-red-400">
                        Feil: {backup.errorMessage}
                      </div>
                    )}

                    {backup.status === "completed" && backup.fileKey && (
                      <div className="text-xs mt-2 text-muted-foreground font-mono truncate max-w-md">
                        {backup.fileKey}
                      </div>
                    )}
                  </div>

                  <div className="flex gap-2 ml-6">
                    {backup.status === "completed" && (
                      <Button
                        variant="outline"
                        size="icon"
                        className="h-10 w-10"
                        onClick={() => {
                          // Note: In a real implementation, you would get a signed download URL from the backend
                          toast.info("Kontakt support for nedlasting av sikkerhetskopi");
                        }}
                        title="Last ned sikkerhetskopi"
                      >
                        <Download className="h-5 w-5" />
                      </Button>
                    )}
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-10 w-10 text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20"
                      onClick={() => handleDelete(backup.id, backup.createdAt)}
                      disabled={deleteBackup.isPending}
                    >
                      <Trash2 className="h-5 w-5" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
    </DashboardLayout>
  );
}
