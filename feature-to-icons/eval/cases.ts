import type { FeatureIconInput } from "../src/types.js";

/**
 * Eval case for feature-to-icons.
 *
 * Two types of assertions:
 *   Type 1: Prompt structure -- check that the generated prompt contains (or does NOT contain) certain strings.
 *   Type 2: SVG expectations -- check that the prompt includes correct SVG generation parameters.
 */
export interface EvalCase {
  /** Human-readable name for this case */
  name: string;
  /** The FeatureIconInput to pass through validate() then buildPrompt() */
  input: FeatureIconInput;
  /** Strings that MUST appear in the generated prompt */
  expectedPromptContains: string[];
  /** Strings that MUST NOT appear in the generated prompt */
  expectedPromptNotContains: string[];
  /** SVG generation expectations (optional, only for SVG-specific cases) */
  svgExpectations?: {
    strokeWidth?: number;
    gridSize?: number;
    cornerRadius?: string;
    visualWeight?: string;
    /** The prompt must NOT contain <text> elements */
    noText?: boolean;
    /** The prompt must include viewBox matching the grid size */
    viewBoxMatchesGrid?: boolean;
  };
}

export const cases: EvalCase[] = [
  // ── Basic cases ────────────────────────────────────────────────
  {
    name: "3 features, outline style (minimal)",
    input: {
      features: ["Dashboard", "Reports", "Users"],
      style: "outline",
      gridSize: 24,
      strokeWidth: 2,
      cornerRadius: "rounded",
      visualWeight: "regular",
    },
    expectedPromptContains: [
      "Dashboard",
      "Reports",
      "Users",
      "Design System",
      "24x24",
      "Stroke width: 2px",
      "rounded",
      "regular",
      "Color Palette",
      "Motion: wiggle",
      "prefers-reduced-motion",
      "Icon 1",
      "Icon 2",
      "Icon 3",
    ],
    expectedPromptNotContains: ["Product Context", "Icon 4"],
    svgExpectations: {
      strokeWidth: 2,
      gridSize: 24,
      cornerRadius: "rounded",
      viewBoxMatchesGrid: true,
      noText: true,
    },
  },

  // ── Styled cases ───────────────────────────────────────────────
  {
    name: "10 features with product context (SaaS)",
    input: {
      features: [
        "Dashboard",
        "Analytics",
        "Reports",
        "Users",
        "Teams",
        "Billing",
        "Invoice",
        "Settings",
        "Integrations",
        "API",
      ],
      style: "outline",
      gridSize: 32,
      strokeWidth: 2,
      cornerRadius: "rounded",
      visualWeight: "regular",
      productContext: "A cloud-based SaaS analytics platform for enterprise data teams",
    },
    expectedPromptContains: [
      "Analytics",
      "Integrations",
      "API",
      "32x32",
      "Product Context",
      "cloud-based SaaS",
      "Design System",
      "Color Palette",
      "hand-drawn",
    ],
    expectedPromptNotContains: ["filled", "duotone"],
    svgExpectations: {
      gridSize: 32,
      viewBoxMatchesGrid: true,
      noText: true,
    },
  },

  {
    name: "Duotone style with custom colors",
    input: {
      features: ["Shopping Cart", "Wishlist", "Orders", "Profile", "Payment"],
      style: "duotone",
      colors: { primary: "#FF6B35", secondary: "#004E89" },
      gridSize: 24,
      strokeWidth: 2.5,
      cornerRadius: "round",
      visualWeight: "regular",
    },
    expectedPromptContains: [
      "duotone",
      "Color Palette",
      "#FF6B35",
      "#004E89",
      "round",
      "2.5px",
      "Primary shapes use",
      "secondary shapes use",
    ],
    expectedPromptNotContains: ["All shapes should be filled with", "filled"],
    svgExpectations: {
      strokeWidth: 2.5,
      gridSize: 24,
      cornerRadius: "round",
      viewBoxMatchesGrid: true,
      noText: true,
    },
  },

  {
    name: "Bold visual weight",
    input: {
      purpose: "system",
      features: ["Notifications", "Alerts", "Warnings", "Errors"],
      style: "outline",
      gridSize: 24,
      strokeWidth: 3,
      cornerRadius: "sharp",
      visualWeight: "bold",
    },
    expectedPromptContains: ["bold", "thicker strokes", "sharp", "0px", "Design System"],
    expectedPromptNotContains: ["light", "rounded", "round"],
    svgExpectations: {
      strokeWidth: 3,
      gridSize: 24,
      cornerRadius: "sharp",
      visualWeight: "bold",
      viewBoxMatchesGrid: true,
      noText: true,
    },
  },

  {
    name: "Sharp corner radius",
    input: {
      purpose: "system",
      features: ["Security", "Lock", "Shield", "Key"],
      style: "outline",
      gridSize: 24,
      strokeWidth: 2,
      cornerRadius: "sharp",
      visualWeight: "regular",
    },
    expectedPromptContains: ["sharp", "0px", "90-degree"],
    expectedPromptNotContains: ["rounded", "round", "9999px"],
    svgExpectations: {
      cornerRadius: "sharp",
      noText: true,
    },
  },

  // ── Edge cases ─────────────────────────────────────────────────
  {
    name: "Edge: minimum features (3)",
    input: {
      features: ["Home", "Search", "Settings"],
      style: "outline",
      gridSize: 24,
      strokeWidth: 2,
      cornerRadius: "rounded",
      visualWeight: "regular",
    },
    expectedPromptContains: ["Home", "Search", "Settings", "Icon 1", "Icon 2", "Icon 3"],
    expectedPromptNotContains: ["Icon 4"],
    svgExpectations: {
      gridSize: 24,
      viewBoxMatchesGrid: true,
    },
  },

  {
    name: "Edge: maximum features (20)",
    input: {
      features: Array.from({ length: 20 }, (_, i) => `Feature${i + 1}`),
      style: "outline",
      gridSize: 48,
      strokeWidth: 2,
      cornerRadius: "rounded",
      visualWeight: "regular",
    },
    expectedPromptContains: ["Feature1", "Feature10", "Feature20", "Icon 20", "48x48"],
    expectedPromptNotContains: ["Icon 21"],
    svgExpectations: {
      gridSize: 48,
      viewBoxMatchesGrid: true,
      noText: true,
    },
  },

  {
    name: "Edge: SaaS product context",
    input: {
      features: ["Team Chat", "File Sharing", "Video Calls", "Task Board", "Calendar"],
      style: "filled",
      colors: { primary: "#6366F1" },
      gridSize: 32,
      cornerRadius: "round",
      productContext: "A real-time collaboration platform for distributed engineering teams",
    },
    expectedPromptContains: [
      "collaboration",
      "filled",
      "All shapes should be filled",
      "#6366F1",
      "Video Calls",
      "Task Board",
    ],
    expectedPromptNotContains: ["duotone", "Stroke width"],
    svgExpectations: {
      gridSize: 32,
      viewBoxMatchesGrid: true,
      noText: true,
    },
  },

  // ── Design system verification ─────────────────────────────────
  {
    name: "Design system verification: strokeWidth and visualWeight",
    input: {
      features: ["Export PDF", "Import CSV", "Print Report", "Email Digest"],
      style: "outline",
      gridSize: 24,
      strokeWidth: 2.5,
      cornerRadius: "rounded",
      visualWeight: "light",
    },
    expectedPromptContains: [
      "Stroke width: 2.5px",
      "light",
      "thinner strokes",
      "Export PDF",
      "Import CSV",
    ],
    expectedPromptNotContains: ["bold", "regular"],
    svgExpectations: {
      strokeWidth: 2.5,
      visualWeight: "light",
      viewBoxMatchesGrid: true,
      noText: true,
    },
  },
];
