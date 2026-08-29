# Image to Sticker evals

Request evals cover the default Sticker Forge controls, a thin tilted outline,
an existing-alpha source, maximum outline width, and an opt-in holographic
front material. These cases verify request parsing and prompt construction, not
raster quality.

The deliverable eval owns machine-verifiable image quality:

- a flat-background fixture keeps enclosed regions transparent;
- a wider outline produces fewer internal transparent pixels than a narrow one;
- a zero-width outline preserves black antialiased edge RGB instead of adding a
  gray or white fringe;
- soft alpha remains present after high-quality resizing;
- every procedural material preserves alpha byte-for-byte and renders
  deterministically;
- manifests, RGBA dimensions, alpha proofs, coverage, and pass state remain
  valid.

Visual parameter comparisons belong in [`examples/`](../examples/README.md).

```bash
npm run verify
```
