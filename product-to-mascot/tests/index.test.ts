import { describe, expect, it } from "vitest";
import {
  buildCharacterBiblePrompt,
  buildPrompt,
  createCharacterBible,
  parseOutput,
  validate,
} from "../src/index.js";

// --- validate() tests ---

describe("validate", () => {
  it("returns correct defaults for valid input", () => {
    const result = validate({
      productName: "Seedling",
      productDescription: "A plant care app that helps people keep houseplants alive.",
    });

    expect(result.ok).toBe(true);
    if (!result.ok) throw new Error("Expected ok");

    expect(result.value.productName).toBe("Seedling");
    expect(result.value.productDescription).toBe(
      "A plant care app that helps people keep houseplants alive.",
    );
    expect(result.value.personality).toBe("friendly");
    expect(result.value.mascotType).toBe("character");
    expect(result.value.variationCount).toBe(4);
    expect(result.value.targetAudience).toBeUndefined();
    expect(result.value.visualStyle).toBeUndefined();
  });

  it("rejects empty productName", () => {
    const result = validate({
      productName: "",
      productDescription: "Some description.",
    });

    expect(result.ok).toBe(false);
    if (result.ok) throw new Error("Expected error");
    expect(result.errors).toHaveLength(1);
    expect(result.errors[0]!.field).toBe("productName");
  });

  it("rejects missing productName", () => {
    const result = validate({
      productDescription: "Some description.",
    });

    expect(result.ok).toBe(false);
    if (result.ok) throw new Error("Expected error");
    expect(result.errors[0]!.field).toBe("productName");
  });

  it("rejects over-long productDescription", () => {
    const result = validate({
      productName: "Test",
      productDescription: "x".repeat(2001),
    });

    expect(result.ok).toBe(false);
    if (result.ok) throw new Error("Expected error");
    expect(result.errors).toHaveLength(1);
    expect(result.errors[0]!.field).toBe("productDescription");
  });

  it("rejects invalid personality", () => {
    const result = validate({
      productName: "Test",
      productDescription: "Some description.",
      personality: "aggressive",
    });

    expect(result.ok).toBe(false);
    if (result.ok) throw new Error("Expected error");
    expect(result.errors).toHaveLength(1);
    expect(result.errors[0]!.field).toBe("personality");
  });

  it("rejects variationCount below 3", () => {
    const result = validate({
      productName: "Test",
      productDescription: "Some description.",
      variationCount: 2,
    });

    expect(result.ok).toBe(false);
    if (result.ok) throw new Error("Expected error");
    expect(result.errors).toHaveLength(1);
    expect(result.errors[0]!.field).toBe("variationCount");
  });

  it("rejects variationCount above 8", () => {
    const result = validate({
      productName: "Test",
      productDescription: "Some description.",
      variationCount: 9,
    });

    expect(result.ok).toBe(false);
    if (result.ok) throw new Error("Expected error");
    expect(result.errors).toHaveLength(1);
    expect(result.errors[0]!.field).toBe("variationCount");
  });

  it("accepts all valid personalities", () => {
    const validPersonalities = [
      "friendly",
      "professional",
      "playful",
      "technical",
      "approachable",
    ] as const;

    for (const p of validPersonalities) {
      const result = validate({
        productName: "Test",
        productDescription: "Some description.",
        personality: p,
      });

      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value.personality).toBe(p);
      }
    }
  });

  it("accepts all valid mascot types", () => {
    const validTypes = ["animal", "character", "abstract", "robot"] as const;

    for (const t of validTypes) {
      const result = validate({
        productName: "Test",
        productDescription: "Some description.",
        mascotType: t,
      });

      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value.mascotType).toBe(t);
      }
    }
  });

  it("accepts optional fields", () => {
    const result = validate({
      productName: "ByteBot",
      productDescription: "An AI coding assistant for developers.",
      targetAudience: "Professional software engineers",
      personality: "technical",
      mascotType: "robot",
      visualStyle: "Cyberpunk anime",
      variationCount: 5,
    });

    expect(result.ok).toBe(true);
    if (!result.ok) throw new Error("Expected ok");

    expect(result.value.targetAudience).toBe("Professional software engineers");
    expect(result.value.personality).toBe("technical");
    expect(result.value.mascotType).toBe("robot");
    expect(result.value.visualStyle).toBe("Cyberpunk anime");
    expect(result.value.variationCount).toBe(5);
  });

  it("returns multiple errors at once", () => {
    const result = validate({
      productName: "",
      productDescription: "",
      personality: "evil",
    });

    expect(result.ok).toBe(false);
    if (result.ok) throw new Error("Expected error");
    expect(result.errors.length).toBeGreaterThanOrEqual(3);
  });
});

// --- buildPrompt() tests ---

describe("buildPrompt", () => {
  const defaultInput = {
    productName: "Seedling",
    productDescription:
      "A plant care app that helps people keep their houseplants alive with watering reminders, light monitoring, and plant identification.",
    personality: "friendly" as const,
    mascotType: "character" as const,
    visualStyle: "Flat vector illustration",
    variationCount: 4,
  };

  it("contains product name and description", () => {
    const prompt = buildPrompt(defaultInput);

    expect(prompt).toContain("Seedling");
    expect(prompt).toContain("plant care app");
  });

  it("uses personality-specific visual language for friendly", () => {
    const prompt = buildPrompt({ ...defaultInput, personality: "friendly" });

    expect(prompt.toLowerCase()).toContain("warm");
    expect(prompt.toLowerCase()).toContain("rounded");
    expect(prompt.toLowerCase()).toContain("caregiver");
  });

  it("uses personality-specific visual language for technical", () => {
    const prompt = buildPrompt({
      ...defaultInput,
      productName: "DataFlow",
      productDescription: "A data pipeline orchestration platform.",
      personality: "technical",
      mascotType: "robot",
    });

    expect(prompt.toLowerCase()).toContain("geometric");
    expect(prompt.toLowerCase()).toContain("precise");
    expect(prompt.toLowerCase()).toContain("sage");
  });

  it("uses personality-specific visual language for playful", () => {
    const prompt = buildPrompt({
      ...defaultInput,
      productName: "FunBox",
      productDescription: "A gamified learning platform for kids.",
      personality: "playful",
      mascotType: "animal",
    });

    expect(prompt.toLowerCase()).toContain("exaggerated");
    expect(prompt.toLowerCase()).toContain("dynamic");
    expect(prompt.toLowerCase()).toContain("jester");
  });

  it("uses personality-specific visual language for professional", () => {
    const prompt = buildPrompt({
      ...defaultInput,
      productName: "BoardRoom",
      productDescription: "Enterprise board management software for executives.",
      personality: "professional",
      mascotType: "abstract",
    });

    expect(prompt.toLowerCase()).toContain("confident");
    expect(prompt.toLowerCase()).toContain("clean");
    expect(prompt.toLowerCase()).toContain("ruler");
  });

  it("uses personality-specific visual language for approachable", () => {
    const prompt = buildPrompt({
      ...defaultInput,
      productName: "Neighborly",
      productDescription: "A local community bulletin board app.",
      personality: "approachable",
    });

    expect(prompt.toLowerCase()).toContain("relatable");
    expect(prompt.toLowerCase()).toContain("down-to-earth");
    expect(prompt.toLowerCase()).toContain("everyman");
  });

  it("includes mascot type guidance", () => {
    const prompt = buildPrompt({ ...defaultInput, mascotType: "robot" });

    expect(prompt.toLowerCase()).toContain("mechanical");
    expect(prompt.toLowerCase()).toContain("robotic");
  });

  it("includes usage guide section", () => {
    const prompt = buildPrompt(defaultInput);

    expect(prompt).toContain("USAGE GUIDE");
    expect(prompt).toContain("Do");
    expect(prompt).toContain("Don't");
  });

  it("includes all output format sections", () => {
    const prompt = buildPrompt(defaultInput);

    expect(prompt).toContain("BRAND ESSENCE");
    expect(prompt).toContain("CONCEPT");
    expect(prompt).toContain("PERSONALITY ANALYSIS");
    expect(prompt).toContain("NAME");
    expect(prompt).toContain("PRIMARY PROMPT");
    expect(prompt).toContain("VARIATIONS");
    expect(prompt).toContain("USAGE GUIDE");
    expect(prompt).toContain("COLOR PALETTE");
  });

  it("includes target audience when provided", () => {
    const prompt = buildPrompt({
      ...defaultInput,
      targetAudience: "Millennial plant parents",
    });

    expect(prompt).toContain("Millennial plant parents");
  });

  it("respects variation count", () => {
    const prompt = buildPrompt({ ...defaultInput, variationCount: 6 });

    expect(prompt).toContain("6 variation");
  });

  it("includes brand essence keywords", () => {
    const prompt = buildPrompt(defaultInput);

    // The prompt should contain the extracted essence keywords section
    expect(prompt).toContain("core brand attributes");
  });
});

// --- parseOutput() tests ---

describe("parseOutput", () => {
  it("returns correct structure from well-formed output", () => {
    const raw = `### BRAND ESSENCE
growth, nurturing, smart, simplicity, life

### CONCEPT
Sprig is a small green sprout character with dewdrop eyes. Wearing a tiny gardener's hat and carrying a miniature watering can, Sprig embodies the nurturing spirit of plant care with a cheerful, encouraging personality.

### PERSONALITY ANALYSIS
- Personality: friendly
- Visual language: Warm, rounded shapes with soft gradients and gentle expressions
- Color direction: Sage green, warm yellow, terra cotta, cream white
- Character archetype: The Caregiver -- nurturing plant friend

### NAME
Sprig

### PRIMARY PROMPT
A cute green sprout mascot character with big dewdrop eyes, wearing a tiny straw gardener hat, holding a small copper watering can, friendly warm smile, flat vector illustration style, sage green and warm yellow color palette, clean outlines, full body character design, white background, children's book illustration quality

### VARIATIONS
1. Sprig waving hello with one leaf-hand, cheerful expression, standing next to a potted plant
2. Sprig examining a leaf with a tiny magnifying glass, focused expression, plant-doctor mode
3. Sprig celebrating with arms raised, confetti of flower petals around, joyful expression
4. Sprig reading a plant care book, sitting cross-legged, content learning expression

### USAGE GUIDE
- Do: Use on light backgrounds for maximum contrast
- Do: Keep minimum size at 32px for digital use
- Do: Pair with the Seedling green (#7CB342) as primary brand color
- Don't: Rotate or skew the mascot
- Don't: Use on busy photographic backgrounds
- Don't: Change the mascot's core colors

### COLOR PALETTE
- Sprout Green: #7CB342
- Warm Yellow: #FFD54F
- Terra Cotta: #BF6F4A
- Cream White: #FFF8E1
- Dewdrop Blue: #B3E5FC`;

    const output = parseOutput(raw);

    expect(output.suggestedName).toBe("Sprig");
    expect(output.brandEssence).toContain("growth");
    expect(output.brandEssence).toContain("nurturing");
    expect(output.concept).toContain("Sprig is a small green sprout");
    expect(output.primaryPrompt).toContain("green sprout mascot");
    expect(output.variationPrompts).toHaveLength(4);
    expect(output.variationPrompts[0]).toContain("waving hello");
    expect(output.usageGuide.length).toBeGreaterThan(0);
    expect(output.usageGuide[0]).toContain("light backgrounds");

    expect(output.personalityAnalysis.personality).toBe("friendly");
    expect(output.personalityAnalysis.visualLanguage).toContain("Warm");
    expect(output.personalityAnalysis.colorDirection).toContain("green");
    expect(output.personalityAnalysis.characterArchetype).toContain("Caregiver");
  });

  it("handles minimal output gracefully", () => {
    const output = parseOutput("### NAME\nTestMascot");

    expect(output.suggestedName).toBe("TestMascot");
    expect(output.brandEssence).toEqual(["innovation", "quality", "trust"]);
    expect(output.primaryPrompt).toContain("friendly brand mascot");
    expect(output.variationPrompts).toEqual([]);
    expect(output.usageGuide).toEqual([]);
    expect(output.personalityAnalysis.personality).toBe("friendly");
  });

  it("handles empty input", () => {
    const output = parseOutput("");

    expect(output.suggestedName).toBe("Mascot");
    expect(output.brandEssence).toEqual(["innovation", "quality", "trust"]);
    expect(output.variationPrompts).toEqual([]);
    expect(output.usageGuide).toEqual([]);
  });

  it("extracts brand essence with bullet points", () => {
    const raw = `### BRAND ESSENCE
- speed
- intelligence
- reliability
- connection`;

    const output = parseOutput(raw);

    expect(output.brandEssence).toContain("speed");
    expect(output.brandEssence).toContain("intelligence");
    expect(output.brandEssence).toContain("reliability");
    expect(output.brandEssence).toContain("connection");
  });

  it("extracts brand essence comma-separated", () => {
    const raw = `### BRAND ESSENCE
speed, intelligence, reliability, connection`;

    const output = parseOutput(raw);

    expect(output.brandEssence).toContain("speed");
    expect(output.brandEssence).toContain("intelligence");
    expect(output.brandEssence).toContain("reliability");
    expect(output.brandEssence).toContain("connection");
  });
});

describe("character bible handoff", () => {
  const input = {
    productName: "Seedling",
    productDescription: "A plant care app for new houseplant owners.",
    personality: "friendly" as const,
    mascotType: "character" as const,
  };

  it("asks for the invariants needed by later images", () => {
    const prompt = buildCharacterBiblePrompt(input);

    expect(prompt).toContain("silhouette");
    expect(prompt).toContain("palette");
    expect(prompt).toContain("exactly three visual prohibitions");
  });

  it("adds product identity to an accepted character bible", () => {
    const bible = createCharacterBible(input, {
      mascotName: "Sprig",
      brandEssence: ["growth", "care"],
      silhouette: "Round sprout with two leaves",
      faceRule: "Dewdrop eyes and a small smile",
      palette: ["#7CB342", "#FFD54F", "#FFF8E1"],
      signatureFeature: "Tiny watering can",
      renderingRule: "Flat vector with rounded outlines",
      avoids: ["realistic anatomy", "extra text", "gradients"],
    });

    expect(bible.version).toBe(1);
    expect(bible.productName).toBe("Seedling");
    expect(bible.mascotName).toBe("Sprig");
    expect(bible.personality).toBe("friendly");
  });
});
