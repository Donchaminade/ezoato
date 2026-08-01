import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { ArrowLeft, CheckCircle2, KeyRound, LifeBuoy, Loader2, Mail } from "lucide-react";
import { AUTH_FIELD, AuthSplitLayout } from "@/components/auth/AuthSplitLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { api } from "@/lib/api";

export const Route = createFileRoute("/auth/forgot-password")({
  head: () => ({ meta: [{ title: "Mot de passe oublié — EZOA-TO" }] }),
  component: ForgotPasswordPage,
});

function ForgotPasswordPage() {
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [devLink, setDevLink] = useState<string | null>(null);

  return (
    <AuthSplitLayout
      variant="login"
      title="Mot de passe oublié"
      subtitle="Saisis ton adresse email. Si un compte existe, tu recevras un lien valide 1 heure."
    >
      {sent ? (
        <div className="space-y-5">
          <div className="flex items-start gap-3 rounded-xl border border-green-500/25 bg-green-500/10 px-4 py-4 text-sm text-green-800 dark:text-green-200">
            <CheckCircle2 className="mt-0.5 size-5 shrink-0 text-green-600 dark:text-green-400" />
            <div>
              <p className="font-medium">Demande enregistrée</p>
              <p className="mt-1 text-green-700/90 dark:text-green-300/90">
                Si un compte EZOA-TO est associé à cet email, un lien de réinitialisation vient d&apos;être envoyé.
                Vérifie aussi tes spams.
              </p>
            </div>
          </div>

          {devLink && (
            <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm">
              <p className="font-medium text-amber-900 dark:text-amber-100">Mode développement</p>
              <p className="mt-1 text-amber-800/90 dark:text-amber-200/90">
                Lien de test (email local non configuré) :
              </p>
              <a
                href={devLink}
                className="mt-2 block break-all font-medium text-primary hover:underline"
              >
                {devLink}
              </a>
            </div>
          )}

          <Button asChild variant="outline" className="tea-water-fill-none h-11 w-full rounded-xl">
            <Link to="/auth/login">
              <ArrowLeft className="size-4" /> Retour à la connexion
            </Link>
          </Button>
          <p className="text-center text-sm text-muted-foreground">
            Tu n&apos;as pas reçu le lien ?{" "}
            <Link to="/contact" className="inline-flex items-center gap-1 font-semibold text-primary hover:underline">
              <LifeBuoy className="size-3.5" /> Contacter le support
            </Link>
          </p>
        </div>
      ) : (
        <form
          onSubmit={async (e) => {
            e.preventDefault();
            const fd = new FormData(e.currentTarget);
            const email = String(fd.get("email"));
            setLoading(true);
            try {
              const res = await api.requestPasswordReset(email);
              setSent(true);
              if (res.resetUrl) setDevLink(res.resetUrl);
              toast.success(res.message);
            } catch (err) {
              toast.error(err instanceof Error ? err.message : "Impossible d'envoyer la demande");
            } finally {
              setLoading(false);
            }
          }}
          className="space-y-5"
        >
          <div className="space-y-2">
            <Label htmlFor="email" className="text-sm font-medium">
              Adresse email du compte
            </Label>
            <div className="relative">
              <Mail className="pointer-events-none absolute left-4 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                id="email"
                name="email"
                type="email"
                required
                autoComplete="email"
                placeholder="ton.email@exemple.tg"
                className={AUTH_FIELD}
              />
            </div>
          </div>

          <Button
            type="submit"
            size="lg"
            className="tea-water-fill-none h-12 w-full rounded-xl text-base font-semibold shadow-md"
            disabled={loading}
          >
            {loading ? <Loader2 className="size-4 animate-spin" /> : <KeyRound className="size-4" />}
            {loading ? "Envoi…" : "Envoyer le lien de réinitialisation"}
          </Button>

          <p className="text-center text-sm text-muted-foreground">
            <Link to="/auth/login" className="inline-flex items-center gap-1 font-semibold text-primary hover:underline">
              <ArrowLeft className="size-3.5" /> Retour à la connexion
            </Link>
          </p>
          <p className="text-center text-sm text-muted-foreground">
            Problème avec la réinitialisation ?{" "}
            <Link to="/contact" className="inline-flex items-center gap-1 font-semibold text-primary hover:underline">
              <LifeBuoy className="size-3.5" /> Contacter le support
            </Link>
          </p>
        </form>
      )}
    </AuthSplitLayout>
  );
}
