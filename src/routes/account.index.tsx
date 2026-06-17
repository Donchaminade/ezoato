import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { User } from "lucide-react";
import { AuthGate } from "@/components/account/AuthGate";
import { PageHeroBadge } from "@/components/layout/PageHeroBadge";
import { UserDashboardShell } from "@/components/dashboard/UserDashboardShell";
import { UserOverview } from "@/components/dashboard/UserOverview";
import { useAuth } from "@/lib/auth";
import { api } from "@/lib/api";
import { roleLabel } from "@/lib/roles";

export const Route = createFileRoute("/account/")({
  head: () => ({ meta: [{ title: "Mon compte — EZOA-TO" }] }),
  component: AccountPage,
});

function AccountPage() {
  return (
    <AuthGate
      badge={<PageHeroBadge icon={User}>Mon espace</PageHeroBadge>}
      title="Mon compte"
      description="Connecte-toi pour gérer tes téléchargements, soumissions et ton portefeuille contributeur."
    >
      <AccountDashboard />
    </AuthGate>
  );
}

function AccountDashboard() {
  const { user } = useAuth();

  if (!user) return null;

  const { data: wallet } = useQuery({
    queryKey: ["wallet"],
    queryFn: () => api.getWallet(),
  });
  const { data: library } = useQuery({
    queryKey: ["my-library"],
    queryFn: () => api.getMyLibrary(),
  });
  const { data: soumissions } = useQuery({
    queryKey: ["my-soumissions"],
    queryFn: () => api.getMySoumissions(),
  });

  const list = soumissions ?? [];
  const validees = list.filter((s) => s.statut === "validee").length;
  const enAttente = list.filter((s) => s.statut === "en_attente").length;
  const rejetees = list.filter((s) => s.statut === "rejetee").length;

  return (
    <UserDashboardShell
      title={`Bonjour, ${user.nom}`}
      subtitle={`${roleLabel(user.role)}${user.ville ? ` · ${user.ville}` : ""}`}
      activeSection="overview"
    >
      <UserOverview
        soumissions={list}
        libraryPaid={library?.paid ?? []}
        libraryFree={library?.free ?? []}
        wallet={wallet}
        enAttente={enAttente}
        validees={validees}
        rejetees={rejetees}
        progressionPalier={wallet?.progressionPalier ?? 0}
      />
    </UserDashboardShell>
  );
}
