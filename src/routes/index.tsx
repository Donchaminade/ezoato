import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { ArrowRight, Upload } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { PublicLayout } from "@/components/layout/PublicLayout";
import { ScrollReveal } from "@/components/motion/ScrollReveal";
import { Button } from "@/components/ui/button";
import { EpreuveCard } from "@/components/epreuves/EpreuveCard";
import { EpreuvePreviewDialog } from "@/components/epreuves/EpreuvePreviewDialog";
import {
  HomeExamTicker,
  HomeExplore,
  HomeFAQ,
  HomeFeatures,
  HomeHowItWorks,
  HomePricing,
  HomeTestimonials,
} from "@/components/marketing/HomeSections";
import { HomeHero } from "@/components/marketing/HomeHero";
import { PublicStatsBar } from "@/components/marketing/PublicStatsBar";
import { PartnersSection } from "@/components/marketing/PartnersSection";
import { WaveDivider } from "@/components/motion/WaveDivider";
import { StudentGallery } from "@/components/marketing/StudentShowcase";
import { ArchivesEmptyState } from "@/components/catalog/ArchivesEmptyState";
import { api } from "@/lib/api";
import type { Epreuve } from "@/lib/types";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "EZOA-TO — Archives scolaires du Togo" },
      { name: "description", content: "Archives des devoirs, compositions et examens antérieurs des établissements et examens nationaux du Togo. Devoirs gratuits, examens nationaux à 100 FCFA." },
      { property: "og:title", content: "EZOA-TO — Archives scolaires du Togo" },
      { property: "og:description", content: "Devoirs, compositions et examens antérieurs des établissements togolais." },
    ],
  }),
  component: HomePage,
});

function HomePage() {
  const [preview, setPreview] = useState<Epreuve | null>(null);
  const { data, isLoading: loadingEpreuves, isError: epreuvesError, refetch } = useQuery({
    queryKey: ["epreuves", "home"],
    queryFn: () => api.listEpreuves({ perPage: 6, page: 1 }),
    retry: 1,
  });
  const { data: meta, isLoading: metaLoading } = useQuery({
    queryKey: ["meta"],
    queryFn: () => api.getMeta(),
  });

  return (
    <PublicLayout>
      <HomeHero />

      <HomeExamTicker />

      <PublicStatsBar meta={meta} loading={metaLoading} />

      <StudentGallery />

      <HomeHowItWorks />
      <HomeFeatures />
      <HomePricing meta={meta} />
      <HomeExplore meta={meta} />

      {/* Latest */}
      <section className="px-4 py-16 sm:px-6 sm:py-24">
        <div className="mx-auto max-w-7xl">
          <ScrollReveal className="mb-8 flex items-end justify-between">
            <div>
              <h2 className="font-display text-2xl font-bold tracking-tight sm:text-3xl">Dernières épreuves</h2>
              <p className="mt-1 text-sm text-muted-foreground">Ajoutées et validées récemment</p>
            </div>
            <Button asChild variant="ghost" size="sm">
              <Link to="/docs">
                <span className="inline-flex items-center gap-2">Voir tout <ArrowRight className="size-4" /></span>
              </Link>
            </Button>
          </ScrollReveal>

          {loadingEpreuves && (
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="h-48 animate-pulse rounded-xl bg-muted" />
              ))}
            </div>
          )}
          {epreuvesError && (
            <ArchivesEmptyState variant="error" onRetry={() => refetch()} />
          )}
          {!loadingEpreuves && !epreuvesError && (data?.items.length ?? 0) === 0 && (
            <ArchivesEmptyState variant="empty" />
          )}
          {!loadingEpreuves && !epreuvesError && (data?.items.length ?? 0) > 0 && (
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {data!.items.map((ep, i) => (
                <ScrollReveal key={ep.id} delay={i * 0.08} offsetY={40}>
                  <EpreuveCard epreuve={ep} onPreview={setPreview} />
                </ScrollReveal>
              ))}
            </div>
          )}
        </div>
      </section>

      <HomeTestimonials />
      <PartnersSection compact showSupportCta />
      <HomeFAQ />

      {/* CTA */}
      <section className="relative px-4 pb-20 pt-4 sm:px-6">
        <ScrollReveal>
          <div className="relative mx-auto max-w-5xl overflow-hidden rounded-3xl border border-border bg-primary text-primary-foreground">
            <div className="absolute inset-x-0 top-0 -translate-y-px">
              <WaveDivider className="text-primary" shape="bold" height="md" flip layered backClassName="text-primary/80" />
            </div>
            <div className="grid items-center gap-8 p-8 sm:p-14 lg:grid-cols-[1fr_auto]">
              <div>
                <h2 className="font-display text-2xl font-bold sm:text-3xl">
                  Contribue à la réussite scolaire togolaise
                </h2>
                <p className="mt-3 max-w-xl text-sm opacity-90 sm:text-base">
                  Tu as des épreuves de ton établissement ? Photographie-les et soumets-les.
                  Notre équipe les valide et les transforme en PDF accessible à tous.
                </p>
                {meta && (
                  <p className="mt-4 text-xs opacity-75">
                    {meta.stats.contributeurs.toLocaleString("fr-FR")} contributeurs actifs ·{" "}
                    {meta.stats.epreuvesValidees.toLocaleString("fr-FR")} épreuves validées
                  </p>
                )}
              </div>
              <div className="flex flex-col gap-3 sm:flex-row lg:flex-col lg:items-end">
                <Button asChild size="lg" variant="secondary">
                  <Link to="/submit">
                    <span className="inline-flex items-center justify-center gap-2">
                      <Upload className="size-4" /> Soumettre une épreuve
                    </span>
                  </Link>
                </Button>
                <Button
                  asChild
                  size="lg"
                  variant="outline"
                  className="border-white/30 bg-transparent text-primary-foreground [--tea-water-color:rgb(255_255_255/0.18)] hover:border-white/50 hover:text-primary-foreground"
                >
                  <Link to="/about">
                    <span className="inline-flex items-center justify-center gap-2">
                      En savoir plus
                    </span>
                  </Link>
                </Button>
              </div>
            </div>
          </div>
        </ScrollReveal>
      </section>

      <EpreuvePreviewDialog
        epreuve={preview}
        open={!!preview}
        onOpenChange={(v) => !v && setPreview(null)}
      />
    </PublicLayout>
  );
}
