import { Link } from "@tanstack/react-router";
import {
  ArrowRight,
  BookOpen,
  Building2,
  CheckCircle2,
  CreditCard,
  Crown,
  Download,
  FileCheck2,
  GraduationCap,
  Heart,
  HelpCircle,
  Landmark,
  Mail,
  MapPin,
  Scale,
  Search,
  ShieldCheck,
  Smartphone,
  Sparkles,
  Trophy,
  Upload,
  UserCheck,
  Users,
  Wallet,
  Zap,
} from "lucide-react";
import { InfiniteMarquee } from "@/components/motion/InfiniteMarquee";
import { ScrollReveal } from "@/components/motion/ScrollReveal";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { EZOA_BRAND } from "@/lib/branding";
import { PITCH_DECK_HREF } from "@/lib/pitch";
import { formatFcfa } from "@/lib/pricing";
import {
  SUBSCRIPTION_DURATION_MONTHS,
  SUBSCRIPTION_PRICE,
} from "@/lib/subscription-constants";
import type { PublicMeta } from "@/lib/types";

const EXAM_TYPES = [
  "Collège",
  "Lycée",
  "Université",
  "Concours",
  "CEPD",
  "BEPC",
  "BAC I",
  "BAC II",
  "Devoirs",
  "Compositions",
] as const;

const NIVEAUX = [
  {
    icon: BookOpen,
    title: "Collège",
    text: "De la 6ᵉ à la 3ᵉ : devoirs, compositions et BEPC. Le formulaire de soumission suit le parcours collège.",
  },
  {
    icon: GraduationCap,
    title: "Lycée",
    text: "Seconde à Terminale : compositions, BAC I & II, séries A, C, D… Filtre par matière et année.",
  },
  {
    icon: Landmark,
    title: "Université",
    text: "Épreuves du supérieur classées par filière et session — pour réviser avec de vrais sujets.",
  },
  {
    icon: Trophy,
    title: "Concours",
    text: "ENAM, Police, Douanes et autres concours : sujets ciblés pour les candidats motivés.",
  },
] as const;

const ARCHIVE_TYPES = [
  {
    icon: BookOpen,
    title: "Devoirs & contrôles",
    text: "Travaux de classe, interrogations et devoirs surveillés, classés par matière, classe et établissement.",
    free: true,
  },
  {
    icon: FileCheck2,
    title: "Compositions",
    text: "Compositions trimestrielles et semestrielles pour réviser dans les conditions réelles de l'examen.",
    free: true,
  },
  {
    icon: Landmark,
    title: "Examens nationaux",
    text: "CEPD, BEPC, BAC — sujets officiels archivés par année, accessibles à l'unité ou via Pro.",
    free: false,
  },
  {
    icon: Trophy,
    title: "Concours & supérieur",
    text: "Annales de concours et épreuves universitaires pour élargir la révision au-delà du secondaire.",
    free: false,
  },
] as const;

const AUDIENCES = [
  {
    icon: GraduationCap,
    title: "Élèves & candidats",
    text: "Révise avec de vrais sujets — collège, lycée, université ou concours — et télécharge un PDF lisible sur ton téléphone.",
  },
  {
    icon: Users,
    title: "Parents",
    text: "Suis la préparation de ton enfant avec des épreuves fiables, sans chercher dans des groupes WhatsApp.",
  },
  {
    icon: UserCheck,
    title: "Enseignants",
    text: "Retrouve des sujets passés pour préparer tes cours, tes évaluations ou orienter tes élèves.",
  },
  {
    icon: Upload,
    title: "Contributeurs",
    text: "Archive les épreuves de ton établissement et gagne des récompenses sur ton portefeuille EZOA-TO.",
  },
] as const;

const VALUES = [
  {
    icon: Heart,
    title: "Communautaire",
    text: "EZOA-TO est alimenté par les élèves, anciens et enseignants du Togo — pas par une multinationale.",
  },
  {
    icon: ShieldCheck,
    title: "Fiable",
    text: "Chaque document est relu par un gestionnaire avant publication. Pas de spam, pas de contenu flou.",
  },
  {
    icon: Scale,
    title: "Accessible",
    text: "La majorité des épreuves est gratuite. Les examens nationaux à petit prix financent l'archivage.",
  },
  {
    icon: Zap,
    title: "Moderne",
    text: "App mobile et site web, paiement Flooz/T-Money, expérience fluide même en 3G/4G.",
  },
] as const;

const VALIDATION_STEPS = [
  "Tu soumets des photos nettes de l'épreuve (pages complètes, sans reflet).",
  "Un PDF d'aperçu est créé automatiquement.",
  "Un gestionnaire vérifie la lisibilité et les métadonnées (matière, année, niveau…).",
  "La détection de doublons signale les similarités : le gestionnaire compare et garde la meilleure version.",
  "Une fois validée, l'épreuve est publiée et visible dans les archives.",
] as const;

const GOVERNANCE = [
  {
    role: "Visiteur",
    desc: "Consulte le catalogue, prévisualise et télécharge les épreuves gratuites.",
  },
  {
    role: "Utilisateur",
    desc: "Compte gratuit pour acheter des examens nationaux et suivre ses téléchargements.",
  },
  {
    role: "Contributeur",
    desc: "Soumet des épreuves, accumule des récompenses et demande des retraits.",
  },
  {
    role: "Gestionnaire",
    desc: "Valide les soumissions, traite les doublons détectés et assure la qualité des archives.",
  },
  {
    role: "Admin",
    desc: "Supervise la plateforme, les paiements, les retraits et les statistiques globales.",
  },
] as const;

function ExamTicker() {
  return (
    <div className="border-y border-border bg-secondary/50 py-3" aria-hidden>
      <InfiniteMarquee durationSec={24}>
        {EXAM_TYPES.map((label) => (
          <span
            key={label}
            className="flex shrink-0 items-center gap-2 text-sm font-medium text-secondary-foreground"
          >
            <Sparkles className="size-3.5 text-primary" />
            {label}
          </span>
        ))}
      </InfiniteMarquee>
    </div>
  );
}

function fmt(n: number) {
  return n.toLocaleString("fr-FR");
}

export function AboutMission() {
  return (
    <section className="px-4 py-14 sm:px-6 sm:py-18">
      <div className="mx-auto grid max-w-7xl gap-10 lg:grid-cols-2 lg:items-center lg:gap-16">
        <ScrollReveal>
          <Badge variant="outline" className="mb-4">
            Notre mission
          </Badge>
          <h2 className="font-display text-2xl font-bold sm:text-3xl">
            Préserver le passé scolaire du Togo pour préparer l&apos;avenir
          </h2>
          <p className="mt-4 text-muted-foreground leading-relaxed">
            <strong className="text-foreground">{EZOA_BRAND.fullName}</strong> ({EZOA_BRAND.name}) est une
            plateforme d&apos;archives numériques dédiée au système éducatif togolais. Nous centralisons les{" "}
            <strong className="text-foreground">devoirs, compositions, examens et concours</strong> sur quatre
            niveaux — collège, lycée, université et concours — pour que chacun puisse réviser avec des sujets
            réels, où qu&apos;il soit au Togo.
          </p>
          <p className="mt-4 text-muted-foreground leading-relaxed">
            Avant EZOA-TO, retrouver un ancien sujet du BEPC, une composition de Terminale ou une annales de
            concours passait par le bouche-à-oreille, des photocopies perdues ou des groupes dispersés.
            Aujourd&apos;hui, une recherche par niveau, ville, matière ou établissement suffit — sur mobile
            comme sur le web.
          </p>
          <p className="mt-6 font-display text-lg font-semibold text-primary">{EZOA_BRAND.slogan}</p>
          <p className="mt-1 text-sm text-muted-foreground">{EZOA_BRAND.tagline}</p>
        </ScrollReveal>

        <ScrollReveal delay={0.08} offsetY={40}>
          <div className="flag-stripe-top overflow-hidden rounded-2xl border border-border bg-card shadow-card">
            <div className="grid gap-px bg-border sm:grid-cols-2">
              {VALUES.map((v) => (
                <div key={v.title} className="bg-card p-5 sm:p-6">
                  <v.icon className="size-5 text-primary" />
                  <h3 className="mt-3 font-display font-semibold">{v.title}</h3>
                  <p className="mt-1.5 text-sm text-muted-foreground">{v.text}</p>
                </div>
              ))}
            </div>
          </div>
        </ScrollReveal>
      </div>
    </section>
  );
}

export function AboutStats({ meta }: { meta?: PublicMeta }) {
  const s = meta?.stats;
  const items = [
    { icon: FileCheck2, value: s ? fmt(s.epreuvesValidees) : "—", label: "Épreuves validées" },
    { icon: Building2, value: s ? fmt(s.etablissements) : "—", label: "Établissements" },
    { icon: Download, value: s ? fmt(s.telechargements) : "—", label: "Téléchargements" },
    { icon: Users, value: s ? fmt(s.contributeurs) : "—", label: "Contributeurs actifs" },
  ];

  return (
    <section className="border-y border-border bg-surface px-4 py-12 sm:px-6 sm:py-14">
      <div className="mx-auto max-w-7xl">
        <ScrollReveal className="mb-8 text-center">
          <h2 className="font-display text-xl font-bold sm:text-2xl">EZOA-TO en chiffres</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Des statistiques mises à jour en temps réel depuis la base d&apos;archives.
          </p>
        </ScrollReveal>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {items.map((item, i) => (
            <ScrollReveal key={item.label} delay={i * 0.06} offsetY={30}>
              <div className="card-elevated flex items-center gap-4 p-5">
                <div className="grid size-11 shrink-0 place-items-center rounded-xl bg-primary/10">
                  <item.icon className="size-5 text-primary" />
                </div>
                <div>
                  <p className="font-display text-2xl font-bold tabular-nums">{item.value}</p>
                  <p className="text-xs text-muted-foreground">{item.label}</p>
                </div>
              </div>
            </ScrollReveal>
          ))}
        </div>
      </div>
    </section>
  );
}

export function AboutArchiveTypes() {
  return (
    <>
      <ExamTicker />
      <section className="px-4 py-14 sm:px-6 sm:py-18">
        <div className="mx-auto max-w-7xl">
          <ScrollReveal className="mx-auto mb-10 max-w-2xl text-center">
            <Badge variant="outline" className="mb-4">
              Quatre niveaux
            </Badge>
            <h2 className="font-display text-2xl font-bold sm:text-3xl">Que trouve-t-on sur EZOA-TO ?</h2>
            <p className="mt-2 text-muted-foreground">
              Du collège aux concours, avec des formulaires adaptés à chaque parcours — pas seulement le secondaire.
            </p>
          </ScrollReveal>

          <div className="mb-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {NIVEAUX.map((n, i) => (
              <ScrollReveal key={n.title} delay={i * 0.05} offsetY={30}>
                <div className="card-elevated h-full p-5 text-center sm:text-left">
                  <div className="mx-auto grid size-11 place-items-center rounded-xl bg-primary/10 sm:mx-0">
                    <n.icon className="size-5 text-primary" />
                  </div>
                  <h3 className="mt-3 font-display font-semibold">{n.title}</h3>
                  <p className="mt-1.5 text-sm text-muted-foreground">{n.text}</p>
                </div>
              </ScrollReveal>
            ))}
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            {ARCHIVE_TYPES.map((t, i) => (
              <ScrollReveal key={t.title} delay={i * 0.06} offsetY={35}>
                <div className="card-elevated flex h-full gap-4 p-5 sm:p-6">
                  <div className="grid size-12 shrink-0 place-items-center rounded-xl bg-secondary/80">
                    <t.icon className="size-6 text-primary" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="font-display font-semibold">{t.title}</h3>
                      <Badge
                        variant={t.free ? "secondary" : "outline"}
                        className="text-[10px]"
                      >
                        {t.free ? "Gratuit" : "Payant"}
                      </Badge>
                    </div>
                    <p className="mt-1.5 text-sm text-muted-foreground">{t.text}</p>
                  </div>
                </div>
              </ScrollReveal>
            ))}
          </div>

          <ScrollReveal delay={0.15} className="mt-8">
            <div className="rounded-xl border border-border bg-card/80 p-5 sm:p-6">
              <p className="text-sm text-muted-foreground">
                <MapPin className="mr-1.5 inline size-4 text-primary" />
                Les épreuves sont indexées par{" "}
                <strong className="text-foreground">niveau</strong>,{" "}
                <strong className="text-foreground">ville</strong>,{" "}
                <strong className="text-foreground">établissement</strong>,{" "}
                <strong className="text-foreground">matière</strong>,{" "}
                <strong className="text-foreground">année</strong> et{" "}
                <strong className="text-foreground">type d&apos;examen</strong>. Tu peux combiner
                plusieurs filtres dans la bibliothèque.
              </p>
              <Button asChild variant="link" className="mt-2 h-auto p-0">
                <Link to="/docs">
                  Explorer les archives <ArrowRight className="size-4" />
                </Link>
              </Button>
            </div>
          </ScrollReveal>
        </div>
      </section>
    </>
  );
}

export function AboutAudiences() {
  return (
    <section className="border-y border-border bg-card/50 px-4 py-14 sm:px-6 sm:py-18">
      <div className="mx-auto max-w-7xl">
        <ScrollReveal className="mb-10 max-w-2xl">
          <h2 className="font-display text-2xl font-bold sm:text-3xl">Pour qui est EZOA-TO ?</h2>
          <p className="mt-2 text-muted-foreground">
            Une ressource ouverte à toute la communauté éducative togolaise.
          </p>
        </ScrollReveal>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {AUDIENCES.map((a, i) => (
            <ScrollReveal key={a.title} delay={i * 0.06} offsetY={35}>
              <div className="card-elevated h-full p-5 text-center sm:text-left">
                <div className="mx-auto grid size-11 place-items-center rounded-xl bg-primary/10 sm:mx-0">
                  <a.icon className="size-5 text-primary" />
                </div>
                <h3 className="mt-4 font-display font-semibold">{a.title}</h3>
                <p className="mt-2 text-sm text-muted-foreground">{a.text}</p>
              </div>
            </ScrollReveal>
          ))}
        </div>
      </div>
    </section>
  );
}

export function AboutHowItWorks() {
  return (
    <section className="px-4 py-14 sm:px-6 sm:py-18">
      <div className="mx-auto max-w-7xl">
        <ScrollReveal className="mx-auto mb-12 max-w-2xl text-center">
          <Badge variant="outline" className="mb-4">
            Deux parcours
          </Badge>
          <h2 className="font-display text-2xl font-bold sm:text-3xl">Comment fonctionne la plateforme ?</h2>
        </ScrollReveal>

        <div className="grid gap-8 lg:grid-cols-2">
          <ScrollReveal offsetY={35}>
            <div className="card-elevated h-full border-primary/15 p-6 sm:p-8">
              <div className="flex items-center gap-3">
                <div className="grid size-10 place-items-center rounded-xl bg-primary text-primary-foreground">
                  <Search className="size-5" />
                </div>
                <h3 className="font-display text-xl font-bold">Télécharger une épreuve</h3>
              </div>
              <ol className="mt-6 space-y-4">
                {[
                  "Crée un compte gratuit ou parcours en visiteur.",
                  "Cherche dans les archives (ville, matière, classe, examen…).",
                  "Prévisualise le PDF avant de télécharger.",
                  "Devoirs et compositions : téléchargement immédiat et gratuit.",
                  "Examens nationaux : paiement Mobile Money (Flooz ou T-Money), puis accès instantané.",
                ].map((text, i) => (
                  <li key={i} className="flex gap-3 text-sm">
                    <span className="grid size-6 shrink-0 place-items-center rounded-full bg-primary/12 text-xs font-bold text-primary">
                      {i + 1}
                    </span>
                    <span className="text-muted-foreground">{text}</span>
                  </li>
                ))}
              </ol>
              <Button asChild className="mt-6">
                <Link to="/docs">Voir les archives</Link>
              </Button>
            </div>
          </ScrollReveal>

          <ScrollReveal delay={0.08} offsetY={35}>
            <div className="card-elevated h-full p-6 sm:p-8">
              <div className="flex items-center gap-3">
                <div className="grid size-10 place-items-center rounded-xl bg-secondary text-secondary-foreground">
                  <Upload className="size-5" />
                </div>
                <h3 className="font-display text-xl font-bold">Contribuer & gagner</h3>
              </div>
              <ol className="mt-6 space-y-4">
                {[
                  "Photographie chaque page de l'épreuve (bien éclairée, sans coupure).",
                  "Choisis le niveau (collège, lycée, université ou concours) — le formulaire s'adapte.",
                  "Le système génère un PDF ; un gestionnaire valide et vérifie les doublons.",
                  "Chaque épreuve validée compte pour ton palier de récompense.",
                  "Retire tes gains sur ton portefeuille via Flooz ou T-Money.",
                ].map((text, i) => (
                  <li key={i} className="flex gap-3 text-sm">
                    <span className="grid size-6 shrink-0 place-items-center rounded-full bg-secondary text-xs font-bold text-secondary-foreground">
                      {i + 1}
                    </span>
                    <span className="text-muted-foreground">{text}</span>
                  </li>
                ))}
              </ol>
              <Button asChild variant="outline" className="mt-6">
                <Link to="/submit">Soumettre une épreuve</Link>
              </Button>
            </div>
          </ScrollReveal>
        </div>
      </div>
    </section>
  );
}

export function AboutValidation() {
  return (
    <section className="border-y border-border bg-surface px-4 py-14 sm:px-6 sm:py-18">
      <div className="mx-auto max-w-7xl">
        <div className="grid gap-10 lg:grid-cols-2 lg:items-start">
          <ScrollReveal>
            <Badge variant="outline" className="mb-4">
              Qualité & modération
            </Badge>
            <h2 className="font-display text-2xl font-bold sm:text-3xl">
              Chaque épreuve est vérifiée par un humain
            </h2>
            <p className="mt-4 text-muted-foreground leading-relaxed">
              EZOA-TO n&apos;accepte pas le contenu brut sans contrôle. Notre équipe de gestionnaires s&apos;assure
              que les documents sont lisibles, correctement classés et utiles à la communauté. Une{" "}
              <strong className="text-foreground">détection de doublons</strong> aide à comparer les
              soumissions similaires et à conserver la meilleure version — moins de bruit dans les archives.
            </p>
            <ul className="mt-6 space-y-3">
              {[
                "Refus des photos floues, coupées ou illisibles",
                "Vérification des métadonnées (matière, année, niveau)",
                "Alertes de similarité et comparaison avant validation",
                "Signalement possible via la page contact",
              ].map((item) => (
                <li key={item} className="flex items-start gap-2 text-sm">
                  <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-primary" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </ScrollReveal>

          <ScrollReveal delay={0.08} offsetY={35}>
            <div className="relative space-y-0">
              {VALIDATION_STEPS.map((step, i) => (
                <div key={i} className="relative flex gap-4 pb-8 last:pb-0">
                  {i < VALIDATION_STEPS.length - 1 && (
                    <span
                      className="absolute top-8 left-[15px] h-[calc(100%-8px)] w-px bg-border"
                      aria-hidden
                    />
                  )}
                  <span className="relative z-10 grid size-8 shrink-0 place-items-center rounded-full bg-primary text-xs font-bold text-primary-foreground">
                    {i + 1}
                  </span>
                  <p className="pt-1 text-sm text-muted-foreground">{step}</p>
                </div>
              ))}
            </div>
          </ScrollReveal>
        </div>
      </div>
    </section>
  );
}

export function AboutPricing({ meta }: { meta?: PublicMeta }) {
  const pricing = meta?.pricing;
  const prix = pricing?.prixExamenEffectif ?? pricing?.prixExamenNational ?? 100;
  const epreuves = pricing?.epreuvesParRecompense ?? 50;
  const recompense = pricing?.montantRecompense ?? 1000;
  const minRetrait = pricing?.minRetrait ?? 2000;

  return (
    <section className="px-4 py-14 sm:px-6 sm:py-18">
      <div className="mx-auto max-w-7xl">
        <ScrollReveal className="mx-auto mb-10 max-w-2xl text-center">
          <h2 className="font-display text-2xl font-bold sm:text-3xl">Tarifs & récompenses</h2>
          <p className="mt-2 text-muted-foreground">
            Transparence totale : tu sais exactement ce qui est gratuit, ce qui se paie à l&apos;unité,
            et ce que couvre l&apos;abonnement Pro.
          </p>
        </ScrollReveal>

        <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
          <ScrollReveal offsetY={35}>
            <div className="card-elevated h-full border-primary/20 p-6">
              <Badge className="bg-secondary text-secondary-foreground">0 FCFA</Badge>
              <h3 className="mt-4 font-display text-lg font-bold">Devoirs & compositions</h3>
              <p className="mt-2 text-sm text-muted-foreground">
                Téléchargement illimité après prévisualisation. Aucun compte requis pour parcourir.
              </p>
            </div>
          </ScrollReveal>

          <ScrollReveal delay={0.05} offsetY={35}>
            <div className="card-elevated h-full p-6">
              <Badge variant="outline">
                <CreditCard className="mr-1 size-3" />
                {formatFcfa(prix)}
              </Badge>
              <h3 className="mt-4 font-display text-lg font-bold">À l&apos;unité</h3>
              <p className="mt-2 text-sm text-muted-foreground">
                Examens nationaux et contenus payants — paiement unique via Flooz ou T-Money, accès immédiat.
              </p>
            </div>
          </ScrollReveal>

          <ScrollReveal delay={0.1} offsetY={35}>
            <div className="card-elevated h-full border-primary/25 p-6">
              <Badge variant="outline">
                <Crown className="mr-1 size-3" />
                Pro
              </Badge>
              <h3 className="mt-4 font-display text-lg font-bold">Abonnement Pro</h3>
              <p className="mt-2 text-sm text-muted-foreground">
                <strong className="text-foreground">
                  {formatFcfa(SUBSCRIPTION_PRICE)} / {SUBSCRIPTION_DURATION_MONTHS} mois
                </strong>{" "}
                — accès illimité aux épreuves payantes. Un micropaiement pensé pour les familles.
              </p>
              <Button asChild variant="link" className="mt-3 h-auto p-0">
                <Link to="/account/abonnement">Découvrir Pro</Link>
              </Button>
            </div>
          </ScrollReveal>

          <ScrollReveal delay={0.15} offsetY={35}>
            <div className="card-elevated h-full p-6">
              <Badge variant="outline">
                <Wallet className="mr-1 size-3" />
                Contributeur
              </Badge>
              <h3 className="mt-4 font-display text-lg font-bold">Récompenses</h3>
              <p className="mt-2 text-sm text-muted-foreground">
                <strong className="text-foreground">{epreuves} épreuves validées</strong> ={" "}
                <strong className="text-foreground">{formatFcfa(recompense)}</strong> sur ton portefeuille.
                Retrait dès <strong className="text-foreground">{formatFcfa(minRetrait)}</strong>.
              </p>
              <Button asChild variant="link" className="mt-3 h-auto p-0">
                <Link to="/contributor">Espace contributeur</Link>
              </Button>
            </div>
          </ScrollReveal>
        </div>
      </div>
    </section>
  );
}

export function AboutGovernance() {
  return (
    <section className="border-y border-border bg-card/50 px-4 py-14 sm:px-6 sm:py-18">
      <div className="mx-auto max-w-7xl">
        <ScrollReveal className="mb-10 max-w-2xl">
          <h2 className="font-display text-2xl font-bold sm:text-3xl">Rôles sur la plateforme</h2>
          <p className="mt-2 text-muted-foreground">
            Un écosystème structuré pour garantir qualité, sécurité et équité.
          </p>
        </ScrollReveal>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {GOVERNANCE.map((g, i) => (
            <ScrollReveal key={g.role} delay={i * 0.04} offsetY={25}>
              <div className="rounded-xl border border-border bg-background p-4">
                <p className="font-display font-semibold text-primary">{g.role}</p>
                <p className="mt-1 text-sm text-muted-foreground">{g.desc}</p>
              </div>
            </ScrollReveal>
          ))}
        </div>
      </div>
    </section>
  );
}

export function AboutTechnology() {
  return (
    <section className="px-4 py-14 sm:px-6 sm:py-18">
      <div className="mx-auto max-w-7xl">
        <div className="grid gap-10 lg:grid-cols-2 lg:items-center">
          <ScrollReveal>
            <Badge variant="outline" className="mb-4">
              Technologie
            </Badge>
            <h2 className="font-display text-2xl font-bold sm:text-3xl">
              Mobile et web, partout au Togo
            </h2>
            <p className="mt-4 text-muted-foreground leading-relaxed">
              EZOA-TO existe en <strong className="text-foreground">application mobile</strong> et sur le{" "}
              <strong className="text-foreground">web</strong>. Tu cherches, télécharges et contribues depuis
              ton téléphone ou un navigateur — interface légère, pensée pour les connexions 3G/4G.
            </p>
            <ul className="mt-6 space-y-3">
              {[
                { icon: Smartphone, text: "App mobile + site web synchronisés" },
                { icon: Search, text: "Filtres par niveau, matière, ville et concours" },
                { icon: CreditCard, text: "Paiements Flooz et T-Money intégrés" },
                { icon: Download, text: "PDF générés automatiquement, prêts à imprimer" },
              ].map((item) => (
                <li key={item.text} className="flex items-center gap-3 text-sm">
                  <item.icon className="size-4 shrink-0 text-primary" />
                  <span>{item.text}</span>
                </li>
              ))}
            </ul>
          </ScrollReveal>

          <ScrollReveal delay={0.08} offsetY={40}>
            <div className="flag-stripe-top rounded-2xl border border-border bg-card p-6 shadow-card sm:p-8">
              <h3 className="font-display text-lg font-bold">Couverture géographique</h3>
              <p className="mt-2 text-sm text-muted-foreground">
                Lomé, Kara, Sokodé, Kpalimé, Atakpamé, Dapaong et bien d&apos;autres villes sont représentées.
                La bibliothèque s&apos;enrichit chaque semaine grâce aux contributions locales.
              </p>
              <div className="mt-6 flex flex-wrap gap-2">
                {["Lomé", "Kara", "Sokodé", "Kpalimé", "Tsévié", "Dapaong"].map((ville) => (
                  <Link
                    key={ville}
                    to="/docs"
                    search={{ ville } as never}
                    className="rounded-full border border-border bg-background px-3 py-1.5 text-xs font-medium transition hover:border-primary/40 hover:bg-primary/5"
                  >
                    <MapPin className="mr-1 inline size-3 text-primary" />
                    {ville}
                  </Link>
                ))}
              </div>
            </div>
          </ScrollReveal>
        </div>
      </div>
    </section>
  );
}

export function AboutCTA() {
  return (
    <section className="border-t border-border bg-surface px-4 py-14 sm:px-6 sm:py-18">
      <div className="mx-auto max-w-4xl">
        <ScrollReveal>
          <div className="flag-stripe-top overflow-hidden rounded-2xl border border-border bg-card p-8 text-center shadow-card sm:p-10">
            <h2 className="font-display text-2xl font-bold sm:text-3xl">
              Prêt à rejoindre la communauté EZOA-TO ?
            </h2>
            <p className="mx-auto mt-3 max-w-lg text-muted-foreground">
              Que tu cherches un sujet du BEPC, une annales de concours ou que tu veuilles archiver les
              épreuves de ton établissement — EZOA-TO est fait pour toi.
            </p>
            <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
              <Button asChild size="lg">
                <Link to="/docs">
                  <Search className="size-4" />
                  Parcourir les archives
                </Link>
              </Button>
              <Button asChild size="lg" variant="outline">
                <Link to="/submit">
                  <Upload className="size-4" />
                  Contribuer
                </Link>
              </Button>
            </div>
            <div className="mt-8 flex flex-wrap items-center justify-center gap-4 text-sm">
              <Link
                to="/faq"
                className="inline-flex items-center gap-1.5 text-muted-foreground transition hover:text-primary"
              >
                <HelpCircle className="size-4" />
                FAQ
              </Link>
              <span className="text-border" aria-hidden>
                ·
              </span>
              <Link
                to="/partenariat"
                className="inline-flex items-center gap-1.5 text-muted-foreground transition hover:text-primary"
              >
                <Heart className="size-4" />
                Sponsoriser
              </Link>
              <span className="text-border" aria-hidden>
                ·
              </span>
              <a
                href={PITCH_DECK_HREF}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 text-muted-foreground transition hover:text-primary"
              >
                Pitch
              </a>
              <span className="text-border" aria-hidden>
                ·
              </span>
              <Link
                to="/contact"
                className="inline-flex items-center gap-1.5 text-muted-foreground transition hover:text-primary"
              >
                <Mail className="size-4" />
                Contact
              </Link>
            </div>
          </div>
        </ScrollReveal>
      </div>
    </section>
  );
}
