import { createFileRoute, Link, useNavigate, useSearch } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import {
  CheckCircle2,
  Eye,
  EyeOff,
  KeyRound,
  Loader2,
  Lock,
  LogIn,
  Mail,
  ShieldCheck,
  Smartphone,
} from "lucide-react";
import { AUTH_FIELD, AuthSplitLayout } from "@/components/auth/AuthSplitLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/lib/auth";
import { cn } from "@/lib/utils";

type LoginSearch = {
  logout?: string;
};

export const Route = createFileRoute("/auth/login")({
  validateSearch: (s: Record<string, unknown>): LoginSearch => ({
    logout: typeof s.logout === "string" ? s.logout : undefined,
  }),
  head: () => ({ meta: [{ title: "Connexion — EZOA-TO" }] }),
  component: LoginPage,
});

const FIELD =
  "h-12 rounded-xl border-input pl-11 pr-11 text-base shadow-sm md:text-base";

function LoginPage() {
  const { login } = useAuth();
  const nav = useNavigate();
  const { logout } = useSearch({ from: "/auth/login" });
  const [loading, setLoading] = useState(false);
  const [showPwd, setShowPwd] = useState(false);
  const loggedOut = logout === "1";

  return (
    <AuthSplitLayout variant="login" title="Connexion">
      {loggedOut && (
        <div className="mb-6 flex items-start gap-3 rounded-xl border border-green-500/25 bg-green-500/10 px-4 py-3 text-sm text-green-800 dark:text-green-200">
          <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-green-600 dark:text-green-400" />
          <span>Vous avez été déconnecté avec succès.</span>
        </div>
      )}

      <form
        onSubmit={async (e) => {
          e.preventDefault();
          const fd = new FormData(e.currentTarget);
          setLoading(true);
          try {
            const user = await login(String(fd.get("identifier")), String(fd.get("password")));
            toast.success("Connecté !");
            if (user.role === "admin" || user.role === "gestionnaire") {
              nav({ to: "/admin", search: { section: "overview" } });
            } else {
              nav({ to: "/account" });
            }
          } catch {
            toast.error("Identifiants incorrects.");
          } finally {
            setLoading(false);
          }
        }}
        className="space-y-5"
      >
        <div className="space-y-2">
          <Label htmlFor="identifier" className="text-sm font-medium">
            Email ou numéro de téléphone
          </Label>
          <div className="relative">
            <Mail className="pointer-events-none absolute left-4 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              id="identifier"
              name="identifier"
              type="text"
              required
              autoComplete="username"
              placeholder="ton.email@exemple.tg ou 90 12 34 56"
              className={AUTH_FIELD}
            />
          </div>
          <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <Smartphone className="size-3.5 shrink-0" />
            Tu peux te connecter avec l&apos;un ou l&apos;autre.
          </p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="password" className="sr-only">
            Mot de passe
          </Label>
          <div className="relative">
            <Lock className="pointer-events-none absolute left-4 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              id="password"
              name="password"
              type={showPwd ? "text" : "password"}
              required
              autoComplete="current-password"
              placeholder="Mot de passe"
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
        </div>

        <Button
          type="submit"
          size="lg"
          className="tea-water-fill-none h-12 w-full rounded-xl text-base font-semibold shadow-md"
          disabled={loading}
        >
          {loading ? (
            <Loader2 className="size-4 animate-spin" />
          ) : (
            <LogIn className="size-4" />
          )}
          {loading ? "Connexion…" : "Se connecter"}
        </Button>

        <div className="flex flex-col items-center gap-3 pt-1 sm:flex-row sm:justify-between">
          <Link
            to="/auth/forgot-password"
            className="inline-flex items-center gap-1.5 text-sm font-medium text-primary transition hover:underline"
          >
            <KeyRound className="size-3.5" />
            Mot de passe oublié ?
          </Link>
          <p className="text-sm text-muted-foreground">
            Pas de compte ?{" "}
            <Link to="/auth/register" className="font-semibold text-primary hover:underline">
              Créer un compte
            </Link>
          </p>
        </div>
      </form>

      <p className="mt-8 flex items-center gap-2 text-xs text-muted-foreground lg:hidden">
        <ShieldCheck className="size-3.5 shrink-0 text-primary/70" />
        Zone sécurisée — Accès réservé aux membres EZOA-TO
      </p>
    </AuthSplitLayout>
  );
}
