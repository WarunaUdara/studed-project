/**
 * Type definitions for the StudEd Self-Evaluating UI/UX Production Loop.
 */

export type UserRole = "student" | "educator" | "public";
export type ViewportMode = "desktop" | "mobile";
export type ScreenState = "default" | "loading" | "empty" | "error" | "success";

export interface StaticRoute {
  routeFile: string;
  routePattern: string;
  isDynamic: boolean;
  params: string[];
}

export interface DiscoveredScreen {
  path: string;
  routeFile: string;
  depth: number;
  title: string;
  role: UserRole;
  parentPath?: string;
}

export interface DiscoveryOutput {
  timestamp: string;
  staticRoutes: StaticRoute[];
  roles: {
    student: {
      screens: DiscoveredScreen[];
      redirects: Array<{ from: string; to: string }>;
      errors404: string[];
    };
    educator: {
      screens: DiscoveredScreen[];
      redirects: Array<{ from: string; to: string }>;
      errors404: string[];
    };
  };
}

export interface NodeBoundingBox {
  x: number;
  y: number;
  width: number;
  height: number;
  isClipped?: boolean;
  scrollWidth?: number;
  clientWidth?: number;
  scrollHeight?: number;
  clientHeight?: number;
}

export interface DomOutlineNode {
  id?: string;
  tag: string;
  classes?: string;
  role?: string;
  textSnippet?: string;
  box?: NodeBoundingBox;
  children?: DomOutlineNode[];
}

export interface AccessibilityNode {
  role: string;
  name: string;
  description?: string;
  value?: string;
  disabled?: boolean;
  expanded?: boolean;
  checked?: boolean;
  focused?: boolean;
  focusable?: boolean;
  children?: AccessibilityNode[];
}

export interface ComputedStyles {
  color: string; // Formatted as OKLCH
  backgroundColor: string; // Formatted as OKLCH
  fontFamily: string;
  fontSize: string;
  lineHeight: string;
  fontWeight: string;
  borderRadius: string;
  borderColor: string; // Formatted as OKLCH
  borderWidth: string;
  boxShadow: string;
  opacity: string;
}

export interface StyledElementFingerprint {
  selector: string;
  tag: string;
  id?: string;
  role?: string;
  textSnippet?: string;
  styles: ComputedStyles;
  box: NodeBoundingBox;
}

export interface TextInventoryItem {
  type: "heading" | "button" | "link" | "label" | "badge" | "toast" | "paragraph" | "other";
  text: string;
  level?: number;
  selector?: string;
}

export interface LinkInventoryItem {
  text: string;
  href: string;
  resolvedUrl: string;
  isInternal: boolean;
  isDisabled: boolean;
  selector: string;
}

export interface FocusOrderItem {
  order: number;
  tag: string;
  role?: string;
  accessibleName?: string;
  selector: string;
  tabIndex: number;
}

export interface DopamineProbeResult {
  confettiPresent: boolean;
  xpToastPresent: boolean;
  xpValue?: string;
  streakBadgePresent: boolean;
  streakValue?: string;
  keysBadgePresent: boolean;
  keysValue?: string;
  progressRingPresent: boolean;
  progressPercent?: number;
  audioTriggerObserved: boolean;
}

export interface ScreenSnapshot {
  metadata: {
    role: UserRole;
    path: string;
    routeFile: string;
    title: string;
    viewport: ViewportMode;
    viewportSize: { width: number; height: number };
    state: ScreenState;
    timestamp: string;
  };
  domOutline: DomOutlineNode[];
  accessibilityTree: AccessibilityNode | null;
  styledElements: StyledElementFingerprint[];
  boundingBoxes: Array<{ selector: string; box: NodeBoundingBox }>;
  textInventory: TextInventoryItem[];
  linkInventory: LinkInventoryItem[];
  focusOrder: FocusOrderItem[];
  dopamineProbes: DopamineProbeResult;
}

/* --------------------------- Phase 2: Audit Types -------------------------- */

export type AuditFaultCategory =
  | "contrast"
  | "token-drift"
  | "typography"
  | "overlap"
  | "dead-links"
  | "a11y"
  | "state-coverage"
  | "spacing-rhythm";

export type FaultSeverity = "P0" | "P1" | "P2";

export interface AuditFault {
  id: string;
  category: AuditFaultCategory;
  severity: FaultSeverity;
  screen: string;
  role: UserRole;
  viewport: ViewportMode;
  elementSelector?: string;
  evidence: Record<string, unknown>;
  message: string;
  suggestedFix?: string;
}

export interface AuditOutput {
  timestamp: string;
  summary: {
    totalFaults: number;
    p0Count: number;
    p1Count: number;
    p2Count: number;
    byCategory: Record<AuditFaultCategory, number>;
  };
  faults: AuditFault[];
}

/* -------------------------- Phase 3: Critique Types ------------------------- */

export interface CritiquePassAItem {
  id: string;
  severity: FaultSeverity;
  screen: string;
  component: string;
  evidence: string;
  rootCause: string;
  suggestedFix: string;
}

export interface CritiquePassBItem {
  id: string;
  patternName: string;
  category: "exploitative" | "missing-healthy";
  screen: string;
  description: string;
  servesVsExploitsVerdict: string;
  recommendation: string;
}

export interface CritiquePassCItem {
  id: string;
  title: string;
  screen: string;
  category: "delight" | "dopamine-depth" | "pedagogy";
  description: string;
  rationale: string;
  humanApprovalRequired: boolean;
}

export interface CritiqueOutput {
  timestamp: string;
  passA: CritiquePassAItem[];
  passB: CritiquePassBItem[];
  passC: CritiquePassCItem[];
}

