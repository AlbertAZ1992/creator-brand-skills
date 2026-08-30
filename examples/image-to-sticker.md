# Image to Sticker forward tests

Use simple, already-composed artwork: a logo, icon, badge, or flat illustration.
Save outputs outside the repository, for example under
`/absolute/path/to/brand-tests/sticker-*`.

The checked-in gallery shows six source SVGs beside six current outputs:
classic contour, holographic, reflective, glitter, colour contour, and
borderless. Each transparent result, alpha proof, source card, and manifest
stays in its own artifact folder for delivery review.

The skill does not select subjects from busy photos or invent enamel, patch,
ceramic, magnet, or scene-crop styles. Those are separate generation tasks.

## 1. Default flat-background route

Attach a logo on one uniform background:

```text
Use $image-to-sticker to turn this logo into a sticker. Save the result under
/absolute/path/to/brand-tests/sticker-default.
```

Expected: a 1024 px transparent PNG with the original artwork, a white contour,
slight counterclockwise tilt, original material, alpha proof, source card, and
passing manifest.

Accept when:

- `sticker.png` has transparent corners and no old background fringe;
- the source artwork is not redrawn, cropped, or retyped;
- `sticker-alpha-proof.png` shows a clean edge; and
- `sticker-manifest.json` reports `verification.passed: true`.

## 2. Transparent input and thin contour

```text
Use $image-to-sticker on this transparent icon. Keep its original colors, use
a 4 px white contour, and do not rotate it.
```

Expected: existing alpha is preserved, internal holes remain open, and output
uses `backgroundMode: alpha`, `outlineWidth: 4`, and `tilt: 0`.

## 3. Borderless output

```text
Use $image-to-sticker on this badge with no outline and no tilt. Export at
512 px.
```

Expected: one transparent 512 px PNG whose geometry follows the source alpha.

## 4. Holographic finish

```text
Use $image-to-sticker on this logo. Make one holographic sticker with a thin
pink contour and a slight clockwise tilt.
```

Expected: deterministic iridescent color variation inside the existing
foreground only. Alpha geometry and layout must match the original-material
version.

## 5. Glitter and reflective finishes

```text
Use $image-to-sticker on this transparent symbol. Show one glitter result and
one reflective result with identical contour and tilt controls.
```

Expected: the two RGB finishes differ, but their alpha proofs are byte-identical.

## Direct renderer test

From `image-to-sticker/`, create a V4 source card, then run:

```bash
npm run build
bash scripts/render-sticker.sh source.png source-card.json output
```

The source card's `sourceImage` basename must match the supplied image. A
mismatch fails instead of creating misleading provenance.

## Failure tests

- Supply a busy photo: the Skill should ask for an isolated/cropped subject or
  explain that subject segmentation is outside its contract.
- Name a different file in the source card: rendering must fail.
- Request a sticker pack: the Skill must keep the single-asset boundary.
- Use a very wide contour on tiny counters: the Skill should disclose that the
  holes may close naturally.
- Corrupt alpha or remove an artifact: deliverable verification must fail.

The checked-in approved examples and their transparent deliverables are embedded in
[`../image-to-sticker/README.md`](../image-to-sticker/README.md).
