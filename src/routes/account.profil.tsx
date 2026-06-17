import { createFileRoute } from "@tanstack/react-router";
import { UserCircle } from "lucide-react";
import { AuthGate } from "@/components/account/AuthGate";
import { ProfilePageContent } from "@/components/account/ProfilePageContent";
import { RoleDashboardShell } from "@/components/dashboard/RoleDashboardShell";
import { PageHeroBadge } from "@/components/layout/PageHeroBadge";

export const Route = createFileRoute("/account/profil")({
  head: () => ({ meta: [{ title: "Mon profil — EZOA-TO" }] }),
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
