import { Link, useRouterState } from "@tanstack/react-router";
import { motion } from "motion/react";
import {
  HelpCircle,
  Home,
  Library,
  LogIn,
  Upload,
  User,
} from "lucide-react";
import { useAuth } from "@/lib/auth";
import { cn } from "@/lib/utils";

const MAIN = [
  { to: "/", label: "Accueil", icon: Home, exact: true },
  { to: "/docs", label: "Archives", icon: Library },
  { to: "/faq", label: "FAQ", icon: HelpCircle },
] as const;

function isActive(pathname: string, to: string, exact?: boolean) {
  if (exact) return pathname === to;
  return pathname === to || pathname.startsWith(`${to}/`);
}

export function MobileBottomNav() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const { user } = useAuth();

  const accountTo = user ? "/account" : "/auth/login";
  const AccountIcon = user ? User : LogIn;
  const accountLabel = user ? "Compte" : "Connexion";

  return (
    <motion.nav
      aria-label="Navigation principale"
      initial={{ y: 80, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ type: "spring", stiffness: 320, damping: 30, delay: 0.1 }}
      className="fixed inset-x-0 bottom-0 z-50 md:hidden"
      style={{ paddingBottom: "max(0.75rem, env(safe-area-inset-bottom, 0px))" }}
    >
      <div className="mx-4">
        <div className="relative flex items-end justify-between rounded-2xl border border-border bg-card px-2 py-2 shadow-card">
          {MAIN.slice(0, 2).map((item) => {
            const active = isActive(pathname, item.to, item.exact);
            const Icon = item.icon;
            return (
              <NavItem key={item.to} to={item.to} label={item.label} active={active}>
                <Icon className={cn("size-5", active && "text-primary")} strokeWidth={active ? 2.5 : 2} />
              </NavItem>
            );
          })}

          <Link
            to="/submit"
            className="relative -mt-7 flex flex-col items-center"
            activeProps={{ className: "" }}
          >
            <motion.div
              whileTap={{ scale: 0.92 }}
              className={cn(
                "grid size-14 place-items-center rounded-2xl border-4 border-background shadow-card transition-colors",
                isActive(pathname, "/submit") ? "bg-primary text-primary-foreground" : "bg-primary text-primary-foreground",
              )}
            >
              <Upload className="size-6" strokeWidth={2.5} />
            </motion.div>
            <span className="mt-1 text-[10px] font-semibold text-primary">Soumettre</span>
          </Link>

          {MAIN.slice(2).map((item) => {
            const active = isActive(pathname, item.to, item.exact);
            const Icon = item.icon;
            return (
              <NavItem key={item.to} to={item.to} label={item.label} active={active}>
                <Icon className={cn("size-5", active && "text-primary")} strokeWidth={active ? 2.5 : 2} />
              </NavItem>
            );
          })}

          <NavItem to={accountTo} label={accountLabel} active={isActive(pathname, accountTo)}>
            <AccountIcon
              className={cn("size-5", isActive(pathname, accountTo) && "text-primary")}
              strokeWidth={isActive(pathname, accountTo) ? 2.5 : 2}
            />
          </NavItem>
        </div>
      </div>
    </motion.nav>
  );
}

function NavItem({
  to,
  label,
  active,
  children,
}: {
  to: string;
  label: string;
  active: boolean;
  children: React.ReactNode;
}) {
  return (
    <Link
      to={to}
      className="relative flex min-w-[3.25rem] flex-1 flex-col items-center gap-0.5 py-1.5"
      activeOptions={{ exact: to === "/" }}
    >
      <span className="relative grid size-9 place-items-center">
        {active && (
          <motion.span
            layoutId="tea-bottom-nav-active"
            className="absolute inset-0 rounded-xl bg-primary/12"
            transition={{ type: "spring", stiffness: 380, damping: 32 }}
          />
        )}
        <span className="relative">{children}</span>
      </span>
      <span
        className={cn(
          "text-[10px] font-medium",
          active ? "font-semibold text-primary" : "text-muted-foreground",
        )}
      >
        {label}
      </span>
    </Link>
  );
}
