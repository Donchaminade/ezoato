import { EZOA_BRAND } from "@/lib/branding";
import { typeLabel } from "@/lib/pricing";
import type { Epreuve } from "@/lib/types";

export function getEpreuveShareUrl(id: string): string {
  return `${window.location.origin}/epreuves/${id}`;
}

export function buildEpreuveShareMessage(epreuve: Epreuve, url?: string): string {
  const shareUrl = url ?? getEpreuveShareUrl(epreuve.id);
  const type = typeLabel(epreuve.type).toLowerCase();
  const lieu = epreuve.etablissement ?? epreuve.examen;

  let message = `J'ai trouvé une épreuve de ${type} en ${epreuve.matiere}`;
  if (epreuve.titre) {
    message += ` — « ${epreuve.titre} »`;
  }
  message += ` (${epreuve.classe}, ${epreuve.annee})`;

  const locationParts = [lieu, epreuve.ville].filter(Boolean);
  if (locationParts.length > 0) {
    message += ` — ${locationParts.join(", ")}`;
  }

  return `${message}. Consulte-la sur ${EZOA_BRAND.name} : ${shareUrl}`;
}

export async function shareEpreuve(epreuve: Epreuve): Promise<"shared" | "copied"> {
  const url = getEpreuveShareUrl(epreuve.id);
  const text = buildEpreuveShareMessage(epreuve, url);

  if (typeof navigator.share === "function") {
    try {
      await navigator.share({
        title: `Épreuve — ${epreuve.titre}`,
        text,
      });
      return "shared";
    } catch (error) {
      if (error instanceof DOMException && error.name === "AbortError") {
        throw error;
      }
    }
  }

  await navigator.clipboard.writeText(text);
  return "copied";
}
