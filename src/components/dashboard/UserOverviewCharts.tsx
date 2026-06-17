import { Bar, BarChart, CartesianGrid, Cell, Pie, PieChart, XAxis, YAxis } from "recharts";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  ChartLegend,
  ChartLegendContent,
  type ChartConfig,
} from "@/components/ui/chart";
import { ChartEmptyState } from "@/components/dashboard/ChartEmptyState";
import { DashboardSectionCard } from "@/components/dashboard/DashboardSectionCard";
import { CHART_COLORS, CHART_STATUT, groupTransactionsByDay, hasSeriesData } from "@/components/dashboard/chart-utils";
import {
  chartBarCompactHeight,
  chartHeight,
  chartPieHeight,
  dashboardChartGrid,
  dashboardSectionStack,
  fluxStepCard,
  fluxStepsGrid,
} from "@/lib/dashboard-mobile";
import { EPREUVES_PAR_RECOMPENSE, formatFcfa } from "@/lib/pricing";
import type { ContributorWallet, LibraryItem, SoumissionHistory } from "@/lib/types";
import { ArrowRight, CheckCircle2, Clock, Upload, Wallet } from "lucide-react";

const soumissionsConfig = {
  value: { label: "Soumissions", color: "var(--chart-1)" },
} satisfies ChartConfig;

const walletConfig = {
  credits: { label: "Gains", color: "var(--chart-1)" },
  debits: { label: "Retraits", color: "var(--chart-4)" },
} satisfies ChartConfig;

const matieresConfig = {
  count: { label: "Validées", color: "var(--chart-2)" },
} satisfies ChartConfig;

export function UserOverviewCharts({
  soumissions,
  libraryPaid,
  libraryFree,
  wallet,
  validees,
  enAttente,
  rejetees,
  progressionPalier,
}: {
  soumissions: SoumissionHistory[];
  libraryPaid: LibraryItem[];
  libraryFree: LibraryItem[];
  wallet?: ContributorWallet;
  validees: number;
  enAttente: number;
  rejetees: number;
  progressionPalier: number;
}) {
  const statutData = [
    { name: "Validées", value: validees, fill: CHART_STATUT.validee },
    { name: "En attente", value: enAttente, fill: CHART_STATUT.enAttente },
    { name: "Rejetées", value: rejetees, fill: CHART_STATUT.rejetee },
  ].filter((d) => d.value > 0);

  const libraryData = [
    { name: "Achats", value: libraryPaid.length, fill: CHART_COLORS[1] },
    { name: "Gratuits", value: libraryFree.length, fill: CHART_COLORS[0] },
  ].filter((d) => d.value > 0);

  const txSeries = groupTransactionsByDay(wallet?.transactions ?? []);
  const hasWalletActivity = hasSeriesData(txSeries, ["credits", "debits"]);

  const matiereCounts = soumissions.reduce<Record<string, number>>((acc, s) => {
    if (s.statut === "validee") acc[s.matiere] = (acc[s.matiere] ?? 0) + 1;
    return acc;
  }, {});
  const matieresData = Object.entries(matiereCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([matiere, count]) => ({
      matiere: matiere.length > 10 ? `${matiere.slice(0, 10)}…` : matiere,
      count,
    }));

  const solde = wallet?.solde ?? 0;
  const fluxEmpty =
    soumissions.length === 0 && enAttente === 0 && validees === 0 && solde === 0;

  const fluxSteps = [
    { icon: Upload, label: "Soumises", value: soumissions.length, tone: "text-blue-500" },
    { icon: Clock, label: "En attente", value: enAttente, tone: "text-tg-yellow" },
    { icon: CheckCircle2, label: "Validées", value: validees, tone: "text-primary" },
    { icon: Wallet, label: "Solde", value: formatFcfa(solde), tone: "text-violet-500" },
  ];

  const hasAnyChart =
    !fluxEmpty ||
    statutData.length > 0 ||
    libraryData.length > 0 ||
    hasWalletActivity ||
    matieresData.length > 0;

  if (!hasAnyChart) {
    return (
      <DashboardSectionCard title="Mon activité" subtitle="Graphiques et statistiques">
        <ChartEmptyState message="Aucune activité pour l'instant — soumets une épreuve ou explore les archives" />
      </DashboardSectionCard>
    );
  }

  const palierPct = Math.round((progressionPalier / EPREUVES_PAR_RECOMPENSE) * 100);
  const showProgression = progressionPalier > 0 || validees > 0;

  return (
    <div className={dashboardSectionStack}>
      <DashboardSectionCard title="Mon flux contributeur" subtitle="De la soumission à la récompense">
        {fluxEmpty ? (
          <ChartEmptyState message="Tu n'as pas encore soumis d'épreuve" />
        ) : (
          <>
            <div className={fluxStepsGrid}>
              {fluxSteps.map((step, i) => {
                const Icon = step.icon;
                return (
                  <div key={step.label} className="flex items-center gap-1 sm:flex-1 sm:gap-2">
                    <div className={fluxStepCard}>
                      <Icon className={`mb-1 size-4 sm:mb-2 sm:size-5 ${step.tone}`} />
                      <p className="text-[10px] font-medium leading-tight text-muted-foreground sm:text-xs">{step.label}</p>
                      <p className="mt-0.5 font-display text-base font-bold tabular-nums sm:mt-1 sm:text-lg">{step.value}</p>
                    </div>
                    {i < fluxSteps.length - 1 && (
                      <ArrowRight className="hidden size-5 shrink-0 text-muted-foreground sm:block" />
                    )}
                  </div>
                );
              })}
            </div>
            {showProgression && (
              <div className="mt-5">
                <div className="mb-2 flex justify-between text-sm">
                  <span className="text-muted-foreground">Progression vers la prochaine récompense</span>
                  <span className="font-medium">
                    {progressionPalier} / {EPREUVES_PAR_RECOMPENSE} ({palierPct}%)
                  </span>
                </div>
                <div className="h-4 overflow-hidden rounded-full bg-muted">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-primary to-tg-yellow transition-all duration-500"
                    style={{ width: `${palierPct}%` }}
                  />
                </div>
              </div>
            )}
          </>
        )}
      </DashboardSectionCard>

      <div className={dashboardChartGrid}>
        <DashboardSectionCard title="Mes soumissions" subtitle="Répartition par statut">
          {statutData.length === 0 ? (
            <ChartEmptyState message="Aucune soumission enregistrée" />
          ) : (
            <ChartContainer config={soumissionsConfig} className={chartPieHeight}>
              <PieChart>
                <ChartTooltip content={<ChartTooltipContent hideLabel />} />
                <Pie data={statutData} dataKey="value" nameKey="name" innerRadius={40} outerRadius={65} paddingAngle={3}>
                  {statutData.map((entry) => (
                    <Cell key={entry.name} fill={entry.fill} />
                  ))}
                </Pie>
                <ChartLegend content={<ChartLegendContent nameKey="name" />} />
              </PieChart>
            </ChartContainer>
          )}
        </DashboardSectionCard>

        <DashboardSectionCard title="Ma bibliothèque" subtitle="Achats vs gratuits">
          {libraryData.length === 0 ? (
            <ChartEmptyState message="Aucun contenu en bibliothèque" />
          ) : (
            <ChartContainer config={soumissionsConfig} className={chartPieHeight}>
              <PieChart>
                <ChartTooltip content={<ChartTooltipContent hideLabel />} />
                <Pie data={libraryData} dataKey="value" nameKey="name" innerRadius={40} outerRadius={65} paddingAngle={3}>
                  {libraryData.map((entry) => (
                    <Cell key={entry.name} fill={entry.fill} />
                  ))}
                </Pie>
                <ChartLegend content={<ChartLegendContent nameKey="name" />} />
              </PieChart>
            </ChartContainer>
          )}
        </DashboardSectionCard>
      </div>

      <div className={dashboardChartGrid}>
        <DashboardSectionCard title="Activité portefeuille" subtitle="Gains et retraits — 14 jours">
          {!hasWalletActivity ? (
            <ChartEmptyState message="Aucune transaction sur les 14 derniers jours" />
          ) : (
            <ChartContainer config={walletConfig} className={`${chartHeight} w-full`}>
              <BarChart data={txSeries} margin={{ left: -8, right: 4, top: 4, bottom: 0 }}>
                <CartesianGrid vertical={false} strokeDasharray="3 3" />
                <XAxis dataKey="label" tickLine={false} axisLine={false} fontSize={9} interval="preserveStartEnd" />
                <YAxis tickLine={false} axisLine={false} width={32} fontSize={9} />
                <ChartTooltip content={<ChartTooltipContent />} />
                <ChartLegend content={<ChartLegendContent />} />
                <Bar dataKey="credits" fill="var(--color-credits)" radius={[4, 4, 0, 0]} stackId="a" />
                <Bar dataKey="debits" fill="var(--color-debits)" radius={[4, 4, 0, 0]} stackId="a" />
              </BarChart>
            </ChartContainer>
          )}
        </DashboardSectionCard>

        <DashboardSectionCard title="Matières validées" subtitle="Tes contributions par matière">
          {matieresData.length === 0 ? (
            <ChartEmptyState message="Aucune épreuve validée" />
          ) : (
            <ChartContainer config={matieresConfig} className={`${chartBarCompactHeight} w-full`}>
              <BarChart data={matieresData} layout="vertical" margin={{ left: 0, right: 4, top: 4, bottom: 0 }}>
                <CartesianGrid horizontal={false} strokeDasharray="3 3" />
                <XAxis type="number" allowDecimals={false} tickLine={false} axisLine={false} fontSize={9} />
                <YAxis type="category" dataKey="matiere" tickLine={false} axisLine={false} width={56} fontSize={9} />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Bar dataKey="count" fill="var(--color-count)" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ChartContainer>
          )}
        </DashboardSectionCard>
      </div>
    </div>
  );
}
