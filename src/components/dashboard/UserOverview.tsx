import { Link } from "@tanstack/react-router";
import { BookOpen, CheckCircle2, Clock, Library, Upload, Wallet } from "lucide-react";
import { UserOverviewCharts } from "@/components/dashboard/UserOverviewCharts";
import { DashboardProgressRow, DashboardSectionCard, DashboardTodoItem } from "@/components/dashboard/DashboardSectionCard";
import { DashboardStatCard } from "@/components/dashboard/DashboardStatCard";
import { Button } from "@/components/ui/button";
import { EPREUVES_PAR_RECOMPENSE, formatFcfa, MONTANT_RECOMPENSE } from "@/lib/pricing";
import type { ContributorWallet, LibraryItem, SoumissionHistory } from "@/lib/types";
import {
  dashboardSectionStack,
  dashboardActionsShortcutsGrid,
  dashboardShortcutGridWide,
  dashboardStatGrid,
} from "@/lib/dashboard-mobile";

export function UserOverview({
  soumissions,
  libraryPaid,
  libraryFree,
  wallet,
  enAttente,
  validees,
  rejetees,
  progressionPalier,
}: {
  soumissions: SoumissionHistory[];
  libraryPaid: LibraryItem[];
  libraryFree: LibraryItem[];
  wallet?: ContributorWallet;
  enAttente: number;
  validees: number;
  rejetees: number;
  progressionPalier: number;
}) {
  const soumissionsCount = soumissions.length;
  const libraryCount = libraryPaid.length + libraryFree.length;
  const solde = wallet?.solde ?? 0;
  const pct = Math.round((progressionPalier / EPREUVES_PAR_RECOMPENSE) * 100);

  return (
    <div className={dashboardSectionStack}>
      {/* 1. Stats */}
      <div className={dashboardStatGrid}>
        <DashboardStatCard label="Soumissions" value={soumissionsCount} icon={Upload} tone="blue" />
        <DashboardStatCard label="Validées" value={validees} icon={CheckCircle2} tone="green" />
        <DashboardStatCard label="En attente" value={enAttente} icon={Clock} tone="yellow" />
        <DashboardStatCard label="Bibliothèque" value={libraryCount} icon={Library} tone="purple" />
      </div>

      {/* 2. Portefeuille */}
      <DashboardSectionCard
        title="Portefeuille contributeur"
        subtitle={`${EPREUVES_PAR_RECOMPENSE} validées = ${formatFcfa(MONTANT_RECOMPENSE)}`}
      >
        <div className="flex items-center gap-3 sm:gap-4">
          <div className="grid size-11 shrink-0 place-items-center rounded-xl bg-primary/12 sm:size-14 sm:rounded-2xl">
            <Wallet className="size-5 text-primary sm:size-7" />
          </div>
          <div className="min-w-0">
            <p className="font-display text-2xl font-bold sm:text-3xl">{formatFcfa(solde)}</p>
            <p className="text-xs text-muted-foreground sm:text-sm">Solde disponible</p>
          </div>
        </div>
        <div className="mt-4 space-y-2 sm:mt-5">
          <div className="flex justify-between text-xs sm:text-sm">
            <span className="text-muted-foreground">Progression du palier</span>
            <span className="font-medium">
              {progressionPalier} / {EPREUVES_PAR_RECOMPENSE}
            </span>
          </div>
          <DashboardProgressRow
            label="Épreuves validées ce palier"
            value={progressionPalier}
            total={EPREUVES_PAR_RECOMPENSE}
          />
          <p className="text-xs text-muted-foreground">{pct}% vers la prochaine récompense</p>
        </div>
        <Button asChild className="mt-4 rounded-xl hover:text-primary-foreground">
          <Link to="/account/portefeuille">Gérer mon portefeuille</Link>
        </Button>
      </DashboardSectionCard>

      {/* 3. Actions & raccourcis */}
      <div className={dashboardActionsShortcutsGrid}>
        <DashboardSectionCard
          title="Mes actions"
          subtitle="À suivre en priorité"
          className="lg:col-span-1"
        >
          <div className="space-y-2 sm:space-y-3">
            <DashboardTodoItem label="Soumissions en attente" count={enAttente} tone="yellow" />
            <DashboardTodoItem label="Épreuves validées" count={validees} tone="green" />
            <DashboardTodoItem label="Contenus en bibliothèque" count={libraryCount} tone="purple" />
          </div>
        </DashboardSectionCard>

        <DashboardSectionCard
          title="Raccourcis"
          subtitle="Actions rapides"
          className="lg:col-span-3"
        >
          <div className={dashboardShortcutGridWide}>
            <ShortcutLink icon={Upload} label="Soumettre" hint="Nouvelle épreuve" to="/submit" />
            <ShortcutLink icon={BookOpen} label="Archives" hint="Explorer les docs" to="/docs" />
            <ShortcutLink icon={Library} label="Bibliothèque" hint={`${libraryCount} contenu(s)`} to="/account/bibliotheque" />
            <ShortcutLink icon={Wallet} label="Portefeuille" hint={formatFcfa(solde)} to="/account/portefeuille" />
          </div>
        </DashboardSectionCard>
      </div>

      {/* 4. Graphiques */}
      <UserOverviewCharts
        soumissions={soumissions}
        libraryPaid={libraryPaid}
        libraryFree={libraryFree}
        wallet={wallet}
        validees={validees}
        enAttente={enAttente}
        rejetees={rejetees}
        progressionPalier={progressionPalier}
      />
    </div>
  );
}

function ShortcutLink({
  icon: Icon,
  label,
  hint,
  to,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  hint: string;
  to: string;
}) {
  return (
    <Link
      to={to}
      className="flex min-w-0 items-start gap-2 rounded-xl border border-border bg-muted/20 p-2.5 transition hover:border-primary/40 hover:bg-primary/5 sm:gap-3 sm:p-4"
    >
      <div className="grid size-8 shrink-0 place-items-center rounded-lg bg-primary/10 text-primary sm:size-9">
        <Icon className="size-3.5 sm:size-4" />
      </div>
      <div className="min-w-0 flex-1">
        <p className="truncate text-xs font-semibold sm:text-sm">{label}</p>
        <p className="truncate text-[10px] leading-tight text-muted-foreground sm:text-xs">{hint}</p>
      </div>
    </Link>
  );
}
