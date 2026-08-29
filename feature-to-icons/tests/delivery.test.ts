import { mkdtemp, readFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

import { writeIconFamily } from "../src/delivery.js";
import { deliverIconFamily, validate } from "../src/index.js";
import type { FeatureIconOutput } from "../src/types.js";

const ROOT_STYLED_SVG =
  '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" ' +
  'fill="none" stroke="#6366F1" stroke-width="2" stroke-linecap="round">' +
  '<circle cx="10" cy="10" r="6"/><path d="m15 15 5 5"/></svg>';

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
});
