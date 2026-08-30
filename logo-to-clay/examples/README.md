# Logo to Clay examples

<p align="center">
  <img src="generated/albertaz-wordmark/source-to-clay.png" alt="ALBERTAZ wordmark shown beside its clay render and verified OBJ preview" width="1000">
</p>

Every row makes the input/output boundary explicit: the source logo stays
visible beside the expressive clay render and the independently generated mesh
preview.

## Featured: ALBERTAZ wordmark

<p align="center">
  <img src="generated/albertaz-wordmark/clay-render.png" alt="ALBERTAZ wordmark rendered as a dimensional violet clay campaign object" width="900">
</p>

| **Source** | **Verified mesh preview** |
| :---: | :---: |
| <img src="generated/albertaz-wordmark/source.png" alt="Flat ALBERTAZ wordmark source" width="420"> | <img src="generated/albertaz-wordmark/object/albertaz-wordmark-clay-preview.png" alt="Preview rendered from the ALBERTAZ wordmark OBJ mesh" width="420"> |
| Locked wordmark input | 4 mm standalone object; 15,402 vertices, 5,134 faces, three cavities |

[`generated/albertaz-wordmark/`](generated/albertaz-wordmark/) contains the
campaign render, source SVG/PNG, OBJ, linked MTL, bump map, 1024 px preview,
and passing manifest.

## Additional approved runs

| **Vite bolt** | **JavaScript** |
| :---: | :---: |
| <img src="generated/vite-bolt/clay-render.png" alt="Vite bolt rendered as a dimensional purple and blue clay campaign object" width="420"> | <img src="generated/javascript/clay-render.png" alt="JavaScript letter mark rendered as thick yellow clay" width="420"> |
| Multi-colour campaign render + standalone object | Campaign render + standalone object + 2 mm relief |

[`generated/vite-bolt/`](generated/vite-bolt/) and
[`generated/javascript/`](generated/javascript/) contain their source files,
campaign renders, verified mesh packages, and passing manifests. The render
and geometry routes remain intentionally independent.

## Regenerate the approved examples

The three accepted campaign renders are checked visual references. The command
below re-copies their pinned sources and rebuilds all deterministic mesh
packages: ALBERTAZ object, Vite object, JavaScript object, and JavaScript relief.

```bash
npm run examples
```

Canonical inputs live in [`sources/`](sources/). The command does not create a
new unreviewed beauty render or restore a retired fixture.
