import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import {
  BarChart3, Copy, Eye, KeyRound, Loader2, Pencil, Trash2, Upload, Wallet, Download, XCircle, CheckCircle2,
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
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { FormField } from "@/components/ui/form-field";
import { PasswordInput } from "@/components/ui/password-input";
import { formInputClass, formSelectClass } from "@/lib/form-styles";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import {
  Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle,
} from "@/components/ui/sheet";
import { api } from "@/lib/api";
import { formatFcfa } from "@/lib/pricing";
import type { AdminUser, AdminUserDetail } from "@/lib/types";
import { roleLabel } from "@/lib/roles";
import { cn } from "@/lib/utils";

const ROLE_BADGE: Partial<Record<AdminUser["role"], string>> = {
  admin: "border-violet-200 bg-violet-100 text-violet-800",
  gestionnaire: "border-sky-200 bg-sky-100 text-sky-800",
  utilisateur: "border-emerald-200 bg-emerald-50 text-emerald-800",
};

function UserRoleBadge({ role }: { role: AdminUser["role"] }) {
  return (
    <Badge
      variant="outline"
      className={cn("font-medium", ROLE_BADGE[role] ?? "border-slate-200 bg-slate-100 text-slate-700")}
    >
      {roleLabel(role)}
    </Badge>
  );
}

function fmtDate(iso: string) {
  return new Date(iso).toLocaleString("fr-FR", {
    day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit",
  });
}

export function AdminUsersTab() {
  const qc = useQueryClient();
  const { data, refetch } = useQuery({ queryKey: ["admin-users"], queryFn: () => api.listAdminUsers() });
  const { data: meta } = useQuery({ queryKey: ["meta"], queryFn: () => api.getMeta() });
  const pagination = usePagination(data);

  const [formOpen, setFormOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [nom, setNom] = useState("");
  const [email, setEmail] = useState("");
  const [telephone, setTelephone] = useState("");
  const [password, setPassword] = useState("");
  const [ville, setVille] = useState("");
  const [role, setRole] = useState<AdminUser["role"]>("utilisateur");

  const [detailId, setDetailId] = useState<string | null>(null);
  const [statsId, setStatsId] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<AdminUser | null>(null);
  const [deleting, setDeleting] = useState(false);

  const [resetOpen, setResetOpen] = useState(false);
  const [adminPassword, setAdminPassword] = useState("");
  const [resetting, setResetting] = useState(false);
  const [tempPassword, setTempPassword] = useState<string | null>(null);

  const { data: detail, isLoading: detailLoading } = useQuery({
    queryKey: ["admin-user", detailId],
    queryFn: () => api.getAdminUser(detailId!),
    enabled: !!detailId,
  });

  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ["admin-user-stats", statsId],
    queryFn: () => api.getAdminUserStats(statsId!),
    enabled: !!statsId,
  });

  function resetForm() {
    setEditingId(null);
    setNom("");
    setEmail("");
    setTelephone("");
    setPassword("");
    setVille("");
    setRole("utilisateur");
  }

  function openCreateForm() {
    resetForm();
    setFormOpen(true);
  }

  function fillFormFromUser(u: AdminUserDetail) {
    setEditingId(u.id);
    setNom(u.nom);
    setEmail(u.email);
    setTelephone(u.telephone ?? "");
    setPassword("");
    setVille(u.ville ?? "");
    setRole(u.role);
    setFormOpen(true);
  }

  function startEditFromDetail() {
    if (!detail) return;
    setDetailId(null);
    fillFormFromUser(detail);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  async function submitForm(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    try {
      if (editingId) {
        await api.updateAdminUser(editingId, {
          nom,
          email,
          telephone,
          role,
          ville: ville || undefined,
          ...(password ? { password } : {}),
        });
        toast.success(`Utilisateur ${nom} mis à jour`);
      } else {
        await api.createAdminUser({
          nom,
          email,
          telephone,
          password,
          role,
          ville: ville || undefined,
        });
        toast.success(`Utilisateur ${nom} créé`);
      }
      resetForm();
      setFormOpen(false);
      refetch();
      qc.invalidateQueries({ queryKey: ["admin-stats"] });
      if (editingId) qc.invalidateQueries({ queryKey: ["admin-user", editingId] });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Échec de l'enregistrement");
    } finally {
      setSubmitting(false);
    }
  }

  async function confirmDelete() {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await api.deleteAdminUser(deleteTarget.id);
      toast.success(`${deleteTarget.nom} supprimé`);
      setDeleteTarget(null);
      if (detailId === deleteTarget.id) setDetailId(null);
      refetch();
      qc.invalidateQueries({ queryKey: ["admin-stats"] });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Suppression impossible");
    } finally {
      setDeleting(false);
    }
  }

  function openResetModal() {
    setAdminPassword("");
    setTempPassword(null);
    setResetOpen(true);
  }

  function closeResetModal() {
    setResetOpen(false);
    setAdminPassword("");
    setTempPassword(null);
  }

  async function confirmResetPassword() {
    if (!detailId || !adminPassword) return;
    setResetting(true);
    try {
      const { temporaryPassword } = await api.resetAdminUserPassword(detailId, adminPassword);
      setTempPassword(temporaryPassword);
      setAdminPassword("");
      toast.success("Mot de passe réinitialisé");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Réinitialisation impossible");
    } finally {
      setResetting(false);
    }
  }

  async function copyTempPassword() {
    if (!tempPassword) return;
    try {
      await navigator.clipboard.writeText(tempPassword);
      toast.success("Mot de passe copié");
    } catch {
      toast.error("Copie impossible");
    }
  }

  return (
    <div className="space-y-4">
      <DataTableToolbar
        title="Utilisateurs"
        description="Crée des comptes, consulte les détails et les statistiques d'activité."
        count={data?.length ?? 0}
        onAdd={() => (formOpen ? (setFormOpen(false), resetForm()) : openCreateForm())}
        addLabel={formOpen ? "Fermer" : "Ajouter un utilisateur"}
      />

      {formOpen && (
        <form onSubmit={submitForm} className="space-y-6 rounded-2xl border border-border bg-card p-6 sm:p-8">
          <h3 className="font-display text-lg font-semibold">
            {editingId ? "Modifier l'utilisateur" : "Nouvel utilisateur"}
          </h3>
          <div className="grid gap-5 sm:grid-cols-2">
            <FormField label="Nom complet" htmlFor="user-nom">
              <Input
                id="user-nom"
                className={formInputClass}
                value={nom}
                onChange={(e) => setNom(e.target.value)}
                required
                minLength={2}
                placeholder="Ex: Koffi Mensah"
              />
            </FormField>
            <FormField label="Email" htmlFor="user-email">
              <Input
                id="user-email"
                type="email"
                className={formInputClass}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                placeholder="exemple@email.com"
              />
            </FormField>
            <FormField label="Téléphone" htmlFor="user-tel">
              <Input
                id="user-tel"
                type="tel"
                className={formInputClass}
                value={telephone}
                onChange={(e) => setTelephone(e.target.value)}
                required
                placeholder="90 12 34 56"
              />
            </FormField>
            <FormField
              label={editingId ? "Nouveau mot de passe (optionnel)" : "Mot de passe"}
              htmlFor="user-pwd"
            >
              <PasswordInput
                id="user-pwd"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required={!editingId}
                minLength={editingId ? undefined : 8}
                placeholder={editingId ? "Laisser vide pour ne pas changer" : "8 caractères minimum"}
                autoComplete="new-password"
              />
            </FormField>
            <FormField label="Rôle">
              <Select value={role} onValueChange={(v) => setRole(v as AdminUser["role"])}>
                <SelectTrigger className={formSelectClass}><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="utilisateur">Contributeur</SelectItem>
                  <SelectItem value="gestionnaire">Gestionnaire</SelectItem>
                  <SelectItem value="admin">Administrateur</SelectItem>
                </SelectContent>
              </Select>
            </FormField>
            <FormField label="Ville (optionnel)">
              <Select value={ville || "_none"} onValueChange={(v) => setVille(v === "_none" ? "" : v)}>
                <SelectTrigger className={formSelectClass}><SelectValue placeholder="Choisir" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="_none">— Non renseignée —</SelectItem>
                  {(meta?.villes ?? []).map((v) => (
                    <SelectItem key={v} value={v}>{v}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </FormField>
          </div>
          <div className="flex flex-wrap gap-3 pt-1">
            <Button type="submit" size="lg" disabled={submitting} className="h-12 gap-2 rounded-xl px-6">
              {submitting && <Loader2 className="size-4 animate-spin" />}
              {editingId ? "Enregistrer" : "Créer l'utilisateur"}
            </Button>
            <Button
              type="button"
              size="lg"
              variant="outline"
              className="h-12 rounded-xl px-6"
              onClick={() => { setFormOpen(false); resetForm(); }}
            >
              Annuler
            </Button>
          </div>
        </form>
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
            <TableHead>Nom</TableHead>
            <TableHead>Email</TableHead>
            <TableHead>Ville</TableHead>
            <TableHead>Rôle</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {!data?.length && (
            <DataTableEmptyRow colSpan={5} message="Aucun utilisateur" />
          )}
          {pagination.items.map((u) => (
            <TableRow key={u.id}>
              <TableCell className="font-medium">{u.nom}</TableCell>
              <TableCell className="text-muted-foreground">{u.email}</TableCell>
              <TableCell>{u.ville ?? "—"}</TableCell>
              <TableCell><UserRoleBadge role={u.role} /></TableCell>
              <TableCell className="text-right">
                <TableActions>
                  <TableActionButton
                    icon={Eye}
                    label="Détails"
                    onClick={() => setDetailId(u.id)}
                  />
                  <TableActionButton
                    icon={BarChart3}
                    label="Stats"
                    onClick={() => setStatsId(u.id)}
                  />
                  <TableActionButton
                    icon={Trash2}
                    label="Supprimer"
                    destructive
                    onClick={() => setDeleteTarget(u)}
                  />
                </TableActions>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </DataTableShell>

      <Sheet open={!!detailId} onOpenChange={(open) => !open && setDetailId(null)}>
        <SheetContent className="w-full overflow-y-auto sm:max-w-md">
          <SheetHeader>
            <SheetTitle>Détails utilisateur</SheetTitle>
            <SheetDescription>Informations du compte et actions rapides.</SheetDescription>
          </SheetHeader>
          {detailLoading && (
            <div className="flex justify-center py-12">
              <Loader2 className="size-6 animate-spin text-muted-foreground" />
            </div>
          )}
          {detail && !detailLoading && (
            <div className="mt-6 space-y-6">
              <div className="space-y-1">
                <p className="font-display text-xl font-semibold">{detail.nom}</p>
                <UserRoleBadge role={detail.role} />
              </div>
              <dl className="space-y-4 text-sm">
                <div>
                  <dt className="text-muted-foreground">Email</dt>
                  <dd className="font-medium">{detail.email}</dd>
                </div>
                <div>
                  <dt className="text-muted-foreground">Téléphone</dt>
                  <dd className="font-medium">{detail.telephone ?? "—"}</dd>
                </div>
                <div>
                  <dt className="text-muted-foreground">Ville</dt>
                  <dd className="font-medium">{detail.ville ?? "—"}</dd>
                </div>
                <div>
                  <dt className="text-muted-foreground">Inscrit le</dt>
                  <dd className="font-medium">{fmtDate(detail.createdAt)}</dd>
                </div>
                <div>
                  <dt className="text-muted-foreground">Mot de passe</dt>
                  <dd className="flex items-center gap-2">
                    <span className="font-mono tracking-widest text-muted-foreground">••••••••</span>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="h-8 gap-1.5 rounded-lg"
                      onClick={openResetModal}
                    >
                      <KeyRound className="size-3.5" />
                      Réinitialiser
                    </Button>
                  </dd>
                </div>
              </dl>
              <div className="flex flex-wrap gap-2 border-t border-border pt-4">
                <Button type="button" className="gap-2 rounded-xl" onClick={startEditFromDetail}>
                  <Pencil className="size-4" />
                  Modifier
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  className="gap-2 rounded-xl"
                  onClick={() => { setDetailId(null); setStatsId(detail.id); }}
                >
                  <BarChart3 className="size-4" />
                  Voir les stats
                </Button>
              </div>
            </div>
          )}
        </SheetContent>
      </Sheet>

      <Sheet open={!!statsId} onOpenChange={(open) => !open && setStatsId(null)}>
        <SheetContent className="w-full overflow-y-auto sm:max-w-lg">
          <SheetHeader>
            <SheetTitle>Statistiques</SheetTitle>
            <SheetDescription>
              {stats ? `Activité de ${stats.nom}` : "Chargement…"}
            </SheetDescription>
          </SheetHeader>
          {statsLoading && (
            <div className="flex justify-center py-12">
              <Loader2 className="size-6 animate-spin text-muted-foreground" />
            </div>
          )}
          {stats && !statsLoading && (
            <div className="mt-6 space-y-6">
              <div className="grid grid-cols-2 gap-3">
                <StatCard
                  icon={Upload}
                  label="Soumissions"
                  value={String(stats.soumissions.total)}
                  sub={`${stats.soumissions.validees} validées · ${stats.soumissions.rejetees} refusées`}
                />
                <StatCard
                  icon={Wallet}
                  label="Portefeuille"
                  value={formatFcfa(stats.portefeuille.solde)}
                  sub={`${stats.portefeuille.epreuvesValidees} épreuves validées`}
                />
                <StatCard
                  icon={Download}
                  label="Téléchargements"
                  value={String(stats.telechargements)}
                  sub={`${stats.paiements.confirmes} paiement(s) confirmé(s)`}
                />
                <StatCard
                  icon={CheckCircle2}
                  label="Épreuves publiées"
                  value={String(stats.epreuvesPubliees)}
                  sub={`${stats.retraits.total} demande(s) de retrait`}
                />
              </div>

              <div className="rounded-xl border border-border bg-muted/30 p-4 text-sm">
                <p className="mb-2 font-medium">Soumissions par statut</p>
                <div className="flex flex-wrap gap-2">
                  <Badge variant="secondary">{stats.soumissions.enAttente} en attente</Badge>
                  <Badge className="bg-emerald-100 text-emerald-800 hover:bg-emerald-100">
                    {stats.soumissions.validees} validées
                  </Badge>
                  <Badge variant="destructive">{stats.soumissions.rejetees} refusées</Badge>
                </div>
                <p className="mt-3 text-muted-foreground">
                  Retraits : {stats.retraits.enAttente} en attente · {stats.retraits.payes} payés
                  {stats.retraits.rejetes > 0 && ` · ${stats.retraits.rejetes} rejetés`}
                </p>
              </div>

              <div>
                <p className="mb-3 font-medium">Événements récents</p>
                {!stats.evenements.length && (
                  <p className="text-sm text-muted-foreground">Aucune activité enregistrée.</p>
                )}
                <ul className="space-y-2">
                  {stats.evenements.map((ev, i) => (
                    <li
                      key={`${ev.type}-${ev.date}-${i}`}
                      className="flex gap-3 rounded-lg border border-border bg-card p-3 text-sm"
                    >
                      <EventIcon type={ev.type} statut={ev.statut} />
                      <div className="min-w-0 flex-1">
                        <p className="font-medium">{ev.label}</p>
                        <p className="truncate text-muted-foreground">{ev.detail}</p>
                        <p className="mt-0.5 text-xs text-muted-foreground">{fmtDate(ev.date)}</p>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          )}
        </SheetContent>
      </Sheet>

      <AlertDialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Supprimer cet utilisateur ?</AlertDialogTitle>
            <AlertDialogDescription>
              {deleteTarget
                ? `Le compte de ${deleteTarget.nom} (${deleteTarget.email}) sera définitivement supprimé. Cette action est irréversible.`
                : ""}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>Annuler</AlertDialogCancel>
            <AlertDialogAction
              disabled={deleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={(e) => { e.preventDefault(); confirmDelete(); }}
            >
              {deleting && <Loader2 className="mr-2 size-4 animate-spin" />}
              Supprimer
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <Dialog open={resetOpen} onOpenChange={(open) => !open && closeResetModal()}>
        <DialogContent className="sm:max-w-md">
          {!tempPassword ? (
            <>
              <DialogHeader>
                <DialogTitle>Réinitialiser le mot de passe</DialogTitle>
                <DialogDescription>
                  {detail
                    ? `Confirmez votre mot de passe administrateur pour réinitialiser le compte de ${detail.nom}.`
                    : "Confirmez votre mot de passe administrateur."}
                </DialogDescription>
              </DialogHeader>
              <FormField label="Votre mot de passe" htmlFor="admin-pwd-confirm">
                <PasswordInput
                  id="admin-pwd-confirm"
                  value={adminPassword}
                  onChange={(e) => setAdminPassword(e.target.value)}
                  autoComplete="current-password"
                  placeholder="Mot de passe administrateur"
                  required
                />
              </FormField>
              <DialogFooter className="gap-2 sm:gap-0">
                <Button type="button" variant="outline" onClick={closeResetModal} disabled={resetting}>
                  Annuler
                </Button>
                <Button
                  type="button"
                  disabled={resetting || !adminPassword}
                  className="gap-2"
                  onClick={confirmResetPassword}
                >
                  {resetting && <Loader2 className="size-4 animate-spin" />}
                  Réinitialiser
                </Button>
              </DialogFooter>
            </>
          ) : (
            <>
              <DialogHeader>
                <DialogTitle>Mot de passe temporaire</DialogTitle>
                <DialogDescription>
                  Communiquez ce mot de passe à l&apos;utilisateur. Il ne sera plus affiché après fermeture de cette fenêtre.
                </DialogDescription>
              </DialogHeader>
              <div className="flex items-center gap-2 rounded-xl border border-border bg-muted/40 p-4">
                <code className="flex-1 break-all font-mono text-sm font-semibold">{tempPassword}</code>
                <Button type="button" variant="outline" size="icon" className="shrink-0" onClick={copyTempPassword}>
                  <Copy className="size-4" />
                  <span className="sr-only">Copier</span>
                </Button>
              </div>
              <DialogFooter>
                <Button type="button" onClick={closeResetModal}>
                  Fermer
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

function StatCard({
  icon: Icon, label, value, sub,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string;
  sub: string;
}) {
  return (
    <div className="rounded-xl border border-border bg-card p-3">
      <div className="mb-1 flex items-center gap-1.5 text-muted-foreground">
        <Icon className="size-3.5" />
        <span className="text-xs">{label}</span>
      </div>
      <p className="font-display text-lg font-semibold">{value}</p>
      <p className="text-xs text-muted-foreground">{sub}</p>
    </div>
  );
}

function EventIcon({ type, statut }: { type: string; statut?: string | null }) {
  if (type === "soumission" && statut === "rejetee") {
    return <XCircle className="mt-0.5 size-4 shrink-0 text-destructive" />;
  }
  if (type === "soumission" && statut === "validee") {
    return <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-emerald-600" />;
  }
  if (type === "portefeuille") {
    return <Wallet className="mt-0.5 size-4 shrink-0 text-amber-600" />;
  }
  if (type === "retrait") {
    return <Wallet className="mt-0.5 size-4 shrink-0 text-sky-600" />;
  }
  return <Download className="mt-0.5 size-4 shrink-0 text-muted-foreground" />;
}
