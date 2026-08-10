import type { MatterMetadata } from "./MatterPhysicsBlock";

/**
 * Newton's Three Laws of Motion — sample scenarios for the Matter.js
 * physics block. Each law is a self-contained config the renderer switches
 * between via a segmented control, demonstrating:
 *
 *   1st law (Inertia): a cart on a frictionless floor stays at rest until an
 *     applied force acts on it (force slider at 0 → no motion).
 *   2nd law (F = ma): the same cart accelerates under a force slider; the
 *     live measurement shows acceleration = force / mass, so doubling the
 *     force doubles the acceleration (with mass held constant).
 *   3rd law (Action–Reaction): two carts joined by a compressed spring push
 *     each other apart with equal and opposite forces — both accelerate
 *     symmetrically away from the contact point.
 */
export const NEWTONS_LAWS: Record<"1" | "2" | "3", MatterMetadata> = {
  "1": {
    title: "First Law — Inertia",
    description: "A body at rest stays at rest unless a net force acts on it.",
    scenario_type: "newtons_laws",
    world_config: {
      gravity: { x: 0, y: 0, scale: 0.001 },
      bounds: { width: 760, height: 300 },
      bodies: [
        { id: "cart", type: "rectangle", position: { x: 380, y: 230 }, width: 90, height: 36, density: 0.002, restitution: 0.2, friction: 0, render: { fillStyle: "#f59e0b" } },
        { id: "floor", type: "rectangle", position: { x: 380, y: 268 }, width: 760, height: 14, isStatic: true, render: { fillStyle: "#475569" } },
      ],
      thrust: { x: 0, y: 0 },
    },
    editable_params: [
      { label: "Applied Force (F)", property: "thrust.x", type: "slider", min: 0, max: 0.004, step: 0.0001, default: 0 },
      { label: "Mass (m)", property: "bodies.cart.density", type: "slider", min: 0.0005, max: 0.006, step: 0.0005, default: 0.002 },
    ],
    measurements: [
      { label: "Velocity", type: "live", source: "cart" },
    ],
    educational_overlays: { show_forces: true, show_velocity: true, show_energy_bar: true },
  },
  "2": {
    title: "Second Law — F = ma",
    description: "Acceleration is proportional to force and inversely proportional to mass: a = F/m.",
    scenario_type: "newtons_laws",
    world_config: {
      gravity: { x: 0, y: 0, scale: 0.001 },
      bounds: { width: 760, height: 300 },
      bodies: [
        { id: "cart", type: "rectangle", position: { x: 380, y: 230 }, width: 90, height: 36, density: 0.002, restitution: 0.2, friction: 0, render: { fillStyle: "#10b981" } },
        { id: "floor", type: "rectangle", position: { x: 380, y: 268 }, width: 760, height: 14, isStatic: true, render: { fillStyle: "#475569" } },
      ],
      thrust: { x: 0, y: 0 },
    },
    editable_params: [
      { label: "Applied Force (F)", property: "thrust.x", type: "slider", min: 0, max: 0.004, step: 0.0001, default: 0.002 },
      { label: "Mass (m)", property: "bodies.cart.density", type: "slider", min: 0.0005, max: 0.006, step: 0.0005, default: 0.002 },
    ],
    measurements: [
      { label: "Acceleration (a=F/m)", type: "computed", formula: "thrust/density" },
      { label: "Velocity", type: "live", source: "cart" },
    ],
    educational_overlays: { show_forces: true, show_velocity: true, show_energy_bar: true },
  },
  "3": {
    title: "Third Law — Action & Reaction",
    description: "For every action there is an equal and opposite reaction.",
    scenario_type: "newtons_laws",
    world_config: {
      gravity: { x: 0, y: 0, scale: 0.001 },
      bounds: { width: 760, height: 300 },
      bodies: [
        { id: "cart_a", type: "rectangle", position: { x: 350, y: 230 }, width: 70, height: 32, density: 0.002, restitution: 0.2, friction: 0, render: { fillStyle: "#8b5cf6" } },
        { id: "cart_b", type: "rectangle", position: { x: 420, y: 230 }, width: 70, height: 32, density: 0.002, restitution: 0.2, friction: 0, render: { fillStyle: "#ec4899" } },
        { id: "floor", type: "rectangle", position: { x: 380, y: 268 }, width: 760, height: 14, isStatic: true, render: { fillStyle: "#475569" } },
      ],
      // Compressed spring between the carts: once released they push apart
      // with equal and opposite forces (action–reaction).
      constraints: [
        { id: "spring", bodyA: "cart_a", bodyB: "cart_b", length: 180, stiffness: 0.02, render: { strokeStyle: "#fbbf24", lineWidth: 2 } },
      ],
      thrust: { x: 0, y: 0 },
    },
    editable_params: [
      { label: "Spring Stiffness", property: "constraints.spring.stiffness", type: "slider", min: 0, max: 0.06, step: 0.005, default: 0.02 },
    ],
    measurements: [
      { label: "Cart A speed", type: "live", source: "cart_a" },
      { label: "Cart B speed", type: "live", source: "cart_b" },
    ],
    educational_overlays: { show_forces: true, show_velocity: true, show_trajectory: true, show_energy_bar: true },
  },
};

/** Labels for the law switcher. */
export const NEWTONS_LAWS_ORDER = ["1", "2", "3"] as const;
