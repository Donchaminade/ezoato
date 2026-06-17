export const TYPE_LABELS: Record<string, string> = {
  devoir: "Devoirs",
  composition: "Compositions",
  examen: "Examens",
  corrige: "Corrigés",
};

/** Palette graphiques — jaune, magenta, vert, rouge, cyan (oklch via variables CSS) */
export const CHART_COLORS = [
  "var(--chart-1)",
  "var(--chart-2)",
  "var(--chart-3)",
  "var(--chart-4)",
  "var(--chart-5)",
] as const;

/** Couleurs sémantiques pour les graphiques utilisateur */
export const CHART_STATUT = {
  validee: "var(--chart-1)",
  enAttente: "var(--chart-2)",
  rejetee: "var(--chart-4)",
} as const;

export function fillDays(
  rows: { jour: string; count: number; revenus?: number }[],
  days = 14,
): { jour: string; label: string; count: number; revenus: number }[] {
  const map = new Map(rows.map((r) => [r.jour, r]));
  const out: { jour: string; label: string; count: number; revenus: number }[] = [];
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const key = d.toISOString().slice(0, 10);
    const row = map.get(key);
    out.push({
      jour: key,
      label: d.toLocaleDateString("fr-FR", { day: "numeric", month: "short" }),
      count: row?.count ?? 0,
      revenus: row?.revenus ?? 0,
    });
  }
  return out;
}

/** Vrai si au moins une valeur numérique > 0 dans la série. */
export function hasSeriesData<T extends Record<string, unknown>>(
  series: T[],
  keys: (keyof T)[],
): boolean {
  return series.some((row) => keys.some((k) => Number(row[k]) > 0));
}

export function groupTransactionsByDay(
  transactions: { creeLe: string; montant: number; type: "credit" | "debit" }[],
  days = 14,
) {
  const map = new Map<string, { credits: number; debits: number }>();
  for (const t of transactions) {
    const key = t.creeLe.slice(0, 10);
    const cur = map.get(key) ?? { credits: 0, debits: 0 };
    if (t.type === "credit") cur.credits += t.montant;
    else cur.debits += t.montant;
    map.set(key, cur);
  }
  const out: { label: string; credits: number; debits: number }[] = [];
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const key = d.toISOString().slice(0, 10);
    const row = map.get(key) ?? { credits: 0, debits: 0 };
    out.push({
      label: d.toLocaleDateString("fr-FR", { day: "numeric", month: "short" }),
      credits: row.credits,
      debits: row.debits,
    });
  }
  return out;
}
