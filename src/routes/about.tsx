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
          "Découvrez EZOA-TO : archives collège, lycée, université et concours, abonnement Pro, validation anti-doublons — la plateforme togolaise d'épreuves.",
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
        description="Du collège aux concours, sur mobile et sur le web — mission, tarifs Pro, qualité des archives et communauté éducative togolaise."
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
