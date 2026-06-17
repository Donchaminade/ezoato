import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

/** Tuile KPI carrée compacte (mobile) */
export function MiniStatCard({
  value,
  label,
  icon: Icon,
  className,
}: {
  value: number | string;
  label: string;
  icon: LucideIcon;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex aspect-square flex-col items-center justify-center rounded-xl border border-border bg-card p-2 text-center sm:aspect-auto sm:rounded-2xl sm:p-5",
        className,
      )}
    >
      <Icon className="size-4 shrink-0 text-muted-foreground sm:size-5" />
      <p className="mt-1 font-display text-lg font-bold tabular-nums leading-none sm:mt-2 sm:text-2xl">
        {value}
      </p>
      <p className="mt-0.5 line-clamp-2 text-[10px] leading-tight text-muted-foreground sm:mt-1 sm:text-xs">
        {label}
      </p>
    </div>
  );
}
