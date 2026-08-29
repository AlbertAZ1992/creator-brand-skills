# Image to Sticker visual examples

Examples answer the human question: “Which controls look right for this
artwork?” Machine regressions belong in [`eval/`](../eval/README.md).

The main showcase uses a high-resolution transparent Threads wordmark. Two
additional fixtures remain for testing existing transparency and
uniform-background removal. For real work, prefer SVG or the highest-resolution
raster available; a 1024 px export cannot recover detail absent from the source.

Regenerate every image below with:

```bash
npm run examples
```

Human-facing previews use a warm neutral card so the examples read like brand
work. Alpha proofs remain alongside the transparent sticker assets for machine
and delivery review.

## Supported source types

The left fixture already has transparency. The right fixture uses a uniform
background that the renderer removes, including the matching hole in its center.

<p align="center">
  <img src="generated/source-types.png" alt="Transparent and flat-background source comparison" width="800">
</p>

The sticker, alpha proof, source card, and manifest for both cases are stored in
[`generated/source-types/`](generated/source-types/).

## Complete style overview

This grid shows every flat-asset style currently supported: borderless, thin
contour, classic contour, colored contour, and all four front materials. These
are deterministic raster operations; they do not redraw or retype the source.

<p align="center">
  <img src="generated/style-overview.png" alt="Complete style overview" width="900">
</p>

## Outline width

The four samples use `1`, `4`, `8`, and `18`. Thin widths preserve internal
holes; wider widths can naturally close them.

<p align="center">
  <img src="generated/outline-widths.png" alt="Outline width comparison" width="900">
  <img src="generated/outline-alpha.png" alt="Outline alpha comparison" width="900">
</p>

## Tilt

These samples hold the outline at `4` and compare `-12°`, `0°`, and `12°`.

<p align="center">
  <img src="generated/tilts.png" alt="Tilt comparison" width="800">
</p>

## Outline color

These samples hold the outline at `4` and compare four colors.

<p align="center">
  <img src="generated/colors.png" alt="Outline color comparison" width="900">
</p>

## Front material

These samples hold the outline at `4` and compare Sticker Forge's four baked
front finishes: `original`, `holographic`, `glitter`, and `reflective`.
Material changes never alter alpha geometry, internal holes, or placement.

<p align="center">
  <img src="generated/materials.png" alt="Front material comparison" width="900">
</p>

## Balanced result

For this fixture, `4` with `-3°` keeps the counters visible while reading
clearly as a sticker.

<p align="center">
  <img src="generated/recommended-preview.png" alt="Balanced sticker preview" width="560">
</p>

The transparent asset, alpha proof, source card, and passing manifest are in
[`generated/recommended/`](generated/recommended/).

Threads and its logo are trademarks of Meta Platforms, Inc. This repository is
not affiliated with or endorsed by Meta. See
[`THIRD_PARTY_NOTICES.md`](../THIRD_PARTY_NOTICES.md).
