import { Link } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { Wallet, Upload, ArrowRight, Smartphone, Loader2, Banknote } from "lucide-react";
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
import { Progress } from "@/components/ui/progress";
import {
  Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { api } from "@/lib/api";
import { formatFcfa, EPREUVES_PAR_RECOMPENSE, MONTANT_RECOMPENSE, MIN_RETRAIT } from "@/lib/pricing";
import { dashboardSectionStack } from "@/lib/dashboard-mobile";

export function ContributorWalletPanel({ onRefresh }: { onRefresh?: () => void }) {
  const qc = useQueryClient();
  const [retraitOpen, setRetraitOpen] = useState(false);
  const [methode, setMethode] = useState<"flooz" | "tmoney">("flooz");
  const [telephone, setTelephone] = useState("");
  const [loading, setLoading] = useState(false);

  const { data: wallet, refetch } = useQuery({
    queryKey: ["wallet"],
    queryFn: () => api.getWallet(),
  });

  const progressPct = wallet
    ? Math.round((wallet.progressionPalier / wallet.epreuvesParRecompense) * 100)
    : 0;
  const txPagination = usePagination(wallet?.transactions);
  const retraitsPagination = usePagination(wallet?.retraits);

  function refresh() {
    refetch();
    onRefresh?.();
  }

  async function handleRetrait() {
    if (!wallet) return;
    setLoading(true);
    try {
      const res = await api.demanderRetrait(wallet.solde, methode, telephone);
      toast.success(res.message);
      setRetraitOpen(false);
      refresh();
      qc.invalidateQueries({ queryKey: ["admin-stats"] });
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Échec");
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3 sm:gap-4">
        <div className="rounded-xl border-2 border-primary/20 bg-primary/5 p-4 sm:col-span-1 sm:rounded-2xl sm:p-6">
          <Wallet className="size-4 text-primary sm:size-5" />
          <p className="mt-1.5 text-[10px] text-muted-foreground sm:mt-2 sm:text-xs">Solde disponible</p>
          <p className="font-display text-2xl font-bold sm:text-3xl">{formatFcfa(wallet?.solde ?? 0)}</p>
          <Button
            className="mt-4 h-10 w-full rounded-xl sm:mt-5 sm:h-11"
            disabled={!wallet?.peutRetirer}
            onClick={() => setRetraitOpen(true)}
          >
            <Banknote className="size-4" />
            Demander un retrait
          </Button>
          {!wallet?.peutRetirer && (
            <p className="mt-2 text-center text-xs text-muted-foreground">
              Min. {formatFcfa(MIN_RETRAIT)} pour retirer
            </p>
          )}
        </div>

        <div className="rounded-xl border border-border bg-card p-4 sm:col-span-2 sm:rounded-2xl sm:p-6">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <p className="text-xs font-medium sm:text-sm">Progression vers la prochaine récompense</p>
              <p className="text-[10px] text-muted-foreground sm:text-xs">
                {wallet?.progressionPalier ?? 0} / {EPREUVES_PAR_RECOMPENSE} épreuves validées
              </p>
            </div>
            <Badge variant="secondary" className="shrink-0 text-[10px] sm:text-xs">{formatFcfa(MONTANT_RECOMPENSE)}</Badge>
          </div>
          <Progress value={progressPct} className="mt-3 h-2 sm:mt-4 sm:h-3" />
          <p className="mt-1.5 text-[10px] text-muted-foreground sm:mt-2 sm:text-xs">
            {wallet?.epreuvesValidees ?? 0} épreuves validées au total · {wallet?.paliersVerses ?? 0} palier(s) déjà versé(s)
          </p>
        </div>
      </div>

      <div className="mt-4 flex flex-wrap gap-2 sm:mt-6 sm:gap-3">
        <Button
          asChild
          className="tea-water-fill-none rounded-full hover:!text-primary-foreground"
        >
          <Link to="/submit">
            <Upload className="size-4" /> Soumettre une épreuve
          </Link>
        </Button>
        <Button
          asChild
          variant="outline"
          className="tea-water-fill-none rounded-full border-primary/45 text-foreground hover:border-primary/55 hover:bg-primary/10 hover:!text-foreground dark:border-primary/50 dark:text-white dark:hover:!text-white"
        >
          <Link to="/account/soumissions">
            Mes soumissions <ArrowRight className="size-4" />
          </Link>
        </Button>
        <Button
          asChild
          variant="outline"
          className="tea-water-fill-none rounded-full border-border/60 text-foreground hover:border-border hover:bg-muted/40 hover:!text-foreground dark:border-white/20 dark:text-white dark:hover:border-white/35 dark:hover:bg-white/5 dark:hover:!text-white"
        >
          <Link to="/account">Vue d&apos;ensemble</Link>
        </Button>
      </div>

      <div className={`mt-6 ${dashboardSectionStack} sm:mt-10`}>
        <div>
          <DataTableToolbar title="Historique des transactions" count={wallet?.transactions.length ?? 0} />
          <DataTableShell
            pagination={
              txPagination.total > 0
                ? { ...txPagination, onPageChange: txPagination.setPage }
                : undefined
            }
          >
            <TableHeader>
              <TableRow>
                <TableHead>Description</TableHead>
                <TableHead>Date</TableHead>
                <TableHead className="text-right">Montant</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {!wallet?.transactions.length && (
                <DataTableEmptyRow colSpan={3} message="Aucune transaction pour l'instant." />
              )}
              {txPagination.items.map((t) => (
                <TableRow key={t.id}>
                  <TableCell className="font-medium">{t.description}</TableCell>
                  <TableCell className="text-muted-foreground">
                    {new Date(t.creeLe).toLocaleDateString("fr-FR")}
                  </TableCell>
                  <TableCell className={`text-right font-semibold tabular-nums ${t.type === "credit" ? "text-green-600" : "text-destructive"}`}>
                    {t.type === "credit" ? "+" : "-"}{formatFcfa(t.montant)}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </DataTableShell>
        </div>

        <div>
          <DataTableToolbar
            title="Mes retraits"
            count={wallet?.retraits?.length ?? 0}
            onAdd={() => setRetraitOpen(true)}
            addLabel="Demander un retrait"
          />
          <DataTableShell
            pagination={
              retraitsPagination.total > 0
                ? { ...retraitsPagination, onPageChange: retraitsPagination.setPage }
                : undefined
            }
          >
            <TableHeader>
              <TableRow>
                <TableHead>Montant</TableHead>
                <TableHead>Méthode</TableHead>
                <TableHead>Téléphone</TableHead>
                <TableHead>Statut</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {!wallet?.retraits?.length && (
                <DataTableEmptyRow colSpan={4} message="Aucun retrait demandé." />
              )}
              {retraitsPagination.items.map((r) => (
                <TableRow key={r.id}>
                  <TableCell className="font-semibold">{formatFcfa(r.montant)}</TableCell>
                  <TableCell>{r.methode === "flooz" ? "Flooz" : "T-Money"}</TableCell>
                  <TableCell className="text-muted-foreground">{r.telephone}</TableCell>
                  <TableCell>
                    <Badge variant={r.statut === "paye" ? "default" : r.statut === "rejete" ? "destructive" : "secondary"}>
                      {r.statut === "en_attente" ? "En attente" : r.statut === "paye" ? "Payé" : "Rejeté"}
                    </Badge>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </DataTableShell>
        </div>
      </div>

      <Dialog open={retraitOpen} onOpenChange={setRetraitOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Demander un retrait</DialogTitle>
            <DialogDescription>
              Retrait de {formatFcfa(wallet?.solde ?? 0)} (minimum {formatFcfa(MIN_RETRAIT)}).
              Un admin traitera ta demande sous 48h.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              {(["flooz", "tmoney"] as const).map((m) => (
                <button
                  key={m}
                  type="button"
                  onClick={() => setMethode(m)}
                  className={`rounded-lg border p-3 text-sm font-medium ${methode === m ? "border-primary bg-primary/5" : ""}`}
                >
                  {m === "flooz" ? "Flooz (Moov)" : "T-Money"}
                </button>
              ))}
            </div>
            <div>
              <Label>Numéro Mobile Money</Label>
              <div className="relative mt-1">
                <Smartphone className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  className="pl-9"
                  placeholder="90 XX XX XX"
                  value={telephone}
                  onChange={(e) => setTelephone(e.target.value)}
                />
              </div>
            </div>
            <Button className="w-full" onClick={handleRetrait} disabled={loading}>
              {loading && <Loader2 className="size-4 animate-spin" />}
              Confirmer le retrait de {formatFcfa(wallet?.solde ?? 0)}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
