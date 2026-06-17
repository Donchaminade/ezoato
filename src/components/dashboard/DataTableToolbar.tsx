import type { ReactNode } from "react";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function DataTableToolbar({
  title,
  description,
  count,
  onAdd,
  addLabel = "Ajouter",
  children,
  className,
}: {
  title?: string;
  description?: string;
  count?: number;
  onAdd?: () => void;
  addLabel?: string;
  children?: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("mb-3 flex flex-wrap items-start justify-between gap-2 sm:mb-4 sm:gap-3", className)}>
      <div className="min-w-0">
        {title && <h3 className="font-display text-base font-semibold sm:text-lg">{title}</h3>}
        {description && <p className="mt-0.5 line-clamp-2 text-xs text-muted-foreground sm:mt-1 sm:text-sm">{description}</p>}
        {count !== undefined && (
          <p className="mt-0.5 text-[10px] text-muted-foreground sm:text-xs">
            {count} élément{count > 1 ? "s" : ""}
          </p>
        )}
      </div>
      <div className="flex flex-wrap items-center gap-2">
        {children}
        {onAdd && (
          <Button size="sm" className="h-8 rounded-lg text-xs sm:h-9 sm:rounded-xl sm:text-sm" onClick={onAdd}>
            <Plus className="size-3.5 sm:size-4" />
            <span className="max-w-[8rem] truncate sm:max-w-none">{addLabel}</span>
          </Button>
        )}
      </div>
    </div>
  );
}
