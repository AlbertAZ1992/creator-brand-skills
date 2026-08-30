import { createHash } from "node:crypto";
import { copyFile, mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import sharp, { type Sharp } from "sharp";
import { createExteriorAlphaMask } from "./alpha.js";
import { applyMaterial } from "./material.js";
import { composeOutline, removeFlatBackground, resolveOutlineRadius } from "./raster.js";
import type { BackgroundMode, ResolvedStickerSpec, SourceCard } from "./types.js";

interface PixelImage {
  data: Uint8ClampedArray;
  width: number;
  height: number;
}

interface Bounds {
  left: number;
  top: number;
  width: number;
  height: number;
}

type ResolvedBackgroundMode = Exclude<BackgroundMode, "auto">;
type AlphaArray = Uint8Array | Uint8ClampedArray;
const MINIMUM_VISIBLE_COVERAGE = 0.01;

export interface RenderManifest {
  version: 4;
  sourceCard: "source-card.json";
  asset: Record<string, unknown>;
  pipeline: Record<string, unknown>;
  verification: Record<string, unknown>;
}

export function resolveSvgDensity(width: number, height: number, targetSize: number): number {
  const longestSide = Math.max(width, height, 1);
  return Math.max(72, Math.min(10000, Math.ceil((72 * targetSize) / longestSide)));
}

async function openImage(inputPath: string, targetSize: number): Promise<Sharp> {
  if (!inputPath.toLowerCase().endsWith(".svg")) return sharp(inputPath);
  const metadata = await sharp(inputPath).metadata();
  const density = resolveSvgDensity(
    metadata.width ?? targetSize,
    metadata.height ?? targetSize,
    targetSize,
  );
  return sharp(inputPath, { density });
}

async function loadImage(inputPath: string, targetSize: number): Promise<PixelImage> {
  const input = await openImage(inputPath, targetSize);
  const result = await input.rotate().ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  if (result.info.channels !== 4) throw new Error("Source image could not be decoded as RGBA");
  return {
    data: new Uint8ClampedArray(result.data),
    width: result.info.width,
    height: result.info.height,
  };
}

function sourceAlpha(image: PixelImage): Uint8ClampedArray {
  const alpha = new Uint8ClampedArray(image.width * image.height);
  for (let index = 0; index < alpha.length; index += 1) {
    alpha[index] = image.data[index * 4 + 3] ?? 0;
  }
  return alpha;
}

function hasTransparency(alpha: AlphaArray): boolean {
  return alpha.some((value) => value < 250);
}

function cornersAreUniform(image: PixelImage, tolerance = 24): boolean {
  const last = image.width * image.height - 1;
  const indices = [0, image.width - 1, last - image.width + 1, last];
  for (let channel = 0; channel < 3; channel += 1) {
    const values = indices.map((index) => image.data[index * 4 + channel] ?? 0);
    if (Math.max(...values) - Math.min(...values) > tolerance) return false;
  }
  return true;
}

function resolveBackgroundMode(
  requested: BackgroundMode,
  image: PixelImage,
  transparent: boolean,
): ResolvedBackgroundMode {
  if (requested !== "auto") return requested;
  if (transparent) return "alpha";
  if (cornersAreUniform(image)) return "flat";
  throw new Error(
    "Complex photographic backgrounds are outside this Skill; provide transparent or flat artwork",
  );
}

function prepareImage(
  image: PixelImage,
  mode: ResolvedBackgroundMode,
): { image: PixelImage; alpha: Uint8ClampedArray } {
  if (mode === "alpha") return { image, alpha: sourceAlpha(image) };
  const result = removeFlatBackground(image.data, image.width, image.height, 18);
  return { image: { ...image, data: result.rgba }, alpha: result.alpha };
}

function findBounds(alpha: AlphaArray, width: number, height: number): Bounds {
  let left = width;
  let top = height;
  let right = -1;
  let bottom = -1;
  for (let index = 0; index < alpha.length; index += 1) {
    if ((alpha[index] ?? 0) < 26) continue;
    const x = index % width;
    const y = Math.floor(index / width);
    left = Math.min(left, x);
    top = Math.min(top, y);
    right = Math.max(right, x);
    bottom = Math.max(bottom, y);
  }
  if (right < left || bottom < top) throw new Error("Foreground mask is empty");
  return { left, top, width: right - left + 1, height: bottom - top + 1 };
}

function maskedRgba(image: PixelImage, alpha: AlphaArray): Uint8ClampedArray {
  const output = new Uint8ClampedArray(image.data);
  for (let index = 0; index < alpha.length; index += 1) {
    output[index * 4 + 3] = alpha[index] ?? 0;
  }
  return output;
}

function fittedSize(bounds: Bounds, available: number): { width: number; height: number } {
  const scale = Math.min(available / bounds.width, available / bounds.height);
  return {
    width: Math.max(1, Math.round(bounds.width * scale)),
    height: Math.max(1, Math.round(bounds.height * scale)),
  };
}

async function resizeForeground(
  image: PixelImage,
  alpha: AlphaArray,
  bounds: Bounds,
  available: number,
): Promise<PixelImage> {
  const fitted = fittedSize(bounds, available);
  const result = await sharp(Buffer.from(maskedRgba(image, alpha)), {
    raw: { width: image.width, height: image.height, channels: 4 },
  })
    .extract(bounds)
    .resize(fitted.width, fitted.height, { fit: "fill", kernel: sharp.kernel.lanczos3 })
    .raw()
    .toBuffer({ resolveWithObject: true });
  return {
    data: new Uint8ClampedArray(result.data),
    width: result.info.width,
    height: result.info.height,
  };
}

function placeForeground(source: PixelImage, size: number): PixelImage {
  const output = new Uint8ClampedArray(size * size * 4);
  const left = Math.floor((size - source.width) / 2);
  const top = Math.floor((size - source.height) / 2);
  for (let y = 0; y < source.height; y += 1) {
    const sourceOffset = y * source.width * 4;
    const outputOffset = ((top + y) * size + left) * 4;
    output.set(source.data.subarray(sourceOffset, sourceOffset + source.width * 4), outputOffset);
  }
  return { data: output, width: size, height: size };
}

async function rotateSticker(image: PixelImage, tilt: number): Promise<PixelImage> {
  if (tilt === 0) return image;
  const result = await sharp(Buffer.from(image.data), {
    raw: { width: image.width, height: image.height, channels: 4 },
  })
    .rotate(tilt, { background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .resize(image.width, image.height, {
      fit: "contain",
      background: { r: 0, g: 0, b: 0, alpha: 0 },
    })
    .raw()
    .toBuffer({ resolveWithObject: true });
  return {
    data: new Uint8ClampedArray(result.data),
    width: result.info.width,
    height: result.info.height,
  };
}

function topologyMetrics(alpha: Uint8ClampedArray, width: number, height: number) {
  const exterior = createExteriorAlphaMask(alpha, width, height);
  let interiorTransparentPixels = 0;
  for (let index = 0; index < alpha.length; index += 1) {
    if ((alpha[index] ?? 0) < 26 && exterior[index] !== 1) {
      interiorTransparentPixels += 1;
    }
  }
  return { interiorTransparentPixels };
}

function calculateMetrics(image: PixelImage): Record<string, number> {
  let minimum = 255;
  let maximum = 0;
  let visible = 0;
  let soft = 0;
  const alpha = sourceAlpha(image);
  for (const value of alpha) {
    minimum = Math.min(minimum, value);
    maximum = Math.max(maximum, value);
    visible += value / 255;
    if (value > 0 && value < 255) soft += 1;
  }
  const pixels = image.width * image.height;
  const corners = [alpha[0] ?? 0, alpha[image.width - 1] ?? 0];
  corners.push(alpha[pixels - image.width] ?? 0, alpha[pixels - 1] ?? 0);
  return {
    alphaMinimum: minimum,
    alphaMaximum: maximum,
    cornerAlpha: Math.max(...corners),
    visibleCoverage: visible / pixels,
    softAlphaCoverage: soft / pixels,
    ...topologyMetrics(alpha, image.width, image.height),
  };
}

function rgbHash(image: PixelImage): string {
  const rgb = new Uint8Array(image.width * image.height * 3);
  for (let index = 0; index < image.width * image.height; index += 1) {
    rgb.set(image.data.subarray(index * 4, index * 4 + 3), index * 3);
  }
  return createHash("sha256").update(rgb).digest("hex");
}

async function saveImages(image: PixelImage, outputDirectory: string): Promise<void> {
  const raw = { width: image.width, height: image.height, channels: 4 as const };
  const stickerPath = path.join(outputDirectory, "sticker.png");
  await sharp(Buffer.from(image.data), { raw }).png({ compressionLevel: 9 }).toFile(stickerPath);
  await sharp(Buffer.from(image.data), { raw })
    .extractChannel(3)
    .png({ compressionLevel: 9 })
    .toFile(path.join(outputDirectory, "sticker-alpha-proof.png"));
}

function buildManifest(
  spec: ResolvedStickerSpec,
  source: PixelImage,
  output: PixelImage,
  backgroundMode: ResolvedBackgroundMode,
): RenderManifest {
  const metrics = calculateMetrics(output);
  const coverage = metrics["visibleCoverage"] ?? 0;
  const passed =
    metrics["alphaMinimum"] === 0 &&
    metrics["alphaMaximum"] === 255 &&
    metrics["cornerAlpha"] === 0 &&
    coverage > MINIMUM_VISIBLE_COVERAGE &&
    coverage < 0.95;
  return {
    version: 4,
    sourceCard: "source-card.json",
    asset: { file: "sticker.png", width: output.width, height: output.height, rgba: true },
    pipeline: {
      backgroundMask: backgroundMode,
      outlineWidth: spec.outlineWidth,
      outlineRadius: resolveOutlineRadius(spec.outlineWidth),
      outlineColor: spec.outlineColor,
      material: spec.material,
      tilt: spec.tilt,
      rgbOperation: "source-over-outline-then-material",
      sourceRgbSha256: rgbHash(source),
    },
    verification: { alphaProof: "sticker-alpha-proof.png", ...metrics, passed },
  };
}

export async function renderSticker(
  inputPath: string,
  sourceCardPath: string,
  outputDirectory: string,
  spec: ResolvedStickerSpec,
): Promise<RenderManifest> {
  const source = await loadImage(inputPath, spec.size * 2);
  const originalAlpha = sourceAlpha(source);
  const backgroundMode = resolveBackgroundMode(
    spec.backgroundMode,
    source,
    hasTransparency(originalAlpha),
  );
  const prepared = prepareImage(source, backgroundMode);
  const alpha = prepared.alpha;
  const bounds = findBounds(alpha, source.width, source.height);
  const outlineRadius = resolveOutlineRadius(spec.outlineWidth);
  const available = spec.size - 88 - outlineRadius * 2;
  if (available < 64) throw new Error("Outline leaves too little room for source artwork");
  const resized = await resizeForeground(prepared.image, alpha, bounds, available);
  const placed = placeForeground(resized, spec.size);
  const composed = composeOutline({
    rgba: placed.data,
    alpha: sourceAlpha(placed),
    width: placed.width,
    height: placed.height,
    radius: outlineRadius,
    color: spec.outlineColor,
  });
  const material = applyMaterial({
    rgba: composed,
    width: placed.width,
    height: placed.height,
    material: spec.material,
  });
  const output = await rotateSticker({ ...placed, data: material }, spec.tilt);
  const manifest = buildManifest(spec, source, output, backgroundMode);
  if (manifest.verification["passed"] !== true) {
    throw new Error("Rendered sticker failed alpha or coverage verification");
  }
  await mkdir(outputDirectory, { recursive: true });
  await saveImages(output, outputDirectory);
  await copyFile(sourceCardPath, path.join(outputDirectory, "source-card.json"));
  await writeFile(
    path.join(outputDirectory, "sticker-manifest.json"),
    `${JSON.stringify(manifest, null, 2)}\n`,
  );
  return manifest;
}

export async function readSourceCard(sourceCardPath: string): Promise<SourceCard> {
  return JSON.parse(await readFile(sourceCardPath, "utf8")) as SourceCard;
}
