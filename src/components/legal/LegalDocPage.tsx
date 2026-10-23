import { FileText, Mail } from "lucide-react";
import { Fragment } from "react";
import { LegalSection } from "@/components/legal/LegalSection";
import { PageHero } from "@/components/layout/PageHero";
import { PageHeroBadge } from "@/components/layout/PageHeroBadge";
import { PublicLayout } from "@/components/layout/PublicLayout";
import { ScrollReveal } from "@/components/motion/ScrollReveal";
import { Button } from "@/components/ui/button";
import legal from "@/content/legal.json";

export type LegalSlug =
  | "cgu"
  | "confidentialite"
  | "mentions-legales"
  | "conditions-de-vente"
  | "charte-contributeurs"
  | "cookies";

type Block = { p?: string; list?: string[] };
type LegalDoc = {
  slug: string;
  title: string;
  short: string;
  description: string;
  updated: string;
  sections: { id: string; title: string; blocks: Block[] }[];
};

export const LEGAL_DOCS = legal as LegalDoc[];

export function getLegalDoc(slug: LegalSlug): LegalDoc {
  return LEGAL_DOCS.find((d) => d.slug === slug)!;
}

export function legalHead(slug: LegalSlug) {
  const d = getLegalDoc(slug);
  return {
    meta: [
      { title: `${d.title} — EZOA-TO` },
      { name: "description", content: d.description },
      { property: "og:title", content: `${d.title} — EZOA-TO` },
      { property: "og:description", content: d.description },
    ],
    links: [{ rel: "canonical", href: `https://ezoato.vercel.app/${d.slug}` }],
  };
}

/** Met en évidence les mentions « [À compléter : …] ». */
function Rich({ text }: { text: string }) {
  const parts = text.split(/(\[À compléter : [^\]]+\])/g);
  return (
    <>
      {parts.map((part, i) =>
        part.startsWith("[À compléter") ? (
          <mark key={i} className="rounded bg-accent/25 px-1 text-foreground">
            {part}
          </mark>
        ) : (
          <Fragment key={i}>{part}</Fragment>
        ),
      )}
    </>
  );
}

export function LegalDocPage({ slug }: { slug: LegalSlug }) {
  const d = getLegalDoc(slug);
  return (
    <PublicLayout>
      <PageHero
        badge={<PageHeroBadge icon={FileText}>Légal</PageHeroBadge>}
        title={d.title}
        description={d.description}
        primaryImage="group"
        compact
      />
      <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6 sm:py-14">
        <ScrollReveal offsetY={24}>
          <p className="rounded-xl border border-border bg-muted/40 px-4 py-3 text-sm text-muted-foreground">
            <span className="font-medium text-foreground">Dernière mise à jour :</span> {d.updated}
          </p>
        </ScrollReveal>

        <ScrollReveal offsetY={24} className="mt-8">
          <nav aria-label="Sommaire" className="rounded-2xl border border-border bg-card p-5 sm:p-6">
            <h2 className="font-display text-lg font-semibold">Sommaire</h2>
            <ol className="mt-4 grid gap-2 text-sm sm:grid-cols-2">
              {d.sections.map((s) => (
                <li key={s.id}>
                  <a href={`#${s.id}`} className="text-muted-foreground transition hover:text-primary hover:underline">
                    {s.title}
                  </a>
                </li>
              ))}
            </ol>
          </nav>
        </ScrollReveal>

        <div className="mt-12 space-y-12">
          {d.sections.map((s) => (
            <ScrollReveal key={s.id} offsetY={32}>
              <LegalSection id={s.id} title={s.title}>
                {s.blocks.map((b, i) =>
                  b.list ? (
                    <ul key={i} className="list-disc space-y-2 pl-5 marker:text-primary/70">
                      {b.list.map((item) => (
                        <li key={item}><Rich text={item} /></li>
                      ))}
                    </ul>
                  ) : (
                    <p key={i}><Rich text={b.p ?? ""} /></p>
                  ),
                )}
              </LegalSection>
            </ScrollReveal>
          ))}

          <nav aria-label="Autres documents légaux" className="rounded-2xl border border-border bg-card p-5 sm:p-6">
            <h2 className="font-display text-lg font-semibold">Autres documents</h2>
            <ul className="mt-4 flex flex-wrap gap-2 text-sm">
              {LEGAL_DOCS.filter((o) => o.slug !== d.slug).map((o) => (
                <li key={o.slug}>
                  <a href={`/${o.slug}`} className="inline-block rounded-full border border-border px-3 py-1 text-muted-foreground transition hover:border-primary hover:text-primary">
                    {o.short}
                  </a>
                </li>
              ))}
            </ul>
            <Button asChild className="mt-5 rounded-xl">
              <a href="/contact">
                <Mail className="size-4" /> Contacter EZOA-TO
              </a>
            </Button>
          </nav>
        </div>
      </div>
    </PublicLayout>
  );
}
