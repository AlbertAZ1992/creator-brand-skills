# Feature to Icons Architecture

Feature to Icons defaults to original hand-drawn feature art with optional
self-contained SVG motion. A separate explicit system route preserves pinned
Phosphor geometry for conventional UI controls. Safety, provenance, rendering,
optical measurement, and delivery are deterministic for both routes.

```text
feature names + product context
            |
         validate()
            |
     explicit purpose choice
            |
  +---------+--------------------------+
  |                                    |
brand default: hand-drawn          explicit system
original custom geometry           pinned Phosphor 2.1.1
optional embedded wiggle           native static weight
  +----------------+-------------------+
                   |
  SVG safety + treatment + motion + optical gates
                   |
 SVGs + playable HTML + contact sheets + manifest
```

## Hand-drawn default

An unqualified request is `purpose=brand`. Validation applies a 48 px grid,
round 2.6 px strokes, charcoal plus one accent, and `motion=wiggle`. The prompt
compiler asks for gently imperfect custom curves, concrete product metaphors,
distinct silhouettes, and comparable optical volume.

Animated SVGs declare their treatment and motion, embed `icon-wiggle`
keyframes, and include a `prefers-reduced-motion` fallback. The transform is
applied to one grouped drawing. Paths remain unchanged and editable.

Delivery rejects hand-drawn output that looks valid structurally but omits any
of these machine-readable markers. The static SVG/PNG previews render the first
frame; the HTML preview embeds the actual individual SVGs and proves motion.

## Explicit system route

System mode is never inferred from ordinary feature names. The caller sets
`purpose=system` and `motion=none`. `searchPhosphorIcons()` uses curated product
language mappings, then deterministic scoring over names, tags, and categories.
Low-confidence matches require an explicit override.

`buildPhosphorIconFamily()` selects one native weight, preserves path geometry,
and applies only uniform viewBox scaling and requested presentation colors. It
rejects brand mode and never adds doodle treatment, animation, or decoration.

## Safety and source boundaries

Custom and library-backed geometry cannot mix inside one family. SVG validation
rejects scripts, event handlers, text, raster content, external URLs,
stylesheets, and document types. Library artifacts must carry matching package,
version, icon name, weight, license, and embedded provenance attributes.

## Optical measurement

Each SVG is rasterized to a deterministic 256 px analysis surface. Alpha pixels
produce a visible bounding box, alpha-weighted center offset, ink ratio, and
occupied area ratio. Hard gates reject invisible, undersized, overflowing, or
severely off-center shapes. Family-relative density and volume outliers become
warnings and must be reviewed in the contact sheet.

## Output

```text
<feature>.svg
icon-family-preview.html
icon-family-preview.svg
icon-family-preview.png
icon-spec.json
icon-metadata.json
icon-family-manifest.json
```

The manifest records exact file coverage, design treatment, motion, source
strategy, validation checks, optical metrics, and warnings.

## Verification

`npm run verify` runs lint, formatting, types, build, unit tests, prompt evals,
a real deliverable, and the committed 20-icon hand-drawn family. Example
validation rechecks every animated SVG, the playable HTML gallery, PNG/SVG
previews, manifest coverage, and zero optical warnings.
