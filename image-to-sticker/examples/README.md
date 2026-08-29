# Image to Sticker visual examples

Examples answer the human question: “Which controls look right for this
artwork?” Machine regressions belong in [`eval/`](../eval/README.md).

The main fixture is a neutral 1400×400 SVG wordmark so the renderer downsamples
rather than inventing detail through enlargement. Two additional fixtures test
existing transparency and uniform-background removal. For real work, prefer SVG
or the highest-resolution raster available; a 1024 px export cannot recover
detail that is absent from a small source.

Regenerate every image below with:

```bash
npm run examples
```

Every visual preview uses a medium checkerboard so white artwork and white
outlines remain visible. The stored sticker assets remain transparent.

## Supported source types

The left fixture already has transparency. The right fixture uses a uniform
background that the renderer removes, including the matching hole in its center.

![Transparent and flat-background source comparison](generated/source-types.png)

The sticker, alpha proof, source card, and manifest for both cases are stored in
[`generated/source-types/`](generated/source-types/).

## Complete style overview

This grid shows every flat-asset style currently supported: borderless, thin
contour, classic contour, colored contour, and all four front materials. These
are deterministic raster operations; they do not redraw or retype the source.

![Complete style overview](generated/style-overview.png)

## Outline width

The four samples use `1`, `4`, `8`, and `18`. Thin widths preserve internal
holes; wider widths can naturally close them.

![Outline width comparison](generated/outline-widths.png)

![Outline alpha comparison](generated/outline-alpha.png)

## Tilt

These samples hold the outline at `4` and compare `-12°`, `0°`, and `12°`.

![Tilt comparison](generated/tilts.png)

## Outline color

These samples hold the outline at `4` and compare four colors.

![Outline color comparison](generated/colors.png)

## Front material

These samples hold the outline at `4` and compare Sticker Forge's four baked
front finishes: `original`, `holographic`, `glitter`, and `reflective`.
Material changes never alter alpha geometry, internal holes, or placement.

![Front material comparison](generated/materials.png)

## Balanced result

For this fixture, `4` with `-3°` keeps the counters visible while reading
clearly as a sticker.

![Balanced sticker preview](generated/recommended-preview.png)

The transparent asset, alpha proof, source card, and passing manifest are in
[`generated/recommended/`](generated/recommended/).
