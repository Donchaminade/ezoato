import type { ReactNode } from "react";
import { cloneElement, isValidElement } from "react";
import type { LucideIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function TableActions({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div className={cn("flex flex-wrap items-center justify-end gap-1", className)}>{children}</div>
  );
}

export function TableActionButton({
  icon: Icon,
  label,
  onClick,
  variant = "ghost",
  destructive = false,
  disabled,
  asChild,
  children,
}: {
  icon?: LucideIcon;
  label: string;
  onClick?: () => void;
  variant?: "ghost" | "outline" | "default" | "destructive";
  destructive?: boolean;
  disabled?: boolean;
  asChild?: boolean;
  children?: ReactNode;
}) {
  if (asChild && children) {
    const child = isValidElement(children)
      ? cloneElement(children, undefined, (
          <>
            {Icon && <Icon className="size-3.5" />}
            <span className="hidden sm:inline">{label}</span>
          </>
        ))
      : children;

    return (
      <Button
        asChild
        size="sm"
        variant={destructive ? "destructive" : variant}
        className="h-8 gap-1.5 rounded-lg px-2.5"
        disabled={disabled}
      >
        {child}
      </Button>
    );
  }

  return (
    <Button
      type="button"
      size="sm"
      variant={destructive ? "destructive" : variant}
      className="h-8 gap-1.5 rounded-lg px-2.5"
      onClick={onClick}
      disabled={disabled}
      title={label}
      aria-label={label}
    >
      {Icon && <Icon className="size-3.5" />}
      <span className="hidden sm:inline">{label}</span>
    </Button>
  );
}
