import { mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { basename, join } from "node:path";
import sharp from "sharp";
import { describe, it, expect } from "vitest";
import { buildMesh, validate, buildPrompt } from "../src/index.js";

// ---------------------------------------------------------------------------
// validate
// ---------------------------------------------------------------------------

describe("validate", () => {
  // --- success cases ---

  it("accepts minimal input with defaults applied", () => {
    const { options, errors } = validate({ logoPath: "./logo.png" });

    expect(errors).toHaveLength(0);
    expect(options.logoPath).toBe("./logo.png");
    expect(options.output).toBe("both");
    expect(options.shape).toBe("object");
    expect(options.depth).toBe(4);
    expect(options.background).toBe("studio");
  });

  it("accepts all options explicitly specified", () => {
    const { options, errors } = validate({
      logoPath: "./logo.png",
      output: "mesh",
      shape: "object",
      depth: 10,
      clayColor: "#E8A87C",
      background: "transparent",
    });

    expect(errors).toHaveLength(0);
    expect(options.logoPath).toBe("./logo.png");
    expect(options.output).toBe("mesh");
    expect(options.shape).toBe("object");
    expect(options.depth).toBe(10);
    expect(options.clayColor).toBe("#E8A87C");
    expect(options.background).toBe("transparent");
  });

  it("accepts output=image", () => {
    const { errors, options } = validate({ logoPath: "./logo.png", output: "image" });
    expect(errors).toHaveLength(0);
    expect(options.output).toBe("image");
  });

  it("accepts output=both", () => {
    const { errors, options } = validate({ logoPath: "./logo.png", output: "both" });
    expect(errors).toHaveLength(0);
    expect(options.output).toBe("both");
  });

  it("accepts shape=relief", () => {
    const { errors, options } = validate({ logoPath: "./logo.png", shape: "relief" });
    expect(errors).toHaveLength(0);
    expect(options.shape).toBe("relief");
  });

  it("accepts background=transparent", () => {
    const { errors, options } = validate({ logoPath: "./logo.png", background: "transparent" });
    expect(errors).toHaveLength(0);
    expect(options.background).toBe("transparent");
  });

  it("accepts background=studio", () => {
    const { errors, options } = validate({ logoPath: "./logo.png", background: "studio" });
    expect(errors).toHaveLength(0);
    expect(options.background).toBe("studio");
  });

  it("accepts depth=0 for flat extrusion", () => {
    const { errors, options } = validate({ logoPath: "./logo.png", depth: 0 });
    expect(errors).toHaveLength(0);
    expect(options.depth).toBe(0);
  });

  // --- error cases ---

  it("rejects non-object input", () => {
    const { errors } = validate(null);
    expect(errors).toHaveLength(1);
    expect(errors[0]?.field).toBe("root");
  });

  it("rejects invalid output value", () => {
    const { errors } = validate({ logoPath: "./logo.png", output: "video" });
    expect(errors).toHaveLength(1);
    expect(errors[0]?.field).toBe("output");
  });

  it.each(["badge", "freestanding"])("rejects removed shape=%s", (shape) => {
    const { errors } = validate({ logoPath: "./logo.png", shape });
    expect(errors).toHaveLength(1);
    expect(errors[0]?.field).toBe("shape");
  });

  it.each(["subtle", "handmade"])("rejects removed texture=%s", (texture) => {
    const { errors } = validate({ logoPath: "./logo.png", texture });
    expect(errors).toEqual([
      {
        field: "texture",
        message: "texture is no longer supported; all outputs use one refined clay material",
      },
    ]);
  });

  it("rejects invalid background value", () => {
    const { errors } = validate({ logoPath: "./logo.png", background: "red" });
    expect(errors).toHaveLength(1);
    expect(errors[0]?.field).toBe("background");
  });

  it("rejects negative depth", () => {
    const { errors } = validate({ logoPath: "./logo.png", depth: -1 });
    expect(errors).toHaveLength(1);
    expect(errors[0]?.field).toBe("depth");
  });

  it("rejects empty logoPath", () => {
    const { errors } = validate({ logoPath: "" });
    expect(errors.length).toBeGreaterThan(0);
    expect(errors.some((e) => e.field === "logoPath")).toBe(true);
  });

  it("rejects non-string clayColor", () => {
    const { errors } = validate({ logoPath: "./logo.png", clayColor: 123 });
    expect(errors).toHaveLength(1);
    expect(errors[0]?.field).toBe("clayColor");
  });
});

// ---------------------------------------------------------------------------
// buildPrompt
// ---------------------------------------------------------------------------

describe("buildPrompt", () => {
  const defaultOpts = {
    logoPath: "./logo.png",
    output: "both" as const,
    shape: "object" as const,
    depth: 4,
    background: "studio" as const,
  };

  it("contains clay style tokens", () => {
    const prompt = buildPrompt(defaultOpts);
    expect(prompt).toContain("refined clay-style");
    expect(prompt).toContain("refined studio clay sculpture");
    expect(prompt).toContain("smooth continuous matte surface");
    expect(prompt).toContain("no cartoon exaggeration");
    expect(prompt).toContain("no extra symbols");
  });

  it("includes shape description for object", () => {
    const prompt = buildPrompt({ ...defaultOpts, shape: "object" });
    expect(prompt).toContain("standalone clay object");
    expect(prompt).toContain("slim, softly beveled");
  });

  it("includes background preference for studio", () => {
    const prompt = buildPrompt({ ...defaultOpts, background: "studio" });
    expect(prompt).toContain("purposeful editorial studio scene");
    expect(prompt).toContain("readable at thumbnail size");
  });

  it("includes background preference for transparent", () => {
    const prompt = buildPrompt({ ...defaultOpts, background: "transparent" });
    expect(prompt).toContain("transparent background");
  });

  it("includes depth value", () => {
    const prompt = buildPrompt({ ...defaultOpts, depth: 8 });
    expect(prompt).toContain("8mm");
  });

  it("includes specific clay color when provided", () => {
    const prompt = buildPrompt({ ...defaultOpts, clayColor: "#FF6B35" });
    expect(prompt).toContain("#FF6B35");
  });

  it("mentions primary color match when no clayColor", () => {
    const { options } = validate({ logoPath: "./logo.png" });
    const prompt = buildPrompt(options);
    expect(prompt).toContain("match the logo's primary color");
  });

  it("is concise (under 1500 characters)", () => {
    const prompt = buildPrompt(defaultOpts);
    expect(prompt.length).toBeLessThan(1500);
  });

  it("mentions roughness and metalness", () => {
    const prompt = buildPrompt(defaultOpts);
    expect(prompt).toContain("high roughness");
    expect(prompt).toContain("zero metalness");
  });
});

// ---------------------------------------------------------------------------
// buildMesh
// ---------------------------------------------------------------------------

function assertObjHasThroughCounter(obj: string): void {
  const vertices = obj
    .split("\n")
    .filter((line) => line.startsWith("v "))
    .map((line) => line.split(/\s+/).slice(1).map(Number));
  const top = Math.max(...vertices.map((vertex) => vertex[2]!));
  const bottom = Math.min(...vertices.map((vertex) => vertex[2]!));
  const flatFaceLevels = new Set<number>();
  const edgeUses = new Map<string, number>();
  for (const line of obj.split("\n")) {
    if (!line.startsWith("f ")) continue;
    const indices = line
      .split(/\s+/)
      .slice(1)
      .map((part) => Number(part.split("/")[0]) - 1);
    const zValues = indices.map((index) => vertices[index]?.[2]);
    if (zValues.length === 3 && zValues.every((z) => z !== undefined && z === zValues[0])) {
      flatFaceLevels.add(zValues[0]!);
    }
    const faceEdges: Array<[number, number]> = [
      [indices[0]!, indices[1]!],
      [indices[1]!, indices[2]!],
      [indices[2]!, indices[0]!],
    ];
    for (const [from, to] of faceEdges) {
      const edge = [vertices[from]!, vertices[to]!]
        .map((vertex) => vertex.map((value) => value.toFixed(6)).join(","))
        .sort()
        .join("|");
      edgeUses.set(edge, (edgeUses.get(edge) ?? 0) + 1);
    }
  }
  expect(vertices.length).toBeGreaterThan(0);
  expect(top).toBeGreaterThan(bottom);
  expect([...flatFaceLevels].every((z) => z === bottom || z === top)).toBe(true);
  expect([...edgeUses.values()].every((uses) => uses === 2)).toBe(true);
}

describe("buildMesh", () => {
  it("turns enclosed PNG regions into through-counters", async () => {
    const directory = await mkdtemp(join(tmpdir(), "logo-to-clay-"));
    const logoPath = join(directory, "ring.png");
    const size = 100;
    const pixels = Buffer.alloc(size * size * 4);
    for (let y = 0; y < size; y++) {
      for (let x = 0; x < size; x++) {
        const isRing =
          x >= 10 && x < 90 && y >= 10 && y < 90 && (x < 25 || x >= 75 || y < 25 || y >= 75);
        if (!isRing) continue;
        const index = (y * size + x) * 4;
        pixels[index] = 0;
        pixels[index + 1] = 0;
        pixels[index + 2] = 0;
        pixels[index + 3] = 255;
      }
    }
    await sharp(pixels, { raw: { width: size, height: size, channels: 4 } })
      .png()
      .toFile(logoPath);

    try {
      const result = await buildMesh({ logoPath, output: "mesh", outputDir: directory });
      const obj = await readFile(result.meshPath!, "utf-8");
      const materialName = `${basename(logoPath, ".png")}-clay-clay.mtl`;
      const material = await readFile(join(directory, materialName), "utf-8");
      assertObjHasThroughCounter(obj);
      expect(obj).toContain(`mtllib ${materialName}`);
      expect(obj).toContain("\ns 1\n");
      expect(material).toMatch(/Kd \d+(?:\.\d+)? \d+(?:\.\d+)? \d+(?:\.\d+)?/);
      expect(material).toContain(`map_Bump -bm 0.1 ${basename(result.bumpPath!)}`);
      const bump = await sharp(result.bumpPath!).metadata();
      expect(bump.width).toBe(512);
      expect(bump.height).toBe(512);
      const { data: preview, info } = await sharp(result.imagePath!).raw().toBuffer({
        resolveWithObject: true,
      });
      const center = (Math.floor(info.height / 2) * info.width + Math.floor(info.width / 2)) * 4;
      expect(preview[center]).toBeGreaterThan(200);
      expect(preview[center + 1]).toBeGreaterThan(200);
      expect(preview[center + 2]).toBeGreaterThan(200);
    } finally {
      await rm(directory, { recursive: true, force: true });
    }
  });

  it("exports relief backing geometry and the shared clay material", async () => {
    const directory = await mkdtemp(join(tmpdir(), "logo-to-clay-relief-"));
    try {
      const result = await buildMesh({
        logoPath: "./tests/fixtures/simple-logo.png",
        output: "mesh",
        outputDir: directory,
        shape: "relief",
        depth: 2,
      });
      const obj = await readFile(result.meshPath!, "utf-8");
      const material = await readFile(result.materialPath!, "utf-8");
      const manifest = JSON.parse(await readFile(result.manifestPath!, "utf-8")) as {
        backing: { enabled: boolean; depth: number };
      };
      expect(obj).toContain("o relief_backing");
      expect(obj).toContain("usemtl backing");
      expect(material).toContain("newmtl backing");
      expect(material).toContain(`map_Bump -bm 0.1 ${basename(result.bumpPath!)}`);
      expect(manifest.backing).toEqual({ enabled: true, depth: 1.2 });
      expect(result.validation?.materialTexture).toEqual({
        width: 512,
        height: 512,
        format: "png",
      });
    } finally {
      await rm(directory, { recursive: true, force: true });
    }
  });

  it("extracts a light logo from a dark opaque background", async () => {
    const directory = await mkdtemp(join(tmpdir(), "logo-to-clay-"));
    const logoPath = join(directory, "light-ring.png");
    const size = 100;
    const pixels = Buffer.alloc(size * size * 4, 16);
    for (let i = 3; i < pixels.length; i += 4) pixels[i] = 255;
    for (let y = 0; y < size; y++) {
      for (let x = 0; x < size; x++) {
        const isRing =
          x >= 10 && x < 90 && y >= 10 && y < 90 && (x < 25 || x >= 75 || y < 25 || y >= 75);
        if (!isRing) continue;
        const index = (y * size + x) * 4;
        pixels[index] = 245;
        pixels[index + 1] = 245;
        pixels[index + 2] = 245;
      }
    }
    await sharp(pixels, { raw: { width: size, height: size, channels: 4 } })
      .png()
      .toFile(logoPath);

    try {
      const result = await buildMesh({ logoPath, output: "mesh", outputDir: directory });
      assertObjHasThroughCounter(await readFile(result.meshPath!, "utf-8"));
    } finally {
      await rm(directory, { recursive: true, force: true });
    }
  });

  it("finds each enclosed dark counter in a multi-glyph opaque logo", async () => {
    const directory = await mkdtemp(join(tmpdir(), "logo-to-clay-"));
    const logoPath = join(directory, "three-counters.png");
    const width = 120;
    const height = 80;
    const pixels = Buffer.alloc(width * height * 4, 16);
    for (let i = 3; i < pixels.length; i += 4) pixels[i] = 255;

    for (const left of [10, 45, 80]) {
      for (let y = 15; y < 65; y++) {
        for (let x = left; x < left + 25; x++) {
          const isBorder = x < left + 6 || x >= left + 19 || y < 21 || y >= 59;
          if (!isBorder) continue;
          const index = (y * width + x) * 4;
          pixels[index] = 245;
          pixels[index + 1] = 245;
          pixels[index + 2] = 245;
        }
      }
    }
    await sharp(pixels, { raw: { width, height, channels: 4 } })
      .png()
      .toFile(logoPath);

    try {
      const result = await buildMesh({ logoPath, output: "mesh", outputDir: directory });
      const recordPath = join(directory, `${basename(logoPath, ".png")}-clay-manifest.json`);
      const record = JSON.parse(await readFile(recordPath, "utf-8")) as {
        cavities: { count: number };
      };
      expect(record.cavities.count).toBe(3);
      assertObjHasThroughCounter(await readFile(result.meshPath!, "utf-8"));
    } finally {
      await rm(directory, { recursive: true, force: true });
    }
  });

  it("turns compound SVG paths into recessed cavities", async () => {
    const directory = await mkdtemp(join(tmpdir(), "logo-to-clay-"));
    const logoPath = join(directory, "ring.svg");
    await writeFile(
      logoPath,
      '<svg viewBox="0 0 100 100"><path fill-rule="evenodd" d="M 0 0 L 100 0 L 100 100 L 0 100 Z M 25 25 L 75 25 L 75 75 L 25 75 Z" /></svg>',
    );

    try {
      const result = await buildMesh({ logoPath, output: "mesh", outputDir: directory });
      assertObjHasThroughCounter(await readFile(result.meshPath!, "utf-8"));
    } finally {
      await rm(directory, { recursive: true, force: true });
    }
  });

  it.each([
    [
      "primitives-and-transform",
      '<svg viewBox="0 0 120 100"><g transform="translate(10 10) rotate(8 50 40)"><rect x="5" y="5" width="70" height="55" rx="12"/><circle cx="88" cy="48" r="22"/></g></svg>',
    ],
    ["arc-path", '<svg viewBox="0 0 100 100"><path d="M 50 8 A 42 42 0 1 1 49.9 8 Z"/></svg>'],
  ])("supports SVG %s geometry", async (name, svg) => {
    const directory = await mkdtemp(join(tmpdir(), "logo-to-clay-svg-"));
    const logoPath = join(directory, `${name}.svg`);
    await writeFile(logoPath, svg);

    try {
      const result = await buildMesh({ logoPath, output: "mesh", outputDir: directory });
      const obj = await readFile(result.meshPath!, "utf-8");
      expect(obj).toContain("\nv ");
      expect(obj).toContain("\nf ");
      expect(result.validation?.passed).toBe(true);
    } finally {
      await rm(directory, { recursive: true, force: true });
    }
  });

  it("rejects an SVG with no visible foreground", async () => {
    const directory = await mkdtemp(join(tmpdir(), "logo-to-clay-empty-"));
    const logoPath = join(directory, "empty.svg");
    await writeFile(logoPath, '<svg viewBox="0 0 100 100"/>');

    try {
      await expect(buildMesh({ logoPath, output: "mesh", outputDir: directory })).rejects.toThrow(
        "No foreground contour",
      );
    } finally {
      await rm(directory, { recursive: true, force: true });
    }
  });
});
