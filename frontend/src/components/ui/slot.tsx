import * as React from "react";

/**
 * Minimal Slot implementation — replaces radix-ui Slot for the asChild pattern.
 * Merges props onto the single child element and clones it.
 */
interface SlotProps extends React.HTMLAttributes<HTMLElement> {
  children?: React.ReactNode;
}

function mergeProps(
  slotProps: Record<string, unknown>,
  childProps: Record<string, unknown>,
): Record<string, unknown> {
  const merged: Record<string, unknown> = { ...slotProps, ...childProps };

  if (slotProps.className || childProps.className) {
    merged.className = [slotProps.className, childProps.className].filter(Boolean).join(" ");
  }

  for (const key in childProps) {
    if (
      key.startsWith("on") &&
      typeof childProps[key] === "function" &&
      typeof slotProps[key] === "function"
    ) {
      merged[key] = (e: unknown) => {
        (childProps[key] as (e: unknown) => void)(e);
        (slotProps[key] as (e: unknown) => void)(e);
      };
    }
  }

  return merged;
}

const Slot = React.forwardRef<HTMLElement, SlotProps>(({ children, ...slotProps }, ref) => {
  if (React.isValidElement(children)) {
    const child = children as React.ReactElement<Record<string, unknown>>;
    const merged = mergeProps(slotProps, child.props);
    return React.cloneElement(child, {
      ...merged,
      ref: ref as React.Ref<HTMLElement>,
    });
  }
  return <>{children}</>;
});
Slot.displayName = "Slot";

export { Slot, Slot as Root };
