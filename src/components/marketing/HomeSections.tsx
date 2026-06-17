import { Link } from "@tanstack/react-router";
import {
  ArrowRight,
  BookOpen,
  CreditCard,
  Download,
  GraduationCap,
  Library,
  MapPin,
  MessageCircle,
  MessageSquarePlus,
  Search,
  ShieldCheck,
  Smartphone,
  Sparkles,
  Upload,
  Wallet,
  Zap,
} from "lucide-react";
import { motion } from "motion/react";
import { InfiniteMarquee } from "@/components/motion/InfiniteMarquee";
import { WaveDivider } from "@/components/motion/WaveDivider";
import { ScrollReveal } from "@/components/motion/ScrollReveal";
import { FaqExplorer } from "@/components/faq/FaqExplorer";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { PublicMeta } from "@/lib/types";

const EXAM_TICKER = [
  "CEPD",
  "BEPC",
  "BAC I",
  "BAC II",
  "Devoirs",
  "Compositions",
  "Mathématiques",
  "Français",
  "Physique-Chimie",
  "SVT",
  "Histoire-Géo",
  "Anglais",
] as const;

const STEPS = [
  {
    icon: Search,
    title: "Cherche",
    text: "Filtre par ville, matière, établissement, classe ou examen national.",
  },
  {
    icon: BookOpen,
    title: "Consulte",
    text: "Aperçu du PDF avant téléchargement. Lisible sur mobile, prêt à imprimer.",
  },
  {
    icon: Download,
    title: "Télécharge",
    text: "Devoirs et compositions gratuits. Examens nationaux à petit prix via Mobile Money.",
  },
] as const;

const FEATURES = [
  {
    icon: Smartphone,
    title: "Pensé pour le mobile",
    text: "Interface légère, rapide sur connexion 3G/4G. Idéal entre deux cours.",
  },
  {
    icon: ShieldCheck,
    title: "Épreuves vérifiées",
    text: "Chaque document passe par une validation humaine avant publication.",
  },
  {
    icon: MapPin,
    title: "Tout le Togo",
    text: "Lomé, Kara, Sokodé, Kpalimé… des établissements de toutes les régions.",
  },
  {
    icon: GraduationCap,
    title: "Collège & lycée",
    text: "De la 6ème à la Terminale, devoirs, compositions et examens nationaux.",
  },
  {
    icon: Wallet,
    title: "Contribue & gagne",
    text: "Soumets des épreuves validées et accumule des récompenses sur ton portefeuille.",
  },
  {
    icon: Zap,
    title: "Mise à jour continue",
    text: "La communauté enrichit la bibliothèque chaque semaine avec de nouvelles épreuves.",
  },
] as const;

const TESTIMONIALS = [
  {
    quote:
      "Avant EZOA-TO, je demandais aux anciens. Maintenant je trouve les sujets du BEPC en deux minutes sur mon téléphone.",
    author: "Afi, 3ème",
    ville: "Lomé",
  },
  {
    quote:
      "Les compositions de mon lycée sont enfin accessibles. J'ai pu réviser les maths de Terminale D sans chercher partout.",
    author: "Kodjo, Terminale D",
    ville: "Kara",
  },
  {
    quote:
      "Je soumets les devoirs de ma classe et je vois ma progression vers le palier de récompense. C'est motivant !",
    author: "Esperance, 1ère",
    ville: "Sokodé",
  },
] as const;

function ExamTickerItems() {
  return (
    <>
      {EXAM_TICKER.map((label) => (
        <span
          key={label}
          className="flex shrink-0 items-center gap-2 text-sm font-medium text-secondary-foreground"
        >
          <Sparkles className="size-3.5 text-primary" />
          {label}
        </span>
      ))}
    </>
  );
}

export function HomeExamTicker() {
  return (
    <section className="relative bg-secondary py-3.5" aria-hidden>
      <InfiniteMarquee durationSec={24}>
        <ExamTickerItems />
      </InfiniteMarquee>
      <div className="absolute inset-x-0 bottom-0 translate-y-[calc(100%-1px)]">
        <WaveDivider className="text-card" shape="organic" height="md" layered backClassName="text-card/70" />
      </div>
    </section>
  );
}

export function HomeHeroCTA() {
  const ctas = [
    {
      to: "/docs",
      label: "Explorer les archives",
      icon: Library,
      variant: "primary" as const,
    },
    {
      to: "/submit",
      label: "Soumettre une épreuve",
      icon: Upload,
      variant: "glass" as const,
    },
    {
      to: "/about",
      label: "Découvrir EZOA-TO",
      icon: ArrowRight,
      variant: "outline" as const,
    },
  ];

  return (
    <div className="flex flex-col items-stretch gap-3 sm:flex-row sm:flex-wrap sm:items-center sm:justify-center">
      {ctas.map((cta, i) => {
        const Icon = cta.icon;
        return (
          <motion.div
            key={cta.to}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 + i * 0.12, duration: 0.55, ease: [0.16, 1, 0.3, 1] }}
            whileHover={{ y: -3, transition: { duration: 0.2 } }}
            whileTap={{ scale: 0.97 }}
            className="sm:flex-1 sm:max-w-[220px] lg:flex-initial lg:max-w-none"
          >
            <Link
              to={cta.to}
              className={cn(
                "tea-water-fill group flex w-full min-h-12 items-center justify-center gap-2.5 rounded-xl px-8 py-4 text-base font-semibold transition-shadow sm:min-w-[220px]",
                cta.variant === "primary" &&
                  "tea-water-default bg-primary text-primary-foreground shadow-lg shadow-primary/25 hover:shadow-xl hover:shadow-primary/35",
                cta.variant === "glass" &&
                  "tea-water-glass border border-white/25 bg-white/10 text-white backdrop-blur-md hover:text-white",
                cta.variant === "outline" &&
                  "tea-water-glass-outline border border-white/20 bg-transparent text-white/90 hover:text-white",
              )}
            >
              <Icon className="size-4 shrink-0 transition-transform group-hover:scale-110" />
              <span>{cta.label}</span>
              {cta.variant === "primary" && (
                <ArrowRight className="size-4 shrink-0 transition-transform group-hover:translate-x-0.5" />
              )}
            </Link>
          </motion.div>
        );
      })}
    </div>
  );
}

export function HomeTrustBadges() {
  const badges = [
    { icon: BookOpen, label: "Devoirs gratuits" },
    { icon: CreditCard, label: "Flooz & T-Money" },
    { icon: ShieldCheck, label: "Contenu validé" },
  ];
  return (
    <div className="mt-6 flex flex-wrap gap-3">
      {badges.map((b, i) => (
        <ScrollReveal key={b.label} delay={0.2 + i * 0.06} offsetY={20}>
          <span className="inline-flex items-center gap-2 rounded-full border border-border bg-background/80 px-3 py-1.5 text-xs font-medium text-foreground">
            <b.icon className="size-3.5 text-primary" />
            {b.label}
          </span>
        </ScrollReveal>
      ))}
    </div>
  );
}

export function HomeHowItWorks() {
  return (
    <section className="px-4 py-16 sm:px-6 sm:py-20">
      <div className="mx-auto max-w-7xl">
        <ScrollReveal className="mx-auto mb-12 max-w-2xl text-center">
          <Badge variant="outline" className="mb-4">
            Simple comme 1-2-3
          </Badge>
          <h2 className="font-display text-2xl font-bold sm:text-3xl">Comment utiliser EZOA-TO ?</h2>
          <p className="mt-2 text-muted-foreground">
            Pas besoin d'ordinateur : tout se fait depuis ton téléphone, en quelques gestes.
          </p>
        </ScrollReveal>

        <div className="relative grid gap-8 md:grid-cols-3 md:gap-6">
          <div
            className="pointer-events-none absolute top-12 right-[16%] left-[16%] hidden h-px bg-border md:block"
            aria-hidden
          />
          {STEPS.map((step, i) => (
            <ScrollReveal key={step.title} delay={i * 0.1} offsetY={40}>
              <div className="card-elevated relative p-6 text-center">
                <span className="absolute -top-3 left-1/2 grid size-7 -translate-x-1/2 place-items-center rounded-full bg-primary text-xs font-bold text-primary-foreground">
                  {i + 1}
                </span>
                <div className="mx-auto grid size-12 place-items-center rounded-xl bg-primary/10">
                  <step.icon className="size-6 text-primary" />
                </div>
                <h3 className="mt-4 font-display text-lg font-semibold">{step.title}</h3>
                <p className="mt-2 text-sm text-muted-foreground">{step.text}</p>
              </div>
            </ScrollReveal>
          ))}
        </div>
      </div>
    </section>
  );
}

export function HomeFeatures() {
  return (
    <section className="relative bg-surface px-4 py-16 sm:px-6 sm:py-20">
      <div className="absolute inset-x-0 top-0 -translate-y-[calc(100%-1px)]">
        <WaveDivider className="text-surface" shape="bold" height="md" flip layered backClassName="text-surface/60" />
      </div>
      <div className="mx-auto max-w-7xl">
        <ScrollReveal className="mb-10 max-w-2xl">
          <h2 className="font-display text-2xl font-bold sm:text-3xl">
            Pourquoi des milliers d'élèves utilisent EZOA-TO
          </h2>
          <p className="mt-2 text-muted-foreground">
            Une plateforme togolaise, par et pour la communauté scolaire.
          </p>
        </ScrollReveal>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {FEATURES.map((f, i) => (
            <ScrollReveal key={f.title} delay={i * 0.06} offsetY={35}>
              <div className="card-elevated h-full p-5">
                <f.icon className="size-5 text-primary" />
                <h3 className="mt-3 font-display font-semibold">{f.title}</h3>
                <p className="mt-1.5 text-sm text-muted-foreground">{f.text}</p>
              </div>
            </ScrollReveal>
          ))}
        </div>
      </div>
      <div className="absolute inset-x-0 bottom-0 translate-y-[calc(100%-1px)]">
        <WaveDivider className="text-background" shape="organic" height="sm" layered backClassName="text-background/70" />
      </div>
    </section>
  );
}

export function HomePricing({ meta }: { meta?: PublicMeta }) {
  const pricing = meta?.pricing;
  const prix = pricing?.prixExamenEffectif ?? pricing?.prixExamenNational ?? 100;
  const prixBarre =
    pricing?.promo?.active && pricing.prixExamenEffectif < pricing.prixExamenNational
      ? pricing.prixExamenNational
      : null;
  const epreuves = pricing?.epreuvesParRecompense ?? 50;
  const recompense = pricing?.montantRecompense ?? 1000;

  return (
    <section className="px-4 py-16 sm:px-6 sm:py-20">
      <div className="mx-auto max-w-7xl">
        <ScrollReveal className="mx-auto mb-10 max-w-2xl text-center">
          <h2 className="font-display text-2xl font-bold sm:text-3xl">Tarifs transparents</h2>
          <p className="mt-2 text-muted-foreground">
            La majorité du contenu est gratuite. Les examens nationaux financent la plateforme.
          </p>
        </ScrollReveal>

        <div className="grid gap-5 md:grid-cols-2">
          <ScrollReveal offsetY={35}>
            <div className="card-elevated h-full border-primary/20 p-6 sm:p-8">
              <Badge className="bg-secondary text-secondary-foreground">Gratuit</Badge>
              <h3 className="mt-4 font-display text-xl font-bold">Devoirs & compositions</h3>
              <p className="mt-2 text-sm text-muted-foreground">
                Télécharge sans limite les devoirs et compositions validés par la communauté.
              </p>
              <ul className="mt-5 space-y-2 text-sm">
                {["Aperçu avant téléchargement", "PDF prêt à imprimer", "Toutes les matières"].map(
                  (item) => (
                    <li key={item} className="flex items-center gap-2">
                      <span className="size-1.5 rounded-full bg-primary" />
                      {item}
                    </li>
                  ),
                )}
              </ul>
              <Button asChild className="mt-6 w-full sm:w-auto !text-white">
                <Link to="/docs">
                  <span className="inline-flex items-center justify-center gap-2">
                    Parcourir les épreuves
                  </span>
                </Link>
              </Button>
            </div>
          </ScrollReveal>

          <ScrollReveal delay={0.1} offsetY={35}>
            <div className="card-elevated h-full p-6 sm:p-8">
              <div className="flex flex-wrap items-center gap-2">
                <Badge variant="outline">À partir de {prix.toLocaleString("fr-FR")} FCFA</Badge>
                {prixBarre != null && (
                  <Badge variant="secondary" className="line-through opacity-70">
                    {prixBarre.toLocaleString("fr-FR")} FCFA
                  </Badge>
                )}
                {pricing?.promo?.active && pricing.promo.label && (
                  <Badge className="bg-primary/15 text-primary">{pricing.promo.label}</Badge>
                )}
              </div>
              <h3 className="mt-4 font-display text-xl font-bold">Examens nationaux</h3>
              <p className="mt-2 text-sm text-muted-foreground">
                CEPD, BEPC et BAC — sujets officiels archivés par année et par matière.
              </p>
              <ul className="mt-5 space-y-2 text-sm">
                {[
                  `Paiement ${prix} FCFA via Flooz ou T-Money`,
                  "Accès immédiat après paiement",
                  `Contribue : ${epreuves} validées = ${recompense.toLocaleString("fr-FR")} FCFA`,
                ].map((item) => (
                  <li key={item} className="flex items-center gap-2">
                    <span className="size-1.5 rounded-full bg-accent" />
                    {item}
                  </li>
                ))}
              </ul>
              <Button asChild variant="outline" className="mt-6 w-full sm:w-auto">
                <Link to="/contributor">
                  <span className="inline-flex items-center justify-center gap-2">
                    Devenir contributeur
                  </span>
                </Link>
              </Button>
            </div>
          </ScrollReveal>
        </div>
      </div>
    </section>
  );
}

export function HomeExplore({ meta }: { meta?: PublicMeta }) {
  const villes = meta?.villes.slice(0, 8) ?? [];
  const matieres = meta?.matieres.slice(0, 10) ?? [];

  return (
    <section className="border-y border-border bg-card/60 px-4 py-16 sm:px-6 sm:py-20">
      <div className="mx-auto max-w-7xl">
        <ScrollReveal className="mb-8 max-w-2xl">
          <h2 className="font-display text-2xl font-bold sm:text-3xl">Explore par ville ou matière</h2>
          <p className="mt-2 text-muted-foreground">
            Clique sur un tag pour lancer une recherche directement dans la bibliothèque.
          </p>
        </ScrollReveal>

        <ScrollReveal delay={0.05} offsetY={30}>
          <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Villes
          </p>
          <div className="flex flex-wrap gap-2">
            {villes.length > 0 ? (
              villes.map((v) => (
                <Link
                  key={v}
                  to="/docs"
                  search={{ ville: v } as never}
                  className="rounded-full border border-border bg-background px-4 py-2 text-sm font-medium transition hover:border-primary/40 hover:bg-primary/5"
                >
                  <MapPin className="mr-1.5 inline size-3.5 text-primary" />
                  {v}
                </Link>
              ))
            ) : (
              <span className="text-sm text-muted-foreground">Chargement des villes…</span>
            )}
          </div>
        </ScrollReveal>

        <ScrollReveal delay={0.1} offsetY={30} className="mt-8">
          <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Matières populaires
          </p>
          <div className="flex flex-wrap gap-2">
            {matieres.length > 0 ? (
              matieres.map((m) => (
                <Link
                  key={m}
                  to="/docs"
                  search={{ q: m } as never}
                  className="rounded-full border border-border bg-background px-4 py-2 text-sm font-medium transition hover:border-primary/40 hover:bg-primary/5"
                >
                  {m}
                </Link>
              ))
            ) : (
              <span className="text-sm text-muted-foreground">Chargement des matières…</span>
            )}
          </div>
        </ScrollReveal>
      </div>
    </section>
  );
}

function TestimonialCard({ quote, author, ville }: (typeof TESTIMONIALS)[number]) {
  return (
    <blockquote className="card-elevated flex h-full w-[min(85vw,20rem)] shrink-0 flex-col p-5 sm:w-80 sm:p-6">
      <MessageCircle className="size-5 text-primary/60" />
      <p className="mt-4 flex-1 text-sm leading-relaxed text-foreground">&ldquo;{quote}&rdquo;</p>
      <footer className="mt-4 border-t border-border pt-4 text-xs text-muted-foreground">
        <strong className="text-foreground">{author}</strong> · {ville}
      </footer>
    </blockquote>
  );
}

function TestimonialMarqueeItems() {
  return (
    <>
      {TESTIMONIALS.map((t) => (
        <TestimonialCard key={t.author} {...t} />
      ))}
    </>
  );
}

export function HomeTestimonials() {
  return (
    <section className="px-4 py-16 sm:px-6 sm:py-20">
      <div className="mx-auto max-w-7xl">
        <ScrollReveal className="mb-8 text-center">
          <h2 className="font-display text-2xl font-bold sm:text-3xl">Ce qu'en disent les élèves</h2>
          <p className="mt-2 text-muted-foreground">Témoignages de la communauté EZOA-TO au Togo</p>
          <div className="mt-6">
            <Button asChild className="rounded-xl !text-white">
              <Link to="/contact" search={{ sujet: "Mon témoignage EZOA-TO" }}>
                <span className="inline-flex items-center justify-center gap-2">
                  <MessageSquarePlus className="size-4" />
                  Témoigner
                </span>
              </Link>
            </Button>
          </div>
        </ScrollReveal>

        <ScrollReveal offsetY={30}>
          <InfiniteMarquee direction="ltr" durationSec={20} gapClassName="gap-5 pr-5">
            <TestimonialMarqueeItems />
          </InfiniteMarquee>
        </ScrollReveal>
      </div>
    </section>
  );
}

export function HomeFAQ() {
  return (
    <section className="border-t border-border bg-surface px-4 py-16 sm:px-6 sm:py-20">
      <div className="mx-auto max-w-3xl">
        <ScrollReveal className="mb-8 text-center">
          <h2 className="font-display text-2xl font-bold sm:text-3xl">Questions fréquentes</h2>
          <p className="mt-2 text-muted-foreground">
            Les réponses les plus demandées par la communauté.
          </p>
        </ScrollReveal>

        <FaqExplorer compact limit={4} />

        <ScrollReveal className="mt-8 text-center">
          <Button asChild variant="outline">
            <Link to="/faq">
              <span className="inline-flex items-center justify-center gap-2">
                Voir toutes les questions <ArrowRight className="size-4" />
              </span>
            </Link>
          </Button>
        </ScrollReveal>
      </div>
    </section>
  );
}
