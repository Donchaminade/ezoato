import { Link } from "@tanstack/react-router";
import { BadgeCheck, ChevronRight, Crown } from "lucide-react";
import type { SubscriptionStatus } from "@/lib/types";
import {
  SUBSCRIPTION_DURATION_MONTHS,
  SUBSCRIPTION_PRICE,
} from "@/lib/subscription-constants";
import {
  formatSubscriptionDate,
  isSubscriptionExpiringSoon,
  subscriptionPriceLabel,
} from "@/lib/subscription-utils";
import { cn } from "@/lib/utils";

export function SubscriptionProUpgradeBanner({
  status,
  compact = false,
  className,
}: {
  status: SubscriptionStatus;
  compact?: boolean;
  className?: string;
}) {
  const priceLabel = subscriptionPriceLabel(status);

  return (
    <Link
      to="/account/abonnement"
      className={cn(
        "group block rounded-2xl border border-primary/30 bg-gradient-to-br from-primary/10 via-primary/5 to-emerald-500/10 p-4 shadow-sm transition hover:border-primary/50 hover:shadow-md sm:p-5",
        compact && "rounded-xl p-3 sm:p-4",
        className,
      )}
    >
      <div className="flex items-center gap-3 sm:gap-4">
        <div
          className={cn(
            "grid shrink-0 place-items-center rounded-xl bg-gradient-to-br from-primary to-emerald-600 text-white shadow-md",
            compact ? "size-10" : "size-12",
          )}
        >
          <Crown className={compact ? "size-5" : "size-6"} />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className="rounded-md border border-primary/40 bg-primary/10 px-1.5 py-0.5 text-[10px] font-extrabold tracking-wider text-primary">
              PRO
            </span>
            {status.expire && (
              <span className="rounded-md border border-destructive/30 bg-destructive/10 px-1.5 py-0.5 text-[10px] font-semibold text-destructive">
                Expiré
              </span>
            )}
          </div>
          <p className={cn("mt-1 font-display font-bold", compact ? "text-sm" : "text-base")}>
            {status.expire ? "Renouvelez votre accès illimité" : "Passer en abonnement Pro"}
          </p>
          <p className="text-xs text-muted-foreground sm:text-sm">
            Abonnement Pro — {priceLabel}
          </p>
          {!compact && (
            <p className="mt-1 text-xs text-muted-foreground">
              Toutes les épreuves payantes, sans payer à chaque fois.
            </p>
          )}
        </div>
        <ChevronRight className="size-4 shrink-0 text-primary transition group-hover:translate-x-0.5 sm:size-5" />
      </div>
    </Link>
  );
}

export function SubscriptionProStatusBadge({
  status,
  className,
}: {
  status: SubscriptionStatus;
  className?: string;
}) {
  if (!status.actif || !status.dateFin) return null;

  const expiringSoon = isSubscriptionExpiringSoon(status);
  const dateLabel = formatSubscriptionDate(status.dateFin);

  return (
    <Link
      to="/account/abonnement"
      className={cn(
        "group flex items-center gap-3 rounded-xl border border-primary/25 bg-primary/5 p-3 transition hover:border-primary/40 hover:bg-primary/10 sm:rounded-2xl sm:p-4",
        className,
      )}
    >
      <div className="grid size-10 shrink-0 place-items-center rounded-xl border border-primary/30 bg-primary/10 text-primary">
        <BadgeCheck className="size-5" />
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <span className="rounded-md border border-primary/40 bg-primary/10 px-1.5 py-0.5 text-[10px] font-extrabold tracking-wider text-primary">
            PRO
          </span>
          <span className="text-sm font-semibold text-primary">
            Pro actif · expire le {dateLabel}
          </span>
        </div>
        {expiringSoon && (
          <p className="mt-1 text-xs text-amber-600 dark:text-amber-400">
            Expire dans {status.joursRestants} jour{status.joursRestants > 1 ? "s" : ""} — renouvelez maintenant
          </p>
        )}
      </div>
      {expiringSoon ? (
        <span className="shrink-0 text-xs font-bold text-primary">Renouveler</span>
      ) : (
        <ChevronRight className="size-4 shrink-0 text-muted-foreground" />
      )}
    </Link>
  );
}

export function subscriptionProCtaLabel(): string {
  return `Passer en abonnement Pro — ${SUBSCRIPTION_PRICE.toLocaleString("fr-FR")} FCFA / ${SUBSCRIPTION_DURATION_MONTHS} mois`;
}
