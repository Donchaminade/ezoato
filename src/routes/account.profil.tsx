import { pageHead } from "@/lib/seo";
import { createFileRoute } from "@tanstack/react-router";
import { UserCircle } from "lucide-react";
import { AuthGate } from "@/components/account/AuthGate";
import { ProfilePageContent } from "@/components/account/ProfilePageContent";
import { RoleDashboardShell } from "@/components/dashboard/RoleDashboardShell";
import { PageHeroBadge } from "@/components/layout/PageHeroBadge";

export const Route = createFileRoute("/account/profil")({
  head: () =>
    pageHead({
      path: "/account/profil",
      title: "Mon profil EZOA-TO — Informations et sécurité",
      description:
        "Modifie tes informations personnelles, ton mot de passe et tes préférences de notification sur ton profil EZOA-TO en toute sécurité.",
    }),
  component: ProfilPage,
});

function ProfilPage() {
  return (
    <AuthGate
      badge={<PageHeroBadge icon={UserCircle}>Profil</PageHeroBadge>}
      title="Mon profil"
      description="Connecte-toi pour gérer tes informations personnelles, ta sécurité et tes notifications."
    >
      <ProfilContent />
    </AuthGate>
  );
}

function ProfilContent() {
  return (
    <RoleDashboardShell
      title="Mon profil"
      subtitle="Compte, sécurité et préférences"
      activeSection="profil"
    >
      <ProfilePageContent />
    </RoleDashboardShell>
  );
}
