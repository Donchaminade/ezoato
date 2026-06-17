/** Classes Tailwind partagées — dashboard mobile-first */

export const dashboardStatGrid = "grid grid-cols-2 gap-2 sm:gap-4 xl:grid-cols-4";
export const dashboardAdminStatGrid = "grid grid-cols-2 gap-2 sm:gap-4 xl:grid-cols-5";
export const dashboardSectionStack = "space-y-3 sm:space-y-6";
export const dashboardChartGrid = "grid gap-3 sm:gap-6 lg:grid-cols-2";
export const dashboardChartGrid3 = "grid gap-3 sm:gap-6 lg:grid-cols-3";
/** Mes actions (étroit) + raccourcis (large) */
export const dashboardActionsShortcutsGrid = "grid gap-3 sm:gap-6 lg:grid-cols-4";
export const dashboardTripleStatGrid = "grid grid-cols-3 gap-2 sm:gap-4";
export const dashboardShortcutGrid = "grid grid-cols-2 gap-2 sm:gap-3 xl:grid-cols-3 [&>*]:min-w-0";
/** 4 raccourcis sur une ligne dans la carte élargie */
export const dashboardShortcutGridWide = "grid grid-cols-2 gap-2 sm:gap-3 lg:grid-cols-4 [&>*]:min-w-0";
export const dashboardActivityGrid = "grid grid-cols-2 gap-2 sm:gap-4";

/** Hauteurs graphiques adaptées mobile (carré compact) → desktop */
export const chartHeight = "h-[168px] sm:h-[220px] md:h-[260px]";
export const chartPieHeight = "mx-auto h-[180px] sm:h-[240px]";
export const chartBarCompactHeight = "h-[160px] sm:h-[200px] md:h-[240px]";

/** Grille flux KPI (4 étapes) */
export const fluxStepsGrid =
  "grid grid-cols-2 gap-2 sm:flex sm:flex-row sm:items-center sm:justify-between sm:gap-3";

export const fluxStepCard =
  "flex flex-col items-center justify-center rounded-xl border border-border bg-muted/30 px-2 py-3 text-center sm:flex-1 sm:px-3 sm:py-4";

/** Tableaux dashboard */
export const dataTableWrapper =
  "overflow-x-auto rounded-xl border border-border bg-card [-webkit-overflow-scrolling:touch]";
export const dataTableClass =
  "min-w-[26rem] text-xs sm:min-w-[36rem] sm:text-sm [&_th]:h-8 [&_th]:whitespace-nowrap [&_th]:px-2 [&_td]:px-2 [&_td]:py-2 sm:[&_th]:h-10 sm:[&_td]:py-3";
