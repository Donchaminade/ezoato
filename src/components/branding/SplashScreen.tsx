import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { EZOA_BRAND } from "@/lib/branding";

/** Filtre CSS qui rend une image vert foncé → blanche (conserve la transparence) */
const WHITE_FILTER = "[filter:brightness(0)_invert(1)]";

/** Durée d'entrée des vagues (secondes) */
const WAVE_IN_SECS = 1.05;

/** Délai minimum d'affichage avant la sortie (ms) */
const MIN_VISIBLE_MS = 1700;

function prefersReducedMotion(): boolean {
  if (typeof window === "undefined") return false;
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

export function SplashScreen() {
  const [visible, setVisible] = useState(true);
  const [flash, setFlash] = useState(false);
  const [reducedMotion, setReducedMotion] = useState(false);

  // Flash à la rencontre des vagues
  useEffect(() => {
    const reduced = prefersReducedMotion();
    setReducedMotion(reduced);
    if (reduced) return;

    const t = window.setTimeout(() => setFlash(true), WAVE_IN_SECS * 1000);
    return () => window.clearTimeout(t);
  }, []);

  // Sortie dès que l'app est prête + durée minimale écoulée
  useEffect(() => {
    const reduced = prefersReducedMotion();
    const minVisible = reduced ? 0 : MIN_VISIBLE_MS;

    let timer: number | undefined;
    const ready = () => {
      timer = window.setTimeout(() => setVisible(false), minVisible);
    };

    if (document.readyState === "complete") {
      ready();
    } else {
      window.addEventListener("load", ready, { once: true });
    }

    return () => {
      window.removeEventListener("load", ready);
      if (timer) window.clearTimeout(timer);
    };
  }, []);

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          key="splash"
          role="presentation"
          className="fixed inset-0 z-[100] overflow-hidden"
          style={{ background: "#071a10" }}
          exit={{ opacity: 0, transition: { duration: 0.4, ease: "easeInOut" } }}
        >
          {/* ── Version prefers-reduced-motion ── */}
          {reducedMotion ? (
            <div className="flex h-full items-center justify-center">
              <img
                src="/logo-ezoa.png"
                alt={EZOA_BRAND.fullName}
                draggable={false}
                className={`h-14 max-w-[85vw] select-none object-contain sm:h-16 ${WHITE_FILTER}`}
              />
            </div>
          ) : (
            <>
              {/* ── Logo centré, au-dessus des vagues blanches (z-40) pour rester lisible ── */}
              <div className="absolute inset-0 z-40 flex items-center justify-center">
                <div className="relative">
                  {/* Halo de respiration blanc */}
                  <motion.div
                    aria-hidden
                    className="pointer-events-none absolute inset-0 -m-12 rounded-full blur-3xl"
                    style={{
                      background:
                        "radial-gradient(circle, rgba(255,255,255,0.32) 0%, transparent 65%)",
                    }}
                    animate={{ opacity: [0.45, 0.9, 0.45], scale: [1, 1.18, 1] }}
                    transition={{ duration: 2.2, repeat: Infinity, ease: "easeInOut" }}
                  />
                  {/* Logo blanc avec légère respiration + ombre pour contraste sur les vagues blanches */}
                  <motion.div
                    animate={{ scale: [1, 1.025, 1] }}
                    transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut" }}
                  >
                    <img
                      src="/logo-ezoa.png"
                      alt={EZOA_BRAND.fullName}
                      draggable={false}
                      className={`relative h-16 max-w-[85vw] select-none object-contain drop-shadow-[0_2px_14px_rgba(0,45,28,0.65)] sm:h-20 ${WHITE_FILTER}`}
                    />
                  </motion.div>
                </div>
              </div>

              {/* ── Vague depuis le HAUT (z-20 : semi-transparente, logo visible dessous) ── */}
              <motion.div
                aria-hidden
                className="absolute inset-x-0 top-0 z-20"
                style={{ height: "60vh" }}
                initial={{ y: "-65vh" }}
                animate={{ y: "0vh" }}
                transition={{ duration: WAVE_IN_SECS, ease: [0.4, 0, 0.85, 1] }}
              >
                <svg
                  viewBox="0 0 1440 600"
                  preserveAspectRatio="none"
                  className="h-full w-full"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  {/* Couche principale */}
                  <path
                    d="M0,0 L1440,0 L1440,480 C1080,560 720,400 360,480 C180,520 90,440 0,480 Z"
                    fill="rgba(255,255,255,0.85)"
                  />
                  {/* Couche lumineuse de relief */}
                  <path
                    d="M0,0 L1440,0 L1440,440 C1080,520 720,360 360,440 C180,480 90,400 0,440 Z"
                    fill="rgba(255,255,255,0.4)"
                  />
                </svg>
              </motion.div>

              {/* ── Vague depuis le BAS (miroir de la vague du haut) ── */}
              <motion.div
                aria-hidden
                className="absolute inset-x-0 bottom-0 z-20"
                style={{ height: "60vh" }}
                initial={{ y: "65vh" }}
                animate={{ y: "0vh" }}
                transition={{ duration: WAVE_IN_SECS, ease: [0.4, 0, 0.85, 1] }}
              >
                <svg
                  viewBox="0 0 1440 600"
                  preserveAspectRatio="none"
                  className="h-full w-full"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  {/* Couche principale */}
                  <path
                    d="M0,600 L1440,600 L1440,120 C1080,40 720,200 360,120 C180,80 90,160 0,120 Z"
                    fill="rgba(255,255,255,0.85)"
                  />
                  {/* Couche lumineuse de relief */}
                  <path
                    d="M0,600 L1440,600 L1440,160 C1080,80 720,240 360,160 C180,120 90,200 0,160 Z"
                    fill="rgba(255,255,255,0.4)"
                  />
                </svg>
              </motion.div>

              {/* ── Flash lumineux à la convergence ── */}
              <motion.div
                aria-hidden
                className="pointer-events-none absolute inset-0 z-30"
                initial={{ opacity: 0 }}
                animate={flash ? { opacity: [0, 0.55, 0] } : { opacity: 0 }}
                transition={{ duration: 0.38, ease: "easeOut" }}
                style={{ background: "rgba(255,255,255,0.9)" }}
              />
            </>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );
}
