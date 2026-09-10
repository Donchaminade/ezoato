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
          "Génère un QCM d'entraînement à partir d'un extrait d'épreuve. Ce n'est pas une note officielle.",
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
        description="Colle un extrait d'épreuve pour obtenir un QCM, des explications pas-à-pas et des indices. L'IA n'est pas un correcteur officiel : vérifie toujours avec ton enseignant."
        primaryImage="hero"
        compact
      />
      <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6">
        <RevisionWorkspace />
      </div>
    </PublicLayout>
  );
}
