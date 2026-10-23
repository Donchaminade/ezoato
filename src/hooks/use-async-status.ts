import { useCallback, useRef, useState } from "react";
import type { ButtonStatus } from "@/components/ui/button";

/**
 * Cycle idle → loading → success | error → idle (2,5 s), réf. Instagram Dc7xjbKTa7h.
 * `run(fn)` exécute l'action et pilote le `status` du <Button>.
 */
export function useAsyncStatus(resetMs = 2500) {
  const [status, setStatus] = useState<ButtonStatus>("idle");
  const t = useRef<number | null>(null);
  const run = useCallback(
    async <T,>(fn: () => Promise<T>, onDone?: (v: T) => void) => {
      if (t.current) window.clearTimeout(t.current);
      setStatus("loading");
      try {
        const v = await fn();
        setStatus("success");
        t.current = window.setTimeout(() => {
          setStatus("idle");
          onDone?.(v);
        }, Math.min(resetMs, 900));
        return v;
      } catch (e) {
        setStatus("error");
        t.current = window.setTimeout(() => setStatus("idle"), resetMs);
        throw e;
      }
    },
    [resetMs],
  );
  return { status, run };
}
