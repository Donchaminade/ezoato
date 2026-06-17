import { Link } from "@tanstack/react-router";
import { Bell, LogOut, UserCircle } from "lucide-react";
import { useState } from "react";
import { NotificationsInboxSheet } from "@/components/dashboard/NotificationsInboxSheet";
import { ThemeToggle } from "@/components/theme/ThemeToggle";
import { Button } from "@/components/ui/button";
import { useNotifications } from "@/hooks/useNotifications";
import { cn } from "@/lib/utils";

export function DashboardHeaderActions({ onLogout }: { onLogout: () => void }) {
  const [inboxOpen, setInboxOpen] = useState(false);
  const { unreadCount } = useNotifications();

  return (
    <>
      <Button
        type="button"
        variant="ghost"
        size="icon"
        className="relative size-10 shrink-0 rounded-xl hover:!text-foreground dark:hover:!text-white"
        aria-label={
          unreadCount > 0
            ? `Notifications, ${unreadCount} non lue${unreadCount > 1 ? "s" : ""}`
            : "Notifications"
        }
        onClick={() => setInboxOpen(true)}
      >
        <Bell className="size-6" />
        {unreadCount > 0 && (
          <span
            className={cn(
              "absolute right-1 top-1 flex min-w-[1.125rem] items-center justify-center rounded-full bg-primary px-1 text-[10px] font-semibold leading-none text-primary-foreground",
              unreadCount > 9 && "px-1.5",
            )}
          >
            {unreadCount > 99 ? "99+" : unreadCount}
          </span>
        )}
      </Button>
      <NotificationsInboxSheet open={inboxOpen} onOpenChange={setInboxOpen} />

      <Button
        asChild
        variant="ghost"
        size="icon"
        className="size-10 shrink-0 rounded-xl hover:!text-foreground dark:hover:!text-white"
        aria-label="Mon profil"
      >
        <Link to="/account/profil">
          <UserCircle className="size-6" />
        </Link>
      </Button>
      <ThemeToggle className="text-muted-foreground lg:hidden" />
      <Button
        type="button"
        variant="ghost"
        size="icon"
        className="size-9 shrink-0 rounded-xl text-muted-foreground hover:text-destructive lg:hidden"
        onClick={onLogout}
        aria-label="Déconnexion"
      >
        <LogOut className="size-5" />
      </Button>
    </>
  );
}
