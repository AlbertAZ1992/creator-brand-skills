import { describe, it, expect } from "vitest";
import { validate, buildPrompt, parseOutput } from "../src/index.js";
import type { FeatureIconInput, FeatureIconOutput } from "../src/types.js";

describe("validate", () => {
  it("returns correct defaults for valid minimal input", () => {
    const result = validate({ features: ["Dashboard", "Reports", "Users"] });
    expect(result.errors).toBeUndefined();
    expect(result.data).toBeDefined();
    expect(result.data!.features).toEqual(["Dashboard", "Reports", "Users"]);
    expect(result.data!.style).toBe("outline");
    expect(result.data!.gridSize).toBe(24);
    expect(result.data!.strokeWidth).toBe(2);
    expect(result.data!.cornerRadius).toBe("rounded");
    expect(result.data!.visualWeight).toBe("regular");
  });

  it("validates all fields with custom values", () => {
    const result = validate({
      features: ["Dashboard", "Settings", "Profile", "Logout"],
      style: "filled",
      colors: { primary: "#FF5733", secondary: "#33FF57" },
      gridSize: 32,
      strokeWidth: 3,
      cornerRadius: "round",
      visualWeight: "bold",
      productContext: "A SaaS analytics platform",
    });
    expect(result.errors).toBeUndefined();
    expect(result.data).toBeDefined();
    expect(result.data!.style).toBe("filled");
    expect(result.data!.colors).toEqual({ primary: "#FF5733", secondary: "#33FF57" });
    expect(result.data!.gridSize).toBe(32);
    expect(result.data!.strokeWidth).toBe(3);
    expect(result.data!.cornerRadius).toBe("round");
    expect(result.data!.visualWeight).toBe("bold");
    expect(result.data!.productContext).toBe("A SaaS analytics platform");
  });

  it("returns error for empty features array", () => {
    const result = validate({ features: [] });
    expect(result.data).toBeUndefined();
    expect(result.errors).toBeDefined();
    expect(result.errors!.some((e) => e.field === "features")).toBe(true);
  });

  it("returns error for too few features (less than 3)", () => {
    const result = validate({ features: ["One", "Two"] });
    expect(result.data).toBeUndefined();
    expect(result.errors).toBeDefined();
    expect(result.errors!.some((e) => e.field === "features")).toBe(true);
  });

  it("returns error for too many features (more than 20)", () => {
    const features = Array.from({ length: 25 }, (_, i) => `Feature ${i + 1}`);
    const result = validate({ features });
    expect(result.data).toBeUndefined();
    expect(result.errors).toBeDefined();
    expect(result.errors!.some((e) => e.field === "features")).toBe(true);
  });

  it("returns error for exactly 20 features (boundary valid case)", () => {
    const features = Array.from({ length: 20 }, (_, i) => `Feature ${i + 1}`);
    const result = validate({ features });
    expect(result.errors).toBeUndefined();
    expect(result.data).toBeDefined();
    expect(result.data!.features).toHaveLength(20);
  });

  it("returns error for exactly 3 features (boundary valid case)", () => {
    const result = validate({ features: ["A", "B", "C"] });
    expect(result.errors).toBeUndefined();
    expect(result.data).toBeDefined();
  });

  it("returns error for invalid style", () => {
    const result = validate({ features: ["A", "B", "C"], style: "invalid-style" });
    expect(result.data).toBeUndefined();
    expect(result.errors).toBeDefined();
    expect(result.errors!.some((e) => e.field === "style")).toBe(true);
  });

  it("returns error for invalid hex color in primary", () => {
    const result = validate({ features: ["A", "B", "C"], colors: { primary: "not-a-color" } });
    expect(result.data).toBeUndefined();
    expect(result.errors).toBeDefined();
    expect(result.errors!.some((e) => e.field === "colors.primary")).toBe(true);
  });

  it("accepts 3-digit hex colors", () => {
    const result = validate({ features: ["A", "B", "C"], colors: { primary: "#ABC" } });
    expect(result.errors).toBeUndefined();
    expect(result.data!.colors!.primary).toBe("#ABC");
  });

  it("returns error for invalid hex color in secondary", () => {
    const result = validate({
      features: ["A", "B", "C"],
      colors: { primary: "#123456", secondary: "bad" },
    });
    expect(result.data).toBeUndefined();
    expect(result.errors).toBeDefined();
    expect(result.errors!.some((e) => e.field === "colors.secondary")).toBe(true);
  });

  it("returns error for invalid gridSize", () => {
    const result = validate({ features: ["A", "B", "C"], gridSize: 16 });
    expect(result.data).toBeUndefined();
    expect(result.errors).toBeDefined();
    expect(result.errors!.some((e) => e.field === "gridSize")).toBe(true);
  });

  it("returns error for non-positive strokeWidth", () => {
    const result = validate({ features: ["A", "B", "C"], strokeWidth: 0 });
    expect(result.data).toBeUndefined();
    expect(result.errors).toBeDefined();
    expect(result.errors!.some((e) => e.field === "strokeWidth")).toBe(true);
  });

  it("returns error for negative strokeWidth", () => {
    const result = validate({ features: ["A", "B", "C"], strokeWidth: -1 });
    expect(result.data).toBeUndefined();
    expect(result.errors).toBeDefined();
    expect(result.errors!.some((e) => e.field === "strokeWidth")).toBe(true);
  });

  it("returns error for invalid cornerRadius", () => {
    const result = validate({ features: ["A", "B", "C"], cornerRadius: "circular" });
    expect(result.data).toBeUndefined();
    expect(result.errors).toBeDefined();
    expect(result.errors!.some((e) => e.field === "cornerRadius")).toBe(true);
  });

  it("returns error for invalid visualWeight", () => {
    const result = validate({ features: ["A", "B", "C"], visualWeight: "extra-bold" });
    expect(result.data).toBeUndefined();
    expect(result.errors).toBeDefined();
    expect(result.errors!.some((e) => e.field === "visualWeight")).toBe(true);
  });

  it("returns error for non-array features", () => {
    const result = validate({ features: "not-an-array" });
    expect(result.data).toBeUndefined();
    expect(result.errors).toBeDefined();
    expect(result.errors!.some((e) => e.field === "features")).toBe(true);
  });

  it("returns error for features with empty strings", () => {
    const result = validate({ features: ["Dashboard", "", "Users"] });
    expect(result.data).toBeUndefined();
    expect(result.errors).toBeDefined();
    expect(result.errors!.some((e) => e.field === "features[1]")).toBe(true);
  });

  it("rejects duplicate feature names after normalization", () => {
    const result = validate({ features: ["Search", " search ", "Share"] });
    expect(result.errors?.some((error) => error.message.includes("unique"))).toBe(true);
  });

  it("returns error for non-object input", () => {
    const result = validate(null);
    expect(result.data).toBeUndefined();
    expect(result.errors).toBeDefined();
  });

  it("trims whitespace from feature names", () => {
    const result = validate({ features: ["  Dashboard  ", " Reports ", "Users"] });
    expect(result.errors).toBeUndefined();
    expect(result.data!.features).toEqual(["Dashboard", "Reports", "Users"]);
  });
});

describe("buildPrompt", () => {
  const basicInput: FeatureIconInput = {
    features: ["Dashboard", "Reports", "Users", "Settings", "Notifications"],
    style: "outline",
    gridSize: 24,
    strokeWidth: 2,
    cornerRadius: "rounded",
    visualWeight: "regular",
  };

  it("contains design system constraints", () => {
    const prompt = buildPrompt(basicInput);
    expect(prompt).toContain("Design System");
    expect(prompt).toContain("24x24");
    expect(prompt).toContain("Stroke width: 2px");
    expect(prompt).toContain("rounded");
    expect(prompt).toContain("regular");
  });

  it("contains icon specifications for each feature", () => {
    const prompt = buildPrompt(basicInput);
    expect(prompt).toContain("Dashboard");
    expect(prompt).toContain("Reports");
    expect(prompt).toContain("Users");
    expect(prompt).toContain("Settings");
    expect(prompt).toContain("Notifications");
  });

  it("includes product context when provided", () => {
    const input: FeatureIconInput = {
      ...basicInput,
      productContext: "A project management SaaS tool for remote teams",
    };
    const prompt = buildPrompt(input);
    expect(prompt).toContain("Product Context");
    expect(prompt).toContain("A project management SaaS tool for remote teams");
  });

  it("does not include product context section when absent", () => {
    const prompt = buildPrompt(basicInput);
    expect(prompt).not.toContain("Product Context");
  });

  it("prompt length scales with feature count", () => {
    const smallPrompt = buildPrompt({
      features: ["A", "B", "C"],
      style: "outline",
      gridSize: 24,
      strokeWidth: 2,
      cornerRadius: "rounded",
      visualWeight: "regular",
    });

    const largeFeatures = Array.from({ length: 20 }, (_, i) => `Feature ${i + 1}`);
    const largePrompt = buildPrompt({
      features: largeFeatures,
      style: "outline",
      gridSize: 24,
      strokeWidth: 2,
      cornerRadius: "rounded",
      visualWeight: "regular",
    });

    expect(largePrompt.length).toBeGreaterThan(smallPrompt.length);
  });

  it("handles filled style with different design system text", () => {
    const input: FeatureIconInput = {
      ...basicInput,
      style: "filled",
    };
    const prompt = buildPrompt(input);
    expect(prompt).toContain("filled");
    expect(prompt).toContain("All shapes should be filled");
  });

  it("handles duotone style with design system text", () => {
    const input: FeatureIconInput = {
      ...basicInput,
      style: "duotone",
    };
    const prompt = buildPrompt(input);
    expect(prompt).toContain("duotone");
  });

  it("includes color palette when colors provided", () => {
    const input: FeatureIconInput = {
      ...basicInput,
      colors: { primary: "#1A2B3C", secondary: "#4D5E6F" },
    };
    const prompt = buildPrompt(input);
    expect(prompt).toContain("Color Palette");
    expect(prompt).toContain("#1A2B3C");
    expect(prompt).toContain("#4D5E6F");
  });

  it("includes grid size in SVG output format instructions", () => {
    const input: FeatureIconInput = {
      ...basicInput,
      gridSize: 48,
    };
    const prompt = buildPrompt(input);
    expect(prompt).toContain('viewBox="0 0 48 48"');
  });

  it("includes quality requirements", () => {
    const prompt = buildPrompt(basicInput);
    expect(prompt).toContain("Critical Quality Requirements");
    expect(prompt).toContain("recognizable at 16x16px");
  });
});

describe("parseOutput", () => {
  const svg = (path: string = "M4 12h16") =>
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" ` +
    `fill="none" stroke="currentColor" stroke-width="2"><path d="${path}"/></svg>`;

  it("parses a valid JSON response with icons map", () => {
    const raw = JSON.stringify({
      icons: {
        dashboard: svg("M4 4h6v6H4z"),
        reports: svg("M5 19V9m7 10V5m7 14v-7"),
        users: svg("M8 11a3 3 0 1 0 0-6"),
      },
    });

    const result: FeatureIconOutput = parseOutput(raw);
    expect(result.iconCount).toBe(3);
    expect(result.icons).toHaveLength(3);
    expect(result.icons[0]!.feature).toBe("dashboard");
    expect(result.icons[1]!.feature).toBe("reports");
    expect(result.icons[2]!.feature).toBe("users");
  });

  it("parses JSON from a markdown code block", () => {
    const raw = [
      "Here are your icons:",
      "",
      "```json",
      "{",
      '  "icons": {',
      `    "search": ${JSON.stringify(svg("M10 4a6 6 0 1 0 0 12"))},`,
      `    "filter": ${JSON.stringify(svg("M4 5h16l-6 7v6l-4 2v-8z"))}`,
      "  }",
      "}",
      "```",
    ].join("\n");

    const result = parseOutput(raw);
    expect(result.iconCount).toBe(2);
    expect(result.icons).toHaveLength(2);
  });

  it("parses JSON from a markdown code block without language specifier", () => {
    const raw = [
      "```",
      "{",
      '  "icons": {',
      `    "home": ${JSON.stringify(svg("M4 11l8-7 8 7v9H4z"))}`,
      "  }",
      "}",
      "```",
    ].join("\n");

    const result = parseOutput(raw);
    expect(result.iconCount).toBe(1);
  });

  it("throws for invalid JSON", () => {
    expect(() => parseOutput("not valid json at all")).toThrow("Failed to parse AI output");
  });

  it("throws for JSON without icons key", () => {
    expect(() => parseOutput(JSON.stringify({ something: "else" }))).toThrow(
      'must contain an "icons" object',
    );
  });

  it("throws for JSON with non-object icons", () => {
    expect(() => parseOutput(JSON.stringify({ icons: "not-an-object" }))).toThrow(
      'must contain an "icons" object',
    );
  });

  it("returns correct result structure", () => {
    const output = parseOutput(
      JSON.stringify({
        icons: { settings: svg("M12 4v16M4 12h16") },
      }),
    );

    expect(output).toHaveProperty("prompt");
    expect(output).toHaveProperty("iconCount");
    expect(output).toHaveProperty("icons");
    expect(output).toHaveProperty("artifacts");
    expect(output).toHaveProperty("designSystem");
    expect(output.designSystem).toHaveProperty("style");
    expect(output.designSystem).toHaveProperty("gridSize");
    expect(output.designSystem).toHaveProperty("strokeWidth");
    expect(output.designSystem).toHaveProperty("cornerRadius");
    expect(output.designSystem).toHaveProperty("visualWeight");
  });

  it("rejects SVGs with text or the wrong viewBox", () => {
    const invalid = JSON.stringify({
      icons: {
        settings:
          '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48" ' +
          'stroke-width="2"><text>Settings</text></svg>',
      },
    });
    expect(() => parseOutput(invalid)).toThrow("Invalid SVG");
  });

  it("rejects mixed stroke widths", () => {
    const invalid = JSON.stringify({
      icons: {
        settings:
          '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" ' +
          'stroke-width="2"><path stroke-width="3" d="M4 12h16"/></svg>',
      },
    });
    expect(() => parseOutput(invalid)).toThrow("every stroke-width");
  });

  it("rejects external CSS references", () => {
    const invalid = JSON.stringify({
      icons: {
        settings:
          '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" ' +
          'stroke-width="2"><style>@import url(https://example.test/icon.css);</style></svg>',
      },
    });
    expect(() => parseOutput(invalid)).toThrow("external stylesheets");
  });

  it("requires exact feature coverage when input is supplied", () => {
    const input: FeatureIconInput = {
      features: ["Search", "Filter", "Share"],
      style: "outline",
      gridSize: 24,
      strokeWidth: 2,
    };
    const raw = JSON.stringify({ icons: { Search: svg(), Filter: svg() } });
    expect(() => parseOutput(raw, input)).toThrow("exactly 3 icons");
  });
});
