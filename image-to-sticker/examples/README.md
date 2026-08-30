# Image to Sticker examples

<p align="center">
  <img src="generated/open-source-tech/source-to-sticker.png" alt="Six source logos shown beside six verified transparent sticker outputs" width="900">
</p>

The current gallery keeps the original artwork visible beside the generated
result. All six `sticker.png` files are independent 1024 px RGBA deliveries,
not crops from the presentation board.

| Source | Demonstrated controls | Delivery directory |
| --- | --- | --- |
| Vite Bolt | Original material, classic white contour, −6° tilt | [`vite-bolt/`](generated/open-source-tech/vite-bolt/) |
| React | Holographic material, pale-blue contour, +5° tilt | [`react/`](generated/open-source-tech/react/) |
| TypeScript | Reflective material, cool contour, −5° tilt | [`typescript/`](generated/open-source-tech/typescript/) |
| Astro | Glitter material, warm contour, +7° tilt | [`astro/`](generated/open-source-tech/astro/) |
| Vue | Original material, orange colour contour, +3° tilt | [`vue/`](generated/open-source-tech/vue/) |
| Deno | Original material, borderless, no tilt | [`deno/`](generated/open-source-tech/deno/) |

Every directory contains the actual transparent `sticker.png`, grayscale
`sticker-alpha-proof.png`, resolved `source-card.json`, and passing
`sticker-manifest.json`. The source registry records exact URLs and SHA-256
hashes. Third-party names and marks belong to their respective owners; no
affiliation is implied.

## Regenerate the current examples

```bash
npm run examples
npm run verify:examples
```

The command sends all six source SVGs through the real renderer and rebuilds
the source-to-output board from those accepted transparent assets.
