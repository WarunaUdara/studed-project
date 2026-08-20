import * as crypto from "node:crypto";
import * as fs from "node:fs";
import * as path from "node:path";
import { type Browser, type Page } from "@playwright/test";
import { formatColorToOklch } from "./color-utils";
import { setupMockGraphQL } from "./mock-api";
import type {
  AccessibilityNode,
  DiscoveredScreen,
  DomOutlineNode,
  DopamineProbeResult,
  FocusOrderItem,
  LinkInventoryItem,
  NodeBoundingBox,
  ScreenSnapshot,
  ScreenState,
  StyledElementFingerprint,
  TextInventoryItem,
  UserRole,
  ViewportMode,
} from "./types";

const SNAPSHOTS_DIR = path.resolve(__dirname, "snapshots");
const BASE_URL = process.env.PLAYWRIGHT_BASE_URL ?? "http://localhost:5173";

export const VIEWPORTS: Record<ViewportMode, { width: number; height: number }> = {
  desktop: { width: 1280, height: 800 },
  mobile: { width: 390, height: 844 },
};

/**
 * Computes a deterministic path hash for safe file storage.
 */
export function getPathSlug(routePath: string, viewport: ViewportMode, state: ScreenState): string {
  const clean = routePath.replace(/^\/+/, "").replace(/[^a-zA-Z0-9_-]/g, "_") || "root";
  const hash = crypto.createHash("sha256").update(`${routePath}:${viewport}:${state}`).digest("hex").slice(0, 8);
  return `${clean}_${viewport}_${state}_${hash}`;
}

/**
 * Injected browser script to extract the structured DOM outline tree, styled elements, and bounding boxes.
 */
async function extractBrowserFingerprint(page: Page): Promise<{
  domOutline: DomOutlineNode[];
  accessibilityTree: AccessibilityNode | null;
  styledElements: StyledElementFingerprint[];
  boundingBoxes: Array<{ selector: string; box: NodeBoundingBox }>;
  textInventory: TextInventoryItem[];
  linkInventory: LinkInventoryItem[];
  focusOrder: FocusOrderItem[];
  dopamineProbes: DopamineProbeResult;
}> {
  return page.evaluate(() => {
    // Helper to generate a unique readable CSS selector
    function getCssSelector(el: Element): string {
      if (el.id) return `#${el.id}`;
      const tag = el.tagName.toLowerCase();
      if (tag === "body" || tag === "html") return tag;

      const parent = el.parentElement;
      if (!parent) return tag;

      const siblings = Array.from(parent.children).filter((c) => c.tagName === el.tagName);
      if (siblings.length === 1) {
        return `${getCssSelector(parent)} > ${tag}`;
      }
      const index = siblings.indexOf(el) + 1;
      return `${getCssSelector(parent)} > ${tag}:nth-of-type(${index})`;
    }

    // 1. DOM Outline Tree Walker
    function buildDomOutline(node: Element, depth = 0): DomOutlineNode | null {
      if (depth > 6) return null; // Prevent runaway nesting
      const rect = node.getBoundingClientRect();
      const isVisible = rect.width > 0 && rect.height > 0 && window.getComputedStyle(node).display !== "none";

      if (!isVisible && depth > 1) return null;

      const tag = node.tagName.toLowerCase();
      if (["script", "style", "svg", "noscript"].includes(tag) && depth > 1) {
        return null;
      }

      const text = (node.textContent || "").trim().slice(0, 80);
      const classes = typeof node.className === "string" ? node.className.slice(0, 100) : undefined;
      const role = node.getAttribute("role") || undefined;

      const childNodes: DomOutlineNode[] = [];
      for (const child of Array.from(node.children)) {
        const parsed = buildDomOutline(child, depth + 1);
        if (parsed) childNodes.push(parsed);
      }

      return {
        id: node.id || undefined,
        tag,
        classes,
        role,
        textSnippet: text ? text.replace(/\s+/g, " ") : undefined,
        box: {
          x: Math.round(rect.x),
          y: Math.round(rect.y),
          width: Math.round(rect.width),
          height: Math.round(rect.height),
        },
        children: childNodes.length > 0 ? childNodes : undefined,
      };
    }

    // 2. Styled Elements & Computed Styles
    const styledElements: Array<{
      selector: string;
      tag: string;
      id?: string;
      role?: string;
      textSnippet?: string;
      rawStyles: {
        color: string;
        backgroundColor: string;
        fontFamily: string;
        fontSize: string;
        lineHeight: string;
        fontWeight: string;
        borderRadius: string;
        borderColor: string;
        borderWidth: string;
        boxShadow: string;
        opacity: string;
      };
      box: NodeBoundingBox;
    }> = [];

    const boundingBoxes: Array<{ selector: string; box: NodeBoundingBox }> = [];
    const textInventory: TextInventoryItem[] = [];
    const linkInventory: LinkInventoryItem[] = [];

    // Query candidate interactive & structural elements
    const candidateNodes = document.querySelectorAll(
      "h1, h2, h3, h4, h5, h6, p, button, a, input, select, textarea, [role='button'], [role='tab'], [role='alert'], [role='dialog'], header, nav, main, article, section, [data-testid]"
    );

    for (const node of Array.from(candidateNodes)) {
      const el = node as HTMLElement;
      const rect = el.getBoundingClientRect();
      const style = window.getComputedStyle(el);

      const isVisible = rect.width > 0 && rect.height > 0 && style.display !== "none" && style.visibility !== "hidden";
      if (!isVisible) continue;

      const selector = getCssSelector(el);
      const tag = el.tagName.toLowerCase();
      const role = el.getAttribute("role") || undefined;
      const text = (el.innerText || el.textContent || "").trim();

      const isClipped = el.scrollWidth > el.clientWidth || el.scrollHeight > el.clientHeight;
      const box: NodeBoundingBox = {
        x: Math.round(rect.x),
        y: Math.round(rect.y),
        width: Math.round(rect.width),
        height: Math.round(rect.height),
        isClipped,
        scrollWidth: el.scrollWidth,
        clientWidth: el.clientWidth,
        scrollHeight: el.scrollHeight,
        clientHeight: el.clientHeight,
      };

      boundingBoxes.push({ selector, box });

      styledElements.push({
        selector,
        tag,
        id: el.id || undefined,
        role,
        textSnippet: text ? text.slice(0, 60).replace(/\s+/g, " ") : undefined,
        rawStyles: {
          color: style.color,
          backgroundColor: style.backgroundColor,
          fontFamily: style.fontFamily,
          fontSize: style.fontSize,
          lineHeight: style.lineHeight,
          fontWeight: style.fontWeight,
          borderRadius: style.borderRadius,
          borderColor: style.borderColor,
          borderWidth: style.borderWidth,
          boxShadow: style.boxShadow,
          opacity: style.opacity,
        },
        box,
      });

      // 3. Text Inventory Categorization
      if (text) {
        let type: TextInventoryItem["type"] = "other";
        let level: number | undefined;

        if (/^h[1-6]$/.test(tag)) {
          type = "heading";
          level = parseInt(tag[1], 10);
        } else if (tag === "button" || role === "button") {
          type = "button";
        } else if (tag === "a" || role === "link") {
          type = "link";
        } else if (tag === "label") {
          type = "label";
        } else if (tag === "p") {
          type = "paragraph";
        } else if (el.classList.contains("badge") || el.getAttribute("data-badge") !== null) {
          type = "badge";
        } else if (role === "alert" || role === "status") {
          type = "toast";
        }

        // Avoid adding huge paragraphs to text inventory
        if (text.length <= 250) {
          textInventory.push({
            type,
            text: text.replace(/\s+/g, " "),
            level,
            selector,
          });
        }
      }

      // 4. Link Inventory
      if (tag === "a") {
        const href = el.getAttribute("href") || "";
        const resolvedUrl = (el as HTMLAnchorElement).href || "";
        linkInventory.push({
          text: text.slice(0, 50).replace(/\s+/g, " ") || el.getAttribute("aria-label") || "[Icon Link]",
          href,
          resolvedUrl,
          isInternal: resolvedUrl.startsWith(window.location.origin),
          isDisabled: el.getAttribute("aria-disabled") === "true" || el.classList.contains("disabled"),
          selector,
        });
      }
    }

    // 5. Focus Order Walk
    const focusableElements = Array.from(
      document.querySelectorAll(
        'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
      )
    ).filter((el) => {
      const r = el.getBoundingClientRect();
      const s = window.getComputedStyle(el);
      return r.width > 0 && r.height > 0 && s.display !== "none" && s.visibility !== "hidden";
    });

    const focusOrder: FocusOrderItem[] = focusableElements.map((el, idx) => ({
      order: idx + 1,
      tag: el.tagName.toLowerCase(),
      role: el.getAttribute("role") || undefined,
      accessibleName:
        el.getAttribute("aria-label") ||
        (el as HTMLElement).innerText?.trim()?.slice(0, 40) ||
        el.getAttribute("placeholder") ||
        undefined,
      selector: getCssSelector(el),
      tabIndex: parseInt(el.getAttribute("tabindex") || "0", 10),
    }));

    // 6. Dopamine Probes
    const confettiCanvas = document.querySelector("canvas[style*='pointer-events: none'], [data-confetti='true']");
    const xpToast = document.querySelector("[role='alert'], [role='status'], .xp-toast, [data-xp-toast='true']");
    const streakElement = document.querySelector("[title*='Streak'], [aria-label*='Streak'], [data-streak='true']");
    const keysElement = document.querySelector("[title*='Keys'], [aria-label*='Keys'], [data-keys='true']");
    const progressRing = document.querySelector("[role='progressbar'], svg circle[stroke-dasharray], .progress-ring");

    const dopamineProbes: DopamineProbeResult = {
      confettiPresent: !!confettiCanvas,
      xpToastPresent: !!xpToast,
      xpValue: xpToast ? (xpToast.textContent || "").trim() : undefined,
      streakBadgePresent: !!streakElement,
      streakValue: streakElement ? (streakElement.textContent || "").trim() : undefined,
      keysBadgePresent: !!keysElement,
      keysValue: keysElement ? (keysElement.textContent || "").trim() : undefined,
      progressRingPresent: !!progressRing,
      audioTriggerObserved: false, // Updated by Playwright test harness if probed
    };

    // Accessibility Tree Builder
    function buildA11yTree(node: Element, depth = 0): AccessibilityNode | null {
      if (depth > 6) return null;
      const tag = node.tagName.toLowerCase();
      if (["script", "style", "noscript", "svg"].includes(tag) && depth > 1) return null;

      const style = window.getComputedStyle(node);
      if (style.display === "none" || style.visibility === "hidden") return null;

      const role = node.getAttribute("role") || tag;
      const name =
        node.getAttribute("aria-label") ||
        node.getAttribute("aria-labelledby") ||
        node.getAttribute("title") ||
        node.getAttribute("alt") ||
        (node.children.length === 0 ? (node.textContent || "").trim().slice(0, 50) : "");

      const disabled = node.hasAttribute("disabled") || node.getAttribute("aria-disabled") === "true";
      const expanded = node.getAttribute("aria-expanded") === "true";
      const checked = node.getAttribute("aria-checked") === "true";

      const children: AccessibilityNode[] = [];
      for (const child of Array.from(node.children)) {
        const c = buildA11yTree(child, depth + 1);
        if (c) children.push(c);
      }

      if (!name && children.length === 0 && !["button", "a", "input", "h1", "h2", "h3", "h4", "h5", "h6"].includes(tag)) {
        return null;
      }

      return {
        role,
        name: name || tag,
        disabled: disabled || undefined,
        expanded: node.hasAttribute("aria-expanded") ? expanded : undefined,
        checked: node.hasAttribute("aria-checked") ? checked : undefined,
        children: children.length > 0 ? children : undefined,
      };
    }

    const rootOutline = buildDomOutline(document.body);
    const rootA11y = buildA11yTree(document.body);

    return {
      domOutline: rootOutline ? [rootOutline] : [],
      accessibilityTree: rootA11y,
      styledElements: styledElements.map((s) => ({
        selector: s.selector,
        tag: s.tag,
        id: s.id,
        role: s.role,
        textSnippet: s.textSnippet,
        styles: {
          color: s.rawStyles.color,
          backgroundColor: s.rawStyles.backgroundColor,
          fontFamily: s.rawStyles.fontFamily,
          fontSize: s.rawStyles.fontSize,
          lineHeight: s.rawStyles.lineHeight,
          fontWeight: s.rawStyles.fontWeight,
          borderRadius: s.rawStyles.borderRadius,
          borderColor: s.rawStyles.borderColor,
          borderWidth: s.rawStyles.borderWidth,
          boxShadow: s.rawStyles.boxShadow,
          opacity: s.rawStyles.opacity,
        },
        box: s.box,
      })),
      boundingBoxes,
      textInventory,
      linkInventory,
      focusOrder,
      dopamineProbes,
    };
  });
}

/**
 * Captures a complete text fingerprint snapshot for a single screen under a given viewport and state.
 */
export async function captureScreenSnapshot(
  page: Page,
  screen: DiscoveredScreen,
  viewport: ViewportMode = "desktop",
  state: ScreenState = "default"
): Promise<ScreenSnapshot> {
  const size = VIEWPORTS[viewport];
  await page.setViewportSize(size);
  await setupMockGraphQL(page);

  const targetUrl = `${BASE_URL}${screen.path}`;
  await page.goto(targetUrl, { waitUntil: "domcontentloaded", timeout: 15000 });
  await page.waitForTimeout(400); // Allow react rendering and animations to settle

  const title = await page.title().catch(() => screen.title);

  // In-page DOM extraction
  const rawFingerprint = await extractBrowserFingerprint(page);

  // Format all color values in styled elements to strict OKLCH tokens
  const styledElements: StyledElementFingerprint[] = rawFingerprint.styledElements.map((el) => ({
    selector: el.selector,
    tag: el.tag,
    id: el.id,
    role: el.role,
    textSnippet: el.textSnippet,
    box: el.box,
    styles: {
      color: formatColorToOklch(el.styles.color),
      backgroundColor: formatColorToOklch(el.styles.backgroundColor),
      fontFamily: el.styles.fontFamily,
      fontSize: el.styles.fontSize,
      lineHeight: el.styles.lineHeight,
      fontWeight: el.styles.fontWeight,
      borderRadius: el.styles.borderRadius,
      borderColor: formatColorToOklch(el.styles.borderColor),
      borderWidth: el.styles.borderWidth,
      boxShadow: el.styles.boxShadow,
      opacity: el.styles.opacity,
    },
  }));

  const snapshot: ScreenSnapshot = {
    metadata: {
      role: screen.role,
      path: screen.path,
      routeFile: screen.routeFile,
      title: title || screen.title,
      viewport,
      viewportSize: size,
      state,
      timestamp: new Date().toISOString(),
    },
    domOutline: rawFingerprint.domOutline,
    accessibilityTree: rawFingerprint.accessibilityTree,
    styledElements,
    boundingBoxes: rawFingerprint.boundingBoxes,
    textInventory: rawFingerprint.textInventory,
    linkInventory: rawFingerprint.linkInventory,
    focusOrder: rawFingerprint.focusOrder,
    dopamineProbes: rawFingerprint.dopamineProbes,
  };

  // Save to disk
  const roleDir = path.join(SNAPSHOTS_DIR, screen.role);
  fs.mkdirSync(roleDir, { recursive: true });

  const filename = `${getPathSlug(screen.path, viewport, state)}.json`;
  const fullPath = path.join(roleDir, filename);
  fs.writeFileSync(fullPath, JSON.stringify(snapshot, null, 2), "utf-8");

  return snapshot;
}

/**
 * Captures snapshots for an array of discovered screens across viewports.
 */
export async function captureAllSnapshots(
  browser: Browser,
  role: UserRole,
  credentials: { email: string; pass: string },
  screens: DiscoveredScreen[],
  viewports: ViewportMode[] = ["desktop", "mobile"]
): Promise<ScreenSnapshot[]> {
  const context = await browser.newContext();
  const page = await context.newPage();

  const snapshots: ScreenSnapshot[] = [];

  // Authenticate first. The GraphQL mock has to be installed before the login
  // navigation, not just before each snapshot: without it the sign-in call goes
  // to a backend that is not running during an offline audit, and every
  // protected screen is then captured as a logged-out redirect.
  await setupMockGraphQL(page);

  try {
    await page.goto(`${BASE_URL}/login`, { waitUntil: "domcontentloaded", timeout: 15000 });
    await page.waitForSelector("#email", { timeout: 8000 });
    await page.locator("#email").fill(credentials.email);
    await page.locator("#password").fill(credentials.pass);
    await page.getByRole("button", { name: "Sign in" }).click();
    await page.waitForFunction(() => window.location.pathname !== "/login", { timeout: 10000 });
  } catch (err) {
    console.warn(`[snapshot] Auth failed for ${role}:`, err);
  }

  for (const screen of screens) {
    for (const vp of viewports) {
      try {
        console.log(`[snapshot] Capturing ${screen.role} -> ${screen.path} (${vp})...`);
        const snap = await captureScreenSnapshot(page, screen, vp, "default");
        snapshots.push(snap);
      } catch (err) {
        console.warn(`[snapshot] Error capturing ${screen.path} (${vp}):`, err);
      }
    }
  }

  await context.close();
  return snapshots;
}

/**
 * High-level engine runner that reads discovery.json and captures snapshots for all roles.
 */
export async function runSnapshotEngine(viewports: ViewportMode[] = ["desktop", "mobile"]): Promise<ScreenSnapshot[]> {
  const { chromium } = await import("@playwright/test");
  const DISCOVERY_FILE = path.resolve(__dirname, "discovery.json");

  if (!fs.existsSync(DISCOVERY_FILE)) {
    console.warn(`[snapshot] discovery.json not found. Run discovery first.`);
    return [];
  }

  const discovery = JSON.parse(fs.readFileSync(DISCOVERY_FILE, "utf-8"));
  const browser = await chromium.launch({ headless: true });
  const allSnapshots: ScreenSnapshot[] = [];

  try {
    // 1. Student Journey
    if (discovery.roles?.student?.screens?.length) {
      console.log(`[snapshot] Capturing ${discovery.roles.student.screens.length} Student screens...`);
      const studentSnaps = await captureAllSnapshots(
        browser,
        "student",
        { email: "demo.student@studed.lk", pass: "password1234" },
        discovery.roles.student.screens,
        viewports
      );
      allSnapshots.push(...studentSnaps);
    }

    // 2. Educator Journey
    if (discovery.roles?.educator?.screens?.length) {
      console.log(`[snapshot] Capturing ${discovery.roles.educator.screens.length} Educator screens...`);
      const educatorSnaps = await captureAllSnapshots(
        browser,
        "educator",
        { email: "demo.educator@studed.lk", pass: "password1234" },
        discovery.roles.educator.screens,
        viewports
      );
      allSnapshots.push(...educatorSnaps);
    }
  } finally {
    await browser.close();
  }

  console.log(`[snapshot] Finished capturing ${allSnapshots.length} total snapshots.`);
  return allSnapshots;
}

