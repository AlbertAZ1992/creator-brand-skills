# Feature to Icons evals

The eval suite checks that feature lists and design-system choices are encoded
consistently before SVG delivery. It runs offline and does not call an image
model.

## Request matrix

| Case | Input route | Must express | Boundary covered |
| --- | --- | --- | --- |
| Minimal outline | Three features | 24 px outline system and all names | Minimum accepted count |
| SaaS context | Ten features + product context | Domain context and 32 px family | Larger product family |
| Duotone | Two colors | Primary/secondary hierarchy and 2.5 px strokes | Color contract |
| Bold | Bold + sharp | Thick strokes and sharp corners | Weight contract |
| Sharp corners | Security concepts | Zero-radius geometry | Corner contract |
| Minimum | Three features | Exactly three icon slots | Lower boundary |
| Maximum | Twenty features | Exactly twenty icon slots | Upper boundary |
| Filled SaaS | Filled + brand color | Solid shapes and product context | Filled route |
| Light custom stroke | Light + 2.5 px | Thin visual weight and exact stroke | Mixed settings |

Every case also checks relevant omissions, such as no color section when no
color was supplied, plus an explicit prohibition on `<text>` inside SVG assets.

## Run

```bash
npm run eval
```

The runner passes each case through input validation and the prompt compiler,
then checks prompt structure and SVG parameter encoding.

## Deliverable eval

```bash
npm run verify:deliverables
```

This delivers three real SVG files, an editable family preview, a rasterized
PNG preview, metadata, spec, and manifest. It verifies exact feature coverage,
file safety, the shared viewBox/stroke contract, and non-empty outputs.

Run `npm run verify` for lint, formatting, types, 54 unit tests, nine request
evals, and the real delivery eval together.
