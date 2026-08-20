import type { ComponentType } from "react";
import { ForceArrowsScene } from "./ForceArrowsScene";
import { ShortCircuitScene } from "./ShortCircuitScene";
import { WaterFlowScene } from "./WaterFlowScene";

/**
 * Declarative animation registry.
 *
 * Content references an animation by string id (`{"scene": "force-arrows"}`),
 * so an educator or a seeded manifest can attach one to any Learn or Evaluate
 * block without touching component code. Unknown ids render nothing rather than
 * breaking the wave.
 */

export type SceneParams = Record<string, string | number | boolean>;

export interface SceneProps {
  params: SceneParams;
}

export interface SceneDefinition {
  /** Shown in the educator panel's animation picker. */
  label: string;
  /** Parameter names the scene reads, for the picker's hint text. */
  params: string[];
  Component: ComponentType<SceneProps>;
}

export function numberParam(params: SceneParams, key: string, fallback: number): number {
  const raw = params[key];
  if (typeof raw === "number" && Number.isFinite(raw)) return raw;
  if (typeof raw === "string") {
    const parsed = Number.parseFloat(raw);
    if (Number.isFinite(parsed)) return parsed;
  }
  return fallback;
}

export function stringParam(params: SceneParams, key: string, fallback: string): string {
  const raw = params[key];
  return typeof raw === "string" && raw.length > 0 ? raw : fallback;
}

export function booleanParam(params: SceneParams, key: string, fallback: boolean): boolean {
  const raw = params[key];
  if (typeof raw === "boolean") return raw;
  if (typeof raw === "string") return raw === "true";
  return fallback;
}

export const ANIMATION_SCENES: Record<string, SceneDefinition> = {
  "force-arrows": {
    label: "Force arrows on a cart",
    params: ["push", "friction", "label"],
    Component: ({ params }) => (
      <ForceArrowsScene
        push={numberParam(params, "push", 6)}
        friction={numberParam(params, "friction", 0.2)}
        label={stringParam(params, "label", "Toy cart")}
      />
    ),
  },
  "water-flow": {
    label: "Water flow analogy",
    params: ["voltage", "resistance"],
    Component: ({ params }) => (
      <WaterFlowScene
        voltage={numberParam(params, "voltage", 6)}
        resistance={numberParam(params, "resistance", 2)}
      />
    ),
  },
  "short-circuit-warning": {
    label: "Short circuit warning",
    params: ["active"],
    Component: ({ params }) => <ShortCircuitScene active={booleanParam(params, "active", true)} />,
  },
};

export function getScene(sceneId: string | undefined | null): SceneDefinition | null {
  if (!sceneId) return null;
  return ANIMATION_SCENES[sceneId.trim().toLowerCase()] ?? null;
}

export const SCENE_IDS = Object.keys(ANIMATION_SCENES);
