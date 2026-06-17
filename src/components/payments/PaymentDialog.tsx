import { useState } from "react";
import { Loader2, Smartphone, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { api } from "@/lib/api";
import type { Epreuve, PaymentInit } from "@/lib/types";
import { formatFcfa, getPrixFcfa } from "@/lib/pricing";

type Step = "method" | "phone" | "instructions" | "confirming" | "done";

export function PaymentDialog({
  epreuve,
  open,
  onOpenChange,
  onSuccess,
}: {
  epreuve: Epreuve;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}) {
  const [step, setStep] = useState<Step>("method");
  const [methode, setMethode] = useState<"flooz" | "tmoney">("flooz");
  const [telephone, setTelephone] = useState("");
  const [payment, setPayment] = useState<PaymentInit | null>(null);
  const [loading, setLoading] = useState(false);

  function reset() {
    setStep("method");
    setMethode("flooz");
    setTelephone("");
    setPayment(null);
    setLoading(false);
  }

  function handleClose(v: boolean) {
    if (!v) reset();
    onOpenChange(v);
  }

  async function handleInitier() {
    if (telephone.replace(/\D/g, "").length < 8) {
      toast.error("Entrez un numéro valide");
      return;
    }
    setLoading(true);
    try {
      const p = await api.initierPaiement(epreuve.id, methode, telephone);
      setPayment(p);
      setStep("instructions");
    } catch {
      toast.error("Impossible d'initier le paiement");
    } finally {
      setLoading(false);
    }
  }

  async function handleConfirmer() {
    if (!payment) return;
    setStep("confirming");
    setLoading(true);
    try {
      await api.confirmerPaiement(payment.reference);
      setStep("done");
      toast.success("Paiement confirmé !");
      onSuccess();
    } catch {
      toast.error("Paiement non confirmé. Réessayez après avoir payé via Mobile Money.");
      setStep("instructions");
    } finally {
      setLoading(false);
    }
  }

  const prix = getPrixFcfa(epreuve);
  const isCorrige = epreuve.type === "corrige";

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="font-display">
            {isCorrige ? "Acheter le corrigé type" : "Télécharger l'examen national"}
          </DialogTitle>
          <DialogDescription>
            {epreuve.titre} — {formatFcfa(prix)} (accès 6 mois)
          </DialogDescription>
        </DialogHeader>

        {step === "method" && (
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              {isCorrige
                ? `Le corrigé type coûte le double du sujet (${formatFcfa(prix)}). Accès 6 mois après paiement.`
                : `Les examens nationaux (CEPD, BEPC, BAC) sont payants à ${formatFcfa(prix)}. Les devoirs et compositions restent gratuits.`}
            </p>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setMethode("flooz")}
                className={`rounded-xl border p-4 text-left transition ${
                  methode === "flooz" ? "border-primary bg-primary/5" : "border-border hover:border-primary/30"
                }`}
              >
                <div className="font-semibold text-orange-600">Flooz</div>
                <div className="text-xs text-muted-foreground">Moov Africa</div>
              </button>
              <button
                type="button"
                onClick={() => setMethode("tmoney")}
                className={`rounded-xl border p-4 text-left transition ${
                  methode === "tmoney" ? "border-primary bg-primary/5" : "border-border hover:border-primary/30"
                }`}
              >
                <div className="font-semibold text-blue-600">T-Money</div>
                <div className="text-xs text-muted-foreground">Togocom / Yas</div>
              </button>
            </div>
            <Button className="w-full" onClick={() => setStep("phone")}>
              Continuer avec {methode === "flooz" ? "Flooz" : "T-Money"}
            </Button>
          </div>
        )}

        {step === "phone" && (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="tel">Numéro Mobile Money</Label>
              <div className="relative">
                <Smartphone className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  id="tel"
                  placeholder="90 XX XX XX"
                  value={telephone}
                  onChange={(e) => setTelephone(e.target.value)}
                  className="pl-9"
                />
              </div>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setStep("method")}>Retour</Button>
              <Button className="flex-1" onClick={handleInitier} disabled={loading}>
                {loading && <Loader2 className="size-4 animate-spin" />}
                Payer {formatFcfa(payment?.montant ?? prix)}
              </Button>
            </div>
          </div>
        )}

        {step === "instructions" && payment && (
          <div className="space-y-4">
            <div className="rounded-lg border border-border bg-muted/40 p-4">
              <p className="font-semibold">{payment.instructions.titre}</p>
              <ol className="mt-3 space-y-2 text-sm">
                {payment.instructions.etapes.map((e, i) => (
                  <li key={i} className="flex gap-2">
                    <span className="grid size-5 shrink-0 place-items-center rounded-full bg-primary text-xs font-bold text-primary-foreground">
                      {i + 1}
                    </span>
                    {e}
                  </li>
                ))}
              </ol>
              <p className="mt-3 rounded-md bg-background px-3 py-2 font-mono text-sm font-semibold">
                {payment.reference}
              </p>
            </div>
            <Button className="w-full" onClick={handleConfirmer} disabled={loading}>
              {loading && <Loader2 className="size-4 animate-spin" />}
              J'ai payé — Confirmer
            </Button>
            <p className="text-center text-xs text-muted-foreground">
              Cliquez après avoir effectué le paiement sur votre téléphone.
            </p>
          </div>
        )}

        {step === "confirming" && (
          <div className="flex flex-col items-center gap-3 py-8">
            <Loader2 className="size-8 animate-spin text-primary" />
            <p className="text-sm text-muted-foreground">Vérification du paiement…</p>
          </div>
        )}

        {step === "done" && (
          <div className="flex flex-col items-center gap-3 py-6">
            <CheckCircle2 className="size-12 text-green-600" />
            <p className="font-semibold">Paiement réussi !</p>
            <p className="text-center text-sm text-muted-foreground">
              Vous pouvez maintenant télécharger ce contenu autant de fois que vous voulez depuis votre bibliothèque.
            </p>
            <Button onClick={() => handleClose(false)}>Fermer</Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
