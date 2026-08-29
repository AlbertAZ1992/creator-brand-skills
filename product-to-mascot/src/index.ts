import type {
  BrandPersonality,
  CharacterBible,
  MascotInput,
  MascotOutput,
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
      "Confident posture; clean geometric lines; composed expression; authoritative silhouette; balanced proportions",
    colorDirection: "Deep navy, charcoal gray, crisp white, gold accents, burgundy, royal blue",
    characterArchetype: "The Ruler -- commanding, premium, trustworthy, exudes quiet confidence",
  },
  playful: {
    visualLanguage:
      "Exaggerated features; dynamic energetic pose; bold outlines; whimsical proportions; bouncy posture",
    colorDirection:
      "Bright primaries, neon accents, vivid orange, electric purple, lime green, hot pink",
    characterArchetype: "The Jester -- energetic, funny, irreverent, brings joy and surprise",
  },
  technical: {
    visualLanguage:
      "Geometric precision; sleek smooth surfaces; futuristic details; minimalist forms; sharp angles; glowing elements",
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
      "Design an animal character whose natural traits metaphorically match the product. Consider the animal's real-world behavior, habitat, and cultural associations. The animal should feel like a natural ambassador -- a fox for clever tech, an owl for knowledge platforms, a bee for productivity tools.",
    bestFor:
      "Products with natural metaphors, environmental themes, or instinct-based user experiences",
  },
  character: {
    designDirection:
      "Design a human-like character with a distinctive costume, prop, or tool that directly connects to the product. The character should have a clear role (guide, helper, expert) and a memorable silhouette. Include clothing details, accessories, and a signature item that reinforces the brand.",
    bestFor:
      "Consumer apps, service platforms, community products, or anything needing a relatable human touch",
  },
  abstract: {
    designDirection:
      "Design an abstract shape or form that expresses personality purely through motion, color, and proportion. No literal face needed -- convey emotion through shape language (round = friendly, angular = edgy), rhythm, and color energy. Think of it as a living logo.",
    bestFor:
      "Developer tools, infrastructure products, API platforms, or brands wanting a minimalist identity",
  },
  robot: {
    designDirection:
      "Design a mechanical or robotic character with product-themed features. Integrate UI elements, data visualizations, or functional components into the design. The robot should feel like it belongs to the product's universe -- helpful automation bot, data companion, or tech assistant.",
    bestFor: "AI/ML products, automation tools, developer platforms, or tech-heavy brands",
  },
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
    mascotType: mascotType ?? "character",
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
    : "Visual style: clean, modern illustration suitable for digital products.";

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

---

## Phase 2: Generate the Mascot Concept

### Step 4 -- Character Design Brief

Create a concise character design brief covering:
- The mascot's backstory (1-2 sentences connecting to the product's mission)
- Key visual features (silhouette, distinctive elements, signature prop/tool)
- Color palette (3-5 specific colors with hex codes when possible)
- Overall mood and personality

### Step 5 -- Primary Mascot Prompt

Write a detailed AI image generation prompt for the primary mascot. This should be ready to paste into Midjourney, DALL-E, or Stable Diffusion. Include:

- Character description (type, pose, expression)
- Artistic style and rendering technique
- Color palette and lighting
- Composition and framing
- Any important details or props

Format the prompt as clear, comma-separated descriptive phrases.

### Step 6 -- Variation Prompts (${variationCount} variations)

Create ${variationCount} variation prompts showing the mascot in different:
- Poses (waving, working, thinking, celebrating, presenting)
- Expressions (happy, focused, determined, surprised, content)
- Scenarios (using the product, helping users, celebrating success)

Each variation should maintain the mascot's core identity while showing range.

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

/**
 * Ask the planning model for a machine-readable character bible before image
 * generation. The accepted bible is the source of truth for later poses and
 * sticker generation.
 */
export function buildCharacterBiblePrompt(input: MascotInput): string {
  const visual = PERSONALITY_VISUAL_MAP[input.personality ?? "friendly"];
  const guidance = MASCOT_TYPE_GUIDANCE[input.mascotType ?? "character"];

  return [
    "Create a character bible for a reusable brand mascot.",
    `Product: ${input.productName}.`,
    `Product facts: ${input.productDescription}`,
    input.targetAudience ? `Audience: ${input.targetAudience}.` : "",
    `Personality visual language: ${visual.visualLanguage}.`,
    `Mascot guidance: ${guidance.designDirection}`,
    input.visualStyle ? `Requested visual style: ${input.visualStyle}.` : "",
    "Return JSON only with mascotName, brandEssence, silhouette, faceRule, palette,",
    "signatureFeature, renderingRule, and avoids. palette must contain 3-5 hex colours;",
    "avoids must contain exactly three visual prohibitions. Do not invent product facts.",
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
    version: 1,
    productName: input.productName,
    personality: input.personality ?? "friendly",
    mascotType: input.mascotType ?? "character",
  };
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
