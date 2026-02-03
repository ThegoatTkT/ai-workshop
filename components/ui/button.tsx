import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center rounded-lg text-sm font-semibold transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 cursor-pointer",
  {
    variants: {
      variant: {
        default:
          "bg-[hsl(var(--primary))] text-white hover:bg-[hsl(var(--primary-light))] shadow-md hover:shadow-lg hover:-translate-y-0.5 focus:ring-[hsl(var(--accent))]",
        accent:
          "bg-[hsl(var(--accent))] text-white hover:bg-[hsl(var(--accent-light))] shadow-md hover:shadow-lg hover:-translate-y-0.5 focus:ring-[hsl(var(--primary))]",
        outline:
          "border-2 border-[hsl(var(--primary))] text-[hsl(var(--primary))] hover:bg-[hsl(var(--primary))] hover:text-white focus:ring-[hsl(var(--accent))]",
        ghost: "hover:bg-[hsl(var(--muted))] hover:text-foreground",
      },
      size: {
        default: "h-10 px-5 py-2.5",
        sm: "h-8 px-3 text-xs",
        lg: "h-12 px-8 text-base",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
);

export interface ButtonProps
  extends
    React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, ...props }, ref) => {
    return (
      <button
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    );
  },
);
Button.displayName = "Button";

export { Button, buttonVariants };
