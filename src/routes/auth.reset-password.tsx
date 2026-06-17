import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  AlertTriangle,
  ArrowLeft,
  CheckCircle2,
  Eye,
  EyeOff,
  Loader2,
  Lock,
} from "lucide-react";
import { AUTH_FIELD, AuthSplitLayout } from "@/components/auth/AuthSplitLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { api } from "@/lib/api";
import { cn } from "@/lib/utils";

type ResetSearch = {
  token?: string;
};

export const Route = createFileRoute("/auth/reset-password")({
  validateSearch: (s: Record<string, unknown>): ResetSearch => ({
    token: typeof s.token === "string" ? s.token : undefined,
  }),
  head: () => ({ meta: [{ title: "Nouveau mot de passe — EZOA-TO" }] }),
  component: ResetPasswordPage,
});

function passwordStrength(pwd: string): { score: number; label: string; color: string } {
  if (!pwd) return { score: 0, label: "", color: "bg-muted" };
  let score = 0;
  if (pwd.length >= 8) score++;
  if (pwd.length >= 12) score++;
  if (/[A-Z]/.test(pwd) && /[a-z]/.test(pwd)) score++;
  if (/\d/.test(pwd)) score++;
  if (score <= 2) return { score: 33, label: "Faible", color: "bg-destructive" };
  if (score <= 3) return { score: 66, label: "Moyen", color: "bg-tg-yellow" };
  return { score: 100, label: "Fort", color: "bg-primary" };
}

function ResetPasswordPage() {
  const { token } = Route.useSearch();
  const [password, setPassword] = useState("");
  const [confirmPwd, setConfirmPwd] = useState("");
  const [showPwd, setShowPwd] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  const { data: verification, isLoading: verifying } = useQuery({
    queryKey: ["verify-reset", token],
    queryFn: () => api.verifyResetToken(token!),
    enabled: !!token && token.length >= 32,
    retry: false,
  });

  const strength = useMemo(() => passwordStrength(password), [password]);
  const pwdMismatch = confirmPwd.length > 0 && password !== confirmPwd;
  const tokenValid = !!verification?.valid;

  useEffect(() => {
    if (!token) toast.error("Lien de réinitialisation manquant.");
  }, [token]);

  if (!token) {
    return (
      <AuthSplitLayout variant="login" title="Lien invalide">
        <InvalidLink message="Ce lien de réinitialisation est incomplet." />
      </AuthSplitLayout>
    );
  }

  if (verifying) {
    return (
      <AuthSplitLayout variant="login" title="Vérification du lien">
        <div className="flex justify-center py-12">
          <Loader2 className="size-8 animate-spin text-primary" aria-label="Vérification" />
        </div>
      </AuthSplitLayout>
    );
  }

  if (!tokenValid) {
    return (
      <AuthSplitLayout variant="login" title="Lien expiré">
        <InvalidLink message="Ce lien est invalide ou a expiré. Demande un nouveau lien." />
      </AuthSplitLayout>
    );
  }

  if (done) {
    return (
      <AuthSplitLayout variant="login" title="Mot de passe mis à jour">
        <div className="space-y-5">
          <div className="flex items-start gap-3 rounded-xl border border-green-500/25 bg-green-500/10 px-4 py-4 text-sm text-green-800 dark:text-green-200">
            <CheckCircle2 className="mt-0.5 size-5 shrink-0" />
            <p>Ton mot de passe a été modifié. Tu peux te connecter avec ton nouveau mot de passe.</p>
          </div>
          <Button asChild className="h-12 w-full rounded-xl">
            <Link to="/auth/login">Se connecter</Link>
          </Button>
        </div>
      </AuthSplitLayout>
    );
  }

  return (
    <AuthSplitLayout
      variant="login"
      title="Nouveau mot de passe"
      subtitle={
        verification?.email
          ? `Compte : ${verification.email}`
          : "Choisis un mot de passe sécurisé (8 caractères minimum)."
      }
    >
      <form
        onSubmit={async (e) => {
          e.preventDefault();
          if (password !== confirmPwd) {
            toast.error("Les mots de passe ne correspondent pas.");
            return;
          }
          setLoading(true);
          try {
            const res = await api.resetPassword(token, password);
            setDone(true);
            toast.success(res.message);
          } catch (err) {
            toast.error(err instanceof Error ? err.message : "Échec de la réinitialisation");
          } finally {
            setLoading(false);
          }
        }}
        className="space-y-4"
      >
        <div className="space-y-2">
          <Label htmlFor="password" className="text-sm font-medium">
            Nouveau mot de passe
          </Label>
          <div className="relative">
            <Lock className="pointer-events-none absolute left-4 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              id="password"
              type={showPwd ? "text" : "password"}
              minLength={8}
              required
              autoComplete="new-password"
              placeholder="8 caractères minimum"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className={cn(AUTH_FIELD, "pr-11")}
            />
            <button
              type="button"
              onClick={() => setShowPwd((v) => !v)}
              className="absolute right-3 top-1/2 -translate-y-1/2 rounded-md p-1 text-muted-foreground hover:text-foreground"
              aria-label={showPwd ? "Masquer" : "Afficher"}
            >
              {showPwd ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
            </button>
          </div>
          {password.length > 0 && (
            <div className="space-y-1.5">
              <div className="h-1.5 overflow-hidden rounded-full bg-muted">
                <div
                  className={cn(
                    "h-full rounded-full transition-all duration-300",
                    strength.color,
                    strength.score <= 33 && "w-1/3",
                    strength.score > 33 && strength.score <= 66 && "w-2/3",
                    strength.score > 66 && "w-full",
                  )}
                />
              </div>
              <p className="text-xs text-muted-foreground">
                Force : <span className="font-medium text-foreground">{strength.label}</span>
              </p>
            </div>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="confirm" className="text-sm font-medium">
            Confirmer le mot de passe
          </Label>
          <div className="relative">
            <Lock className="pointer-events-none absolute left-4 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              id="confirm"
              type={showConfirm ? "text" : "password"}
              required
              autoComplete="new-password"
              placeholder="Répète le mot de passe"
              value={confirmPwd}
              onChange={(e) => setConfirmPwd(e.target.value)}
              className={cn(
                AUTH_FIELD,
                "pr-11",
                pwdMismatch && "border-destructive focus-visible:ring-destructive",
              )}
            />
            <button
              type="button"
              onClick={() => setShowConfirm((v) => !v)}
              className="absolute right-3 top-1/2 -translate-y-1/2 rounded-md p-1 text-muted-foreground hover:text-foreground"
              aria-label={showConfirm ? "Masquer" : "Afficher"}
            >
              {showConfirm ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
            </button>
          </div>
          {pwdMismatch && (
            <p className="text-xs text-destructive">Les mots de passe ne correspondent pas.</p>
          )}
        </div>

        <Button
          type="submit"
          size="lg"
          className="tea-water-fill-none h-12 w-full rounded-xl text-base font-semibold shadow-md"
          disabled={loading || pwdMismatch}
        >
          {loading ? <Loader2 className="size-4 animate-spin" /> : <Lock className="size-4" />}
          {loading ? "Enregistrement…" : "Enregistrer le nouveau mot de passe"}
        </Button>
      </form>
    </AuthSplitLayout>
  );
}

function InvalidLink({ message }: { message: string }) {
  return (
    <div className="space-y-5">
      <div className="flex items-start gap-3 rounded-xl border border-destructive/25 bg-destructive/10 px-4 py-4 text-sm">
        <AlertTriangle className="mt-0.5 size-5 shrink-0 text-destructive" />
        <p>{message}</p>
      </div>
      <div className="flex flex-col gap-3 sm:flex-row">
        <Button asChild className="h-11 flex-1 rounded-xl">
          <Link to="/auth/forgot-password">Demander un nouveau lien</Link>
        </Button>
        <Button asChild variant="outline" className="tea-water-fill-none h-11 flex-1 rounded-xl">
          <Link to="/auth/login">
            <ArrowLeft className="size-4" /> Connexion
          </Link>
        </Button>
      </div>
    </div>
  );
}
