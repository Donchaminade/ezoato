import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const buttonVariants = cva(
  [
    "tea-water-fill inline-flex items-center justify-center gap-2 whitespace-nowrap",
    "ezoa-btn relative text-sm font-semibold cursor-pointer select-none",
    "transition-[transform,box-shadow,background-color,color] duration-200 ease-out hover:-translate-y-px active:translate-y-0 active:scale-[0.97]",
    "data-[status=success]:!bg-[#02A671] data-[status=success]:!text-white data-[status=error]:!bg-[#D21034] data-[status=error]:!text-white data-[status=error]:animate-[ezoa-shake_0.45s_ease-in-out]",
    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
    "disabled:pointer-events-none disabled:opacity-50 disabled:cursor-not-allowed",
    "[&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0",
  ].join(" "),
  {
    variants: {
      variant: {
        default:
          "tea-water-default bg-primary text-primary-foreground shadow-md hover:text-primary-foreground",
        destructive:
          "tea-water-destructive bg-destructive text-destructive-foreground shadow-sm hover:text-destructive-foreground",
        outline:
          "tea-water-outline border-2 border-input bg-background text-foreground shadow-sm",
        secondary:
          "tea-water-secondary bg-secondary text-secondary-foreground shadow-sm hover:text-secondary-foreground",
        ghost: "tea-water-ghost text-foreground hover:text-foreground",
        link: "tea-water-fill-none text-primary underline-offset-4 hover:underline",
      },
      size: {
        default: "h-11 min-h-11 px-5 py-2.5 rounded-lg",
        sm: "h-9 min-h-9 px-4 text-sm font-medium rounded-md",
        lg: "h-12 min-h-12 px-8 text-base rounded-xl",
        icon: "h-10 w-10 min-h-10 min-w-10 rounded-lg",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
);

export type ButtonStatus = "idle" | "loading" | "success" | "error";

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>, VariantProps<typeof buttonVariants> {
  asChild?: boolean;
  /**
   * Micro-interaction asynchrone (réf. Instagram Dc7xjbKTa7h) :
   * loading = vague liquide qui monte, success = coche, error = secousse rouge.
   */
  status?: ButtonStatus;
}

/** Ripple au point de contact (pointerdown). Désactivé par prefers-reduced-motion en CSS. */
function spawnRipple(e: React.PointerEvent<HTMLElement>) {
  const el = e.currentTarget;
  const r = el.getBoundingClientRect();
  const size = Math.max(r.width, r.height) * 2;
  const span = document.createElement("span");
  span.className = "ezoa-ripple";
  span.style.width = span.style.height = `${size}px`;
  span.style.left = `${e.clientX - r.left - size / 2}px`;
  span.style.top = `${e.clientY - r.top - size / 2}px`;
  span.addEventListener("animationend", () => span.remove());
  el.appendChild(span);
}

function StatusLayer({ status }: { status: ButtonStatus }) {
  if (status === "loading") {
    return (
      <span aria-hidden className="ezoa-liquid pointer-events-none absolute inset-0 overflow-hidden rounded-[inherit]">
        <svg className="ezoa-liquid-wave" viewBox="0 0 200 20" preserveAspectRatio="none">
          <path d="M0 10 Q25 0 50 10 T100 10 T150 10 T200 10 V20 H0 Z" />
        </svg>
      </span>
    );
  }
  if (status === "success") {
    return (
      <span aria-hidden className="pointer-events-none absolute inset-0 z-[2] grid place-items-center">
        <svg viewBox="0 0 24 24" className="ezoa-check size-6" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
          <path d="M5 12.5l4.5 4.5L19 7.5" />
        </svg>
      </span>
    );
  }
  return null;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, children, status = "idle", onPointerDown, ...props }, ref) => {
    const classes = cn(buttonVariants({ variant, size, className }));
    const handleDown = (e: React.PointerEvent<HTMLButtonElement>) => {
      if (variant !== "link") spawnRipple(e);
      onPointerDown?.(e);
    };

    if (asChild) {
      // Quand asChild=true, le Slot rend l'élément enfant (ex: Link) avec les classes du bouton.
      // Sans le wrapper tea-water-content, les nœuds texte directs sont peints SOUS le ::before
      // (z-index: 0) dans le contexte d'empilement isolation:isolate — le texte disparaît lors
      // de l'animation de remplissage. On injecte donc le wrapper dans les enfants du child.
      const childEl = React.isValidElement<{ children?: React.ReactNode }>(children)
        ? children
        : null;
      return (
        <Slot className={classes} ref={ref} onPointerDown={handleDown} {...props}>
          {childEl
            ? React.cloneElement(
                childEl,
                {},
                <span className="tea-water-content inline-flex items-center justify-center gap-2">
                  {childEl.props.children}
                </span>,
              )
            : children}
        </Slot>
      );
    }

    return (
      <button
        className={classes}
        ref={ref}
        data-status={status}
        aria-busy={status === "loading" || undefined}
        onPointerDown={handleDown}
        {...props}
      >
        <StatusLayer status={status} />
        <span
          className={cn(
            "tea-water-content relative z-[1] inline-flex items-center justify-center gap-2 transition-opacity duration-200",
            status === "success" && "opacity-0",
          )}
        >
          {children}
        </span>
      </button>
    );
  },
);
Button.displayName = "Button";

export { Button, buttonVariants };
