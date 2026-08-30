---
name: feature-to-icons
description: Create a consistent SVG family for 3–20 product features, with original custom brand art, native system icons, previews, provenance, and optical validation.
---

# Feature to Icons

Create one cohesive icon family from 3–20 feature names. Treat branded feature
art and compact system/UI glyphs as different products.

## Inputs

- `features`: 3–20 unique names.
- `purpose`: `brand` or `system`; infer it when omitted.
- `style`: `outline` (default), `filled`, or `duotone`.
- `colors`: optional primary and secondary hex colors.
- `gridSize`: `24` (default), `32`, or `48`.
- `visualWeight`: `light`, `regular` (default), or `bold`.
- `productContext`: optional context for semantic selection.

Natural language is sufficient. Do not require users to name these fields.

## Source boundary

- `system` uses pinned `@phosphor-icons/core@2.1.1` native geometry.
- `brand` uses original custom SVG geometry for the complete family.
- Never decorate a library glyph and present it as branded feature art.
- `deliverPhosphorIconFamily()` rejects `purpose: brand`.

## Default workflow

1. Resolve this Skill's directory from the loaded `SKILL.md`. Before importing
   the runtime, check for `dist/index.js`. If it is missing, run `npm ci`
   followed by `npm run build` in that directory. This is first-use runtime
   preparation; do not ask the user to clone the repository or run a repository
   installer.
2. Validate the request. The runtime infers `system` when at least half of the
   names are established UI concepts such as Search, Settings, Dashboard, or
   Notifications; otherwise it infers `brand`.
3. For `system`, resolve every feature against the pinned catalog. Keep the
   complete family on one native weight:
   - outline → `light`, `regular`, or `bold`;
   - filled → `fill`;
   - duotone → `duotone`.
4. If a system feature has no confident match, inspect
   `searchPhosphorIcons(feature)`. Choose an override only when product context
   makes the metaphor clear; otherwise show the candidates. For non-Latin
   labels, translate the meaning for search, keep the original label, and pass
   the selected Phosphor name as an override.
5. Deliver `system` with `deliverPhosphorIconFamily()`. Preserve a clean native
   glyph with no decorative container.
6. Before drawing `brand`, check the feature list. Prefer user benefits and
   product-specific outcomes over internal pipeline verbs. Rewrite vague items
   only when context makes their meaning unambiguous; otherwise request the
   missing product meaning.
7. For `brand`, audition original geometry before expanding the family:
   - choose three representative features covering a concrete object, an
     action/process, and an abstract outcome when available;
   - use `buildBrandAuditionPrompt()` to request three genuinely different
     custom visual systems for the same meanings;
   - inspect each system at full size and 24 px;
   - reject stock glyphs, repeated circles, repeated cards, app tiles,
     decorative wrappers, and silhouettes that collapse without labels;
   - select one system and use `buildPrompt()` to expand it across the full
     family;
   - deliver the SVG JSON through `deliverIconFamily()`.
8. Inspect the final PNG contact sheet. Report optical warnings instead of
   hiding them. Brand art requires human visual approval even when every
   deterministic check passes.

## System route

```typescript
import {
  deliverPhosphorIconFamily,
  searchPhosphorIcons,
  validate,
} from "./dist/index.js";

const result = validate(input);
if (!result.data) throw new Error(JSON.stringify(result.errors));
if (result.data.purpose !== "system") throw new Error("Use the custom brand route");

const candidates = searchPhosphorIcons("Discovery");
const delivery = await deliverPhosphorIconFamily(result.data, outputDir, {
  Discovery: candidates[0].iconName,
});
```

Do not mix libraries or Phosphor weights inside one family. Do not stretch,
translate, simplify, or redraw retrieved paths independently. Color changes and
uniform viewBox scaling are allowed and recorded as presentation changes.
Never accept an alphabetical fallback for an empty or unsupported query.

## Custom brand route

For custom output, use `deliverIconFamily()` rather than handing raw SVG to the
user. Keep one shared grid, stroke, cap/join rule, corner logic, material,
detail level, and optical volume.

For every `brand` family:

- use original geometry for the complete family, never an icon library;
- use 2–4 large shapes and one product-specific metaphor per feature;
- give every icon a distinct silhouette;
- share construction and one restrained accent behavior, not one repeated
  container;
- reject a stock glyph with decoration, even when decoration is consistent;
- reference at least three accepted family members when expanding a symbol.

Custom SVG is also allowed as a `system` fallback when the pinned catalog has
no credible metaphor or exact sharp-corner geometry is essential.

## Delivery gates

Every successful delivery includes individual SVGs, editable and PNG previews,
metadata, normalized spec, and a manifest. The delivery rejects:

- missing or duplicate feature coverage;
- unsafe, external, raster, scripted, or text-bearing SVG;
- provenance that disagrees with embedded source attributes;
- invisible output or incorrect preview dimensions;
- excessive alpha-weighted center offset;
- shapes that are too small or leave insufficient grid padding.

The manifest records source strategy, library/package/version when applicable,
per-icon visible bounds, center offset, ink ratio, optical volume, and warnings.

## Quality standard

Judge the family, not only each file. At 16–24 px, icons must have comparable
visual volume and density, distinct silhouettes, recognizable metaphors, and a
stable apparent center. Passing XML or raster checks alone is not sufficient.

Prefer a product-specific feature set over common UI actions when context is
available. The clean SVG and family preview remain the proof; a marketing card
may arrange those same SVGs but must not replace or redraw the deliverables.

Reject a `brand` result that looks like unrelated library icons after labels are
removed. Reject repeated circles, cards, or app tiles used to hide weak
metaphors. Reject a `system` result that adds decorative tiles, sparkles, or
marketing embellishment to ordinary controls.
