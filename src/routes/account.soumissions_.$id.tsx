import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import {
  FileText, MapPin, Calendar, Building2, ExternalLink,
  Clock, CheckCircle2, XCircle, AlertTriangle, ArrowLeft,
} from "lucide-react";
import { AuthGate } from "@/components/account/AuthGate";
import { AuthenticatedPdf } from "@/components/admin/AuthenticatedMedia";
import { UserDashboardShell } from "@/components/dashboard/UserDashboardShell";
import { PageHeroBadge } from "@/components/layout/PageHeroBadge";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/lib/auth";
import { api } from "@/lib/api";

export const Route = createFileRoute("/account/soumissions_/$id")({
  head: () => ({ meta: [{ title: "Détail soumission — EZOA-TO" }] }),
  component: SoumissionDetailPage,
});

const STATUT_LABELS = {
  en_attente: "En attente",
  validee: "Validée",
  rejetee: "Rejetée",
} as const;

function SoumissionDetailPage() {
  return (
    <AuthGate
      badge={<PageHeroBadge icon={FileText}>Détail</PageHeroBadge>}
      title="Détail de soumission"
      description="Connecte-toi pour consulter le détail de ta soumission."
    >
      <SoumissionDetailContent />
    </AuthGate>
  );
}

function SoumissionDetailContent() {
  const { id } = Route.useParams();
  const { user } = useAuth();
  const { data, isLoading, isError } = useQuery({
    queryKey: ["my-soumission", id],
    queryFn: () => api.getMySoumission(id),
    enabled: !!user,
    retry: false,
  });

  if (!user) return null;

  const statutIcon = {
    en_attente: Clock,
    validee: CheckCircle2,
    rejetee: XCircle,
  }[data?.statut ?? "en_attente"];

  const StatutIcon = statutIcon;

  return (
    <UserDashboardShell
      title={data?.titre ?? "Détail soumission"}
      subtitle={data ? `${data.matiere} · ${data.classe} · ${data.annee}` : "Chargement…"}
      activeSection="soumissions"
      actions={
        <Button asChild variant="outline" size="sm" className="rounded-xl">
          <Link to="/account/soumissions"><ArrowLeft className="size-4" /> Retour</Link>
        </Button>
      }
    >
      {isLoading && (
        <div className="h-64 animate-pulse rounded-2xl bg-muted" />
      )}

      {!isLoading && (isError || !data) && (
        <div className="rounded-2xl border border-border bg-card p-8 text-center">
          <p className="font-medium">Soumission introuvable</p>
          <p className="mt-1 text-sm text-muted-foreground">
            Cette soumission n&apos;existe pas ou n&apos;est plus accessible.
          </p>
          <Button asChild className="mt-4 rounded-xl hover:text-primary-foreground">
            <Link to="/account/soumissions">Retour aux soumissions</Link>
          </Button>
        </div>
      )}

      {data && (
        <div className="space-y-6">
          <div className={`rounded-2xl p-6 ${
            data.statut === "validee" ? "border border-green-500/30 bg-green-500/10" :
            data.statut === "rejetee" ? "border border-destructive/30 bg-destructive/10" :
            "border border-amber-500/30 bg-amber-500/10"
          }`}>
            <div className="flex items-center gap-3">
              <StatutIcon className={`size-8 ${
                data.statut === "validee" ? "text-green-600" :
                data.statut === "rejetee" ? "text-destructive" : "text-amber-600"
              }`} />
              <div>
                <Badge variant="outline" className="mb-1">{STATUT_LABELS[data.statut]}</Badge>
                <p className="font-display text-lg font-semibold">{data.titre}</p>
              </div>
            </div>
            {data.statut === "en_attente" && (
              <p className="mt-3 text-sm text-muted-foreground">
                Un gestionnaire examine ta soumission. Délai habituel : 24 à 48h.
              </p>
            )}
            {data.statut === "validee" && data.epreuveId && (
              <Button asChild className="mt-4 rounded-xl hover:text-primary-foreground" size="sm">
                <Link to="/epreuves/$id" params={{ id: data.epreuveId }}>
                  <ExternalLink className="size-4" /> Voir l&apos;épreuve publiée
                </Link>
              </Button>
            )}
            {data.statut === "rejetee" && data.motifRejet && (
              <div className="mt-3 rounded-lg bg-background/60 p-3 text-sm">
                <p className="font-semibold text-destructive">Motif du rejet</p>
                <p className="mt-1">{data.motifRejet}</p>
              </div>
            )}
          </div>

          <dl className="grid grid-cols-2 gap-4 sm:grid-cols-3">
            <div className="rounded-xl border border-border bg-card p-4">
              <dt className="text-xs text-muted-foreground">Matière</dt>
              <dd className="mt-1 font-medium">{data.matiere}</dd>
            </div>
            <div className="rounded-xl border border-border bg-card p-4">
              <dt className="text-xs text-muted-foreground">Niveau</dt>
              <dd className="mt-1 font-medium capitalize">{data.niveau ?? "—"}</dd>
            </div>
            <div className="rounded-xl border border-border bg-card p-4">
              <dt className="text-xs text-muted-foreground">Classe</dt>
              <dd className="mt-1 font-medium">{data.classe}</dd>
            </div>
            <div className="rounded-xl border border-border bg-card p-4">
              <dt className="text-xs text-muted-foreground">Année</dt>
              <dd className="mt-1 font-medium">{data.annee}</dd>
            </div>
            <div className="rounded-xl border border-border bg-card p-4">
              <dt className="text-xs text-muted-foreground">Type</dt>
              <dd className="mt-1 font-medium capitalize">
                {data.type}
                {data.periode ? ` · ${data.periode}` : ""}
                {data.examen ? ` · ${data.examen}` : ""}
              </dd>
            </div>
            <div className="rounded-xl border border-border bg-card p-4">
              <dt className="text-xs text-muted-foreground flex items-center gap-1">
                <MapPin className="size-3" /> Ville
              </dt>
              <dd className="mt-1 font-medium">{data.ville}</dd>
            </div>
            <div className="rounded-xl border border-border bg-card p-4 sm:col-span-2">
              <dt className="text-xs text-muted-foreground flex items-center gap-1">
                {data.etablissement ? <Building2 className="size-3" /> : null} Établissement
              </dt>
              <dd className="mt-1 font-medium">{data.etablissement ?? data.examen ?? "—"}</dd>
            </div>
          </dl>

          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Calendar className="size-3.5" />
            Soumis le {new Date(data.soumisLe).toLocaleDateString("fr-FR", { dateStyle: "long" })}
            {data.pages ? ` · ${data.pages} page${data.pages > 1 ? "s" : ""}` : ""}
          </div>

          <div className="overflow-hidden rounded-xl border border-border">
            <div className="border-b border-border bg-muted/40 px-4 py-2 text-sm font-medium">
              <FileText className="mr-2 inline size-4" /> Aperçu soumis
            </div>
            {data.pdfPreviewUrl && data.pdfPreviewUrl !== "#" ? (
              <AuthenticatedPdf url={data.pdfPreviewUrl} />
            ) : (
              <div className="grid h-64 place-items-center text-muted-foreground">
                <div className="text-center">
                  <FileText className="mx-auto size-10 opacity-50" />
                  <p className="mt-2 text-sm">Aperçu indisponible</p>
                </div>
              </div>
            )}
          </div>

          {data.doublonsPotentiels?.length ? (
            <div className="flex items-start gap-2 rounded-lg border border-warning/40 bg-warning/10 p-3 text-sm">
              <AlertTriangle className="size-4 shrink-0 text-warning" />
              <p>Des épreuves similaires existent déjà. Le gestionnaire comparera avant validation.</p>
            </div>
          ) : null}
        </div>
      )}
    </UserDashboardShell>
  );
}
