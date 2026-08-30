import { mkdir, readFile, stat, writeFile } from "node:fs/promises";
import { basename, dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import sharp from "sharp";

import { buildMesh, validate } from "../src/index.js";

const packageRoot = dirname(dirname(fileURLToPath(import.meta.url)));
const examplesRoot = join(packageRoot, "examples");
const sourcesRoot = join(examplesRoot, "sources");
const generatedRoot = join(examplesRoot, "generated");

interface MeshExample {
  label: string;
  source: string;
  output: string;
  shape: "object" | "relief";
  depth: number;
  color: string;
  sourceReference?: string;
}

const examples: MeshExample[] = [
  {
    label: "ALBERTAZ wordmark object",
    source: "albertaz-wordmark.svg",
    output: "albertaz-wordmark/object",
    shape: "object",
    depth: 4,
    color: "#5B4BDB",
    sourceReference: "../source.svg",
  },
  {
    label: "Vite bolt object",
    source: "vite-bolt.png",
    output: "vite-bolt/object",
    shape: "object",
    depth: 6,
    color: "#8255F4",
  },
  {
    label: "JavaScript object",
    source: "js-community-logo.png",
    output: "javascript/object",
    shape: "object",
    depth: 5,
    color: "#F7DF1E",
  },
  {
    label: "JavaScript relief",
    source: "js-community-logo.png",
    output: "javascript/relief",
    shape: "relief",
    depth: 2,
    color: "#F7DF1E",
  },
];

async function main(): Promise<void> {
  await requireApprovedRender("albertaz-wordmark/clay-render.png");
  await requireApprovedRender("vite-bolt/clay-render.png");
  await requireApprovedRender("javascript/clay-render.png");
  await syncSource("vite-bolt.png", "vite-bolt/source.png");
  await syncSource("vite-bolt.svg", "vite-bolt/source.svg");
  await syncSource("js-community-logo.png", "javascript/source.png");

  for (const example of examples) {
    const preview = await buildExample(example);
    if (example.output === "javascript/object") {
      await sharp(preview)
        .png()
        .toFile(join(generatedRoot, "javascript", "mesh-preview.png"));
    }
  }
  await buildAlbertazShowcase();
  await buildShowcase();
  process.stdout.write("Regenerated the approved ALBERTAZ, Vite, and JavaScript examples.\n");
}

async function buildAlbertazShowcase(): Promise<void> {
  const background = Buffer.from(`
    <svg xmlns="http://www.w3.org/2000/svg" width="1600" height="640">
      <rect width="1600" height="640" fill="#F2EFE8"/>
      <text x="48" y="68" font-family="Arial, sans-serif" font-size="38"
        font-weight="800" fill="#17142C">ONE WORDMARK. TWO CLAY ROUTES.</text>
      <text x="48" y="108" font-family="Arial, sans-serif" font-size="20"
        fill="#676170">The campaign render and verified OBJ preserve one ALBERTAZ source.</text>
      <rect x="40" y="146" width="1520" height="430" rx="30"
        fill="#FFFEFB" stroke="#DDD6CB" stroke-width="2"/>
      <text x="260" y="532" text-anchor="middle" font-family="Arial, sans-serif"
        font-size="18" font-weight="800" fill="#817A88">LOCKED SOURCE</text>
      <text x="800" y="532" text-anchor="middle" font-family="Arial, sans-serif"
        font-size="18" font-weight="800" fill="#817A88">CLAY RENDER</text>
      <text x="1330" y="532" text-anchor="middle" font-family="Arial, sans-serif"
        font-size="18" font-weight="800" fill="#817A88">VERIFIED OBJ</text>
      <text x="505" y="362" text-anchor="middle" font-family="Arial, sans-serif"
        font-size="34" fill="#A39DAC">→</text>
      <text x="1088" y="362" text-anchor="middle" font-family="Arial, sans-serif"
        font-size="34" fill="#A39DAC">→</text>
    </svg>`);
  const layers = [
    { input: await showcaseImage("albertaz-wordmark/source.png", 390, 180), left: 65, top: 260 },
    {
      input: await showcaseImage("albertaz-wordmark/clay-render.png", 500, 290),
      left: 550,
      top: 210,
    },
    {
      input: await sharp(
        join(generatedRoot, "albertaz-wordmark/object/albertaz-wordmark-clay-preview.png"),
      )
        .extract({ left: 100, top: 320, width: 824, height: 380 })
        .resize({ width: 380, height: 260, fit: "inside" })
        .png()
        .toBuffer(),
      left: 1140,
      top: 220,
    },
  ];
  await sharp(background)
    .composite(layers)
    .png()
    .toFile(join(generatedRoot, "albertaz-wordmark", "source-to-clay.png"));
}

async function buildShowcase(): Promise<void> {
  const rows = [
    {
      label: "VITE BOLT",
      source: "vite-bolt/source.png",
      render: "vite-bolt/clay-render.png",
      preview: "vite-bolt/object/vite-bolt-clay-preview.png",
    },
    {
      label: "JAVASCRIPT",
      source: "javascript/source.png",
      render: "javascript/clay-render.png",
      preview: "javascript/mesh-preview.png",
    },
  ];
  const background = Buffer.from(`
    <svg xmlns="http://www.w3.org/2000/svg" width="1600" height="1000">
      <rect width="1600" height="1000" fill="#F2EFE8"/>
      <text x="44" y="62" font-family="Arial, sans-serif" font-size="36"
        font-weight="800" fill="#17142C">SOURCE → CLAY RENDER → REAL 3D MESH</text>
      <text x="44" y="98" font-family="Arial, sans-serif" font-size="18"
        fill="#676170">The beauty render and OBJ route share one locked logo source.</text>
      ${rows
        .map(
          (row, index) => `
            <rect x="40" y="${140 + index * 410}" width="1520" height="370" rx="30"
              fill="#FFFEFB" stroke="#DDD6CB" stroke-width="2"/>
            <text x="72" y="${182 + index * 410}" font-family="Arial, sans-serif"
              font-size="20" font-weight="800" fill="#5B4BDB">${row.label}</text>
            <text x="268" y="${474 + index * 410}" text-anchor="middle"
              font-family="Arial, sans-serif" font-size="14" font-weight="700"
              fill="#817A88">SOURCE</text>
            <text x="800" y="${474 + index * 410}" text-anchor="middle"
              font-family="Arial, sans-serif" font-size="14" font-weight="700"
              fill="#817A88">CLAY RENDER</text>
            <text x="1330" y="${474 + index * 410}" text-anchor="middle"
              font-family="Arial, sans-serif" font-size="14" font-weight="700"
              fill="#817A88">VERIFIED OBJ PREVIEW</text>
            <text x="521" y="${342 + index * 410}" text-anchor="middle"
              font-family="Arial, sans-serif" font-size="30" fill="#A39DAC">→</text>
            <text x="1065" y="${342 + index * 410}" text-anchor="middle"
              font-family="Arial, sans-serif" font-size="30" fill="#A39DAC">→</text>`,
        )
        .join("\n")}
    </svg>`);
  const layers = [];
  for (const [index, row] of rows.entries()) {
    const top = 202 + index * 410;
    layers.push({ input: await showcaseImage(row.source, 300, 230), left: 118, top });
    layers.push({ input: await showcaseImage(row.render, 430, 250), left: 585, top: top - 10 });
    layers.push({ input: await showcaseImage(row.preview, 300, 250), left: 1180, top: top - 10 });
  }
  await sharp(background).composite(layers).png().toFile(join(generatedRoot, "source-to-clay.png"));
}

async function showcaseImage(relativePath: string, width: number, height: number) {
  return sharp(join(generatedRoot, relativePath))
    .trim()
    .resize({ width, height, fit: "inside" })
    .png()
    .toBuffer();
}

async function requireApprovedRender(relativePath: string): Promise<void> {
  const file = join(generatedRoot, relativePath);
  if ((await stat(file)).size === 0) throw new Error(`${relativePath}: approved render is empty`);
  const metadata = await sharp(file).metadata();
  if ((metadata.width ?? 0) < 1024 || (metadata.height ?? 0) < 800) {
    throw new Error(`${relativePath}: approved render is too small`);
  }
}

async function syncSource(sourceName: string, destination: string): Promise<void> {
  const source = join(sourcesRoot, sourceName);
  const target = join(generatedRoot, destination);
  await mkdir(dirname(target), { recursive: true });
  if (source.endsWith(".png")) {
    await sharp(source).png().toFile(target);
    return;
  }
  await writeFile(target, await readFile(source));
}

async function renderSourcePng(
  sourceName: string,
  destination: string,
  width: number,
): Promise<void> {
  const target = join(generatedRoot, destination);
  await mkdir(dirname(target), { recursive: true });
  await sharp(join(sourcesRoot, sourceName)).resize({ width }).png().toFile(target);
}

async function buildExample(example: MeshExample): Promise<string> {
  const outputDir = join(generatedRoot, example.output);
  await mkdir(outputDir, { recursive: true });
  const validation = validate({
    logoPath: join(sourcesRoot, example.source),
    output: "mesh",
    outputDir,
    shape: example.shape,
    depth: example.depth,
    clayColor: example.color,
    background: "studio",
  });
  if (validation.errors.length > 0) {
    throw new Error(`${example.label}: ${JSON.stringify(validation.errors)}`);
  }
  const result = await buildMesh(validation.options);
  if (!result.validation?.passed || !result.imagePath || !result.manifestPath) {
    throw new Error(`${example.label}: mesh delivery did not pass`);
  }
  await makeManifestPortable(result.manifestPath, example.sourceReference ?? "../source.png");
  process.stdout.write(`PASS ${example.label}\n`);
  return result.imagePath;
}

async function makeManifestPortable(manifestPath: string, sourceReference: string): Promise<void> {
  const manifest = JSON.parse(await readFile(manifestPath, "utf8")) as {
    source: { logoPath: string };
    artifacts: Record<string, string>;
  };
  manifest.source.logoPath = sourceReference;
  for (const [key, value] of Object.entries(manifest.artifacts)) {
    manifest.artifacts[key] = basename(value);
  }
  await writeFile(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`);
}

main().catch((error: unknown) => {
  process.stderr.write(`${error instanceof Error ? error.message : String(error)}\n`);
  process.exitCode = 1;
});
await syncSource("albertaz-wordmark.svg", "albertaz-wordmark/source.svg");
await renderSourcePng("albertaz-wordmark.svg", "albertaz-wordmark/source.png", 1260);
