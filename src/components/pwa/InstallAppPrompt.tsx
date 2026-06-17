import { AnimatePresence, motion } from "motion/react";
import { Download, Smartphone, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { usePwaInstall } from "@/hooks/use-pwa-install";
import { useIsMobile } from "@/hooks/use-mobile";
import { EZOA_BRAND } from "@/lib/branding";

export function InstallAppPrompt() {
  const isMobile = useIsMobile();
  const { visible, canNativeInstall, installing, install, dismiss, isAndroid, isStandalone } =
    usePwaInstall();

  if (!isAndroid || isStandalone) return null;

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          role="dialog"
          aria-labelledby="tea-install-title"
          aria-describedby="tea-install-desc"
          initial={{ opacity: 0, y: 40, scale: 0.96 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 24, scale: 0.98 }}
          transition={{ type: "spring", stiffness: 340, damping: 28 }}
          className="fixed z-[70] mx-auto w-[calc(100%-2rem)] max-w-sm md:right-6 md:bottom-6 md:left-auto"
          style={{
            bottom: isMobile
              ? "max(5.75rem, calc(5.75rem + env(safe-area-inset-bottom, 0px)))"
              : undefined,
            left: isMobile ? "1rem" : undefined,
            right: isMobile ? "1rem" : undefined,
          }}
        >
          <div className="flag-stripe-top overflow-hidden rounded-2xl border border-border bg-card shadow-card">
            <div className="p-4">
              <div className="flex items-start gap-3">
                <div className="grid size-11 shrink-0 place-items-center rounded-xl bg-primary/10">
                  <Smartphone className="size-5 text-primary" />
                </div>
                <div className="min-w-0 flex-1">
                  <p id="tea-install-title" className="font-display font-semibold leading-tight">
                    Installer {EZOA_BRAND.name}
                  </p>
                  <p id="tea-install-desc" className="mt-1 text-xs leading-relaxed text-muted-foreground">
                    Ajoute {EZOA_BRAND.fullName} sur ton écran d&apos;accueil pour un accès rapide aux
                    épreuves, comme une vraie application.
                  </p>
                </div>
                <button
                  type="button"
                  aria-label="Fermer"
                  onClick={dismiss}
                  className="rounded-md p-1 text-muted-foreground hover:bg-muted"
                >
                  <X className="size-4" />
                </button>
              </div>

              {!canNativeInstall && (
                <p className="mt-3 rounded-lg bg-secondary/80 px-3 py-2 text-[11px] text-muted-foreground">
                  Chrome → menu <strong className="text-foreground">⋮</strong> →{" "}
                  <strong className="text-foreground">Installer l&apos;application</strong> ou{" "}
                  <strong className="text-foreground">Ajouter à l&apos;écran d&apos;accueil</strong>
                </p>
              )}

              <div className="mt-4 flex gap-2">
                <Button
                  className="flex-1"
                  size="sm"
                  disabled={installing}
                  onClick={() => (canNativeInstall ? install() : dismiss())}
                >
                  <Download className="size-4" />
                  {canNativeInstall ? (installing ? "Installation…" : "Installer") : "Compris"}
                </Button>
                <Button variant="outline" size="sm" onClick={dismiss}>
                  Plus tard
                </Button>
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
