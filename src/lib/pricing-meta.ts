import type { PublicMeta, PublicPricing } from "@/lib/types";

export function fmtStat(n: number): string {
  return n.toLocaleString("fr-FR");
}

export function resolvePricing(meta?: PublicMeta): PublicPricing {
  const p = meta?.pricing;
  return {
    prixExamenNational: p?.prixExamenNational ?? 100,
    prixCorrigeType: p?.prixCorrigeType ?? 200,
    prixExamenEffectif: p?.prixExamenEffectif ?? p?.prixExamenNational ?? 100,
    prixCorrigeEffectif: p?.prixCorrigeEffectif ?? p?.prixCorrigeType ?? 200,
    promo: p?.promo ?? null,
    epreuvesParRecompense: p?.epreuvesParRecompense ?? 50,
    montantRecompense: p?.montantRecompense ?? 1000,
    minRetrait: p?.minRetrait ?? 2000,
  };
}

export function examenPriceLabel(meta?: PublicMeta): string {
  const p = resolvePricing(meta);
  return `${fmtStat(p.prixExamenEffectif)} F`;
}

export function hasExamenPromo(meta?: PublicMeta): boolean {
  const p = resolvePricing(meta);
  return !!p.promo?.active && p.prixExamenEffectif < p.prixExamenNational;
}

export function examenPriceDisplay(meta?: PublicMeta): {
  effectif: string;
  barre?: string;
  promoLabel?: string;
} {
  const p = resolvePricing(meta);
  const effectif = `${fmtStat(p.prixExamenEffectif)} F`;
  if (hasExamenPromo(meta)) {
    return {
      effectif,
      barre: `${fmtStat(p.prixExamenNational)} F`,
      promoLabel: p.promo?.label ?? "Promo",
    };
  }
  return { effectif };
}
