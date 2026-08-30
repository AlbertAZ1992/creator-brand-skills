# Logo to Clay forward tests

Attach a simple SVG or PNG logo for every test. Both routes approximate the
visible silhouette; SVG is rasterized at a higher tracing resolution.
Save outputs outside the repository.

The checked-in gallery uses the approved Vite bolt and JavaScript runs. Their
campaign renders and procedural OBJ previews remain separate evidence.

## 1. Default route

```text
Use $logo-to-clay to turn this logo into clay. Save the result under
/absolute/path/to/brand-tests/clay-default.
```

Expected: `both` mode with an object form, 4 mm depth, source-derived color,
the shared clay material, and studio render background.

## 2. Image-only route

```text
Use $logo-to-clay to make a clay image of this logo on a warm studio
background. I only need the image.
```

Expected: a generated raster plus the final prompt. The result is not required
to contain OBJ or MTL files.

## 3. Mesh-only route

```text
Use $logo-to-clay on this SVG. Export only a clay object OBJ mesh at 4 mm
depth. Save the OBJ, MTL, bump map, preview, and manifest under
/absolute/path/to/brand-tests/clay-mesh.
```

Expected: real OBJ geometry, linked MTL and bump map, 1024 px preview, and
passing manifest.

Accept when:

- the preview preserves the logo silhouette and enclosed counters;
- the OBJ contains vertices and faces;
- the OBJ references the delivered MTL; and
- the manifest reports `validation.passed`.

## 4. Relief

```text
Use $logo-to-clay on this logo as a smooth 2 mm clay relief with color #D4A574
and a transparent render background.
```

Expected: shallow logo geometry on a real backing surface, the exact clay
color, the shared clay material, and an isolated-background image request.

## Failure tests

- Supply an unsupported file type: the Skill must report the input limitation.
- Request GLB: the Skill must state that the current mesh output is OBJ/MTL.
- Use a PNG with very thin or photographic details: the Skill must disclose
  contour-approximation limits rather than promise exact geometry.
- Supply an empty/fully transparent SVG: the Skill must fail instead of
  substituting an invented square.
- Supply SVG primitives, arcs, or transforms: the Skill must trace the rendered
  silhouette instead of ignoring unsupported path commands.
- Remove or corrupt the MTL, bump map, or preview: deliverable verification
  must fail.
