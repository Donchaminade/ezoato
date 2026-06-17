import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Bell, BellOff, Loader2, Pencil, Trash2 } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
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
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle,
} from "@/components/ui/sheet";
import { api } from "@/lib/api";
import type { NotificationRule } from "@/lib/types";
import { cn } from "@/lib/utils";

const CANAL_LABEL: Record<NotificationRule["canal"], string> = {
  in_app: "Dans l'app",
  push: "Push",
  email: "E-mail",
};

const DEST_LABEL: Record<NotificationRule["destinataire"], string> = {
  utilisateur: "Utilisateur",
  gestionnaire: "Gestionnaire",
  admin: "Admin",
};

const EMPTY_FORM = {
  libelle: "",
  description: "",
  declencheur: "",
  canal: "in_app" as NotificationRule["canal"],
  destinataire: "utilisateur" as NotificationRule["destinataire"],
  titre: "",
  corps: "",
  active: true,
};

export function AdminNotificationsTab() {
  const qc = useQueryClient();
  const { data, isLoading, refetch } = useQuery({
    queryKey: ["admin-notifications"],
    queryFn: () => api.getNotificationRules(),
  });

  const rules = data?.rules ?? [];
  const pagination = usePagination(rules);

  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<NotificationRule | null>(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [deleteTarget, setDeleteTarget] = useState<NotificationRule | null>(null);

  useEffect(() => {
    if (!editing) {
      setForm(EMPTY_FORM);
      return;
    }
    setForm({
      libelle: editing.libelle,
      description: editing.description ?? "",
      declencheur: editing.declencheur,
      canal: editing.canal,
      destinataire: editing.destinataire,
      titre: editing.titre,
      corps: editing.corps,
      active: editing.active,
    });
  }, [editing]);

  const saveMutation = useMutation({
    mutationFn: async () => {
      const payload = {
        libelle: form.libelle.trim(),
        description: form.description.trim() || undefined,
        declencheur: form.declencheur,
        canal: form.canal,
        destinataire: form.destinataire,
        titre: form.titre.trim(),
        corps: form.corps.trim(),
        active: form.active,
      };
      if (editing) return api.updateNotificationRule(editing.id, payload);
      return api.createNotificationRule(payload);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-notifications"] });
      toast.success(editing ? "Notification mise à jour" : "Notification créée");
      setFormOpen(false);
      setEditing(null);
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : "Échec"),
  });

  const toggleMutation = useMutation({
    mutationFn: (id: string) => api.toggleNotificationRule(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-notifications"] });
      toast.success("Statut mis à jour");
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : "Échec"),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.deleteNotificationRule(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-notifications"] });
      toast.success("Notification supprimée");
      setDeleteTarget(null);
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : "Échec"),
  });

  function openCreate() {
    setEditing(null);
    setForm(EMPTY_FORM);
    setFormOpen(true);
  }

  function openEdit(rule: NotificationRule) {
    setEditing(rule);
    setFormOpen(true);
  }

  if (isLoading) {
    return (
      <div className="flex h-48 items-center justify-center">
        <Loader2 className="size-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!data?.dbReady) {
    return (
      <div className="rounded-2xl border border-amber-200 bg-amber-50 p-6 text-sm text-amber-900 dark:border-amber-900/50 dark:bg-amber-950/30 dark:text-amber-200">
        <p className="font-medium">Migration requise</p>
        <p className="mt-1 text-muted-foreground">
          {data?.message ?? "Exécutez migration-notification-rules.sql sur la base de données."}
        </p>
        <Button variant="outline" className="mt-4 rounded-xl" onClick={() => refetch()}>
          Réessayer
        </Button>
      </div>
    );
  }

  const declencheurs = data.declencheurs;

  return (
    <div className="space-y-4">
      <DataTableToolbar
        title="Notifications programmées"
        description="Activez, modifiez ou supprimez les alertes envoyées lors des confirmations (soumissions, retraits, paiements…)."
        count={rules.length}
        onAdd={openCreate}
        addLabel="Nouvelle règle"
      />

      <DataTableShell
        pagination={
          pagination.total > 0
            ? { ...pagination, onPageChange: pagination.setPage }
            : undefined
        }
      >
        <TableHeader>
          <TableRow>
            <TableHead>Libellé</TableHead>
            <TableHead className="hidden md:table-cell">Événement</TableHead>
            <TableHead className="hidden sm:table-cell">Destinataire</TableHead>
            <TableHead>Statut</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {pagination.items.length === 0 ? (
            <DataTableEmptyRow colSpan={5} message="Aucune règle configurée" />
          ) : (
            pagination.items.map((rule) => (
              <TableRow key={rule.id}>
                <TableCell>
                  <div className="min-w-0">
                    <p className="truncate font-medium">{rule.libelle}</p>
                    <p className="truncate text-xs text-muted-foreground md:hidden">
                      {rule.declencheurLabel}
                    </p>
                  </div>
                </TableCell>
                <TableCell className="hidden max-w-[200px] truncate text-sm text-muted-foreground md:table-cell">
                  {rule.declencheurLabel}
                </TableCell>
                <TableCell className="hidden sm:table-cell">
                  <Badge variant="outline" className="font-normal">
                    {DEST_LABEL[rule.destinataire]}
                  </Badge>
                </TableCell>
                <TableCell>
                  <Badge
                    variant="outline"
                    className={cn(
                      "font-medium",
                      rule.active
                        ? "border-emerald-200 bg-emerald-50 text-emerald-800"
                        : "border-slate-200 bg-slate-100 text-slate-600",
                    )}
                  >
                    {rule.active ? "Active" : "Inactive"}
                  </Badge>
                </TableCell>
                <TableCell className="text-right">
                  <TableActions>
                    <TableActionButton
                      label={rule.active ? "Désactiver" : "Activer"}
                      icon={rule.active ? BellOff : Bell}
                      onClick={() => toggleMutation.mutate(rule.id)}
                      disabled={toggleMutation.isPending}
                    />
                    <TableActionButton
                      label="Modifier"
                      icon={Pencil}
                      onClick={() => openEdit(rule)}
                    />
                    <TableActionButton
                      label="Supprimer"
                      icon={Trash2}
                      destructive
                      onClick={() => setDeleteTarget(rule)}
                    />
                  </TableActions>
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </DataTableShell>

      <Sheet open={formOpen} onOpenChange={(o) => { setFormOpen(o); if (!o) setEditing(null); }}>
        <SheetContent className="overflow-y-auto sm:max-w-lg">
          <SheetHeader>
            <SheetTitle>{editing ? "Modifier la notification" : "Nouvelle notification"}</SheetTitle>
            <SheetDescription>
              Variables disponibles : {"{nom}"}, {"{titre}"}, {"{matiere}"}, {"{montant}"}, {"{motif}"}, {"{methode}"}
            </SheetDescription>
          </SheetHeader>

          <form
            className="mt-6 space-y-4"
            onSubmit={(e) => {
              e.preventDefault();
              saveMutation.mutate();
            }}
          >
            <div className="space-y-2">
              <Label htmlFor="notif-libelle">Libellé interne</Label>
              <Input
                id="notif-libelle"
                value={form.libelle}
                onChange={(e) => setForm((f) => ({ ...f, libelle: e.target.value }))}
                required
                className="rounded-xl"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="notif-desc">Description (optionnel)</Label>
              <Input
                id="notif-desc"
                value={form.description}
                onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                className="rounded-xl"
              />
            </div>

            <div className="space-y-2">
              <Label>Événement déclencheur</Label>
              <Select
                value={form.declencheur}
                onValueChange={(v) => setForm((f) => ({ ...f, declencheur: v }))}
              >
                <SelectTrigger className="rounded-xl">
                  <SelectValue placeholder="Choisir un événement" />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(declencheurs).map(([key, label]) => (
                    <SelectItem key={key} value={key}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>Canal</Label>
                <Select
                  value={form.canal}
                  onValueChange={(v) => setForm((f) => ({ ...f, canal: v as NotificationRule["canal"] }))}
                >
                  <SelectTrigger className="rounded-xl">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {data.canaux.map((c) => (
                      <SelectItem key={c} value={c}>
                        {CANAL_LABEL[c as NotificationRule["canal"]] ?? c}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Destinataire</Label>
                <Select
                  value={form.destinataire}
                  onValueChange={(v) =>
                    setForm((f) => ({ ...f, destinataire: v as NotificationRule["destinataire"] }))
                  }
                >
                  <SelectTrigger className="rounded-xl">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {data.destinataires.map((d) => (
                      <SelectItem key={d} value={d}>
                        {DEST_LABEL[d as NotificationRule["destinataire"]] ?? d}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="notif-titre">Titre du message</Label>
              <Input
                id="notif-titre"
                value={form.titre}
                onChange={(e) => setForm((f) => ({ ...f, titre: e.target.value }))}
                required
                className="rounded-xl"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="notif-corps">Corps du message</Label>
              <Textarea
                id="notif-corps"
                value={form.corps}
                onChange={(e) => setForm((f) => ({ ...f, corps: e.target.value }))}
                required
                rows={4}
                className="rounded-xl"
              />
            </div>

            <div className="flex items-center justify-between rounded-xl border border-border px-3 py-3">
              <div>
                <p className="text-sm font-medium">Activer immédiatement</p>
                <p className="text-xs text-muted-foreground">Les notifications inactives ne sont pas envoyées</p>
              </div>
              <Switch
                checked={form.active}
                onCheckedChange={(checked) => setForm((f) => ({ ...f, active: checked }))}
              />
            </div>

            <Button type="submit" className="w-full rounded-xl" disabled={saveMutation.isPending}>
              {saveMutation.isPending && <Loader2 className="size-4 animate-spin" />}
              {editing ? "Enregistrer" : "Créer"}
            </Button>
          </form>
        </SheetContent>
      </Sheet>

      <AlertDialog open={!!deleteTarget} onOpenChange={(o) => !o && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Supprimer cette règle ?</AlertDialogTitle>
            <AlertDialogDescription>
              « {deleteTarget?.libelle} » ne sera plus envoyée. Cette action est irréversible.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => deleteTarget && deleteMutation.mutate(deleteTarget.id)}
            >
              Supprimer
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
