---
name: feature-to-icons
description: Create an original hand-drawn SVG icon set for 3–20 product features, with a shared doodle style, optional self-contained wiggle animation, static and playable previews, and deterministic safety and optical validation. Use this whenever users ask for feature icons, an icon family, doodle icons, animated SVG icons, landing-page benefit icons, or product illustrations. Use the native system route only when the user explicitly asks for conventional UI controls.
---

# Feature to Icons

Create one cohesive hand-drawn icon family from 3–20 feature names. Default to
original doodle geometry with subtle embedded SVG motion. Treat conventional
system/UI glyphs as an explicit opt-in route.

## Inputs

- `features`: 3–20 unique names.
- `purpose`: `brand` (default) or `system`.
- `motion`: `wiggle` (brand default) or `none`.
- `style`: `outline` (default), `filled`, or `duotone`.
- `colors`: optional primary and secondary hex colors.
- `gridSize`: 48 for brand by default; 24, 32, and 48 are supported.
- `visualWeight`: `light`, `regular` (default), or `bold`.
- `productContext`: optional context for metaphor selection.

Natural language is sufficient. Do not require users to name these fields.

## Default hand-drawn route

1. Resolve this Skill's directory from the loaded `SKILL.md`. Before importing
   the runtime, check for `dist/index.js`. If missing, run `npm ci` and
   `npm run build` in that directory. This is first-use runtime preparation;
   do not ask the user to clone the repository or run an installer script.
2. Validate the request. An unqualified feature list is `purpose=brand`, uses a
   48 px grid, round 2.6 px ink strokes, charcoal plus one accent color, and
   `motion=wiggle`.
3. Read the product context and turn each feature into one recognizable visual
   metaphor. Prefer concrete objects and gestures over abstract badges.
4. Establish one drawing grammar before expanding the family:
   - gently imperfect curves and small asymmetries;
   - 2–5 confident strokes or shapes per icon;
   - round caps and joins;
   - comparable optical volume;
   - one restrained accent rule;
   - distinct silhouettes without repeated circles, cards, or tiles.
5. Use `buildBrandAuditionPrompt()` when the visual direction is not already
   approved. Compare three hand-drawn systems on representative features at
   full size and 24 px, then expand only the accepted direction.
6. Use `buildPrompt()` for the complete family. Every animated SVG must include:
   - `data-icon-treatment="hand-drawn"`;
   - `data-icon-motion="wiggle"`;
   - internal `@keyframes icon-wiggle` rules;
   - `prefers-reduced-motion: reduce` disabling the animation;
   - one animated drawing group with a shared, subtle motion language.
7. Deliver the returned SVG JSON through `deliverIconFamily()`. Do not hand raw
   unvalidated SVG to the user.
8. Inspect both `icon-family-preview.png` and
   `icon-family-preview.html`. The PNG proves the static first frame; the HTML
   proves that all individual SVGs play together without distracting motion.

## Drawing quality

Hand-drawn means intentional human variation, not sloppy geometry. The icon
must remain legible without its label and at small sizes. Keep the wobble in the
line construction and grouped animation; do not distort the semantic shape.

Reject:

- stock library icons decorated with a sparkle or colored dot;
- perfectly geometric icons that look like an ordinary UI library;
- a repeated badge, circle, app tile, or card hiding weak metaphors;
- unrelated illustration styles inside one family;
- large rotation, bounce, or path morphing that harms usability;
- animation without a reduced-motion fallback.

## Explicit system route

Use system mode only when the user clearly asks for compact native UI controls.
Set `purpose=system` and `motion=none`, then resolve every feature against
`@phosphor-icons/core@2.1.1`. Keep the family on one native weight:

- outline → `light`, `regular`, or `bold`;
- filled → `fill`;
- duotone → `duotone`.

If a concept has no confident match, inspect `searchPhosphorIcons(feature)` and
show candidates instead of silently choosing an unrelated symbol. Preserve
native paths and add no tile, badge, sparkle, or motion.

```typescript
import {
  deliverPhosphorIconFamily,
  searchPhosphorIcons,
  validate,
} from "./dist/index.js";

const result = validate({ ...input, purpose: "system", motion: "none" });
if (!result.data) throw new Error(JSON.stringify(result.errors));

const candidates = searchPhosphorIcons("Discovery");
const delivery = await deliverPhosphorIconFamily(result.data, outputDir, {
  Discovery: candidates[0].iconName,
});
```

Do not mix libraries or native weights. Do not stretch, simplify, or redraw
retrieved paths individually. `deliverPhosphorIconFamily()` rejects brand mode.

## Delivery gates

Every successful delivery includes individual SVGs, a playable HTML preview,
SVG/PNG contact sheets, normalized spec, metadata, and a manifest. Delivery
rejects:

- missing or duplicate feature coverage;
- unsafe, external, raster, scripted, event-bearing, or text-bearing SVG;
- incorrect viewBox, stroke width, or source provenance;
- hand-drawn output missing treatment, motion, or reduced-motion markers;
- invisible output or incorrect preview dimensions;
- excessive alpha-weighted center offset;
- shapes that are too small or leave insufficient grid padding.

The manifest records treatment, motion, source strategy, visible bounds,
center offset, ink ratio, optical volume, checks, and warnings.

## Quality standard

Judge the complete family. The set must feel authored, recognizable, and
coherent before it is promoted to a README. Passing XML, raster, and optical
checks is necessary but does not replace human review of drawing character and
motion restraint.
