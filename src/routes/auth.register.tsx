import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import {
  Eye,
  EyeOff,
  Loader2,
  Lock,
  Mail,
  ShieldCheck,
  Smartphone,
  Sparkles,
  User,
  UserPlus,
} from "lucide-react";
import { AUTH_FIELD, AuthSplitLayout } from "@/components/auth/AuthSplitLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/lib/auth";
import { isValidPhone, normalizePhone } from "@/lib/phone";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/auth/register")({
  head: () => ({ meta: [{ title: "Créer un compte — EZOA-TO" }] }),
  component: RegisterPage,
});

function passwordStrength(pwd: string): { score: number; label: string; color: string } {
  if (!pwd) return { score: 0, label: "", color: "bg-muted" };
  let score = 0;
  if (pwd.length >= 8) score++;
  if (pwd.length >= 12) score++;
  if (/[A-Z]/.test(pwd) && /[a-z]/.test(pwd)) score++;
  if (/\d/.test(pwd)) score++;
  if (/[^A-Za-z0-9]/.test(pwd)) score++;
  if (score <= 2) return { score: 33, label: "Faible", color: "bg-destructive" };
  if (score <= 3) return { score: 66, label: "Moyen", color: "bg-tg-yellow" };
  return { score: 100, label: "Fort", color: "bg-primary" };
}

function RegisterPage() {
  const { register } = useAuth();
  const nav = useNavigate();
  const [loading, setLoading] = useState(false);
  const [showPwd, setShowPwd] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [password, setPassword] = useState("");
  const [confirmPwd, setConfirmPwd] = useState("");
  const [acceptTerms, setAcceptTerms] = useState(false);

  const strength = useMemo(() => passwordStrength(password), [password]);
  const pwdMismatch = confirmPwd.length > 0 && password !== confirmPwd;

  return (
    <AuthSplitLayout
      variant="register"
      title="Créer un compte"
      subtitle="Compte gratuit pour élèves et contributeurs — accède aux archives et soumets des épreuves."
    >
      <div className="mb-6 flex items-start gap-3 rounded-xl border border-primary/20 bg-primary/8 px-4 py-3 text-sm text-foreground">
        <Sparkles className="mt-0.5 size-4 shrink-0 text-primary" />
        <span>
          Inscription <strong>100 % gratuite</strong>. Devoirs et compositions accessibles sans abonnement.
        </span>
      </div>

      <form
        onSubmit={async (e) => {
          e.preventDefault();
          if (password !== confirmPwd) {
            toast.error("Les mots de passe ne correspondent pas.");
            return;
          }
          if (!acceptTerms) {
            toast.error("Accepte les conditions pour continuer.");
            return;
          }
          const fd = new FormData(e.currentTarget);
          const telephone = String(fd.get("telephone"));
          if (!isValidPhone(telephone)) {
            toast.error("Numéro de téléphone invalide (8 chiffres minimum).");
            return;
          }
          setLoading(true);
          try {
            await register(
              String(fd.get("nom")),
              String(fd.get("email")),
              normalizePhone(telephone),
              password,
            );
            toast.success("Compte créé ! Bienvenue sur EZOA-TO.");
            nav({ to: "/account" });
          } catch {
            toast.error("Inscription impossible. Email ou numéro déjà utilisé.");
          } finally {
            setLoading(false);
          }
        }}
        className="space-y-4"
      >
        <div className="space-y-2">
          <Label htmlFor="nom" className="text-sm font-medium">
            Nom complet
          </Label>
          <div className="relative">
            <User className="pointer-events-none absolute left-4 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              id="nom"
              name="nom"
              required
              minLength={2}
              placeholder="Ex. Afi Kouami"
              className={AUTH_FIELD}
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="email" className="text-sm font-medium">
            Adresse email
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

        <div className="space-y-2">
          <Label htmlFor="telephone" className="text-sm font-medium">
            Numéro de téléphone
          </Label>
          <div className="relative">
            <Smartphone className="pointer-events-none absolute left-4 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              id="telephone"
              name="telephone"
              type="tel"
              required
              autoComplete="tel"
              inputMode="tel"
              placeholder="90 12 34 56"
              className={AUTH_FIELD}
            />
          </div>
          <p className="text-xs text-muted-foreground">
            Utilisé pour la connexion, les paiements Mobile Money et les retraits contributeur.
          </p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="password" className="text-sm font-medium">
            Mot de passe
          </Label>
          <div className="relative">
            <Lock className="pointer-events-none absolute left-4 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              id="password"
              name="password"
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
              className="absolute right-3 top-1/2 -translate-y-1/2 rounded-md p-1 text-muted-foreground transition hover:text-foreground"
              aria-label={showPwd ? "Masquer le mot de passe" : "Afficher le mot de passe"}
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
                Force du mot de passe : <span className="font-medium text-foreground">{strength.label}</span>
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
              placeholder="Répète ton mot de passe"
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
              className="absolute right-3 top-1/2 -translate-y-1/2 rounded-md p-1 text-muted-foreground transition hover:text-foreground"
              aria-label={showConfirm ? "Masquer la confirmation" : "Afficher la confirmation"}
            >
              {showConfirm ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
            </button>
          </div>
          {pwdMismatch && (
            <p className="text-xs text-destructive">Les mots de passe ne correspondent pas.</p>
          )}
        </div>

        <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-border/60 bg-muted/30 px-4 py-3 text-sm">
          <input
            type="checkbox"
            checked={acceptTerms}
            onChange={(e) => setAcceptTerms(e.target.checked)}
            className="mt-0.5 size-4 shrink-0 rounded border-input accent-primary"
          />
          <span className="text-muted-foreground">
            J&apos;accepte les{" "}
            <Link to="/conditions" className="font-medium text-primary hover:underline">
              conditions d&apos;utilisation
            </Link>{" "}
            et la{" "}
            <Link to="/conditions#donnees-personnelles" className="font-medium text-primary hover:underline">
              politique de confidentialité
            </Link>{" "}
            de EZOA-TO.
          </span>
        </label>

        <Button
          type="submit"
          size="lg"
          className="tea-water-fill-none h-12 w-full rounded-xl text-base font-semibold shadow-md"
          disabled={loading || pwdMismatch || !acceptTerms}
        >
          {loading ? <Loader2 className="size-4 animate-spin" /> : <UserPlus className="size-4" />}
          {loading ? "Création du compte…" : "Créer mon compte gratuit"}
        </Button>

        <p className="pt-1 text-center text-sm text-muted-foreground">
          Déjà inscrit ?{" "}
          <Link to="/auth/login" className="font-semibold text-primary hover:underline">
            Se connecter
          </Link>
        </p>
      </form>

      <p className="mt-8 flex items-center gap-2 text-xs text-muted-foreground lg:hidden">
        <ShieldCheck className="size-3.5 shrink-0 text-primary/70" />
        Zone sécurisée — Tes données sont protégées
      </p>
    </AuthSplitLayout>
  );
}
