import { Moon, Sun } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useTheme } from "@/lib/theme-context";
import { cn } from "@/lib/utils";

type ThemeToggleProps = {
  className?: string;
  size?: "sm" | "icon";
};

export function ThemeToggle({ className, size = "icon" }: ThemeToggleProps) {
  const { theme, toggleTheme, mounted } = useTheme();
  const isDark = theme === "dark";

  return (
    <Button
      type="button"
      variant="ghost"
      size={size === "sm" ? "sm" : "icon"}
      className={cn("shrink-0", className)}
      onClick={toggleTheme}
      aria-label={isDark ? "Passer en mode clair" : "Passer en mode sombre"}
      title={isDark ? "Mode clair" : "Mode sombre"}
    >
      <span className="relative grid size-4 place-items-center">
        <Sun
          className={cn(
            "absolute size-4 transition-all duration-300",
            mounted && isDark ? "rotate-90 scale-0 opacity-0" : "rotate-0 scale-100 opacity-100",
          )}
        />
        <Moon
          className={cn(
            "absolute size-4 transition-all duration-300",
            mounted && isDark ? "rotate-0 scale-100 opacity-100" : "-rotate-90 scale-0 opacity-0",
          )}
        />
      </span>
      {size === "sm" && (
        <span className="sr-only sm:not-sr-only sm:ml-1.5">
          {isDark ? "Clair" : "Sombre"}
        </span>
      )}
    </Button>
  );
}
