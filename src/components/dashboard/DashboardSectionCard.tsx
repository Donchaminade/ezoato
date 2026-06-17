import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export function DashboardSectionCard({
  title,
  subtitle,
  children,
  className,
  action,
}: {
  title: string;
  subtitle?: string;
  children: ReactNode;
  className?: string;
  action?: ReactNode;
}) {
  return (
    <section className={cn("rounded-xl border border-border bg-card p-3 shadow-sm sm:rounded-2xl sm:p-6", className)}>
      <div className="mb-3 flex items-start justify-between gap-2 sm:mb-5 sm:gap-3">
        <div className="min-w-0">
          <h2 className="font-display text-[11px] font-bold uppercase tracking-wider text-muted-foreground sm:text-sm">
            {title}
          </h2>
          {subtitle && (
            <p className="mt-0.5 line-clamp-2 text-xs text-muted-foreground sm:mt-1 sm:text-sm">{subtitle}</p>
          )}
        </div>
        {action}
      </div>
      {children}
    </section>
  );
}

export function DashboardProgressRow({
  label,
  value,
  total,
  tone = "primary",
}: {
  label: string;
  value: number;
  total: number;
  tone?: "primary" | "yellow" | "destructive" | "muted";
}) {
  const pct = total > 0 ? Math.round((value / total) * 100) : 0;
  const bar =
    tone === "yellow"
      ? "bg-tg-yellow"
      : tone === "destructive"
        ? "bg-destructive"
        : tone === "muted"
          ? "bg-muted-foreground/30"
          : "bg-primary";

  return (
    <div className="space-y-1.5 sm:space-y-2">
      <div className="flex items-center justify-between text-xs sm:text-sm">
        <span className="font-medium">{label}</span>
        <span className="tabular-nums text-muted-foreground">{value}</span>
      </div>
      <div className="h-1.5 overflow-hidden rounded-full bg-muted sm:h-2">
        <div className={cn("h-full rounded-full transition-all", bar)} style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

export function DashboardTodoItem({
  label,
  count,
  tone,
  onClick,
}: {
  label: string;
  count: number;
  tone: "yellow" | "red" | "purple" | "green";
  onClick?: () => void;
}) {
  const tones = {
    yellow: "border-tg-yellow/40 bg-tg-yellow/10 text-tg-ink dark:text-tg-yellow hover:bg-tg-yellow/18",
    red: "border-destructive/30 bg-destructive/10 text-destructive hover:bg-destructive/15",
    purple: "border-violet-500/30 bg-violet-500/10 text-violet-700 dark:text-violet-300 hover:bg-violet-500/15",
    green: "border-primary/30 bg-primary/10 text-primary hover:bg-primary/15",
  };

  const Comp = onClick ? "button" : "div";

  return (
    <Comp
      type={onClick ? "button" : undefined}
      onClick={onClick}
      className={cn(
        "flex w-full items-center justify-between gap-2 rounded-xl border px-3 py-2.5 text-left text-xs font-medium transition sm:px-4 sm:py-3 sm:text-sm",
        tones[tone],
        onClick && "cursor-pointer",
      )}
    >
      <span className="min-w-0 truncate">{label}</span>
      <span className="shrink-0 rounded-full bg-background/80 px-2 py-0.5 text-[10px] font-bold tabular-nums sm:text-xs">
        {count}
      </span>
    </Comp>
  );
}
