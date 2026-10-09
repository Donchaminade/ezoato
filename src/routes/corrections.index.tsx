import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { PenLine } from "lucide-react";
import { AuthGate } from "@/components/account/AuthGate";
import { UserDashboardShell } from "@/components/dashboard/UserDashboardShell";
import { PageHeroBadge } from "@/components/layout/PageHeroBadge";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { correctionsApi, STATUT_LABEL } from "@/lib/corrections-api";

export const Route = createFileRoute("/corrections/")({
  head: () => ({ meta: [{ title: "Mes demandes de correction — EZOA-TO" }] }),
  component: Page,
});

function Page() {
  return (
    <AuthGate
      badge={<PageHeroBadge icon={PenLine}>Correction</PageHeroBadge>}
      title="Demandes de correction"
      description="Connecte-toi pour demander une aide sur une épreuve du catalogue."
    >
      <Liste />
    </AuthGate>
  );
}

function Liste() {
  const { data, refetch, isLoading } = useQuery({
    queryKey: ["corrections-mes-demandes"],
    queryFn: () => correctionsApi.mesDemandes(),
  });
  return (
    <UserDashboardShell
      title="Mes demandes"
      subtitle="Suivi des aides demandées sur les épreuves"
      activeSection="corrections"
      onRefresh={() => refetch()}
      actions={
        <Button asChild>
          <Link to="/corrections/nouvelle">Nouvelle demande</Link>
        </Button>
      }
    >
      {isLoading && <p className="text-sm text-muted-foreground">Chargement…</p>}
      <ul className="space-y-3">
        {(data ?? []).map((demande) => (
          <li key={demande.id} className="rounded-2xl border border-border bg-card p-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <Link to="/corrections/$id" params={{ id: demande.id }} className="font-display font-semibold">
                {demande.epreuveTitre || "Épreuve"}
              </Link>
              <Badge variant="secondary">{STATUT_LABEL[demande.statut] ?? demande.statut}</Badge>
            </div>
            <p className="mt-1 text-sm text-muted-foreground">
              {demande.matiere} · exercices {demande.exercices.join(", ")}
            </p>
          </li>
        ))}
        {!isLoading && (data ?? []).length === 0 && (
          <li className="rounded-2xl border border-dashed border-border p-6 text-sm text-muted-foreground">
            Aucune demande pour le moment.
          </li>
        )}
      </ul>
    </UserDashboardShell>
  );
}
