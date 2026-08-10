import { describe, expect, it } from "vitest";
import { resolveMoleculeModel, type Mol3DMetadata } from "./Mol3DBlock";

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

describe("resolveMoleculeModel (3Dmol full schema)", () => {
  it("resolves H2O from SMILES with 3 atoms and 2 bonds", () => {
    const mol = resolveMoleculeModel(FULL_CHEM_META);
    expect(mol.atoms.length).toBe(3);
    expect(mol.bonds.length).toBe(2);
    expect(mol.formula).toBe("H2O");
  });

  it("resolves benzene from the curated library", () => {
    const mol = resolveMoleculeModel({ title: "Benzene", molecule: { source_type: "smiles", source_value: "C6H6" } });
    expect(mol.atoms.length).toBe(12);
    expect(mol.formula).toBe("C6H6");
    expect(mol.bonds.length).toBeGreaterThan(10);
  });

  it("parses unknown SMILES generically", () => {
    const mol = resolveMoleculeModel({ molecule: { source_type: "smiles", source_value: "CC(=O)O" } });
    expect(mol.atoms.map((a) => a.element)).toContain("C");
    expect(mol.atoms.map((a) => a.element)).toContain("O");
  });

  it("falls back to water for empty metadata", () => {
    const mol = resolveMoleculeModel({});
    expect(mol.formula).toBe("H2O");
  });
});
