import type { ReactNode } from "react";
import { useNavigate, useRouterState } from "@tanstack/react-router";
import { RefreshCw } from "lucide-react";
import { AnimatePresence, motion, MotionConfig } from "motion/react";
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
    <MotionConfig reducedMotion="user">
    <div className="flex min-h-svh bg-[#F4F7F5] dark:bg-background">
      <div className="fixed inset-y-0 left-0 z-40 hidden w-64 lg:block">
        <DashboardSidebar
          user={user}
          groups={groups}
          activeSection={activeSection}
          onLogout={handleLogout}
        />
      </div>

      <div className="flex min-h-svh flex-1 flex-col lg:pl-64">
        <header className="sticky top-0 z-30 border-b border-border/60 bg-[#F4F7F5]/85 px-4 dark:bg-background/85 py-3 backdrop-blur-md sm:px-6 sm:py-4 lg:px-8">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0 flex-1">
              <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-muted-foreground sm:text-[11px]">
                {new Date().toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long" })}
              </p>
              <div className="flex items-center gap-2">
                <h1 className="truncate font-display text-lg font-bold tracking-tight sm:text-xl lg:text-2xl">
                  {title}
                </h1>
                <Badge className="hidden shrink-0 rounded-full border-0 bg-[#FFCE00] text-[10px] uppercase text-[#0B121A] sm:inline-flex">
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
                  className="h-9 rounded-full px-2.5 sm:px-3"
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
          <AnimatePresence mode="wait" initial={false}>
            <motion.div
              key={activeSection ?? pathname}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
            >
              {children}
            </motion.div>
          </AnimatePresence>
        </main>

        <DashboardBottomNav
          groups={groups}
          activeSection={activeSection}
          pathname={pathname}
          variant={contributorNav ? "contributor" : "admin"}
        />
      </div>
    </div>
    </MotionConfig>
  );
}

export function useDashboardUser(): User | null {
  const { user } = useAuth();
  return user;
}
