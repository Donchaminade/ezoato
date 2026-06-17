import { Link } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { AnimatePresence, motion } from "motion/react";
import { useEffect, useMemo, useState } from "react";
import {
  ChevronDown,
  ChevronUp,
  CreditCard,
  Download,
  HelpCircle,
  Loader2,
  Search,
  ShieldCheck,
  ThumbsDown,
  ThumbsUp,
  Upload,
  X,
} from "lucide-react";
import { toast } from "sonner";
import { ScrollReveal } from "@/components/motion/ScrollReveal";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { api } from "@/lib/api";
import { getFaqVoterId } from "@/lib/faq-voter";
import type { FaqItem } from "@/lib/types";
import { cn } from "@/lib/utils";

const CATEGORY_ICONS: Record<string, typeof HelpCircle> = {
  general: HelpCircle,
  telechargement: Download,
  paiement: CreditCard,
  contribution: Upload,
  compte: ShieldCheck,
};

function escapeRegex(s: string) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function Highlight({ text, query }: { text: string; query: string }) {
  const q = query.trim();
  if (!q) return <>{text}</>;
  const parts = text.split(new RegExp(`(${escapeRegex(q)})`, "gi"));
  return (
    <>
      {parts.map((part, i) =>
        part.toLowerCase() === q.toLowerCase() ? (
          <mark key={i} className="rounded bg-accent/40 px-0.5 text-foreground">
            {part}
          </mark>
        ) : (
          <span key={i}>{part}</span>
        ),
      )}
    </>
  );
}

function FaqVoteButtons({
  item,
  onVoted,
}: {
  item: FaqItem;
  onVoted: (yes: number, no: number, vote: boolean) => void;
}) {
  const voterId = getFaqVoterId();
  const mutation = useMutation({
    mutationFn: (helpful: boolean) =>
      api.voteFaq({ faqId: item.id, helpful, voterId }),
    onSuccess: (res) => {
      onVoted(res.helpfulYes, res.helpfulNo, res.yourVote);
      toast.success("Merci pour ton retour !");
    },
    onError: (err) => {
      toast.error(err instanceof Error ? err.message : "Vote impossible");
    },
  });

  return (
    <div className="mt-4 flex flex-wrap items-center gap-3 border-t border-border pt-4">
      <span className="text-xs text-muted-foreground">Cette réponse t'a-t-elle aidé ?</span>
      <div className="flex gap-2">
        <Button
          type="button"
          size="sm"
          variant={item.yourVote === true ? "default" : "outline"}
          disabled={mutation.isPending}
          onClick={() => mutation.mutate(true)}
          className="h-8 gap-1.5 text-xs"
        >
          {mutation.isPending ? (
            <Loader2 className="size-3.5 animate-spin" />
          ) : (
            <ThumbsUp className="size-3.5" />
          )}
          Oui ({item.helpfulYes})
        </Button>
        <Button
          type="button"
          size="sm"
          variant={item.yourVote === false ? "secondary" : "outline"}
          disabled={mutation.isPending}
          onClick={() => mutation.mutate(false)}
          className="h-8 gap-1.5 text-xs"
        >
          <ThumbsDown className="size-3.5" />
          Non ({item.helpfulNo})
        </Button>
      </div>
    </div>
  );
}

export interface FaqExplorerProps {
  /** Recherche initiale (URL) */
  initialQ?: string;
  /** Catégorie initiale (URL) */
  initialCategory?: string;
  /** Ouvrir une question par id (URL) */
  initialOpen?: string;
  /** Mode compact pour l'accueil */
  compact?: boolean;
  limit?: number;
  onSearchChange?: (q: string) => void;
  onCategoryChange?: (category: string | undefined) => void;
}

export function FaqExplorer({
  initialQ = "",
  initialCategory,
  initialOpen,
  compact = false,
  limit,
  onSearchChange,
  onCategoryChange,
}: FaqExplorerProps) {
  const voterId = getFaqVoterId();
  const queryClient = useQueryClient();
  const [qLocal, setQLocal] = useState(initialQ);
  const [debouncedQ, setDebouncedQ] = useState(initialQ);
  const [category, setCategory] = useState(initialCategory ?? "");
  const [openItems, setOpenItems] = useState<string[]>(initialOpen ? [initialOpen] : []);

  useEffect(() => setQLocal(initialQ), [initialQ]);
  useEffect(() => setDebouncedQ(initialQ), [initialQ]);
  useEffect(() => setCategory(initialCategory ?? ""), [initialCategory]);

  useEffect(() => {
    const t = setTimeout(() => {
      setDebouncedQ(qLocal);
      onSearchChange?.(qLocal);
    }, 300);
    return () => clearTimeout(t);
  }, [qLocal, onSearchChange]);

  const { data, isLoading, isFetching } = useQuery({
    queryKey: ["faq", debouncedQ, category, limit, voterId],
    queryFn: () =>
      api.getFaq({
        q: debouncedQ || undefined,
        category: category || undefined,
        limit,
        voterId,
      }),
  });

  useEffect(() => {
    if (initialOpen && data?.items.some((i) => i.id === initialOpen)) {
      setOpenItems([initialOpen]);
    }
  }, [initialOpen, data?.items]);

  const grouped = useMemo(() => {
    if (!data?.items.length) return [];
    if (category || compact) {
      return [{ label: null as string | null, items: data.items }];
    }
    const map = new Map<string, FaqItem[]>();
    for (const item of data.items) {
      const list = map.get(item.categoryLabel) ?? [];
      list.push(item);
      map.set(item.categoryLabel, list);
    }
    return Array.from(map.entries()).map(([label, items]) => ({ label, items }));
  }, [data?.items, category, compact]);

  function selectCategory(slug: string) {
    const next = category === slug ? "" : slug;
    setCategory(next);
    onCategoryChange?.(next || undefined);
  }

  function patchVote(id: string, yes: number, no: number, vote: boolean) {
    queryClient.setQueryData(
      ["faq", debouncedQ, category, limit, voterId],
      (old: typeof data) => {
        if (!old) return old;
        return {
          ...old,
          items: old.items.map((i) =>
            i.id === id ? { ...i, helpfulYes: yes, helpfulNo: no, yourVote: vote } : i,
          ),
        };
      },
    );
  }

  const allIds = data?.items.map((i) => i.id) ?? [];
  const allOpen = allIds.length > 0 && openItems.length === allIds.length;

  return (
    <div className={cn(compact ? "space-y-6" : "space-y-8")}>
      {!compact && (
        <ScrollReveal offsetY={25}>
          <div className="relative">
            <Search className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={qLocal}
              onChange={(e) => setQLocal(e.target.value)}
              placeholder="Rechercher une question… (ex. paiement, soumission, PDF)"
              className="h-12 rounded-xl border-border bg-card pl-10 pr-10 text-base shadow-soft"
            />
            {qLocal && (
              <button
                type="button"
                aria-label="Effacer"
                className="absolute top-1/2 right-3 -translate-y-1/2 rounded-md p-1 text-muted-foreground hover:bg-muted"
                onClick={() => setQLocal("")}
              >
                <X className="size-4" />
              </button>
            )}
          </div>
          {(isFetching && !isLoading) && (
            <p className="mt-2 flex items-center gap-2 text-xs text-muted-foreground">
              <Loader2 className="size-3 animate-spin" /> Mise à jour…
            </p>
          )}
        </ScrollReveal>
      )}

      {data && data.categories.length > 0 && !compact && (
        <ScrollReveal delay={0.05} offsetY={20}>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => selectCategory("")}
              className={cn(
                "rounded-full border px-4 py-2 text-sm font-medium transition",
                !category
                  ? "border-primary bg-primary text-primary-foreground"
                  : "border-border bg-card hover:border-primary/40",
              )}
            >
              Toutes ({data.totalAll})
            </button>
            {data.categories.map((cat) => {
              const Icon = CATEGORY_ICONS[cat.slug] ?? HelpCircle;
              return (
                <button
                  key={cat.slug}
                  type="button"
                  onClick={() => selectCategory(cat.slug)}
                  className={cn(
                    "inline-flex items-center gap-1.5 rounded-full border px-4 py-2 text-sm font-medium transition",
                    category === cat.slug
                      ? "border-primary bg-primary text-primary-foreground"
                      : "border-border bg-card hover:border-primary/40",
                  )}
                >
                  <Icon className="size-3.5" />
                  {cat.label}
                  <span className="opacity-70">({cat.count})</span>
                </button>
              );
            })}
          </div>
        </ScrollReveal>
      )}

      {!compact && data && data.items.length > 0 && (
        <div className="flex items-center justify-between gap-4">
          <p className="text-sm text-muted-foreground">
            <span className="font-semibold text-foreground">{data.total}</span>{" "}
            {data.total === 1 ? "résultat" : "résultats"}
            {debouncedQ && (
              <>
                {" "}pour « <span className="text-foreground">{debouncedQ}</span> »
              </>
            )}
          </p>
          <div className="flex gap-2">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="text-xs"
              onClick={() => setOpenItems(allOpen ? [] : allIds)}
            >
              {allOpen ? (
                <>
                  <ChevronUp className="size-3.5" /> Tout replier
                </>
              ) : (
                <>
                  <ChevronDown className="size-3.5" /> Tout déplier
                </>
              )}
            </Button>
          </div>
        </div>
      )}

      {isLoading ? (
        <div className="flex justify-center py-16">
          <Loader2 className="size-8 animate-spin text-primary" />
        </div>
      ) : !data?.items.length ? (
        <ScrollReveal>
          <div className="rounded-2xl border border-dashed border-border bg-card/50 px-6 py-14 text-center">
            <HelpCircle className="mx-auto size-10 text-muted-foreground/50" />
            <p className="mt-4 font-display font-semibold">Aucune question trouvée</p>
            <p className="mt-2 text-sm text-muted-foreground">
              Essaie d'autres mots-clés ou{" "}
              <Link to="/contact" className="font-medium text-primary underline-offset-4 hover:underline">
                contacte notre équipe
              </Link>
              .
            </p>
            {(debouncedQ || category) && (
              <Button
                variant="outline"
                size="sm"
                className="mt-4"
                onClick={() => {
                  setQLocal("");
                  setCategory("");
                  onSearchChange?.("");
                  onCategoryChange?.(undefined);
                }}
              >
                Réinitialiser les filtres
              </Button>
            )}
          </div>
        </ScrollReveal>
      ) : (
        <div className="space-y-8">
          <AnimatePresence mode="popLayout">
            {grouped.map((group, gi) => (
              <motion.div
                key={group.label ?? "all"}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.35, delay: gi * 0.04 }}
              >
                {group.label && !compact && (
                  <h2 className="mb-4 flex items-center gap-2 font-display text-lg font-semibold">
                    {(() => {
                      const slug = data.items.find((i) => i.categoryLabel === group.label)?.category;
                      const Icon = slug ? (CATEGORY_ICONS[slug] ?? HelpCircle) : HelpCircle;
                      return <Icon className="size-5 text-primary" />;
                    })()}
                    {group.label}
                  </h2>
                )}
                <Accordion
                  type="multiple"
                  value={openItems}
                  onValueChange={setOpenItems}
                  className="rounded-2xl border border-border bg-card px-4 shadow-soft"
                >
                  {group.items.map((item) => (
                    <AccordionItem key={item.id} value={item.id} id={`faq-${item.id}`}>
                      <AccordionTrigger className="text-left font-display hover:no-underline">
                        <span className="flex flex-1 flex-col items-start gap-1.5 pr-4">
                          {!compact && !category && group.label === null && (
                            <Badge variant="outline" className="text-[10px] font-normal">
                              {item.categoryLabel}
                            </Badge>
                          )}
                          <Highlight text={item.question} query={debouncedQ} />
                        </span>
                      </AccordionTrigger>
                      <AccordionContent>
                        <p className="leading-relaxed text-muted-foreground">
                          <Highlight text={item.answer} query={debouncedQ} />
                        </p>
                        {!compact && (
                          <FaqVoteButtons
                            item={item}
                            onVoted={(yes, no, vote) => patchVote(item.id, yes, no, vote)}
                          />
                        )}
                      </AccordionContent>
                    </AccordionItem>
                  ))}
                </Accordion>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
}
