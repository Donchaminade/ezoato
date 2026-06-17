import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useRef, useState } from "react";
import { toast } from "sonner";
import {
  Building2,
  Eye,
  EyeOff,
  Handshake,
  Loader2,
  Plus,
  School,
  Trash2,
  Upload,
  Pencil,
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
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { api } from "@/lib/api";
import type {
  DemandeEtablissement,
  DemandeEtablissementStatut,
  DemandeSoutien,
  DemandeSoutienStatut,
  Partenaire,
  PartenaireType,
} from "@/lib/types";

const SOUTIEN_STATUTS: { value: DemandeSoutienStatut; label: string }[] = [
  { value: "nouvelle", label: "Nouvelle" },
  { value: "en_cours", label: "En cours" },
  { value: "acceptee", label: "Acceptée" },
  { value: "refusee", label: "Refusée" },
  { value: "archivee", label: "Archivée" },
];

const ETAB_STATUTS: { value: DemandeEtablissementStatut; label: string }[] = [
  { value: "nouvelle", label: "Nouvelle" },
  { value: "en_cours", label: "En cours" },
  { value: "traitee", label: "Traitée" },
  { value: "archivee", label: "Archivée" },
];

const TYPE_LABELS: Record<PartenaireType, string> = {
  etablissement: "Établissement",
  entreprise: "Entreprise",
  association: "Association",
  autre: "Autre",
};

export function PartenairesAdminTab({ isAdmin }: { isAdmin: boolean }) {
  const qc = useQueryClient();
  const fileRef = useRef<HTMLInputElement>(null);
  const [creating, setCreating] = useState(false);
  const [nom, setNom] = useState("");
  const [ville, setVille] = useState("");
  const [siteWeb, setSiteWeb] = useState("");
  const [type, setType] = useState<PartenaireType>("etablissement");
  const [ordre, setOrdre] = useState("0");
  const [logo, setLogo] = useState<File | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const { data: partenaires, refetch } = useQuery({
    queryKey: ["admin-partenaires"],
    queryFn: () => api.listAdminPartenaires(),
  });

  async function creer(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      const fd = new FormData();
      fd.append("nom", nom);
      if (ville) fd.append("ville", ville);
      if (siteWeb) fd.append("siteWeb", siteWeb);
      fd.append("type", type);
      fd.append("ordre", ordre);
      if (logo) fd.append("logo", logo);
      await api.creerPartenaire(fd);
      toast.success("Partenaire ajouté");
      setCreating(false);
      setNom("");
      setVille("");
      setSiteWeb("");
      setLogo(null);
      refetch();
      qc.invalidateQueries({ queryKey: ["partenaires"] });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Échec");
    } finally {
      setSaving(false);
    }
  }

  async function toggleVisible(p: Partenaire) {
    try {
      const fd = new FormData();
      fd.append("nom", p.nom);
      fd.append("type", p.type);
      fd.append("ordre", String(p.ordre));
      fd.append("visible", p.visible ? "0" : "1");
      if (p.ville) fd.append("ville", p.ville);
      if (p.siteWeb) fd.append("siteWeb", p.siteWeb);
      await api.modifierPartenaire(p.id, fd);
      refetch();
      qc.invalidateQueries({ queryKey: ["partenaires"] });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Échec");
    }
  }

  async function supprimer() {
    if (!deleteId) return;
    try {
      await api.supprimerPartenaire(deleteId);
      toast.success("Partenaire supprimé");
      setDeleteId(null);
      refetch();
      qc.invalidateQueries({ queryKey: ["partenaires"] });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Échec");
    }
  }

  const pagination = usePagination(partenaires);

  return (
    <div className="space-y-6">
      <DataTableToolbar
        title="Partenaires"
        description="Logos et noms affichés sur la page partenariat et l'accueil."
        count={partenaires?.length ?? 0}
        onAdd={() => setCreating((v) => !v)}
        addLabel={creating ? "Fermer" : "Ajouter"}
      />

      {creating && (
        <form onSubmit={creer} className="rounded-xl border border-border bg-card p-5 space-y-4">
          <h3 className="font-semibold">Nouveau partenaire</h3>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <Label>Nom</Label>
              <Input value={nom} onChange={(e) => setNom(e.target.value)} required />
            </div>
            <div>
              <Label>Ville</Label>
              <Input value={ville} onChange={(e) => setVille(e.target.value)} />
            </div>
          </div>
          <div className="grid gap-4 sm:grid-cols-3">
            <div>
              <Label>Type</Label>
              <Select value={type} onValueChange={(v) => setType(v as PartenaireType)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {Object.entries(TYPE_LABELS).map(([k, l]) => (
                    <SelectItem key={k} value={k}>{l}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Ordre d'affichage</Label>
              <Input type="number" value={ordre} onChange={(e) => setOrdre(e.target.value)} />
            </div>
            <div>
              <Label>Site web</Label>
              <Input value={siteWeb} onChange={(e) => setSiteWeb(e.target.value)} placeholder="https://…" />
            </div>
          </div>
          <div>
            <Label>Logo (PNG, JPG — 2 Mo max)</Label>
            <input
              ref={fileRef}
              type="file"
              accept="image/png,image/jpeg,image/webp,image/gif"
              className="hidden"
              aria-label="Logo du partenaire"
              onChange={(e) => setLogo(e.target.files?.[0] ?? null)}
            />
            <Button type="button" variant="outline" size="sm" className="mt-1" onClick={() => fileRef.current?.click()}>
              <Upload className="size-4" /> {logo ? logo.name : "Choisir un logo"}
            </Button>
          </div>
          <div className="flex gap-2">
            <Button type="submit" disabled={saving}>
              {saving ? <Loader2 className="size-4 animate-spin" /> : "Enregistrer"}
            </Button>
            <Button type="button" variant="ghost" onClick={() => setCreating(false)}>Annuler</Button>
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
            <TableHead>Logo</TableHead>
            <TableHead>Nom</TableHead>
            <TableHead>Type</TableHead>
            <TableHead>Ville</TableHead>
            <TableHead>Visibilité</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {!partenaires?.length && (
            <DataTableEmptyRow colSpan={6} message="Aucun partenaire pour le moment" />
          )}
          {pagination.items.map((p) => (
            <TableRow key={p.id}>
              <TableCell>
                <div className="flex size-10 items-center justify-center rounded-lg bg-muted">
                  {p.logoUrl ? (
                    <img src={p.logoUrl} alt="" className="max-h-8 max-w-8 object-contain" />
                  ) : (
                    <Building2 className="size-4 text-muted-foreground" />
                  )}
                </div>
              </TableCell>
              <TableCell className="font-medium">{p.nom}</TableCell>
              <TableCell>{TYPE_LABELS[p.type]}</TableCell>
              <TableCell>{p.ville ?? "—"}</TableCell>
              <TableCell>
                <Badge variant={p.visible ? "default" : "secondary"}>
                  {p.visible ? "Visible" : "Masqué"}
                </Badge>
              </TableCell>
              <TableCell className="text-right">
                <TableActions>
                  <TableActionButton
                    icon={p.visible ? EyeOff : Eye}
                    label={p.visible ? "Masquer" : "Afficher"}
                    variant="outline"
                    onClick={() => toggleVisible(p)}
                  />
                  {isAdmin && (
                    <TableActionButton
                      icon={Trash2}
                      label="Supprimer"
                      destructive
                      onClick={() => setDeleteId(p.id)}
                    />
                  )}
                </TableActions>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </DataTableShell>

      <AlertDialog open={!!deleteId} onOpenChange={(o) => !o && setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Supprimer ce partenaire ?</AlertDialogTitle>
            <AlertDialogDescription>Cette action est irréversible.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction onClick={supprimer}>Supprimer</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

export function DemandesSoutienAdminTab() {
  const qc = useQueryClient();
  const { data, refetch } = useQuery({
    queryKey: ["admin-demandes-soutien"],
    queryFn: () => api.listDemandesSoutien(),
  });
  const [active, setActive] = useState<DemandeSoutien | null>(null);
  const [statut, setStatut] = useState<DemandeSoutienStatut>("en_cours");
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);

  async function sauver() {
    if (!active) return;
    setSaving(true);
    try {
      await api.updateDemandeSoutienStatut(active.id, statut, notes || undefined);
      toast.success("Demande mise à jour");
      setActive(null);
      refetch();
      qc.invalidateQueries({ queryKey: ["admin-stats"] });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Échec");
    } finally {
      setSaving(false);
    }
  }

  return (
    <DemandesLayout
      icon={Handshake}
      title="Demandes de soutien"
      empty="Aucune demande de soutien."
      items={data}
      columns={["Demandeur", "Type", "Statut"]}
      onSelect={(d) => { setActive(d); setStatut(d.statut); setNotes(d.notesAdmin ?? ""); }}
      renderRow={(d) => [
        <div key="nom">
          <p className="font-medium">{d.nom}{d.organisation ? ` — ${d.organisation}` : ""}</p>
          <p className="text-xs text-muted-foreground">{d.email}</p>
        </div>,
        d.type,
        <Badge key="st" variant={d.lu ? "secondary" : "default"}>{d.lu ? d.statut : "Nouveau"}</Badge>,
      ]}
      active={active}
      onClose={() => setActive(null)}
      panel={
        active && (
          <div className="space-y-4">
            <div className="text-sm space-y-1">
              <p><strong>Email :</strong> {active.email}</p>
              {active.telephone && <p><strong>Tél. :</strong> {active.telephone}</p>}
              <p className="whitespace-pre-wrap mt-3">{active.message}</p>
            </div>
            <div>
              <Label>Statut</Label>
              <Select value={statut} onValueChange={(v) => setStatut(v as DemandeSoutienStatut)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {SOUTIEN_STATUTS.map((s) => (
                    <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Notes internes</Label>
              <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={3} />
            </div>
            <Button onClick={sauver} disabled={saving}>
              {saving ? <Loader2 className="size-4 animate-spin" /> : "Enregistrer"}
            </Button>
          </div>
        )
      }
    />
  );
}

export function DemandesEtablissementAdminTab() {
  const qc = useQueryClient();
  const { data, refetch } = useQuery({
    queryKey: ["admin-demandes-etablissement"],
    queryFn: () => api.listDemandesEtablissement(),
  });
  const [active, setActive] = useState<DemandeEtablissement | null>(null);
  const [statut, setStatut] = useState<DemandeEtablissementStatut>("en_cours");
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);

  async function sauver() {
    if (!active) return;
    setSaving(true);
    try {
      await api.updateDemandeEtablissementStatut(active.id, statut, notes || undefined);
      toast.success("Demande mise à jour");
      setActive(null);
      refetch();
      qc.invalidateQueries({ queryKey: ["admin-stats"] });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Échec");
    } finally {
      setSaving(false);
    }
  }

  return (
    <DemandesLayout
      icon={School}
      title="Demandes établissement"
      empty="Aucune demande établissement."
      items={data}
      columns={["Établissement", "Ville", "Statut"]}
      onSelect={(d) => { setActive(d); setStatut(d.statut); setNotes(d.notesAdmin ?? ""); }}
      renderRow={(d) => [
        <div key="etab">
          <p className="font-medium">{d.nomEtablissement}</p>
          <p className="text-xs text-muted-foreground">{d.nomContact} · {d.typeDemande}</p>
        </div>,
        d.ville,
        <Badge key="st" variant={d.lu ? "secondary" : "default"}>{d.lu ? d.statut : "Nouveau"}</Badge>,
      ]}
      active={active}
      onClose={() => setActive(null)}
      panel={
        active && (
          <div className="space-y-4">
            <div className="text-sm space-y-1">
              <p><strong>Contact :</strong> {active.nomContact}{active.fonction ? ` (${active.fonction})` : ""}</p>
              <p><strong>Email :</strong> {active.email}</p>
              {active.telephone && <p><strong>Tél. :</strong> {active.telephone}</p>}
              <p className="whitespace-pre-wrap mt-3">{active.message}</p>
            </div>
            <div>
              <Label>Statut</Label>
              <Select value={statut} onValueChange={(v) => setStatut(v as DemandeEtablissementStatut)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {ETAB_STATUTS.map((s) => (
                    <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Notes internes</Label>
              <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={3} />
            </div>
            <Button onClick={sauver} disabled={saving}>
              {saving ? <Loader2 className="size-4 animate-spin" /> : "Enregistrer"}
            </Button>
          </div>
        )
      }
    />
  );
}

function DemandesLayout<T extends { id: string }>({
  icon: Icon,
  empty,
  title,
  items,
  columns,
  renderRow,
  onSelect,
  active,
  onClose,
  panel,
}: {
  icon: React.ComponentType<{ className?: string }>;
  empty: string;
  title: string;
  items?: T[];
  columns: string[];
  renderRow: (item: T) => React.ReactNode[];
  onSelect: (item: T) => void;
  active: T | null;
  onClose: () => void;
  panel: React.ReactNode;
}) {
  const pagination = usePagination(items);

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <div>
        <DataTableToolbar title={title} count={items?.length ?? 0} />
        <DataTableShell
          pagination={
            pagination.total > 0
              ? { ...pagination, onPageChange: pagination.setPage }
              : undefined
          }
        >
          <TableHeader>
            <TableRow>
              {columns.map((col) => (
                <TableHead key={col}>{col}</TableHead>
              ))}
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {!items?.length && (
              <DataTableEmptyRow colSpan={columns.length + 1} message={empty} />
            )}
            {pagination.items.map((item) => {
              const cells = renderRow(item);
              return (
                <TableRow
                  key={item.id}
                  className={active?.id === item.id ? "bg-primary/8" : undefined}
                >
                  {cells.map((cell, i) => (
                    <TableCell key={i}>{cell}</TableCell>
                  ))}
                  <TableCell className="text-right">
                    <TableActions>
                      <TableActionButton
                        icon={Pencil}
                        label="Traiter"
                        onClick={() => onSelect(item)}
                      />
                    </TableActions>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </DataTableShell>
      </div>
      <div className="rounded-xl border border-border bg-card p-5 lg:sticky lg:top-24 lg:self-start">
        {active ? (
          <>
            <div className="mb-4 flex items-center justify-between">
              <h3 className="font-semibold">Détail</h3>
              <Button variant="ghost" size="sm" onClick={onClose}>Fermer</Button>
            </div>
            {panel}
          </>
        ) : (
          <p className="text-sm text-muted-foreground">Sélectionnez une demande pour la traiter.</p>
        )}
      </div>
    </div>
  );
}
