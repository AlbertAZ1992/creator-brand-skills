import { mkdtemp, readFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

import { writeIconFamily } from "../src/delivery.js";
import { deliverIconFamily, validate, validateSvgArtifact } from "../src/index.js";
import type { FeatureIconOutput } from "../src/types.js";

const ROOT_STYLED_SVG =
  '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" ' +
  'fill="none" stroke="#6366F1" stroke-width="2" stroke-linecap="round">' +
  '<circle cx="10" cy="10" r="6"/><path d="m15 15 5 5"/></svg>';

const HAND_DRAWN_SVG =
  '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48" fill="none" ' +
  'stroke="#25232B" stroke-width="2.6" stroke-linecap="round" ' +
  'data-icon-treatment="hand-drawn" data-icon-motion="wiggle">' +
  "<style>@keyframes icon-wiggle{0%,100%{transform:rotate(-1deg)}50%{transform:rotate(1deg)}}" +
  ".wiggle{animation:icon-wiggle 2.8s infinite}" +
  "@media (prefers-reduced-motion:reduce){.wiggle{animation:none}}</style>" +
  '<g class="wiggle"><path d="M10 25c5-12 20-15 28-3-4 13-18 18-28 3Z"/></g></svg>';

const OUTPUT: FeatureIconOutput = {
  prompt: "Generate one search icon",
  iconCount: 1,
  icons: [
    {
      feature: "Search",
      semanticConcept: "Magnifying glass",
      visualDescription: "A magnifying glass representing search",
    },
  ],
  artifacts: [
    {
      feature: "Search",
      semanticConcept: "Magnifying glass",
      visualDescription: "A magnifying glass representing search",
      fileName: "search.svg",
      svg: ROOT_STYLED_SVG,
    },
  ],
  designSystem: {
    purpose: "system",
    treatment: "system-native",
    motion: "none",
    style: "outline",
    gridSize: 24,
    strokeWidth: 2,
    cornerRadius: "rounded",
    visualWeight: "regular",
  },
};

describe("icon family delivery", () => {
  it("preserves root SVG presentation attributes in the family preview", async () => {
    const outputDir = await mkdtemp(join(tmpdir(), "feature-icons-style-test-"));
    try {
      const delivery = await writeIconFamily(OUTPUT, outputDir);
      const previewSvg = await readFile(
        join(delivery.outputDir, "icon-family-preview.svg"),
        "utf8",
      );

      expect(previewSvg).toContain('stroke="#6366F1"');
      expect(previewSvg).toContain('fill="none"');
      expect(previewSvg).toContain('viewBox="0 0 24 24"');
    } finally {
      await rm(outputDir, { recursive: true, force: true });
    }
  });

  it("rejects a preview when every icon renders without visible pixels", async () => {
    const input = validate({
      purpose: "system",
      features: ["One", "Two", "Three"],
      style: "outline",
      gridSize: 24,
      strokeWidth: 2,
    });
    expect(input.data).toBeDefined();
    const blankSvg =
      '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">' +
      '<g fill="none" stroke="currentColor" stroke-width="2"/></svg>';
    const raw = JSON.stringify({
      icons: { One: blankSvg, Two: blankSvg, Three: blankSvg },
    });
    const outputDir = await mkdtemp(join(tmpdir(), "feature-icons-blank-test-"));

    try {
      await expect(deliverIconFamily(input.data!, raw, outputDir)).rejects.toThrow(
        "no visible icon pixels",
      );
    } finally {
      await rm(outputDir, { recursive: true, force: true });
    }
  });

  it("rejects a family that mixes library and custom geometry", async () => {
    const mixed = structuredClone(OUTPUT);
    mixed.iconCount = 2;
    mixed.artifacts.push({
      ...mixed.artifacts[0]!,
      feature: "Library Search",
      fileName: "library-search.svg",
      source: {
        type: "library",
        library: "Phosphor",
        package: "@phosphor-icons/core",
        version: "2.1.1",
        iconName: "magnifying-glass",
        weight: "regular",
        license: "MIT",
        geometryModified: false,
        presentationModified: true,
      },
    });

    await expect(writeIconFamily(mixed, join(tmpdir(), "unused-mixed-family"))).rejects.toThrow(
      "must not mix library-backed and custom geometry",
    );
  });

  it("writes a playable HTML preview for animated hand-drawn SVGs", async () => {
    const validation = validate({ features: ["One", "Two", "Three"] });
    expect(validation.data).toBeDefined();
    const raw = JSON.stringify({
      icons: { One: HAND_DRAWN_SVG, Two: HAND_DRAWN_SVG, Three: HAND_DRAWN_SVG },
    });
    const outputDir = await mkdtemp(join(tmpdir(), "feature-icons-doodle-test-"));

    try {
      const delivery = await deliverIconFamily(validation.data!, raw, outputDir);
      const html = await readFile(delivery.animatedPreviewPath, "utf8");
      expect(html.match(/<svg\b/g)).toHaveLength(3);
      expect(html).toContain("icon-wiggle");
      expect(html).toContain("prefers-reduced-motion");
    } finally {
      await rm(outputDir, { recursive: true, force: true });
    }
  });

  it("rejects animated doodles without a reduced-motion fallback", () => {
    const design = {
      ...OUTPUT.designSystem,
      purpose: "brand" as const,
      treatment: "hand-drawn" as const,
      motion: "wiggle" as const,
      gridSize: 48,
      strokeWidth: 2.6,
    };
    const unsafeMotion = HAND_DRAWN_SVG.replace(
      "@media (prefers-reduced-motion:reduce){.wiggle{animation:none}}",
      "",
    );
    expect(validateSvgArtifact(unsafeMotion, design)).toContain(
      "animated SVG must include icon-wiggle keyframes and reduced-motion fallback",
    );
  });
});
