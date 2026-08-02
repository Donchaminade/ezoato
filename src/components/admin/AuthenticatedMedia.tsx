import { useEffect, useState } from "react";
import { FileText, Loader2 } from "lucide-react";
import { api } from "@/lib/api";
import { cn, resolveMediaUrl } from "@/lib/utils";

/** Cadre portrait A4 pour épreuves (210×297 mm). */
export const PORTRAIT_PREVIEW_FRAME =
  "relative mx-auto w-full max-w-md aspect-[210/297] overflow-hidden bg-muted/20";

/** Cadre portrait A4 pour le panneau d'aperçu archives (utilise toute la largeur disponible). */
export const ARCHIVES_PORTRAIT_PREVIEW_FRAME =
  "relative w-full max-w-none aspect-[210/297] overflow-hidden bg-muted/20";

/** Image d'aperçu avec URL média corrigée + fetch authentifié (épreuves payantes). */
export function AuthenticatedImage({
  url,
  alt,
  className,
  imgClassName,
}: {
  url: string;
  alt: string;
  className?: string;
  imgClassName?: string;
}) {
  const [src, setSrc] = useState<string | null>(null);
  const [error, setError] = useState(false);
  const resolved = resolveMediaUrl(url) ?? url;

  useEffect(() => {
    let objectUrl: string | null = null;
    let cancelled = false;
    setSrc(null);
    setError(false);
    api
      .fetchAuthenticatedUrl(resolved)
      .then((u) => {
        if (cancelled) {
          URL.revokeObjectURL(u);
          return;
        }
        objectUrl = u;
        setSrc(u);
      })
      .catch(() => {
        if (!cancelled) setError(true);
      });
    return () => {
      cancelled = true;
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [resolved]);

  if (error) {
    return (
      <div className={cn("grid place-items-center bg-muted/30 text-muted-foreground", className)}>
        <div className="p-6 text-center">
          <FileText className="mx-auto size-10 opacity-40" />
          <p className="mt-2 text-sm">Aperçu indisponible</p>
        </div>
      </div>
    );
  }
  if (!src) {
    return (
      <div className={cn("grid place-items-center bg-muted/20", className)}>
        <Loader2 className="size-6 animate-spin text-muted-foreground" />
      </div>
    );
  }
  return (
    <div className={cn("overflow-hidden", className)}>
      <img src={src} alt={alt} className={cn("h-full w-full object-contain", imgClassName)} />
    </div>
  );
}

export function AuthenticatedPdf({ url, className }: { url: string; className?: string }) {
  const [src, setSrc] = useState<string | null>(null);
  const [error, setError] = useState(false);
  const resolved = resolveMediaUrl(url) ?? url;

  useEffect(() => {
    let objectUrl: string | null = null;
    api.fetchAuthenticatedUrl(resolved)
      .then((u) => { objectUrl = u; setSrc(u); })
      .catch(() => setError(true));
    return () => { if (objectUrl) URL.revokeObjectURL(objectUrl); };
  }, [resolved]);

  if (error) {
    return (
      <div className={cn(PORTRAIT_PREVIEW_FRAME, "grid place-items-center text-sm text-muted-foreground", className)}>
        Aperçu PDF indisponible
      </div>
    );
  }
  if (!src) {
    return (
      <div className={cn(PORTRAIT_PREVIEW_FRAME, "grid place-items-center", className)}>
        <Loader2 className="size-6 animate-spin text-muted-foreground" />
      </div>
    );
  }
  return (
    <div className={cn(PORTRAIT_PREVIEW_FRAME, className)}>
      <iframe src={src} title="Aperçu PDF" className="absolute inset-0 h-full w-full border-0" />
    </div>
  );
}

export function AuthenticatedImageGrid({ urls }: { urls: string[] }) {
  const [sources, setSources] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    const blobs: string[] = [];
    (async () => {
      try {
        for (const url of urls) {
          const b = await api.fetchAuthenticatedUrl(url);
          blobs.push(b);
        }
        if (!cancelled) setSources(blobs);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
      blobs.forEach((b) => URL.revokeObjectURL(b));
    };
  }, [urls]);

  if (!urls.length) return null;
  if (loading) {
    return (
      <div className="grid h-24 place-items-center rounded-xl border border-border bg-muted/30">
        <Loader2 className="size-5 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
      {sources.map((src, i) => (
        <a
          key={src}
          href={src}
          target="_blank"
          rel="noreferrer"
          className="overflow-hidden rounded-lg border border-border bg-background"
        >
          <img src={src} alt={`Page ${i + 1}`} className="aspect-[3/4] w-full bg-muted/30 object-contain" />
          <p className="px-2 py-1 text-center text-xs text-muted-foreground">Page {i + 1}</p>
        </a>
      ))}
    </div>
  );
}
