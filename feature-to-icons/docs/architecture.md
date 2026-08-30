# Feature to Icons Architecture

Feature to Icons has a hard source boundary. System/UI icons use a library-first
resolver. Branded product-feature art uses original custom geometry. Safety,
provenance, optical measurement, rendering, and delivery are deterministic for
both routes.

```text
feature names + options
          |
       validate()
          |
 infer brand feature art or system/UI purpose
          |
  +-------+-----------------------+
  |                               |
system: pinned Phosphor       brand: three custom auditions
  |                               |
one native source weight      selected original visual system
  +---------------+---------------+
          |
 SVG safety + provenance + optical gates
          |
 SVGs + metadata + previews + manifest
```

## Why the routes are separate

A shared viewBox and stroke declaration do not guarantee visual consistency.
Pinned community-reviewed geometry removes most variance for small UI controls.
That same advantage becomes a liability for brand art: decorating generic
glyphs does not create product-specific or ownable feature illustrations.

`@phosphor-icons/core@2.1.1` is the only default source. It provides raw SVGs,
catalog names, tags, categories, and native light, regular, bold, fill, and
duotone weights under MIT.

## Resolution

`searchPhosphorIcons()` uses curated product-language mappings first, then a
deterministic score over icon names, tags, and categories. Low-confidence
queries are not silently accepted. They require an explicit feature-to-icon
override or the custom fallback.

`buildPhosphorIconFamily()` selects one native weight for the whole family,
loads the exported SVG asset, preserves its path geometry, and applies only:

- uniform 256-to-requested-viewBox scaling;
- primary presentation color;
- optional secondary color on the native duotone background layer;
- source-identifying data attributes.

That is the complete `system` presentation. `buildPhosphorIconFamily()` rejects
`purpose: brand`.

The brand route selects representative features, auditions three original
custom visual systems, and expands only the approved system. Every icon uses
2–4 large shapes, one product-specific metaphor, a distinct silhouette, and
shared material/stroke/corner/accent behavior. Repeated circles, app tiles,
cards, and stock glyphs with decoration are rejection conditions.

Validation infers `system` when at least half of the names are established UI
concepts; callers may override the purpose explicitly.

## Provenance

Every library-backed icon records:

- source library and npm package;
- exact package version;
- source icon name and native weight;
- MIT license;
- geometry and presentation modification flags.

The family manifest repeats the shared source contract. A source/attribute
mismatch is a hard failure.

## Optical measurement

Each SVG is rasterized to a deterministic 256 px analysis surface. Alpha pixels
produce:

- visible bounding box;
- alpha-weighted center offset from the grid center;
- ink ratio;
- occupied bounding-box area ratio.

Hard gates reject excessive horizontal or vertical center offset, undersized
shapes, and insufficient padding. Family-relative ink and optical-volume
outliers are recorded as warnings because asymmetric metaphors can be valid.

These metrics catch gross positioning mistakes but do not replace contact-sheet
inspection. The generated PNG remains the final human-readable proof.

## Custom fallback

`deliverIconFamily()` owns every branded feature family and any novel system
fallback. It applies the same output, safety, raster, and optical gates, plus
exact stroke-width checks for outline and duotone SVGs. Custom artifacts are
marked `user-provided`; they are never presented as Phosphor assets.

## Output

```text
<feature>.svg
icon-spec.json
icon-metadata.json
icon-family-preview.svg
icon-family-preview.png
icon-family-manifest.json
```

The manifest is the machine-readable delivery contract. It records exact file
coverage, source family, validation checks, optical metrics, and non-blocking
warnings.

## Verification

`npm run verify` runs static checks, build, unit tests, input/prompt evals, a
real custom deliverable, one committed custom brand family, and eight Phosphor
system families. Example validation rechecks provenance, SVG rules, PNG
dimensions, and one optical metric per icon.
