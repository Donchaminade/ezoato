import type { ReactNode } from "react";
import { Link } from "@tanstack/react-router";
import {
  BookOpen,
  CircleHelp,
  Gift,
  Home,
  ShieldCheck,
  Smartphone,
  Sparkles,
  Upload,
  Users,
  Wallet,
} from "lucide-react";
import { EzoaLogo } from "@/components/branding/EzoaLogo";
import { ThemeToggle } from "@/components/theme/ThemeToggle";
import { EZOA_BRAND } from "@/lib/branding";

const LOGIN_FEATURES = [
  {
    icon: BookOpen,
    title: "Archives & téléchargements",
    text: "Consulte devoirs, compositions et examens nationaux du Togo.",
  },
  {
    icon: Upload,
    title: "Soumettre des épreuves",
    text: "Partage les épreuves de ton établissement et aide la communauté.",
  },
  {
    icon: Wallet,
    title: "Portefeuille contributeur",
    text: "Accumule des récompenses et retire via Flooz ou T-Money.",
  },
  {
    icon: ShieldCheck,
    title: "Contenu validé",
    text: "Chaque document est vérifié avant publication sur EZOA-TO.",
  },
] as const;

const REGISTER_FEATURES = [
  {
    icon: Gift,
    title: "100 % gratuit",
    text: "Crée ton compte sans frais et accède aux devoirs gratuits.",
  },
  {
    icon: Upload,
    title: "Contribue & gagne",
    text: "Soumets des épreuves validées et reçois des récompenses.",
  },
  {
    icon: Smartphone,
    title: "Pensé pour le mobile",
    text: "Révise et télécharge directement depuis ton téléphone.",
  },
  {
    icon: Users,
    title: "Communauté active",
    text: "Rejoins des élèves et établissements de tout le Togo.",
  },
] as const;

type AuthVariant = "login" | "register";

type AuthSplitLayoutProps = {
  variant?: AuthVariant;
  title: string;
  subtitle?: string;
  children: ReactNode;
  footer?: ReactNode;
};

const PANEL_COPY: Record<
  AuthVariant,
  {
    heading: string;
    description: string;
    features: typeof LOGIN_FEATURES | typeof REGISTER_FEATURES;
  }
> = {
  login: {
    heading: "Bienvenue sur ton espace EZOA-TO",
    description: `${EZOA_BRAND.slogan} — retrouve tes archives, soumissions et ton portefeuille en un clic.`,
    features: LOGIN_FEATURES,
  },
  register: {
    heading: "Rejoins la communauté EZOA-TO",
    description:
      "Un compte gratuit pour consulter les archives, soumettre des épreuves et suivre ta progression contributeur.",
    features: REGISTER_FEATURES,
  },
};

export function AuthSplitLayout({
  variant = "login",
  title,
  subtitle,
  children,
  footer,
}: AuthSplitLayoutProps) {
  const panel = PANEL_COPY[variant];

  return (
    <div className="flex min-h-svh items-center justify-center bg-muted/40 px-4 py-8 sm:px-6">
      <div className="relative w-full max-w-5xl overflow-hidden rounded-3xl border border-border/60 bg-card shadow-2xl shadow-black/10">
        <div className="grid lg:grid-cols-2">
          <div className="flex flex-col justify-between p-8 sm:p-10 lg:min-h-[680px] lg:p-12">
            <div>
              <div className="flex items-start justify-between gap-4">
                <Link to="/" className="inline-flex items-center gap-3">
                  <EzoaLogo className="h-10 sm:h-11" />
                </Link>
                <div className="flex shrink-0 items-center gap-1">
                  <ThemeToggle className="text-foreground hover:bg-muted" />
                  <Link
                    to="/"
                    className="inline-flex items-center gap-1.5 rounded-xl border border-border bg-background px-3.5 py-2 text-sm font-semibold text-foreground shadow-sm transition hover:bg-muted"
                  >
                    <Home className="size-4 shrink-0" />
                    Accueil
                  </Link>
                </div>
              </div>
              <p className="mt-2 text-sm font-medium text-primary">{EZOA_BRAND.fullName}</p>
              <p className="text-xs text-muted-foreground">{EZOA_BRAND.tagline}</p>

              <h1 className="mt-8 font-display text-2xl font-bold tracking-tight text-foreground sm:text-[1.65rem]">
                {title}
              </h1>
              <div className="mt-2 h-1 w-12 rounded-full bg-primary" aria-hidden />
              {subtitle && (
                <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{subtitle}</p>
              )}

              <div className="mt-8">{children}</div>
            </div>

            {footer ?? (
              <p className="mt-10 hidden items-center gap-2 text-xs text-muted-foreground lg:flex">
                <ShieldCheck className="size-3.5 shrink-0 text-primary/70" />
                Zone sécurisée — Accès réservé aux membres EZOA-TO
              </p>
            )}
          </div>

          <div
            className={
              variant === "register"
                ? "relative hidden overflow-hidden bg-gradient-to-br from-primary via-primary to-primary/90 p-10 text-primary-foreground lg:flex lg:flex-col lg:justify-between lg:p-12"
                : "relative hidden overflow-hidden bg-primary p-10 text-primary-foreground lg:flex lg:flex-col lg:justify-between lg:p-12"
            }
          >
            <div
              className="pointer-events-none absolute -right-16 -top-16 size-56 rounded-full bg-white/10"
              aria-hidden
            />
            <div
              className="pointer-events-none absolute -bottom-20 -left-10 size-72 rounded-full bg-white/8"
              aria-hidden
            />
            <div
              className="pointer-events-none absolute right-1/4 top-1/3 size-32 rounded-full bg-white/6"
              aria-hidden
            />

            <div className="relative z-10">
              {variant === "register" && (
                <span className="mb-4 inline-flex items-center gap-1.5 rounded-full bg-tg-yellow px-3 py-1 text-[11px] font-bold uppercase tracking-wider text-tg-ink">
                  <Sparkles className="size-3" />
                  Inscription gratuite
                </span>
              )}
              <h2 className="font-display text-2xl font-bold leading-tight sm:text-3xl">
                {panel.heading}
              </h2>
              <p className="mt-3 max-w-sm text-sm leading-relaxed text-primary-foreground/85">
                {panel.description}
              </p>

              <ul className="mt-10 space-y-5">
                {panel.features.map((f) => {
                  const Icon = f.icon;
                  return (
                    <li key={f.title} className="flex gap-4">
                      <span className="grid size-11 shrink-0 place-items-center rounded-xl bg-white/15 backdrop-blur-sm">
                        <Icon className="size-5" />
                      </span>
                      <div>
                        <p className="font-semibold">{f.title}</p>
                        <p className="mt-0.5 text-sm text-primary-foreground/80">{f.text}</p>
                      </div>
                    </li>
                  );
                })}
              </ul>
            </div>

            <p className="relative z-10 mt-10 flex items-center gap-2 text-xs text-primary-foreground/75">
              <CircleHelp className="size-3.5 shrink-0" />
              Besoin d&apos;aide ?{" "}
              <Link
                to="/contact"
                className="font-medium underline underline-offset-2 hover:text-white"
              >
                Contacte le support EZOA-TO
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export const AUTH_FIELD =
  "h-12 rounded-xl border-input pl-11 text-base shadow-sm md:text-base focus-visible:ring-primary";
