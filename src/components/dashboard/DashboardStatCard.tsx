import type { LucideIcon } from "lucide-react";
import { animate, motion, useInView, useReducedMotion } from "motion/react";
import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";

/**
 * Carte KPI premium — réf. Instagram DeywyTcvzbX (Code & Chill) + DeoxA_vzRbo (@code.xr) :
 * 1re carte sombre (vert profond), 2e carte pâle (menthe), les autres blanches ;
 * pastille d'icône ronde, compteur animé 0.9 s, entrée en cascade (stagger 0.06), lift au survol.
 */
const TONES = {
  green: "bg-primary/12 text-primary",
  yellow: "bg-tg-yellow/25 text-tg-ink dark:text-tg-yellow",
  blue: "bg-accent/15 text-primary dark:text-primary",
  red: "bg-destructive/12 text-destructive",
  purple: "bg-primary/12 text-primary dark:text-primary",
} as const;

export function CountUp({ value, format }: { value: number; format?: (n: number) => string }) {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true });
  const reduce = useReducedMotion();
  const [n, setN] = useState(reduce ? value : 0);
  useEffect(() => {
    if (!inView) return;
    if (reduce) {
      setN(value);
      return;
    }
    const c = animate(0, value, { duration: 0.9, ease: [0.22, 1, 0.36, 1], onUpdate: (v) => setN(Math.round(v)) });
    return () => c.stop();
  }, [inView, value, reduce]);
  return <span ref={ref}>{format ? format(n) : n.toLocaleString("fr-FR")}</span>;
}

export function DashboardStatCard({
  label,
  value,
  icon: Icon,
  tone = "green",
  className,
  index = 2,
  format,
  hint,
}: {
  label: string;
  value: string | number;
  icon: LucideIcon;
  tone?: keyof typeof TONES;
  className?: string;
  /** position dans la grille : 0 = carte sombre, 1 = carte pâle, ≥2 = blanche */
  index?: number;
  format?: (n: number) => string;
  hint?: string;
}) {
  const surface =
    index === 0
      ? "border-transparent bg-gradient-to-br from-[#004D38] to-[#006A4E] text-white shadow-lg shadow-[#004D38]/25 dark:from-[#0F2A3D] dark:to-[#0B1C2B] dark:ring-1 dark:ring-[#02A671]/30"
      : index === 1
        ? "border-transparent bg-[#E6F5EE] text-[#0B2B20] dark:bg-[#02A671]/12 dark:text-foreground"
        : "border-border/70 bg-card";
  const chip =
    index === 0
      ? "bg-white/15 text-[#FFCE00]"
      : index === 1
        ? "bg-white text-[#006A4E] dark:bg-[#02A671]/20 dark:text-[#02A671]"
        : TONES[tone];
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1], delay: index * 0.06 }}
      whileHover={{ y: -2 }}
      className={cn(
        "flex aspect-square flex-col justify-between rounded-[20px] border p-3 shadow-sm transition-shadow hover:shadow-md",
        "sm:aspect-auto sm:rounded-3xl sm:p-5",
        surface,
        className,
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <div className={cn("grid size-9 shrink-0 place-items-center rounded-full sm:size-11", chip)}>
          <Icon className="size-4 sm:size-5" />
        </div>
        {hint && (
          <span
            className={cn(
              "hidden rounded-full px-2 py-0.5 text-[10px] font-semibold sm:inline",
              index === 0 ? "bg-white/15 text-white" : "bg-muted text-muted-foreground",
            )}
          >
            {hint}
          </span>
        )}
      </div>
      <div className="mt-2 min-w-0 sm:mt-5">
        <p className="truncate font-display text-lg font-bold leading-tight tracking-tight tabular-nums sm:text-3xl">
          {typeof value === "number" ? <CountUp value={value} format={format} /> : value}
        </p>
        <p
          className={cn(
            "mt-0.5 line-clamp-2 text-[10px] leading-tight sm:mt-1 sm:text-sm",
            index === 0 ? "text-white/75" : "text-muted-foreground",
          )}
        >
          {label}
        </p>
      </div>
    </motion.div>
  );
}
