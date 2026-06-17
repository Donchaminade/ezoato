import type { ReactNode } from "react";
import { TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";

type AdminTabItem = {
  value: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: number;
  adminOnly?: boolean;
};

type AdminTabBarProps = {
  tabs: AdminTabItem[];
  isAdmin: boolean;
};

const TAB_BASE =
  "tea-water-fill-none h-11 gap-2 rounded-xl border-2 px-4 text-sm font-semibold transition-all duration-300 data-[state=active]:shadow-md";

export function AdminTabBar({ tabs, isAdmin }: AdminTabBarProps) {
  const visible = tabs.filter((t) => !t.adminOnly || isAdmin);

  return (
    <TabsList className="mb-1 flex h-auto w-full flex-wrap justify-start gap-2 bg-transparent p-0">
      {visible.map((tab) => {
        const Icon = tab.icon;
        return (
          <TabsTrigger
            key={tab.value}
            value={tab.value}
            className={cn(
              TAB_BASE,
              "border-border/50 bg-card text-muted-foreground",
              "hover:border-primary/30 hover:bg-primary/8 hover:text-primary",
              "data-[state=active]:border-primary/45 data-[state=active]:bg-primary/18 data-[state=active]:text-primary",
            )}
          >
            <Icon className="size-4 shrink-0" />
            {tab.label}
            {(tab.badge ?? 0) > 0 && (
              <span className="ml-0.5 rounded-full bg-destructive px-1.5 py-0.5 text-[10px] font-bold text-destructive-foreground">
                {tab.badge}
              </span>
            )}
          </TabsTrigger>
        );
      })}
    </TabsList>
  );
}
