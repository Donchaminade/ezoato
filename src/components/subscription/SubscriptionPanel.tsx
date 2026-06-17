import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { BadgeCheck, Crown, Loader2, Smartphone, AlertCircle } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { DashboardSectionCard } from "@/components/dashboard/DashboardSectionCard";
import { api } from "@/lib/api";
import type { PaymentInit, SubscriptionStatus } from "@/lib/types";
import {
  SUBSCRIPTION_DURATION_MONTHS,
  SUBSCRIPTION_PRICE,
} from "@/lib/subscription-constants";
import { formatSubscriptionDate, subscriptionPriceLabel } from "@/lib/subscription-utils";
import { formatFcfa } from "@/lib/pricing";

type Step = "idle" | "phone" | "instructions" | "confirming";

export function SubscriptionPanel({ status }: { status: SubscriptionStatus }) {
  const qc = useQueryClient();
  const [step, setStep] = useState<Step>("idle");
  const [methode, setMethode] = useState<"flooz" | "tmoney">("flooz");
  const [telephone, setTelephone] = useState("");
  const [payment, setPayment] = useState<PaymentInit | null>(null);
  const [loading, setLoading] = useState(false);

  const priceLabel = subscriptionPriceLabel(status);
  const canSubscribe = !status.actif;

  async function handleInitier() {
    if (telephone.replace(/\D/g, "").length < 8) {
      toast.error("Entrez un numéro valide");
      return;
    }
    setLoading(true);
    try {
      const init = await api.initierAbonnement(methode, telephone);
      if (init.alreadyPaid) {
        toast.success("Abonnement activé — accès débloqué");
        qc.invalidateQueries({ queryKey: ["subscription-status"] });
        setStep("idle");
        return;
      }
      setPayment(init);
      setStep("instructions");
    } catch {
      toast.error("Impossible d'initier l'abonnement");
    } finally {
      setLoading(false);
    }
  }

  async function handleConfirmer() {
    if (!payment) return;
    setStep("confirming");
    setLoading(true);
    try {
      const res = await api.confirmerAbonnement(payment.reference);
      if (res.actif) {
        toast.success("Abonnement activé — accès débloqué");
        qc.invalidateQueries({ queryKey: ["subscription-status"] });
        setStep("idle");
        setPayment(null);
        setTelephone("");
      } else {
        toast.error("Paiement non confirmé. Réessayez.");
        setStep("instructions");
      }
    } catch {
      toast.error("Paiement non confirmé. Réessayez après avoir payé via Mobile Money.");
      setStep("instructions");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-6">
      <DashboardSectionCard
        title="Statut"
        subtitle="Accès illimité aux épreuves payantes"
      >
        <div className="flex items-start gap-4">
          <div className="grid size-12 shrink-0 place-items-center rounded-xl bg-gradient-to-br from-primary to-emerald-600 text-white">
            {status.actif ? (
              <BadgeCheck className="size-6" />
            ) : status.expire ? (
              <AlertCircle className="size-6" />
            ) : (
              <Crown className="size-6" />
            )}
          </div>
          <div className="min-w-0">
            <p className="font-display text-lg font-bold">
              {status.actif
                ? "Abonnement actif"
                : status.expire
                  ? "Abonnement expiré"
                  : "Pas d'abonnement actif"}
            </p>
            {status.actif && status.dateFin && (
              <dl className="mt-3 space-y-1 text-sm">
                <div className="flex justify-between gap-4">
                  <dt className="text-muted-foreground">Expire le</dt>
                  <dd className="font-medium">{formatSubscriptionDate(status.dateFin)}</dd>
                </div>
                <div className="flex justify-between gap-4">
                  <dt className="text-muted-foreground">Jours restants</dt>
                  <dd className="font-medium">{status.joursRestants} jour{status.joursRestants > 1 ? "s" : ""}</dd>
                </div>
              </dl>
            )}
            {!status.actif && (
              <p className="mt-2 text-sm text-muted-foreground">
                {status.expire
                  ? `Renouvelez (${priceLabel}) pour retrouver l'accès illimité aux épreuves payantes.`
                  : "Accédez à toutes les épreuves payantes sans payer à chaque fois."}
              </p>
            )}
            {!status.actif && (
              <p className="mt-2 text-sm">
                <span className="text-muted-foreground">Tarif : </span>
                <span className="font-semibold">{priceLabel}</span>
              </p>
            )}
          </div>
        </div>
      </DashboardSectionCard>

      {canSubscribe && step === "idle" && (
        <Button
          className="w-full rounded-xl"
          size="lg"
          onClick={() => setStep("phone")}
        >
          <Crown className="size-4" />
          {status.expire
            ? `Renouveler — ${priceLabel}`
            : `S'abonner — ${priceLabel}`}
        </Button>
      )}

      {canSubscribe && step === "phone" && (
        <DashboardSectionCard title="Paiement Mobile Money" subtitle={`${formatFcfa(SUBSCRIPTION_PRICE)} / ${SUBSCRIPTION_DURATION_MONTHS} mois`}>
          <p className="text-sm text-muted-foreground">
            Accès illimité à toutes les épreuves payantes pendant {SUBSCRIPTION_DURATION_MONTHS} mois.
          </p>
          <div className="mt-4 grid grid-cols-2 gap-3">
            {(["flooz", "tmoney"] as const).map((m) => (
              <button
                key={m}
                type="button"
                onClick={() => setMethode(m)}
                className={`rounded-xl border p-3 text-left transition ${
                  methode === m ? "border-primary bg-primary/5" : "border-border hover:border-primary/30"
                }`}
              >
                <div className="font-semibold">{m === "flooz" ? "Flooz" : "T-Money"}</div>
                <div className="text-xs text-muted-foreground">
                  {m === "flooz" ? "Moov Africa" : "Togocom / Yas"}
                </div>
              </button>
            ))}
          </div>
          <div className="mt-4 space-y-2">
            <Label htmlFor="sub-tel">Numéro Mobile Money</Label>
            <div className="relative">
              <Smartphone className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                id="sub-tel"
                placeholder="90 XX XX XX"
                value={telephone}
                onChange={(e) => setTelephone(e.target.value)}
                className="pl-9"
              />
            </div>
          </div>
          <div className="mt-4 flex gap-2">
            <Button variant="outline" onClick={() => setStep("idle")}>Annuler</Button>
            <Button className="flex-1" onClick={handleInitier} disabled={loading}>
              {loading && <Loader2 className="size-4 animate-spin" />}
              Continuer
            </Button>
          </div>
        </DashboardSectionCard>
      )}

      {canSubscribe && step === "instructions" && payment && (
        <DashboardSectionCard title={payment.instructions.titre}>
          <ol className="space-y-2 text-sm">
            {payment.instructions.etapes.map((e, i) => (
              <li key={i} className="flex gap-2">
                <span className="grid size-5 shrink-0 place-items-center rounded-full bg-primary text-xs font-bold text-primary-foreground">
                  {i + 1}
                </span>
                {e}
              </li>
            ))}
          </ol>
          <p className="mt-3 rounded-md bg-muted px-3 py-2 font-mono text-sm font-semibold">
            {payment.reference}
          </p>
          <Button className="mt-4 w-full" onClick={handleConfirmer} disabled={loading}>
            {loading && <Loader2 className="size-4 animate-spin" />}
            J&apos;ai payé — confirmer
          </Button>
        </DashboardSectionCard>
      )}

      {step === "confirming" && (
        <div className="flex flex-col items-center gap-3 py-8">
          <Loader2 className="size-8 animate-spin text-primary" />
          <p className="text-sm text-muted-foreground">Vérification du paiement…</p>
        </div>
      )}
    </div>
  );
}
