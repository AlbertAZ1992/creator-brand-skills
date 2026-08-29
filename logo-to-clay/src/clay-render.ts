import type { ClayOptions } from "./types.js";

const CLAY_STYLE_TOKENS = [
  "refined studio clay sculpture",
  "finely kneaded clay",
  "smooth continuous matte surface",
  "restrained natural micro-variation",
  "gently eased edges without inflating the logo strokes",
  "clean, faithful logo silhouette",
  "premium tactile material",
] as const;

const QUALITY_CONSTRAINTS = [
  "no cartoon exaggeration or chunky proportions",
  "no fingerprints, tool marks, dents, or hand-pressed ridges",
  "no faceted low-poly edges or lumpy lettering",
  "no glossy plastic, metallic highlights, or rubber appearance",
] as const;

const SHAPE_GUIDANCE: Record<string, string> = {
  relief:
    "flat relief style, logo slightly raised from a backing surface, view from slight angle above",
  object:
    "standalone clay object, logo extruded with a slim, softly beveled, restrained 3D profile",
};

const BACKGROUND_GUIDANCE: Record<string, string> = {
  transparent: "transparent background, alpha channel, isolated object",
  studio: "soft studio background, warm neutral tone, product photography style",
};

/**
 * Build a clean, concise clay-render prompt from options.
 *
 * The prompt focuses on a refined clay aesthetic without pixel-faithful
 * geometry locking or over-engineered guidance.
 */
export function buildPrompt(options: ClayOptions): string {
  const shape = options.shape ?? "object";
  const background = options.background ?? "studio";
  const depth = options.depth ?? 4;
  const color = options.clayColor ?? "auto-detected from logo";

  const parts: string[] = [];

  parts.push("Create a refined clay-style 3D render of this logo.");

  parts.push("");
  parts.push("STYLE:");
  for (const token of CLAY_STYLE_TOKENS) {
    parts.push(`- ${token}`);
  }

  parts.push("");
  parts.push(`SHAPE: ${SHAPE_GUIDANCE[shape] ?? SHAPE_GUIDANCE["object"]}`);

  parts.push("");

  if (color !== "auto-detected from logo") {
    parts.push(
      `MATERIAL: ${color} clay, high roughness, zero metalness, ${depth}mm extrusion depth`,
    );
  } else {
    parts.push(
      `MATERIAL: match the logo's primary color, high roughness, zero metalness, ${depth}mm extrusion depth`,
    );
  }

  parts.push("");
  parts.push(`BACKGROUND: ${BACKGROUND_GUIDANCE[background] ?? BACKGROUND_GUIDANCE["studio"]}`);

  parts.push("");
  parts.push("QUALITY CONSTRAINTS:");
  for (const constraint of QUALITY_CONSTRAINTS) {
    parts.push(`- ${constraint}`);
  }

  return parts.join("\n");
}
