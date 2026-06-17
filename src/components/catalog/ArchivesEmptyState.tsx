import { Link } from "@tanstack/react-router";
import {
  Archive,
  BookOpen,
  FilterX,
  RefreshCw,
  Upload,
  WifiOff,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { EZOA_BRAND } from "@/lib/branding";
import { cn } from "@/lib/utils";

type Variant = "error" | "empty" | "no-results";

const COPY: Record<
  Variant,
  { icon: typeof Archive; title: string; description: string }
> = {
  error: {
    icon: WifiOff,
    title: "Impossible de charger les archives",
    description:
      "Nous n'avons pas pu récupérer les épreuves pour le moment. Vérifie ta connexion internet et réessaie dans quelques instants.",
  },
  empty: {
    icon: Archive,
    title: "Les archives sont encore vides",
    description: `${EZOA_BRAND.name} vient d'ouvrir : aucune épreuve n'a encore été validée. Sois parmi les premiers à enrichir la bibliothèque togolaise.`,
  },
  "no-results": {
    icon: FilterX,
    title: "Aucune épreuve ne correspond",
    description:
      "Aucun résultat pour ta recherche ou tes filtres actuels. Essaie d'autres mots-clés ou élargis les critères.",
  },
};

export function ArchivesEmptyState({
  variant,
  onReset,
  onRetry,
  className,
}: {
  variant: Variant;
  onReset?: () => void;
  onRetry?: () => void;
  className?: string;
}) {
  const { icon: Icon, title, description } = COPY[variant];

  return (
    <div
      className={cn(
        "flex flex-col items-center rounded-2xl border border-dashed border-border bg-card/60 px-6 py-14 text-center sm:px-10 sm:py-16",
        className,
      )}
    >
      <div className="grid size-14 place-items-center rounded-2xl bg-primary/10">
        <Icon className="size-7 text-primary" />
      </div>

      <h2 className="mt-5 font-display text-xl font-bold sm:text-2xl">{title}</h2>
      <p className="mt-2 max-w-md text-sm leading-relaxed text-muted-foreground">{description}</p>

      {variant === "error" && (
        <p className="mt-4 max-w-md text-xs text-muted-foreground">
          Si le problème persiste,{" "}
          <Link to="/contact" className="font-medium text-primary hover:underline">
            contacte notre équipe
          </Link>
          .
        </p>
      )}

      <div className="mt-6 flex flex-wrap justify-center gap-3">
        {variant === "error" && onRetry && (
          <Button onClick={onRetry}>
            <RefreshCw className="size-4" /> Réessayer
          </Button>
        )}
        {variant === "no-results" && onReset && (
          <Button variant="outline" onClick={onReset}>
            <FilterX className="size-4" /> Réinitialiser les filtres
          </Button>
        )}
        {variant === "empty" && (
          <>
            <Button
              asChild
              className="tea-btn-solid-hover h-11 min-h-11 rounded-xl px-6 text-sm font-semibold shadow-md"
            >
              <Link to="/submit">
                <span className="tea-water-content inline-flex items-center gap-2">
                  <Upload className="size-4" /> Soumettre une épreuve
                </span>
              </Link>
            </Button>
            <Button
              asChild
              variant="outline"
              className="tea-btn-air-outline h-11 min-h-11 rounded-xl px-6 text-sm font-semibold"
            >
              <Link to="/about">
                <span className="tea-water-content inline-flex items-center gap-2">
                  <BookOpen className="size-4" /> Comment ça marche
                </span>
              </Link>
            </Button>
          </>
        )}
        {variant !== "empty" && (
          <Button asChild variant={variant === "error" ? "outline" : "default"}>
            <Link to="/">Retour à l'accueil</Link>
          </Button>
        )}
      </div>

      <p className="mt-8 text-xs font-medium tracking-wide text-primary">
        {EZOA_BRAND.slogan}
      </p>
    </div>
  );
}
