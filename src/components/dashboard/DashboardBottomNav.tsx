import { useState } from "react";
import { Link } from "@tanstack/react-router";
import { motion } from "motion/react";
import { MoreHorizontal } from "lucide-react";
import {
  type DashboardNavGroup,
  type DashboardNavItem,
  type UserSection,
  isAdminNavItemActive,
  isContributorDashboard,
  isContributorNavItemActive,
  resolveUserActiveSection,
} from "@/lib/dashboard-nav";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { cn } from "@/lib/utils";

const ADMIN_PRIMARY_IDS = ["overview", "soumissions", "epreuves", "retraits"] as const;
const CONTRIBUTOR_BAR_IDS = ["overview", "soumissions", "bibliotheque", "portefeuille"] as const;
const CONTRIBUTOR_MORE_IDS = ["profil", "submit"] as const;

function flattenItems(groups: DashboardNavGroup[]): DashboardNavItem[] {
  return groups.flatMap((g) => g.items);
}

function findItem(items: DashboardNavItem[], id: string): DashboardNavItem | undefined {
  return items.find((i) => i.id === id);
}

export function DashboardBottomNav({
  groups,
  activeSection,
  pathname,
  variant,
}: {
  groups: DashboardNavGroup[];
  activeSection?: string;
  pathname: string;
  variant?: "contributor" | "admin";
}) {
  const [moreOpen, setMoreOpen] = useState(false);
  const isContributor = variant === "contributor" || (variant == null && isContributorDashboard(pathname));
  const allItems = flattenItems(groups);

  const contributorSection = isContributor
    ? resolveUserActiveSection(pathname, activeSection as UserSection | undefined)
    : null;

  const isItemActive = (item: DashboardNavItem) => {
    if (contributorSection) return isContributorNavItemActive(item, contributorSection);
    if (activeSection) return isAdminNavItemActive(item, activeSection);
    return false;
  };

  if (isContributor) {
    const submitItem = findItem(allItems, "submit");
    const barItems = CONTRIBUTOR_BAR_IDS.map((id) => findItem(allItems, id)).filter(
      (i): i is DashboardNavItem => !!i,
    );
    const moreItems = CONTRIBUTOR_MORE_IDS.map((id) => findItem(allItems, id)).filter(
      (i): i is DashboardNavItem => !!i,
    );
    const moreActive = moreItems.some((i) => isItemActive(i));
    const left = barItems.slice(0, 2);
    const right = barItems.slice(2);

    return (
      <>
      <BottomNavShell>
        {left.map((item) => (
          <BottomNavItem
            key={item.id}
            item={item}
            active={isItemActive(item)}
            exact={item.exact ?? true}
          />
        ))}

        {submitItem && (
          <Link
            to={submitItem.to}
            className="relative -mt-7 flex min-w-[3.5rem] flex-col items-center"
            activeOptions={{ exact: true }}
            activeProps={{ className: "" }}
          >
            <motion.div
              whileTap={{ scale: 0.92 }}
              className={cn(
                "grid size-14 place-items-center rounded-2xl border-4 border-background shadow-lg transition-shadow",
                isItemActive(submitItem)
                  ? "bg-primary text-primary-foreground shadow-primary/25"
                  : "bg-primary text-primary-foreground",
              )}
            >
              <submitItem.icon className="size-6" strokeWidth={2.5} />
            </motion.div>
            <span
              className={cn(
                "mt-1 max-w-[4.5rem] truncate text-center text-[10px] font-semibold",
                isItemActive(submitItem) ? "text-primary" : "text-primary/80",
              )}
            >
              {submitItem.shortLabel ?? submitItem.label}
            </span>
          </Link>
        )}

        {right.map((item) => (
          <BottomNavItem
            key={item.id}
            item={item}
            active={isItemActive(item)}
            exact={item.exact ?? true}
          />
        ))}

        <button
          type="button"
          onClick={() => setMoreOpen(true)}
          className="relative flex min-w-[3.25rem] flex-1 flex-col items-center gap-0.5 py-1.5"
          aria-label="Plus d'options"
        >
          <span className="relative grid size-9 place-items-center">
            {moreActive && (
              <motion.span
                layoutId="tea-dash-bottom-active-pill"
                className="absolute inset-0 rounded-xl bg-primary/12"
                transition={{ type: "spring", stiffness: 380, damping: 32 }}
              />
            )}
            <MoreHorizontal
              className={cn("relative size-5", moreActive ? "text-primary" : "text-muted-foreground")}
              strokeWidth={moreActive ? 2.5 : 2}
            />
          </span>
          <span
            className={cn(
              "text-[10px] font-medium",
              moreActive ? "font-semibold text-primary" : "text-muted-foreground",
            )}
          >
            Plus
          </span>
        </button>
      </BottomNavShell>

      <Sheet open={moreOpen} onOpenChange={setMoreOpen}>
        <SheetContent side="bottom" className="rounded-t-2xl pb-[env(safe-area-inset-bottom)]">
          <SheetHeader>
            <SheetTitle>Mon compte</SheetTitle>
          </SheetHeader>
          <nav className="mt-4 grid gap-1 pb-4">
            {moreItems.map((item) => {
              const Icon = item.icon;
              const active = isItemActive(item);
              return (
                <Link
                  key={item.id}
                  to={item.to}
                  onClick={() => setMoreOpen(false)}
                  className={cn(
                    "flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-medium transition",
                    active ? "bg-primary text-primary-foreground" : "text-foreground hover:bg-muted",
                  )}
                >
                  <Icon className="size-4 shrink-0" />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </nav>
        </SheetContent>
      </Sheet>
      </>
    );
  }

  const primaryItems = ADMIN_PRIMARY_IDS.map((id) => findItem(allItems, id)).filter(
    (i): i is DashboardNavItem => !!i,
  );
  const moreItems = allItems.filter((i) => !ADMIN_PRIMARY_IDS.includes(i.id as typeof ADMIN_PRIMARY_IDS[number]));
  const moreActive = moreItems.some((i) => isItemActive(i));

  return (
    <>
      <BottomNavShell>
        {primaryItems.map((item) => (
          <BottomNavItem
            key={item.id}
            item={item}
            active={isItemActive(item)}
            exact={false}
            withSearch
          />
        ))}

        <button
          type="button"
          onClick={() => setMoreOpen(true)}
          className="relative flex min-w-[3.25rem] flex-1 flex-col items-center gap-0.5 py-1.5"
          aria-label="Plus de sections"
        >
          <span className="relative grid size-9 place-items-center">
            {moreActive && (
              <motion.span
                layoutId="tea-dash-bottom-active-pill"
                className="absolute inset-0 rounded-xl bg-primary/12"
                transition={{ type: "spring", stiffness: 380, damping: 32 }}
              />
            )}
            <MoreHorizontal
              className={cn("relative size-5", moreActive ? "text-primary" : "text-muted-foreground")}
              strokeWidth={moreActive ? 2.5 : 2}
            />
          </span>
          <span
            className={cn(
              "text-[10px] font-medium",
              moreActive ? "font-semibold text-primary" : "text-muted-foreground",
            )}
          >
            Plus
          </span>
        </button>
      </BottomNavShell>

      <Sheet open={moreOpen} onOpenChange={setMoreOpen}>
        <SheetContent side="bottom" className="rounded-t-2xl pb-[env(safe-area-inset-bottom)]">
          <SheetHeader>
            <SheetTitle>Administration</SheetTitle>
          </SheetHeader>
          <nav className="mt-4 grid gap-1 pb-4">
            {groups.map((group) => (
              <div key={group.title} className="mb-3 last:mb-0">
                <p className="mb-2 px-1 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                  {group.title}
                </p>
                <ul className="space-y-1">
                  {group.items
                    .filter((i) => !ADMIN_PRIMARY_IDS.includes(i.id as typeof ADMIN_PRIMARY_IDS[number]))
                    .map((item) => {
                      const Icon = item.icon;
                      const active = isItemActive(item);
                      return (
                        <li key={item.id}>
                          <Link
                            to={item.to}
                            search={item.search}
                            onClick={() => setMoreOpen(false)}
                            className={cn(
                              "flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-medium transition",
                              active
                                ? "bg-primary text-primary-foreground"
                                : "text-foreground hover:bg-muted",
                            )}
                          >
                            <Icon className="size-4 shrink-0" />
                            <span className="flex-1">{item.label}</span>
                            {(item.badge ?? 0) > 0 && (
                              <span className="rounded-full bg-destructive px-2 py-0.5 text-[10px] font-bold text-destructive-foreground">
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
        </SheetContent>
      </Sheet>
    </>
  );
}

function BottomNavShell({ children }: { children: React.ReactNode }) {
  return (
    <motion.nav
      aria-label="Navigation dashboard"
      initial={{ y: 72, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ type: "spring", stiffness: 320, damping: 30 }}
      className="fixed inset-x-0 bottom-0 z-50 lg:hidden"
      style={{ paddingBottom: "max(0.5rem, env(safe-area-inset-bottom, 0px))" }}
    >
      <div className="mx-3">
        <div className="flex items-end justify-between rounded-2xl border border-border/80 bg-card/95 px-1.5 py-2 shadow-lg backdrop-blur-md supports-[backdrop-filter]:bg-card/90">
          {children}
        </div>
      </div>
    </motion.nav>
  );
}

function BottomNavItem({
  item,
  active,
  exact,
  withSearch,
}: {
  item: DashboardNavItem;
  active: boolean;
  exact: boolean;
  withSearch?: boolean;
}) {
  const Icon = item.icon;
  const label = item.shortLabel ?? item.label;

  return (
    <Link
      to={item.to}
      search={withSearch ? item.search : undefined}
      activeOptions={{ exact }}
      activeProps={{ className: "" }}
      inactiveProps={{ className: "" }}
      className="relative flex min-w-0 flex-1 flex-col items-center gap-0.5 py-1.5"
    >
      <span className="relative grid size-9 place-items-center">
        {active && (
          <motion.span
            layoutId="tea-dash-bottom-active-pill"
            className="absolute inset-0 rounded-xl bg-primary/12"
            transition={{ type: "spring", stiffness: 380, damping: 32 }}
          />
        )}
        <Icon
          className={cn("relative size-5", active ? "text-primary" : "text-muted-foreground")}
          strokeWidth={active ? 2.5 : 2}
        />
        {(item.badge ?? 0) > 0 && (
          <span className="absolute -right-0.5 -top-0.5 grid min-w-[1rem] place-items-center rounded-full bg-destructive px-1 text-[9px] font-bold text-destructive-foreground">
            {item.badge! > 9 ? "9+" : item.badge}
          </span>
        )}
      </span>
      <span
        className={cn(
          "max-w-[4.25rem] truncate text-center text-[10px] font-medium leading-tight",
          active ? "font-semibold text-primary" : "text-muted-foreground",
        )}
      >
        {label}
      </span>
    </Link>
  );
}
