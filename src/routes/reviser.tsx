import { createFileRoute } from "@tanstack/react-router";
import { Sparkles } from "lucide-react";
import { RevisionWorkspace } from "@/components/ai/RevisionWorkspace";
import { PageHero } from "@/components/layout/PageHero";
import { PageHeroBadge } from "@/components/layout/PageHeroBadge";
import { PublicLayout } from "@/components/layout/PublicLayout";

export const Route = createFileRoute("/reviser")({
  head: () => ({
    meta: [
      { title: "Réviser avec l'IA — EZOA-TO" },
      {
        name: "description",
        content:
          "Tuteur ancré sur les épreuves : rédaction, sciences ou QCM. Ce n'est pas une note officielle.",
      },
    ],
  }),
  component: ReviserPage,
});

function ReviserPage() {
  return (
    <PublicLayout>
      <PageHero
        badge={<PageHeroBadge icon={Sparkles}>Ezoato AI</PageHeroBadge>}
        title="Réviser avec l'IA"
        description="Rédige une copie, révise un exercice de sciences sans te faire donner la solution, ou enchaîne un QCM. Fonction Pro — ce n'est pas la correction du jury : vérifie avec ton enseignant."
        primaryImage="hero"
        compact
      />
      <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6">
        <RevisionWorkspace />
      </div>
    </PublicLayout>
  );
}
