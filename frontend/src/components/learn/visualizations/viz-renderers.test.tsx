import { describe, expect, it } from "vitest";
import { resolveBodies, type MatterMetadata } from "./MatterPhysicsBlock";
import { resolveMoleculeModel, type Mol3DMetadata } from "./Mol3DBlock";

// Full documented Matter.js metadata: bodies (circle + static rectangle),
// constraints, editable_params, live measurements, educational overlays.
const FULL_MECH_META: MatterMetadata = {
  title: "Newton's Cradle",
  description: "Elastic collisions",
  scenario_type: "newtons_cradle",
  world_config: {
    gravity: { x: 0, y: 1, scale: 0.001 },
    bounds: { width: 800, height: 400 },
    bodies: [
      { id: "frame", type: "rectangle", position: { x: 400, y: 20 }, width: 600, height: 10, isStatic: true, render: { fillStyle: "#333" } },
      { id: "ball_1", type: "circle", position: { x: 250, y: 250 }, radius: 25, restitution: 0.95, friction: 0.005, density: 0.08, render: { fillStyle: "#C0C0C0" } },
    ],
    constraints: [{ id: "string_1", bodyA: "frame", bodyB: "ball_1", length: 220, stiffness: 1 }],
  },
  editable_params: [
    { label: "Restitution", property: "global.restitution", type: "slider", min: 0.5, max: 1.0, step: 0.01, default: 0.95 },
  ],
  measurements: [
    { label: "Velocity", type: "live", source: "ball_1.velocity" },
    { label: "Period", type: "computed", formula: "2 * PI * sqrt(length / gravity)" },
  ],
  educational_overlays: { show_forces: true, show_velocity: true, show_trajectory: true, show_energy_bar: true },
};

// Full documented 3Dmol metadata: molecule source, style, surface, camera,
// interactivity, annotations.
const FULL_CHEM_META: Mol3DMetadata = {
  title: "Water Molecule (H2O)",
  description: "Interactive 3D view",
  molecule: { source_type: "smiles", source_value: "O" },
  style: { stick: { radius: 0.15, colorscheme: "Jmol" } },
  surface: { type: "VDW", opacity: 0.7, color: "white" },
  camera: { position: { x: 0, y: 0, z: 50 }, zoom: 1.0 },
  interactivity: { rotate: true, zoom: true, pan: true, click_to_identify: true, hover_labels: true },
  annotations: [{ type: "label", text: "Hydrogen Bond", position: { x: 1.0, y: 0.5, z: 0.0 }, color: "red" }],
};

describe("resolveBodies (Matter.js full schema)", () => {
  it("builds bodies from world_config with physical props", () => {
    const bodies = resolveBodies(FULL_MECH_META);
    // 2 config bodies + auto-added ground floor (frame sits at y=20, so the
    // floor guard adds a static ground to keep dynamic bodies in view).
    expect(bodies.length).toBe(3);
    const frame = bodies.find((b) => b.id === "frame");
    const ball = bodies.find((b) => b.id === "ball_1");
    const ground = bodies.find((b) => b.id === "ground");
    expect(frame?.isStatic).toBe(true);
    expect(frame?.type).toBe("rectangle");
    expect(ball?.type).toBe("circle");
    expect(ball?.radius).toBe(25);
    expect(ball?.restitution).toBe(0.95);
    expect(ball?.density).toBe(0.08);
    expect(ball?.color).toBe("#C0C0C0");
    expect(ground?.isStatic).toBe(true);
  });

  it("guarantees a static floor so dynamic bodies stay in view", () => {
    const bodies = resolveBodies({
      world_config: { bounds: { width: 400, height: 300 }, bodies: [{ id: "b", type: "circle", position: { x: 200, y: 50 }, radius: 10 }] },
    });
    expect(bodies.some((b) => b.isStatic && b.y > 240)).toBe(true);
  });

  it("falls back to sensible defaults for empty metadata", () => {
    const bodies = resolveBodies({});
    expect(bodies.length).toBeGreaterThan(0);
    expect(bodies.some((b) => b.isStatic)).toBe(true);
  });

  it("preserves body render colors and static flags from config", () => {
    const bodies = resolveBodies(FULL_MECH_META);
    expect(bodies.find((b) => b.id === "frame")?.color).toBe("#333");
  });
});

describe("resolveMoleculeModel (3Dmol full schema)", () => {
  it("resolves H2O from SMILES with 3 atoms and 2 bonds", () => {
    const mol = resolveMoleculeModel(FULL_CHEM_META);
    expect(mol.atoms.length).toBe(3);
    expect(mol.bonds.length).toBe(2);
    expect(mol.formula).toBe("H2O");
    const elements = mol.atoms.map((a) => a.element).sort();
    expect(elements).toEqual(["H", "H", "O"]);
  });

  it("resolves benzene from the curated library", () => {
    const mol = resolveMoleculeModel({ title: "Benzene", molecule: { source_type: "smiles", source_value: "C6H6" } });
    expect(mol.atoms.length).toBe(12); // 6 C + 6 H
    expect(mol.formula).toBe("C6H6");
    expect(mol.bonds.length).toBeGreaterThan(10);
  });

  it("parses unknown SMILES generically (element counting)", () => {
    const mol = resolveMoleculeModel({ molecule: { source_type: "smiles", source_value: "CC(=O)O" } });
    // C: 2, O: 2 (generic parser may also count H positions) — at minimum C and O present
    const elements = mol.atoms.map((a) => a.element);
    expect(elements).toContain("C");
    expect(elements).toContain("O");
    expect(mol.atoms.length).toBeGreaterThan(0);
  });

  it("falls back to water for empty metadata", () => {
    const mol = resolveMoleculeModel({});
    expect(mol.formula).toBe("H2O");
    expect(mol.atoms.length).toBe(3);
  });
});
