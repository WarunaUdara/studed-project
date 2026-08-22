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
      hex = hex
        .split("")
        .map((char) => char + char)
        .join("");
    }
    if (hex.length === 6) {
      const num = parseInt(hex, 16);
      return [(num >> 16) & 255, (num >> 8) & 255, num & 255, 1];
    }
    if (hex.length === 8) {
      const num = parseInt(hex, 16);
      return [(num >> 24) & 255, (num >> 16) & 255, (num >> 8) & 255, (num & 255) / 255];
    }
    return null;
  }

  // rgb(r, g, b) or rgba(r, g, b, a)
  const match = trimmed.match(
    /^rgba?\(\s*([\d.]+)\s*,\s*([\d.]+)\s*,\s*([\d.]+)(?:\s*,\s*([\d.]+))?\s*\)$/,
  );
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
  return v <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4;
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
  const L = 0.2104542553 * l_ + 0.793617785 * m_ - 0.0040720468 * s_;
  const A = 1.9779984951 * l_ - 2.428592205 * m_ + 0.4505937099 * s_;
  const B = 0.0259040371 * l_ + 0.7827717662 * m_ - 0.808675766 * s_;

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

export interface ParsedColor {
  r: number;
  g: number;
  b: number;
  alpha: number;
  l?: number;
  c?: number;
  h?: number;
}

/**
 * Parses OKLCH, RGB, RGBA, or Hex strings into color components.
 */
export function parseCssColor(colorStr: string): ParsedColor {
  if (!colorStr) return { r: 0, g: 0, b: 0, alpha: 1 };

  const trimmed = colorStr.trim().toLowerCase();

  // oklch(0.5 0.15 145 / 0.8)
  if (trimmed.startsWith("oklch(")) {
    const parts = trimmed
      .replace("oklch(", "")
      .replace(")", "")
      .split(/[\s/]+/);
    const l = parseFloat(parts[0]) || 0;
    const c = parseFloat(parts[1]) || 0;
    const h = parseFloat(parts[2]) || 0;
    const alpha = parts[3] ? parseFloat(parts[3]) : 1;

    // Approximate sRGB conversion for luminance calculation
    const hRad = (h * Math.PI) / 180;
    const a = c * Math.cos(hRad);
    const b = c * Math.sin(hRad);
    const l_ = l + 0.3963377774 * a + 0.2158037573 * b;
    const m_ = l - 0.1055613458 * a - 0.0638541728 * b;
    const s_ = l - 0.0894841775 * a - 1.291485548 * b;
    const lCubed = l_ * l_ * l_;
    const mCubed = m_ * m_ * m_;
    const sCubed = s_ * s_ * s_;
    const rLin = +4.0767416621 * lCubed - 3.3077115913 * mCubed + 0.2309699292 * sCubed;
    const gLin = -1.2684380046 * lCubed + 2.6097574011 * mCubed - 0.3413193965 * sCubed;
    const bLin = -0.0041960863 * lCubed - 0.7034186147 * mCubed + 1.707614701 * sCubed;

    const r = Math.min(255, Math.max(0, Math.round(rLin * 255)));
    const g = Math.min(255, Math.max(0, Math.round(gLin * 255)));
    const bColor = Math.min(255, Math.max(0, Math.round(bLin * 255)));

    return { r, g, b: bColor, alpha, l, c, h };
  }

  const rgb = parseRgbString(trimmed);
  if (rgb) {
    const oklch = rgbToOklch(rgb[0], rgb[1], rgb[2], rgb[3]);
    return { r: rgb[0], g: rgb[1], b: rgb[2], alpha: rgb[3], l: oklch.l, c: oklch.c, h: oklch.h };
  }

  return { r: 0, g: 0, b: 0, alpha: 1 };
}

/**
 * Calculates WCAG 2.2 Relative Luminance of an sRGB color.
 */
export function getRelativeLuminance(r: number, g: number, b: number): number {
  const rLin = sRgbToLinear(r);
  const gLin = sRgbToLinear(g);
  const bLin = sRgbToLinear(b);
  return 0.2126 * rLin + 0.7152 * gLin + 0.0722 * bLin;
}

/**
 * Calculates WCAG 2.2 contrast ratio between two colors (Foreground on Background).
 * Returns ratio from 1.0 to 21.0.
 */
export function calculateContrastRatio(fgStr: string, bgStr: string): number {
  const fg = parseCssColor(fgStr);
  const bg = parseCssColor(bgStr);

  const lumFg = getRelativeLuminance(fg.r, fg.g, fg.b);
  const lumBg = getRelativeLuminance(bg.r, bg.g, bg.b);

  const l1 = Math.max(lumFg, lumBg);
  const l2 = Math.min(lumFg, lumBg);

  return (l1 + 0.05) / (l2 + 0.05);
}
