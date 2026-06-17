import { BarChart3 } from "lucide-react";

export function ChartEmptyState({ message = "Aucune donnée pour le moment" }: { message?: string }) {
  return (
    <div className="flex min-h-[100px] flex-col items-center justify-center px-4 py-6 text-center text-xs text-muted-foreground sm:min-h-[180px] sm:py-10 sm:text-sm">
      <BarChart3 className="mb-1.5 size-7 opacity-25 sm:mb-2 sm:size-9" strokeWidth={1.5} />
      <p className="line-clamp-3">{message}</p>
    </div>
  );
}
