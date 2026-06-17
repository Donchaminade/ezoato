import { useEffect, useRef, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Download, FileText, Lock } from "lucide-react";
import { Link } from "@tanstack/react-router";
import { api } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { formatFcfa, getPrixFcfa, requiresPayment } from "@/lib/pricing";
import type { Epreuve } from "@/lib/types";

function previewPageUrl(thumbnailUrl: string, page: number): string {
  const url = new URL(thumbnailUrl, window.location.origin);
  url.searchParams.set("page", String(page));
  return url.toString();
}

function EpreuveDocumentPreview({ epreuve }: { epreuve: Epreuve }) {
  const pageCount = Math.max(1, epreuve.pages);
  const scrollRef = useRef<HTMLDivElement>(null);
  const pageRefs = useRef<(HTMLDivElement | null)[]>([]);
  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => {
    setCurrentPage(1);
    scrollRef.current?.scrollTo({ top: 0 });
  }, [epreuve.id]);

  function handleScroll() {
    const container = scrollRef.current;
    if (!container) return;
    const mid = container.scrollTop + container.clientHeight / 3;
    let page = 1;
    pageRefs.current.forEach((el, i) => {
      if (el && el.offsetTop <= mid) page = i + 1;
    });
    setCurrentPage(page);
  }

  return (
    <div className="space-y-2">
      <div
        ref={scrollRef}
        onScroll={handleScroll}
        className="mx-auto max-h-[min(70vh,440px)] w-full max-w-[300px] overflow-y-auto rounded-lg border border-border bg-muted/30 shadow-inner snap-y snap-mandatory"
      >
        {Array.from({ length: pageCount }, (_, i) => i + 1).map((page) => (
          <div
            key={page}
            ref={(el) => {
              pageRefs.current[page - 1] = el;
            }}
            data-page={page}
            className="snap-start border-b border-border/60 last:border-b-0"
          >
            <img
              src={previewPageUrl(epreuve.thumbnailUrl!, page)}
              alt={`Page ${page} — ${epreuve.titre}`}
              className="block w-full object-contain"
              loading={page === 1 ? "eager" : "lazy"}
            />
          </div>
        ))}
      </div>
      <p className="text-center text-sm tabular-nums text-muted-foreground">
        Page {currentPage} / {pageCount}
        {pageCount > 1 && (
          <span className="ml-1.5 text-xs">· faites défiler pour voir la suite</span>
        )}
      </p>
    </div>
  );
}

function PreviewPaywall({ epreuve }: { epreuve: Epreuve }) {
  const { user } = useAuth();
  const prix = getPrixFcfa(epreuve);

  return (
    <div className="grid min-h-[280px] place-items-center rounded-lg border border-dashed border-border bg-muted/40 p-8 text-center">
      <Lock className="size-10 text-muted-foreground opacity-70" />
      <p className="mt-3 font-medium">Aperçu verrouillé</p>
      <p className="mt-2 text-sm text-muted-foreground">
        Payez {formatFcfa(prix)} pour débloquer l&apos;aperçu ({epreuve.pages} pages).
      </p>
      <Button asChild className="mt-4">
        <Link to="/epreuves/$id" params={{ id: epreuve.id }}>
          {user ? "Voir la fiche et payer" : "Se connecter pour payer"}
        </Link>
      </Button>
    </div>
  );
}

export function EpreuvePreviewDialog({
  epreuve,
  open,
  onOpenChange,
}: {
  epreuve: Epreuve | null;
  open: boolean;
  onOpenChange: (v: boolean) => void;
}) {
  const { user } = useAuth();
  const isPaid = epreuve ? requiresPayment(epreuve) : false;

  const { data: access } = useQuery({
    queryKey: ["payment-access", epreuve?.id],
    queryFn: () => api.checkPaymentAccess(epreuve!.id),
    enabled: open && !!user && !!epreuve && isPaid,
  });

  const locked = isPaid && !access?.hasAccess;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle className="font-display">{epreuve?.titre}</DialogTitle>
        </DialogHeader>
        {epreuve && (
          <div className="space-y-4">
            <dl className="grid grid-cols-2 gap-x-6 gap-y-2 text-sm sm:grid-cols-3">
              <div><dt className="text-muted-foreground">Matière</dt><dd className="font-medium">{epreuve.matiere}</dd></div>
              <div><dt className="text-muted-foreground">Classe</dt><dd className="font-medium">{epreuve.classe}</dd></div>
              <div><dt className="text-muted-foreground">Année</dt><dd className="font-medium">{epreuve.annee}</dd></div>
              <div><dt className="text-muted-foreground">Type</dt><dd className="font-medium capitalize">{epreuve.type}</dd></div>
              <div><dt className="text-muted-foreground">Ville</dt><dd className="font-medium">{epreuve.ville}</dd></div>
              <div><dt className="text-muted-foreground">Lieu</dt><dd className="font-medium">{epreuve.etablissement ?? epreuve.examen ?? "—"}</dd></div>
            </dl>
            {locked ? (
              <PreviewPaywall epreuve={epreuve} />
            ) : epreuve.thumbnailUrl ? (
              <EpreuveDocumentPreview epreuve={epreuve} />
            ) : (
              <div className="grid h-72 place-items-center rounded-lg border border-dashed border-border bg-muted/40 text-muted-foreground">
                <div className="text-center">
                  <FileText className="mx-auto size-10 opacity-50" />
                  <p className="mt-2 text-sm">Aperçu — {epreuve.pages} pages</p>
                </div>
              </div>
            )}
            <div className="flex justify-end gap-2">
              <Button asChild>
                <Link to="/epreuves/$id" params={{ id: epreuve.id }}>
                  <Download className="size-4" /> {locked ? "Débloquer" : "Télécharger"}
                </Link>
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
