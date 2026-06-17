import { motion, useReducedMotion } from "motion/react";
import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

type MarqueeDirection = "ltr" | "rtl";

type InfiniteMarqueeProps = {
  children: ReactNode;
  /** Durée d'un cycle complet (secondes) */
  durationSec?: number;
  className?: string;
  /** ltr = gauche→droite, rtl = droite→gauche (défaut) */
  direction?: MarqueeDirection;
  gapClassName?: string;
};

export function InfiniteMarquee({
  children,
  durationSec = 32,
  className,
  direction = "rtl",
  gapClassName = "gap-5 pr-5",
}: InfiniteMarqueeProps) {
  const reduceMotion = useReducedMotion();
  const duration = reduceMotion ? durationSec * 3 : durationSec;
  const xKeyframes = direction === "ltr" ? ["-50%", "0%"] : ["0%", "-50%"];

  return (
    <div className={cn("overflow-hidden", className)}>
      <motion.div
        className="flex w-max flex-nowrap"
        animate={{ x: xKeyframes }}
        transition={{
          x: {
            repeat: Infinity,
            repeatType: "loop",
            duration,
            ease: "linear",
          },
        }}
        style={{ willChange: "transform" }}
      >
        <MarqueeGroup gapClassName={gapClassName}>{children}</MarqueeGroup>
        <MarqueeGroup gapClassName={gapClassName} ariaHidden>
          {children}
        </MarqueeGroup>
      </motion.div>
    </div>
  );
}

function MarqueeGroup({
  children,
  ariaHidden,
  gapClassName,
}: {
  children: ReactNode;
  ariaHidden?: boolean;
  gapClassName: string;
}) {
  return (
    <div
      className={cn("flex shrink-0 flex-nowrap items-stretch", gapClassName)}
      aria-hidden={ariaHidden || undefined}
    >
      {children}
    </div>
  );
}
