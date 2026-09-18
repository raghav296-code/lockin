import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-xl text-[14px] font-semibold transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 cursor-pointer select-none active:scale-[0.98]",
  {
    variants: {
      variant: {
        default:
          "bg-accent text-white hover:bg-accent-hover active:opacity-90 shadow-[0_1px_2px_rgba(0,122,255,0.2),0_4px_12px_rgba(0,122,255,0.15)] hover:shadow-[0_2px_8px_rgba(0,122,255,0.3)]",
        secondary:
          "bg-muted-bg text-foreground hover:bg-border/60 active:opacity-80 border border-border/50",
        outline:
          "border border-border bg-surface/80 text-foreground hover:bg-surface hover:border-border-hover shadow-sm",
        ghost:
          "text-secondary hover:text-foreground hover:bg-muted-bg",
        danger:
          "bg-danger text-white hover:opacity-90 active:opacity-80 shadow-sm",
      },
      size: {
        default: "h-10 px-5 text-[14px]",
        sm: "h-8 rounded-lg px-3.5 text-[13px]",
        lg: "h-12 rounded-xl px-7 text-[16px]",
        icon: "h-10 w-10 p-0 rounded-xl",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    );
  }
);
Button.displayName = "Button";

export { Button, buttonVariants };
