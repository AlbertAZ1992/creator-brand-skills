# Image to Sticker architecture

## Boundary

```text
simple source RGBA + contour + front material + tilt → one verified RGBA sticker
```

Supported inputs are transparent artwork or opaque artwork on one uniform flat
background. Complex photographic segmentation is intentionally absent.

## Sticker Forge behavior retained

Sticker Forge prepares the source, expands its alpha using an exact Euclidean
distance transform, tints that expanded alpha, then draws the source over it.
Its UI outline width is converted to texture radius by:

```text
radius = clamp(outlineWidth × 2.35, 0, 112)
```

The UI constrains outline width to `0–44` and whole-sticker tilt to
`-12°–12°`; defaults are `18` and `-3°`.

Sticker Forge also bakes four deterministic front materials into its prepared
texture: `original`, `holographic`, `glitter`, and `reflective`. This pipeline
ports those presets with the source defaults. Materials composite source-atop,
so they can change visible RGB but never alpha, geometry, holes, or text layout.
The WebGL-only edge bevel, lighting, backing, shadow, and peel pose stay outside
this flat transparent-asset Skill.

The outline expansion is not restricted to the canvas exterior. It can enter a
transparent internal hole. Therefore a large hole remains transparent while a
small hole can close as outline width grows. Source RGBA is composited over the
outline, so opaque source pixels retain priority.

`exteriorAlpha` is a separate flood-filled mask of transparent pixels connected
to a canvas edge. Sticker Forge uses it for exterior hit/peel geometry. This
pipeline uses the same distinction to count enclosed transparent pixels in the
manifest; it never uses it to fill holes.

## Flat background conversion

Sticker Forge normally receives alpha from a transparent source or its removal
editor. For this command-line Skill's narrow flat-artwork scope, four corners
define one background color and every matching pixel is made transparent. This
includes enclosed counters in letters and symbols. Antialiased transition
pixels are unmatted with color-to-alpha: the flat background contribution is
removed from RGB and represented as soft alpha. This avoids a gray or
background-colored fringe after enlargement. Near-opaque foreground pixels
remain opaque. If corners are inconsistent, `auto` rejects the image as complex.

## Rendering order

1. Decode complete source RGBA and hash decoded RGB.
2. Preserve source alpha or remove one uniform background color.
3. Crop visible alpha bounds and fit the complete artwork with safe margin.
4. For zero outline, preserve source RGBA without compositing it over itself.
5. Otherwise expand alpha by the configured radius and tint it.
6. Composite source over outline.
7. Apply the selected deterministic front material.
8. Rotate the complete sticker by the configured tilt.
9. Write RGBA PNG, grayscale alpha proof, V4 source card, and V4 manifest.

## Gates

- output is 512² or 1024² RGBA;
- all four corners are transparent;
- alpha spans 0–255;
- visible coverage is strictly between 1% and 95%, while an empty foreground
  is rejected before rendering;
- manifest records the background route, outline control and actual radius,
  outline color, material, tilt, source RGB SHA-256, and enclosed transparent
  pixel count.
