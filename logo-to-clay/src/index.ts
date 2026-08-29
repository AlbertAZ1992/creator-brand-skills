import type { ClayOptions, ClayResult, ValidationError } from "./types.js";
import { buildClayAsset } from "./clay-asset.js";
import { buildPrompt } from "./clay-render.js";
import { verifyClayDeliverables } from "./verify.js";

// ---------------------------------------------------------------------------
// Validation
// ---------------------------------------------------------------------------

const VALID_OUTPUTS = new Set<string>(["image", "mesh", "both"]);
const VALID_SHAPES = new Set<string>(["object", "relief"]);
const VALID_BACKGROUNDS = new Set<string>(["transparent", "studio"]);

/**
 * Validate raw user input and return normalized options with any errors.
 */
export function validate(raw: unknown): {
  options: ClayOptions;
  errors: ValidationError[];
} {
  const errors: ValidationError[] = [];

  if (!raw || typeof raw !== "object") {
    return {
      options: {} as ClayOptions,
      errors: [{ field: "root", message: "Input must be an object" }],
    };
  }

  const obj = raw as Record<string, unknown>;

  // logoPath (required)
  const logoPath = obj["logoPath"];
  if (typeof logoPath !== "string" || logoPath.trim().length === 0) {
    errors.push({ field: "logoPath", message: "logoPath is required (non-empty string)" });
  }

  const outputDir = obj["outputDir"];
  if (outputDir !== undefined && (typeof outputDir !== "string" || outputDir.trim().length === 0)) {
    errors.push({ field: "outputDir", message: "outputDir must be a non-empty string" });
  }

  // output (optional enum)
  const output = obj["output"];
  if (output !== undefined && !VALID_OUTPUTS.has(output as string)) {
    errors.push({ field: "output", message: "output must be one of: image, mesh, both" });
  }

  // shape (optional enum)
  const shape = obj["shape"];
  if (shape !== undefined && !VALID_SHAPES.has(shape as string)) {
    errors.push({ field: "shape", message: "shape must be one of: object, relief" });
  }

  // depth (optional, positive number)
  const depth = obj["depth"];
  if (depth !== undefined && (typeof depth !== "number" || depth < 0)) {
    errors.push({ field: "depth", message: "depth must be a non-negative number (mm)" });
  }

  // clayColor (optional string)
  const clayColor = obj["clayColor"];
  if (
    clayColor !== undefined &&
    (typeof clayColor !== "string" || !/^#[0-9a-f]{6}$/i.test(clayColor))
  ) {
    errors.push({ field: "clayColor", message: "clayColor must be a six-digit hex color" });
  }

  if (obj["texture"] !== undefined) {
    errors.push({
      field: "texture",
      message: "texture is no longer supported; all outputs use one refined clay material",
    });
  }

  // background (optional enum)
  const background = obj["background"];
  if (background !== undefined && !VALID_BACKGROUNDS.has(background as string)) {
    errors.push({
      field: "background",
      message: "background must be one of: transparent, studio",
    });
  }

  const options: ClayOptions = {
    logoPath: logoPath as string,
    ...(typeof outputDir === "string" ? { outputDir } : {}),
    output: (output as ClayOptions["output"]) ?? "both",
    shape: (shape as ClayOptions["shape"]) ?? "object",
    depth: (depth as number | undefined) ?? 4,
    ...(typeof clayColor === "string" ? { clayColor } : {}),
    background: (background as ClayOptions["background"]) ?? "studio",
  };

  return { options, errors };
}

// ---------------------------------------------------------------------------
// Prompt
// ---------------------------------------------------------------------------

export { buildPrompt } from "./clay-render.js";

// ---------------------------------------------------------------------------
// Mesh building
// ---------------------------------------------------------------------------

/**
 * Build a 3D clay mesh asset from a logo.
 *
 * Extracts the logo contour, creates an extruded mesh with PBR clay
 * material, exports OBJ/MTL, and renders a preview PNG.
 */
export async function buildMesh(options: ClayOptions): Promise<ClayResult> {
  const asset = await buildClayAsset(options);
  const result: ClayResult = {
    meshPath: asset.meshPath,
    materialPath: asset.materialPath,
    bumpPath: asset.bumpPath,
    manifestPath: asset.manifestPath,
    format: options.output ?? "both",
    shape: options.shape ?? "object",
  };
  if (asset.previewPath) {
    result.imagePath = asset.previewPath;
  }
  result.validation = await verifyClayDeliverables(result);
  return result;
}

// ---------------------------------------------------------------------------
// Run
// ---------------------------------------------------------------------------

/**
 * Run the full pipeline: build prompt for image generation mode, and/or
 * build 3D mesh depending on the output format.
 */
export async function run(options: ClayOptions): Promise<ClayResult> {
  const format = options.output ?? "both";

  if (format === "image") {
    return {
      format: "image",
      shape: options.shape ?? "object",
      prompt: buildPrompt(options),
    };
  }

  const result = await buildMesh(options);
  return { ...result, prompt: buildPrompt(options) };
}

export { verifyClayDeliverables } from "./verify.js";
export type { ClayOptions, ClayResult, ClayValidationReport, ValidationError } from "./types.js";
