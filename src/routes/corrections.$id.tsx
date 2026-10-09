import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Loader2, PenLine, Smartphone } from "lucide-react";
import { toast } from "sonner";
import { AuthGate } from "@/components/account/AuthGate";
import { UserDashboardShell } from "@/components/dashboard/UserDashboardShell";
import { PageHeroBadge } from "@/components/layout/PageHeroBadge";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { correctionsApi, STATUT_LABEL, type DemandeCorrection, type PaiementCorrection } from "@/lib/corrections-api";
import { formatFcfa } from "@/lib/pricing";

export const Route = createFileRoute("/corrections/$id")({
  head: () => ({ meta: [{ title: "Suivi de demande — EZOA-TO" }] }),
  component: Page,
});

function Page() {
  const { id } = Route.useParams();
  return (
    <AuthGate
      badge={<PageHeroBadge icon={PenLine}>Suivi</PageHeroBadge>}
      title="Suivi de la demande"
      description="Connecte-toi pour suivre ta demande de correction."
    >
      <Detail id={id} />
    </AuthGate>
  );
}

function ReglementMobileMoney({
  demande,
  onPaye,
}: {
  demande: DemandeCorrection;
  onPaye: () => void;
}) {
  const [methode, setMethode] = useState<"flooz" | "tmoney">("flooz");
  const [telephone, setTelephone] = useState("");
  const [paiement, setPaiement] = useState<PaiementCorrection | null>(null);
  const [loading, setLoading] = useState(false);

  async function initier() {
    if (telephone.replace(/\D/g, "").length < 8) {
      toast.error("Entrez un numéro valide");
      return;
    }
    setLoading(true);
    try {
      setPaiement(await correctionsApi.initierPaiement(demande.id, methode, telephone));
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Paiement impossible");
    } finally {
      setLoading(false);
    }
  }

  async function confirmer() {
    if (!paiement) return;
    setLoading(true);
    try {
      await correctionsApi.confirmerPaiement(demande.id, paiement.reference);
      toast.success("Règlement confirmé");
      onPaye();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Règlement impossible");
    } finally {
      setLoading(false);
    }
  }

  if (!paiement) {
    return (
      <section className="rounded-2xl border border-border bg-card p-4">
        <h2 className="font-display text-lg font-semibold">Régler {formatFcfa(demande.montant ?? 0)}</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          Hors quota Pro, cette demande coûte {formatFcfa(demande.montant ?? 1500)}. Paiement Flooz ou T-Money.
        </p>
        <div className="mt-4 grid grid-cols-2 gap-3">
          {(["flooz", "tmoney"] as const).map((m) => (
            <button
              key={m}
              type="button"
              onClick={() => setMethode(m)}
              className={`rounded-xl border p-3 text-left ${methode === m ? "border-primary bg-primary/5" : "border-border"}`}
            >
              <div className="font-semibold">{m === "flooz" ? "Flooz" : "T-Money"}</div>
              <div className="text-xs text-muted-foreground">{m === "flooz" ? "Moov Africa" : "Togocom / Yas"}</div>
            </button>
          ))}
        </div>
        <div className="mt-4 space-y-2">
          <Label htmlFor="cor-tel">Numéro Mobile Money</Label>
          <div className="relative">
            <Smartphone className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input id="cor-tel" className="pl-9" placeholder="90 XX XX XX" value={telephone} onChange={(e) => setTelephone(e.target.value)} />
          </div>
        </div>
        <Button className="mt-4 w-full" onClick={initier} disabled={loading}>
          {loading && <Loader2 className="size-4 animate-spin" />}
          Continuer
        </Button>
      </section>
    );
  }

  return (
    <section className="rounded-2xl border border-border bg-card p-4">
      <h2 className="font-display text-lg font-semibold">{paiement.instructions.titre}</h2>
      <ol className="mt-3 space-y-2 text-sm">
        {paiement.instructions.etapes.map((etape) => (
          <li key={etape}>{etape}</li>
        ))}
      </ol>
      <p className="mt-3 rounded-md bg-muted px-3 py-2 font-mono text-sm font-semibold">{paiement.reference}</p>
      {paiement.simulated && (
        <p className="mt-3 text-xs text-muted-foreground">
          Aucune clé opérateur n&apos;est configurée : la confirmation est simulée.
        </p>
      )}
      <Button className="mt-4 w-full" onClick={confirmer} disabled={loading}>
        {loading && <Loader2 className="size-4 animate-spin" />}
        {paiement.simulated ? "Confirmer (simulation)" : "J'ai payé — vérifier"}
      </Button>
    </section>
  );
}

function Detail({ id }: { id: string }) {
  const { data, refetch, isLoading } = useQuery({
    queryKey: ["correction-demande", id],
    queryFn: () => correctionsApi.demande(id),
  });
  const [feedback, setFeedback] = useState<string | null>(null);

  return (
    <UserDashboardShell
      title={data?.epreuveTitre || "Demande"}
      subtitle={data ? `${data.matiere} · ${data.exercices.join(", ")}` : "Chargement"}
      activeSection="corrections"
      onRefresh={() => refetch()}
    >
      {isLoading && <p className="text-sm text-muted-foreground">Chargement…</p>}
      {data && (
        <div className="space-y-4">
          <Badge>{STATUT_LABEL[data.statut] ?? data.statut}</Badge>
          {data.statut === "en_attente_reglement" && (
            <ReglementMobileMoney
              demande={data}
              onPaye={() => {
                refetch();
              }}
            />
          )}
          {data.blocageTexte && (
            <section className="rounded-2xl border border-border bg-card p-4">
              <h2 className="font-medium">Ton blocage</h2>
              <p className="mt-2 whitespace-pre-wrap text-sm">{data.blocageTexte}</p>
              {data.transcription && (
                <p className="mt-3 text-sm text-muted-foreground">Transcription : {data.transcription}</p>
              )}
            </section>
          )}
          {data.guide && (
            <section className="rounded-2xl border border-border bg-card p-4">
              <h2 className="font-display text-lg font-semibold">Aide guidée</h2>
              <p className="mt-2 whitespace-pre-wrap text-sm">{data.guide.explications}</p>
              <ul className="mt-3 list-disc space-y-1 pl-5 text-sm">
                {data.guide.exemples.map((exemple) => <li key={exemple}>{exemple}</li>)}
              </ul>
              {data.guide.qcm.map((question) => (
                <div key={question.id} className="mt-4">
                  <p className="text-sm font-medium">{question.prompt}</p>
                  <div className="mt-2 flex flex-col gap-2">
                    {question.choices.map((choice, index) => (
                      <Button
                        key={choice}
                        type="button"
                        variant="outline"
                        className="justify-start"
                        onClick={() => {
                          correctionsApi.qcm(data.id, question.id, index)
                            .then((res) => setFeedback(res.feedback))
                            .catch((err) => setFeedback(err instanceof Error ? err.message : "Réponse impossible"));
                        }}
                      >
                        {choice}
                      </Button>
                    ))}
                  </div>
                </div>
              ))}
              {feedback && <p className="mt-3 text-sm">{feedback}</p>}
            </section>
          )}
          {data.livraison && (
            <section className="rounded-2xl border border-border bg-card p-4">
              <h2 className="font-display text-lg font-semibold">Version commentée</h2>
              <p className="mt-2 whitespace-pre-wrap text-sm">{data.livraison.contenu}</p>
            </section>
          )}
          <Button asChild variant="ghost">
            <Link to="/corrections">Retour aux demandes</Link>
          </Button>
        </div>
      )}
    </UserDashboardShell>
  );
}
