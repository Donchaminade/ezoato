import { cn } from "@/lib/utils";

/** Compteur « 12/50 épreuves gratuites » (ou libellé séparé devoirs / compositions). */
export function FreemiumQuotaNote({
  label,
  className,
}: {
  label: string;
  className?: string;
}) {
  return (
    <p className={cn("rounded-xl border border-border bg-card px-4 py-3 text-sm font-semibold tabular-nums", className)}>
      {label}
    </p>
  );
}
