import { pageHead } from "@/lib/seo";
import { createFileRoute } from "@tanstack/react-router";
import { Sparkles } from "lucide-react";
import { RevisionWorkspace } from "@/components/ai/RevisionWorkspace";
import { PageHero } from "@/components/layout/PageHero";
import { PageHeroBadge } from "@/components/layout/PageHeroBadge";
import { PublicLayout } from "@/components/layout/PublicLayout";

export const Route = createFileRoute("/reviser")({
  head: () =>
    pageHead({
      path: "/reviser",
      title: "Réviser avec l'IA — Tuteur d'examens EZOA-TO",
      description:
        "Révise tes épreuves du CEPD, BEPC et BAC avec le tuteur IA d'EZOA-TO : explications pas à pas, méthodes et conseils pour progresser.",
    }),
  component: ReviserPage,
});

function ReviserPage() {
  return (
    <PublicLayout>
      <PageHero
        badge={<PageHeroBadge icon={Sparkles}>Ezoato AI</PageHeroBadge>}
        title="Réviser avec l'IA"
        description="Retrouve une épreuve, confirme que c'est la bonne, puis avance une étape à la fois. Le tuteur ne donne pas la réponse. Fonction Pro — vérifie avec ton enseignant."
        primaryImage="hero"
        compact
      />
      <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6">
        <RevisionWorkspace />
      </div>
    </PublicLayout>
  );
}
