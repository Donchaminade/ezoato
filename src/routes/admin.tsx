import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { z } from "zod";
import {
  Check, X, AlertTriangle, FileText, BarChart3, Users, BookOpen,
  Inbox, Archive, Trash2, ExternalLink, Banknote, Lock,
  ClipboardCheck, Upload, Loader2, Eye,
} from "lucide-react";
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
import { TableActions, TableActionButton } from "@/components/dashboard/TableActions";
import { usePagination } from "@/hooks/use-pagination";
import { AdminArchivesBrowser } from "@/components/admin/AdminArchivesBrowser";
import { AdminSettingsTab } from "@/components/admin/AdminSettingsTab";
import { AdminNotificationsTab } from "@/components/admin/AdminNotificationsTab";
import { AdminAbonnementsTab } from "@/components/admin/AdminAbonnementsTab";
import { AdminUsersTab } from "@/components/admin/AdminUsersTab";
import { AuthenticatedImageGrid, AuthenticatedPdf } from "@/components/admin/AuthenticatedMedia";
import { AdminStatsCharts } from "@/components/admin/AdminStatsCharts";
import {
  DemandesEtablissementAdminTab,
  DemandesSoutienAdminTab,
  PartenairesAdminTab,
} from "@/components/admin/AdminPartenariatTabs";
import { AdminOverview } from "@/components/dashboard/AdminOverview";
import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { PageHero } from "@/components/layout/PageHero";
import { PageHeroBadge } from "@/components/layout/PageHeroBadge";
import { PublicLayout } from "@/components/layout/PublicLayout";
import { getAdminNavGroups, type AdminSection } from "@/lib/dashboard-nav";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { CityInput } from "@/components/forms/CityInput";
import { FormField } from "@/components/ui/form-field";
import { api } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { formatFcfa } from "@/lib/pricing";
import type { AdminRetrait, Epreuve, Soumission } from "@/lib/types";

const ADMIN_SECTIONS = [
  "overview",
  "soumissions",
  "epreuves",
  "archives",
  "retraits",
  "stats",
  "partenaires",
  "soutien",
  "etablissements",
  "users",
  "notifications",
  "abonnements",
  "settings",
] as const satisfies readonly AdminSection[];

const adminSearchSchema = z.object({
  section: z.enum(ADMIN_SECTIONS).optional().default("overview"),
});

function parseAdminSearch(search: Record<string, unknown>): { section: AdminSection } {
  const parsed = adminSearchSchema.safeParse(search);
  if (parsed.success) {
    return { section: parsed.data.section ?? "overview" };
  }
  return { section: "overview" };
}

export const Route = createFileRoute("/admin")({
  validateSearch: parseAdminSearch,
  head: () => ({
    meta: [{ title: "Administration — EZOA-TO" }],
  }),
  component: AdminPage,
});

function AdminPage() {
  const { user, loading } = useAuth();
  if (loading) {
    return (
      <div className="flex min-h-svh items-center justify-center bg-background">
        <Loader2 className="size-8 animate-spin text-muted-foreground" />
      </div>
    );
  }
  if (!user || (user.role !== "admin" && user.role !== "gestionnaire")) {
    return (
      <PublicLayout>
        <PageHero
          badge={<PageHeroBadge icon={Lock}>Admin</PageHeroBadge>}
          title="Accès réservé"
          description="Cet espace est réservé aux gestionnaires et administrateurs de EZOA-TO."
          primaryImage="hero"
          compact
        >
          <Button asChild><Link to="/">Retour à l'accueil</Link></Button>
        </PageHero>
      </PublicLayout>
    );
  }
  return <AdminDashboard isAdmin={user.role === "admin"} />;
}

function AdminDashboard({ isAdmin }: { isAdmin: boolean }) {
  const qc = useQueryClient();
  const { section } = Route.useSearch();
  const {
    data: stats,
    refetch: refetchStats,
    isLoading: statsLoading,
    isError: statsError,
    error: statsErrorDetail,
  } = useQuery({
    queryKey: ["admin-stats"],
    queryFn: () => api.getAdminStats(),
    retry: 2,
  });

  const activeSection: AdminSection =
    section === "users" && !isAdmin ? "overview" : section;

  const navGroups = getAdminNavGroups(isAdmin, {
    soumissions: stats?.soumissionsEnAttente,
    retraits: stats?.retraitsEnAttente,
    soutien: stats?.demandesSoutienNouvelles,
    etablissements: stats?.demandesEtablissementNouvelles,
  });

  function refreshAll() {
    refetchStats();
    qc.invalidateQueries();
  }

  return (
    <DashboardLayout
      title="Administration"
      subtitle={
        isAdmin
          ? "Pilotage complet de la plateforme EZOA-TO"
          : "Modération et gestion des contenus EZOA-TO"
      }
      groups={navGroups}
      activeSection={activeSection}
      onRefresh={refreshAll}
    >
      {activeSection === "overview" && statsLoading && (
        <div className="space-y-3 sm:space-y-4">
          <div className="grid grid-cols-2 gap-2 sm:gap-4 xl:grid-cols-5">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="aspect-square animate-pulse rounded-xl bg-muted sm:aspect-auto sm:h-28 sm:rounded-2xl" />
            ))}
          </div>
          <div className="h-64 animate-pulse rounded-2xl bg-muted" />
          <div className="grid gap-4 lg:grid-cols-2">
            <div className="h-48 animate-pulse rounded-2xl bg-muted" />
            <div className="h-48 animate-pulse rounded-2xl bg-muted" />
          </div>
        </div>
      )}
      {activeSection === "overview" && statsError && (
        <div className="rounded-2xl border border-destructive/30 bg-destructive/5 p-6 text-center">
          <p className="font-medium text-destructive">Impossible de charger les statistiques</p>
          <p className="mt-1 text-sm text-muted-foreground">
            {statsErrorDetail instanceof Error ? statsErrorDetail.message : "Erreur réseau ou serveur"}
          </p>
          <Button variant="outline" className="mt-4 rounded-xl" onClick={() => refetchStats()}>
            Réessayer
          </Button>
        </div>
      )}
      {activeSection === "overview" && stats && !statsLoading && (
        <AdminOverview stats={stats} isAdmin={isAdmin} />
      )}
      {activeSection === "soumissions" && <SoumissionsTab />}
      {activeSection === "epreuves" && <EpreuvesTab isAdmin={isAdmin} />}
      {activeSection === "archives" && <AdminArchivesBrowser />}
      {activeSection === "retraits" && <RetraitsTab />}
      {activeSection === "stats" && <StatsTab stats={stats} />}
      {activeSection === "partenaires" && <PartenairesAdminTab isAdmin={isAdmin} />}
      {activeSection === "soutien" && <DemandesSoutienAdminTab />}
      {activeSection === "etablissements" && <DemandesEtablissementAdminTab />}
      {activeSection === "users" && isAdmin && <AdminUsersTab />}
      {activeSection === "notifications" && isAdmin && <AdminNotificationsTab />}
      {activeSection === "abonnements" && isAdmin && <AdminAbonnementsTab />}
      {activeSection === "settings" && isAdmin && <AdminSettingsTab />}
    </DashboardLayout>
  );
}

function SoumissionsTab() {
  const qc = useQueryClient();
  const { data, refetch } = useQuery({ queryKey: ["soumissions"], queryFn: () => api.listSoumissions() });
  const { data: meta } = useQuery({ queryKey: ["meta"], queryFn: () => api.getMeta() });
  const [active, setActive] = useState<Soumission | null>(null);
  const [rejectOpen, setRejectOpen] = useState(false);
  const [motif, setMotif] = useState("Qualité insuffisante — image floue ou illisible");
  const [editVille, setEditVille] = useState("");
  const [editTitre, setEditTitre] = useState("");

  useEffect(() => {
    if (!active) return;
    setEditVille(active.ville);
    setEditTitre(active.titre);
  }, [active?.id]);

  const corrections = () => ({ ville: editVille.trim(), titre: editTitre.trim() });

  async function valider(s: Soumission) {
    await api.validerSoumission(s.id, corrections());
    toast.success("Épreuve validée et publiée");
    setActive(null);
    refetch();
    qc.invalidateQueries({ queryKey: ["admin-stats"] });
  }

  async function rejeter() {
    if (!active) return;
    await api.rejeterSoumission(active.id, motif);
    toast("Soumission rejetée");
    setRejectOpen(false);
    setActive(null);
    refetch();
  }

  async function remplacer(s: Soumission, doublonId: string) {
    await api.remplacerSoumission(s.id, doublonId, corrections());
    toast.success("Ancienne épreuve archivée, nouvelle publiée");
    setActive(null);
    refetch();
  }

  async function archiver(s: Soumission) {
    await api.archiverSoumission(s.id);
    toast("Soumission archivée");
    setActive(null);
    refetch();
  }

  const pagination = usePagination(data);

  return (
    <>
      <DataTableToolbar
        title="Soumissions en attente"
        description="Valide, rejette ou archive les épreuves soumises par les contributeurs."
        count={data?.length ?? 0}
      />
      <div className="grid gap-6 lg:grid-cols-[1.2fr_1fr]">
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
              <TableHead>Ville</TableHead>
              <TableHead>Date</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {!data?.length && (
              <DataTableEmptyRow colSpan={6} message="Aucune soumission en attente" />
            )}
            {pagination.items.map((s) => (
              <TableRow
                key={s.id}
                className={active?.id === s.id ? "bg-primary/8" : undefined}
              >
                <TableCell>
                  <p className="font-medium">{s.titre}</p>
                  {s.doublonsPotentiels?.length ? (
                    <Badge variant="outline" className="mt-1 border-warning bg-warning/20 text-warning-foreground">
                        <AlertTriangle className="size-3" /> Doublon
                      </Badge>
                  ) : null}
                </TableCell>
                <TableCell>{s.matiere}</TableCell>
                <TableCell>{s.classe} · {s.annee}</TableCell>
                <TableCell>{s.ville}</TableCell>
                <TableCell className="text-muted-foreground">
                  {new Date(s.soumisLe).toLocaleDateString("fr-FR")}
                </TableCell>
                <TableCell className="text-right">
                  <TableActions>
                    <TableActionButton icon={Eye} label="Examiner" onClick={() => setActive(s)} />
                  </TableActions>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </DataTableShell>

          <div className="rounded-2xl border border-border bg-card p-5">
            {active ? (
              <div className="space-y-4">
                <div>
                  <h2 className="font-display text-xl font-bold">{active.titre}</h2>
                  <p className="text-sm text-muted-foreground capitalize">
                    {active.type} · {active.matiere} · {active.classe} · {active.annee}
                  {active.examen ? ` · ${active.examen}` : ""}
                </p>
                <p className="text-xs text-muted-foreground">
                  Par {active.soumisPar} · {new Date(active.soumisLe).toLocaleDateString("fr-FR")}
                  {active.pages ? ` · ${active.pages} page${active.pages > 1 ? "s" : ""}` : ""}
                </p>
                {active.storagePath && (
                  <p className="mt-1 font-mono text-xs text-muted-foreground">{active.storagePath}</p>
                )}
              </div>

              {active.images.length > 0 && (
                <div>
                  <p className="mb-2 text-sm font-medium">Pages sources (images)</p>
                  <AuthenticatedImageGrid urls={active.images} />
                </div>
              )}

              <div className="overflow-hidden rounded-xl border border-border bg-muted/30">
                {active.pdfPreviewUrl && active.pdfPreviewUrl !== "#" ? (
                  <AuthenticatedPdf url={active.pdfPreviewUrl} />
                ) : (
                  <div className="grid aspect-[210/297] max-w-md place-items-center text-muted-foreground mx-auto w-full">
                  <div className="text-center">
                    <FileText className="mx-auto size-10 opacity-50" />
                      <p className="mt-2 text-sm">Aperçu PDF indisponible</p>
                    </div>
                  </div>
                )}
                </div>

              {active.doublonsPotentiels?.length ? (
                  <div className="rounded-lg border border-warning/40 bg-warning/10 p-3 text-sm">
                  <p className="font-semibold">Épreuve similaire détectée</p>
                    <p className="mt-1 text-muted-foreground">
                      Compare avant de valider. Tu peux remplacer l'existante ou archiver pour usage ultérieur.
                    </p>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {active.doublonsPotentiels.map((dupId) => (
                      <div key={dupId} className="flex gap-1">
                        <Button size="sm" variant="outline" asChild>
                          <Link to="/epreuves/$id" params={{ id: dupId }} target="_blank">
                            <ExternalLink className="size-3" /> Voir {dupId.slice(-6)}
                          </Link>
                        </Button>
                        <Button size="sm" variant="outline" onClick={() => remplacer(active, dupId)}>
                          Remplacer
                        </Button>
                    </div>
                    ))}
                    <Button size="sm" variant="outline" onClick={() => archiver(active)}>
                      <Archive className="size-3" /> Archiver
                    </Button>
                  </div>
                </div>
              ) : null}

              <div className="rounded-xl border border-border bg-muted/20 p-3 space-y-3">
                <p className="text-sm font-medium">Corrections avant publication</p>
                <p className="text-xs text-muted-foreground">
                  Corrige l&apos;orthographe (accents, fautes de frappe) saisie par le contributeur.
                </p>
                <FormField label="Titre">
                  <Input value={editTitre} onChange={(e) => setEditTitre(e.target.value)} className="rounded-lg" />
                </FormField>
                <FormField label="Ville">
                  <CityInput
                    listId="admin-soumission-villes"
                    value={editVille}
                    onChange={setEditVille}
                    suggestions={meta?.villes ?? []}
                    className="rounded-lg"
                  />
                </FormField>
              </div>

                <p className="text-xs text-muted-foreground">
                  À la publication, une notification (in-app + push) est envoyée aux utilisateurs inscrits en{" "}
                  <strong>{active.classe}</strong> uniquement — pas à toute la base.
                </p>

                <div className="flex gap-2">
                  <Button onClick={() => valider(active)} className="flex-1">
                    <Check className="size-4" /> Valider & publier
                  </Button>
                <Button onClick={() => setRejectOpen(true)} variant="destructive">
                    <X className="size-4" /> Rejeter
                  </Button>
                </div>
              </div>
            ) : (
            <p className="text-center text-sm text-muted-foreground py-20">Sélectionne une soumission à gauche.</p>
            )}
        </div>
      </div>

      <AlertDialog open={rejectOpen} onOpenChange={setRejectOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Rejeter la soumission</AlertDialogTitle>
            <AlertDialogDescription>Indique le motif de rejet visible par le contributeur.</AlertDialogDescription>
          </AlertDialogHeader>
          <Textarea value={motif} onChange={(e) => setMotif(e.target.value)} rows={3} />
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction onClick={rejeter}>Rejeter</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

function EpreuvesTab({ isAdmin }: { isAdmin: boolean }) {
  const qc = useQueryClient();
  const [statut, setStatut] = useState("validee");
  const [q, setQ] = useState("");
  const [uploadingId, setUploadingId] = useState<string | null>(null);
  const { data, refetch } = useQuery({
    queryKey: ["admin-epreuves", statut, q],
    queryFn: () => api.listAdminEpreuves(statut, q),
  });

  async function archiver(id: string) {
    await api.archiverEpreuve(id);
    toast.success("Épreuve archivée");
    refetch();
    qc.invalidateQueries({ queryKey: ["admin-stats"] });
  }

  async function supprimer(id: string) {
    if (!confirm("Supprimer définitivement cette épreuve ?")) return;
    await api.supprimerEpreuve(id);
    toast.success("Épreuve supprimée");
    refetch();
  }

  async function handleCorrigeUpload(epreuveId: string, file: File) {
    setUploadingId(epreuveId);
    try {
      const res = await api.uploadCorrigeType(epreuveId, file);
      toast.success(`Corrigé type publié (${res.corrigeId.slice(0, 8)}…)`);
      refetch();
      qc.invalidateQueries({ queryKey: ["admin-stats"] });
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Échec upload");
    } finally {
      setUploadingId(null);
    }
  }

  async function supprimerCorrige(parentId: string) {
    if (!confirm("Supprimer le corrigé type de cette épreuve ?")) return;
    await api.supprimerCorrigeType(parentId);
    toast.success("Corrigé supprimé");
    refetch();
    qc.invalidateQueries({ queryKey: ["admin-stats"] });
  }

  const pagination = usePagination(data);

  return (
    <div className="space-y-4">
      <DataTableToolbar
        title="Épreuves publiées"
        description="Les corrigés type sont gérés par les admins — PDF lié à une épreuve (200 FCFA)."
        count={data?.length ?? 0}
      >
        <Input
          placeholder="Rechercher…"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          className="max-w-xs"
        />
        <Select value={statut} onValueChange={setStatut}>
          <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="validee">Validées</SelectItem>
            <SelectItem value="archivee">Archivées</SelectItem>
          </SelectContent>
        </Select>
      </DataTableToolbar>

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
            <TableHead>Corrigé</TableHead>
            <TableHead>DL</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {!data?.length && (
            <DataTableEmptyRow colSpan={6} message="Aucune épreuve trouvée" />
          )}
          {pagination.items.map((e: Epreuve) => (
            <TableRow key={e.id}>
              <TableCell>
                <Link to="/epreuves/$id" params={{ id: e.id }} className="font-medium hover:text-primary">
                  {e.titre}
                </Link>
                <div className="text-xs text-muted-foreground">{e.classe} · {e.annee}</div>
              </TableCell>
              <TableCell>{e.matiere}</TableCell>
              <TableCell className="capitalize">
                {e.type}{e.examen ? ` · ${e.examen}` : ""}
                {e.requiresPayment && <Badge variant="outline" className="ml-1 text-xs">100F</Badge>}
              </TableCell>
              <TableCell>
                {e.hasCorrigeType ? (
                  <Badge className="border-0 bg-primary/10 text-primary">
                    <ClipboardCheck className="size-3" /> Publié
                  </Badge>
                ) : (
                  <span className="text-xs text-muted-foreground">—</span>
                )}
              </TableCell>
              <TableCell className="tabular-nums">{e.telechargements}</TableCell>
              <TableCell className="text-right">
                <TableActions>
                  <TableActionButton
                    icon={Eye}
                    label="Voir"
                    asChild
                  >
                    <Link to="/epreuves/$id" params={{ id: e.id }} />
                  </TableActionButton>
                  {!e.hasCorrigeType && (
                    <Button size="sm" variant="outline" className="h-8 rounded-lg" asChild>
                      <label className="cursor-pointer">
                        <input
                          type="file"
                          accept="application/pdf,.pdf"
                          className="hidden"
                          disabled={uploadingId === e.id}
                          onChange={(ev) => {
                            const f = ev.target.files?.[0];
                            if (f) handleCorrigeUpload(e.id, f);
                            ev.target.value = "";
                          }}
                        />
                        <span className="flex items-center gap-1.5">
                          {uploadingId === e.id ? (
                            <Loader2 className="size-3.5 animate-spin" />
                          ) : (
                            <Upload className="size-3.5" />
                          )}
                          <span className="hidden sm:inline">Corrigé</span>
                        </span>
                      </label>
                    </Button>
                  )}
                  {e.hasCorrigeType && e.corrigeTypeId && (
                    <TableActionButton icon={Eye} label="Corrigé" asChild>
                      <Link to="/epreuves/$id" params={{ id: e.corrigeTypeId }} />
                    </TableActionButton>
                  )}
                  {statut === "validee" && (
                    <TableActionButton icon={Archive} label="Archiver" variant="outline" onClick={() => archiver(e.id)} />
                  )}
                  {isAdmin && (
                    <TableActionButton icon={Trash2} label="Supprimer" destructive onClick={() => supprimer(e.id)} />
                  )}
                </TableActions>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </DataTableShell>
    </div>
  );
}

function StatsTab({ stats }: { stats?: Awaited<ReturnType<typeof api.getAdminStats>> }) {
  if (!stats) return <div className="h-40 animate-pulse rounded-xl bg-muted" />;
  return <AdminStatsCharts stats={stats} />;
}

function RetraitsTab() {
  const qc = useQueryClient();
  const { data, refetch } = useQuery({ queryKey: ["admin-retraits"], queryFn: () => api.listAdminRetraits() });
  const [rejectId, setRejectId] = useState<string | null>(null);
  const [motif, setMotif] = useState("Numéro Mobile Money invalide");

  async function approuver(r: AdminRetrait) {
    await api.approuverRetrait(r.id);
    toast.success(`Retrait de ${formatFcfa(r.montant)} marqué comme payé`);
    refetch();
    qc.invalidateQueries({ queryKey: ["admin-stats"] });
  }

  async function rejeter() {
    if (!rejectId) return;
    await api.rejeterRetrait(rejectId, motif);
    toast("Retrait rejeté — solde remboursé au contributeur");
    setRejectId(null);
    refetch();
    qc.invalidateQueries({ queryKey: ["admin-stats"] });
  }

  const pending = data?.filter((r) => r.statut === "en_attente") ?? [];
  const pagination = usePagination(data);

  return (
    <>
      <DataTableToolbar
        title="Retraits contributeurs"
        description="Traite les demandes de retrait Mobile Money sous 48h."
        count={data?.length ?? 0}
      />
      {pending.length > 0 && (
        <div className="mb-4 rounded-lg border border-amber-500/40 bg-amber-500/10 px-4 py-3 text-sm">
          <strong>{pending.length} retrait{pending.length > 1 ? "s" : ""} en attente</strong> — à traiter sous 48h.
        </div>
      )}
      <DataTableShell
        pagination={
          pagination.total > 0
            ? { ...pagination, onPageChange: pagination.setPage }
            : undefined
        }
      >
        <TableHeader>
          <TableRow>
            <TableHead>Contributeur</TableHead>
            <TableHead>Montant</TableHead>
            <TableHead>Mobile Money</TableHead>
            <TableHead>Statut</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {!data?.length && (
            <DataTableEmptyRow colSpan={5} message="Aucun retrait" />
          )}
          {pagination.items.map((r) => (
            <TableRow key={r.id}>
              <TableCell>
                <p className="font-medium">{r.user.nom}</p>
                <p className="text-xs text-muted-foreground">{r.user.email}</p>
              </TableCell>
              <TableCell className="font-semibold tabular-nums">{formatFcfa(r.montant)}</TableCell>
              <TableCell>
                <p>{r.methode === "flooz" ? "Flooz" : "T-Money"}</p>
                <p className="text-xs text-muted-foreground">{r.telephone}</p>
              </TableCell>
              <TableCell>
                <Badge variant={r.statut === "paye" ? "default" : r.statut === "rejete" ? "destructive" : "secondary"}>
                  {r.statut === "en_attente" ? "En attente" : r.statut === "paye" ? "Payé" : "Rejeté"}
                </Badge>
              </TableCell>
              <TableCell className="text-right">
                {r.statut === "en_attente" && (
                  <TableActions>
                    <TableActionButton icon={Check} label="Payé" variant="default" onClick={() => approuver(r)} />
                    <TableActionButton icon={X} label="Rejeter" destructive onClick={() => setRejectId(r.id)} />
                  </TableActions>
                )}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </DataTableShell>

      <AlertDialog open={!!rejectId} onOpenChange={(o) => !o && setRejectId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Rejeter le retrait</AlertDialogTitle>
            <AlertDialogDescription>Le solde sera remboursé au portefeuille du contributeur.</AlertDialogDescription>
          </AlertDialogHeader>
          <Textarea value={motif} onChange={(e) => setMotif(e.target.value)} rows={2} />
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction onClick={rejeter}>Rejeter</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
