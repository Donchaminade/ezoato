import type { ReactNode } from "react";
import { useRouterState } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { ContributorStaffRedirect } from "@/components/account/ContributorStaffRedirect";
import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { getUserNavGroups, resolveUserActiveSection, type UserSection } from "@/lib/dashboard-nav";
import { api } from "@/lib/api";
import { useAuth } from "@/lib/auth";

export function UserDashboardShell({
  title,
  subtitle,
  activeSection,
  children,
  onRefresh,
  actions,
}: {
  title: string;
  subtitle?: string;
  activeSection?: UserSection; // optionnel : l'URL reste la source de vérité
  children: ReactNode;
  onRefresh?: () => void;
  actions?: ReactNode;
}) {
  const { user } = useAuth();
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const { data: soumissions } = useQuery({
    queryKey: ["my-soumissions"],
    queryFn: () => api.getMySoumissions(),
    enabled: !!user,
  });

  const enAttente = soumissions?.filter((s) => s.statut === "en_attente").length ?? 0;
  const groups = getUserNavGroups({ soumissions: enAttente });
  const resolvedSection = resolveUserActiveSection(pathname, activeSection);

  return (
    <ContributorStaffRedirect>
      <DashboardLayout
        title={title}
        subtitle={subtitle}
        groups={groups}
        activeSection={resolvedSection}
        onRefresh={onRefresh}
        actions={actions}
      >
        {children}
      </DashboardLayout>
    </ContributorStaffRedirect>
  );
}
