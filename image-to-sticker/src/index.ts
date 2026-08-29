import { BACKGROUND_MODES, OUTPUT_SIZES, STICKER_MATERIALS } from "./types.js";
import type {
  BackgroundMode,
  ImageToStickerInput,
  OutputSize,
  ResolvedStickerSpec,
  SourceCard,
  StickerMaterial,
  StickerPromptOutput,
  ValidationError,
  ValidationResult,
} from "./types.js";

const ALLOWED_FIELDS = new Set([
  "imagePath",
  "backgroundMode",
  "outlineWidth",
  "outlineColor",
  "material",
  "tilt",
  "size",
]);

function readString(
  raw: Record<string, unknown>,
  field: string,
  errors: ValidationError[],
): string | undefined {
  const value = raw[field];
  if (typeof value !== "string" || value.trim().length === 0) {
    errors.push({ field, message: "Must be a non-empty string" });
    return undefined;
  }
  return value.trim();
}

function readNumber(
  raw: Record<string, unknown>,
  field: string,
  minimum: number,
  maximum: number,
  errors: ValidationError[],
): number | undefined {
  const value = raw[field];
  if (value === undefined) return undefined;
  if (typeof value !== "number" || !Number.isFinite(value) || value < minimum || value > maximum) {
    errors.push({ field, message: `Must be a number from ${minimum} to ${maximum}` });
    return undefined;
  }
  return value;
}

function readBackgroundMode(
  raw: Record<string, unknown>,
  errors: ValidationError[],
): BackgroundMode | undefined {
  const value = raw["backgroundMode"];
  if (value === undefined) return undefined;
  if (!BACKGROUND_MODES.includes(value as BackgroundMode)) {
    errors.push({ field: "backgroundMode", message: "Must be one of: auto, alpha, flat" });
    return undefined;
  }
  return value as BackgroundMode;
}

function readMaterial(
  raw: Record<string, unknown>,
  errors: ValidationError[],
): StickerMaterial | undefined {
  const value = raw["material"];
  if (value === undefined) return undefined;
  if (!STICKER_MATERIALS.includes(value as StickerMaterial)) {
    errors.push({
      field: "material",
      message: "Must be one of: original, holographic, glitter, reflective",
    });
    return undefined;
  }
  return value as StickerMaterial;
}

function readSize(raw: Record<string, unknown>, errors: ValidationError[]): OutputSize | undefined {
  const value = raw["size"];
  if (value === undefined) return undefined;
  if (!OUTPUT_SIZES.includes(value as OutputSize)) {
    errors.push({ field: "size", message: "Must be one of: 512, 1024" });
    return undefined;
  }
  return value as OutputSize;
}

function parsedInput(
  imagePath: string,
  values: {
    backgroundMode: BackgroundMode | undefined;
    outlineWidth: number | undefined;
    outlineColor: string | undefined;
    material: StickerMaterial | undefined;
    tilt: number | undefined;
    size: OutputSize | undefined;
  },
): ImageToStickerInput {
  const parsed: ImageToStickerInput = { imagePath };
  for (const key of Object.keys(values) as Array<keyof typeof values>) {
    const value = values[key];
    if (value !== undefined) Object.assign(parsed, { [key]: value });
  }
  return parsed;
}

export function validate(raw: Record<string, unknown>): ValidationResult {
  const errors: ValidationError[] = [];
  const imagePath = readString(raw, "imagePath", errors);
  for (const field of Object.keys(raw)) {
    if (!ALLOWED_FIELDS.has(field)) errors.push({ field, message: "Unknown field" });
  }
  const backgroundMode = readBackgroundMode(raw, errors);
  const outlineWidth = readNumber(raw, "outlineWidth", 0, 44, errors);
  const outlineColor =
    raw["outlineColor"] === undefined ? undefined : readString(raw, "outlineColor", errors);
  const material = readMaterial(raw, errors);
  const tilt = readNumber(raw, "tilt", -12, 12, errors);
  const size = readSize(raw, errors);
  if (outlineColor !== undefined && !/^#[0-9a-f]{6}$/iu.test(outlineColor)) {
    errors.push({ field: "outlineColor", message: "Must be a six-digit hex color" });
  }
  if (errors.length > 0 || imagePath === undefined) return { valid: false, errors };
  return {
    valid: true,
    errors: [],
    parsed: parsedInput(imagePath, {
      backgroundMode,
      outlineWidth,
      outlineColor,
      material,
      tilt,
      size,
    }),
  };
}

export function resolveSpec(input: ImageToStickerInput): ResolvedStickerSpec {
  return {
    imagePath: input.imagePath,
    backgroundMode: input.backgroundMode ?? "auto",
    outlineWidth: input.outlineWidth ?? 18,
    outlineColor: input.outlineColor ?? "#ffffff",
    material: input.material ?? "original",
    tilt: input.tilt ?? -3,
    size: input.size ?? 1024,
  };
}

export function buildSourceCard(input: ImageToStickerInput): SourceCard {
  const spec = resolveSpec(input);
  return {
    version: 4,
    sourceImage: spec.imagePath,
    backgroundMode: spec.backgroundMode,
    outlineWidth: spec.outlineWidth,
    outlineColor: spec.outlineColor,
    material: spec.material,
    tilt: spec.tilt,
    size: spec.size,
  };
}

export function buildPrompt(input: ImageToStickerInput): StickerPromptOutput {
  const spec = resolveSpec(input);
  const radius = Math.min(112, Math.max(0, spec.outlineWidth * 2.35));
  const prompt = [
    `Keep the complete supplied image at ${JSON.stringify(spec.imagePath)} as one sticker.`,
    "Copy source RGB pixels and preserve its existing text, colors, spacing, and proportions.",
    "Use existing alpha, or remove one uniform flat background color from every matching pixel.",
    "Do not select a subject, redraw, regenerate, retype, inpaint, or invent content.",
    `Apply a ${radius.toFixed(1)}px Euclidean alpha expansion behind the source.`,
    `Apply the deterministic ${spec.material} front material without changing alpha geometry.`,
    `Use outline color ${spec.outlineColor} and tilt the whole sticker ${spec.tilt}°`,
    `Center it on one transparent ${spec.size} by ${spec.size} canvas.`,
  ].join("\n");
  return { prompt, spec, sourceCard: buildSourceCard(input) };
}

export type {
  BackgroundMode,
  ImageToStickerInput,
  OutputSize,
  ResolvedStickerSpec,
  SourceCard,
  StickerMaterial,
  StickerPromptOutput,
  ValidationError,
  ValidationResult,
} from "./types.js";
