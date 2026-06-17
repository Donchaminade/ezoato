import { ScrollReveal } from "@/components/motion/ScrollReveal";
import { CurvedMedia, WaveDivider } from "@/components/motion/WaveDivider";
import { MARKETING_IMAGES } from "@/lib/marketing-images";
import { cn } from "@/lib/utils";

export function HeroStudentVisual({ className }: { className?: string }) {
  return (
    <ScrollReveal delay={0.2} offsetY={40} className={cn("w-full", className)}>
      <div className="grid gap-3 sm:grid-cols-5 sm:grid-rows-2 sm:gap-4">
        <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-card sm:col-span-3 sm:row-span-2">
          <img
            src={MARKETING_IMAGES.hero.src}
            alt="Élèves togolais cherchant des épreuves scolaires sur EZOA-TO avec leur téléphone"
            className="h-full min-h-[220px] w-full object-cover sm:min-h-[340px]"
            loading="eager"
          />
        </div>
        <div className="overflow-hidden rounded-xl border border-border bg-card shadow-soft sm:col-span-2">
          <img
            src={MARKETING_IMAGES.group.src}
            alt="Groupe d'élèves révisant avec EZOA-TO"
            className="aspect-[4/3] w-full object-cover sm:aspect-auto sm:h-full sm:min-h-[160px]"
            loading="lazy"
          />
        </div>
        <div className="flex flex-col justify-center rounded-xl border border-border bg-secondary/60 px-4 py-5 sm:col-span-2">
          <p className="font-display text-sm font-semibold text-foreground">EZOA-TO sur mobile</p>
          <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
            Matière, ville ou examen — trouve et télécharge en quelques secondes.
          </p>
        </div>
      </div>
    </ScrollReveal>
  );
}

export function StudentImageCard({
  src,
  alt,
  caption,
  className,
  imgClassName,
  fill = false,
  delay = 0,
}: {
  src: string;
  alt: string;
  caption?: string;
  className?: string;
  imgClassName?: string;
  /** Remplit la cellule d'une grille bento */
  fill?: boolean;
  delay?: number;
}) {
  return (
    <ScrollReveal delay={delay} offsetY={35} className={cn("h-full", className)}>
      <figure className="flex h-full flex-col overflow-hidden rounded-2xl border border-border bg-card shadow-soft">
        <CurvedMedia variant="wave-bottom" className={cn("relative", fill ? "min-h-[200px] flex-1" : "")}>
          <img
            src={src}
            alt={alt}
            className={cn(
              fill
                ? "absolute inset-0 h-full w-full object-cover"
                : "aspect-[4/3] w-full object-cover",
              imgClassName,
            )}
            loading="lazy"
          />
        </CurvedMedia>
        {caption && (
          <figcaption className="shrink-0 border-t border-border px-4 py-3 text-xs text-muted-foreground">
            {caption}
          </figcaption>
        )}
      </figure>
    </ScrollReveal>
  );
}

export function StudentGallery() {
  return (
    <section className="relative px-4 py-16 sm:px-6 sm:py-20">
      <div className="absolute inset-x-0 top-0 -translate-y-[calc(100%-1px)]">
        <WaveDivider className="text-background" shape="subtle" height="sm" flip />
      </div>
      <div className="mx-auto max-w-7xl">
        <div className="grid gap-8 lg:grid-cols-12 lg:gap-10">
          <ScrollReveal className="lg:col-span-4 lg:self-center">
            <h2 className="font-display text-2xl font-bold sm:text-3xl">
              Des élèves comme toi, partout au Togo
            </h2>
            <p className="mt-3 text-muted-foreground">
              EZOA-TO sur mobile : cherche une matière, une ville ou un examen national, et télécharge
              l'épreuve en quelques secondes.
            </p>
          </ScrollReveal>

          <div className="grid gap-3 sm:grid-cols-2 sm:gap-4 lg:col-span-8 lg:min-h-[420px] lg:grid-cols-8 lg:grid-rows-2">
            <StudentImageCard
              src={MARKETING_IMAGES.group.src}
              alt="Groupe d'élèves partageant des épreuves via EZOA-TO"
              caption="Étudier ensemble grâce à la communauté"
              className="sm:col-span-2 lg:col-span-4 lg:row-span-2"
              fill
              delay={0}
            />
            <StudentImageCard
              src={MARKETING_IMAGES.hero.src}
              alt="Deux élèves togolais utilisant EZOA-TO sur leur téléphone"
              caption="Recherche d'épreuves entre camarades"
              className="sm:col-span-1 lg:col-span-4"
              fill
              delay={0.06}
            />
            <StudentImageCard
              src={MARKETING_IMAGES.phoneSearch.src}
              alt={MARKETING_IMAGES.phoneSearch.alt}
              caption="Une recherche, un téléchargement — depuis ton téléphone"
              className="sm:col-span-1 lg:col-span-4"
              fill
              delay={0.12}
            />
          </div>
        </div>
      </div>
    </section>
  );
}
