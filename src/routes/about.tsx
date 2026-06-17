import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { PageHero } from "@/components/layout/PageHero";
import { PageHeroBadge } from "@/components/layout/PageHeroBadge";
import { Flag } from "lucide-react";
import { PublicLayout } from "@/components/layout/PublicLayout";
import {
  AboutArchiveTypes,
  AboutAudiences,
  AboutCTA,
  AboutGovernance,
  AboutHowItWorks,
  AboutMission,
  AboutPricing,
  AboutStats,
  AboutTechnology,
  AboutValidation,
} from "@/components/marketing/AboutSections";
import { PartnersSection } from "@/components/marketing/PartnersSection";
import { EZOA_BRAND } from "@/lib/branding";
import { api } from "@/lib/api";

export const Route = createFileRoute("/about")({
  head: () => ({
    meta: [
      { title: "À propos — EZOA-TO" },
      {
        name: "description",
        content:
          "Découvrez EZOA-TO : mission, archives, tarifs, validation, contributeurs et fonctionnement de la plateforme togolaise d'épreuves scolaires.",
      },
    ],
  }),
  component: AboutPage,
});

function AboutPage() {
  const { data: meta } = useQuery({
    queryKey: ["meta"],
    queryFn: () => api.getMeta(),
  });

  return (
    <PublicLayout>
      <PageHero
        badge={<PageHeroBadge icon={Flag}>{EZOA_BRAND.fullName}</PageHeroBadge>}
        title="Tout savoir sur EZOA-TO"
        description="Mission, archives, tarifs, validation et communauté — la référence pour comprendre la plateforme d'épreuves scolaires du Togo."
        primaryImage="group"
      />

      <AboutMission />
      <AboutStats meta={meta} />
      <AboutArchiveTypes />
      <AboutAudiences />
      <AboutHowItWorks />
      <AboutValidation />
      <AboutPricing meta={meta} />
      <AboutGovernance />
      <PartnersSection />
      <AboutTechnology />
      <AboutCTA />
    </PublicLayout>
  );
}
