import { createHash } from "node:crypto";
import { readFile, stat } from "node:fs/promises";
import { basename, dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import sharp from "sharp";

const packageRoot = dirname(fileURLToPath(new URL("../package.json", import.meta.url)));
const generatedRoot = join(packageRoot, "examples", "generated");

interface Manifest {
  source: { logoPath: string };
  artifacts: Record<string, string>;
  validation: {
    passed: boolean;
    geometry: { vertices: number; faces: number };
  };
}

interface SourceRecord {
  files: Array<{ file: string; sha256: string }>;
}

async function main(): Promise<void> {
  const albertazRoot = join(generatedRoot, "albertaz-wordmark");
  await verifyImage(join(albertazRoot, "source-to-clay.png"), 1600, 640);
  await verifyImage(join(albertazRoot, "clay-render.png"), 1600, 800);
  await verifyImage(join(albertazRoot, "source.png"), 1200, 200);
  await verifyMeshExample({
    label: "ALBERTAZ wordmark clay object",
    directory: join(albertazRoot, "object"),
    prefix: "albertaz-wordmark-clay",
    source: "../source.svg",
  });
  await verifyImage(join(generatedRoot, "source-to-clay.png"), 1600, 1000);
  const javascriptRoot = join(generatedRoot, "javascript");
  await verifyImage(join(javascriptRoot, "clay-render.png"), 1024, 1024);
  await verifyImage(join(javascriptRoot, "source.png"), 256, 128);
  for (const shape of ["object", "relief"]) {
    await verifyMeshExample({
      label: `JavaScript clay ${shape}`,
      directory: join(javascriptRoot, shape),
      prefix: "js-community-logo-clay",
      source: "../source.png",
    });
  }
  const viteRoot = join(generatedRoot, "vite-bolt");
  await verifySourceRecord(viteRoot);
  await verifyImage(join(viteRoot, "clay-render.png"), 1200, 800);
  await verifyImage(join(viteRoot, "source.png"), 1024, 1024);
  await verifyMeshExample({
    label: "Vite bolt clay object",
    directory: join(viteRoot, "object"),
    prefix: "vite-bolt-clay",
    source: "../source.png",
  });
  console.log("Verified ALBERTAZ, JavaScript, and Vite bolt clay examples.");
}

async function verifySourceRecord(directory: string): Promise<void> {
  const record = JSON.parse(
    await readFile(join(directory, "asset-source.json"), "utf8"),
  ) as SourceRecord;
  for (const source of record.files) {
    const data = await readFile(join(directory, source.file));
    const hash = createHash("sha256").update(data).digest("hex");
    if (hash !== source.sha256) throw new Error(`${source.file}: source hash differs`);
  }
}

interface MeshExample {
  label: string;
  directory: string;
  prefix: string;
  source: string;
}

async function verifyMeshExample(example: MeshExample): Promise<void> {
  const { label, directory, prefix, source } = example;
  const manifestPath = join(directory, `${prefix}-manifest.json`);
  const manifest = JSON.parse(await readFile(manifestPath, "utf8")) as Manifest;
  if (!manifest.validation.passed || manifest.source.logoPath !== source) {
    throw new Error(`${label}: invalid manifest source or pass state`);
  }
  const paths = Object.fromEntries(
    Object.entries(manifest.artifacts).map(([key, value]) => [key, join(directory, value)]),
  );
  for (const [key, value] of Object.entries(manifest.artifacts)) {
    if (basename(value) !== value || (await stat(paths[key]!)).size === 0) {
      throw new Error(`${label}: invalid ${key}`);
    }
  }
  const obj = await readFile(paths["meshPath"]!, "utf8");
  const material = await readFile(paths["materialPath"]!, "utf8");
  const vertices = countLines(obj, "v ");
  const faces = countLines(obj, "f ");
  if (
    vertices !== manifest.validation.geometry.vertices ||
    faces !== manifest.validation.geometry.faces
  ) {
    throw new Error(`${label}: geometry counts differ from manifest`);
  }
  if (!obj.includes(`mtllib ${basename(paths["materialPath"]!)}`)) {
    throw new Error(`${label}: OBJ does not reference its MTL`);
  }
  if (!material.includes(basename(paths["bumpPath"]!))) {
    throw new Error(`${label}: MTL does not reference its bump map`);
  }
  await verifyImage(paths["previewPath"]!, 1024, 1024);
  await verifyImage(paths["bumpPath"]!, 512, 512);
  console.log(`PASS ${label}: ${vertices} vertices, ${faces} faces`);
}

async function verifyImage(
  path: string,
  minimumWidth: number,
  minimumHeight: number,
): Promise<void> {
  const metadata = await sharp(path).metadata();
  if ((metadata.width ?? 0) < minimumWidth || (metadata.height ?? 0) < minimumHeight) {
    throw new Error(`${path}: image dimensions are too small`);
  }
}

function countLines(value: string, prefix: string): number {
  return value.split("\n").filter((line) => line.startsWith(prefix)).length;
}

main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
