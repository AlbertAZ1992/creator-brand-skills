# Product to Mascot forward tests

Describe the product facts, intended audience, and any identity constraints.
Save outputs outside the repository.

Supported mascot types are `animal`, `character`, `abstract`, and `robot`.
Supported personality presets are `friendly`, `professional`, `playful`,
`technical`, and `approachable`; the visual medium itself may be specified in
natural language and is then locked across all five reference images.

The checked-in gallery demonstrates a five-pose contact sheet derived from the
Threads product identity. Use product facts and brand assets you are authorized
to transform for your own forward tests.

## 1. Verified reference set

```text
Use $product-to-mascot for Threads, a text-first social product built around
public conversation. Create one friendly loop-shaped character in soft felt,
with a small coral thread tail as its signature feature. Generate the verified
five-pose reference set under /absolute/path/to/brand-tests/mascot-reference.
```

Expected: a locked character bible, one primary reference, four named poses, a
1280 x 256 contact sheet, and a passing manifest.

Accept when:

- every pose keeps the same silhouette, face rule, palette, and signature feature;
- all five source images are at least 1024 x 1024;
- the contact sheet contains exactly five equal cells; and
- `mascot-manifest.json` reports a passing verification result.

## 2. Character-bible-only planning

```text
Use $product-to-mascot to define a mascot for a calm personal-finance app. Lock
the character bible first and stop before image generation so I can review it.
```

Expected: a reviewable identity contract without generated pose images.

## Boundary and failure tests

- Omit the product description: input validation must fail.
- Change the signature feature between poses: identity review must reject it.
- Supply fewer than five images: reference-set verification must fail.
- Supply an undersized pose: verification must report the exact file.
- Request a one-off illustration with no reusable identity need: use a general
  image-generation request instead of this Skill.
