---
name: feature-to-icons
description: Create a consistent SVG icon family for 3–20 product features using pinned open-source library geometry, with semantic matching, provenance, previews, and optical validation.
---

# Feature to Icons

Create one cohesive icon family from 3–20 product feature names. Prefer pinned
Phosphor assets over drawing unrelated SVG paths from scratch.

## Inputs

- `features`: 3–20 unique names.
- `style`: `outline` (default), `filled`, or `duotone`.
- `colors`: optional primary and secondary hex colors.
- `gridSize`: `24` (default), `32`, or `48`.
- `visualWeight`: `light`, `regular` (default), or `bold`.
- `productContext`: optional context for semantic selection.

Natural language is sufficient. Do not require users to name these fields.

## Default workflow

1. Resolve this Skill's directory from the loaded `SKILL.md`. Before importing
   the runtime, check for `dist/index.js`. If it is missing, run `npm ci`
   followed by `npm run build` in that directory. This is first-use runtime
   preparation; do not ask the user to clone the repository or run a repository
   installer.
2. Validate the request.
3. Resolve every feature against the pinned `@phosphor-icons/core@2.1.1`
   catalog. Keep the entire family on one native weight:
   - outline → `light`, `regular`, or `bold`;
   - filled → `fill`;
   - duotone → `duotone`.
4. If a feature has no confident match, inspect
   `searchPhosphorIcons(feature)`. Choose an override only when product context
   makes the metaphor clear; otherwise show the best candidates to the user.
   For non-Latin feature names, translate the concept for search, then keep the
   original feature label and pass the selected Phosphor name as an override.
5. Deliver with `deliverPhosphorIconFamily()`.
6. Inspect the PNG contact sheet. Report any optical warnings instead of hiding
   them.

```typescript
import {
  deliverPhosphorIconFamily,
  searchPhosphorIcons,
  validate,
} from "./dist/index.js";

const result = validate(input);
if (!result.data) throw new Error(JSON.stringify(result.errors));

const candidates = searchPhosphorIcons("Discovery");
const delivery = await deliverPhosphorIconFamily(
  result.data,
  outputDir,
  { Discovery: candidates[0].iconName },
);
```

Do not mix libraries or Phosphor weights inside one family. Do not independently
stretch, translate, simplify, or redraw retrieved source paths. Color changes
and uniform viewBox scaling are allowed and recorded as presentation changes.
Never accept an alphabetical fallback for an empty or unsupported search query.

## Custom fallback

Use model-authored SVG only when:

- the pinned catalog has no credible metaphor;
- an exact sharp-corner or branded design is essential; and
- the user accepts custom geometry.

For custom output, use `deliverIconFamily()` rather than handing raw SVG to the
user. Keep one shared grid, stroke, cap/join rule, corner logic, detail level,
and optical volume. Reference at least three nearby icons from the intended
family when drawing a new symbol.

## Delivery gates

Every successful delivery includes individual SVGs, editable and PNG previews,
metadata, normalized spec, and a manifest. The delivery rejects:

- missing or duplicate feature coverage;
- unsafe, external, raster, scripted, or text-bearing SVG;
- provenance that disagrees with embedded source attributes;
- invisible output or incorrect preview dimensions;
- excessive alpha-weighted center offset;
- shapes that are too small or leave insufficient grid padding.

The manifest records source library, package version, license, native weight,
per-icon visible bounds, center offset, ink ratio, optical volume, and warnings.

## Quality standard

Judge the family, not only each file. At 16–24 px, icons must have comparable
visual volume and density, distinct silhouettes, recognizable metaphors, and a
stable apparent center. Passing XML or raster checks alone is not sufficient.
