# Image to Sticker visual examples

The main showcase uses the original Peach Planet illustration. It is colourful,
contains fine gaps, separate sparkles, and an orbit crossing the central shape,
so it exposes contour and material problems more clearly than a plain wordmark.

<p align="center">
  <img src="generated/recommended-preview.png" alt="Peach Planet sticker portfolio preview" width="760">
</p>

The preview above is presentation only. The actual transparent PNG, alpha
proof, source card, and passing manifest are in
[`generated/recommended/`](generated/recommended/).

## Style system

The complete grid holds source geometry constant while comparing borderless,
thin, classic, and colour contours plus original, holographic, glitter, and
reflective front materials.

<p align="center">
  <img src="generated/style-overview.png" alt="Peach Planet sticker style overview" width="900">
</p>

| Control | Visual proof |
| --- | --- |
| Outline width and topology | <img src="generated/outline-widths.png" alt="Four outline widths" width="720"> |
| Alpha expansion | <img src="generated/outline-alpha.png" alt="Four grayscale alpha proofs" width="720"> |
| Whole-sticker tilt | <img src="generated/tilts.png" alt="Three sticker tilt values" width="720"> |
| Contour colour | <img src="generated/colors.png" alt="Four contour colours" width="720"> |
| Front material | <img src="generated/materials.png" alt="Four deterministic front materials" width="720"> |

## Source boundary

Transparent artwork and one removable flat background are both supported. The
two contract fixtures and their complete deliverables live under
[`generated/source-types/`](generated/source-types/).

<p align="center">
  <img src="generated/source-types.png" alt="Transparent and flat-background source fixtures" width="760">
</p>

Regenerate everything with `npm run examples`. The script uses the actual
renderer for every result; it does not redraw the illustration for the README.
