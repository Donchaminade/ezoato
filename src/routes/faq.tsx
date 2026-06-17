import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { ArrowRight, CircleHelp, MessageCircle } from "lucide-react";
import { z } from "zod";
import { PageHero } from "@/components/layout/PageHero";
import { PageHeroBadge } from "@/components/layout/PageHeroBadge";
import { PublicLayout } from "@/components/layout/PublicLayout";
import { EZOA_BRAND } from "@/lib/branding";
import { FaqExplorer } from "@/components/faq/FaqExplorer";
import { ScrollReveal } from "@/components/motion/ScrollReveal";
import { Button } from "@/components/ui/button";
import { api } from "@/lib/api";

const searchSchema = z.object({
  q: z.string().optional(),
  category: z.string().optional(),
  open: z.string().optional(),
});

export const Route = createFileRoute("/faq")({
  validateSearch: searchSchema,
  head: ({ search }) => ({
    meta: [
      { title: search?.q ? `FAQ — ${search.q} — EZOA-TO` : "FAQ — Questions fréquentes — EZOA-TO" },
      {
        name: "description",
        content:
          "Réponses aux questions sur les téléchargements, paiements Mobile Money, soumissions et espace contributeur EZOA-TO.",
      },
    ],
  }),
  component: FaqPage,
});

function FaqPage() {
  const search = Route.useSearch();
  const navigate = Route.useNavigate();

  const { data: meta } = useQuery({
    queryKey: ["meta"],
    queryFn: () => api.getMeta(),
  });

  return (
    <PublicLayout>
      <PageHero
        badge={<PageHeroBadge icon={CircleHelp}>Aide</PageHeroBadge>}
        title="Foire aux questions"
        description={
          meta
            ? `Devoirs gratuits · Examens à ${meta.pricing.prixExamenNational} FCFA · ${meta.pricing.epreuvesParRecompense} validées = ${meta.pricing.montantRecompense.toLocaleString("fr-FR")} FCFA`
            : EZOA_BRAND.tagline
        }
        primaryImage="hero"
        compact
      />

      <div className="mx-auto max-w-4xl px-4 py-10 sm:px-6 sm:py-14">
        <div>
          <FaqExplorer
            initialQ={search.q}
            initialCategory={search.category}
            initialOpen={search.open}
            onSearchChange={(q) =>
              navigate({ search: (prev) => ({ ...prev, q: q || undefined }), replace: true })
            }
            onCategoryChange={(category) =>
              navigate({ search: (prev) => ({ ...prev, category }), replace: true })
            }
          />
        </div>

        <ScrollReveal className="mt-14">
          <div className="flag-stripe-top rounded-2xl border border-border bg-card p-6 text-center sm:p-8">
            <MessageCircle className="mx-auto size-8 text-primary" />
            <h2 className="mt-4 font-display text-xl font-bold">Tu n'as pas trouvé ta réponse ?</h2>
            <p className="mx-auto mt-2 max-w-md text-sm text-muted-foreground">
              Notre équipe répond sous 48 h pour les questions sur les paiements, soumissions
              ou problèmes techniques.
            </p>
            <div className="mt-5 flex flex-wrap justify-center gap-3">
              <Button asChild>
                <Link to="/contact">
                  Nous contacter <ArrowRight className="size-4" />
                </Link>
              </Button>
              <Button asChild variant="outline">
                <Link to="/docs">Parcourir les épreuves</Link>
              </Button>
            </div>
          </div>
        </ScrollReveal>
      </div>
    </PublicLayout>
  );
}
