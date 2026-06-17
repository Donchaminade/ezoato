import type { LucideIcon } from "lucide-react";

type PageHeroBadgeProps = {
  icon: LucideIcon;
  children: React.ReactNode;
};

export function PageHeroBadge({ icon: Icon, children }: PageHeroBadgeProps) {
  return (
    <span className="inline-flex items-center gap-1.5">
      <Icon className="size-3.5 shrink-0" aria-hidden />
      <span>{children}</span>
    </span>
  );
}
