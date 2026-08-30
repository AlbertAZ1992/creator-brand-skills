# Image to Sticker visual examples

## Featured: open-source technology sticker wall

<p align="center">
  <img src="generated/open-source-tech/sticker-wall.png" alt="Open-source technology transparent die-cut sticker wall" width="900">
</p>

[`generated/open-source-tech/`](generated/open-source-tech/) contains 11
independent 1024 px RGBA deliveries, not one composited mockup: each source has
its own clean sticker, alpha proof, source card, and passing manifest. The
source registry records exact URLs and SHA-256 hashes; `Ship it` and `Merge
ready` are repository-owned demonstration artwork.

## Focused pair: Vite + React

<p align="center">
  <img src="generated/vite-react/sticker-wall.png" alt="Vite and React transparent die-cut sticker wall" width="900">
</p>

[`generated/vite-react/`](generated/vite-react/) contains both source SVGs and
two independent 1024 px RGBA deliveries, each with its own alpha proof, source
card, and passing manifest. The internal React gaps and Vite diagonals remain
crisp because small-viewBox SVGs are decoded near delivery density.

All third-party names and marks belong to their respective owners. They are used
only as attributed transformation fixtures; no affiliation is implied.

## Regenerate the approved examples

Run `npm run examples` to send all 11 checked source SVGs through the actual
renderer again and rebuild the sticker wall from those transparent outputs.
The script does not contain or regenerate any retired fixture.
