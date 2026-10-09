import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { PenLine } from "lucide-react";
import { toast } from "sonner";
import { AuthGate } from "@/components/account/AuthGate";
import { AudioBlocage } from "@/components/corrections/AudioBlocage";
import { UserDashboardShell } from "@/components/dashboard/UserDashboardShell";
import { PageHeroBadge } from "@/components/layout/PageHeroBadge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { api } from "@/lib/api";
import { correctionsApi } from "@/lib/corrections-api";
import { formatFcfa } from "@/lib/pricing";

export const Route = createFileRoute("/corrections/nouvelle")({
  head: () => ({ meta: [{ title: "Nouvelle demande de correction — EZOA-TO" }] }),
  component: Page,
});

function Page() {
  return (
    <AuthGate
      badge={<PageHeroBadge icon={PenLine}>Correction</PageHeroBadge>}
      title="Nouvelle demande"
      description="Connecte-toi pour décrire ce qui te bloque sur une épreuve."
    >
      <Formulaire />
    </AuthGate>
  );
}

function Formulaire() {
  const nav = useNavigate();
  const reglages = useQuery({ queryKey: ["corrections-reglages-publics"], queryFn: () => correctionsApi.reglagesPublics() });
  const [q, setQ] = useState("");
  const [epreuveId, setEpreuveId] = useState("");
  const [epreuveTitre, setEpreuveTitre] = useState("");
  const [exercices, setExercices] = useState("");
  const [blocage, setBlocage] = useState("");
  const [audio, setAudio] = useState<Blob | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    const id = new URLSearchParams(window.location.search).get("epreuve");
    if (id) setEpreuveId(id);
  }, []);

  const recherche = useQuery({
    queryKey: ["corrections-epreuves", q],
    queryFn: () => api.listEpreuves({ q, perPage: 8 }),
    enabled: q.trim().length >= 2,
  });

  async function envoyer(e: React.FormEvent) {
    e.preventDefault();
    if (!epreuveId) return toast.error("Choisis une épreuve du catalogue.");
    const lignes = exercices.split("\n").map((l) => l.trim()).filter(Boolean);
    if (!lignes.length) return toast.error("Indique les exercices concernés.");
    if (blocage.trim().length < 8 && !audio) return toast.error("Explique le blocage, par écrit ou en audio.");
    setBusy(true);
    try {
      const fd = new FormData();
      fd.append("epreuveId", epreuveId);
      fd.append("exercices", JSON.stringify(lignes));
      fd.append("blocage", blocage.trim());
      if (audio) fd.append("audio", audio, "blocage.webm");
      const demande = await correctionsApi.creer(fd);
      toast.success(
        demande.statut === "en_attente_reglement"
          ? "Demande enregistrée. Le règlement reste à confirmer."
          : "Demande envoyée.",
      );
      nav({ to: "/corrections/$id", params: { id: demande.id } });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Envoi impossible");
    } finally {
      setBusy(false);
    }
  }

  const prix = reglages.data?.prixUnitaire;
  const quota = reglages.data?.quotaPro;

  return (
    <UserDashboardShell title="Nouvelle demande" subtitle="Épreuve, exercices, et ce qui bloque" activeSection="corrections">
      <form onSubmit={envoyer} className="mx-auto max-w-2xl space-y-4">
        <p className="rounded-xl bg-muted/50 p-4 text-sm text-muted-foreground">
          {prix != null
            ? `Hors quota Pro (${quota ?? 0} demande incluse par période), une demande coûte ${formatFcfa(prix)}. Le règlement se fait ensuite par Flooz ou T-Money.`
            : "Chargement du tarif…"}
          {" "}
          Tu reçois une correction commentée et pédagogique, jamais publiée avec l'épreuve.
        </p>
        <div>
          <label className="text-sm font-medium">Chercher l'épreuve</label>
          <Input className="mt-1" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Ex. mathématiques 4e 2e trimestre" />
          <ul className="mt-2 space-y-1">
            {(recherche.data?.items ?? []).map((item) => (
              <li key={item.id}>
                <button
                  type="button"
                  className={`w-full rounded-lg border px-3 py-2 text-left text-sm ${epreuveId === item.id ? "border-primary bg-primary/5" : "border-border"}`}
                  onClick={() => {
                    setEpreuveId(item.id);
                    setEpreuveTitre(item.titre);
                  }}
                >
                  {item.titre}
                  <span className="block text-muted-foreground">{item.matiere} · {item.classe} · {item.annee}</span>
                </button>
              </li>
            ))}
          </ul>
          {epreuveId && <p className="mt-2 text-sm">Épreuve retenue : {epreuveTitre || epreuveId}</p>}
        </div>
        <div>
          <label className="text-sm font-medium">Exercices concernés</label>
          <Textarea className="mt-1" rows={4} value={exercices} onChange={(e) => setExercices(e.target.value)} placeholder={"Un exercice par ligne\nExercice 2"} />
        </div>
        <div>
          <label className="text-sm font-medium">Ce qui te bloque</label>
          <Textarea className="mt-1" rows={5} value={blocage} onChange={(e) => setBlocage(e.target.value)} placeholder="Je ne comprends pas comment relier les données…" />
        </div>
        <AudioBlocage onBlob={setAudio} />
        <Button type="submit" disabled={busy}>{busy ? "Envoi…" : "Envoyer la demande"}</Button>
      </form>
    </UserDashboardShell>
  );
}
