import type { ReactNode } from "react";
import { useNavigate, useRouterState } from "@tanstack/react-router";
import { RefreshCw } from "lucide-react";
import { DashboardBottomNav } from "@/components/dashboard/DashboardBottomNav";
import { DashboardHeaderActions } from "@/components/dashboard/DashboardHeaderActions";
import { DashboardSidebar } from "@/components/dashboard/DashboardSidebar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import type { DashboardNavGroup } from "@/lib/dashboard-nav";
import { roleLabel } from "@/lib/roles";
import { useAuth } from "@/lib/auth";
import type { User } from "@/lib/types";

const MOBILE_BOTTOM_PADDING = "pb-[calc(6.25rem+env(safe-area-inset-bottom,0px))] lg:pb-8";

export function DashboardLayout({
  title,
  subtitle,
  groups,
  activeSection,
  children,
  onRefresh,
  actions,
}: {
  title: string;
  subtitle?: string;
  groups: DashboardNavGroup[];
  activeSection?: string;
  children: ReactNode;
  onRefresh?: () => void;
  actions?: ReactNode;
}) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  if (!user) return null;

  const handleLogout = () => {
    logout();
    navigate({ to: "/auth/login", search: { logout: "1" } });
  };

  const contributorNav =
    user.role === "utilisateur" &&
    (pathname.startsWith("/account") || pathname === "/contributor" || pathname === "/submit");

  return (
    <div className="flex min-h-svh bg-background">
      <div className="fixed inset-y-0 left-0 z-40 hidden w-64 lg:block">
        <DashboardSidebar
          user={user}
          groups={groups}
          activeSection={activeSection}
          onLogout={handleLogout}
        />
      </div>

      <div className="flex min-h-svh flex-1 flex-col lg:pl-64">
        <header className="sticky top-0 z-30 border-b border-border bg-background/95 px-4 py-3 backdrop-blur-md sm:px-6 sm:py-4 lg:px-8">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <h1 className="truncate font-display text-lg font-bold tracking-tight sm:text-xl lg:text-2xl">
                  {title}
                </h1>
                <Badge variant="outline" className="hidden shrink-0 text-[10px] uppercase sm:inline-flex">
                  {roleLabel(user.role)}
                </Badge>
              </div>
              {subtitle && (
                <p className="mt-0.5 line-clamp-2 text-xs text-muted-foreground sm:mt-1 sm:text-sm">
                  {subtitle}
                </p>
              )}
            </div>
            <div className="flex shrink-0 items-center gap-1 sm:gap-2">
              <DashboardHeaderActions onLogout={handleLogout} />
              {onRefresh && (
                <Button
                  variant="outline"
                  size="sm"
                  className="h-9 rounded-xl px-2.5 sm:px-3"
                  onClick={onRefresh}
                  aria-label="Actualiser"
                >
                  <RefreshCw className="size-4" />
                  <span className="hidden sm:inline">Actualiser</span>
                </Button>
              )}
              {actions}
            </div>
          </div>
        </header>

        <main className={`flex-1 px-4 py-4 sm:px-6 sm:py-6 lg:px-8 ${MOBILE_BOTTOM_PADDING}`}>
          {children}
        </main>

        <DashboardBottomNav
          groups={groups}
          activeSection={activeSection}
          pathname={pathname}
          variant={contributorNav ? "contributor" : "admin"}
        />
      </div>
    </div>
  );
}

export function useDashboardUser(): User | null {
  const { user } = useAuth();
  return user;
}
