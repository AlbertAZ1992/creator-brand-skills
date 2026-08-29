import path from "node:path";
import process from "node:process";
import { resolveSpec, validate } from "./index.js";
import { readSourceCard, renderSticker } from "./render.js";
import type { ImageToStickerInput, SourceCard } from "./types.js";

function cardInput(card: SourceCard, inputPath: string): ImageToStickerInput {
  return {
    imagePath: inputPath,
    backgroundMode: card.backgroundMode,
    outlineWidth: card.outlineWidth,
    outlineColor: card.outlineColor,
    material: card.material,
    tilt: card.tilt,
    size: card.size,
  };
}

function validateSourceCard(card: SourceCard, inputPath: string): ImageToStickerInput {
  if (card.version !== 4) throw new Error("source-card.json must use version 4");
  if (path.basename(card.sourceImage) !== path.basename(inputPath)) {
    throw new Error(
      `source-card.json names ${card.sourceImage}, but the supplied image is ${inputPath}`,
    );
  }
  const input = cardInput(card, inputPath);
  const result = validate(input as unknown as Record<string, unknown>);
  if (!result.valid || result.parsed === undefined) {
    const details = result.errors.map((error) => `${error.field}: ${error.message}`).join("; ");
    throw new Error(`Invalid source-card.json: ${details}`);
  }
  return result.parsed;
}

async function main(): Promise<void> {
  const [inputPath, sourceCardPath, outputDirectory] = process.argv.slice(2);
  if (!inputPath || !sourceCardPath || !outputDirectory) {
    throw new Error(
      "Usage: render-sticker.sh <source-image> <source-card.json> <output-directory>",
    );
  }
  const card = await readSourceCard(sourceCardPath);
  const input = validateSourceCard(card, inputPath);
  const manifest = await renderSticker(
    path.resolve(inputPath),
    path.resolve(sourceCardPath),
    path.resolve(outputDirectory),
    resolveSpec(input),
  );
  process.stdout.write(
    `Verified one source-pixel sticker: ${JSON.stringify(manifest.verification)}\n`,
  );
}

main().catch((error: unknown) => {
  const message = error instanceof Error ? error.message : String(error);
  process.stderr.write(`Error: ${message}\n`);
  process.exitCode = 1;
});
