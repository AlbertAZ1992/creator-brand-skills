# Logo to Clay Architecture

Logo to Clay has two independent delivery routes—not visual styles—behind one
normalized input contract. Image mode creates a constrained reference-image
prompt. Mesh mode creates and hard-validates reusable geometry.

```text
SVG/PNG logo + options
        |
        v
validate() -> normalized ClayOptions
        |
        +---------------------------+
        |                           |
        v                           v
buildPrompt()                buildClayAsset()
        |                           |
reference-image prompt       contour extraction
                                    |
                              extrusion + material
                                    |
                              OBJ + MTL + preview
                                    |
                           verifyClayDeliverables()
                                    |
                              validated manifest
```

## Input normalization

`validate()` accepts an unknown value, reports structured field errors, and
applies stable defaults for output mode, shape, depth, and background.
It accepts an optional `outputDir`; otherwise mesh artifacts are written under
`outputs/` in the current working directory.

The only public 3D forms are `object` and `relief`. Removed form and texture
values are rejected rather than normalized or silently ignored.

Input validation is deterministic. File decoding and geometry errors remain
runtime failures because they require reading the supplied logo.

## Image mode

`buildPrompt()` first locks outer contour, relative proportions, counters, and
openings, then describes clay material, shape, depth, lighting, and campaign
composition. The studio route specifies a 55–75% hero scale, 20–30 degrees of
yaw, 8–14 degrees of elevation, a 12–20% visible sidewall, low plinth, and
decisive contact shadow. The calling agent must send
the supplied logo as a reference image to its image-generation tool. This mode
does not claim that prompt construction alone produced an image.

`run({ output: "image" })` returns the prompt so callers cannot lose the actual
mode deliverable.

## Mesh mode

`buildClayAsset()` owns deterministic geometry:

1. Rasterize SVG at 1024 px or PNG at 512 px using `sharp`.
2. Derive closed foreground contours from transparency or edge color contrast.
3. Group outer contours and enclosed counters.
4. Extrude the resulting shapes with shared bevel parameters.
5. Add backing geometry when `shape` is `relief`.
6. Export OBJ geometry, an MTL clay material, and its bump texture.
7. Render a 1024 × 1024 WebGL preview when available.
8. Fall back to a deterministic `sharp` silhouette preview in headless
   environments without WebGL.
9. Write the source/spec/artifact manifest.

Enclosed counters remain through-holes with inner sidewalls rather than filled
faces. Rasterizing SVG delegates primitives, arcs, transforms, and fill rules
to a mature SVG implementation instead of a partial path parser. It is a
high-resolution silhouette approximation, not exact vector extrusion. Tests
cover transparent, light-on-dark, multi-counter PNGs, compound paths, SVG
primitives, transforms, arcs, and empty-input rejection.

## Hard validation

`verifyClayDeliverables()` runs in the normal `buildMesh()` path. It rejects a
delivery unless all of the following are true:

- the OBJ has vertices and faces;
- the OBJ references the emitted MTL filename;
- the MTL contains a named diffuse material and references the bump texture;
- the bump texture is a 512 × 512 PNG;
- the preview is a 1024 × 1024 PNG;
- the manifest declares contract version `1.0` and artifact paths.

The passing report, geometry counts, and preview metadata are written back to
the manifest and returned on `ClayResult.validation`.

## Output contract

For `sample.svg`, mesh mode emits:

```text
sample-clay-mesh.obj
sample-clay-clay.mtl
sample-clay-bump.png
sample-clay-preview.png
sample-clay-manifest.json
```

OBJ/MTL is the supported reusable mesh format. GLB is outside the current
contract. The Skill has no Web application and performs no publishing.

## Verification

`npm run verify` runs lint, formatting, type checking, build, unit tests,
prompt evals, and a real mesh-delivery eval. The final eval constructs an OBJ
from the checked-in PNG fixture and validates all five output artifacts using
the same production gate.
