import type { BrandPersonality, MascotType } from "../src/types.js";
import { buildPrompt, validate } from "../src/index.js";

/**
 * Eval cases for product-to-mascot.
 *
 * Each case defines input parameters and assertions on the generated prompt.
 * The assertions verify that the personality-to-visual mapping, mascot type
 * guidance, and brand essence extraction produce the expected keywords in
 * the AI prompt.
 */

export interface EvalCase {
  /** Human-readable name */
  name: string;
  /** Input passed to validate() then buildPrompt() */
  input: Record<string, unknown>;
  /** Keywords that MUST appear in the generated prompt */
  expectedPromptContains: string[];
  /** Keywords that MUST NOT appear in the generated prompt */
  expectedPromptNotContains: string[];
  /** Expected validation result */
  expectValid: boolean;
}

export const cases: EvalCase[] = [
  // --- Core Scenarios ---

  {
    name: "SaaS product, friendly personality, character mascot",
    input: {
      productName: "TeamBloom",
      productDescription:
        "A team collaboration platform with shared workspaces, real-time document editing, and video conferencing. Designed to make remote teams feel connected and productive.",
      personality: "friendly",
      mascotType: "character",
    },
    expectedPromptContains: [
      "rounded",
      "warm",
      "caregiver",
      "Character archetype",
      "collaboration",
      "toy-like",
    ],
    expectedPromptNotContains: ["corporate", "cold", "aggressive", "mechanical"],
    expectValid: true,
  },

  {
    name: "Dev tool, technical personality, robot mascot",
    input: {
      productName: "PipelineForge",
      productDescription:
        "A CI/CD pipeline orchestration platform for Kubernetes clusters. Automates build, test, and deploy workflows with infrastructure-as-code.",
      personality: "technical",
      mascotType: "robot",
    },
    expectedPromptContains: [
      "geometric",
      "precise",
      "softened corners",
      "sage",
      "compact machine",
      "featureless humanoid",
    ],
    expectedPromptNotContains: ["realistic adult proportions", "photoreal human"],
    expectValid: true,
  },

  {
    name: "Consumer app, playful personality, animal mascot",
    input: {
      productName: "SnackQuest",
      productDescription:
        "A gamified food discovery app where users earn badges for trying new restaurants and sharing reviews. Leaderboards, challenges, and social sharing.",
      personality: "playful",
      mascotType: "animal",
    },
    expectedPromptContains: [
      "exaggerated",
      "dynamic",
      "jester",
      "animal",
      "real trait",
      "product-defining feature",
    ],
    expectedPromptNotContains: ["corporate", "professional", "precise", "minimalist"],
    expectValid: true,
  },

  {
    name: "Enterprise software, professional personality, abstract mascot",
    input: {
      productName: "BoardVault",
      productDescription:
        "Enterprise governance and compliance platform for Fortune 500 companies. Secure document management, audit trails, and board meeting orchestration.",
      personality: "professional",
      mascotType: "abstract",
    },
    expectedPromptContains: [
      "confident",
      "rounded geometry",
      "ruler",
      "gold",
      "abstract",
      "shape",
      "living symbol",
    ],
    expectedPromptNotContains: ["playful", "cartoon", "silly", "bright primaries"],
    expectValid: true,
  },

  {
    name: "Local business, approachable personality, character mascot",
    input: {
      productName: "CornerCafe",
      productDescription:
        "A neighborhood coffee shop loyalty app. Track visits, earn rewards, pre-order drinks, and discover new seasonal specials.",
      personality: "approachable",
      mascotType: "character",
      targetAudience: "Local neighborhood residents",
    },
    expectedPromptContains: [
      "relatable",
      "down-to-earth",
      "everyman",
      "earth tone",
      "hand-drawn",
      "organic",
    ],
    expectedPromptNotContains: ["futuristic", "corporate", "luxury", "metallic"],
    expectValid: true,
  },

  // --- Boundary Scenarios ---

  {
    name: "Minimal input (just product name + short description)",
    input: {
      productName: "QuickNote",
      productDescription: "A fast note-taking app.",
    },
    expectedPromptContains: ["friendly", "animal", "note"],
    expectedPromptNotContains: [],
    expectValid: true,
  },

  {
    name: "Detailed input (all fields specified)",
    input: {
      productName: "HealthSync Pro",
      productDescription:
        "A HIPAA-compliant patient data synchronization platform connecting hospitals, clinics, and insurance providers. Real-time data sharing with end-to-end encryption.",
      targetAudience: "Healthcare IT administrators and clinicians",
      personality: "professional",
      mascotType: "abstract",
      visualStyle: "Minimalist medical illustration",
      variationCount: 6,
    },
    expectedPromptContains: [
      "HealthSync Pro",
      "Healthcare IT administrators",
      "Minimalist medical illustration",
      "6 variation",
      "professional",
      "abstract",
    ],
    expectedPromptNotContains: [],
    expectValid: true,
  },

  {
    name: "3 variations",
    input: {
      productName: "Triple",
      productDescription: "A minimalist habit tracker with three daily focus items.",
      variationCount: 3,
    },
    expectedPromptContains: ["3 variation"],
    expectedPromptNotContains: [],
    expectValid: true,
  },

  {
    name: "8 variations",
    input: {
      productName: "Octo",
      productDescription: "An eight-dimensional project management tool for creative agencies.",
      variationCount: 8,
    },
    expectedPromptContains: ["8 variation"],
    expectedPromptNotContains: [],
    expectValid: true,
  },

  // --- Edge Cases ---

  {
    name: "Very technical product description",
    input: {
      productName: "QuantumDB",
      productDescription:
        "A distributed SQL database with vector search, real-time materialized views, and automatic sharding. Supports PostgreSQL wire protocol and multi-region replication with Raft consensus. Built for petabyte-scale analytical workloads.",
      personality: "technical",
      mascotType: "robot",
    },
    expectedPromptContains: [
      "geometric",
      "softened corners",
      "sage",
      "compact machine",
      "featureless humanoid",
      "data",
    ],
    expectedPromptNotContains: ["cartoon", "fluffy", "cuddly"],
    expectValid: true,
  },

  {
    name: "Whimsical/creative product",
    input: {
      productName: "DreamCanvas",
      productDescription:
        "An AI art studio where imagination becomes reality. Paint with neural brushes, animate sketches, and collaborate with a creative AI muse that understands your artistic style and helps bring your wildest ideas to life.",
      personality: "playful",
      mascotType: "character",
    },
    expectedPromptContains: [
      "exaggerated",
      "dynamic",
      "jester",
      "oversized face",
      "short limbs",
      "creative",
      "character",
    ],
    expectedPromptNotContains: ["corporate", "minimalist", "austere"],
    expectValid: true,
  },

  // --- Personality Mapping Verification ---

  {
    name: 'Personality mapping: "friendly" → Caregiver (warm, rounded, approachable)',
    input: {
      productName: "HelperBot",
      productDescription: "A customer support chatbot that answers questions with a smile.",
      personality: "friendly",
    },
    expectedPromptContains: ["warm", "rounded", "approachable", "caregiver", "pastel", "smiling"],
    expectedPromptNotContains: ["corporate", "cold", "sharp", "geometric precision"],
    expectValid: true,
  },

  {
    name: 'Personality mapping: "technical" → Sage (precise but still appealing)',
    input: {
      productName: "CodeSentinel",
      productDescription:
        "An automated code security scanner that finds vulnerabilities before they reach production.",
      personality: "technical",
    },
    expectedPromptContains: [
      "geometric",
      "precise",
      "softened corners",
      "sage",
      "cool metal",
      "electric blue",
    ],
    expectedPromptNotContains: ["warm pastel", "bouncy", "whimsical", "hand-drawn"],
    expectValid: true,
  },

  // --- Validation Cases ---

  {
    name: "Invalid personality produces validation error",
    input: {
      productName: "Test",
      productDescription: "A test product.",
      personality: "evil",
    },
    expectedPromptContains: [],
    expectedPromptNotContains: [],
    expectValid: false,
  },

  {
    name: "Invalid mascotType produces validation error",
    input: {
      productName: "Test",
      productDescription: "A test product.",
      mascotType: "dragon",
    },
    expectedPromptContains: [],
    expectedPromptNotContains: [],
    expectValid: false,
  },
];
