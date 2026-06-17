import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { Trophy, Upload, Wallet, Loader2 } from "lucide-react";
import { AuthGate } from "@/components/account/AuthGate";
import { PageHeroBadge } from "@/components/layout/PageHeroBadge";
import { PublicLayout } from "@/components/layout/PublicLayout";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/lib/auth";
import { EPREUVES_PAR_RECOMPENSE, formatFcfa, MONTANT_RECOMPENSE } from "@/lib/pricing";

export const Route = createFileRoute("/contributor")({
  head: () => ({ meta: [{ title: "Programme contributeur — EZOA-TO" }] }),
  component: ContributorPage,
});

/** Page publique « Devenir contributeur » — les comptes connectés sont redirigés vers le dashboard. */
function ContributorPage() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (loading || !user) return;
    if (user.role === "admin" || user.role === "gestionnaire") {
      navigate({ to: "/admin", search: { section: "overview" }, replace: true });
      return;
    }
    navigate({ to: "/account/portefeuille", replace: true });
  }, [user, loading, navigate]);

  if (loading || user) {
    return (
      <PublicLayout>
        <div className="flex min-h-[50vh] items-center justify-center">
          <Loader2 className="size-8 animate-spin text-muted-foreground" />
        </div>
      </PublicLayout>
    );
  }

  return (
    <AuthGate
      badge={<PageHeroBadge icon={Trophy}>Contributeur</PageHeroBadge>}
      title="Gagne en partageant"
      description="Crée un compte gratuit pour soumettre des épreuves validées et accumuler des récompenses."
    >
      <ContributorLanding />
    </AuthGate>
  );
}

function ContributorLanding() {
  return (
    <PublicLayout>
      <div className="mx-auto max-w-2xl px-4 py-16 text-center sm:px-6">
        <Trophy className="mx-auto size-12 text-primary" />
        <h1 className="mt-4 font-display text-3xl font-bold">Programme contributeur EZOA-TO</h1>
        <p className="mt-3 text-muted-foreground">
          Partage des épreuves de qualité et reçois{" "}
          <strong>{formatFcfa(MONTANT_RECOMPENSE)}</strong> tous les{" "}
          <strong>{EPREUVES_PAR_RECOMPENSE} épreuves validées</strong>.
        </p>
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <Button asChild size="lg" className="rounded-xl">
            <Link to="/auth/register">Créer un compte</Link>
          </Button>
          <Button asChild size="lg" variant="outline" className="rounded-xl">
            <Link to="/auth/login">Connexion</Link>
          </Button>
        </div>
        <div className="mt-10 grid gap-4 text-left sm:grid-cols-2">
          <div className="rounded-2xl border border-border bg-card p-5">
            <Upload className="size-5 text-primary" />
            <p className="mt-2 font-semibold">1. Soumets</p>
            <p className="text-sm text-muted-foreground">Photographie tes épreuves depuis ton téléphone.</p>
          </div>
          <div className="rounded-2xl border border-border bg-card p-5">
            <Wallet className="size-5 text-primary" />
            <p className="mt-2 font-semibold">2. Gagne</p>
            <p className="text-sm text-muted-foreground">Retire tes gains par Flooz ou T-Money.</p>
          </div>
        </div>
      </div>
    </PublicLayout>
  );
}
