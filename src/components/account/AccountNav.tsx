import { Link, useRouterState } from "@tanstack/react-router";
import {
  getUserNavGroups,
  isContributorNavItemActive,
  resolveUserActiveSection,
} from "@/lib/dashboard-nav";
import { cn } from "@/lib/utils";

/** Navigation horizontale (pages publiques avec sous-nav compte). */
export function AccountNav() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const activeSection = resolveUserActiveSection(pathname);
  const items = getUserNavGroups().flatMap((g) => g.items);

  return (
    <nav
      className="flex gap-2 overflow-x-auto pb-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      aria-label="Navigation compte"
    >
      {items.map((link) => {
        const active = isContributorNavItemActive(link, activeSection);
        const Icon = link.icon;
        return (
          <Link
            key={link.to}
            to={link.to}
            className={cn(
              "tea-water-fill-none inline-flex h-11 shrink-0 items-center gap-2 rounded-xl border-2 px-4 text-sm font-semibold transition-all duration-300",
              active
                ? "border-primary/45 bg-primary/18 text-primary shadow-sm"
                : "border-border/60 bg-card text-muted-foreground hover:border-primary/30 hover:bg-primary/8 hover:text-primary",
            )}
          >
            <Icon className="size-4 shrink-0" />
            {link.label}
          </Link>
        );
      })}
    </nav>
  );
}
