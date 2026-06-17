import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { z } from "zod";
import { Search, Filter, ChevronLeft, ChevronRight, X, Library } from "lucide-react";
import { PageHero } from "@/components/layout/PageHero";
import { PageHeroBadge } from "@/components/layout/PageHeroBadge";
import { PublicLayout } from "@/components/layout/PublicLayout";
import { ScrollReveal } from "@/components/motion/ScrollReveal";
import { EpreuveCard } from "@/components/epreuves/EpreuveCard";
import { EpreuvePreviewDialog } from "@/components/epreuves/EpreuvePreviewDialog";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Sheet, SheetContent, SheetTrigger, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { ArchivesEmptyState } from "@/components/catalog/ArchivesEmptyState";
import { EZOA_BRAND } from "@/lib/branding";
import { api } from "@/lib/api";
import type { Epreuve } from "@/lib/types";

const search = z.object({
  q: z.string().optional(),
  ville: z.string().optional(),
  matiere: z.string().optional(),
  niveau: z.enum(["college", "lycee"]).optional(),
  type: z.enum(["devoir", "composition", "examen"]).optional(),
  examen: z.string().optional(),
  annee: z.coerce.number().optional(),
  page: z.coerce.number().min(1).default(1),
});

export const Route = createFileRoute("/docs")({
  validateSearch: search,
  head: () => ({
    meta: [
      { title: "Archives — EZOA-TO" },
      { name: "description", content: "Catalogue complet des épreuves scolaires du Togo. Recherche, filtres, aperçu et téléchargement." },
    ],
  }),
  component: DocsPage,
});

const PER_PAGE = 50;

function DocsPage() {
  const s = Route.useSearch();
  const navigate = Route.useNavigate();
  const [qLocal, setQLocal] = useState(s.q ?? "");
  const [preview, setPreview] = useState<Epreuve | null>(null);

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ["epreuves", "list", s],
    queryFn: () => api.listEpreuves({ ...s, perPage: PER_PAGE }),
    retry: 1,
  });
  const { data: meta } = useQuery({
    queryKey: ["meta"],
    queryFn: () => api.getMeta(),
  });
  const VILLES = meta?.villes ?? [];
  const MATIERES = meta?.matieres ?? [];

  function setParam<K extends keyof typeof s>(k: K, v: (typeof s)[K] | undefined) {
    navigate({ search: (prev: typeof s) => ({ ...prev, [k]: v, page: 1 }) as never });
  }
  function setPage(p: number) {
    navigate({ search: (prev: typeof s) => ({ ...prev, page: p }) as never });
  }

  function reset() {
    navigate({ search: { page: 1 } as never });
    setQLocal("");
  }

  const total = data?.total ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / PER_PAGE));
  const activeFilters = [s.ville, s.matiere, s.niveau, s.type, s.examen, s.annee].filter(Boolean).length;
  const hasSearchOrFilters = activeFilters > 0 || Boolean(s.q);
  const catalogEmpty = !isLoading && !isError && total === 0;

  const Filters = (
    <div className="space-y-4">
      <div>
        <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-muted-foreground">Ville</label>
        <Select value={s.ville ?? "all"} onValueChange={(v) => setParam("ville", v === "all" ? undefined : v)}>
          <SelectTrigger><SelectValue placeholder="Toutes" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Toutes les villes</SelectItem>
            {VILLES.map((v) => <SelectItem key={v} value={v}>{v}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>
      <div>
        <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-muted-foreground">Matière</label>
        <Select value={s.matiere ?? "all"} onValueChange={(v) => setParam("matiere", v === "all" ? undefined : v)}>
          <SelectTrigger><SelectValue placeholder="Toutes" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Toutes les matières</SelectItem>
            {MATIERES.map((m) => <SelectItem key={m} value={m}>{m}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>
      <div>
        <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-muted-foreground">Niveau</label>
        <Select value={s.niveau ?? "all"} onValueChange={(v) => setParam("niveau", v === "all" ? undefined : (v as "college" | "lycee"))}>
          <SelectTrigger><SelectValue placeholder="Tous" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tous</SelectItem>
            <SelectItem value="college">Collège</SelectItem>
            <SelectItem value="lycee">Lycée</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div>
        <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-muted-foreground">Type</label>
        <Select value={s.type ?? "all"} onValueChange={(v) => setParam("type", v === "all" ? undefined : (v as "devoir" | "composition" | "examen"))}>
          <SelectTrigger><SelectValue placeholder="Tous" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tous</SelectItem>
            <SelectItem value="devoir">Devoir</SelectItem>
            <SelectItem value="composition">Composition</SelectItem>
            <SelectItem value="examen">Examen national</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div>
        <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-muted-foreground">Examen</label>
        <Select value={s.examen ?? "all"} onValueChange={(v) => setParam("examen", v === "all" ? undefined : v)}>
          <SelectTrigger><SelectValue placeholder="Tous" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tous</SelectItem>
            <SelectItem value="CEPD">CEPD</SelectItem>
            <SelectItem value="BEPC">BEPC</SelectItem>
            <SelectItem value="BAC1">BAC I</SelectItem>
            <SelectItem value="BAC2">BAC II</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div>
        <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-muted-foreground">Année</label>
        <Select value={s.annee ? String(s.annee) : "all"} onValueChange={(v) => setParam("annee", v === "all" ? undefined : Number(v))}>
          <SelectTrigger><SelectValue placeholder="Toutes" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Toutes</SelectItem>
            {[2024, 2023, 2022, 2021, 2020].map((y) => <SelectItem key={y} value={String(y)}>{y}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>
      {activeFilters > 0 && (
        <Button variant="ghost" size="sm" onClick={reset} className="w-full">
          <X className="size-4" /> Réinitialiser
        </Button>
      )}
    </div>
  );

  return (
    <PublicLayout>
      <PageHero
        badge={<PageHeroBadge icon={Library}>Bibliothèque nationale</PageHeroBadge>}
        title={<>Archives {EZOA_BRAND.name}</>}
        description={
          isLoading
            ? "Chargement des épreuves…"
            : isError
              ? "Les archives sont momentanément indisponibles."
              : `${total} épreuve${total !== 1 ? "s" : ""} validée${total !== 1 ? "s" : ""} — ${EZOA_BRAND.tagline}`
        }
        primaryImage="hero"
      >
        <form
          onSubmit={(e) => { e.preventDefault(); setParam("q", qLocal || undefined); }}
          className="flex flex-col items-stretch gap-2 sm:flex-row"
        >
          <div className="flex flex-1 items-center gap-2 rounded-xl border border-border bg-card px-3 shadow-soft">
            <Search className="size-4 text-muted-foreground" />
            <input
              value={qLocal}
              onChange={(e) => setQLocal(e.target.value)}
              placeholder="Recherche : ville, établissement, année…"
              className="w-full bg-transparent py-3 text-sm outline-none"
            />
          </div>
          <Button type="submit">Rechercher</Button>
          <Sheet>
            <SheetTrigger asChild>
              <Button type="button" variant="outline" className="sm:hidden">
                <Filter className="size-4" /> Filtres
                {activeFilters > 0 && (
                  <span className="ml-1 rounded-full bg-primary px-1.5 text-xs text-primary-foreground">
                    {activeFilters}
                  </span>
                )}
              </Button>
            </SheetTrigger>
            <SheetContent side="left">
              <SheetHeader><SheetTitle>Filtres</SheetTitle></SheetHeader>
              <div className="mt-4">{Filters}</div>
            </SheetContent>
          </Sheet>
        </form>
      </PageHero>

      <section className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
        <div className="grid gap-8 lg:grid-cols-[260px_1fr]">
          <aside className="hidden lg:block">
            <div className="sticky top-24 rounded-xl border border-border bg-card p-5">
              <h2 className="mb-4 font-display text-sm font-semibold uppercase tracking-wider">Filtres</h2>
              {Filters}
            </div>
          </aside>

          <div>
            {isLoading && (
              <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
                {Array.from({ length: 6 }).map((_, i) => (
                  <div key={i} className="h-48 animate-pulse rounded-xl bg-muted" />
                ))}
              </div>
            )}
            {!isLoading && isError && (
              <ArchivesEmptyState variant="error" onRetry={() => refetch()} />
            )}
            {!isLoading && !isError && catalogEmpty && !hasSearchOrFilters && (
              <ArchivesEmptyState variant="empty" />
            )}
            {!isLoading && !isError && catalogEmpty && hasSearchOrFilters && (
              <ArchivesEmptyState variant="no-results" onReset={reset} />
            )}
            {!isLoading && !isError && !catalogEmpty && data?.items.length === 0 && (
              <ArchivesEmptyState variant="no-results" onReset={reset} />
            )}
            {!isLoading && !isError && data && data.items.length > 0 && (
              <>
                <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
                  {data.items.map((ep, i) => (
                    <ScrollReveal key={ep.id} delay={(i % 6) * 0.06} offsetY={40}>
                      <EpreuveCard epreuve={ep} onPreview={setPreview} />
                    </ScrollReveal>
                  ))}
                </div>
                <Pagination current={s.page} total={totalPages} onChange={setPage} />
              </>
            )}
          </div>
        </div>
      </section>

      <EpreuvePreviewDialog
        epreuve={preview}
        open={!!preview}
        onOpenChange={(v) => !v && setPreview(null)}
      />
    </PublicLayout>
  );
}

function Pagination({ current, total, onChange }: { current: number; total: number; onChange: (p: number) => void }) {
  if (total <= 1) return null;
  const pages: (number | "…")[] = [];
  const push = (n: number | "…") => pages.push(n);
  push(1);
  if (current > 3) push("…");
  for (let p = Math.max(2, current - 1); p <= Math.min(total - 1, current + 1); p++) push(p);
  if (current < total - 2) push("…");
  if (total > 1) push(total);

  return (
    <nav className="mt-10 flex items-center justify-center gap-1.5">
      <Button variant="outline" size="icon" disabled={current === 1} onClick={() => onChange(current - 1)}>
        <ChevronLeft className="size-4" />
      </Button>
      {pages.map((p, i) =>
        p === "…" ? (
          <span key={`e${i}`} className="px-2 text-sm text-muted-foreground">…</span>
        ) : (
          <Button
            key={p}
            variant={p === current ? "default" : "outline"}
            size="sm"
            className="min-w-9"
            onClick={() => onChange(p)}
          >
            {p}
          </Button>
        )
      )}
      <Button variant="outline" size="icon" disabled={current === total} onClick={() => onChange(current + 1)}>
        <ChevronRight className="size-4" />
      </Button>
    </nav>
  );
}
