# Feature to Icons Architecture

Feature to Icons uses a library-first resolver. Semantic choice remains a
reasoning task; source geometry, provenance, optical measurement, rendering,
and delivery are deterministic.

```text
feature names + options
          |
       validate()
          |
  search pinned Phosphor catalog
          |
 one native source weight for the family
          |
 uniform color/viewBox adaptation
          |
 SVG safety + provenance + optical gates
          |
 SVGs + metadata + previews + manifest
```

## Why library first

A shared viewBox and stroke declaration do not guarantee visual consistency.
Independent drawings can still have different apparent centers, occupied
areas, curve logic, and detail density. Pinned community-reviewed geometry
removes most of that variance before validation starts.

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

`deliverIconFamily()` retains the earlier JSON/SVG path for user-approved
custom work. It applies the same output, safety, raster, and optical gates, plus
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
real custom deliverable, and the committed Phosphor gallery. Example validation
rechecks provenance, SVG rules, PNG dimensions, and one optical metric per icon.
