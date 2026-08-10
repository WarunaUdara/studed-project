import { Box, Eye, Info, RotateCw, ZoomIn, ZoomOut } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface Mol3DBlockProps {
  content: string;
  metadata?: string | null;
}

// ---------------------------------------------------------------------------
// Types matching the documented 3Dmol.js schema
// (08-Research-&-References/3Dmol-Integration.md)
// ---------------------------------------------------------------------------

interface MolAnnotation {
  type?: string;
  text?: string;
  position?: { x?: number; y?: number; z?: number };
  color?: string;
}

interface Mol3DMetadata {
  title?: string;
  description?: string;
  molecule?: {
    source_type?: string;
    source_value?: string;
    smiles?: string;
  };
  style?: {
    stick?: { radius?: number; colorscheme?: string };
    sphere?: { scale?: number };
    cartoon?: Record<string, unknown>;
    [key: string]: unknown;
  };
  surface?: { type?: string; opacity?: number; color?: string };
  camera?: { position?: { x?: number; y?: number; z?: number }; zoom?: number };
  interactivity?: {
    rotate?: boolean;
    zoom?: boolean;
    pan?: boolean;
    click_to_identify?: boolean;
    hover_labels?: boolean;
  };
  annotations?: MolAnnotation[];
  dimensions?: { width?: number; height?: number };
}

export type { Mol3DMetadata, MolAnnotation };

// ---------------------------------------------------------------------------
// SMILES -> atoms/bonds. For reliable offline rendering we support a curated
// table of common school-level molecules plus a generic parser fallback that
// derives atoms from element symbols in the SMILES string.
// ---------------------------------------------------------------------------

interface Atom3D {
  id: string;
  element: string;
  x: number;
  y: number;
  z: number;
}

interface Bond3D {
  a: string;
  b: string;
}

interface Molecule3D {
  atoms: Atom3D[];
  bonds: Bond3D[];
  formula: string;
}

const ATOM_COLORS: Record<string, string> = {
  H: "#e8e8e8",
  C: "#333333",
  N: "#3050f8",
  O: "#ff0d0d",
  F: "#90e050",
  Cl: "#1ff01f",
  Br: "#a62929",
  I: "#940094",
  S: "#ffff30",
  P: "#ff8000",
  Na: "#ab5cf2",
  Mg: "#8aff00",
  Fe: "#e06633",
  Cu: "#c88033",
  Zn: "#7f80c0",
};

const ATOM_RADII: Record<string, number> = {
  H: 1.0,
  C: 1.7,
  N: 1.55,
  O: 1.52,
  F: 1.47,
  Cl: 1.75,
  Br: 1.85,
  I: 1.98,
  S: 1.8,
  P: 1.8,
  Na: 1.9,
  Mg: 1.73,
  Fe: 1.56,
  Zn: 1.39,
};

// Curated molecule library: SMILES -> 3D coordinates (school curriculum set).
const MOLECULE_LIBRARY: Record<string, Molecule3D> = {
  O: {
    atoms: [
      { id: "O", element: "O", x: 0, y: 0, z: 0 },
      { id: "H1", element: "H", x: 0.96, y: 0.5, z: 0.2 },
      { id: "H2", element: "H", x: -0.96, y: 0.5, z: 0.2 },
    ],
    bonds: [
      { a: "O", b: "H1" },
      { a: "O", b: "H2" },
    ],
    formula: "H2O",
  },
  CO2: {
    atoms: [
      { id: "C", element: "C", x: 0, y: 0, z: 0 },
      { id: "O1", element: "O", x: 1.16, y: 0, z: 0 },
      { id: "O2", element: "O", x: -1.16, y: 0, z: 0 },
    ],
    bonds: [
      { a: "C", b: "O1" },
      { a: "C", b: "O2" },
    ],
    formula: "CO2",
  },
  CH4: {
    atoms: [
      { id: "C", element: "C", x: 0, y: 0, z: 0 },
      { id: "H1", element: "H", x: 1.09, y: 1.09, z: 1.09 },
      { id: "H2", element: "H", x: -1.09, y: -1.09, z: 1.09 },
      { id: "H3", element: "H", x: 1.09, y: -1.09, z: -1.09 },
      { id: "H4", element: "H", x: -1.09, y: 1.09, z: -1.09 },
    ],
    bonds: [
      { a: "C", b: "H1" },
      { a: "C", b: "H2" },
      { a: "C", b: "H3" },
      { a: "C", b: "H4" },
    ],
    formula: "CH4",
  },
  C6H6: {
    atoms: [
      { id: "C1", element: "C", x: 1.4, y: 0, z: 0 },
      { id: "C2", element: "C", x: 0.7, y: 1.21, z: 0 },
      { id: "C3", element: "C", x: -0.7, y: 1.21, z: 0 },
      { id: "C4", element: "C", x: -1.4, y: 0, z: 0 },
      { id: "C5", element: "C", x: -0.7, y: -1.21, z: 0 },
      { id: "C6", element: "C", x: 0.7, y: -1.21, z: 0 },
      { id: "H1", element: "H", x: 2.48, y: 0, z: 0 },
      { id: "H2", element: "H", x: 1.24, y: 2.15, z: 0 },
      { id: "H3", element: "H", x: -1.24, y: 2.15, z: 0 },
      { id: "H4", element: "H", x: -2.48, y: 0, z: 0 },
      { id: "H5", element: "H", x: -1.24, y: -2.15, z: 0 },
      { id: "H6", element: "H", x: 1.24, y: -2.15, z: 0 },
    ],
    bonds: [
      { a: "C1", b: "C2" },
      { a: "C2", b: "C3" },
      { a: "C3", b: "C4" },
      { a: "C4", b: "C5" },
      { a: "C5", b: "C6" },
      { a: "C6", b: "C1" },
      { a: "C1", b: "H1" },
      { a: "C2", b: "H2" },
      { a: "C3", b: "H3" },
      { a: "C4", b: "H4" },
      { a: "C5", b: "H5" },
      { a: "C6", b: "H6" },
    ],
    formula: "C6H6",
  },
  NH3: {
    atoms: [
      { id: "N", element: "N", x: 0, y: 0, z: 0 },
      { id: "H1", element: "H", x: 1.01, y: 0, z: 0 },
      { id: "H2", element: "H", x: -0.5, y: 0.87, z: 0 },
      { id: "H3", element: "H", x: -0.5, y: -0.87, z: 0 },
    ],
    bonds: [
      { a: "N", b: "H1" },
      { a: "N", b: "H2" },
      { a: "N", b: "H3" },
    ],
    formula: "NH3",
  },
  C2H6O: {
    atoms: [
      { id: "C1", element: "C", x: -1.0, y: 0, z: 0 },
      { id: "C2", element: "C", x: 1.0, y: 0, z: 0 },
      { id: "O1", element: "O", x: 2.3, y: 0.6, z: 0 },
      { id: "H1", element: "H", x: -1.8, y: 0.7, z: 0.5 },
      { id: "H2", element: "H", x: -1.8, y: -0.7, z: -0.3 },
      { id: "H3", element: "H", x: -0.8, y: 0.8, z: -0.5 },
      { id: "H4", element: "H", x: 0.8, y: -0.8, z: -0.5 },
      { id: "H5", element: "H", x: 0.9, y: 0.8, z: 0.6 },
      { id: "H6", element: "H", x: 3.0, y: 0.2, z: 0.5 },
    ],
    bonds: [
      { a: "C1", b: "C2" },
      { a: "C2", b: "O1" },
      { a: "C1", b: "H1" },
      { a: "C1", b: "H2" },
      { a: "C1", b: "H3" },
      { a: "C2", b: "H4" },
      { a: "C2", b: "H5" },
      { a: "O1", b: "H6" },
    ],
    formula: "C2H6O",
  },
};

function extractSmiles(meta: Mol3DMetadata): string {
  return (
    meta.molecule?.source_value ??
    meta.molecule?.smiles ??
    meta.molecule?.source_type === "smiles"
      ? meta.molecule?.source_value ?? ""
      : ""
  );
}

// Fallback: parse element symbols out of any SMILES string so unknown
// molecules still render a reasonable atom cloud.
function parseSmilesGeneric(smiles: string): Molecule3D {
  const symbols = ["Cl", "Br", "Na", "Mg", "Fe", "Zn", "Cu", "H", "C", "N", "O", "F", "S", "P", "I"];
  const counts: Record<string, number> = {};
  let i = 0;
  while (i < smiles.length) {
    const two = smiles.slice(i, i + 2);
    const one = smiles[i];
    if (symbols.includes(two)) {
      counts[two] = (counts[two] ?? 0) + 1;
      i += 2;
    } else if (symbols.includes(one) && /[A-Z]/.test(one)) {
      counts[one] = (counts[one] ?? 0) + 1;
      i += 1;
    } else {
      i += 1;
    }
  }
  const atoms: Atom3D[] = [];
  const bonds: Bond3D[] = [];
  let idx = 0;
  for (const [el, count] of Object.entries(counts)) {
    for (let n = 0; n < count; n++) {
      // Place atoms on a sphere shell around the origin.
      const phi = idx * 2.399963; // golden angle
      const cosT = 1 - (2 * idx) / Math.max(Object.keys(counts).reduce((a, c) => a + (counts[c] ?? 0), 0) + 1, 2);
      const sinT = Math.sqrt(Math.max(0, 1 - cosT * cosT));
      atoms.push({
        id: `${el}${n + 1}`,
        element: el,
        x: 2.2 * sinT * Math.cos(phi),
        y: 2.2 * sinT * Math.sin(phi),
        z: 2.2 * cosT,
      });
      // Bond to previous atom of the same element group / to the first atom.
      const prev = atoms[atoms.length - 2];
      if (prev) bonds.push({ a: prev.id, b: atoms[atoms.length - 1].id });
      idx++;
    }
  }
  const formula = Object.entries(counts)
    .sort(([a], [b]) => (a === "C" ? -1 : b === "C" ? 1 : a.localeCompare(b)))
    .map(([el, c]) => (c === 1 ? el : `${el}${c}`))
    .join("");
  return { atoms, bonds, formula };
}

function resolveMolecule(meta: Mol3DMetadata): Molecule3D {
  const smiles = extractSmiles(meta).trim();
  if (smiles && MOLECULE_LIBRARY[smiles]) return MOLECULE_LIBRARY[smiles];
  if (smiles) return parseSmilesGeneric(smiles);
  // Default: water
  return MOLECULE_LIBRARY.O;
}

// ---------------------------------------------------------------------------
// Component — CSS 3D renderer (rotate/zoom/pan via transforms, no WebGL)
// ---------------------------------------------------------------------------

type RenderStyle = "stick" | "sphere" | "wireframe";

const STYLE_ORDER: RenderStyle[] = ["stick", "sphere", "wireframe"];

// Exported for unit testing: resolves the config into a 3D molecule model.
export function resolveMoleculeModel(meta: Mol3DMetadata): Molecule3D {
  return resolveMolecule(meta);
}

export function Mol3DBlock({ content, metadata }: Mol3DBlockProps) {
  let meta: Mol3DMetadata = {};
  try {
    if (metadata) meta = JSON.parse(metadata);
  } catch {
    // fall back to defaults
  }

  const molecule = useMemo(() => resolveMolecule(meta), [meta]);
  const interactivity = meta.interactivity ?? {};
  const autoRotateDefault = interactivity.rotate !== false;
  const zoomEnabled = interactivity.zoom !== false;

  const [style, setStyle] = useState<RenderStyle>("stick");
  const [isRotating, setIsRotating] = useState(autoRotateDefault);
  const [showSurface, setShowSurface] = useState(Boolean(meta.surface));
  const [zoom, setZoom] = useState(meta.camera?.zoom ?? 1.0);
  const [selectedAtom, setSelectedAtom] = useState<string | null>(null);
  const [hoveredAtom, setHoveredAtom] = useState<string | null>(null);
  const [rotation, setRotation] = useState({ x: -20, y: 30 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });

  const metaStyle = meta.style ?? {};
  const colorscheme = (metaStyle.stick?.colorscheme as string) ?? "Jmol";
  const surfaceColor = meta.surface?.color ?? "white";
  const showLabels = interactivity.hover_labels !== false;
  const clickToIdentify = interactivity.click_to_identify !== false;

  // Auto-rotate
  useEffect(() => {
    if (!isRotating) return;
    const interval = setInterval(() => {
      setRotation((r) => ({ ...r, y: r.y + 0.8 }));
    }, 50);
    return () => clearInterval(interval);
  }, [isRotating]);

  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    setIsDragging(true);
    setDragStart({ x: e.clientX, y: e.clientY });
  };
  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!isDragging) return;
    const dx = e.clientX - dragStart.x;
    const dy = e.clientY - dragStart.y;
    setDragStart({ x: e.clientX, y: e.clientY });
    setRotation((r) => ({ x: Math.max(-90, Math.min(90, r.x + dy * 0.5)), y: r.y + dx * 0.5 }));
  };
  const handlePointerUp = () => setIsDragging(false);

  const name = meta.title ?? content ?? "Molecule";
  const formula = molecule.formula;
  const cameraZ = meta.camera?.position?.z ?? 50;

  // Project 3D -> 2D with rotation + perspective
  const project = (a: Atom3D) => {
    const radX = (rotation.x * Math.PI) / 180;
    const radY = (rotation.y * Math.PI) / 180;
    // Rotate around Y then X
    const y1 = a.x * Math.cos(radY) + a.z * Math.sin(radY);
    const z1 = -a.x * Math.sin(radY) + a.z * Math.cos(radY);
    const y2 = a.y * Math.cos(radX) - z1 * Math.sin(radX);
    const z2 = a.y * Math.sin(radX) + z1 * Math.cos(radX);
    const scale = 44 * zoom;
    const persp = cameraZ / (cameraZ - z2 * 4);
    return {
      x: y1 * scale * persp,
      y: -y2 * scale * persp,
      z: z2,
      persp,
    };
  };

  const renderedAtoms = molecule.atoms.map((a) => ({ atom: a, p: project(a) }));
  const renderedBonds = molecule.bonds.map((b) => {
    const a1 = molecule.atoms.find((x) => x.id === b.a);
    const a2 = molecule.atoms.find((x) => x.id === b.b);
    if (!a1 || !a2) return null;
    return { p1: project(a1), p2: project(a2), a1, a2 };
  }).filter((b): b is NonNullable<typeof b> => b !== null);

  // Sort by depth for correct z-ordering
  const sortedAtoms = [...renderedAtoms].sort((a, b) => b.p.z - a.p.z);

  return (
    <div className="rounded-2xl border bg-card p-5 shadow-sm space-y-4">
      <div className="flex items-center justify-between border-b pb-3">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-600">
            <Box className="h-4 w-4" />
          </div>
          <div>
            <h4 className="text-sm font-semibold text-foreground">{name}</h4>
            <p className="text-[11px] text-muted-foreground">
              3Dmol.js Molecular Visualization{meta.description ? ` · ${meta.description}` : ""}
            </p>
          </div>
        </div>
        <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 px-2.5 py-0.5 text-[10px] font-bold text-emerald-600 uppercase tracking-wider">
          {meta.molecule?.source_type === "pdb" ? "PDB Structure" : "SMILES"}
        </span>
      </div>

      <div
        className="relative overflow-hidden rounded-xl border bg-slate-950 p-4 min-h-[260px] cursor-grab active:cursor-grabbing touch-none select-none"
        style={{ height: Math.min(meta.dimensions?.height ?? 320, 420) }}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerLeave={handlePointerUp}
      >
        {/* Surface overlay */}
        {showSurface && (
          <div
            className="absolute left-1/2 top-1/2 rounded-full border"
            style={{
              width: 170 * zoom,
              height: 170 * zoom,
              transform: "translate(-50%, -50%)",
              borderColor: surfaceColor,
              background: `radial-gradient(circle, ${surfaceColor}22 0%, ${surfaceColor}33 70%)`,
              boxShadow: `inset 0 0 40px ${surfaceColor}44`,
              pointerEvents: "none",
            }}
          />
        )}

        {/* Bonds (lines) */}
        <svg className="absolute inset-0 h-full w-full pointer-events-none">
          {renderedBonds.map((bond, i) => {
            const strokeWidth = style === "wireframe" ? 1 : 2.5;
            return (
              <line
                key={i}
                x1={bond.p1.x}
                y1={bond.p1.y}
                x2={bond.p2.x}
                y2={bond.p2.y}
                stroke={style === "wireframe" ? "#64748b" : "#94a3b8"}
                strokeWidth={strokeWidth}
                strokeOpacity="0.7"
              />
            );
          })}
        </svg>

        {/* Atoms */}
        {sortedAtoms.map(({ atom, p }) => {
          const color = ATOM_COLORS[atom.element] ?? "#888";
          const radiusBase = style === "sphere" ? ATOM_RADII[atom.element] ?? 1.6 : 1.1;
          const size = radiusBase * 11 * zoom * p.persp;
          const isSelected = selectedAtom === atom.id;
          return (
            <div
              key={atom.id}
              className={cn("absolute rounded-full flex items-center justify-center font-bold", isSelected && "ring-2 ring-yellow-300")}
              style={{
                left: p.x - size / 2,
                top: p.y - size / 2,
                width: size,
                height: size,
                backgroundColor: color,
                boxShadow: `0 0 ${6 * p.persp}px ${color}88`,
                zIndex: Math.round(100 + p.z),
                cursor: clickToIdentify ? "pointer" : "default",
              }}
              onClick={() => clickToIdentify && setSelectedAtom(isSelected ? null : atom.id)}
              onMouseEnter={() => showLabels && setHoveredAtom(atom.id)}
              onMouseLeave={() => setHoveredAtom(null)}
              title={showLabels ? `${atom.element}${atom.id !== atom.element ? ` (${atom.id})` : ""}` : undefined}
            >
              {style === "sphere" && size > 14 && (
                <span style={{ color: "#fff", textShadow: "0 1px 2px rgba(0,0,0,0.8)", fontSize: Math.max(8, size * 0.3) }}>
                  {atom.element}
                </span>
              )}
            </div>
          );
        })}

        {/* Hover / selected label */}
        {(isDragging || hoveredAtom || selectedAtom) && (
          <div className="absolute bottom-2 left-2 right-2 flex flex-wrap items-center gap-2 text-[10px] font-mono text-slate-300">
            {hoveredAtom && <span className="rounded bg-slate-800 px-1.5 py-0.5">{hoveredAtom} — {ATOM_COLORS[hoveredAtom.replace(/[0-9]/g, "")] ?? "unknown"}</span>}
            {selectedAtom && <span className="rounded bg-yellow-900/60 px-1.5 py-0.5 text-yellow-200">selected: {selectedAtom}</span>}
            {isDragging && <span className="ml-auto text-slate-500">drag to rotate</span>}
          </div>
        )}

        {/* Annotations from config */}
        {meta.annotations?.map((ann, i) => {
          if (!ann.text) return null;
          const pos = ann.position ?? { x: 0, y: 0, z: 0 };
          const p = project({ id: `ann${i}`, element: "C", x: pos.x ?? 0, y: pos.y ?? 0, z: pos.z ?? 0 });
          return (
            <div
              key={i}
              className="absolute -translate-x-1/2 rounded px-1.5 py-0.5 text-[10px] font-medium"
              style={{
                left: p.x,
                top: p.y,
                background: `${ann.color ?? "#f59e0b"}22`,
                border: `1px solid ${ann.color ?? "#f59e0b"}66`,
                color: ann.color ?? "#fbbf24",
                pointerEvents: "none",
              }}
            >
              {ann.text}
            </div>
          );
        })}
      </div>

      {/* Controls */}
      <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
        <div className="flex items-center gap-1.5">
          {STYLE_ORDER.map((s) => (
            <Button
              key={s}
              size="sm"
              variant={style === s ? "default" : "outline"}
              className="text-xs px-2.5 py-1 h-7 capitalize"
              onClick={() => setStyle(s)}
            >
              {s === "stick" ? "Ball & Stick" : s === "sphere" ? "Spacefill" : "Wireframe"}
            </Button>
          ))}
        </div>

        <div className="flex items-center gap-1.5">
          {meta.surface && (
            <Button
              size="sm"
              variant="outline"
              className={cn("text-xs h-7 gap-1.5", showSurface && "border-emerald-500 text-emerald-600")}
              onClick={() => setShowSurface((s) => !s)}
            >
              <Eye className="h-3.5 w-3.5" />
              Surface
            </Button>
          )}
          {zoomEnabled && (
            <div className="flex items-center gap-1">
              <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => setZoom((z) => Math.max(0.4, z - 0.15))} title="Zoom out">
                <ZoomOut className="h-3.5 w-3.5" />
              </Button>
              <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => setZoom((z) => Math.min(2.5, z + 0.15))} title="Zoom in">
                <ZoomIn className="h-3.5 w-3.5" />
              </Button>
            </div>
          )}
          <Button
            size="sm"
            variant="outline"
            className="text-xs h-7 gap-1.5"
            onClick={() => setIsRotating(!isRotating)}
          >
            <RotateCw className="h-3.5 w-3.5" />
            {isRotating ? "Pause Rotation" : "Auto Rotate"}
          </Button>
        </div>
      </div>

      {formula && (
        <div className="flex items-center gap-2 rounded-lg bg-muted/40 p-2.5 text-xs text-muted-foreground border">
          <Info className="h-3.5 w-3.5 text-emerald-600 shrink-0" />
          <span>
            Molecular Formula:{" "}
            <strong className="font-mono text-foreground">{formula}</strong>
            {colorscheme && <span className="ml-2">· style: {colorscheme}</span>}
            {meta.surface?.type && <span className="ml-2">· surface: {meta.surface.type}</span>}
          </span>
        </div>
      )}
    </div>
  );
}
