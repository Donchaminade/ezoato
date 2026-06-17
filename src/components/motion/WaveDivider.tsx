import { cn } from "@/lib/utils";

/** Formes de vague SVG — viewBox 0 0 1440 120 */
const WAVE_PATHS = {
  /** Vague douce classique */
  smooth:
    "M0,72 C320,128 520,16 720,72 C920,128 1120,24 1440,72 L1440,120 L0,120 Z",
  /** Double creux — plus organique */
  organic:
    "M0,56 C180,112 360,8 540,64 C720,120 900,32 1080,72 C1260,112 1380,40 1440,64 L1440,120 L0,120 Z",
  /** Vague asymétrique marquée */
  bold:
    "M0,88 C240,24 480,104 720,48 C960,0 1200,96 1440,40 L1440,120 L0,120 Z",
  /** Petite ondulation */
  subtle:
    "M0,80 C360,104 720,56 1080,88 C1260,104 1380,72 1440,80 L1440,120 L0,120 Z",
  /** Transition hero — courbe marquée, lisible sur grands écrans */
  hero:
    "M0,104 C220,24 420,112 640,48 C860,0 1060,96 1280,40 C1360,16 1400,72 1440,56 L1440,120 L0,120 Z",
} as const;

export type WaveShape = keyof typeof WAVE_PATHS;

type WaveDividerProps = {
  /** Couleur de remplissage — classe Tailwind text-* ou fill explicite */
  className?: string;
  shape?: WaveShape;
  /** Hauteur relative de la vague */
  height?: "sm" | "md" | "lg";
  /** Retourner la vague (pour le haut d'une section) */
  flip?: boolean;
  /** Deuxième couche pour effet de profondeur */
  layered?: boolean;
  /** Couleur de la couche arrière (si layered) */
  backClassName?: string;
};

const HEIGHT = {
  sm: "h-8 sm:h-10",
  md: "h-12 sm:h-16",
  lg: "h-16 sm:h-24",
} as const;

export function WaveDivider({
  className = "text-background",
  shape = "smooth",
  height = "md",
  flip = false,
  layered = false,
  backClassName = "text-background/60",
}: WaveDividerProps) {
  const path = WAVE_PATHS[shape];

  return (
    <div
      className={cn("relative w-full leading-[0]", flip && "rotate-180", HEIGHT[height])}
      aria-hidden
    >
      {layered && (
        <svg
          className={cn("absolute inset-x-0 bottom-0 w-full", HEIGHT[height], backClassName)}
          viewBox="0 0 1440 120"
          preserveAspectRatio="none"
        >
          <path
            fill="currentColor"
            d={shape === "hero" ? WAVE_PATHS.bold : WAVE_PATHS.organic}
            transform="translate(0, 10)"
          />
        </svg>
      )}
      <svg
        className={cn("relative block h-full w-full", className)}
        viewBox="0 0 1440 120"
        preserveAspectRatio="none"
      >
        <path fill="currentColor" d={path} />
      </svg>
    </div>
  );
}

type WaveSectionProps = {
  children: React.ReactNode;
  className?: string;
  /** Vague en haut de la section */
  waveTop?: boolean | WaveShape;
  /** Vague en bas de la section */
  waveBottom?: boolean | WaveShape;
  topFill?: string;
  bottomFill?: string;
  layered?: boolean;
};

/** Section avec transitions wave optionnelles */
export function WaveSection({
  children,
  className,
  waveTop,
  waveBottom,
  topFill = "text-background",
  bottomFill = "text-background",
  layered = true,
}: WaveSectionProps) {
  const topShape = typeof waveTop === "string" ? waveTop : "smooth";
  const bottomShape = typeof waveBottom === "string" ? waveBottom : "organic";

  return (
    <section className={cn("relative", className)}>
      {waveTop && (
        <div className="absolute inset-x-0 top-0 z-10 -translate-y-[calc(100%-1px)]">
          <WaveDivider className={topFill} shape={topShape} height="md" layered={layered} />
        </div>
      )}
      {children}
      {waveBottom && (
        <div className="absolute inset-x-0 bottom-0 z-10 translate-y-[calc(100%-1px)]">
          <WaveDivider className={bottomFill} shape={bottomShape} height="md" layered={layered} />
        </div>
      )}
    </section>
  );
}

/** Masque courbe pour images et cartes */
export function CurvedMedia({
  children,
  className,
  variant = "wave-bottom",
}: {
  children: React.ReactNode;
  className?: string;
  variant?: "wave-bottom" | "wave-top" | "blob" | "arch";
}) {
  const clip =
    variant === "wave-bottom"
      ? "[clip-path:ellipse(108%_100%_at_50%_0%)]"
      : variant === "wave-top"
        ? "[clip-path:ellipse(108%_100%_at_50%_100%)]"
        : variant === "blob"
          ? "[clip-path:polygon(0%_8%,8%_0%,92%_0%,100%_8%,100%_92%,92%_100%,8%_100%,0%_92%)]"
          : "[clip-path:ellipse(95%_100%_at_50%_100%)]";

  return (
    <div className={cn("overflow-hidden", clip, className)}>
      {children}
    </div>
  );
}
