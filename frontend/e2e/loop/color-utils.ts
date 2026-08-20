/**
 * Color conversion utilities for converting browser computed RGB/RGBA colors to OKLCH.
 * Conforms to the CSS Color Module Level 4 specification.
 */

export interface OklchColor {
  l: number; // 0..1 Lightness
  c: number; // 0..0.4+ Chroma
  h: number; // 0..360 Hue
  alpha: number; // 0..1 Alpha
  raw: string; // Formatted oklch string
}

/**
 * Parses an rgb, rgba, or hex string into [r, g, b, a] where r,g,b in [0, 255] and a in [0, 1].
 */
export function parseRgbString(colorStr: string): [number, number, number, number] | null {
  if (!colorStr || typeof colorStr !== "string") return null;

  const trimmed = colorStr.trim().toLowerCase();

  // Transparent
  if (trimmed === "transparent" || trimmed === "rgba(0, 0, 0, 0)") {
    return [0, 0, 0, 0];
  }

  // hex3/4/6/8
  if (trimmed.startsWith("#")) {
    let hex = trimmed.slice(1);
    if (hex.length === 3 || hex.length === 4) {
      hex = hex.split("").map((char) => char + char).join("");
    }
    if (hex.length === 6) {
      const num = parseInt(hex, 16);
      return [(num >> 16) & 255, (num >> 8) & 255, num & 255, 1];
    }
    if (hex.length === 8) {
      const num = parseInt(hex, 16);
      return [(num >> 24) & 255, (num >> 16) & 255, (num >> 8) & 255, ((num & 255) / 255)];
    }
    return null;
  }

  // rgb(r, g, b) or rgba(r, g, b, a)
  const match = trimmed.match(/^rgba?\(\s*([\d.]+)\s*,\s*([\d.]+)\s*,\s*([\d.]+)(?:\s*,\s*([\d.]+))?\s*\)$/);
  if (match) {
    const r = parseFloat(match[1]);
    const g = parseFloat(match[2]);
    const b = parseFloat(match[3]);
    const a = match[4] !== undefined ? parseFloat(match[4]) : 1;
    return [r, g, b, a];
  }

  return null;
}

/**
 * Converts sRGB [0..255] to linear sRGB [0..1]
 */
function sRgbToLinear(c: number): number {
  const v = c / 255;
  return v <= 0.04045 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
}

/**
 * Converts sRGB [0..255] values to OKLCH.
 */
export function rgbToOklch(r: number, g: number, b: number, a = 1): OklchColor {
  // 1. Linear sRGB
  const rLin = sRgbToLinear(r);
  const gLin = sRgbToLinear(g);
  const bLin = sRgbToLinear(b);

  // 2. Linear sRGB to LMS cone response (OKLab matrix)
  const l = 0.4122214708 * rLin + 0.5363325363 * gLin + 0.0514459929 * bLin;
  const m = 0.2119034982 * rLin + 0.6806995451 * gLin + 0.1073969566 * bLin;
  const s = 0.0883024619 * rLin + 0.2817188376 * gLin + 0.6299787005 * bLin;

  // 3. Cube root of LMS
  const l_ = Math.cbrt(l);
  const m_ = Math.cbrt(m);
  const s_ = Math.cbrt(s);

  // 4. LMS to OKLab
  const L = 0.2104542553 * l_ + 0.7936177850 * m_ - 0.0040720468 * s_;
  const A = 1.9779984951 * l_ - 2.4285922050 * m_ + 0.4505937099 * s_;
  const B = 0.0259040371 * l_ + 0.7827717662 * m_ - 0.8086757660 * s_;

  // 5. OKLab to OKLCH
  const C = Math.sqrt(A * A + B * B);
  let H = (Math.atan2(B, A) * 180) / Math.PI;
  if (H < 0) H += 360;

  // Round values for readable and deterministic output
  const lRounded = Math.round(L * 1000) / 1000;
  const cRounded = Math.round(C * 1000) / 1000;
  const hRounded = Math.round(H * 10) / 10;
  const alphaRounded = Math.round(a * 100) / 100;

  const raw =
    alphaRounded < 1
      ? `oklch(${lRounded} ${cRounded} ${hRounded} / ${alphaRounded})`
      : `oklch(${lRounded} ${cRounded} ${hRounded})`;

  return {
    l: lRounded,
    c: cRounded,
    h: hRounded,
    alpha: alphaRounded,
    raw,
  };
}

/**
 * Converts any browser color string (rgb, rgba, hex) to an OKLCH string.
 * If unable to parse, returns original string.
 */
export function formatColorToOklch(colorStr: string): string {
  if (!colorStr) return "";
  if (colorStr.startsWith("oklch(")) return colorStr;

  const parsed = parseRgbString(colorStr);
  if (!parsed) return colorStr;

  if (parsed[3] === 0) return "transparent";

  const oklch = rgbToOklch(parsed[0], parsed[1], parsed[2], parsed[3]);
  return oklch.raw;
}
