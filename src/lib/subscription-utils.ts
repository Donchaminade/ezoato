import type { SubscriptionStatus } from "@/lib/types";
import { SUBSCRIPTION_EXPIRING_SOON_DAYS } from "@/lib/subscription-constants";

export function formatSubscriptionDate(iso: string): string {
  try {
    return new Date(iso).toLocaleDateString("fr-FR");
  } catch {
    return iso;
  }
}

export function subscriptionPriceLabel(status: Pick<SubscriptionStatus, "montant" | "dureeMois">): string {
  return `${status.montant.toLocaleString("fr-FR")} FCFA / ${status.dureeMois} mois`;
}

export function isSubscriptionExpiringSoon(status: SubscriptionStatus): boolean {
  return status.actif && status.joursRestants > 0 && status.joursRestants <= SUBSCRIPTION_EXPIRING_SOON_DAYS;
}
