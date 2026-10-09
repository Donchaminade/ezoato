import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { ShieldCheck } from "lucide-react";
import { toast } from "sonner";
import { AuthGate } from "@/components/account/AuthGate";
import { UserDashboardShell } from "@/components/dashboard/UserDashboardShell";
import { PageHeroBadge } from "@/components/layout/PageHeroBadge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { correctionsApi } from "@/lib/corrections-api";

export const Route = createFileRoute("/corrections/validateur")({
  head: () => ({ meta: [{ title: "Espace validateur — EZOA-TO" }] }),
  component: Page,
});

function Page() {
  return (
    <AuthGate
      badge={<PageHeroBadge icon={ShieldCheck}>Revue</PageHeroBadge>}
      title="Espace validateur"
      description="Connecte-toi pour relire les corrections."
    >
      <File />
    </AuthGate>
  );
}

function File() {
  const qc = useQueryClient();
  const file = useQuery({ queryKey: ["validateur-file"], queryFn: () => correctionsApi.fileValidateur() });
  const [notes, setNotes] = useState<Record<string, string>>({});
  const [suites, setSuites] = useState<Record<string, string>>({});

  async function decider(correctionId: string, decision: "approuvee" | "rejetee") {
    try {
      await correctionsApi.revue(correctionId, decision, notes[correctionId] ?? "", suites[correctionId] ?? "renvoyer");
      toast.success(decision === "approuvee" ? "Correction approuvée" : "Correction renvoyée");
      qc.invalidateQueries({ queryKey: ["validateur-file"] });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Revue impossible");
    }
  }

  return (
    <UserDashboardShell title="Revues" subtitle="Tu ne peux pas valider ta propre correction" activeSection="validateur" onRefresh={() => file.refetch()}>
      {file.isError && <p className="text-sm text-destructive">{file.error instanceof Error ? file.error.message : "File indisponible"}</p>}
      <ul className="space-y-4">
        {(file.data ?? []).map((demande) => {
          const correctionId = demande.correction?.id;
          if (!correctionId) return null;
          return (
            <li key={demande.id} className="rounded-2xl border border-border bg-card p-4">
              <h2 className="font-display font-semibold">{demande.epreuveTitre}</h2>
              <p className="text-sm text-muted-foreground">{demande.exercices.join(", ")} · blocage : {demande.blocageTexte}</p>
              {demande.divergence?.signalee && (
                <p className="mt-2 text-sm text-destructive">{demande.divergence.note}</p>
              )}
              <pre className="mt-3 whitespace-pre-wrap rounded-xl bg-muted/40 p-3 text-sm">{demande.correction?.contenu}</pre>
              {(demande.comparaison ?? []).length > 0 && (
                <div className="mt-3 text-sm">
                  <p className="font-medium">Autres corrections du même exercice</p>
                  {demande.comparaison!.map((texte, index) => (
                    <pre key={index} className="mt-2 whitespace-pre-wrap rounded-xl border border-border p-3">{texte}</pre>
                  ))}
                </div>
              )}
              <Textarea className="mt-3" rows={3} placeholder="Commentaire de revue" value={notes[correctionId] ?? ""} onChange={(e) => setNotes((p) => ({ ...p, [correctionId]: e.target.value }))} />
              <label className="mt-2 block text-sm">
                Si tu rejettes
                <select className="mt-1 w-full rounded-xl border border-border bg-background px-3 py-2" value={suites[correctionId] ?? "renvoyer"} onChange={(e) => setSuites((p) => ({ ...p, [correctionId]: e.target.value }))}>
                  <option value="renvoyer">Renvoyer au même correcteur</option>
                  <option value="reassigner">Renvoyer à l'administration</option>
                </select>
              </label>
              <div className="mt-3 flex gap-2">
                <Button type="button" onClick={() => decider(correctionId, "approuvee")}>Approuver</Button>
                <Button type="button" variant="outline" onClick={() => decider(correctionId, "rejetee")}>Rejeter</Button>
              </div>
            </li>
          );
        })}
        {!file.isLoading && (file.data ?? []).length === 0 && <li className="text-sm text-muted-foreground">Aucune revue en attente.</li>}
      </ul>
    </UserDashboardShell>
  );
}
