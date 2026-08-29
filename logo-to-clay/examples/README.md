# Logo to Clay examples

These examples use the real local mesh pipeline, not a hand-drawn mockup. Both
previews originate from [`assets/clay-mark.svg`](assets/clay-mark.svg), and every
output folder contains an OBJ, MTL, bump map, 1024 px preview, and passing
manifest.

Regenerate them with:

```bash
npm run examples
```

## The two supported mesh forms

`object` is a standalone softly beveled extrusion. `relief` adds real backing
geometry behind a shallower mark.

![Standalone and relief mesh previews](generated/mesh-forms.png)

The complete deliverables are in [`generated/object/`](generated/object/) and
[`generated/relief/`](generated/relief/).

Image generation is a separate reference-image route. Its checked-in example
is generated through the image model rather than being presented as evidence
for the deterministic mesh renderer.

## Reference-image render

The same source logo was supplied to the image route with `object`, `5 mm`,
purple clay, and a warm studio background. This output demonstrates the
subjective image-model route; it is not used to validate OBJ geometry.

![Generated clay render](generated/clay-render.png)
