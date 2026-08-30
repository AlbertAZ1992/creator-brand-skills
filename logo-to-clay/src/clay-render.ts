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
  "no cartoon exaggeration, inflated strokes, or chunky pillow-like proportions",
  "no fingerprints, tool marks, dents, or hand-pressed ridges",
  "no faceted low-poly edges or lumpy lettering",
  "no glossy plastic, metallic highlights, or rubber appearance",
  "no extra symbols, text, faces, or invented geometry",
] as const;

const SOURCE_LOCK = [
  "use the attached logo as the only geometry reference",
  "preserve the exact outer contour, relative proportions, negative-space counters, and openings",
  "preserve every component's spacing, baseline, overlap, and reading order as one locked composition",
  "keep the front plane immediately recognisable; add depth behind it instead of redrawing it",
] as const;

const SHAPE_GUIDANCE: Record<string, string> = {
  relief:
    "flat relief style, logo slightly raised from a backing surface, view from slight angle above",
  object:
    "standalone clay object, logo extruded with a slim, softly beveled, restrained 3D profile",
};

const BACKGROUND_GUIDANCE: Record<string, string> = {
  transparent: "transparent background, alpha channel, isolated object",
  studio:
    "purposeful editorial studio scene, supporting colour chosen to complement the clay, premium product photography",
};

const STUDIO_COMPOSITION =
  "campaign hero composition, logo occupies 55-75% of the frame, three-quarter view with the " +
  "front plane still readable, camera yaw 20-30 degrees with 8-14 degrees of elevation, a " +
  "clearly visible sidewall measuring roughly 12-20% of the front-face width, one low plinth or " +
  "grounding surface, one clear directional soft light, decisive contact shadow, refined " +
  "asymmetry, and readable at thumbnail size";

const STUDIO_AVOIDS =
  "do not default to a centred object floating on empty beige; choose one purposeful supporting " +
  "background or plinth colour derived from the logo without adding decorative symbols";

/**
 * Build a clean, concise clay-render prompt from options.
 *
 * The prompt combines a refined clay aesthetic with source-geometry locking
 * and a deliberate hero composition.
 */
export function buildPrompt(options: ClayOptions): string {
  const shape = options.shape ?? "object";
  const background = options.background ?? "studio";
  const depth = options.depth ?? 4;
  const color = options.clayColor ?? "auto-detected from logo";

  const parts: string[] = [];

  parts.push("Create a refined clay-style 3D render of this logo.");

  parts.push("");
  parts.push("SOURCE LOCK:");
  for (const rule of SOURCE_LOCK) {
    parts.push(`- ${rule}`);
  }

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

  if (background === "studio") {
    parts.push("");
    parts.push(`COMPOSITION: ${STUDIO_COMPOSITION}`);
    parts.push(`ART-DIRECTION FAILURE: ${STUDIO_AVOIDS}`);
  }

  parts.push("");
  parts.push("QUALITY CONSTRAINTS:");
  for (const constraint of QUALITY_CONSTRAINTS) {
    parts.push(`- ${constraint}`);
  }

  return parts.join("\n");
}
