import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type DataTablePaginationProps = {
  page: number;
  totalPages: number;
  total: number;
  rangeStart: number;
  rangeEnd: number;
  onPageChange: (page: number) => void;
  className?: string;
};

export function DataTablePagination({
  page,
  totalPages,
  total,
  rangeStart,
  rangeEnd,
  onPageChange,
  className,
}: DataTablePaginationProps) {
  if (total === 0) return null;

  const pages: (number | "…")[] = [];
  const push = (n: number | "…") => pages.push(n);
  push(1);
  if (page > 3) push("…");
  for (let p = Math.max(2, page - 1); p <= Math.min(totalPages - 1, page + 1); p++) push(p);
  if (page < totalPages - 2) push("…");
  if (totalPages > 1) push(totalPages);

  return (
    <div
      className={cn(
        "flex flex-col gap-2 border-t border-border px-2 py-2 sm:flex-row sm:items-center sm:justify-between sm:gap-3 sm:px-4 sm:py-3",
        className,
      )}
    >
      <p className="text-center text-xs text-muted-foreground sm:text-left sm:text-sm">
        {rangeStart}–{rangeEnd} sur <span className="font-medium text-foreground">{total}</span>
      </p>
      {totalPages > 1 && (
        <nav className="flex items-center justify-center gap-1" aria-label="Pagination">
          <span className="px-1 text-xs text-muted-foreground sm:hidden">
            {page}/{totalPages}
          </span>
          <Button
            type="button"
            variant="outline"
            size="icon"
            className="size-7 rounded-lg sm:size-8"
            disabled={page === 1}
            onClick={() => onPageChange(page - 1)}
            aria-label="Page précédente"
          >
            <ChevronLeft className="size-4" />
          </Button>
          {pages.map((p, i) =>
            p === "…" ? (
              <span key={`ellipsis-${i}`} className="px-2 text-sm text-muted-foreground">
                …
              </span>
            ) : (
              <Button
                key={p}
                type="button"
                variant={p === page ? "default" : "outline"}
                size="sm"
                className="hidden min-w-7 rounded-lg px-2 sm:inline-flex sm:min-w-8 sm:px-2.5"
                onClick={() => onPageChange(p)}
              >
                {p}
              </Button>
            ),
          )}
          <Button
            type="button"
            variant="outline"
            size="icon"
            className="size-7 rounded-lg sm:size-8"
            disabled={page === totalPages}
            onClick={() => onPageChange(page + 1)}
            aria-label="Page suivante"
          >
            <ChevronRight className="size-4" />
          </Button>
        </nav>
      )}
    </div>
  );
}
