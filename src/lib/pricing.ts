import type { Epreuve } from "./types";

/** Prix en FCFA pour télécharger un examen national */
export const PRIX_EXAMEN_NATIONAL = 100;

/** Prix en FCFA pour un corrigé type (double du prix examen) */
export const PRIX_CORRIGE_TYPE = 200;

/** Récompense contributeur : 50 épreuves validées = 1000 FCFA */
export const EPREUVES_PAR_RECOMPENSE = 50;
export const MONTANT_RECOMPENSE = 1000;
export const MIN_RETRAIT = 2000;

const EXAMENS_OFFICIELS = ["CEPD", "BEPC", "BAC1", "BAC2"] as const;

/** Pro dès la première épreuve : examens officiels, concours, corrigés. */
export function isProTier(
  epreuve: Pick<Epreuve, "type" | "examen"> & {
    niveau?: Epreuve["niveau"];
    accessTier?: Epreuve["accessTier"];
    requiresPro?: boolean;
  },
): boolean {
  if (epreuve.accessTier === "quota") return false;
  if (epreuve.accessTier === "pro" || epreuve.requiresPro) return true;
  if (epreuve.type === "corrige") return true;
  if (epreuve.niveau === "concours") return true;
  return (
    epreuve.type === "examen" &&
    !!epreuve.examen &&
    (EXAMENS_OFFICIELS as readonly string[]).includes(epreuve.examen)
  );
}

export function requiresPayment(
  epreuve: Pick<Epreuve, "type" | "examen"> & {
    niveau?: Epreuve["niveau"];
    accessTier?: Epreuve["accessTier"];
    requiresPro?: boolean;
  },
): boolean {
  return isProTier(epreuve);
}

export function getPrixFcfa(epreuve: Pick<Epreuve, "type" | "examen" | "prixFcfa"> & {
  niveau?: Epreuve["niveau"];
  accessTier?: Epreuve["accessTier"];
  requiresPro?: boolean;
}): number {
  if (isProTier(epreuve)) return 0;
  if (epreuve.prixFcfa != null) return epreuve.prixFcfa;
  return 0;
}

export function formatFcfa(montant: number): string {
  return `${montant.toLocaleString("fr-FR")} FCFA`;
}

export function typeLabel(type: Epreuve["type"]): string {
  switch (type) {
    case "corrige":
      return "Corrigé type";
    case "examen":
      return "Examen national";
    case "composition":
      return "Composition";
    default:
      return "Devoir";
  }
}
