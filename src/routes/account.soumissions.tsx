import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Upload, Eye, Clock, CheckCircle2, XCircle, ClipboardList } from "lucide-react";
import { AuthGate } from "@/components/account/AuthGate";
import { UserDashboardShell } from "@/components/dashboard/UserDashboardShell";
import {
  DataTableShell,
  DataTableEmptyRow,
  TableHeader,
  TableBody,
  TableHead,
  TableRow,
  TableCell,
} from "@/components/dashboard/DataTableShell";
import { DataTableToolbar } from "@/components/dashboard/DataTableToolbar";
import { TableActions } from "@/components/dashboard/TableActions";
import { usePagination } from "@/hooks/use-pagination";
import { PageHeroBadge } from "@/components/layout/PageHeroBadge";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/lib/auth";
import { api } from "@/lib/api";
import { MiniStatCard } from "@/components/dashboard/MiniStatCard";
import { dashboardTripleStatGrid } from "@/lib/dashboard-mobile";

export const Route = createFileRoute("/account/soumissions")({
  head: () => ({ meta: [{ title: "Mes soumissions — EZOA-TO" }] }),
  component: SoumissionsListPage,
});

const STATUT_CONFIG = {
  en_attente: { label: "En attente", icon: Clock, variant: "secondary" as const },
  validee: { label: "Validée", icon: CheckCircle2, variant: "default" as const },
  rejetee: { label: "Rejetée", icon: XCircle, variant: "destructive" as const },
};

function SoumissionsListPage() {
  return (
    <AuthGate
      badge={<PageHeroBadge icon={ClipboardList}>Soumissions</PageHeroBadge>}
      title="Mes soumissions"
      description="Connecte-toi pour suivre l'état de tes épreuves soumises."
    >
      <SoumissionsContent />
    </AuthGate>
  );
}

function SoumissionsContent() {
  const { user } = useAuth();
  const { data, isLoading } = useQuery({
    queryKey: ["my-soumissions"],
    queryFn: () => api.getMySoumissions(),
    enabled: !!user,
  });

  const pagination = usePagination(data);

  if (!user) return null;

  const counts = {
    en_attente: data?.filter((s) => s.statut === "en_attente").length ?? 0,
    validee: data?.filter((s) => s.statut === "validee").length ?? 0,
    rejetee: data?.filter((s) => s.statut === "rejetee").length ?? 0,
  };

  return (
    <UserDashboardShell
      title="Mes soumissions"
      subtitle={`${counts.validee} validée${counts.validee > 1 ? "s" : ""} · ${counts.en_attente} en attente · ${counts.rejetee} rejetée${counts.rejetee > 1 ? "s" : ""}`}
      activeSection="soumissions"
      actions={
        <Button asChild size="sm" className="rounded-xl hover:text-primary-foreground">
          <Link to="/submit"><Upload className="size-4" /> Nouvelle soumission</Link>
        </Button>
      }
    >
      <div className={`mb-4 ${dashboardTripleStatGrid} sm:mb-6`}>
        {(["en_attente", "validee", "rejetee"] as const).map((s) => {
          const cfg = STATUT_CONFIG[s];
          return (
            <MiniStatCard key={s} icon={cfg.icon} value={counts[s]} label={cfg.label} />
          );
        })}
      </div>

      <DataTableToolbar title="Liste des soumissions" count={data?.length ?? 0} />

      {isLoading ? (
        <div className="h-40 animate-pulse rounded-xl bg-muted" />
      ) : (
        <DataTableShell
          pagination={
            pagination.total > 0
              ? { ...pagination, onPageChange: pagination.setPage }
              : undefined
          }
        >
          <TableHeader>
            <TableRow>
              <TableHead>Titre</TableHead>
              <TableHead>Matière</TableHead>
              <TableHead>Classe</TableHead>
              <TableHead>Date</TableHead>
              <TableHead>Statut</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {!data?.length && (
              <TableRow>
                <TableCell colSpan={6} className="h-32 text-center">
                  <p className="text-muted-foreground">Aucune soumission pour l&apos;instant.</p>
                  <Button asChild className="mt-4 rounded-xl hover:text-primary-foreground">
                    <Link to="/submit">Soumettre ma première épreuve</Link>
                  </Button>
                </TableCell>
              </TableRow>
            )}
            {pagination.items.map((s) => {
              const cfg = STATUT_CONFIG[s.statut];
              return (
                <TableRow key={s.id}>
                  <TableCell className="font-medium">{s.titre}</TableCell>
                  <TableCell>{s.matiere}</TableCell>
                  <TableCell>{s.classe} · {s.annee}</TableCell>
                  <TableCell className="text-muted-foreground">
                    {new Date(s.soumisLe).toLocaleDateString("fr-FR")}
                  </TableCell>
                  <TableCell>
                    <Badge variant={cfg.variant}>{cfg.label}</Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <TableActions>
                      <Button asChild size="sm" variant="outline" className="h-8 gap-1.5 rounded-lg px-2.5">
                        <Link to="/account/soumissions/$id" params={{ id: s.id }}>
                          <Eye className="size-3.5" />
                          <span className="hidden sm:inline">Voir</span>
                        </Link>
                      </Button>
                    </TableActions>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </DataTableShell>
      )}
    </UserDashboardShell>
  );
}
