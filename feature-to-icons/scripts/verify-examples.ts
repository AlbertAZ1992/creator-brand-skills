import { readdir, readFile, stat } from "node:fs/promises";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

import { validate, validateSvgArtifact } from "../src/index.js";
import type { IconDesignSystem, IconSource } from "../src/types.js";

const PACKAGE_ROOT = fileURLToPath(new URL("..", import.meta.url));
const EXAMPLES_ROOT = join(PACKAGE_ROOT, "examples");
const EXPECTED = [
  { slug: "product-essentials-outline", count: 4 },
  { slug: "analytics-light-outline", count: 5 },
  { slug: "collaboration-filled", count: 5 },
  { slug: "commerce-duotone", count: 5 },
  { slug: "security-bold-outline", count: 5 },
  { slug: "creator-brand-duotone", count: 5 },
  { slug: "ai-workspace-outline-48", count: 4 },
] as const;

interface ExampleFile {
  title: string;
  request: string;
  input: unknown;
}

interface ManifestFile {
  featureCount: number;
  designSystem: IconDesignSystem;
  source: { strategy: string; library?: string; version?: string; license: string };
  files: {
    icons: string[];
    previewPng: string;
    previewSvg: string;
    spec: string;
    metadata: string;
  };
  validation: {
    passed: boolean;
    checks: string[];
    opticalMetrics: unknown[];
    warnings: string[];
  };
}

interface MetadataFile {
  icons: Array<{ feature: string; source?: IconSource }>;
}

async function main(): Promise<void> {
  await verifyExactDirectorySet();
  let iconTotal = 0;
  for (const expected of EXPECTED) {
    await verifyExample(expected.slug, expected.count);
    iconTotal += expected.count;
    console.log(`PASS ${expected.slug}: ${expected.count} icons`);
  }
  console.log(`Verified ${EXPECTED.length} committed families and ${iconTotal} SVG icons.`);
}

async function verifyExactDirectorySet(): Promise<void> {
  const entries = await readdir(EXAMPLES_ROOT, { withFileTypes: true });
  const actual = entries
    .filter((entry) => entry.isDirectory())
    .map((entry) => entry.name)
    .sort();
  const expected = EXPECTED.map((entry) => entry.slug).sort();
  if (JSON.stringify(actual) !== JSON.stringify(expected)) {
    throw new Error(`Example directories differ: expected ${expected.join(", ")}`);
  }
}

async function verifyExample(slug: string, expectedCount: number): Promise<void> {
  const directory = join(EXAMPLES_ROOT, slug);
  const example = await readJson<ExampleFile>(join(directory, "example.json"));
  if (!example.title.trim() || !example.request.trim()) {
    throw new Error(`${slug}: example title and request are required`);
  }
  const validation = validate(example.input);
  if (!validation.data) {
    throw new Error(`${slug}: example input is invalid: ${JSON.stringify(validation.errors)}`);
  }

  const manifest = await readJson<ManifestFile>(join(directory, "icon-family-manifest.json"));
  verifyManifest(slug, manifest, expectedCount);
  await verifyListedFiles(directory, manifest);
  const metadata = await readJson<MetadataFile>(join(directory, manifest.files.metadata));
  for (const [index, iconFile] of manifest.files.icons.entries()) {
    const svg = await readFile(join(directory, iconFile), "utf8");
    const source = metadata.icons[index]?.source;
    const errors = validateSvgArtifact(svg, manifest.designSystem, source);
    if (errors.length > 0) {
      throw new Error(`${slug}/${iconFile}: ${errors.join("; ")}`);
    }
  }
  await verifyPng(directory, manifest.files.previewPng, expectedCount);
}

function verifyManifest(slug: string, manifest: ManifestFile, expectedCount: number): void {
  if (manifest.featureCount !== expectedCount || manifest.files.icons.length !== expectedCount) {
    throw new Error(`${slug}: manifest must list exactly ${expectedCount} icons`);
  }
  if (!manifest.validation.passed) {
    throw new Error(`${slug}: manifest validation must pass`);
  }
  if (
    manifest.source.strategy !== "library-first" ||
    manifest.source.library !== "Phosphor" ||
    manifest.source.version !== "2.1.1" ||
    manifest.source.license !== "MIT"
  ) {
    throw new Error(`${slug}: manifest must record pinned Phosphor provenance`);
  }
  if (manifest.validation.opticalMetrics.length !== expectedCount) {
    throw new Error(`${slug}: manifest must record one optical metric per icon`);
  }
  if (manifest.validation.warnings.length > 0) {
    throw new Error(`${slug}: committed examples must not contain optical warnings`);
  }
  const hasPixelCheck = manifest.validation.checks.some((check) =>
    check.includes("visible icon pixels"),
  );
  if (!hasPixelCheck) {
    throw new Error(`${slug}: manifest must record visible-pixel validation`);
  }
}

async function verifyListedFiles(directory: string, manifest: ManifestFile): Promise<void> {
  const files = [
    manifest.files.spec,
    manifest.files.metadata,
    manifest.files.previewSvg,
    manifest.files.previewPng,
    ...manifest.files.icons,
  ];
  for (const file of files) {
    if ((await stat(join(directory, file))).size === 0) {
      throw new Error(`${directory}/${file}: file is empty`);
    }
  }
}

async function verifyPng(directory: string, file: string, iconCount: number): Promise<void> {
  const png = await readFile(join(directory, file));
  if (png.subarray(0, 8).toString("hex") !== "89504e470d0a1a0a") {
    throw new Error(`${directory}/${file}: invalid PNG signature`);
  }
  const columns = Math.min(4, iconCount);
  const expectedWidth = columns * 128;
  const expectedHeight = Math.ceil(iconCount / columns) * 128;
  if (png.readUInt32BE(16) !== expectedWidth || png.readUInt32BE(20) !== expectedHeight) {
    throw new Error(`${directory}/${file}: preview dimensions are incorrect`);
  }
}

async function readJson<T>(file: string): Promise<T> {
  return JSON.parse(await readFile(file, "utf8")) as T;
}

main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
