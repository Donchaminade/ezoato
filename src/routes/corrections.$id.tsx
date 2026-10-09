import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { PenLine } from "lucide-react";
import { AuthGate } from "@/components/account/AuthGate";
import { UserDashboardShell } from "@/components/dashboard/UserDashboardShell";
import { PageHeroBadge } from "@/components/layout/PageHeroBadge";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { correctionsApi, STATUT_LABEL } from "@/lib/corrections-api";

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
            <p className="rounded-xl border border-border bg-muted/40 p-4 text-sm">
              Cette demande attend la confirmation du règlement ({data.montant} FCFA). L'administration ou le module de paiement la débloque.
            </p>
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
