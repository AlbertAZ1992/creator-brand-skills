import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import sharp from "sharp";

const packageRoot = dirname(fileURLToPath(new URL("../package.json", import.meta.url)));
const generatedRoot = join(packageRoot, "examples", "generated");

interface SourceRecord {
  name: string;
  slug?: string;
  file: string;
  sha256: string;
}

interface Manifest {
  asset: { width: number; height: number; rgba: boolean };
  verification: { cornerAlpha: number; passed: boolean };
}

async function main(): Promise<void> {
  await verifyCollection("open-source-tech", "source-to-sticker styles", 1600, 960);
}

async function verifyCollection(
  directory: string,
  label: string,
  minimumBoardWidth: number,
  minimumBoardHeight: number,
): Promise<void> {
  const exampleRoot = join(generatedRoot, directory);
  const sources = JSON.parse(await readFile(join(exampleRoot, "asset-sources.json"), "utf8")) as {
    assets: SourceRecord[];
  };
  for (const source of sources.assets) {
    await verifySource(exampleRoot, source);
    await verifySticker(exampleRoot, source.slug ?? source.name.toLowerCase());
  }
  const board = await sharp(join(exampleRoot, "source-to-sticker.png")).metadata();
  if ((board.width ?? 0) < minimumBoardWidth || (board.height ?? 0) < minimumBoardHeight) {
    throw new Error(`${label} sticker board is too small`);
  }
  console.log(`Verified ${label} sticker examples.`);
}

async function verifySource(exampleRoot: string, source: SourceRecord): Promise<void> {
  const data = await readFile(join(exampleRoot, source.file));
  const hash = createHash("sha256").update(data).digest("hex");
  if (hash !== source.sha256) throw new Error(`${source.name}: source hash differs`);
}

async function verifySticker(exampleRoot: string, slug: string): Promise<void> {
  const directory = join(exampleRoot, slug);
  const manifest = JSON.parse(
    await readFile(join(directory, "sticker-manifest.json"), "utf8"),
  ) as Manifest;
  const image = sharp(join(directory, "sticker.png"));
  const metadata = await image.metadata();
  if (
    metadata.width !== 1024 ||
    metadata.height !== 1024 ||
    metadata.channels !== 4 ||
    !manifest.asset.rgba ||
    !manifest.verification.passed ||
    manifest.verification.cornerAlpha !== 0
  ) {
    throw new Error(`${slug}: invalid RGBA sticker delivery`);
  }
  const proof = await sharp(join(directory, "sticker-alpha-proof.png")).metadata();
  if (proof.width !== 1024 || proof.height !== 1024 || proof.space !== "b-w") {
    throw new Error(`${slug}: invalid alpha proof`);
  }
  console.log(`PASS ${slug}: 1024 px RGBA + alpha proof`);
}

main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
