import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  ChevronLeft,
  ChevronRight,
  Maximize,
  Minimize,
  MoveHorizontal,
  Moon,
  ShieldCheck,
  Sun,
  ZoomIn,
  ZoomOut,
} from "lucide-react";
import { AuthenticatedImage } from "@/components/admin/AuthenticatedMedia";
import { api } from "@/lib/api";
import type { PDFDocumentProxy } from "pdfjs-dist";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/lib/auth";
import type { Epreuve } from "@/lib/types";
import { cn, resolveMediaUrl } from "@/lib/utils";

const MIN_ZOOM = 0.5;
const MAX_ZOOM = 4;
const clampZoom = (z: number) => Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, Math.round(z * 100) / 100));

function readerPageUrl(thumbnailUrl: string, page: number): string {
  const resolved = resolveMediaUrl(thumbnailUrl) ?? thumbnailUrl;
  const url = new URL(resolved, window.location.origin);
  url.searchParams.set("page", String(page));
  url.searchParams.set("lire", "1");
  return url.toString();
}

/** Filigrane nominatif répété (dissuasion : les captures d'écran web ne peuvent pas être bloquées). */
function Watermark({ text }: { text: string }) {
  return (
    <div
      aria-hidden
      className="pointer-events-none absolute inset-0 z-10 overflow-hidden select-none"
      style={{
        backgroundImage: `url("data:image/svg+xml;utf8,${encodeURIComponent(
          `<svg xmlns='http://www.w3.org/2000/svg' width='320' height='200'><text x='0' y='120' transform='rotate(-28 160 100)' font-family='sans-serif' font-size='15' font-weight='600' fill='rgba(0,106,78,0.16)'>${text
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")}</text></svg>`,
        )}")`,
      }}
    />
  );
}

let pdfjsPromise: Promise<typeof import("pdfjs-dist")> | null = null;
function loadPdfjs() {
  pdfjsPromise ??= Promise.all([
    import("pdfjs-dist"),
    import("pdfjs-dist/build/pdf.worker.min.mjs?url"),
  ]).then(([lib, worker]) => {
    lib.GlobalWorkerOptions.workerSrc = worker.default;
    return lib;
  });
  return pdfjsPromise;
}

/** Charge un PDF authentifié (sans exposer de lien de téléchargement). */
function usePdf(url: string | null) {
  const [doc, setDoc] = useState<PDFDocumentProxy | null>(null);
  const [error, setError] = useState(false);
  useEffect(() => {
    if (!url) return;
    let cancelled = false;
    let blobUrl: string | null = null;
    setDoc(null);
    setError(false);
    (async () => {
      try {
        const lib = await loadPdfjs();
        blobUrl = await api.fetchAuthenticatedUrl(resolveMediaUrl(url) ?? url);
        const d = await lib.getDocument({ url: blobUrl, isEvalSupported: false }).promise;
        if (!cancelled) setDoc(d);
      } catch {
        if (!cancelled) setError(true);
      }
    })();
    return () => {
      cancelled = true;
      if (blobUrl) URL.revokeObjectURL(blobUrl);
    };
  }, [url]);
  return { doc, error };
}

function PdfCanvas({ doc, pageNumber, zoom, night }: { doc: PDFDocumentProxy; pageNumber: number; zoom: number; night: boolean }) {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    let task: { cancel: () => void; promise: Promise<unknown> } | null = null;
    let alive = true;
    doc.getPage(pageNumber).then((pg) => {
      const canvas = ref.current;
      if (!alive || !canvas) return;
      const cssW = canvas.parentElement?.clientWidth || 800;
      const base = pg.getViewport({ scale: 1 });
      const scale = (cssW / base.width) * Math.min(3, window.devicePixelRatio || 1);
      const vp = pg.getViewport({ scale });
      canvas.width = vp.width;
      canvas.height = vp.height;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;
      task = pg.render({ canvasContext: ctx, viewport: vp });
      task.promise.catch(() => undefined);
    });
    return () => {
      alive = false;
      task?.cancel();
    };
  }, [doc, pageNumber, zoom]);
  return (
    <canvas
      ref={ref}
      aria-label={`Page ${pageNumber}`}
      className={cn("absolute inset-0 h-full w-full", night && "invert hue-rotate-180")}
    />
  );
}

/** Page chargée paresseusement quand elle approche du viewport. */
function ReaderPage({
  src,
  pdf,
  zoom,
  index,
  title,
  night,
  watermark,
  onVisible,
}: {
  src: string | null;
  pdf: PDFDocumentProxy | null;
  zoom: number;
  index: number;
  title: string;
  night: boolean;
  watermark: string;
  onVisible: (i: number) => void;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [near, setNear] = useState(index < 2);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (e.isIntersecting) setNear(true);
          if (e.intersectionRatio > 0.5) onVisible(index);
        }
      },
      { rootMargin: "600px 0px", threshold: [0, 0.5] },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [index, onVisible]);

  return (
    <div
      ref={ref}
      data-page={index + 1}
      className="relative mx-auto aspect-[210/297] w-full overflow-hidden rounded-sm bg-white shadow-[0_6px_24px_-8px_rgba(0,0,0,.35)]"
    >
      {near && pdf && <PdfCanvas doc={pdf} pageNumber={index + 1} zoom={zoom} night={night} />}
      {near && src && (
        <AuthenticatedImage
          url={src}
          alt={`Page ${index + 1} — ${title}`}
          className="absolute inset-0 h-full w-full"
          imgClassName={cn(
            "pointer-events-none h-full w-full object-contain select-none",
            night && "invert hue-rotate-180",
          )}
        />
      )}
      <Watermark text={watermark} />
      <span className="absolute bottom-2 right-3 z-20 rounded-full bg-black/55 px-2 py-0.5 text-[11px] font-medium text-white">
        {index + 1}
      </span>
    </div>
  );
}

/**
 * Visionneuse type « lecteur PDF » : défilement continu, zoom (boutons, pincement,
 * double-tap, Ctrl+molette), ajuster à la largeur, aller à la page, mode nuit.
 * Lecture seule : pas de téléchargement, d'impression ni de clic droit ; filigrane nominatif.
 */
export function EpreuveReader({ epreuve }: { epreuve: Epreuve }) {
  const { user } = useAuth();
  // Images de pages rendues côté serveur si disponibles, sinon rendu PDF dans le navigateur.
  const pdfUrl = epreuve.thumbnailUrl ? null : (epreuve.pdfPreviewUrl ?? null);
  const { doc: pdf, error: pdfError } = usePdf(pdfUrl);
  const pageCount = pdf ? pdf.numPages : Math.max(1, Math.min(40, epreuve.pages || 1));
  const [page, setPage] = useState(1);
  const [zoom, setZoom] = useState(1);
  const [night, setNight] = useState(false);
  const [fullscreen, setFullscreen] = useState(false);
  const [goto, setGoto] = useState("1");
  const scroller = useRef<HTMLDivElement>(null);
  const shell = useRef<HTMLDivElement>(null);
  const pinch = useRef<{ d: number; z: number } | null>(null);
  const pointers = useRef(new Map<number, { x: number; y: number }>());
  const lastTap = useRef(0);

  const watermark = useMemo(() => {
    const who = [user?.nom, user?.email].filter(Boolean).join(" · ") || "Lecteur EZOA-TO";
    return `${who} · EZOA-TO · ${new Date().toLocaleDateString("fr-FR")}`;
  }, [user]);

  useEffect(() => {
    setPage(1);
    setZoom(1);
  }, [epreuve.id]);
  useEffect(() => setGoto(String(page)), [page]);

  const onVisible = useCallback((i: number) => setPage(i + 1), []);

  const scrollToPage = (p: number) => {
    const n = Math.min(pageCount, Math.max(1, p));
    scroller.current
      ?.querySelector<HTMLElement>(`[data-page="${n}"]`)
      ?.scrollIntoView({ behavior: "smooth", block: "start" });
    setPage(n);
  };

  // Blocage impression / enregistrement / copie pendant la lecture.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const k = e.key.toLowerCase();
      if ((e.ctrlKey || e.metaKey) && ["p", "s", "c", "a"].includes(k)) {
        if (shell.current?.contains(document.activeElement) || k === "p" || k === "s") e.preventDefault();
      }
      if (!shell.current?.contains(document.activeElement)) return;
      if ((e.ctrlKey || e.metaKey) && (k === "+" || k === "=")) {
        e.preventDefault();
        setZoom((z) => clampZoom(z + 0.25));
      }
      if ((e.ctrlKey || e.metaKey) && k === "-") {
        e.preventDefault();
        setZoom((z) => clampZoom(z - 0.25));
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  // Ctrl + molette = zoom (non passif pour pouvoir annuler le zoom navigateur).
  useEffect(() => {
    const el = scroller.current;
    if (!el) return;
    const onWheel = (e: WheelEvent) => {
      if (!e.ctrlKey) return;
      e.preventDefault();
      setZoom((z) => clampZoom(z * (e.deltaY < 0 ? 1.1 : 0.9)));
    };
    el.addEventListener("wheel", onWheel, { passive: false });
    return () => el.removeEventListener("wheel", onWheel);
  }, []);

  useEffect(() => {
    const onFs = () => setFullscreen(document.fullscreenElement === shell.current);
    document.addEventListener("fullscreenchange", onFs);
    return () => document.removeEventListener("fullscreenchange", onFs);
  }, []);

  const toggleFullscreen = () => {
    if (document.fullscreenElement) void document.exitFullscreen();
    else void shell.current?.requestFullscreen?.().catch(() => undefined);
  };

  const onPointerDown = (e: React.PointerEvent) => {
    pointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
    if (pointers.current.size === 2) {
      const [a, b] = [...pointers.current.values()];
      pinch.current = { d: Math.hypot(a.x - b.x, a.y - b.y), z: zoom };
    }
    if (e.pointerType === "touch" && pointers.current.size === 1) {
      const now = Date.now();
      if (now - lastTap.current < 300) setZoom((z) => (z > 1.05 ? 1 : 2));
      lastTap.current = now;
    }
  };
  const onPointerMove = (e: React.PointerEvent) => {
    if (!pointers.current.has(e.pointerId)) return;
    pointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
    if (pinch.current && pointers.current.size === 2) {
      const [a, b] = [...pointers.current.values()];
      const d = Math.hypot(a.x - b.x, a.y - b.y);
      setZoom(clampZoom(pinch.current.z * (d / pinch.current.d)));
    }
  };
  const onPointerUp = (e: React.PointerEvent) => {
    pointers.current.delete(e.pointerId);
    if (pointers.current.size < 2) pinch.current = null;
  };

  if ((!epreuve.thumbnailUrl && !pdfUrl) || pdfError) {
    return <p className="grid min-h-[40vh] place-items-center text-sm text-muted-foreground">Aperçu indisponible</p>;
  }
  const thumb = epreuve.thumbnailUrl;

  return (
    <div
      id="visionneuse"
      ref={shell}
      tabIndex={-1}
      onContextMenu={(e) => e.preventDefault()}
      onDragStart={(e) => e.preventDefault()}
      onCopy={(e) => e.preventDefault()}
      className={cn(
        "ezoa-reader flex flex-col overflow-hidden rounded-2xl border border-border bg-card select-none print:hidden",
        fullscreen && "rounded-none",
      )}
    >
      {/* Barre d'outils */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border bg-[#004D38] px-2 py-2 text-white sm:px-3">
        <div className="flex items-center gap-1">
          <ToolBtn label="Page précédente" onClick={() => scrollToPage(page - 1)} disabled={page <= 1}>
            <ChevronLeft className="size-4" />
          </ToolBtn>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              scrollToPage(Number(goto) || 1);
            }}
            className="flex items-center gap-1 text-sm tabular-nums"
          >
            <input
              aria-label="Aller à la page"
              inputMode="numeric"
              value={goto}
              onChange={(e) => setGoto(e.target.value.replace(/\D/g, ""))}
              onBlur={() => scrollToPage(Number(goto) || page)}
              className="h-8 w-10 rounded-md border border-white/25 bg-white/10 text-center font-semibold text-white outline-none focus:border-[#FFCE00]"
            />
            <span className="text-white/80">/ {pageCount}</span>
          </form>
          <ToolBtn label="Page suivante" onClick={() => scrollToPage(page + 1)} disabled={page >= pageCount}>
            <ChevronRight className="size-4" />
          </ToolBtn>
        </div>
        <div className="flex items-center gap-1">
          <ToolBtn label="Zoom arrière" onClick={() => setZoom((z) => clampZoom(z - 0.25))} disabled={zoom <= MIN_ZOOM}>
            <ZoomOut className="size-4" />
          </ToolBtn>
          <span className="w-12 text-center text-xs font-semibold tabular-nums" aria-live="polite">
            {Math.round(zoom * 100)} %
          </span>
          <ToolBtn label="Zoom avant" onClick={() => setZoom((z) => clampZoom(z + 0.25))} disabled={zoom >= MAX_ZOOM}>
            <ZoomIn className="size-4" />
          </ToolBtn>
          <ToolBtn label="Ajuster à la largeur" onClick={() => setZoom(1)} active={zoom === 1}>
            <MoveHorizontal className="size-4" />
          </ToolBtn>
          <ToolBtn label={night ? "Mode jour" : "Mode nuit"} onClick={() => setNight((v) => !v)} active={night}>
            {night ? <Sun className="size-4" /> : <Moon className="size-4" />}
          </ToolBtn>
          <ToolBtn label={fullscreen ? "Quitter le plein écran" : "Plein écran"} onClick={toggleFullscreen}>
            {fullscreen ? <Minimize className="size-4" /> : <Maximize className="size-4" />}
          </ToolBtn>
        </div>
      </div>

      {/* Pages */}
      <div
        ref={scroller}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
        onDoubleClick={(e) => {
          if ((e.target as HTMLElement).closest("button,input")) return;
          setZoom((z) => (z > 1.05 ? 1 : 2));
        }}
        className={cn(
          "overflow-auto overscroll-contain p-3 sm:p-5",
          fullscreen ? "h-[calc(100vh-52px)]" : "max-h-[78vh]",
          night ? "bg-[#0B1622]" : "bg-[#E9EFEC] dark:bg-[#0B1622]",
        )}
        style={{ touchAction: zoom > 1 ? "pan-x pan-y" : "pan-y" }}
      >
        <div className="mx-auto space-y-4 transition-[width] duration-200" style={{ width: `${zoom * 100}%`, maxWidth: zoom === 1 ? 820 : undefined }}>
          {Array.from({ length: pageCount }, (_, i) => (
            <ReaderPage
              key={`${epreuve.id}-${i}`}
              src={thumb ? readerPageUrl(thumb, i + 1) : null}
              pdf={pdf}
              zoom={zoom}
              index={i}
              title={epreuve.titre}
              night={night}
              watermark={watermark}
              onVisible={onVisible}
            />
          ))}
        </div>
      </div>
      <p className="flex items-center gap-1.5 border-t border-border px-3 py-1.5 text-[11px] text-muted-foreground">
        <ShieldCheck className="size-3.5 text-primary" /> Lecture seule · document protégé et filigrané à ton nom
      </p>
    </div>
  );
}

function ToolBtn({
  label,
  onClick,
  disabled,
  active,
  children,
}: {
  label: string;
  onClick: () => void;
  disabled?: boolean;
  active?: boolean;
  children: React.ReactNode;
}) {
  return (
    <Button
      type="button"
      size="icon"
      variant="ghost"
      aria-label={label}
      title={label}
      aria-pressed={active}
      disabled={disabled}
      onClick={onClick}
      className={cn(
        "size-8 rounded-lg text-white hover:bg-white/15 hover:text-white disabled:opacity-40",
        active && "bg-white/15 text-[#FFCE00]",
      )}
    >
      {children}
    </Button>
  );
}
