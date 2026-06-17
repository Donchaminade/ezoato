import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const buttonVariants = cva(
  [
    "tea-water-fill inline-flex items-center justify-center gap-2 whitespace-nowrap",
    "text-sm font-semibold cursor-pointer",
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

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>, VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, children, ...props }, ref) => {
    const classes = cn(buttonVariants({ variant, size, className }));

    if (asChild) {
      // Quand asChild=true, le Slot rend l'élément enfant (ex: Link) avec les classes du bouton.
      // Sans le wrapper tea-water-content, les nœuds texte directs sont peints SOUS le ::before
      // (z-index: 0) dans le contexte d'empilement isolation:isolate — le texte disparaît lors
      // de l'animation de remplissage. On injecte donc le wrapper dans les enfants du child.
      const childEl = React.isValidElement<{ children?: React.ReactNode }>(children)
        ? children
        : null;
      return (
        <Slot className={classes} ref={ref} {...props}>
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
      <button className={classes} ref={ref} {...props}>
        <span className="tea-water-content inline-flex items-center justify-center gap-2">
          {children}
        </span>
      </button>
    );
  },
);
Button.displayName = "Button";

export { Button, buttonVariants };
