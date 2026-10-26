import { pageHead } from "@/lib/seo";
import { createFileRoute } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { Wallet } from "lucide-react";
import { AuthGate } from "@/components/account/AuthGate";
import { ContributorWalletPanel } from "@/components/contributor/ContributorWalletPanel";
import { UserDashboardShell } from "@/components/dashboard/UserDashboardShell";
import { PageHeroBadge } from "@/components/layout/PageHeroBadge";
import { formatFcfa, EPREUVES_PAR_RECOMPENSE, MONTANT_RECOMPENSE } from "@/lib/pricing";

export const Route = createFileRoute("/account/portefeuille")({
  head: () =>
    pageHead({
      path: "/account/portefeuille",
      title: "Mon portefeuille contributeur — Récompenses EZOA-TO",
      description:
        "Consulte ton solde de contributeur EZOA-TO, l'historique de tes récompenses et demande un retrait par Mobile Money en quelques clics.",
    }),
  component: PortefeuillePage,
});

function PortefeuillePage() {
  return (
    <AuthGate
      badge={<PageHeroBadge icon={Wallet}>Portefeuille</PageHeroBadge>}
      title="Mon portefeuille"
      description="Connecte-toi pour consulter ton solde, tes récompenses et demander un retrait."
    >
      <PortefeuilleContent />
    </AuthGate>
  );
}

function PortefeuilleContent() {
  const qc = useQueryClient();

  return (
    <UserDashboardShell
      title="Mon portefeuille"
      subtitle={`${EPREUVES_PAR_RECOMPENSE} épreuves validées = ${formatFcfa(MONTANT_RECOMPENSE)}`}
      activeSection="portefeuille"
      onRefresh={() => qc.invalidateQueries({ queryKey: ["wallet"] })}
    >
      <ContributorWalletPanel onRefresh={() => qc.invalidateQueries({ queryKey: ["wallet"] })} />
    </UserDashboardShell>
  );
}
