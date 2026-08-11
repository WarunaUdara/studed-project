import { cva, type VariantProps } from "class-variance-authority";
import * as React from "react";
import { useEffect, useState } from "react";
import { Slot } from "@/components/ui/slot";
import { playClickSound } from "@/lib/sounds";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "relative overflow-hidden inline-flex shrink-0 items-center justify-center gap-2 rounded-2xl font-bold whitespace-nowrap tracking-wide select-none transition-all duration-100 ease-out outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 active:translate-y-[2px] active:shadow-none [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
  {
    variants: {
      variant: {
        default:
          "bg-primary text-primary-foreground border-b-4 border-primary-dark shadow-[0_4px_0_oklch(0.42_0.15_145)] hover:bg-primary/95 hover:-translate-y-[1px] active:border-b-0 dark:shadow-[0_4px_0_oklch(0.35_0.12_145)]",
        secondary:
          "bg-gold text-gold-foreground border-b-4 border-amber-600 shadow-[0_4px_0_#d97706] hover:bg-gold/90 hover:-translate-y-[1px] active:border-b-0 dark:shadow-[0_4px_0_#b45309]",
        success:
          "bg-success text-success-foreground border-b-4 border-emerald-700 shadow-[0_4px_0_#047857] hover:bg-success/95 hover:-translate-y-[1px] active:border-b-0",
        ai:
          "bg-ai text-ai-foreground border-b-4 border-purple-700 shadow-[0_4px_0_#6d28d9] hover:bg-ai/90 hover:-translate-y-[1px] active:border-b-0",
        destructive:
          "bg-destructive text-white border-b-4 border-red-700 shadow-[0_4px_0_#b91c1c] hover:bg-destructive/95 hover:-translate-y-[1px] active:border-b-0",
        danger:
          "bg-destructive text-white border-b-4 border-red-700 shadow-[0_4px_0_#b91c1c] hover:bg-destructive/95 hover:-translate-y-[1px] active:border-b-0",
        outline:
          "border-2 border-border/80 bg-card text-foreground shadow-[0_3px_0_var(--border)] hover:bg-accent hover:border-primary/50 hover:-translate-y-[1px] active:border-b-2 active:shadow-none dark:border-input dark:bg-card/50",
        ghost:
          "border-2 border-transparent text-foreground hover:bg-accent/80 hover:text-accent-foreground active:translate-y-0 shadow-none border-b-0",
        link:
          "text-primary underline-offset-4 hover:underline active:translate-y-0 shadow-none border-b-0",
      },
      size: {
        default: "h-11 px-5 text-sm has-[>svg]:px-4",
        xs: "h-7 gap-1 px-3 text-[11px] has-[>svg]:px-2 [&_svg:not([class*='size-'])]:size-3.5",
        sm: "h-9 gap-1.5 px-4 text-xs has-[>svg]:px-3",
        lg: "h-13 px-8 text-base font-extrabold has-[>svg]:px-6",
        icon: "size-11 rounded-2xl",
        "icon-xs": "size-7 rounded-xl [&_svg:not([class*='size-'])]:size-3.5",
        "icon-sm": "size-9 rounded-xl",
        "icon-lg": "size-13 rounded-2xl",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
);

function Button({
  className,
  variant = "default",
  size = "default",
  asChild = false,
  rippleColor,
  onClick,
  children,
  ...props
}: React.ComponentProps<"button"> &
  VariantProps<typeof buttonVariants> & {
    asChild?: boolean;
    rippleColor?: string;
  }) {
  const Comp = asChild ? Slot : "button";
  const [buttonRipples, setButtonRipples] = useState<
    Array<{ x: number; y: number; size: number; key: number }>
  >([]);

  const defaultRippleColor =
    rippleColor ||
    (variant === "outline" || variant === "ghost" || variant === "secondary"
      ? "rgba(16, 185, 129, 0.25)"
      : "rgba(255, 255, 255, 0.4)");

  const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    if (!props.disabled) {
      playClickSound();
      if (!asChild && e.currentTarget) {
        const button = e.currentTarget;
        const rect = button.getBoundingClientRect();
        const sizePx = Math.max(rect.width, rect.height);
        const x = e.clientX - rect.left - sizePx / 2;
        const y = e.clientY - rect.top - sizePx / 2;
        setButtonRipples((prev: Array<{ x: number; y: number; size: number; key: number }>) => [
          ...prev,
          { x, y, size: sizePx, key: Date.now() + Math.random() },
        ]);
      }
    }
    onClick?.(e);
  };

  useEffect(() => {
    let timeout: ReturnType<typeof setTimeout> | null = null;
    if (buttonRipples.length > 0) {
      const lastRipple = buttonRipples[buttonRipples.length - 1];
      timeout = setTimeout(() => {
        setButtonRipples((prev: Array<{ x: number; y: number; size: number; key: number }>) =>
          prev.filter((r: { key: number }) => r.key !== lastRipple.key),
        );
      }, 600);
    }
    return () => {
      if (timeout) clearTimeout(timeout);
    };
  }, [buttonRipples]);

  if (asChild) {
    return (
      <Comp
        data-slot="button"
        data-variant={variant}
        data-size={size}
        className={cn(buttonVariants({ variant, size, className }))}
        onClick={handleClick}
        {...props}
      >
        {children}
      </Comp>
    );
  }

  return (
    <Comp
      data-slot="button"
      data-variant={variant}
      data-size={size}
      className={cn(buttonVariants({ variant, size, className }))}
      onClick={handleClick}
      {...props}
    >
      <span className="relative z-10 flex items-center justify-center gap-2">{children}</span>
      <span className="pointer-events-none absolute inset-0 overflow-hidden rounded-[inherit]">
        {buttonRipples.map((ripple: { x: number; y: number; size: number; key: number }) => (
          <span
            className="animate-rippling absolute rounded-full pointer-events-none"
            key={ripple.key}
            style={
              {
                width: `${ripple.size}px`,
                height: `${ripple.size}px`,
                top: `${ripple.y}px`,
                left: `${ripple.x}px`,
                backgroundColor: defaultRippleColor,
                transform: "scale(0)",
                "--duration": "600ms",
              } as React.CSSProperties
            }
          />
        ))}
      </span>
    </Comp>
  );
}

export { Button, buttonVariants };
