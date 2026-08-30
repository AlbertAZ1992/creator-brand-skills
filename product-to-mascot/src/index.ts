import type {
  BrandPersonality,
  CharacterBible,
  MascotDirection,
  MascotInput,
  MascotOutput,
  MascotPose,
  MascotType,
  PersonalityAnalysis,
  ValidationError,
} from "./types.js";

// --- Constants ---

const VALID_PERSONALITIES: ReadonlySet<BrandPersonality> = new Set([
  "friendly",
  "professional",
  "playful",
  "technical",
  "approachable",
]);

const VALID_MASCOT_TYPES: ReadonlySet<MascotType> = new Set([
  "animal",
  "character",
  "abstract",
  "robot",
]);

const MIN_VARIATIONS = 3;
const MAX_VARIATIONS = 8;
const DEFAULT_VARIATIONS = 4;
const MAX_PRODUCT_NAME_LENGTH = 100;
const MAX_PRODUCT_DESCRIPTION_LENGTH = 2000;

/**
 * Personality-to-visual mapping.
 *
 * Each brand personality maps to a distinct visual language, color direction,
 * and character archetype. These mappings guide the AI to produce mascot
 * concepts that visually communicate the intended brand feel.
 *
 * The archetypes follow established brand character frameworks:
 * - Caregiver: nurturing, protective, warm
 * - Ruler: commanding, premium, authoritative
 * - Jester: energetic, funny, irreverent
 * - Sage: wise, knowledgeable, precise
 * - Everyman: relatable, genuine, down-to-earth
 */
const PERSONALITY_VISUAL_MAP: Record<
  BrandPersonality,
  {
    visualLanguage: string;
    colorDirection: string;
    characterArchetype: string;
  }
> = {
  friendly: {
    visualLanguage:
      "Warm, rounded shapes; smiling expression; approachable stance; soft, diffused lighting; gentle gradients",
    colorDirection: "Pastels, warm yellows, soft greens, sky blues, coral pinks, cream white",
    characterArchetype:
      "The Caregiver -- nurturing, supportive, kind-hearted, always ready to help",
  },
  professional: {
    visualLanguage:
      "Confident compact posture; clean rounded geometry; composed but warm expression; " +
      "simple authoritative silhouette; premium toy-like proportions",
    colorDirection: "Deep navy, charcoal gray, crisp white, gold accents, burgundy, royal blue",
    characterArchetype: "The Ruler -- commanding, premium, trustworthy, exudes quiet confidence",
  },
  playful: {
    visualLanguage:
      "One exaggerated identifying feature; dynamic pose; bold simple forms; oversized face; " +
      "short limbs; bouncy compact posture",
    colorDirection:
      "Bright primaries, neon accents, vivid orange, electric purple, lime green, hot pink",
    characterArchetype: "The Jester -- energetic, funny, irreverent, brings joy and surprise",
  },
  technical: {
    visualLanguage:
      "Compact geometric masses with softened corners; one crisp technical motif; warm readable eyes; " +
      "precise but friendly construction; matte surfaces; no dense machinery",
    colorDirection: "Cool metal tones, electric blue, silver, dark slate, cyan neon, matte black",
    characterArchetype: "The Sage -- wise, knowledgeable, precise, sees patterns others miss",
  },
  approachable: {
    visualLanguage:
      "Simple relatable shapes; natural relaxed posture; genuine smile; hand-drawn feel; organic curves",
    colorDirection: "Warm earth tones, terracotta, sage green, oatmeal, soft brown, sky blue",
    characterArchetype: "The Everyman -- relatable, genuine, down-to-earth, the friend next door",
  },
};

/**
 * Mascot type design guidance.
 *
 * Each mascot type provides direction on how the character should be
 * conceptualized based on its form category.
 */
const MASCOT_TYPE_GUIDANCE: Record<
  MascotType,
  {
    designDirection: string;
    bestFor: string;
  }
> = {
  animal: {
    designDirection:
      "Design an animal whose real trait maps to the product. Use one species-defining feature, " +
      "one product-defining feature, and a compact silhouette built from a few large masses. " +
      "Integrate the product cue into an ear, wing, tail, shell, pouch, or carried prop rather " +
      "than pasting a logo onto the body.",
    bestFor:
      "Products with natural metaphors, environmental themes, or instinct-based user experiences",
  },
  character: {
    designDirection:
      "Design a compact helper character with toy-like proportions and one product-linked prop " +
      "or costume mass. Do not default to an adult human silhouette, realistic anatomy, a black " +
      "body suit, or many small accessories. The role must read from one memorable outer contour.",
    bestFor:
      "Consumer apps, service platforms, community products, or anything needing a relatable human touch",
  },
  abstract: {
    designDirection:
      "Design one living symbol from four to seven large rounded masses. Convey emotion through " +
      "proportion, lean, and one small face region. Preserve a simple outer contour at 32 px and " +
      "avoid turning the result into a generic blob with a logo attached.",
    bestFor:
      "Developer tools, infrastructure products, API platforms, or brands wanting a minimalist identity",
  },
  robot: {
    designDirection:
      "Design a friendly compact machine with one head or face panel, short limbs, and one " +
      "product-themed mechanism. Avoid featureless humanoid silhouettes, tactical armour, dense " +
      "greebles, exposed wiring, and more than one glowing display.",
    bestFor: "AI/ML products, automation tools, developer platforms, or tech-heavy brands",
  },
};

const APPEAL_RULES = [
  "one dominant continuous outer silhouette built from roughly 4-7 large masses",
  "one species or form cue plus one product cue; delete decorative parts that carry neither",
  "a face region large enough to read at 32 px, with no more than three facial marks",
  "compact proportions with short limbs; no adult human anatomy unless explicitly requested",
  "two character base colours plus one accent colour by default, before the background",
  "no invented exact counts for tiny repeated decorations; lock large identity anchors instead",
] as const;

const POSE_STORIES: Record<MascotPose, string> = {
  welcome: "open welcoming gesture, friendly eye contact, complete silhouette unobstructed",
  working: "focused use of the locked product feature or prop, calm concentration, no new tools",
  thinking: "clear thinking or help gesture, curious expression, signature feature still visible",
  celebrate: "joyful upward action, energetic but readable silhouette, restrained accent confetti",
};

/**
 * Common English stop words filtered out during brand essence extraction.
 */
const STOP_WORDS: ReadonlySet<string> = new Set([
  "a",
  "an",
  "the",
  "and",
  "or",
  "but",
  "in",
  "on",
  "at",
  "to",
  "for",
  "of",
  "with",
  "by",
  "from",
  "is",
  "are",
  "was",
  "were",
  "be",
  "been",
  "being",
  "have",
  "has",
  "had",
  "do",
  "does",
  "did",
  "will",
  "would",
  "could",
  "should",
  "may",
  "might",
  "can",
  "shall",
  "you",
  "your",
  "we",
  "our",
  "they",
  "their",
  "it",
  "its",
  "this",
  "that",
  "these",
  "those",
  "am",
  "not",
  "no",
  "nor",
  "so",
  "if",
  "then",
  "than",
  "too",
  "very",
  "just",
  "about",
  "into",
  "over",
  "also",
  "as",
  "up",
  "out",
  "when",
  "what",
  "which",
  "who",
  "whom",
  "how",
  "all",
  "each",
  "every",
  "both",
  "few",
  "more",
  "most",
  "other",
  "some",
  "such",
  "only",
  "own",
  "same",
  "here",
  "there",
  "now",
  "new",
  "like",
  "get",
  "make",
  "use",
  "using",
  "used",
  "need",
  "help",
  "one",
  "two",
  "way",
  "well",
  "much",
  "many",
  "any",
  "even",
  "still",
  "back",
  "after",
  "before",
  "between",
  "through",
  "during",
  "without",
  "within",
  "along",
  "around",
  "because",
]);

/**
 * Product-domain concept words. Words in this set receive a boost during
 * essence extraction because they carry semantic weight in product contexts.
 */
const PRODUCT_CONCEPT_BOOST: ReadonlyMap<string, number> = new Map([
  ["ai", 2],
  ["api", 2],
  ["app", 1],
  ["automated", 2],
  ["automation", 2],
  ["cloud", 2],
  ["collaboration", 2],
  ["community", 2],
  ["creative", 2],
  ["data", 2],
  ["design", 2],
  ["developer", 2],
  ["digital", 1],
  ["discover", 2],
  ["enterprise", 1],
  ["fast", 1],
  ["finance", 2],
  ["growth", 2],
  ["health", 2],
  ["innovation", 2],
  ["learn", 1],
  ["learning", 2],
  ["machine", 1],
  ["mobile", 1],
  ["modern", 1],
  ["monitor", 1],
  ["network", 1],
  ["platform", 2],
  ["privacy", 2],
  ["productivity", 2],
  ["protect", 2],
  ["scale", 1],
  ["secure", 2],
  ["security", 2],
  ["simple", 1],
  ["smart", 2],
  ["social", 2],
  ["speed", 1],
  ["startup", 1],
  ["team", 1],
  ["tool", 1],
  ["trust", 2],
  ["user", 1],
  ["web", 1],
  ["wellness", 2],
  ["workflow", 2],
]);

// --- Validation ---

/**
 * Validate raw input and return either sanitized MascotInput or an array
 * of validation errors.
 */
export function validate(
  raw: Record<string, unknown>,
): { ok: true; value: MascotInput } | { ok: false; errors: ValidationError[] } {
  const errors: ValidationError[] = [];

  // productName
  const rawProductName = raw["productName"];
  const productName = typeof rawProductName === "string" ? rawProductName.trim() : "";
  if (!productName) {
    errors.push({ field: "productName", message: "Product name is required" });
  } else if (productName.length > MAX_PRODUCT_NAME_LENGTH) {
    errors.push({
      field: "productName",
      message: `Product name must be at most ${MAX_PRODUCT_NAME_LENGTH} characters`,
    });
  }

  // productDescription
  const rawProductDescription = raw["productDescription"];
  const productDescription =
    typeof rawProductDescription === "string" ? rawProductDescription.trim() : "";
  if (!productDescription) {
    errors.push({
      field: "productDescription",
      message: "Product description is required",
    });
  } else if (productDescription.length > MAX_PRODUCT_DESCRIPTION_LENGTH) {
    errors.push({
      field: "productDescription",
      message: `Product description must be at most ${MAX_PRODUCT_DESCRIPTION_LENGTH} characters`,
    });
  }

  // targetAudience (optional)
  const rawTargetAudience = raw["targetAudience"];
  const targetAudience =
    typeof rawTargetAudience === "string" && rawTargetAudience.trim()
      ? rawTargetAudience.trim()
      : undefined;

  // personality
  const rawPersonalityVal = raw["personality"];
  const rawPersonality =
    typeof rawPersonalityVal === "string" ? rawPersonalityVal.trim() : undefined;
  let personality: BrandPersonality | undefined;
  if (rawPersonality) {
    const lowered = rawPersonality.toLowerCase();
    if (VALID_PERSONALITIES.has(lowered as BrandPersonality)) {
      personality = lowered as BrandPersonality;
    } else {
      errors.push({
        field: "personality",
        message: `Invalid personality "${rawPersonality}". Must be one of: ${[...VALID_PERSONALITIES].join(", ")}`,
      });
    }
  }

  // mascotType
  const rawMascotTypeVal = raw["mascotType"];
  const rawMascotType = typeof rawMascotTypeVal === "string" ? rawMascotTypeVal.trim() : undefined;
  let mascotType: MascotType | undefined;
  if (rawMascotType) {
    const lowered = rawMascotType.toLowerCase();
    if (VALID_MASCOT_TYPES.has(lowered as MascotType)) {
      mascotType = lowered as MascotType;
    } else {
      errors.push({
        field: "mascotType",
        message: `Invalid mascotType "${rawMascotType}". Must be one of: ${[...VALID_MASCOT_TYPES].join(", ")}`,
      });
    }
  }

  // visualStyle (optional)
  const rawVisualStyle = raw["visualStyle"];
  const visualStyle =
    typeof rawVisualStyle === "string" && rawVisualStyle.trim() ? rawVisualStyle.trim() : undefined;

  // variationCount
  let variationCount: number | undefined;
  const rawVariationCount = raw["variationCount"];
  if (rawVariationCount !== undefined && rawVariationCount !== null) {
    const vc = Number(rawVariationCount);
    if (!Number.isInteger(vc) || vc < MIN_VARIATIONS || vc > MAX_VARIATIONS) {
      errors.push({
        field: "variationCount",
        message: `variationCount must be an integer between ${MIN_VARIATIONS} and ${MAX_VARIATIONS}`,
      });
    } else {
      variationCount = vc;
    }
  }

  if (errors.length > 0) {
    return { ok: false, errors };
  }

  const value: MascotInput = {
    productName: productName!,
    productDescription: productDescription!,
    personality: personality ?? "friendly",
    mascotType: mascotType ?? "animal",
    variationCount: variationCount ?? DEFAULT_VARIATIONS,
  };
  if (targetAudience !== undefined) {
    value.targetAudience = targetAudience;
  }
  if (visualStyle !== undefined) {
    value.visualStyle = visualStyle;
  }

  return { ok: true, value };
}

// --- Prompt Building ---

/**
 * Extract brand essence keywords from the product name and description.
 *
 * Strategy:
 * 1. Combine productName (repeated for weight) and productDescription
 * 2. Tokenize into lowercase words, stripping punctuation
 * 3. Remove stop words and short words (<3 chars)
 * 4. Count word frequencies
 * 5. Boost words found in the PRODUCT_CONCEPT_BOOST map
 * 6. Return the top 5 words by weighted frequency
 *
 * This rule-based approach produces reasonable brand essence keywords
 * without requiring an NLP library. For production use with more nuanced
 * extraction, consider replacing this with an LLM call.
 */
function extractBrandEssence(productName: string, productDescription: string): string[] {
  const text = `${productName} ${productName} ${productDescription}`;
  const words = text
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, " ")
    .split(/\s+/)
    .filter((w) => w.length > 2 && !STOP_WORDS.has(w));

  const frequencies = new Map<string, number>();
  for (const word of words) {
    let weight = 1;
    const boost = PRODUCT_CONCEPT_BOOST.get(word);
    if (boost !== undefined) {
      weight += boost;
    }
    frequencies.set(word, (frequencies.get(word) ?? 0) + weight);
  }

  const sorted = [...frequencies.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([word]) => word);

  // If we got fewer than 3, we need more context -- use broader extraction
  if (sorted.length < 3) {
    const bigrams: string[] = [];
    const wordList = text
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, " ")
      .split(/\s+/)
      .filter((w) => w.length > 0);

    for (let i = 0; i < wordList.length - 1; i++) {
      const w1 = wordList[i]!;
      const w2 = wordList[i + 1]!;
      if (w1.length > 1 && w2.length > 1 && !STOP_WORDS.has(w1) && !STOP_WORDS.has(w2)) {
        bigrams.push(`${w1} ${w2}`);
      }
    }
    // Add unique bigrams up to 5 total
    for (const bg of bigrams) {
      if (sorted.length >= 5) break;
      if (!sorted.includes(bg)) {
        sorted.push(bg);
      }
    }
  }

  return sorted;
}

/**
 * Build a comprehensive mascot generation prompt using the "analyze first,
 * generate second" approach.
 *
 * The prompt guides the AI through two phases:
 * 1. **Analysis phase**: Extract brand essence, map personality to visuals,
 *    and determine the character archetype.
 * 2. **Generation phase**: Using the analysis, design the mascot concept,
 *    craft image generation prompts, and provide usage guidelines.
 *
 * This two-phase structure produces more thoughtful and brand-aligned
 * mascot concepts than direct "generate a mascot for X" prompting.
 */
export function buildPrompt(input: MascotInput): string {
  const {
    productName,
    productDescription,
    targetAudience,
    personality,
    mascotType,
    visualStyle,
    variationCount,
  } = input;

  const visual = PERSONALITY_VISUAL_MAP[personality ?? "friendly"];
  const mascotGuidance = MASCOT_TYPE_GUIDANCE[mascotType ?? "character"];
  const essenceKeywords = extractBrandEssence(productName, productDescription);
  const styleLine = visualStyle
    ? `Visual style reference: ${visualStyle}.`
    : "Visual style: choose one ownable production medium, then keep it unchanged across the set.";
  const appealBudget = APPEAL_RULES.map((rule) => `- ${rule}`).join("\n");

  return `You are an expert brand mascot designer. Your task is to create a memorable mascot concept for the following product.

## Product Information

- **Product name**: ${productName}
- **Description**: ${productDescription}
${targetAudience ? `- **Target audience**: ${targetAudience}` : ""}
- **Brand personality**: ${personality}
- **Mascot type**: ${mascotType}
- **${styleLine}**

---

## Phase 1: Analyze the Brand

### Step 1 -- Extract Brand Essence

Analyze the product name and description. The following keywords were computationally extracted as potentially meaningful: **${essenceKeywords.join(", ")}**.

Refine these into exactly 3-5 core brand attributes that capture the product's soul. These should be single words or short phrases (e.g., "growth", "simplicity", "human connection").

### Step 2 -- Personality-to-Visual Mapping

The brand personality is **${personality}**. This maps to the following visual direction:

- **Visual language**: ${visual.visualLanguage}
- **Color direction**: ${visual.colorDirection}
- **Character archetype**: ${visual.characterArchetype}

Use these as your creative foundation. Interpret them in the context of this specific product.

### Step 3 -- Mascot Type Design

The mascot type is **${mascotType}**. Design guidance for this type:

${mascotGuidance.designDirection}

This type works best for: ${mascotGuidance.bestFor}

### Step 3.5 -- Appeal and Complexity Budget

${appealBudget}

The mascot must feel appealing and ownable rather than merely correct. Prefer
one memorable proportion and one lovable imperfection over a generic humanoid,
stock robot, or detailed character illustration.

---

## Phase 2: Generate the Mascot Concept

### Step 4 -- Character Design Brief

Create a concise character design brief covering:
- The mascot's backstory (1-2 sentences connecting to the product's mission)
- Key visual features (silhouette, distinctive elements, signature prop/tool)
- Color palette (3-5 specific colors with hex codes when possible)
- Overall mood and personality

The product connection must be visible in the silhouette, signature feature,
prop system, or rendering material. Reject a generic round creature that only
uses the brand colours or wears a pasted-on logo.

### Step 5 -- Primary Mascot Prompt

Write a detailed AI image generation prompt for the primary mascot. This should be ready to paste into Midjourney, DALL-E, or Stable Diffusion. Include:

- Character description (type, pose, expression)
- Exact proportions, including head-to-body relationship and limb length
- Artistic style and rendering technique
- Color palette and lighting
- Full-body neutral reference composition with the complete silhouette visible
- Any important details or props
- Exactly one character on a simple opaque background, with no text, logo, or UI
- Clear shape hierarchy and enough contrast to remain readable at 64 px
- Four to seven large silhouette masses, with tiny decorative details removed

Format the prompt as clear, comma-separated descriptive phrases.

### Step 6 -- Variation Prompts (${variationCount} variations)

Create ${variationCount} variation prompts showing the mascot in different:
- Poses (waving, working, thinking, celebrating, presenting)
- Expressions (happy, focused, determined, surprised, content)
- Scenarios (using the product, helping users, celebrating success)

Generate every pose individually from the accepted primary reference, never as
one multi-character sheet. Each variation must repeat the locked silhouette,
face rule, palette, signature feature, proportions, and rendering medium while
showing a distinct usage story.

### Step 7 -- Mascot Name

Suggest a memorable name for the mascot. The name should:
- Be easy to say and remember (1-3 syllables)
- Connect to the product name or brand essence
- Work across languages and cultures
- Have a warm, appealing sound

### Step 8 -- Usage Guide

Provide practical guidelines for using the mascot:
- **Do's** (3-5): Appropriate contexts, color usage, sizing, pairings
- **Don'ts** (3-5): Avoid distortions, inappropriate contexts, recoloring, overuse
- **Minimum size**: Recommended minimum size for legibility
- **Clear space**: How much padding around the mascot
- **Background guidance**: Best background colors and what to avoid

---

## Output Format

Structure your response with these exact section headers:

### BRAND ESSENCE
[3-5 core brand attributes, comma-separated]

### CONCEPT
[2-3 sentences describing the mascot concept and its connection to the brand]

### PERSONALITY ANALYSIS
- Personality: ${personality}
- Visual language: [visual language description]
- Color direction: [color direction]
- Character archetype: [archetype]

### NAME
[Suggested mascot name]

### PRIMARY PROMPT
[The full image generation prompt for the primary mascot]

### VARIATIONS
[Numbered list of ${variationCount} variation prompts, each on a new line starting with the number and a period]

### USAGE GUIDE
[Bullet-point usage guidelines with Do's and Don'ts sections]

### COLOR PALETTE
[List of 3-5 colors with names and hex codes]

Now, create the mascot concept for **${productName}**.`;
}

/** Ask for three meaningfully different, low-complexity directions before locking one. */
export function buildMascotDirectionPrompt(input: MascotInput): string {
  const visual = PERSONALITY_VISUAL_MAP[input.personality ?? "friendly"];
  const guidance = MASCOT_TYPE_GUIDANCE[input.mascotType ?? "animal"];
  const appealBudget = APPEAL_RULES.map((rule) => `- ${rule}`).join("\n");

  return [
    "Propose exactly three distinct mascot directions for this product.",
    `Product: ${input.productName}.`,
    `Product facts: ${input.productDescription}`,
    input.targetAudience ? `Audience: ${input.targetAudience}.` : "",
    `Personality visual language: ${visual.visualLanguage}.`,
    `Mascot guidance: ${guidance.designDirection}`,
    input.visualStyle ? `Requested visual style: ${input.visualStyle}.` : "",
    "Each direction must connect to a different product truth and use a genuinely different",
    "outer silhouette. Do not return three recolours of the same subject.",
    "Use this appeal and complexity budget:",
    appealBudget,
    "Return JSON only: an array of three objects with name, productConnection, silhouette,",
    "signatureFeature, and appealHook. Keep every field concise and do not invent capabilities.",
  ]
    .filter(Boolean)
    .join("\n");
}

/** Ask for the V2 identity contract after one direction is accepted. */
export function buildCharacterBiblePrompt(input: MascotInput, direction?: MascotDirection): string {
  const visual = PERSONALITY_VISUAL_MAP[input.personality ?? "friendly"];
  const guidance = MASCOT_TYPE_GUIDANCE[input.mascotType ?? "animal"];

  return [
    "Create a V2 character bible for one reusable, visually appealing brand mascot.",
    `Product: ${input.productName}.`,
    `Product facts: ${input.productDescription}`,
    input.targetAudience ? `Audience: ${input.targetAudience}.` : "",
    `Personality visual language: ${visual.visualLanguage}.`,
    `Mascot guidance: ${guidance.designDirection}`,
    input.visualStyle ? `Requested visual style: ${input.visualStyle}.` : "",
    direction ? `Accepted direction: ${JSON.stringify(direction)}.` : "",
    "The product connection must appear in the silhouette, signature feature, prop system,",
    "or rendering material; reject a generic creature that only borrows brand colours.",
    "Use four to seven large silhouette masses and explicitly lock the head-to-body ratio,",
    "limb length, face marks, and one memorable appeal hook.",
    "Do not invent exact counts for tiny repeated marks such as stitches, dots, scales, or screws;",
    "those are fragile generation anchors. Preserve an exact micro-count only when the user or",
    "supplied brand asset explicitly requires it.",
    "Return JSON only with mascotName, brandEssence, productConnection, silhouette,",
    "proportions, faceRule, palette, signatureFeature, appealHook, renderingRule,",
    "minimumSize, clearSpace, and avoids. palette must contain 3-5 hex colours;",
    "minimumSize is an integer from 24 to 128; avoids contains exactly three visual prohibitions.",
    "Do not invent product facts.",
  ]
    .filter(Boolean)
    .join("\n");
}

/** Build the typed handoff artifact only after a model supplied all invariants. */
export function createCharacterBible(
  input: MascotInput,
  raw: Omit<CharacterBible, "version" | "productName" | "personality" | "mascotType">,
): CharacterBible {
  return {
    ...raw,
    version: 2,
    productName: input.productName,
    personality: input.personality ?? "friendly",
    mascotType: input.mascotType ?? "animal",
  };
}

/** Build the canonical primary-reference prompt from a locked V2 bible. */
export function buildPrimaryImagePrompt(bible: CharacterBible): string {
  return [
    `Create one full-body primary reference for ${bible.mascotName}, the mascot for ${bible.productName}.`,
    labeledRule("Product connection", bible.productConnection),
    labeledRule("Silhouette", bible.silhouette),
    labeledRule("Exact proportions", bible.proportions),
    labeledRule("Face rule", bible.faceRule),
    labeledRule("Signature feature", bible.signatureFeature),
    labeledRule("Appeal hook", bible.appealHook),
    `Palette only: ${bible.palette.join(", ")}.`,
    labeledRule("Rendering rule", bible.renderingRule),
    "One character only, neutral three-quarter pose, complete silhouette visible, simple opaque",
    "background, large readable face, short uncluttered limbs, no text, logo, UI, contact sheet,",
    "extra props, costume changes, or anatomy not specified by the bible.",
    labeledRule("Avoid", bible.avoids.map(stripEndPunctuation).join("; ")),
    "Hard identity audit: inspect every named count, side, direction, colour, and shape before",
    "delivery. Any mismatch is a failed reference and must be regenerated, not rationalized.",
    `The character must remain recognizable at ${bible.minimumSize}px.`,
  ].join("\n");
}

function labeledRule(label: string, value: string): string {
  return `${label}: ${stripEndPunctuation(value)}.`;
}

function stripEndPunctuation(value: string): string {
  return value.trim().replace(/[.!?]+$/u, "");
}

/** Build one pose prompt that repeats every identity anchor from the accepted primary. */
export function buildPoseImagePrompt(bible: CharacterBible, pose: MascotPose): string {
  return [
    `Edit the accepted primary reference of ${bible.mascotName} into one ${pose} pose.`,
    `Pose story: ${POSE_STORIES[pose]}.`,
    `Preserve exactly: ${bible.silhouette}; ${bible.proportions}; ${bible.faceRule};`,
    `${bible.signatureFeature}; ${bible.appealHook}; palette ${bible.palette.join(", ")};`,
    `and the same ${bible.renderingRule}.`,
    "Use the primary reference as the identity source. Change only the gesture and expression.",
    "One character, complete silhouette, simple opaque background, no text, logo, UI, new prop,",
    "new costume, extra character, contact sheet, or medium change.",
    labeledRule("Avoid", bible.avoids.map(stripEndPunctuation).join("; ")),
    "Hard identity audit: reject the pose if any named count, side, direction, colour, or shape",
    "differs from the accepted primary.",
  ].join("\n");
}

// --- Output Parsing ---

/**
 * Parse the AI's text response into a structured MascotOutput.
 *
 * The parser expects the output format defined in buildPrompt(), with
 * sections delimited by `### HEADER` markers. It extracts each section
 * and maps it to the corresponding MascotOutput field.
 *
 * If a section is missing or unparseable, the parser uses sensible
 * fallbacks (empty arrays, placeholder strings) rather than throwing.
 */
export function parseOutput(raw: string): MascotOutput {
  // Extract section by header
  function extractSection(header: string): string {
    const regex = new RegExp(`### ${header}\\s*\\n([\\s\\S]*?)(?=\\n### |$)`, "i");
    const match = raw.match(regex);
    return match?.[1]?.trim() ?? "";
  }

  // Extract brand essence
  const essenceRaw = extractSection("BRAND ESSENCE");
  const brandEssence = essenceRaw
    ? essenceRaw
        .split(/[,/\n]/)
        .map((s) => s.trim().replace(/^[-*]\s*/, ""))
        .filter((s) => s.length > 0)
    : [];

  // Extract concept
  const concept =
    extractSection("CONCEPT") ||
    "A brand mascot designed to embody the product's core values and connect with its audience.";

  // Extract personality analysis
  const personalityRaw = extractSection("PERSONALITY ANALYSIS");
  const personalityMatch = personalityRaw.match(/Personality:\s*(\w+)/i);
  const visualMatch = personalityRaw.match(/Visual language:\s*(.+)/i);
  const colorMatch = personalityRaw.match(/Color direction:\s*(.+)/i);
  const archetypeMatch = personalityRaw.match(/Character archetype:\s*(.+)/i);

  const personality = (personalityMatch?.[1]?.toLowerCase() ?? "friendly") as BrandPersonality;
  const personalityAnalysis: PersonalityAnalysis = {
    personality,
    visualLanguage: visualMatch?.[1]?.trim() ?? "Clean, modern illustration style",
    colorDirection: colorMatch?.[1]?.trim() ?? "Brand-aligned color palette",
    characterArchetype: archetypeMatch?.[1]?.trim() ?? "Friendly guide",
  };

  // Extract name
  const suggestedName = extractSection("NAME") || "Mascot";

  // Extract primary prompt
  const primaryPrompt =
    extractSection("PRIMARY PROMPT") ||
    "A friendly brand mascot character, clean vector illustration style, modern design, appealing and memorable.";

  // Extract variations
  const variationsRaw = extractSection("VARIATIONS");
  const variationPrompts = variationsRaw
    ? variationsRaw
        .split(/\n/)
        .map((line) => line.replace(/^\d+[.)]\s*/, "").trim())
        .filter((line) => line.length > 0)
    : [];

  // Extract usage guide
  const usageRaw = extractSection("USAGE GUIDE");
  const usageGuide: string[] = [];
  if (usageRaw) {
    const lines = usageRaw
      .split(/\n/)
      .map((line) => line.replace(/^[-*]\s*/, "").trim())
      .filter((line) => line.length > 0);

    for (const line of lines) {
      if (line) {
        usageGuide.push(line);
      }
    }
  }

  return {
    primaryPrompt,
    variationPrompts,
    suggestedName,
    brandEssence: brandEssence.length > 0 ? brandEssence : ["innovation", "quality", "trust"],
    concept,
    usageGuide,
    personalityAnalysis,
  };
}
