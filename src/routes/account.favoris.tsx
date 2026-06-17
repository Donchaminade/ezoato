import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { Bookmark, Library } from "lucide-react";
import { AuthGate } from "@/components/account/AuthGate";
import { UserDashboardShell } from "@/components/dashboard/UserDashboardShell";
import { PageHeroBadge } from "@/components/layout/PageHeroBadge";
import { EpreuveCard } from "@/components/epreuves/EpreuveCard";
import { EpreuvePreviewDialog } from "@/components/epreuves/EpreuvePreviewDialog";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/lib/auth";
import { api } from "@/lib/api";
import type { Epreuve } from "@/lib/types";

export const Route = createFileRoute("/account/favoris")({
  head: () => ({ meta: [{ title: "Mes favoris — EZOA-TO" }] }),
  component: FavorisPage,
});

function FavorisPage() {
  return (
    <AuthGate
      badge={<PageHeroBadge icon={Bookmark}>Favoris</PageHeroBadge>}
      title="Mes favoris"
      description="Connecte-toi pour retrouver les épreuves que tu as enregistrées."
    >
      <FavorisContent />
    </AuthGate>
  );
}

function FavorisContent() {
  const { user } = useAuth();
  const [preview, setPreview] = useState<Epreuve | null>(null);
  const { data, refetch, isLoading } = useQuery({
    queryKey: ["favoris-epreuves"],
    queryFn: () => api.getFavorisEpreuves(),
    enabled: !!user,
  });

  if (!user) return null;

  const items = data?.items ?? [];

  return (
    <UserDashboardShell
      title="Mes favoris"
      subtitle="Épreuves que tu as enregistrées"
      activeSection="favoris"
      onRefresh={() => refetch()}
    >
      {isLoading && (
        <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-48 animate-pulse rounded-xl bg-muted" />
          ))}
        </div>
      )}

      {!isLoading && items.length === 0 && (
        <div className="rounded-xl border border-dashed border-border bg-card/50 px-6 py-12 text-center">
          <Bookmark className="mx-auto size-10 text-muted-foreground/60" aria-hidden />
          <p className="mt-4 font-display text-lg font-semibold">Aucun favori</p>
          <p className="mt-1 text-sm text-muted-foreground">
            Explore les archives et enregistre les épreuves qui t&apos;intéressent.
          </p>
          <Button asChild className="mt-6">
            <Link to="/docs">
              <Library className="size-4" />
              Explorer les archives
            </Link>
          </Button>
        </div>
      )}

      {!isLoading && items.length > 0 && (
        <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
          {items.map((ep) => (
            <EpreuveCard key={ep.id} epreuve={ep} onPreview={setPreview} />
          ))}
        </div>
      )}

      <EpreuvePreviewDialog
        epreuve={preview}
        open={!!preview}
        onOpenChange={(v) => !v && setPreview(null)}
      />
    </UserDashboardShell>
  );
}
