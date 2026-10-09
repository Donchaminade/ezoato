import { useEffect, useState } from "react";
import { ChevronLeft, ChevronRight, Moon, Sun, ZoomIn, ZoomOut } from "lucide-react";
import { AuthenticatedImage } from "@/components/admin/AuthenticatedMedia";
import { Button } from "@/components/ui/button";
import type { Epreuve } from "@/lib/types";
import { cn, resolveMediaUrl } from "@/lib/utils";

function readerPageUrl(thumbnailUrl: string, page: number): string {
  const resolved = resolveMediaUrl(thumbnailUrl) ?? thumbnailUrl;
  const url = new URL(resolved, window.location.origin);
  url.searchParams.set("page", String(page));
  url.searchParams.set("lire", "1");
  return url.toString();
}

/** Visionneuse intégrée : pages, zoom, mode sombre. La consultation (lire=1) compte dans le quota. */
export function EpreuveReader({ epreuve }: { epreuve: Epreuve }) {
  const pageCount = Math.max(1, Math.min(20, epreuve.pages || 1));
  const [page, setPage] = useState(1);
  const [zoom, setZoom] = useState(1);
  const [paperDark, setPaperDark] = useState(false);

  useEffect(() => {
    setPage(1);
    setZoom(1);
  }, [epreuve.id]);

  const src = epreuve.thumbnailUrl ? readerPageUrl(epreuve.thumbnailUrl, page) : null;

  return (
    <div id="visionneuse" className="overflow-hidden rounded-2xl border border-border bg-card">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border px-3 py-2">
        <p className="text-sm font-medium">Lire l&apos;épreuve</p>
        <div className="flex flex-wrap items-center gap-1">
          <Button type="button" size="icon" variant="outline" className="size-9" aria-label="Zoom arrière" onClick={() => setZoom((z) => Math.max(1, Math.round((z - 0.25) * 100) / 100))}>
            <ZoomOut className="size-4" />
          </Button>
          <Button type="button" size="icon" variant="outline" className="size-9" aria-label="Zoom avant" onClick={() => setZoom((z) => Math.min(3, Math.round((z + 0.25) * 100) / 100))}>
            <ZoomIn className="size-4" />
          </Button>
          <Button
            type="button"
            size="icon"
            variant="outline"
            className="size-9"
            aria-pressed={paperDark}
            aria-label={paperDark ? "Mode clair" : "Mode sombre"}
            onClick={() => setPaperDark((v) => !v)}
          >
            {paperDark ? <Sun className="size-4" /> : <Moon className="size-4" />}
          </Button>
        </div>
      </div>
      <div className={cn("max-h-[75vh] overflow-auto", paperDark ? "bg-neutral-950" : "bg-muted/40")}>
        {src ? (
          <div className="mx-auto min-w-full" style={{ width: `${zoom * 100}%` }}>
            <AuthenticatedImage
              url={src}
              alt={`Page ${page} — ${epreuve.titre}`}
              className="min-h-[50vh] w-full"
              imgClassName={cn("w-full object-contain", paperDark && "invert hue-rotate-180")}
            />
          </div>
        ) : (
          <p className="grid min-h-[40vh] place-items-center text-sm text-muted-foreground">Aperçu indisponible</p>
        )}
      </div>
      <div className="flex items-center justify-between gap-2 border-t border-border px-3 py-2">
        <Button type="button" size="sm" variant="outline" disabled={page <= 1} onClick={() => setPage((p) => Math.max(1, p - 1))}>
          <ChevronLeft className="size-4" /> Précédente
        </Button>
        <p className="text-sm tabular-nums text-muted-foreground">
          Page {page} / {pageCount}
        </p>
        <Button type="button" size="sm" variant="outline" disabled={page >= pageCount} onClick={() => setPage((p) => Math.min(pageCount, p + 1))}>
          Suivante <ChevronRight className="size-4" />
        </Button>
      </div>
    </div>
  );
}
