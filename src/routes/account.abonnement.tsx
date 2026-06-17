import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Crown } from "lucide-react";
import { AuthGate } from "@/components/account/AuthGate";
import { UserDashboardShell } from "@/components/dashboard/UserDashboardShell";
import { PageHeroBadge } from "@/components/layout/PageHeroBadge";
import { SubscriptionPanel } from "@/components/subscription/SubscriptionPanel";
import { api } from "@/lib/api";
import {
  SUBSCRIPTION_DURATION_MONTHS,
  SUBSCRIPTION_PRICE,
} from "@/lib/subscription-constants";
import { formatFcfa } from "@/lib/pricing";

export const Route = createFileRoute("/account/abonnement")({
  head: () => ({ meta: [{ title: "Abonnement Pro — EZOA-TO" }] }),
  component: AbonnementPage,
});

function AbonnementPage() {
  return (
    <AuthGate
      badge={<PageHeroBadge icon={Crown}>Abonnement Pro</PageHeroBadge>}
      title="Abonnement Pro"
      description="Connecte-toi pour gérer ton abonnement et débloquer toutes les épreuves payantes."
    >
      <AbonnementContent />
    </AuthGate>
  );
}

function AbonnementContent() {
  const { data: status, isLoading, refetch } = useQuery({
    queryKey: ["subscription-status"],
    queryFn: () => api.getSubscriptionStatus(),
  });

  return (
    <UserDashboardShell
      title="Abonnement Pro"
      subtitle={`${formatFcfa(SUBSCRIPTION_PRICE)} / ${SUBSCRIPTION_DURATION_MONTHS} mois — accès illimité`}
      activeSection="abonnement"
      onRefresh={() => refetch()}
    >
      {isLoading || !status ? (
        <div className="rounded-xl border border-border bg-card p-8 text-center text-sm text-muted-foreground">
          Chargement…
        </div>
      ) : (
        <SubscriptionPanel status={status} />
      )}
    </UserDashboardShell>
  );
}
