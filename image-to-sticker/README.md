# Image to Sticker

Turn a simple logo, icon, badge, or flat illustration into one production-ready
transparent sticker. The skill keeps the supplied artwork intact, removes a
transparent or flat background, adds a contour, and can apply a deterministic
front finish.

| **Balanced result** | **Supported style system** |
| :---: | :---: |
| <img src="examples/generated/recommended-preview.png" alt="Balanced Threads contour sticker" width="560"> | <img src="examples/generated/style-overview.png" alt="Threads sticker style system" width="560"> |
| Source-faithful transparent output | Contours and deterministic front materials |

## What it does

- Preserves the source composition instead of redrawing it.
- Accepts transparent artwork or artwork on one uniform background color.
- Builds a true transparent PNG with an adjustable contour.
- Supports original, holographic, glitter, and reflective front materials.
- Applies optional whole-sticker tilt without changing internal layout.
- Returns the sticker, an alpha proof, a reproducible source card, and a
  machine-verifiable manifest.

It is intentionally for simple, already-composed artwork. It does not choose a
subject from a busy photograph, reconstruct missing pixels, retype a wordmark,
or generate a 3D peel scene.

## Requirements

- Codex or another agent that supports local skills
- Node.js 22.13 or newer for direct renderer use
- ImageMagick and `jq` only when regenerating visual examples or running the
  shell deliverable evaluation

## Installation

Install the published Skill globally for Codex:

```bash
npx skills add AlbertAZ1992/creator-brand-skills \
  --skill image-to-sticker --global --agent codex
```

Restart Codex after installation so the skill is discovered. To work on the
renderer directly:

```bash
cd image-to-sticker
npm install
npm run build
```

## Usage in Codex

Attach an image and ask naturally. A short request is enough:

> Turn this into a sticker.

The skill chooses safe defaults when details are omitted. Add only the controls
you care about:

> Use Image to Sticker on this transparent logo. Keep the original colors, add
> a thin white outline, and do not rotate it.

> Make this flat-background badge a holographic sticker with a pink outline and
> a slight clockwise tilt.

> Create a borderless transparent sticker from this icon.

For ambiguous photos, crop or isolate the intended subject first. This skill
will not silently guess which object to keep.

## Controls

| Control | Values | Default | Meaning |
| --- | --- | --- | --- |
| `backgroundMode` | `alpha`, `flat` | inferred | Keep existing alpha or remove one flat background |
| `outlineWidth` | `0`–`64` | `18` | Contour control; `0` is borderless |
| `outlineColor` | CSS hex | `#ffffff` | Contour color |
| `material` | `original`, `holographic`, `glitter`, `reflective` | `original` | Deterministic front finish |
| `tilt` | `-15`–`15` | `-3` | Whole-sticker rotation in degrees |
| `size` | `512`, `1024`, `2048` | `1024` | Square PNG output size |

The Euclidean outline expansion is `outlineWidth × 2.35`, matching Sticker
Forge. Flat-background removal also handles enclosed background regions and
unmattes antialiased edges, which avoids a pale fringe around the result.

<details>
<summary><strong>Transparent and flat-background input comparison</strong></summary>

<p align="center">
  <img src="examples/generated/source-types.png" alt="Transparent and flat-background inputs" width="760">
</p>

</details>

## Direct renderer usage

Create a source card describing the operation:

```json
{
  "version": 4,
  "sourceImage": "logo.png",
  "backgroundMode": "alpha",
  "outlineWidth": 6,
  "outlineColor": "#ffffff",
  "material": "original",
  "tilt": 0,
  "size": 1024
}
```

Then run:

```bash
bash scripts/render-sticker.sh logo.png source-card.json output
```

The source card must name the image actually supplied. This prevents a result
from carrying misleading provenance.

## Output

Every successful render writes:

```text
output/
├── sticker.png               transparent RGBA artwork
├── sticker-alpha-proof.png   grayscale transparency proof
├── source-card.json          normalized reproducible controls
└── sticker-manifest.json     dimensions, pipeline values, and checks
```

The manifest passes only when the PNG is RGBA, corners are transparent,
coverage is plausible, and visible alpha exists. Material effects may alter
visible RGB, but never the alpha geometry.

## Examples and verification

See [`examples/README.md`](examples/README.md) for directly embedded comparisons
of outline widths, alpha, tilt, colors, materials, and source types.

```bash
npm run examples
npm run verify
```

`npm run verify` runs formatting, lint, type checking, build, 19 unit tests, 5
behavior evals, and a real raster deliverable evaluation. The architecture and
format contracts are documented in [`docs/architecture.md`](docs/architecture.md)
and [`schemas/`](schemas/).

## Limitations

- Busy photographic backgrounds require a dedicated subject-isolation step.
- Very small inputs cannot gain real detail by exporting at 1024 or 2048 px.
- A wide contour can intentionally close small holes; use a thinner contour
  when counters and gaps matter.
- SVG text depends on fonts available to the rasterizer. Convert important type
  to outlines before rendering.

Third-party lineage and licenses are recorded in
[`THIRD_PARTY_NOTICES.md`](THIRD_PARTY_NOTICES.md).
