import React, { useEffect, useState, type MouseEvent } from "react";
import { playClickSound } from "@/lib/sounds";
import { cn } from "@/lib/utils";

export interface RippleButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  rippleColor?: string;
  duration?: string;
}

export const RippleButton = React.forwardRef<HTMLButtonElement, RippleButtonProps>(
  (
    {
      className,
      children,
      rippleColor = "rgba(255, 255, 255, 0.4)",
      duration = "600ms",
      onClick,
      disabled,
      ...props
    },
    ref,
  ) => {
    const [buttonRipples, setButtonRipples] = useState<
      Array<{ x: number; y: number; size: number; key: number }>
    >([]);

    const handleClick = (event: MouseEvent<HTMLButtonElement>) => {
      if (!disabled) {
        playClickSound();
        createRipple(event);
      }
      onClick?.(event);
    };

    const createRipple = (event: MouseEvent<HTMLButtonElement>) => {
      const button = event.currentTarget;
      const rect = button.getBoundingClientRect();
      const size = Math.max(rect.width, rect.height);
      const x = event.clientX - rect.left - size / 2;
      const y = event.clientY - rect.top - size / 2;

      const newRipple = { x, y, size, key: Date.now() + Math.random() };
      setButtonRipples((prevRipples) => [...prevRipples, newRipple]);
    };

    useEffect(() => {
      let timeout: ReturnType<typeof setTimeout> | null = null;

      if (buttonRipples.length > 0) {
        const lastRipple = buttonRipples[buttonRipples.length - 1];
        timeout = setTimeout(() => {
          setButtonRipples((prevRipples) =>
            prevRipples.filter((ripple) => ripple.key !== lastRipple.key),
          );
        }, parseInt(duration, 10) || 600);
      }

      return () => {
        if (timeout !== null) {
          clearTimeout(timeout);
        }
      };
    }, [buttonRipples, duration]);

    return (
      <button
        className={cn(
          "bg-background text-primary relative flex cursor-pointer items-center justify-center overflow-hidden rounded-lg border-2 px-4 py-2 text-center transition-all duration-150 active:scale-[0.98]",
          className,
        )}
        onClick={handleClick}
        disabled={disabled}
        ref={ref}
        {...props}
      >
        <div className="relative z-10 flex items-center gap-2">{children}</div>
        <span className="pointer-events-none absolute inset-0 overflow-hidden rounded-[inherit]">
          {buttonRipples.map((ripple) => (
            <span
              className="animate-rippling absolute rounded-full pointer-events-none"
              key={ripple.key}
              style={
                {
                  width: `${ripple.size}px`,
                  height: `${ripple.size}px`,
                  top: `${ripple.y}px`,
                  left: `${ripple.x}px`,
                  backgroundColor: rippleColor,
                  transform: "scale(0)",
                  "--duration": duration,
                } as React.CSSProperties
              }
            />
          ))}
        </span>
      </button>
    );
  },
);

RippleButton.displayName = "RippleButton";

export default RippleButton;
