import { useNavigate } from "@tanstack/react-router";
import {
  BookOpen,
  Inbox,
  Users,
  BarChart3,
  Banknote,
  Handshake,
  School,
  FolderTree,
  Wallet,
  Building2,
  Upload,
} from "lucide-react";
import { AdminOverviewCharts } from "@/components/dashboard/AdminOverviewCharts";
import { DashboardSectionCard, DashboardTodoItem } from "@/components/dashboard/DashboardSectionCard";
import { DashboardStatCard } from "@/components/dashboard/DashboardStatCard";
import { Button } from "@/components/ui/button";
import type { AdminSection } from "@/lib/dashboard-nav";
import { formatFcfa } from "@/lib/pricing";
import type { AdminStats } from "@/lib/types";
import {
  dashboardActivityGrid,
  dashboardAdminStatGrid,
  dashboardChartGrid,
  dashboardChartGrid3,
  dashboardSectionStack,
  dashboardShortcutGrid,
} from "@/lib/dashboard-mobile";

export function AdminOverview({ stats, isAdmin }: { stats: AdminStats; isAdmin: boolean }) {
  const navigate = useNavigate();
  const go = (section: AdminSection) => navigate({ to: "/admin", search: { section } });

  const pendingPartners =
    (stats.demandesSoutienNouvelles ?? 0) + (stats.demandesEtablissementNouvelles ?? 0);

  return (
    <div className={dashboardSectionStack}>
      <div className={dashboardAdminStatGrid}>
        <DashboardStatCard label="Épreuves validées" value={stats.epreuvesValidees ?? 0} icon={BookOpen} tone="green" />
        <DashboardStatCard label="En attente" value={stats.soumissionsEnAttente ?? 0} icon={Inbox} tone="yellow" />
        <DashboardStatCard label="Utilisateurs" value={stats.utilisateurs ?? 0} icon={Users} tone="blue" />
        <DashboardStatCard label="Retraits en attente" value={stats.retraitsEnAttente ?? 0} icon={Banknote} tone="red" />
        <DashboardStatCard
          label={isAdmin ? "Revenus" : "Téléchargements"}
          value={isAdmin ? formatFcfa(stats.revenusFcfa ?? 0) : (stats.telechargements ?? 0)}
          icon={BarChart3}
          tone="purple"
        />
      </div>

      <div className={`${dashboardChartGrid3} lg:grid-cols-3`}>
        {isAdmin && (
          <DashboardSectionCard
            title="Portefeuille plateforme"
            subtitle="Flux financiers contributeurs & retraits"
            className="lg:col-span-1"
          >
            <div className="flex items-center gap-3 sm:gap-4">
              <div className="grid size-11 shrink-0 place-items-center rounded-xl bg-primary/12 sm:size-14 sm:rounded-2xl">
                <Wallet className="size-5 text-primary sm:size-7" />
              </div>
              <div className="min-w-0">
                <p className="font-display text-xl font-bold sm:text-2xl">
                  {formatFcfa(stats.portefeuilleSoldeTotal ?? 0)}
                </p>
                <p className="text-xs text-muted-foreground sm:text-sm">Soldes contributeurs (total)</p>
              </div>
            </div>
            <div className="mt-4 space-y-1.5 text-xs sm:mt-5 sm:space-y-2 sm:text-sm">
              <div className="flex justify-between rounded-lg bg-muted/40 px-3 py-2">
                <span className="text-muted-foreground">Revenus encaissés</span>
                <span className="font-semibold">{formatFcfa(stats.revenusFcfa ?? 0)}</span>
              </div>
              <div className="flex justify-between rounded-lg bg-muted/40 px-3 py-2">
                <span className="text-muted-foreground">Retraits en attente</span>
                <span className="font-semibold text-amber-700 dark:text-amber-400">
                  {formatFcfa(stats.retraitsMontantEnAttente ?? 0)}
                  <span className="ml-1 text-xs font-normal text-muted-foreground">
                    ({stats.retraitsEnAttente ?? 0})
                  </span>
                </span>
              </div>
              <div className="flex justify-between rounded-lg bg-muted/40 px-3 py-2">
                <span className="text-muted-foreground">Retraits payés</span>
                <span className="font-semibold">{formatFcfa(stats.retraitsPayesMontant ?? 0)}</span>
              </div>
            </div>
            <Button variant="outline" className="mt-4 w-full rounded-xl" onClick={() => go("retraits")}>
              Gérer les retraits
            </Button>
          </DashboardSectionCard>
        )}

        <DashboardSectionCard
          title="Raccourcis"
          subtitle="Accès rapide aux sections clés"
          className={isAdmin ? "lg:col-span-2" : "lg:col-span-3"}
        >
          <div className={dashboardShortcutGrid}>
            <ShortcutButton
              icon={Inbox}
              label="Soumissions"
              hint={`${stats.soumissionsEnAttente ?? 0} en attente`}
              onClick={() => go("soumissions")}
            />
            <ShortcutButton
              icon={BookOpen}
              label="Épreuves"
              hint={`${stats.epreuvesValidees ?? 0} validées`}
              onClick={() => go("epreuves")}
            />
            <ShortcutButton
              icon={FolderTree}
              label="Archives"
              hint={`${stats.epreuvesArchivees ?? 0} archivées`}
              onClick={() => go("archives")}
            />
            <ShortcutButton
              icon={Banknote}
              label="Retraits"
              hint={`${stats.retraitsEnAttente ?? 0} à traiter`}
              onClick={() => go("retraits")}
            />
            <ShortcutButton
              icon={BarChart3}
              label="Statistiques"
              hint={`${stats.telechargements ?? 0} téléchargements`}
              onClick={() => go("stats")}
            />
            {isAdmin && (
              <ShortcutButton
                icon={Users}
                label="Utilisateurs"
                hint={`${stats.utilisateurs ?? 0} comptes`}
                onClick={() => go("users")}
              />
            )}
            <ShortcutButton
              icon={Handshake}
              label="Demandes soutien"
              hint={`${stats.demandesSoutienNouvelles ?? 0} nouvelles`}
              onClick={() => go("soutien")}
            />
            <ShortcutButton
              icon={Building2}
              label="Partenaires"
              hint="Gérer les partenaires"
              onClick={() => go("partenaires")}
            />
            <ShortcutButton
              icon={School}
              label="Établissements"
              hint={`${stats.demandesEtablissementNouvelles ?? 0} en attente`}
              onClick={() => go("etablissements")}
            />
          </div>
        </DashboardSectionCard>
      </div>

      <AdminOverviewCharts stats={stats} isAdmin={isAdmin} />

      <div className={dashboardChartGrid}>
        <DashboardSectionCard title="À traiter" subtitle="Actions prioritaires de modération">
          <div className="space-y-3">
            <DashboardTodoItem
              label="Soumissions en attente"
              count={stats.soumissionsEnAttente}
              tone="yellow"
              onClick={() => go("soumissions")}
            />
            <DashboardTodoItem
              label="Retraits en attente"
              count={stats.retraitsEnAttente}
              tone="red"
              onClick={() => go("retraits")}
            />
            <DashboardTodoItem
              label="Demandes partenariat"
              count={pendingPartners}
              tone="purple"
              onClick={() => go("soutien")}
            />
          </div>
        </DashboardSectionCard>

        <DashboardSectionCard title="Activité récente">
          <div className={dashboardActivityGrid}>
            <div className="rounded-xl border border-border bg-muted/30 p-3 sm:p-4">
              <Handshake className="size-4 text-primary sm:size-5" />
              <p className="mt-1.5 font-display text-lg font-bold sm:mt-2 sm:text-2xl">{stats.demandesSoutienNouvelles ?? 0}</p>
              <p className="text-[10px] leading-tight text-muted-foreground sm:text-sm">Demandes soutien nouvelles</p>
            </div>
            <div className="rounded-xl border border-border bg-muted/30 p-3 sm:p-4">
              <School className="size-4 text-primary sm:size-5" />
              <p className="mt-1.5 font-display text-lg font-bold sm:mt-2 sm:text-2xl">{stats.demandesEtablissementNouvelles ?? 0}</p>
              <p className="text-[10px] leading-tight text-muted-foreground sm:text-sm">Établissements en attente</p>
            </div>
            <div className="rounded-xl border border-border bg-muted/30 p-3 sm:col-span-2 sm:p-4">
              <Upload className="size-4 text-primary sm:size-5" />
              <p className="mt-1.5 font-display text-lg font-bold sm:mt-2 sm:text-2xl">{stats.recentDownloads ?? 0}</p>
              <p className="text-[10px] leading-tight text-muted-foreground sm:text-sm">Téléchargements sur les 7 derniers jours</p>
            </div>
            {isAdmin && (
              <div className="rounded-xl border border-border bg-muted/30 p-3 sm:col-span-2 sm:p-4">
                <Wallet className="size-4 text-primary sm:size-5" />
                <p className="mt-1.5 font-display text-lg font-bold sm:mt-2 sm:text-2xl">{formatFcfa(stats.revenusExamensFcfa ?? 0)}</p>
                <p className="text-[10px] leading-tight text-muted-foreground sm:text-sm">
                  Revenus examens nationaux · {stats.paiementsConfirmes ?? 0} paiement(s) confirmé(s)
                </p>
              </div>
            )}
          </div>
        </DashboardSectionCard>
      </div>
    </div>
  );
}

function ShortcutButton({
  icon: Icon,
  label,
  hint,
  onClick,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  hint: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex min-w-0 items-start gap-2 rounded-xl border border-border bg-muted/20 p-2.5 text-left transition hover:border-primary/40 hover:bg-primary/5 sm:gap-3 sm:p-4"
    >
      <div className="grid size-8 shrink-0 place-items-center rounded-lg bg-primary/10 text-primary sm:size-9">
        <Icon className="size-3.5 sm:size-4" />
      </div>
      <div className="min-w-0 flex-1">
        <p className="truncate text-xs font-semibold sm:text-sm">{label}</p>
        <p className="truncate text-[10px] leading-tight text-muted-foreground sm:text-xs">{hint}</p>
      </div>
    </button>
  );
}
