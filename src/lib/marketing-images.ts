/** Images marketing élèves (déjà générées — public/images/) */
export const MARKETING_IMAGES = {
  hero: {
    src: "/images/students-hero.png",
    alt: "Élèves togolais utilisant EZOA-TO sur leur téléphone",
  },
  /** @deprecated Préférer `group` ou `hero` — pointe vers le visuel groupe */
  search: {
    src: "/images/students-group.png",
    alt: "Groupe d'élèves révisant avec EZOA-TO",
  },
  group: {
    src: "/images/students-group.png",
    alt: "Groupe d'élèves révisant ensemble avec EZOA-TO",
  },
  phoneSearch: {
    src: "/images/students-phone-search.png",
    alt: "Élève togolais souriant montrant l'application EZOA-TO sur son téléphone, pouce levé",
  },
} as const;

export type MarketingImageKey = keyof typeof MARKETING_IMAGES;
