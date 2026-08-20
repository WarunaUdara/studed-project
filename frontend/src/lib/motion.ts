import { useCallback } from "react";
import { gsap } from "gsap";

export function prefersReducedMotion(): boolean {
  if (typeof window === "undefined") return false;
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

export function useReducedMotion(): () => boolean {
  return useCallback(prefersReducedMotion, []);
}

export function animateSafe(
  targets: gsap.TweenTarget,
  vars: gsap.TweenVars,
): gsap.core.Tween | null {
  if (prefersReducedMotion()) {
    gsap.set(targets, { opacity: 1, clearProps: "transform" });
    return null;
  }
  return gsap.to(targets, vars);
}
