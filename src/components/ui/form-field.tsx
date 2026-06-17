import type { ReactNode } from "react";
import { Label } from "@/components/ui/label";
import { formFieldClass } from "@/lib/form-styles";
import { cn } from "@/lib/utils";

export function FormField({
  label,
  htmlFor,
  children,
  className,
}: {
  label: string;
  htmlFor?: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn(formFieldClass, className)}>
      <Label htmlFor={htmlFor} className="text-sm font-medium text-foreground">
        {label}
      </Label>
      {children}
    </div>
  );
}
