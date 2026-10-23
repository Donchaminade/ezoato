/**
 * Mascotte « Zoé » — petit oiseau aux couleurs du drapeau (vert, or, rouge).
 * - Les yeux suivent le curseur, puis la saisie dans les champs texte/e-mail.
 * - Se cache les yeux avec les ailes quand un champ mot de passe est actif,
 *   et jette un œil (« peek ») quand le mot de passe est affiché en clair.
 * - Joyeux au succès, secoue la tête en cas d'erreur (événement `ezoa-mascot`).
 * Respecte prefers-reduced-motion (MotionConfig reducedMotion="user" côté layout).
 */
import { motion, useReducedMotion } from "motion/react";
import { useEffect, useRef, useState } from "react";

export type MascotMood = "idle" | "watch" | "hide" | "peek" | "happy" | "error";

export function emitMascot(mood: "happy" | "error") {
  if (typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent("ezoa-mascot", { detail: mood }));
  }
}

function isPasswordField(el: Element | null): el is HTMLInputElement {
  return el instanceof HTMLInputElement && (el.type === "password" || el.dataset.mascot === "password");
}

export function BirdMascot({ className = "" }: { className?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const reduce = useReducedMotion();
  const [mood, setMood] = useState<MascotMood>("idle");
  const [look, setLook] = useState({ x: 0, y: 0 });
  const transient = useRef<number | null>(null);

  useEffect(() => {
    const evalFocus = () => {
      if (transient.current) return;
      let el = document.activeElement;
      // Bouton « afficher le mot de passe » : on considère le champ voisin.
      if (el instanceof HTMLButtonElement) {
        const near = el.parentElement?.querySelector<HTMLInputElement>('input[data-mascot="password"]');
        if (near) el = near;
      }
      if (isPasswordField(el)) {
        setMood(el.type === "password" ? "hide" : "peek");
        setLook({ x: 0.2, y: 0.5 });
      } else if (el instanceof HTMLInputElement || el instanceof HTMLTextAreaElement) {
        setMood("watch");
        trackCaret(el);
      } else {
        setMood("idle");
      }
    };
    const trackCaret = (el: HTMLInputElement | HTMLTextAreaElement) => {
      // Approximation : la position du curseur de saisie le long du champ.
      const len = Math.max(el.value.length, 1);
      const pos = el.selectionStart ?? el.value.length;
      const ratio = Math.min(pos / Math.max(len, 24), 1);
      setLook({ x: -0.8 + ratio * 1.6, y: 0.7 });
    };
    const onInput = (e: Event) => {
      const t = e.target;
      if ((t instanceof HTMLInputElement || t instanceof HTMLTextAreaElement) && !isPasswordField(t)) trackCaret(t);
      if (isPasswordField(t as Element)) evalFocus();
    };
    const onMove = (e: PointerEvent) => {
      if (transient.current) return;
      const a = document.activeElement;
      if (a instanceof HTMLInputElement || a instanceof HTMLTextAreaElement) return;
      const box = ref.current?.getBoundingClientRect();
      if (!box) return;
      const dx = (e.clientX - (box.left + box.width / 2)) / (window.innerWidth / 2);
      const dy = (e.clientY - (box.top + box.height / 2)) / (window.innerHeight / 2);
      setLook({ x: Math.max(-1, Math.min(1, dx)), y: Math.max(-1, Math.min(1, dy)) });
    };
    const onMascot = (e: Event) => {
      const mood = (e as CustomEvent<"happy" | "error">).detail;
      if (transient.current) window.clearTimeout(transient.current);
      setMood(mood);
      setLook({ x: 0, y: 0 });
      transient.current = window.setTimeout(() => {
        transient.current = null;
        evalFocus();
      }, mood === "happy" ? 1800 : 900);
    };
    // Le bouton « afficher le mot de passe » change le type de l'input : on observe ce changement.
    const mo = new MutationObserver(() => evalFocus());
    mo.observe(document.body, { subtree: true, attributes: true, attributeFilter: ["type"] });
    document.addEventListener("focusin", evalFocus);
    document.addEventListener("focusout", () => window.setTimeout(evalFocus, 0));
    document.addEventListener("input", onInput);
    document.addEventListener("keyup", onInput);
    window.addEventListener("pointermove", onMove);
    window.addEventListener("ezoa-mascot", onMascot);
    return () => {
      mo.disconnect();
      document.removeEventListener("focusin", evalFocus);
      document.removeEventListener("input", onInput);
      document.removeEventListener("keyup", onInput);
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("ezoa-mascot", onMascot);
      if (transient.current) window.clearTimeout(transient.current);
    };
  }, []);

  const spring = reduce ? { duration: 0 } : { type: "spring" as const, stiffness: 260, damping: 20 };
  const px = look.x * 5;
  const py = look.y * 4;
  const covering = mood === "hide" || mood === "peek";
  const happy = mood === "happy";

  return (
    <motion.div
      ref={ref}
      className={className}
      data-mood={mood}
      role="img"
      aria-label={
        mood === "hide" ? "La mascotte se cache les yeux" : happy ? "La mascotte est contente" : "Mascotte EZOA-TO"
      }
      animate={
        reduce
          ? {}
          : mood === "error"
            ? { x: [0, -10, 10, -8, 8, -4, 0], rotate: [0, -4, 4, -3, 3, 0, 0] }
            : happy
              ? { y: [0, -14, 0, -8, 0] }
              : { y: [0, -3, 0] }
      }
      transition={
        mood === "error"
          ? { duration: 0.55 }
          : happy
            ? { duration: 0.9 }
            : { duration: 3.2, repeat: Infinity, ease: "easeInOut" }
      }
    >
      <svg viewBox="0 0 160 150" className="h-full w-full overflow-visible">
        {/* ombre */}
        <ellipse cx="80" cy="142" rx="40" ry="6" className="fill-black/10 dark:fill-black/30" />
        {/* pattes */}
        <path d="M66 128 v10 M94 128 v10" stroke="#FFCE00" strokeWidth="5" strokeLinecap="round" />
        {/* queue */}
        <path d="M128 92 q22 -6 26 -24 q-14 6 -28 8 z" fill="#004D38" />
        {/* corps */}
        <ellipse cx="80" cy="82" rx="54" ry="52" fill="#006A4E" />
        {/* ventre */}
        <ellipse cx="80" cy="98" rx="34" ry="30" fill="#02A671" opacity="0.9" />
        {/* aigrette */}
        <path d="M74 32 q4 -16 14 -18 q-4 8 -2 18 z" fill="#D21034" />
        {/* yeux */}
        {[56, 104].map((cx) => (
          <g key={cx}>
            <ellipse cx={cx} cy="70" rx="15" ry={happy ? 4 : 16} fill="#fff" />
            {happy ? (
              <path
                d={`M${cx - 10} 72 q10 -12 20 0`}
                stroke="#0B121A"
                strokeWidth="4"
                fill="none"
                strokeLinecap="round"
              />
            ) : (
              <motion.g animate={{ x: px, y: py }} transition={spring}>
                <circle cx={cx} cy="71" r="7.5" fill="#0B121A" />
                <circle cx={cx + 2.5} cy="68" r="2.4" fill="#fff" />
              </motion.g>
            )}
          </g>
        ))}
        {/* joues */}
        <circle cx="42" cy="92" r="6" fill="#D21034" opacity={happy ? 0.45 : 0.22} />
        <circle cx="118" cy="92" r="6" fill="#D21034" opacity={happy ? 0.45 : 0.22} />
        {/* bec */}
        <motion.path
          d={mood === "error" ? "M70 90 l10 8 l10 -8 z" : "M70 86 l10 12 l10 -12 z"}
          fill="#FFCE00"
          stroke="#E0B400"
          strokeWidth="1.5"
          strokeLinejoin="round"
        />
        {/* ailes : posées sur les flancs, montent devant les yeux en mode « hide » */}
        <motion.ellipse
          cx="36"
          cy="96"
          rx="16"
          ry="26"
          fill="#004D38"
          style={{ transformBox: "fill-box", originX: 0.5, originY: 0.5 }}
          animate={
            covering
              ? { x: 22, y: mood === "peek" ? -14 : -28, rotate: 35 }
              : happy
                ? { x: -4, y: -8, rotate: -30 }
                : { x: 0, y: 0, rotate: 12 }
          }
          transition={spring}
        />
        <motion.ellipse
          cx="124"
          cy="96"
          rx="16"
          ry="26"
          fill="#004D38"
          style={{ transformBox: "fill-box", originX: 0.5, originY: 0.5 }}
          animate={
            covering
              ? { x: -22, y: -28, rotate: -35 }
              : happy
                ? { x: 4, y: -8, rotate: 30 }
                : { x: 0, y: 0, rotate: -12 }
          }
          transition={spring}
        />
      </svg>
    </motion.div>
  );
}
