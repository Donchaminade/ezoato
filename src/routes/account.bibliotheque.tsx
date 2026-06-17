import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import {
  Download, Library, Loader2, Lock, FileText, ClipboardCheck, Eye,
} from "lucide-react";
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
import { TableActions, TableActionButton } from "@/components/dashboard/TableActions";
import { usePagination } from "@/hooks/use-pagination";
import { PageHeroBadge } from "@/components/layout/PageHeroBadge";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth } from "@/lib/auth";
import { api } from "@/lib/api";
import { typeLabel } from "@/lib/pricing";
import type { LibraryItem } from "@/lib/types";
import { MiniStatCard } from "@/components/dashboard/MiniStatCard";
import { dashboardTripleStatGrid } from "@/lib/dashboard-mobile";

export const Route = createFileRoute("/account/bibliotheque")({
  head: () => ({ meta: [{ title: "Ma bibliothèque — EZOA-TO" }] }),
  component: BibliothequePage,
});

function LibraryTable({
  items,
  emptyMessage,
  onDownload,
  loadingId,
}: {
  items: LibraryItem[];
  emptyMessage: string;
  onDownload: (id: string) => void;
  loadingId: string | null;
}) {
  const pagination = usePagination(items);

  return (
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
          <TableHead>Type</TableHead>
          <TableHead>Accès</TableHead>
          <TableHead className="text-right">Actions</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {!items.length && <DataTableEmptyRow colSpan={5} message={emptyMessage} />}
        {pagination.items.map((item) => (
          <TableRow key={item.id}>
            <TableCell>
              <Link to="/epreuves/$id" params={{ id: item.id }} className="font-medium hover:text-primary">
                {item.titre}
              </Link>
              <p className="text-xs text-muted-foreground">
                {item.classe} · {item.annee}
                {item.acheteLe && ` · ${new Date(item.acheteLe).toLocaleDateString("fr-FR")}`}
              </p>
            </TableCell>
            <TableCell>{item.matiere}</TableCell>
            <TableCell className="capitalize">{typeLabel(item.type)}</TableCell>
            <TableCell>
              {item.source === "achat" ? (
                <Badge variant="secondary"><Lock className="size-3" /> Permanent</Badge>
              ) : (
                <Badge variant="outline">Gratuit</Badge>
              )}
            </TableCell>
            <TableCell className="text-right">
              <TableActions>
                <TableActionButton icon={Eye} label="Voir" asChild>
                  <Link to="/epreuves/$id" params={{ id: item.id }} />
                </TableActionButton>
                <TableActionButton
                  icon={loadingId === item.id ? Loader2 : Download}
                  label="Télécharger"
                  variant="outline"
                  disabled={loadingId === item.id}
                  onClick={() => onDownload(item.id)}
                />
              </TableActions>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </DataTableShell>
  );
}

function BibliothequePage() {
  return (
    <AuthGate
      badge={<PageHeroBadge icon={Library}>Bibliothèque</PageHeroBadge>}
      title="Ma bibliothèque"
      description="Connecte-toi pour retrouver tes épreuves et corrigés achetés."
    >
      <BibliothequeContent />
    </AuthGate>
  );
}

function BibliothequeContent() {
  const { user } = useAuth();
  const [loadingId, setLoadingId] = useState<string | null>(null);
  const { data, refetch } = useQuery({
    queryKey: ["my-library"],
    queryFn: () => api.getMyLibrary(),
    enabled: !!user,
  });

  async function handleDownload(id: string) {
    setLoadingId(id);
    try {
      await api.downloadEpreuve(id);
      toast.success("Téléchargement lancé");
      refetch();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Échec");
    } finally {
      setLoadingId(null);
    }
  }

  if (!user) return null;

  const paid = data?.paid ?? [];
  const free = data?.free ?? [];
  const corriges = paid.filter((i) => i.type === "corrige");
  const examens = paid.filter((i) => i.type !== "corrige");

  return (
    <UserDashboardShell
      title="Ma bibliothèque"
      subtitle="Contenus payés (accès 6 mois) et gratuits — retéléchargement pendant la période d'accès."
      activeSection="bibliotheque"
      onRefresh={() => refetch()}
    >
        <div className={dashboardTripleStatGrid}>
          <MiniStatCard icon={FileText} label="Achats" value={paid.length} />
          <MiniStatCard icon={ClipboardCheck} label="Corrigés" value={corriges.length} />
          <MiniStatCard icon={Download} label="Gratuits" value={free.length} />
        </div>

        <Tabs defaultValue="achats" className="mt-4 sm:mt-6">
          <TabsList className="mb-1 flex h-auto w-full flex-wrap gap-1.5 bg-transparent p-0 sm:gap-2">
            <TabsTrigger value="achats" className="tea-water-fill-none h-9 flex-1 rounded-lg border-2 border-border/50 bg-card px-2 text-xs font-semibold data-[state=active]:border-primary/45 data-[state=active]:bg-primary/18 data-[state=active]:text-primary sm:h-11 sm:flex-none sm:rounded-xl sm:px-4 sm:text-sm">
              Mes achats ({paid.length})
            </TabsTrigger>
            <TabsTrigger value="corriges" className="tea-water-fill-none h-9 flex-1 rounded-lg border-2 border-border/50 bg-card px-2 text-xs font-semibold data-[state=active]:border-primary/45 data-[state=active]:bg-primary/18 data-[state=active]:text-primary sm:h-11 sm:flex-none sm:rounded-xl sm:px-4 sm:text-sm">
              Corrigés ({corriges.length})
            </TabsTrigger>
            <TabsTrigger value="gratuits" className="tea-water-fill-none h-9 flex-1 rounded-lg border-2 border-border/50 bg-card px-2 text-xs font-semibold data-[state=active]:border-primary/45 data-[state=active]:bg-primary/18 data-[state=active]:text-primary sm:h-11 sm:flex-none sm:rounded-xl sm:px-4 sm:text-sm">
              Gratuits ({free.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="achats" className="mt-4">
            <LibraryTable
              items={examens}
              emptyMessage="Aucun achat pour le moment."
              onDownload={handleDownload}
              loadingId={loadingId}
            />
          </TabsContent>

          <TabsContent value="corriges" className="mt-4">
            <LibraryTable
              items={corriges}
              emptyMessage="Aucun corrigé type acheté."
              onDownload={handleDownload}
              loadingId={loadingId}
            />
          </TabsContent>

          <TabsContent value="gratuits" className="mt-4">
            <LibraryTable
              items={free}
              emptyMessage="Aucun téléchargement gratuit."
              onDownload={handleDownload}
              loadingId={loadingId}
            />
          </TabsContent>
        </Tabs>
    </UserDashboardShell>
  );
}
