import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { CalendarPlus, Crown, Loader2, Send } from "lucide-react";
import { useState } from "react";
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
import { usePagination } from "@/hooks/use-pagination";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle,
} from "@/components/ui/sheet";
import { api } from "@/lib/api";
import { formatFcfa } from "@/lib/pricing";
import { SUBSCRIPTION_DURATION_MONTHS, SUBSCRIPTION_PRICE } from "@/lib/subscription-constants";
import type { AdminAbonnement } from "@/lib/types";

function formatDate(iso?: string | null) {
  if (!iso) return "—";
  try {
    return new Date(iso).toLocaleDateString("fr-FR");
  } catch {
    return iso;
  }
}

function statutBadge(statut: AdminAbonnement["statut"]) {
  if (statut === "actif") return <Badge className="bg-emerald-600/90">Actif</Badge>;
  if (statut === "en_attente") return <Badge variant="secondary">En attente</Badge>;
  return <Badge variant="outline">Expiré</Badge>;
}

export function AdminAbonnementsTab() {
  const qc = useQueryClient();
  const [filtre, setFiltre] = useState<"all" | "actif" | "expire">("actif");
  const [notifyOpen, setNotifyOpen] = useState(false);
  const [titre, setTitre] = useState("");
  const [message, setMessage] = useState("");
  const [notifType, setNotifType] = useState<"info" | "push" | "all">("info");
  const [prolongOpen, setProlongOpen] = useState(false);
  const [prolongTarget, setProlongTarget] = useState<AdminAbonnement | null>(null);
  const [prolongJours, setProlongJours] = useState("30");

  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ["admin-abonnements-stats"],
    queryFn: () => api.getAdminAbonnementsStats(),
  });

  const { data, isLoading, refetch } = useQuery({
    queryKey: ["admin-abonnements", filtre],
    queryFn: () => api.listAdminAbonnements({ statut: filtre, perPage: 50 }),
  });

  const items = data?.items ?? [];
  const pagination = usePagination(items);

  const notifyMutation = useMutation({
    mutationFn: () =>
      api.notifySubscribers({
        titre: titre.trim(),
        message: message.trim(),
        type: notifType,
      }),
    onSuccess: (res) => {
      toast.success(`Notification envoyée à ${res.envoyes} abonné(s)`);
      setNotifyOpen(false);
      setTitre("");
      setMessage("");
      qc.invalidateQueries({ queryKey: ["admin-abonnements"] });
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : "Échec"),
  });

  const prolongMutation = useMutation({
    mutationFn: () => {
      const jours = parseInt(prolongJours, 10);
      if (!prolongTarget || !Number.isFinite(jours) || jours < 1) {
        throw new Error("Nombre de jours invalide");
      }
      return api.prolongerAbonnement(prolongTarget.id, jours);
    },
    onSuccess: (res) => {
      toast.success(`Abonnement prolongé de ${res.abonnement.joursAjoutes} jour(s) — notification envoyée`);
      setProlongOpen(false);
      setProlongTarget(null);
      qc.invalidateQueries({ queryKey: ["admin-abonnements"] });
      qc.invalidateQueries({ queryKey: ["admin-abonnements-stats"] });
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : "Échec prolongation"),
  });

  const openProlong = (a: AdminAbonnement) => {
    setProlongTarget(a);
    setProlongJours("30");
    setProlongOpen(true);
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Crown className="size-5 text-primary" />
          <div>
            <h2 className="text-lg font-semibold">Abonnements</h2>
            <p className="text-sm text-muted-foreground">
              {formatFcfa(SUBSCRIPTION_PRICE)} / {SUBSCRIPTION_DURATION_MONTHS} mois — accès illimité aux épreuves payantes
            </p>
          </div>
        </div>
        <Button className="rounded-xl" onClick={() => setNotifyOpen(true)}>
          <Send className="mr-2 size-4" />
          Notifier les abonnés
        </Button>
      </div>

      {!statsLoading && stats && (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <MiniStat label="Actifs" value={stats.actifs} />
          <MiniStat label="Expirent sous 7 j" value={stats.expirantBientot} />
          <MiniStat label="Expirés" value={stats.expires} />
          <MiniStat label="Revenus (FCFA)" value={stats.revenusFcfa} />
        </div>
      )}

      <DataTableToolbar>
        <Select value={filtre} onValueChange={(v) => setFiltre(v as typeof filtre)}>
          <SelectTrigger className="h-9 w-[160px] rounded-xl">
            <SelectValue placeholder="Statut" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tous</SelectItem>
            <SelectItem value="actif">Actifs</SelectItem>
            <SelectItem value="expire">Expirés</SelectItem>
          </SelectContent>
        </Select>
        <Button variant="outline" size="sm" className="rounded-xl" onClick={() => refetch()}>
          Actualiser
        </Button>
      </DataTableToolbar>

      <DataTableShell>
        <TableHeader>
          <TableRow>
            <TableHead>Utilisateur</TableHead>
            <TableHead>Email</TableHead>
            <TableHead>Début</TableHead>
            <TableHead>Fin</TableHead>
            <TableHead>Montant</TableHead>
            <TableHead>Statut</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {isLoading ? (
            <DataTableEmptyRow colSpan={7} message="Chargement…" />
          ) : pagination.items.length === 0 ? (
            <DataTableEmptyRow colSpan={7} message="Aucun abonnement" />
          ) : (
            pagination.items.map((a: AdminAbonnement) => (
              <TableRow key={a.id}>
                <TableCell className="font-medium">{a.user.nom}</TableCell>
                <TableCell className="text-muted-foreground">{a.user.email}</TableCell>
                <TableCell>{formatDate(a.dateDebut)}</TableCell>
                <TableCell>{formatDate(a.dateFin)}</TableCell>
                <TableCell>{formatFcfa(a.montant)}</TableCell>
                <TableCell>{statutBadge(a.statut)}</TableCell>
                <TableCell className="text-right">
                  <Button
                    variant="outline"
                    size="sm"
                    className="rounded-xl"
                    onClick={() => openProlong(a)}
                  >
                    <CalendarPlus className="mr-1.5 size-4" />
                    Prolonger
                  </Button>
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </DataTableShell>

      <Sheet open={notifyOpen} onOpenChange={setNotifyOpen}>
        <SheetContent className="overflow-y-auto sm:max-w-md">
          <SheetHeader>
            <SheetTitle>Notifier les abonnés actifs</SheetTitle>
            <SheetDescription>
              Message in-app (et push optionnel) envoyé à tous les abonnés dont l&apos;accès est encore valide.
            </SheetDescription>
          </SheetHeader>
          <div className="mt-6 space-y-4">
            <div className="space-y-2">
              <Label htmlFor="notif-titre">Titre</Label>
              <Input
                id="notif-titre"
                value={titre}
                onChange={(e) => setTitre(e.target.value)}
                placeholder="Rappel renouvellement"
                className="rounded-xl"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="notif-msg">Message</Label>
              <Textarea
                id="notif-msg"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                rows={5}
                placeholder="Votre abonnement expire bientôt…"
                className="rounded-xl"
              />
            </div>
            <div className="space-y-2">
              <Label>Type</Label>
              <Select value={notifType} onValueChange={(v) => setNotifType(v as typeof notifType)}>
                <SelectTrigger className="rounded-xl">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="info">In-app uniquement</SelectItem>
                  <SelectItem value="push">Push uniquement</SelectItem>
                  <SelectItem value="all">In-app + push</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Button
              className="w-full rounded-xl"
              disabled={notifyMutation.isPending || !titre.trim() || !message.trim()}
              onClick={() => notifyMutation.mutate()}
            >
              {notifyMutation.isPending ? (
                <Loader2 className="mr-2 size-4 animate-spin" />
              ) : (
                <Send className="mr-2 size-4" />
              )}
              Envoyer
            </Button>
          </div>
        </SheetContent>
      </Sheet>

      <Sheet open={prolongOpen} onOpenChange={setProlongOpen}>
        <SheetContent className="overflow-y-auto sm:max-w-md">
          <SheetHeader>
            <SheetTitle>Prolonger l&apos;abonnement</SheetTitle>
            <SheetDescription>
              {prolongTarget
                ? `${prolongTarget.user.nom} — fin actuelle : ${formatDate(prolongTarget.dateFin)}`
                : "Ajoutez des jours d'accès et notifiez l'utilisateur instantanément."}
            </SheetDescription>
          </SheetHeader>
          <div className="mt-6 space-y-4">
            <div className="space-y-2">
              <Label htmlFor="prolong-jours">Nombre de jours</Label>
              <Input
                id="prolong-jours"
                type="number"
                min={1}
                max={365}
                value={prolongJours}
                onChange={(e) => setProlongJours(e.target.value)}
                className="rounded-xl"
              />
            </div>
            <Button
              className="w-full rounded-xl"
              disabled={prolongMutation.isPending || !prolongTarget}
              onClick={() => prolongMutation.mutate()}
            >
              {prolongMutation.isPending ? (
                <Loader2 className="mr-2 size-4 animate-spin" />
              ) : (
                <CalendarPlus className="mr-2 size-4" />
              )}
              Prolonger et notifier
            </Button>
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
}

function MiniStat({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-xl border bg-card p-3 sm:p-4">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="mt-1 text-xl font-bold tabular-nums">{value.toLocaleString("fr-FR")}</p>
    </div>
  );
}
