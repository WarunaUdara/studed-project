import fs from "node:fs";
import path from "node:path";
import { calculateContrastRatio, parseCssColor } from "./color-utils";
import type {
  AuditFault,
  AuditFaultCategory,
  AuditOutput,
  DiscoveryOutput,
  FaultSeverity,
  ScreenSnapshot,
} from "./types";

const LOOP_DIR = path.resolve(__dirname);
const SNAPSHOTS_DIR = path.resolve(LOOP_DIR, "snapshots");
const DISCOVERY_FILE = path.resolve(LOOP_DIR, "discovery.json");
const AUDIT_OUTPUT_FILE = path.resolve(LOOP_DIR, "audit.json");

/**
 * Known OKLCH Hue palettes from index.css:
 * Brand: Hue ~145
 * Science: Hue ~252
 * Commerce: Hue ~55
 * AI: Hue ~295
 * Gold: Hue ~55 (oklch(0.67 0.185 55))
 */
const KNOWN_HUES = [145, 252, 55, 295, 247, 285];

export class DeterministicAuditor {
  private discovery: DiscoveryOutput | null = null;
  private snapshots: ScreenSnapshot[] = [];
  private faults: AuditFault[] = [];

  public loadInputs(): void {
    if (fs.existsSync(DISCOVERY_FILE)) {
      this.discovery = JSON.parse(fs.readFileSync(DISCOVERY_FILE, "utf-8"));
    }

    this.snapshots = [];
    if (fs.existsSync(SNAPSHOTS_DIR)) {
      const readDirRecursive = (dir: string) => {
        const entries = fs.readdirSync(dir, { withFileTypes: true });
        for (const entry of entries) {
          const fullPath = path.join(dir, entry.name);
          if (entry.isDirectory()) {
            readDirRecursive(fullPath);
          } else if (entry.name.endsWith(".json")) {
            try {
              const snap: ScreenSnapshot = JSON.parse(fs.readFileSync(fullPath, "utf-8"));
              this.snapshots.push(snap);
            } catch (err) {
              console.warn(`[audit] Failed to parse snapshot: ${fullPath}`, err);
            }
          }
        }
      };
      readDirRecursive(SNAPSHOTS_DIR);
    }
  }

  public runAudit(): AuditOutput {
    this.faults = [];
    console.log(`[audit] Auditing ${this.snapshots.length} captured screen snapshots...`);

    for (const snap of this.snapshots) {
      this.auditContrast(snap);
      this.auditTypography(snap);
      this.auditBoundingBoxesAndOverflow(snap);
      this.auditAccessibility(snap);
      this.auditTokenDrift(snap);
      this.auditSpacingRhythm(snap);
    }

    if (this.discovery) {
      this.auditDeadLinksAndRoutes(this.discovery);
    }

    const byCategory: Record<AuditFaultCategory, number> = {
      contrast: 0,
      "token-drift": 0,
      typography: 0,
      overlap: 0,
      "dead-links": 0,
      a11y: 0,
      "state-coverage": 0,
      "spacing-rhythm": 0,
    };

    let p0Count = 0;
    let p1Count = 0;
    let p2Count = 0;

    for (const fault of this.faults) {
      byCategory[fault.category] = (byCategory[fault.category] || 0) + 1;
      if (fault.severity === "P0") p0Count++;
      else if (fault.severity === "P1") p1Count++;
      else if (fault.severity === "P2") p2Count++;
    }

    const output: AuditOutput = {
      timestamp: new Date().toISOString(),
      summary: {
        totalFaults: this.faults.length,
        p0Count,
        p1Count,
        p2Count,
        byCategory,
      },
      faults: this.faults,
    };

    fs.writeFileSync(AUDIT_OUTPUT_FILE, JSON.stringify(output, null, 2));
    console.log(
      `[audit] Audit complete. Emitted ${this.faults.length} faults to ${AUDIT_OUTPUT_FILE}`,
    );
    return output;
  }

  /**
   * 1. WCAG 2.2 AA Contrast check on styled text elements
   */
  private auditContrast(snap: ScreenSnapshot): void {
    for (const elem of snap.styledElements) {
      if (!elem.textSnippet || elem.textSnippet.trim().length === 0) continue;
      const fg = elem.styles.color;
      const bg = elem.styles.backgroundColor;
      if (!fg || !bg || bg === "transparent" || bg === "oklch(0 0 0 / 0)") continue;

      const ratio = calculateContrastRatio(fg, bg);
      const fontSizePx = parseFloat(elem.styles.fontSize) || 16;
      const isBold = parseInt(elem.styles.fontWeight, 10) >= 600;
      const isLargeText = fontSizePx >= 24 || (fontSizePx >= 18.5 && isBold);
      const minRatio = isLargeText ? 3.0 : 4.5;

      if (ratio < minRatio && ratio > 1.05) {
        const severity: FaultSeverity = ratio < 2.5 ? "P0" : "P1";
        this.faults.push({
          id: `contrast-${snap.metadata.role}-${snap.metadata.path}-${elem.selector}`.replace(
            /[^a-zA-Z0-9-]/g,
            "_",
          ),
          category: "contrast",
          severity,
          screen: snap.metadata.path,
          role: snap.metadata.role,
          viewport: snap.metadata.viewport,
          elementSelector: elem.selector,
          evidence: {
            foreground: fg,
            background: bg,
            measuredRatio: Number(ratio.toFixed(2)),
            requiredRatio: minRatio,
            fontSize: elem.styles.fontSize,
            fontWeight: elem.styles.fontWeight,
            textSnippet: elem.textSnippet.slice(0, 40),
          },
          message: `Insufficient WCAG 2.2 contrast (${ratio.toFixed(2)}:1 < ${minRatio}:1) on "${elem.textSnippet.slice(0, 30)}"`,
          suggestedFix: `Adjust color token to exceed ${minRatio}:1 against ${bg}.`,
        });
      }
    }
  }

  /**
   * 2. Typography scale & hierarchy
   */
  private auditTypography(snap: ScreenSnapshot): void {
    let prevHeadingLevel = 0;
    let prevHeadingSize = 999;

    for (const item of snap.textInventory) {
      if (item.type === "heading" && item.level) {
        const styled = snap.styledElements.find((e) => e.selector === item.selector);
        const fontSize = styled ? parseFloat(styled.styles.fontSize) || 16 : 16;

        // Check heading hierarchy inversion (e.g. H2 larger than H1 on same screen)
        if (
          prevHeadingLevel > 0 &&
          item.level > prevHeadingLevel &&
          fontSize > prevHeadingSize + 2
        ) {
          this.faults.push({
            id: `typo-inversion-${snap.metadata.path}-${item.level}`.replace(/[^a-zA-Z0-9-]/g, "_"),
            category: "typography",
            severity: "P1",
            screen: snap.metadata.path,
            role: snap.metadata.role,
            viewport: snap.metadata.viewport,
            evidence: {
              headingLevel: item.level,
              currentSize: fontSize,
              prevHeadingLevel,
              prevHeadingSize,
            },
            message: `Heading hierarchy inverted: H${item.level} (${fontSize}px) is larger than H${prevHeadingLevel} (${prevHeadingSize}px)`,
            suggestedFix: `Align heading styles to the standard type scale.`,
          });
        }
        prevHeadingLevel = item.level;
        prevHeadingSize = fontSize;
      }
    }

    // Check tiny unreadable text (<11px)
    for (const elem of snap.styledElements) {
      const sizePx = parseFloat(elem.styles.fontSize) || 16;
      if (sizePx < 11 && elem.textSnippet && elem.textSnippet.trim().length > 3) {
        this.faults.push({
          id: `typo-tiny-${snap.metadata.path}-${elem.selector}`.replace(/[^a-zA-Z0-9-]/g, "_"),
          category: "typography",
          severity: "P2",
          screen: snap.metadata.path,
          role: snap.metadata.role,
          viewport: snap.metadata.viewport,
          elementSelector: elem.selector,
          evidence: {
            fontSize: elem.styles.fontSize,
            textSnippet: elem.textSnippet.slice(0, 30),
          },
          message: `Body text font size (${elem.styles.fontSize}) is below the 11px accessibility threshold.`,
          suggestedFix: `Scale font size up to minimum 12px or use standard text-xs (12px).`,
        });
      }
    }
  }

  /**
   * 3. Bounding box overflow & clipping
   */
  private auditBoundingBoxesAndOverflow(snap: ScreenSnapshot): void {
    const vpWidth = snap.metadata.viewportSize.width;

    for (const { selector, box } of snap.boundingBoxes) {
      // Ignore intentional horizontal scroll carousels / containers
      const isIntentionalScroll =
        selector.includes("no-scrollbar") ||
        selector.includes("overflow-x") ||
        selector.includes("course-card") ||
        selector.includes("carousel") ||
        selector.includes("track");
      if (isIntentionalScroll) continue;

      // Horizontal overflow beyond screen boundaries
      if (box.x + box.width > vpWidth + 6 && box.width > 0) {
        this.faults.push({
          id: `overflow-${snap.metadata.viewport}-${snap.metadata.path}-${selector}`.replace(
            /[^a-zA-Z0-9-]/g,
            "_",
          ),
          category: "overlap",
          severity: "P1",
          screen: snap.metadata.path,
          role: snap.metadata.role,
          viewport: snap.metadata.viewport,
          elementSelector: selector,
          evidence: {
            elementRightEdge: box.x + box.width,
            viewportWidth: vpWidth,
            box,
          },
          message: `Element overflows viewport horizontally (${box.x + box.width}px > ${vpWidth}px)`,
          suggestedFix: `Add responsive max-w-full or overflow-x-hidden to prevent horizontal page scrolling.`,
        });
      }

      // Unintentional text clipping without scroll affordance
      if (
        box.scrollWidth &&
        box.clientWidth &&
        box.scrollWidth > box.clientWidth + 8 &&
        !box.isClipped
      ) {
        this.faults.push({
          id: `clipping-${snap.metadata.path}-${selector}`.replace(/[^a-zA-Z0-9-]/g, "_"),
          category: "overlap",
          severity: "P2",
          screen: snap.metadata.path,
          role: snap.metadata.role,
          viewport: snap.metadata.viewport,
          elementSelector: selector,
          evidence: {
            scrollWidth: box.scrollWidth,
            clientWidth: box.clientWidth,
          },
          message: `Text or child content is clipped (scrollWidth: ${box.scrollWidth}px > clientWidth: ${box.clientWidth}px)`,
          suggestedFix: `Apply text-balance, text-wrap, or flexible container widths.`,
        });
      }
    }
  }

  /**
   * 4. Accessibility Tree, Form Labels, Alt text, Focusability
   */
  private auditAccessibility(snap: ScreenSnapshot): void {
    // Focus order & missing accessible names
    for (const item of snap.focusOrder) {
      if (item.tag === "button" || item.tag === "a") {
        if (!item.accessibleName || item.accessibleName.trim().length === 0) {
          this.faults.push({
            id: `a11y-name-${snap.metadata.path}-${item.selector}`.replace(/[^a-zA-Z0-9-]/g, "_"),
            category: "a11y",
            severity: "P1",
            screen: snap.metadata.path,
            role: snap.metadata.role,
            viewport: snap.metadata.viewport,
            elementSelector: item.selector,
            evidence: {
              tag: item.tag,
              role: item.role,
              tabIndex: item.tabIndex,
            },
            message: `Interactive <${item.tag}> has no accessible name or aria-label.`,
            suggestedFix: `Add aria-label="..." or accessible text inside the interactive element.`,
          });
        }
      }
    }
  }

  /**
   * 5. Token Drift & Raw Color Audit
   */
  private auditTokenDrift(snap: ScreenSnapshot): void {
    for (const elem of snap.styledElements) {
      const colorOklch = elem.styles.color;
      if (colorOklch.startsWith("oklch(")) {
        const parsed = parseCssColor(colorOklch);
        if (parsed.h !== undefined && parsed.c !== undefined && parsed.c > 0.05) {
          // Check if hue matches one of our defined palettes (within tolerance)
          const isKnown = KNOWN_HUES.some((kh) => Math.abs(kh - parsed.h!) < 20);
          if (!isKnown) {
            this.faults.push({
              id: `token-drift-${snap.metadata.path}-${elem.selector}`.replace(
                /[^a-zA-Z0-9-]/g,
                "_",
              ),
              category: "token-drift",
              severity: "P2",
              screen: snap.metadata.path,
              role: snap.metadata.role,
              viewport: snap.metadata.viewport,
              elementSelector: elem.selector,
              evidence: {
                detectedOklch: colorOklch,
                hue: parsed.h,
                allowedHues: KNOWN_HUES,
              },
              message: `Color hue (${parsed.h?.toFixed(0)}) deviates from the OKLCH design system tokens.`,
              suggestedFix: `Replace with semantic design system tokens (--primary, --science, --commerce, --gold).`,
            });
          }
        }
      }
    }
  }

  /**
   * 6. Spacing Rhythm & Consistency
   */
  private auditSpacingRhythm(snap: ScreenSnapshot): void {
    // Audit grid / card alignment consistency
    const cardBoxes = snap.boundingBoxes
      .filter((b) => b.selector.includes("card") || b.selector.includes("bento"))
      .map((b) => b.box);

    if (cardBoxes.length >= 3) {
      const heights = cardBoxes.map((b) => b.height);
      const avg = heights.reduce((a, b) => a + b, 0) / heights.length;
      for (const h of heights) {
        if (Math.abs(h - avg) > 40 && Math.abs(h - avg) < 120) {
          // Subtle height drift in supposedly aligned cards
          this.faults.push({
            id: `spacing-rhythm-${snap.metadata.path}-cards`.replace(/[^a-zA-Z0-9-]/g, "_"),
            category: "spacing-rhythm",
            severity: "P2",
            screen: snap.metadata.path,
            role: snap.metadata.role,
            viewport: snap.metadata.viewport,
            evidence: {
              cardHeights: heights,
              averageHeight: Math.round(avg),
            },
            message: `Card components exhibit inconsistent height rhythm (${heights.join(", ")}px).`,
            suggestedFix: `Standardize card grid with h-full and flex-1 stretch layout.`,
          });
          break;
        }
      }
    }
  }

  /**
   * 7. Dead Links & Routing Integrity
   */
  private auditDeadLinksAndRoutes(discovery: DiscoveryOutput): void {
    for (const [roleName, roleData] of Object.entries(discovery.roles)) {
      for (const err404 of roleData.errors404) {
        this.faults.push({
          id: `dead-link-404-${roleName}-${err404}`.replace(/[^a-zA-Z0-9-]/g, "_"),
          category: "dead-links",
          severity: "P0",
          screen: err404,
          role: roleName as any,
          viewport: "desktop",
          evidence: {
            errorUrl: err404,
          },
          message: `Encountered broken 404 navigation to "${err404}".`,
          suggestedFix: `Implement route or update navigation links to target existing pages.`,
        });
      }
    }
  }
}

// Direct CLI entrypoint
if (import.meta.main) {
  const auditor = new DeterministicAuditor();
  auditor.loadInputs();
  const output = auditor.runAudit();
  console.log(`\n--- AUDIT SUMMARY ---`);
  console.log(`Total Faults: ${output.summary.totalFaults}`);
  console.log(`P0 (Critical): ${output.summary.p0Count}`);
  console.log(`P1 (Visual / Interaction): ${output.summary.p1Count}`);
  console.log(`P2 (Polish): ${output.summary.p2Count}`);
  console.log(`By Category:`, output.summary.byCategory);
}
