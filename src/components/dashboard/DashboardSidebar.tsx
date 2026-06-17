import { Link, useNavigate, useRouterState } from "@tanstack/react-router";
import { ArrowLeft, LogOut } from "lucide-react";
import { EzoaLogo } from "@/components/branding/EzoaLogo";
import { ThemeToggle } from "@/components/theme/ThemeToggle";
import { Badge } from "@/components/ui/badge";
import {
  type DashboardNavGroup,
  type UserSection,
  isAdminNavItemActive,
  isContributorDashboard,
  isContributorNavItemActive,
  resolveUserActiveSection,
} from "@/lib/dashboard-nav";
import { roleLabel } from "@/lib/roles";
import type { User } from "@/lib/types";
import { cn } from "@/lib/utils";

export function DashboardSidebar({
  user,
  groups,
  activeSection,
  onLogout,
}: {
  user: User;
  groups: DashboardNavGroup[];
  activeSection?: string;
  onLogout: () => void;
}) {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const search = useRouterState({ select: (s) => s.location.search }) as Record<string, unknown>;
  const navigate = useNavigate();

  function isActive(item: DashboardNavGroup["items"][number]) {
    if (item.search?.section) {
      const current = (search.section as string | undefined) ?? "overview";
      return pathname === item.to && current === item.search.section;
    }
    if (item.exact) return pathname === item.to;
    return pathname === item.to || pathname.startsWith(`${item.to}/`);
  }

  return (
    <aside className="flex h-full w-full flex-col border-r border-border bg-card">
      <div className="flex items-center justify-between gap-2 border-b border-border px-4 py-4">
        <Link to="/" className="shrink-0">
          <EzoaLogo className="h-8" />
        </Link>
        <ThemeToggle className="text-muted-foreground" />
      </div>

      <nav className="flex-1 overflow-y-auto px-3 py-4">
        {groups.map((group) => (
          <div key={group.title} className="mb-6 last:mb-0">
            <p className="mb-2 px-3 text-[10px] font-bold uppercase tracking-[0.18em] text-muted-foreground">
              {group.title}
            </p>
            <ul className="space-y-1">
              {group.items.map((item) => {
                const Icon = item.icon;
                const contributorSection = isContributorDashboard(pathname)
                  ? resolveUserActiveSection(pathname, activeSection as UserSection | undefined)
                  : null;
                const active = contributorSection
                  ? isContributorNavItemActive(item, contributorSection)
                  : activeSection
                    ? isAdminNavItemActive(item, activeSection)
                    : isActive(item);
                return (
                  <li key={item.id}>
                    <Link
                      to={item.to}
                      search={item.search}
                      activeOptions={{ exact: item.exact ?? true }}
                      activeProps={{ className: "" }}
                      inactiveProps={{ className: "" }}
                      className={cn(
                        "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition",
                        active
                          ? "bg-primary text-primary-foreground shadow-sm"
                          : "text-muted-foreground hover:bg-muted hover:!text-foreground dark:hover:!text-white",
                      )}
                    >
                      <Icon className="size-4 shrink-0" />
                      <span className="flex-1 truncate">{item.label}</span>
                      {(item.badge ?? 0) > 0 && (
                        <span
                          className={cn(
                            "rounded-full px-2 py-0.5 text-[10px] font-bold tabular-nums",
                            active
                              ? "bg-primary-foreground/20 text-primary-foreground"
                              : "bg-destructive text-destructive-foreground",
                          )}
                        >
                          {item.badge}
                        </span>
                      )}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </nav>

      <div className="border-t border-border p-4">
        <Link
          to="/account/profil"
          className="block rounded-xl bg-muted/50 px-3 py-3 transition hover:bg-muted"
        >
          <p className="truncate text-sm font-semibold">{user.nom}</p>
          <Badge variant="secondary" className="mt-1.5 text-[10px] uppercase tracking-wide">
            {roleLabel(user.role)}
          </Badge>
          <p className="mt-1 text-[10px] text-muted-foreground">Voir mon profil →</p>
        </Link>
        <div className="mt-3 space-y-1">
          <button
            type="button"
            onClick={() => navigate({ to: "/" })}
            className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-muted-foreground transition hover:bg-muted hover:text-foreground"
          >
            <ArrowLeft className="size-4" /> Retour au site
          </button>
          <button
            type="button"
            onClick={onLogout}
            className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-muted-foreground transition hover:bg-destructive/10 hover:text-destructive"
          >
            <LogOut className="size-4" /> Déconnexion
          </button>
        </div>
      </div>
    </aside>
  );
}
