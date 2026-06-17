import type { LucideIcon } from "lucide-react";
import { Building2, FileCheck2, ShieldCheck, Users } from "lucide-react";
import { ScrollReveal } from "@/components/motion/ScrollReveal";
import { Badge } from "@/components/ui/badge";
import { examenPriceDisplay, fmtStat } from "@/lib/pricing-meta";
import type { PublicMeta } from "@/lib/types";

type StatItem = {
  icon: LucideIcon;
  label: string;
  value: string;
  sub?: string;
  promo?: string;
};

function buildStats(meta?: PublicMeta, loading?: boolean): StatItem[] {
  if (loading || !meta) {
    return [
      { icon: FileCheck2, label: "Épreuves validées", value: "—" },
      { icon: Building2, label: "Établissements", value: "—" },
      { icon: Users, label: "Téléchargements", value: "—" },
      { icon: ShieldCheck, label: "Examens nationaux", value: "—" },
    ];
  }

  const price = examenPriceDisplay(meta);

  return [
    {
      icon: FileCheck2,
      label: "Épreuves validées",
      value: fmtStat(meta.stats.epreuvesValidees),
    },
    {
      icon: Building2,
      label: "Établissements",
      value: fmtStat(meta.stats.etablissements),
    },
    {
      icon: Users,
      label: "Téléchargements",
      value: fmtStat(meta.stats.telechargements),
    },
    {
      icon: ShieldCheck,
      label: "Examens nationaux",
      value: price.effectif,
      sub: price.barre,
      promo: price.promoLabel,
    },
  ];
}

export function PublicStatsBar({
  meta,
  loading,
  className = "",
}: {
  meta?: PublicMeta;
  loading?: boolean;
  className?: string;
}) {
  const items = buildStats(meta, loading);

  return (
    <section className={`relative bg-card pt-4 pb-10 sm:pb-12 ${className}`}>
      <div className="mx-auto grid max-w-7xl grid-cols-2 gap-6 px-4 sm:grid-cols-4 sm:px-6">
        {items.map((s, i) => (
          <ScrollReveal key={s.label} delay={i * 0.08} offsetY={35} className="text-center">
            <s.icon className="mx-auto size-5 text-primary" />
            <div className="mt-2 font-display text-2xl font-bold text-foreground sm:text-3xl">
              {loading ? (
                <span className="inline-block h-8 w-16 animate-pulse rounded bg-muted" />
              ) : (
                s.value
              )}
            </div>
            {s.sub && (
              <div className="text-sm text-muted-foreground line-through">{s.sub}</div>
            )}
            {s.promo && (
              <Badge variant="secondary" className="mt-1 text-[10px] uppercase">
                {s.promo}
              </Badge>
            )}
            <div className="mt-1 text-xs font-medium uppercase tracking-wider text-muted-foreground">
              {s.label}
            </div>
          </ScrollReveal>
        ))}
      </div>
    </section>
  );
}
