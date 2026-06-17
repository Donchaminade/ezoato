import { Link } from "@tanstack/react-router";
import { ArrowRight, ChevronLeft, ChevronRight } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { motion } from "motion/react";
import { WaveDivider } from "@/components/motion/WaveDivider";
import { MARKETING_IMAGES } from "@/lib/marketing-images";
import { EZOA_BRAND } from "@/lib/branding";
import { cn } from "@/lib/utils";

const SLIDES = [
  {
    key: "hero",
    src: MARKETING_IMAGES.hero.src,
    positionClass: "object-[center_30%]",
  },
  {
    key: "group",
    src: MARKETING_IMAGES.group.src,
    positionClass: "object-[center_35%]",
  },
  {
    key: "phoneSearch",
    src: MARKETING_IMAGES.phoneSearch.src,
    positionClass: "object-[center_30%]",
  },
] as const;

const SLOGAN_LINES = ["Archive. Révise.", "Excelle."] as const;

export function HomeHero() {
  const [slide, setSlide] = useState(0);

  const next = useCallback(
    () => setSlide((s) => (s + 1) % SLIDES.length),
    [],
  );
  const prev = useCallback(
    () => setSlide((s) => (s - 1 + SLIDES.length) % SLIDES.length),
    [],
  );

  useEffect(() => {
    const id = window.setInterval(next, 9000);
    return () => window.clearInterval(id);
  }, [next]);

  return (
    <section className="relative min-h-svh w-full overflow-hidden">
      {/* Images légèrement floutées + voile pour lisibilité du texte */}
      <div className="absolute inset-0" aria-hidden>
        {SLIDES.map((s, i) => (
          <img
            key={s.key}
            src={s.src}
            alt=""
            className={cn(
              "absolute inset-0 h-full w-full scale-[1.03] object-cover blur-[3px] brightness-[0.92] transition-opacity duration-700 ease-out sm:blur-[2.5px]",
              s.positionClass,
              i === slide ? "opacity-100" : "opacity-0",
            )}
            loading={i === 0 ? "eager" : "lazy"}
            fetchPriority={i === 0 ? "high" : "auto"}
          />
        ))}
        <div className="absolute inset-0 bg-black/38" />
        <div className="absolute inset-0 bg-gradient-to-b from-black/42 via-black/28 to-black/52" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_85%_75%_at_50%_40%,rgba(0,0,0,0.08),rgba(0,0,0,0.42))]" />
      </div>

      <div className="relative z-10 flex min-h-svh flex-col items-center justify-center px-4 pb-36 pt-24 text-center sm:px-6 sm:pb-40 sm:pt-28">
        <motion.p
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="mb-8 inline-flex max-w-[92vw] items-center rounded-full border border-white/15 bg-black/45 px-6 py-3 text-xs font-semibold uppercase tracking-[0.14em] text-white/95 backdrop-blur-md sm:max-w-none sm:px-8 sm:py-3.5 sm:text-sm md:text-base"
        >
          {EZOA_BRAND.tagline}
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.08, duration: 0.55 }}
          className="flex flex-col items-center gap-6 sm:flex-row sm:items-center sm:gap-8 lg:gap-12"
        >
          <div className="relative shrink-0">
            <span className="absolute -top-3.5 left-1/2 z-10 -translate-x-1/2 whitespace-nowrap rounded-full bg-tg-yellow px-3 py-1 text-[10px] font-bold uppercase tracking-widest text-tg-ink shadow-sm sm:text-xs">
              Live
            </span>
            <span
              className="flex size-20 items-center justify-center rounded-full bg-destructive font-display text-base font-bold uppercase tracking-wide text-white shadow-lg shadow-destructive/35 sm:size-24 sm:text-lg"
              aria-hidden
            >
              Zovu
            </span>
          </div>

          <h1 className="font-display text-[2.35rem] font-bold uppercase leading-[1.02] tracking-wide text-white drop-shadow-[0_2px_12px_rgba(0,0,0,0.45)] min-[400px]:text-4xl sm:text-6xl md:text-7xl lg:text-[5.25rem] xl:text-[5.75rem]">
            {SLOGAN_LINES.map((line) => (
              <span key={line} className="block">
                {line}
              </span>
            ))}
          </h1>
        </motion.div>

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.18, duration: 0.5 }}
          className="mt-6 max-w-2xl text-base leading-relaxed text-white/92 drop-shadow-[0_1px_8px_rgba(0,0,0,0.4)] sm:mt-7 sm:text-lg md:text-xl"
        >
          Cherche, consulte et télécharge des devoirs, compositions et examens nationaux
          directement depuis ton téléphone.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.28, duration: 0.5 }}
          className="mt-8 flex flex-col items-center gap-4 sm:flex-row"
        >
          <Link
            to="/docs"
            className="tea-water-fill tea-water-destructive-fill inline-flex min-h-14 items-center justify-center gap-3 rounded-full bg-destructive px-10 py-4 text-sm font-bold uppercase tracking-[0.12em] text-white shadow-xl shadow-destructive/30 transition-shadow hover:shadow-2xl hover:shadow-destructive/40 sm:min-h-[3.75rem] sm:px-12 sm:text-base"
          >
            <span>Explorer les archives</span>
            <ArrowRight className="size-5 shrink-0" />
          </Link>
          <Link
            to="/submit"
            className="tea-water-fill tea-water-glass-outline inline-flex min-h-11 items-center justify-center rounded-full border border-white/25 px-6 py-3 text-sm font-semibold text-white/90 hover:text-white"
          >
            Soumettre une épreuve
          </Link>
        </motion.div>
      </div>

      <div className="absolute inset-x-0 bottom-[4.5rem] z-20 flex items-center justify-center gap-4 sm:bottom-[5.5rem]">
        <button
          type="button"
          onClick={prev}
          aria-label="Image précédente"
          className="flex size-11 items-center justify-center rounded-full border border-white/30 bg-black/35 text-white backdrop-blur-md transition hover:bg-black/50"
        >
          <ChevronLeft className="size-5" />
        </button>
        <div className="flex items-center gap-2" role="tablist" aria-label="Images du hero">
          {SLIDES.map((s, i) => (
            <button
              key={s.key}
              type="button"
              role="tab"
              aria-selected={i === slide ? "true" : "false"}
              aria-label={`Image ${i + 1}`}
              onClick={() => setSlide(i)}
              className={cn(
                "h-1 rounded-full transition-all duration-300",
                i === slide ? "w-10 bg-destructive" : "w-6 bg-white/35 hover:bg-white/50",
              )}
            />
          ))}
        </div>
        <button
          type="button"
          onClick={next}
          aria-label="Image suivante"
          className="flex size-11 items-center justify-center rounded-full border border-white/30 bg-black/35 text-white backdrop-blur-md transition hover:bg-black/50"
        >
          <ChevronRight className="size-5" />
        </button>
      </div>

      <div className="pointer-events-none absolute inset-x-0 bottom-0 z-[15]">
        <WaveDivider
          className="text-secondary"
          shape="hero"
          height="lg"
          layered
          backClassName="text-secondary/45"
        />
      </div>
    </section>
  );
}
