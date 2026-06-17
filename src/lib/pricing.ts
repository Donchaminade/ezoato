import type { Epreuve } from "./types";

/** Prix en FCFA pour télécharger un examen national */
export const PRIX_EXAMEN_NATIONAL = 100;

/** Prix en FCFA pour un corrigé type (double du prix examen) */
export const PRIX_CORRIGE_TYPE = 200;

/** Récompense contributeur : 50 épreuves validées = 1000 FCFA */
export const EPREUVES_PAR_RECOMPENSE = 50;
export const MONTANT_RECOMPENSE = 1000;
export const MIN_RETRAIT = 2000;

export function requiresPayment(epreuve: Pick<Epreuve, "type" | "examen">): boolean {
  if (epreuve.type === "corrige") return true;
  return epreuve.type === "examen" && !!epreuve.examen;
}

export function getPrixFcfa(epreuve: Pick<Epreuve, "type" | "examen" | "prixFcfa">): number {
  if (epreuve.prixFcfa != null) return epreuve.prixFcfa;
  if (epreuve.type === "corrige") return PRIX_CORRIGE_TYPE;
  if (requiresPayment(epreuve)) return PRIX_EXAMEN_NATIONAL;
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
