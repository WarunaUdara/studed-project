import { Children, type ReactNode } from "react";
import { cn } from "@/lib/utils";

interface ButtonGroupProps {
  children: ReactNode;
  className?: string;
  size?: "sm" | "default" | "lg";
}

/**
 * A shadcn-style segmented button group: children (Buttons) are joined into
 * a single bordered control with shared radius and divider borders. Used for
 * the Edit/Preview toggle in the wave editor.
 */
export function ButtonGroup({ children, className, size = "sm" }: ButtonGroupProps) {
  const count = Children.count(children);
  const heights = {
    sm: "h-9",
    default: "h-10",
    lg: "h-11",
  }[size];

  return (
    <div
      role="group"
      className={cn(
        "inline-flex items-center overflow-hidden rounded-lg border bg-background shadow-sm",
        heights,
        className,
      )}
    >
      {Children.map(children, (child, i) => (
        <div
          key={i}
          className={cn("flex items-stretch", i < count - 1 && "border-r border-border")}
        >
          {child}
        </div>
      ))}
    </div>
  );
}
