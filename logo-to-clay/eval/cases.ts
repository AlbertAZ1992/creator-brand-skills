import type { ClayOptions } from "../src/types.js";

export interface EvalCase {
  name: string;
  description: string;
  input: ClayOptions;
  expectedPromptContains: string[];
  expectedPromptNotContains: string[];
}

export const cases: EvalCase[] = [
  {
    name: "default-object",
    description: "Minimal input uses the standalone clay object mode.",
    input: { logoPath: "./logo.png" },
    expectedPromptContains: [
      "refined studio clay sculpture",
      "smooth continuous matte surface",
      "standalone clay object",
      "use the attached logo as the only geometry reference",
      "preserve the exact outer contour",
      "high roughness",
      "zero metalness",
      "no cartoon exaggeration",
      "no fingerprints",
    ],
    expectedPromptNotContains: ["flat relief", "freestanding", "TEXTURE:"],
  },
  {
    name: "image-output",
    description: "Image output still produces the shared clay prompt.",
    input: { logoPath: "./logo.png", output: "image" },
    expectedPromptContains: ["refined studio clay sculpture", "STYLE:", "finely kneaded clay"],
    expectedPromptNotContains: ["pixel-faithful", "TEXTURE:"],
  },
  {
    name: "object-shape",
    description: "Object mode uses a slim standalone clay profile.",
    input: { logoPath: "./logo.png", shape: "object" },
    expectedPromptContains: ["standalone clay object", "slim", "3D profile"],
    expectedPromptNotContains: ["flat relief", "backing surface"],
  },
  {
    name: "relief-shape",
    description: "Relief mode uses backing-surface language.",
    input: { logoPath: "./logo.png", shape: "relief", depth: 2 },
    expectedPromptContains: ["flat relief", "backing surface", "2mm"],
    expectedPromptNotContains: ["standalone clay object"],
  },
  {
    name: "transparent-background",
    description: "Transparent background mentions alpha and isolation.",
    input: { logoPath: "./logo.png", background: "transparent" },
    expectedPromptContains: ["transparent background", "alpha channel", "isolated object"],
    expectedPromptNotContains: ["soft studio background"],
  },
  {
    name: "studio-background",
    description: "Studio background uses deliberate editorial art direction.",
    input: { logoPath: "./logo.png", background: "studio" },
    expectedPromptContains: [
      "purposeful editorial studio scene",
      "supporting colour",
      "logo occupies 55-75% of the frame",
      "one low plinth or grounding surface",
      "do not default to a centred object floating on empty beige",
    ],
    expectedPromptNotContains: ["transparent background", "alpha channel"],
  },
  {
    name: "all-params",
    description: "The remaining public parameters compose without removed modes.",
    input: {
      logoPath: "./logo.png",
      output: "both",
      shape: "relief",
      depth: 2,
      clayColor: "#D4A574",
      background: "transparent",
    },
    expectedPromptContains: [
      "refined studio clay sculpture",
      "flat relief",
      "#D4A574",
      "2mm",
      "transparent background",
    ],
    expectedPromptNotContains: ["freestanding", "handmade clay texture", "TEXTURE:"],
  },
];
