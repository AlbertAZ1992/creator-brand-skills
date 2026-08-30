# Feature to Icons examples

The public gallery contains one current, complete hand-drawn family. The board
places the input feature brief beside the actual verified SVG outputs.

## Creator Doodles · 20 animated SVG icons

<p align="center">
  <img src="creator-doodle-animated/showcase-preview.png" alt="Twenty creator features transformed into a hand-drawn animated SVG icon set" width="1000">
</p>

| Artifact | Purpose |
| --- | --- |
| [`example.json`](creator-doodle-animated/example.json) | Original request and normalized 20-feature input |
| [`showcase-preview.png`](creator-doodle-animated/showcase-preview.png) | Static source-to-output proof for README display |
| [`icon-family-preview.html`](creator-doodle-animated/icon-family-preview.html) | Playable gallery using the actual individual animated SVGs |
| [`icon-family-preview.svg`](creator-doodle-animated/icon-family-preview.svg) | Editable static family contact sheet |
| [`icon-family-manifest.json`](creator-doodle-animated/icon-family-manifest.json) | Feature coverage, treatment, motion, source, optical metrics, and checks |
| `*.svg` | Twenty self-contained editable feature icons |

Every icon declares the hand-drawn treatment, includes the same restrained
`icon-wiggle` animation, and disables motion when the viewer prefers reduced
motion. The static first frames pass SVG safety, visible-pixel, bounds, center,
ink-density, and optical-volume checks with no warnings.

```bash
npm run examples
npm run verify:examples
```

Regeneration removes retired example directories and rebuilds exactly this
20-icon family from the checked source brief and original SVG geometry.
