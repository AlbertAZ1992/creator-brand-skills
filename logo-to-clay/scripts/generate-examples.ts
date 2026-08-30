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
}

const examples: MeshExample[] = [
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
  process.stdout.write("Regenerated the approved Vite bolt and JavaScript examples.\n");
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
  await makeManifestPortable(result.manifestPath);
  process.stdout.write(`PASS ${example.label}\n`);
  return result.imagePath;
}

async function makeManifestPortable(manifestPath: string): Promise<void> {
  const manifest = JSON.parse(await readFile(manifestPath, "utf8")) as {
    source: { logoPath: string };
    artifacts: Record<string, string>;
  };
  manifest.source.logoPath = "../source.png";
  for (const [key, value] of Object.entries(manifest.artifacts)) {
    manifest.artifacts[key] = basename(value);
  }
  await writeFile(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`);
}

main().catch((error: unknown) => {
  process.stderr.write(`${error instanceof Error ? error.message : String(error)}\n`);
  process.exitCode = 1;
});
