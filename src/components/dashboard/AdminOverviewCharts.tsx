import { Bar, BarChart, CartesianGrid, Cell, Line, LineChart, Pie, PieChart, XAxis, YAxis } from "recharts";
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
import { CHART_COLORS, TYPE_LABELS, fillDays, hasSeriesData } from "@/components/dashboard/chart-utils";
import { formatFcfa } from "@/lib/pricing";
import type { AdminStats } from "@/lib/types";
import {
  chartBarCompactHeight,
  chartHeight,
  chartPieHeight,
  dashboardChartGrid,
  dashboardChartGrid3,
  dashboardSectionStack,
  fluxStepCard,
  fluxStepsGrid,
} from "@/lib/dashboard-mobile";
import { ArrowRight } from "lucide-react";

const downloadsConfig = {
  count: { label: "Téléchargements", color: "var(--chart-1)" },
} satisfies ChartConfig;

const paymentsConfig = {
  count: { label: "Paiements", color: "var(--chart-2)" },
  revenus: { label: "Revenus (FCFA)", color: "var(--chart-3)" },
} satisfies ChartConfig;

const matieresConfig = {
  count: { label: "Épreuves", color: "var(--chart-1)" },
} satisfies ChartConfig;

function adminFluxEmpty(stats: AdminStats, isAdmin: boolean) {
  return (
    stats.soumissionsEnAttente === 0 &&
    stats.epreuvesValidees === 0 &&
    stats.telechargements === 0 &&
    (!isAdmin || stats.revenusFcfa === 0)
  );
}

export function AdminOverviewCharts({ stats, isAdmin }: { stats: AdminStats; isAdmin: boolean }) {
  const downloadsSeries = fillDays(stats.downloadsByDay ?? []);
  const paymentsSeries = fillDays(
    (stats.paymentsByDay ?? []).map((p) => ({ jour: p.jour, count: p.count, revenus: p.revenus })),
  );
  const hasDownloads = hasSeriesData(downloadsSeries, ["count"]);
  const hasPayments = hasSeriesData(paymentsSeries, ["count", "revenus"]);

  const typeData = (stats.parType ?? [])
    .filter((t) => t.count > 0)
    .map((t, i) => ({
      name: TYPE_LABELS[t.type] ?? t.type,
      value: t.count,
      fill: CHART_COLORS[i % CHART_COLORS.length],
    }));
  const matieresData = (stats.topMatieres ?? [])
    .filter((m) => m.count > 0)
    .slice(0, 6)
    .map((m) => ({
      matiere: m.matiere.length > 12 ? `${m.matiere.slice(0, 12)}…` : m.matiere,
      count: m.count,
    }));
  const methodData = (stats.parMethode ?? [])
    .filter((m) => m.revenus > 0 || m.count > 0)
    .map((m) => ({
      methode: m.methode === "flooz" ? "Flooz" : "T-Money",
      revenus: m.revenus,
      count: m.count,
    }));
  const examenData = (stats.parExamen ?? []).filter((e) => e.count > 0);

  const fluxSteps = [
    { label: "Soumissions", value: stats.soumissionsEnAttente ?? 0, color: "bg-tg-yellow" },
    { label: "Validées", value: stats.epreuvesValidees ?? 0, color: "bg-primary" },
    { label: "Téléchargements", value: stats.telechargements ?? 0, color: "bg-blue-500" },
    ...(isAdmin
      ? [{ label: "Revenus", value: formatFcfa(stats.revenusFcfa ?? 0), color: "bg-violet-500" }]
      : []),
  ];
  const fluxEmpty = adminFluxEmpty(stats, isAdmin);

  return (
    <div className={dashboardSectionStack}>
      <DashboardSectionCard title="Flux de la plateforme" subtitle="Du dépôt à l'utilisation">
        {fluxEmpty ? (
          <ChartEmptyState message="Aucune activité enregistrée sur la plateforme" />
        ) : (
          <div className={fluxStepsGrid}>
            {fluxSteps.map((step, i) => (
              <div key={step.label} className="flex items-center gap-1 sm:flex-1 sm:gap-2">
                <div className={fluxStepCard}>
                  <div className={`mb-1 size-2.5 rounded-full sm:mb-2 sm:size-3 ${step.color}`} />
                  <p className="text-[10px] font-medium leading-tight text-muted-foreground sm:text-xs">{step.label}</p>
                  <p className="mt-0.5 font-display text-base font-bold tabular-nums sm:mt-1 sm:text-lg">{step.value}</p>
                </div>
                {i < fluxSteps.length - 1 && (
                  <ArrowRight className="hidden size-5 shrink-0 text-muted-foreground sm:block" />
                )}
              </div>
            ))}
          </div>
        )}
      </DashboardSectionCard>

      <div className={dashboardChartGrid}>
        <DashboardSectionCard title="Téléchargements" subtitle="14 derniers jours">
          {!hasDownloads ? (
            <ChartEmptyState message="Aucun téléchargement sur les 14 derniers jours" />
          ) : (
            <ChartContainer config={downloadsConfig} className={`${chartHeight} w-full`}>
              <BarChart data={downloadsSeries} margin={{ left: -8, right: 4, top: 4, bottom: 0 }}>
                <CartesianGrid vertical={false} strokeDasharray="3 3" />
                <XAxis dataKey="label" tickLine={false} axisLine={false} fontSize={9} interval="preserveStartEnd" />
                <YAxis allowDecimals={false} tickLine={false} axisLine={false} width={28} fontSize={9} />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Bar dataKey="count" fill="var(--color-count)" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ChartContainer>
          )}
        </DashboardSectionCard>

        <DashboardSectionCard
          title={isAdmin ? "Paiements & revenus" : "Activité paiements"}
          subtitle="14 derniers jours"
        >
          {!hasPayments ? (
            <ChartEmptyState message="Aucun paiement sur les 14 derniers jours" />
          ) : (
            <ChartContainer config={paymentsConfig} className={`${chartHeight} w-full`}>
              <LineChart data={paymentsSeries} margin={{ left: -8, right: 4, top: 4, bottom: 0 }}>
                <CartesianGrid vertical={false} strokeDasharray="3 3" />
                <XAxis dataKey="label" tickLine={false} axisLine={false} fontSize={9} interval="preserveStartEnd" />
                <YAxis yAxisId="left" allowDecimals={false} tickLine={false} axisLine={false} width={28} fontSize={9} />
                {isAdmin && (
                  <YAxis yAxisId="right" orientation="right" tickLine={false} axisLine={false} width={36} fontSize={9} />
                )}
                <ChartTooltip content={<ChartTooltipContent />} />
                <ChartLegend content={<ChartLegendContent />} />
                <Line
                  yAxisId="left"
                  type="monotone"
                  dataKey="count"
                  stroke="var(--color-count)"
                  strokeWidth={2}
                  dot={{ r: 3 }}
                  activeDot={{ r: 5 }}
                />
                {isAdmin && (
                  <Line
                    yAxisId="right"
                    type="monotone"
                    dataKey="revenus"
                    stroke="var(--color-revenus)"
                    strokeWidth={2}
                    dot={{ r: 3 }}
                    activeDot={{ r: 5 }}
                  />
                )}
              </LineChart>
            </ChartContainer>
          )}
        </DashboardSectionCard>
      </div>

      <div className={dashboardChartGrid3}>
        <DashboardSectionCard title="Répartition par type" subtitle="Diagramme circulaire">
          {typeData.length === 0 ? (
            <ChartEmptyState message="Aucune épreuve validée par type" />
          ) : (
            <ChartContainer
              config={{ value: { label: "Épreuves", color: "var(--chart-1)" } }}
              className={chartPieHeight}
            >
              <PieChart>
                <ChartTooltip content={<ChartTooltipContent hideLabel />} />
                <Pie data={typeData} dataKey="value" nameKey="name" innerRadius={40} outerRadius={65} paddingAngle={3}>
                  {typeData.map((entry, i) => (
                    <Cell key={entry.name} fill={entry.fill ?? CHART_COLORS[i % CHART_COLORS.length]} />
                  ))}
                </Pie>
                <ChartLegend content={<ChartLegendContent nameKey="name" />} />
              </PieChart>
            </ChartContainer>
          )}
        </DashboardSectionCard>

        <DashboardSectionCard title="Top matières" subtitle="Diagramme en barres">
          {matieresData.length === 0 ? (
            <ChartEmptyState message="Aucune matière avec des épreuves" />
          ) : (
            <ChartContainer config={matieresConfig} className={`${chartBarCompactHeight} w-full`}>
              <BarChart data={matieresData} layout="vertical" margin={{ left: 0, right: 4, top: 4, bottom: 0 }}>
                <CartesianGrid horizontal={false} strokeDasharray="3 3" />
                <XAxis type="number" tickLine={false} axisLine={false} fontSize={9} allowDecimals={false} />
                <YAxis type="category" dataKey="matiere" tickLine={false} axisLine={false} width={56} fontSize={9} />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Bar dataKey="count" fill="var(--color-count)" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ChartContainer>
          )}
        </DashboardSectionCard>

        <DashboardSectionCard title="Mobile Money" subtitle="Répartition des paiements">
          {methodData.length === 0 ? (
            <ChartEmptyState message="Aucun paiement Mobile Money enregistré" />
          ) : (
            <ChartContainer
              config={{ revenus: { label: "Revenus", color: "var(--chart-2)" } }}
              className={`${chartHeight} w-full`}
            >
              <BarChart data={methodData} margin={{ left: -8, right: 4, top: 4, bottom: 0 }}>
                <CartesianGrid vertical={false} strokeDasharray="3 3" />
                <XAxis dataKey="methode" tickLine={false} axisLine={false} fontSize={9} />
                <YAxis tickLine={false} axisLine={false} width={36} fontSize={9} />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Bar dataKey="revenus" fill="var(--chart-2)" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ChartContainer>
          )}
        </DashboardSectionCard>
      </div>

      {examenData.length > 0 && (
        <DashboardSectionCard title="Examens nationaux" subtitle="Volume par type d'examen">
          <ChartContainer
            config={{ count: { label: "Épreuves", color: "var(--chart-3)" } }}
            className={`${chartBarCompactHeight} w-full`}
          >
            <BarChart data={examenData} margin={{ left: -8, right: 4, top: 4, bottom: 0 }}>
              <CartesianGrid vertical={false} strokeDasharray="3 3" />
              <XAxis dataKey="examen" tickLine={false} axisLine={false} fontSize={9} />
              <YAxis allowDecimals={false} tickLine={false} axisLine={false} width={28} fontSize={9} />
              <ChartTooltip content={<ChartTooltipContent />} />
              <Bar dataKey="count" fill="var(--chart-3)" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ChartContainer>
        </DashboardSectionCard>
      )}
    </div>
  );
}
