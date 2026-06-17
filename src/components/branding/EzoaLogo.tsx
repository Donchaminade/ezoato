import { EZOA_BRAND } from "@/lib/branding";
import { cn } from "@/lib/utils";

/** Icône seule — main portant un livre ouvert (bibliothèque d'épreuves) */
export function EzoaMark({ className }: { className?: string }) {
  return (
    <img
      src="/icon-ezoa.png"
      alt=""
      aria-hidden
      draggable={false}
      className={cn("object-contain select-none", className)}
    />
  );
}

export function EzoaLogo({
  className,
  compact = false,
}: {
  className?: string;
  /** Icône seule, sans le texte */
  compact?: boolean;
}) {
  const label = EZOA_BRAND.fullName;

  if (compact) {
    return (
      <img
        src="/icon-ezoa.png"
        alt={label}
        draggable={false}
        className={cn("h-9 w-9 object-contain select-none sm:h-10 sm:w-10", className)}
      />
    );
  }

  // Logo complet horizontal : icône main + livre ouvert, texte « EZOA-TO » à droite
  return (
    <img
      src="/logo-ezoa.png"
      alt={label}
      draggable={false}
      className={cn("h-9 w-auto object-contain select-none sm:h-10", className)}
    />
  );
}
