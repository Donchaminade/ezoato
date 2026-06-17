import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Bell, BellOff, Loader2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { DashboardSectionCard } from "@/components/dashboard/DashboardSectionCard";
import { Button } from "@/components/ui/button";
import { api } from "@/lib/api";
import { NOTIFICATIONS_QUERY_KEY } from "@/hooks/useNotifications";
import { isPushSupported, subscribeToPush, unsubscribeFromPush } from "@/lib/push-notifications";

export function NotificationSettings() {
  const qc = useQueryClient();
  const [pushLoading, setPushLoading] = useState(false);
  const browserPush = isPushSupported();

  const { data, isLoading } = useQuery({
    queryKey: NOTIFICATIONS_QUERY_KEY,
    queryFn: () => api.getNotificationConfig(),
  });

  const prefs = data?.preferences;

  async function togglePush(enabled: boolean) {
    setPushLoading(true);
    try {
      if (enabled) {
        if (!browserPush) {
          toast.error("Les notifications push ne sont pas supportées sur cet appareil.");
          return;
        }
        const permission = await Notification.requestPermission();
        if (permission !== "granted") {
          toast.error("Autorisation refusée. Active les notifications dans les réglages du navigateur.");
          return;
        }
        const vapid = data?.vapidPublicKey ?? import.meta.env.VITE_VAPID_PUBLIC_KEY;
        if (!vapid) {
          toast.error("Notifications push en cours de configuration côté serveur.");
          await api.updateNotificationPreferences({ pushEnabled: true });
          qc.invalidateQueries({ queryKey: NOTIFICATIONS_QUERY_KEY });
          return;
        }
        await subscribeToPush(vapid);
        toast.success("Notifications push activées");
      } else {
        await unsubscribeFromPush();
        toast.success("Notifications push désactivées");
      }
      qc.invalidateQueries({ queryKey: NOTIFICATIONS_QUERY_KEY });
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Échec");
    } finally {
      setPushLoading(false);
    }
  }

  if (isLoading || !prefs) {
    return <div className="h-32 animate-pulse rounded-xl bg-muted" />;
  }

  return (
    <div className="space-y-4">
      <DashboardSectionCard
        title="Notifications push"
        subtitle="Alertes navigateur — fonctionne en local sur localhost (même onglet ouvert ou fermé)"
      >
        <div className="flex items-center justify-between gap-3 rounded-xl border border-border bg-muted/30 px-3 py-3 sm:px-4">
          <div className="flex items-start gap-3">
            {prefs.pushEnabled ? (
              <Bell className="mt-0.5 size-4 text-primary" />
            ) : (
              <BellOff className="mt-0.5 size-4 text-muted-foreground" />
            )}
            <div>
              <p className="text-sm font-medium">Notifications push</p>
              <p className="text-xs text-muted-foreground">
                {browserPush
                  ? "Reçois des alertes même quand l'onglet est fermé."
                  : "Non disponible sur ce navigateur."}
              </p>
            </div>
          </div>
          <Button
            type="button"
            variant={prefs.pushEnabled ? "outline" : "default"}
            size="sm"
            className="shrink-0 rounded-lg"
            disabled={!browserPush || pushLoading}
            onClick={() => togglePush(!prefs.pushEnabled)}
          >
            {pushLoading && <Loader2 className="size-4 animate-spin" />}
            {prefs.pushEnabled ? "Désactiver" : "Activer"}
          </Button>
        </div>

        {!data?.vapidPublicKey && !import.meta.env.VITE_VAPID_PUBLIC_KEY && (
          <p className="mt-3 text-xs text-amber-700 dark:text-amber-400">
            Clés VAPID manquantes côté serveur. Exécutez{" "}
            <code className="rounded bg-muted px-1">npx web-push generate-vapid-keys</code> puis
            configurez <code className="rounded bg-muted px-1">config.local.php</code> et{" "}
            <code className="rounded bg-muted px-1">VITE_VAPID_PUBLIC_KEY</code> dans{" "}
            <code className="rounded bg-muted px-1">.env</code>.
          </p>
        )}

        {!data?.pushSupported && (
          <p className="mt-3 text-xs text-amber-700 dark:text-amber-400">
            La base push n&apos;est pas migrée. Exécutez{" "}
            <code className="rounded bg-muted px-1">migration-push-notifications.sql</code>.
          </p>
        )}
      </DashboardSectionCard>

      <DashboardSectionCard
        title="Boîte de réception"
        subtitle="Consulte tes alertes via l'icône cloche en haut de l'écran"
      >
        <p className="text-sm text-muted-foreground">
          Tes notifications (soumissions, paiements, retraits…) s&apos;affichent dans le panneau
          latéral accessible depuis l&apos;icône{" "}
          <Bell className="inline size-3.5 align-text-bottom text-primary" /> en haut à droite de
          chaque page du tableau de bord.
        </p>
      </DashboardSectionCard>
    </div>
  );
}
