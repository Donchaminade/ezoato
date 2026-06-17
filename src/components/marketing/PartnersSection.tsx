import { Link } from "@tanstack/react-router";
import { Building2, ExternalLink, Heart } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { InfiniteMarquee } from "@/components/motion/InfiniteMarquee";
import { ScrollReveal } from "@/components/motion/ScrollReveal";
import { WaveDivider } from "@/components/motion/WaveDivider";
import { Button } from "@/components/ui/button";
import { api } from "@/lib/api";
import { cn } from "@/lib/utils";
import type { Partenaire } from "@/lib/types";

const TYPE_LABELS: Record<Partenaire["type"], string> = {
  etablissement: "Établissement",
  entreprise: "Entreprise",
  association: "Association",
  autre: "Partenaire",
};

interface PartnersSectionProps {
  title?: string;
  description?: string;
  compact?: boolean;
  showSupportCta?: boolean;
}

export function PartnersSection({
  title = "Ils nous font confiance",
  description = "Établissements et organisations qui collaborent avec EZOA-TO pour rendre les archives accessibles aux élèves togolais.",
  compact = false,
  showSupportCta = false,
}: PartnersSectionProps) {
  const { data: partenaires, isLoading } = useQuery({
    queryKey: ["partenaires"],
    queryFn: () => api.listPartenaires(),
    staleTime: 60_000,
  });

  if (isLoading) {
    return (
      <section className={compact ? "py-8" : "py-12"}>
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="h-28 animate-pulse rounded-xl bg-muted" />
            ))}
          </div>
        </div>
      </section>
    );
  }

  if (!partenaires?.length) return null;

  return (
    <section className={cn("relative", compact ? "py-8" : "py-12 sm:py-16")}>
      <div className="absolute inset-x-0 top-0 -translate-y-[calc(100%-1px)]">
        <WaveDivider className="text-background" shape="subtle" height="sm" flip />
      </div>
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <ScrollReveal offsetY={30}>
          <div className="text-center">
            <h2 className="font-display text-2xl font-bold sm:text-3xl">{title}</h2>
            {!compact && (
              <p className="mx-auto mt-3 max-w-2xl text-sm text-muted-foreground sm:text-base">
                {description}
              </p>
            )}
            {showSupportCta && (
              <div className="mt-6">
                <Button asChild variant="outline" className="rounded-xl !text-white">
                  <Link to="/partenariat">
                    <span className="inline-flex items-center justify-center gap-2">
                      <Heart className="size-4" />
                      Soutenir le projet
                    </span>
                  </Link>
                </Button>
              </div>
            )}
          </div>
        </ScrollReveal>

        <ScrollReveal offsetY={24} className="mt-8">
          <InfiniteMarquee direction="rtl" durationSec={22} gapClassName="gap-4 pr-4">
            {partenaires.map((p) => (
              <PartnerCard key={p.id} partenaire={p} />
            ))}
          </InfiniteMarquee>
        </ScrollReveal>
      </div>
    </section>
  );
}

function PartnerCard({ partenaire }: { partenaire: Partenaire }) {
  const content = (
    <div className="flex h-full w-[min(42vw,11rem)] shrink-0 flex-col items-center justify-center rounded-xl border border-border bg-card p-4 text-center transition hover:border-primary/30 hover:shadow-sm sm:w-44">
      <div className="mb-3 flex h-20 w-full items-center justify-center sm:h-24">
        {partenaire.logoUrl ? (
          <img
            src={partenaire.logoUrl}
            alt={`Logo ${partenaire.nom}`}
            className="max-h-16 max-w-full object-contain sm:max-h-20"
            loading="lazy"
          />
        ) : (
          <div className="grid size-16 place-items-center rounded-full bg-primary/10 text-primary sm:size-20">
            <Building2 className="size-8 sm:size-9" />
          </div>
        )}
      </div>
      <p className="line-clamp-2 text-sm font-semibold leading-tight">{partenaire.nom}</p>
      {(partenaire.ville || partenaire.type) && (
        <p className="mt-1 text-xs text-muted-foreground">
          {[partenaire.ville, TYPE_LABELS[partenaire.type]].filter(Boolean).join(" · ")}
        </p>
      )}
      {partenaire.siteWeb && (
        <ExternalLink className="mt-2 size-3.5 text-muted-foreground" aria-hidden />
      )}
    </div>
  );

  if (partenaire.siteWeb) {
    return (
      <a
        href={partenaire.siteWeb}
        target="_blank"
        rel="noopener noreferrer"
        className="block h-full"
        title={`Visiter ${partenaire.nom}`}
      >
        {content}
      </a>
    );
  }

  return content;
}
