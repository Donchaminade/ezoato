import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { PenLine } from "lucide-react";
import { toast } from "sonner";
import { AuthGate } from "@/components/account/AuthGate";
import { UserDashboardShell } from "@/components/dashboard/UserDashboardShell";
import { PageHeroBadge } from "@/components/layout/PageHeroBadge";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { correctionsApi, STATUT_LABEL } from "@/lib/corrections-api";

export const Route = createFileRoute("/corrections/correcteur")({
  head: () => ({ meta: [{ title: "Espace correcteur — EZOA-TO" }] }),
  component: Page,
});

function Page() {
  return (
    <AuthGate
      badge={<PageHeroBadge icon={PenLine}>Correcteur</PageHeroBadge>}
      title="Espace correcteur"
      description="Connecte-toi pour suivre tes corrections."
    >
      <Espace />
    </AuthGate>
  );
}

function Espace() {
  const qc = useQueryClient();
  const profil = useQuery({ queryKey: ["correcteur-profil"], queryFn: () => correctionsApi.profil() });
  const demandes = useQuery({ queryKey: ["correcteur-demandes"], queryFn: () => correctionsApi.correcteurDemandes() });
  const [textes, setTextes] = useState<Record<string, string>>({});

  async function deposer(id: string) {
    try {
      await correctionsApi.deposer(id, textes[id] ?? "");
      toast.success("Correction déposée. Elle passe par les validateurs.");
      qc.invalidateQueries({ queryKey: ["correcteur-demandes"] });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Dépôt impossible");
    }
  }

  const statut = profil.data?.profil?.statut;

  return (
    <UserDashboardShell title="Espace correcteur" subtitle="Demandes qui te sont assignées" activeSection="correcteur" onRefresh={() => { profil.refetch(); demandes.refetch(); }}>
      <div className="mb-4 flex flex-wrap items-center gap-3">
        <Badge variant="secondary">{statut ? `Profil ${statut}` : "Pas encore candidat"}</Badge>
        <Button asChild variant="outline"><Link to="/corrections/candidature">Déposer une candidature</Link></Button>
      </div>
      <ul className="space-y-4">
        {(demandes.data ?? []).map((demande) => (
          <li key={demande.id} className="rounded-2xl border border-border bg-card p-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h2 className="font-display font-semibold">{demande.epreuveTitre}</h2>
              <Badge>{STATUT_LABEL[demande.statut] ?? demande.statut}</Badge>
            </div>
            <p className="mt-1 text-sm text-muted-foreground">
              {demande.matiere} · {demande.exercices.join(", ")}
              {demande.echeanceLe ? ` · échéance ${new Date(demande.echeanceLe).toLocaleString("fr-FR")}` : ""}
            </p>
            {demande.blocageTexte && <p className="mt-3 whitespace-pre-wrap text-sm">{demande.blocageTexte}</p>}
            {demande.transcription && <p className="mt-2 text-sm text-muted-foreground">Audio transcrit : {demande.transcription}</p>}
            {demande.statut === "assignee" && (
              <div className="mt-3 space-y-2">
                <Textarea
                  rows={6}
                  value={textes[demande.id] ?? ""}
                  onChange={(e) => setTextes((prev) => ({ ...prev, [demande.id]: e.target.value }))}
                  placeholder="Correction commentée : démarche, puis résultat justifié."
                />
                <Button type="button" onClick={() => deposer(demande.id)}>Déposer la correction</Button>
              </div>
            )}
          </li>
        ))}
        {(demandes.data ?? []).length === 0 && <li className="text-sm text-muted-foreground">Aucune demande assignée.</li>}
      </ul>
    </UserDashboardShell>
  );
}
