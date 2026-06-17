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
import { CHART_COLORS, TYPE_LABELS, fillDays, hasSeriesData } from "@/components/dashboard/chart-utils";
import { formatFcfa } from "@/lib/pricing";
import type { AdminStats } from "@/lib/types";
import { MiniStatCard } from "@/components/dashboard/MiniStatCard";
import { BarChart3, BookOpen, FileText, Wallet } from "lucide-react";
import {
  chartBarCompactHeight,
  chartHeight,
  chartPieHeight,
  dashboardChartGrid,
  dashboardChartGrid3,
  dashboardSectionStack,
  dashboardStatGrid,
} from "@/lib/dashboard-mobile";

const downloadsConfig = {
  count: { label: "Téléchargements", color: "var(--chart-1)" },
} satisfies ChartConfig;

const paymentsConfig = {
  count: { label: "Paiements", color: "var(--chart-2)" },
  revenus: { label: "Revenus (FCFA)", color: "var(--chart-3)" },
} satisfies ChartConfig;

const revenusConfig = {
  revenus: { label: "Revenus", color: "var(--chart-1)" },
} satisfies ChartConfig;

export function AdminStatsCharts({ stats }: { stats: AdminStats }) {
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
  const revenusType = (stats.revenusParType ?? [])
    .filter((r) => r.revenus > 0 || r.paiements > 0)
    .map((r) => ({
      type: TYPE_LABELS[r.type] ?? r.type,
      revenus: r.revenus,
      paiements: r.paiements,
    }));
  const methodData = (stats.parMethode ?? [])
    .filter((m) => m.revenus > 0 || m.count > 0)
    .map((m) => ({
      methode: m.methode === "flooz" ? "Flooz" : "T-Money",
      revenus: m.revenus,
      count: m.count,
    }));
  const examenList = (stats.parExamen ?? []).filter((e) => e.count > 0);
  const matieresList = (stats.topMatieres ?? []).filter((m) => m.count > 0);

  return (
    <div className={dashboardSectionStack}>
      <div className={dashboardStatGrid}>
        <MiniStatCard icon={FileText} label="Corrigés type" value={stats.corrigesTypes ?? 0} />
        <MiniStatCard icon={BookOpen} label="DL corrigés" value={stats.telechargementsCorriges ?? 0} />
        <MiniStatCard icon={BarChart3} label="Revenus examens" value={formatFcfa(stats.revenusExamensFcfa ?? 0)} />
        <MiniStatCard icon={Wallet} label="Revenus corrigés" value={formatFcfa(stats.revenusCorrigesFcfa ?? 0)} />
      </div>

      <div className={dashboardChartGrid}>
        <div className="rounded-xl border border-border bg-card p-3 sm:p-5">
          <h3 className="text-sm font-display font-semibold sm:text-base">Téléchargements — 14 jours</h3>
          {!hasDownloads ? (
            <ChartEmptyState message="Aucun téléchargement sur les 14 derniers jours" />
          ) : (
            <ChartContainer config={downloadsConfig} className={`mt-3 ${chartHeight} w-full sm:mt-4`}>
              <BarChart data={downloadsSeries} margin={{ left: -8, right: 4, top: 4, bottom: 0 }}>
                <CartesianGrid vertical={false} />
                <XAxis dataKey="label" tickLine={false} axisLine={false} fontSize={9} interval="preserveStartEnd" />
                <YAxis allowDecimals={false} tickLine={false} axisLine={false} width={28} fontSize={9} />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Bar dataKey="count" fill="var(--color-count)" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ChartContainer>
          )}
        </div>

        <div className="rounded-xl border border-border bg-card p-3 sm:p-5">
          <h3 className="text-sm font-display font-semibold sm:text-base">Paiements & revenus — 14 jours</h3>
          {!hasPayments ? (
            <ChartEmptyState message="Aucun paiement sur les 14 derniers jours" />
          ) : (
            <ChartContainer config={paymentsConfig} className={`mt-3 ${chartHeight} w-full sm:mt-4`}>
              <LineChart data={paymentsSeries} margin={{ left: -8, right: 4, top: 4, bottom: 0 }}>
                <CartesianGrid vertical={false} />
                <XAxis dataKey="label" tickLine={false} axisLine={false} fontSize={9} interval="preserveStartEnd" />
                <YAxis yAxisId="left" allowDecimals={false} tickLine={false} axisLine={false} width={28} fontSize={9} />
                <YAxis yAxisId="right" orientation="right" tickLine={false} axisLine={false} width={36} fontSize={9} />
                <ChartTooltip content={<ChartTooltipContent />} />
                <ChartLegend content={<ChartLegendContent />} />
                <Line yAxisId="left" type="monotone" dataKey="count" stroke="var(--color-count)" strokeWidth={2} dot={false} />
                <Line yAxisId="right" type="monotone" dataKey="revenus" stroke="var(--color-revenus)" strokeWidth={2} dot={false} />
              </LineChart>
            </ChartContainer>
          )}
        </div>
      </div>

      <div className={dashboardChartGrid3}>
        <div className="rounded-xl border border-border bg-card p-3 sm:p-5">
          <h3 className="text-sm font-display font-semibold sm:text-base">Répartition par type</h3>
          {typeData.length === 0 ? (
            <ChartEmptyState message="Aucune épreuve par type" />
          ) : (
            <ChartContainer config={{ value: { label: "Épreuves", color: "var(--chart-1)" } }} className={`mt-3 ${chartPieHeight} sm:mt-4`}>
              <PieChart>
                <ChartTooltip content={<ChartTooltipContent hideLabel />} />
                <Pie data={typeData} dataKey="value" nameKey="name" innerRadius={40} outerRadius={65} paddingAngle={2}>
                  {typeData.map((entry, i) => (
                    <Cell key={entry.name} fill={entry.fill ?? CHART_COLORS[i % CHART_COLORS.length]} />
                  ))}
                </Pie>
                <ChartLegend content={<ChartLegendContent nameKey="name" />} />
              </PieChart>
            </ChartContainer>
          )}
        </div>

        <div className="rounded-xl border border-border bg-card p-3 sm:p-5">
          <h3 className="text-sm font-display font-semibold sm:text-base">Revenus par type</h3>
          {revenusType.length === 0 ? (
            <ChartEmptyState message="Aucun revenu par type" />
          ) : (
            <ChartContainer config={revenusConfig} className={`mt-3 ${chartBarCompactHeight} w-full sm:mt-4`}>
              <BarChart data={revenusType} layout="vertical" margin={{ left: 0, right: 4, top: 4, bottom: 0 }}>
                <CartesianGrid horizontal={false} />
                <XAxis type="number" tickLine={false} axisLine={false} fontSize={9} />
                <YAxis type="category" dataKey="type" tickLine={false} axisLine={false} width={56} fontSize={9} />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Bar dataKey="revenus" fill="var(--color-revenus)" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ChartContainer>
          )}
        </div>

        <div className="rounded-xl border border-border bg-card p-3 sm:p-5">
          <h3 className="text-sm font-display font-semibold sm:text-base">Mobile Money</h3>
          {methodData.length === 0 ? (
            <ChartEmptyState message="Aucun paiement Mobile Money" />
          ) : (
            <>
              <ChartContainer config={revenusConfig} className={`mt-3 ${chartHeight} w-full sm:mt-4`}>
                <BarChart data={methodData} margin={{ left: -8, right: 4, top: 4, bottom: 0 }}>
                  <CartesianGrid vertical={false} />
                  <XAxis dataKey="methode" tickLine={false} axisLine={false} fontSize={9} />
                  <YAxis tickLine={false} axisLine={false} width={36} fontSize={9} />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Bar dataKey="revenus" fill="var(--chart-2)" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ChartContainer>
              <ul className="mt-3 space-y-1 text-xs text-muted-foreground">
                {methodData.map((m) => (
                  <li key={m.methode} className="flex justify-between">
                    <span>{m.methode}</span>
                    <span>{m.count} paiement{m.count > 1 ? "s" : ""}</span>
                  </li>
                ))}
              </ul>
            </>
          )}
        </div>
      </div>

      <div className={dashboardChartGrid}>
        <div className="rounded-xl border border-border bg-card p-3 sm:p-5">
          <h3 className="text-sm font-display font-semibold sm:text-base">Examens nationaux</h3>
          {examenList.length === 0 ? (
            <ChartEmptyState message="Aucun examen national enregistré" />
          ) : (
            <ul className="mt-4 space-y-2">
              {examenList.map((t) => (
                <li key={t.examen} className="flex items-center justify-between text-sm">
                  <span>{t.examen}</span>
                  <span className="font-semibold tabular-nums">{t.count}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
        <div className="rounded-xl border border-border bg-card p-3 sm:p-5">
          <h3 className="text-sm font-display font-semibold sm:text-base">Top matières</h3>
          {matieresList.length === 0 ? (
            <ChartEmptyState message="Aucune matière classée" />
          ) : (
            <ul className="mt-4 space-y-2">
              {matieresList.map((t) => (
                <li key={t.matiere} className="flex items-center justify-between text-sm">
                  <span>{t.matiere}</span>
                  <span className="font-semibold tabular-nums">{t.count}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
