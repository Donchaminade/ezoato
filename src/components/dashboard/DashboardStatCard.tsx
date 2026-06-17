import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

const TONES = {
  green: "bg-primary/12 text-primary",
  yellow: "bg-tg-yellow/20 text-tg-ink dark:text-tg-yellow",
  blue: "bg-blue-500/12 text-blue-600 dark:text-blue-400",
  red: "bg-destructive/12 text-destructive",
  purple: "bg-violet-500/12 text-violet-600 dark:text-violet-400",
} as const;

export function DashboardStatCard({
  label,
  value,
  icon: Icon,
  tone = "green",
  className,
}: {
  label: string;
  value: string | number;
  icon: LucideIcon;
  tone?: keyof typeof TONES;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex aspect-square flex-col justify-between rounded-xl border border-border bg-card p-3 shadow-sm",
        "sm:aspect-auto sm:rounded-2xl sm:p-5",
        className,
      )}
    >
      <div className={cn("grid size-8 shrink-0 place-items-center rounded-lg sm:size-10 sm:rounded-xl", TONES[tone])}>
        <Icon className="size-4 sm:size-5" />
      </div>
      <div className="mt-2 min-w-0 sm:mt-4">
        <p className="truncate font-display text-lg font-bold leading-tight tracking-tight sm:text-2xl">
          {value}
        </p>
        <p className="mt-0.5 line-clamp-2 text-[10px] leading-tight text-muted-foreground sm:mt-1 sm:text-sm">
          {label}
        </p>
      </div>
    </div>
  );
}
