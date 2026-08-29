export type BrandPersonality =
  | "friendly"
  | "professional"
  | "playful"
  | "technical"
  | "approachable";

export type MascotType = "animal" | "character" | "abstract" | "robot";

export interface MascotInput {
  /** Product or company name */
  productName: string;
  /** Detailed product description (purpose, features, values) */
  productDescription: string;
  /** Target audience description */
  targetAudience?: string;
  /** Brand personality */
  personality?: BrandPersonality;
  /** Preferred mascot type */
  mascotType?: MascotType;
  /** Optional visual style reference (e.g., "Pixar-style", "flat vector", "hand-drawn") */
  visualStyle?: string;
  /** Number of variations to generate (3-8) */
  variationCount?: number;
}

export interface MascotVariation {
  pose: string;
  expression: string;
  scenario: string;
}

export interface PersonalityAnalysis {
  personality: BrandPersonality;
  visualLanguage: string;
  colorDirection: string;
  characterArchetype: string;
}

export interface MascotOutput {
  /** The prompt for generating the primary mascot */
  primaryPrompt: string;
  /** Variations prompts */
  variationPrompts: string[];
  /** Suggested mascot name */
  suggestedName: string;
  /** Brand essence keywords extracted */
  brandEssence: string[];
  /** Mascot concept description */
  concept: string;
  /** Usage guidelines */
  usageGuide: string[];
  /** Personality analysis */
  personalityAnalysis: PersonalityAnalysis;
}

/** Stable visual contract passed to later mascot poses and sticker generation. */
export interface CharacterBible {
  version: 1;
  productName: string;
  mascotName: string;
  brandEssence: string[];
  personality: BrandPersonality;
  mascotType: MascotType;
  silhouette: string;
  faceRule: string;
  palette: string[];
  signatureFeature: string;
  renderingRule: string;
  avoids: string[];
}

export interface ValidationError {
  field: string;
  message: string;
}
