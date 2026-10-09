import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { PenLine } from "lucide-react";
import { toast } from "sonner";
import { AuthGate } from "@/components/account/AuthGate";
import { UserDashboardShell } from "@/components/dashboard/UserDashboardShell";
import { PageHeroBadge } from "@/components/layout/PageHeroBadge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { correctionsApi } from "@/lib/corrections-api";

export const Route = createFileRoute("/corrections/candidature")({
  head: () => ({ meta: [{ title: "Devenir correcteur — EZOA-TO" }] }),
  component: Page,
});

function Page() {
  return (
    <AuthGate
      badge={<PageHeroBadge icon={PenLine}>Correcteur</PageHeroBadge>}
      title="Devenir correcteur"
      description="Connecte-toi pour déposer ta candidature."
    >
      <Formulaire />
    </AuthGate>
  );
}

function Formulaire() {
  const [qualite, setQualite] = useState("enseignant");
  const [matieres, setMatieres] = useState("Mathématiques");
  const [niveaux, setNiveaux] = useState("college");
  const [piece, setPiece] = useState<File | null>(null);
  const [preuve, setPreuve] = useState<File | null>(null);
  const [busy, setBusy] = useState(false);

  async function envoyer(e: React.FormEvent) {
    e.preventDefault();
    if (!piece || !preuve) {
      toast.error("La pièce d'identité et la preuve d'enseignement sont obligatoires.");
      return;
    }
    setBusy(true);
    try {
      const fd = new FormData();
      fd.append("qualite", qualite);
      fd.append("matieres", JSON.stringify(matieres.split(",").map((s) => s.trim()).filter(Boolean)));
      fd.append("niveaux", JSON.stringify(niveaux.split(",").map((s) => s.trim()).filter(Boolean)));
      fd.append("piece_identite", piece);
      fd.append("preuve_enseignement", preuve);
      await correctionsApi.candidater(fd);
      toast.success("Candidature envoyée. L'administration la valide.");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Envoi impossible");
    } finally {
      setBusy(false);
    }
  }

  return (
    <UserDashboardShell title="Candidature correcteur" subtitle="Enseignant ou répétiteur" activeSection="correcteur">
      <form onSubmit={envoyer} className="mx-auto max-w-xl space-y-4">
        <p className="text-sm text-muted-foreground">
          Deux fichiers sont exigés : une pièce d'identité et une preuve d'enseignement. Le paiement, après validation des corrections, passe par le portefeuille existant.
        </p>
        <label className="block text-sm font-medium">
          Qualité
          <select className="mt-1 w-full rounded-xl border border-border bg-background px-3 py-2" value={qualite} onChange={(e) => setQualite(e.target.value)}>
            <option value="enseignant">Enseignant</option>
            <option value="repetiteur">Répétiteur</option>
          </select>
        </label>
        <label className="block text-sm font-medium">
          Matières (séparées par des virgules)
          <Input className="mt-1" value={matieres} onChange={(e) => setMatieres(e.target.value)} />
        </label>
        <label className="block text-sm font-medium">
          Niveaux (college, lycee, universite, concours)
          <Input className="mt-1" value={niveaux} onChange={(e) => setNiveaux(e.target.value)} />
        </label>
        <label className="block text-sm font-medium">
          Pièce d'identité
          <Input className="mt-1" type="file" accept="image/*,application/pdf" onChange={(e) => setPiece(e.target.files?.[0] ?? null)} />
        </label>
        <label className="block text-sm font-medium">
          Preuve d'enseignement
          <Input className="mt-1" type="file" accept="image/*,application/pdf" onChange={(e) => setPreuve(e.target.files?.[0] ?? null)} />
        </label>
        <Button type="submit" disabled={busy}>{busy ? "Envoi…" : "Envoyer la candidature"}</Button>
      </form>
    </UserDashboardShell>
  );
}
