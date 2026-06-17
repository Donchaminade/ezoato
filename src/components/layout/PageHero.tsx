import type { ReactNode } from "react";
import { ScrollReveal } from "@/components/motion/ScrollReveal";
import { WaveDivider } from "@/components/motion/WaveDivider";
import { MARKETING_IMAGES, type MarketingImageKey } from "@/lib/marketing-images";
import { cn } from "@/lib/utils";

/** Conservé pour compatibilité — toutes les pages utilisent le même hero cinématique */
export type PageHeroVariant =
  | "bento"
  | "immersive"
  | "catalog"
  | "support"
  | "stacked"
  | "auth"
  | "minimal"
  | "document";

export type PageHeroProps = {
  badge?: ReactNode;
  title: ReactNode;
  description?: ReactNode;
  variant?: PageHeroVariant;
  accent?: "primary" | "secondary" | "accent" | "muted";
  primaryImage?: MarketingImageKey;
  secondaryImage?: MarketingImageKey;
  tertiaryImage?: MarketingImageKey | "slogan";
  imageSide?: "left" | "right";
  children?: ReactNode;
  className?: string;
  compact?: boolean;
  /** Hero plus haut — accueil */
  tall?: boolean;
  /** Position verticale de l'image de fond */
  imagePosition?: "center" | "bottom";
  /** Vague courbe en bas du hero */
  waveBottom?: boolean;
  /** Titre en majuscules (style bannière) — désactiver pour les titres longs */
  titleUppercase?: boolean;
};

export function PageHero({
  badge,
  title,
  description,
  primaryImage = "hero",
  children,
  className,
  compact = false,
  tall = false,
  imagePosition = "center",
  waveBottom = true,
  titleUppercase = true,
}: PageHeroProps) {
  const img = MARKETING_IMAGES[primaryImage];
  const imgPos = imagePosition === "bottom" ? "object-[center_75%]" : "object-center";

  return (
    <section
      className={cn(
        "relative w-full overflow-hidden border-b border-black/20",
        tall
          ? "min-h-[55vh] sm:min-h-[520px] lg:min-h-[580px]"
          : compact
            ? "min-h-[32vh] sm:min-h-[280px]"
            : "min-h-[42vh] sm:min-h-[380px] lg:min-h-[440px]",
        className,
      )}
    >
      {/* Image landscape + floutage noir */}
      <div className="absolute inset-0" aria-hidden>
        <img
          src={img.src}
          alt=""
          className={cn("absolute inset-0 h-full w-full scale-110 object-cover blur-[5px]", imgPos)}
          loading="eager"
        />
        <div className="absolute inset-0 bg-black/60" />
        <div className="absolute inset-0 bg-gradient-to-b from-black/45 via-black/25 to-black/65" />
      </div>

      <div
        className={cn(
          "relative z-10 mx-auto flex h-full w-full max-w-5xl flex-col items-center justify-center px-4 text-center sm:px-6",
          compact ? "py-12 sm:py-14" : tall ? "py-20 sm:py-24 lg:py-28" : "py-16 sm:py-20 lg:py-24",
        )}
      >
        <ScrollReveal offsetY={24} className="flex w-full flex-col items-center">
          {badge && (
            <span className="mb-5 inline-flex items-center gap-1.5 rounded-sm bg-destructive px-5 py-2 text-[11px] font-bold uppercase tracking-[0.2em] text-white sm:text-xs">
              {badge}
            </span>
          )}

          <h1
            className={cn(
              "font-display font-bold leading-[1.15] tracking-wide text-white",
              titleUppercase && "[&_:not(.normal-case)]:uppercase",
              compact ? "text-2xl sm:text-3xl lg:text-4xl" : "text-3xl sm:text-4xl lg:text-[2.75rem]",
            )}
          >
            {title}
          </h1>

          {description && (
            <div className="mt-4 max-w-2xl text-base leading-relaxed text-white/85 sm:text-lg [&_svg]:text-white/70">
              {description}
            </div>
          )}

          {children && (
            <div className="mt-10 w-full max-w-3xl [&_.text-muted-foreground]:text-white/70">
              {children}
            </div>
          )}
        </ScrollReveal>
      </div>

      {waveBottom && (
        <div className="absolute inset-x-0 bottom-0 z-20">
          <WaveDivider
            className="text-background"
            shape="organic"
            height="lg"
            layered
            backClassName="text-background/50"
          />
        </div>
      )}
    </section>
  );
}
