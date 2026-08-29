# Logo to Clay examples

These examples use the same supplied Threads wordmark across both supported
routes. The mesh previews come from the real local pipeline, not a hand-drawn
mockup. Every output folder contains an OBJ, MTL, bump map, 1024 px preview,
and passing manifest.

Regenerate them with:

```bash
npm run examples
```

## Image and mesh routes

| **Generated image route** | **Verified mesh route** |
| :---: | :---: |
| <img src="generated/clay-render.png" alt="Generated clay Threads wordmark" width="560"> | <img src="generated/mesh-forms.png" alt="Standalone and relief mesh previews" width="560"> |
| Dark charcoal clay on a warm studio background | Standalone 5 mm object and 2 mm relief |

The image route is subjective and is not evidence for OBJ geometry. The mesh
route is deterministic; complete deliverables are in
[`generated/object/`](generated/object/) and
[`generated/relief/`](generated/relief/).

Threads and its logo are trademarks of Meta Platforms, Inc. This repository is
not affiliated with or endorsed by Meta. See
[`THIRD_PARTY_NOTICES.md`](../THIRD_PARTY_NOTICES.md).
