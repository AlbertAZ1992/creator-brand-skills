import { mkdtemp, readFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

import {
  buildPhosphorIconFamily,
  deliverPhosphorIconFamily,
  searchPhosphorIcons,
  validate,
  validateSvgArtifact,
} from "../src/index.js";

function validInput(overrides: Record<string, unknown> = {}) {
  const result = validate({
    purpose: "system",
    features: ["Search", "Team Sharing", "Cloud Sync"],
    ...overrides,
  });
  if (!result.data) throw new Error(JSON.stringify(result.errors));
  return result.data;
}

describe("Phosphor library resolution", () => {
  it("maps known product phrases to curated Phosphor icons", () => {
    expect(searchPhosphorIcons("Team Sharing")[0]).toMatchObject({
      iconName: "users-three",
      confidence: 1,
      matchedBy: "preferred",
    });
    expect(searchPhosphorIcons("Cloud Sync")[0]?.iconName).toBe("cloud-arrow-up");
    expect(searchPhosphorIcons("AI Copilot")[0]?.iconName).toBe("head-circuit");
    expect(searchPhosphorIcons("Version History")[0]?.iconName).toBe("clock-counter-clockwise");
  });

  it("rejects unsupported non-Latin queries instead of choosing an alphabetical icon", async () => {
    expect(searchPhosphorIcons("团队协作")).toEqual([]);
    const result = validate({
      purpose: "system",
      features: ["团队协作", "数据导出", "智能助手"],
    });
    expect(result.data).toBeDefined();
    await expect(buildPhosphorIconFamily(result.data!)).rejects.toThrow("Provide an override");

    const output = await buildPhosphorIconFamily(result.data!, {
      团队协作: "users-three",
      数据导出: "database",
      智能助手: "head-circuit",
    });
    expect(output.artifacts.map((artifact) => artifact.fileName)).toEqual([
      "团队协作.svg",
      "数据导出.svg",
      "智能助手.svg",
    ]);
  });

  it("builds one undecorated regular Phosphor artifact per system feature", async () => {
    const output = await buildPhosphorIconFamily(validInput({ purpose: "system" }));

    expect(output.artifacts).toHaveLength(3);
    expect(output.artifacts.map((artifact) => artifact.source?.iconName)).toEqual([
      "magnifying-glass",
      "users-three",
      "cloud-arrow-up",
    ]);
    for (const artifact of output.artifacts) {
      expect(artifact.source).toMatchObject({
        type: "library",
        library: "Phosphor",
        version: "2.1.1",
        weight: "regular",
        license: "MIT",
        geometryModified: false,
      });
      expect(validateSvgArtifact(artifact.svg, output.designSystem, artifact.source)).toEqual([]);
      expect(artifact.svg).not.toContain("data-brand-treatment");
    }
    const first = output.artifacts[0]!;
    expect(
      validateSvgArtifact(first.svg, output.designSystem, {
        ...first.source!,
        geometryModified: true,
      }),
    ).toContain("library-first geometry must remain unmodified");
  });

  it("rejects library-backed brand feature art", async () => {
    await expect(buildPhosphorIconFamily(validInput({ purpose: "brand" }))).rejects.toThrow(
      "brand feature art requires custom SVG",
    );
  });

  it("keeps the system purpose as an undecorated native glyph", async () => {
    const output = await buildPhosphorIconFamily(validInput({ purpose: "system" }));

    expect(output.designSystem.purpose).toBe("system");
    expect(output.artifacts[0]?.svg).not.toContain("data-brand-treatment");
    expect(output.artifacts[0]?.svg).not.toContain("<rect");
  });

  it("maps filled and duotone styles to native Phosphor weights", async () => {
    const filled = await buildPhosphorIconFamily(validInput({ style: "filled" }));
    const duotone = await buildPhosphorIconFamily(
      validInput({
        style: "duotone",
        colors: { primary: "#7C3AED", secondary: "#EC4899" },
      }),
    );

    expect(filled.artifacts[0]?.source?.weight).toBe("fill");
    expect(duotone.artifacts[0]?.source?.weight).toBe("duotone");
    expect(duotone.artifacts[0]?.svg).toContain('fill="#EC4899"');
  });

  it("accepts explicit icon overrides and rejects unknown overrides", async () => {
    const overridden = await buildPhosphorIconFamily(validInput(), { Search: "binoculars" });
    expect(overridden.artifacts[0]?.source?.iconName).toBe("binoculars");

    await expect(
      buildPhosphorIconFamily(validInput(), { Search: "not-a-real-phosphor-icon" }),
    ).rejects.toThrow("Unknown Phosphor icon override");
  });

  it("rejects duplicate source icons and unsupported sharp geometry", async () => {
    const duplicateInput = validate({
      purpose: "system",
      features: ["Search", "Find", "Filters"],
    });
    expect(duplicateInput.data).toBeDefined();
    await expect(
      buildPhosphorIconFamily(duplicateInput.data!, {
        Search: "magnifying-glass",
        Find: "magnifying-glass",
        Filters: "funnel",
      }),
    ).rejects.toThrow("selected more than once");

    await expect(buildPhosphorIconFamily(validInput({ cornerRadius: "sharp" }))).rejects.toThrow(
      "custom fallback",
    );
  });

  it("writes provenance and optical metrics to the manifest", async () => {
    const outputDir = await mkdtemp(join(tmpdir(), "feature-icons-phosphor-test-"));
    try {
      const delivery = await deliverPhosphorIconFamily(validInput(), outputDir);
      const manifest = JSON.parse(await readFile(delivery.manifestPath, "utf8")) as {
        source: { strategy: string; library: string; version: string; weight: string };
        validation: { opticalMetrics: unknown[]; warnings: string[] };
      };

      expect(manifest.source).toMatchObject({
        strategy: "library-first",
        library: "Phosphor",
        version: "2.1.1",
        weight: "regular",
      });
      expect(manifest.validation.opticalMetrics).toHaveLength(3);
      expect(manifest.validation.warnings).toEqual([]);
    } finally {
      await rm(outputDir, { recursive: true, force: true });
    }
  });
});
