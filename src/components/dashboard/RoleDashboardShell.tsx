import type { ReactNode } from "react";
import { useRouterState } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import {
  getAdminNavGroups,
  getUserNavGroups,
  resolveUserActiveSection,
  type UserSection,
} from "@/lib/dashboard-nav";
import { api } from "@/lib/api";
import { useAuth } from "@/lib/auth";

/** Shell dashboard pour toutes les routes authentifiées (contributeur, admin, gestionnaire). */
export function RoleDashboardShell({
  title,
  subtitle,
  activeSection,
  children,
  onRefresh,
  actions,
}: {
  title: string;
  subtitle?: string;
  activeSection?: UserSection | string;
  children: ReactNode;
  onRefresh?: () => void;
  actions?: ReactNode;
}) {
  const { user } = useAuth();
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  const { data: soumissions } = useQuery({
    queryKey: ["my-soumissions"],
    queryFn: () => api.getMySoumissions(),
    enabled: !!user && user.role === "utilisateur",
  });

  if (!user) return null;

  const isStaff = user.role === "admin" || user.role === "gestionnaire";
  const enAttente = soumissions?.filter((s) => s.statut === "en_attente").length ?? 0;

  const groups = isStaff
    ? getAdminNavGroups(user.role === "admin")
    : getUserNavGroups({ soumissions: enAttente });

  const resolvedSection = isStaff
    ? (activeSection ?? (pathname.startsWith("/account/profil") ? "profil" : undefined))
    : resolveUserActiveSection(pathname, activeSection as UserSection | undefined);

  return (
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
  );
}
