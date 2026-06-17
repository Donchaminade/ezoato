import type { LucideIcon } from "lucide-react";
import type { PageHeroVariant } from "./PageHero";

/** Presets par page — variant + visuel distinct pour chaque contexte */
export const HERO_PRESETS = {
  home: {
    variant: "bento" as PageHeroVariant,
    primaryImage: "hero" as const,
    secondaryImage: "group" as const,
    tertiaryImage: "slogan" as const,
    imageSide: "right" as const,
  },
  about: {
    variant: "immersive" as PageHeroVariant,
    primaryImage: "group" as const,
    imageSide: "right" as const,
  },
  docs: {
    variant: "catalog" as PageHeroVariant,
    primaryImage: "hero" as const,
  },
  contact: {
    variant: "support" as PageHeroVariant,
    primaryImage: "group" as const,
    imageSide: "left" as const,
  },
  partenariat: {
    variant: "support" as PageHeroVariant,
    primaryImage: "group" as const,
    imageSide: "right" as const,
  },
  faq: {
    variant: "support" as PageHeroVariant,
    primaryImage: "hero" as const,
    imageSide: "right" as const,
  },
  submit: {
    variant: "stacked" as PageHeroVariant,
    primaryImage: "group" as const,
  },
  contributor: {
    variant: "immersive" as PageHeroVariant,
    primaryImage: "hero" as const,
    imageSide: "left" as const,
  },
  auth: {
    variant: "auth" as PageHeroVariant,
    primaryImage: "group" as const,
    imageSide: "left" as const,
  },
  account: {
    variant: "minimal" as PageHeroVariant,
    accent: "primary" as const,
  },
  bibliotheque: {
    variant: "minimal" as PageHeroVariant,
    accent: "secondary" as const,
  },
  soumissions: {
    variant: "minimal" as PageHeroVariant,
    accent: "accent" as const,
  },
  admin: {
    variant: "minimal" as PageHeroVariant,
    accent: "muted" as const,
  },
  detail: {
    variant: "document" as PageHeroVariant,
    primaryImage: "hero" as const,
    imageSide: "right" as const,
  },
  epreuve: {
    variant: "document" as PageHeroVariant,
    primaryImage: "group" as const,
    imageSide: "right" as const,
  },
} as const;

export type HeroPresetKey = keyof typeof HERO_PRESETS;

export function heroPreset(key: HeroPresetKey) {
  return HERO_PRESETS[key];
}
