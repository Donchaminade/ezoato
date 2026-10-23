import { Link, useNavigate, useRouterState } from "@tanstack/react-router";
import { ArrowLeft, LogOut } from "lucide-react";
import { motion } from "motion/react";
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

  // Sidebar premium — réf. DeywyTcvzbX (pill actif coulissant, spring 380/32) + règle 100dvh / déconnexion épinglée
  return (
    <aside className="flex h-dvh w-full flex-col bg-gradient-to-b from-[#004D38] via-[#00412F] to-[#003325] text-white dark:from-[#0B1622] dark:via-[#0B1622] dark:to-[#08111B] dark:border-r dark:border-white/5">
      <div className="flex items-center justify-between gap-2 border-b border-white/10 px-4 py-4">
        <Link to="/" className="shrink-0">
          <span className="inline-flex rounded-xl bg-white px-2 py-1"><EzoaLogo className="h-7" /></span>
        </Link>
        <ThemeToggle className="text-white/80 hover:bg-white/10 hover:text-white" />
      </div>

      <nav className="flex-1 overflow-y-auto px-3 py-4">
        {groups.map((group) => (
          <div key={group.title} className="mb-6 last:mb-0">
            <p className="mb-2 px-3 text-[10px] font-bold uppercase tracking-[0.18em] text-white/45">
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
                        "group relative flex items-center gap-3 rounded-full px-3 py-2.5 text-sm font-medium transition-colors",
                        active
                          ? "!text-[#004D38] dark:!text-[#0B1622]"
                          : "text-white/70 hover:bg-white/8 hover:!text-white",
                      )}
                    >
                      {active && (
                        <motion.span
                          layoutId="admin-sidebar-pill"
                          className="absolute inset-0 rounded-full bg-white shadow-md dark:bg-[#02A671]"
                          transition={{ type: "spring", stiffness: 380, damping: 32 }}
                        />
                      )}
                      <Icon className="relative size-4 shrink-0 transition-transform group-hover:translate-x-0.5" />
                      <span className="relative flex-1 truncate">{item.label}</span>
                      {(item.badge ?? 0) > 0 && (
                        <span
                          className={cn(
                            "relative rounded-full px-2 py-0.5 text-[10px] font-bold tabular-nums",
                            active ? "bg-[#FFCE00] text-[#0B121A]" : "bg-[#D21034] text-white",
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

      <div className="mt-auto border-t border-white/10 p-4">
        <Link
          to="/account/profil"
          className="flex items-center gap-3 rounded-2xl bg-white/8 px-3 py-3 transition hover:bg-white/12"
        >
          <span className="grid size-10 shrink-0 place-items-center rounded-full bg-[#FFCE00] font-display text-sm font-bold text-[#0B121A]">
            {user.nom.trim().charAt(0).toUpperCase()}
          </span>
          <span className="min-w-0">
            <span className="block truncate text-sm font-semibold">{user.nom}</span>
            <Badge className="mt-1 border-0 bg-white/15 text-[10px] uppercase tracking-wide text-white">
              {roleLabel(user.role)}
            </Badge>
          </span>
        </Link>
        <div className="mt-3 space-y-1">
          <button
            type="button"
            onClick={() => navigate({ to: "/" })}
            className="flex w-full items-center gap-2 rounded-full px-3 py-2 text-sm text-white/70 transition hover:bg-white/10 hover:text-white"
          >
            <ArrowLeft className="size-4" /> Retour au site
          </button>
          <button
            type="button"
            onClick={onLogout}
            className="flex w-full items-center gap-2 rounded-full px-3 py-2 text-sm text-white/70 transition hover:bg-[#D21034]/20 hover:text-white"
          >
            <LogOut className="size-4" /> Déconnexion
          </button>
        </div>
      </div>
    </aside>
  );
}
