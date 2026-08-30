# Feature to Icons forward tests

The checked-in [example gallery](../feature-to-icons/examples/) contains three
current source-brief-to-output families: two original brand systems and one
native Phosphor system family. Save ad-hoc test outputs outside the repository.

## 1. Original brand route

```text
Use $feature-to-icons for Instant Preview, Typed Confidence, Component Canvas,
Tiny Bundles, Living Docs, and Edge Release. This is a playful open-source web
release studio. Create original duotone brand feature art on a 48 px grid.
```

Expected: six distinct custom SVG silhouettes sharing one material, stroke,
accent rule, and optical volume. No stock icon may be decorated and presented
as branded feature art.

## 2. Creator Studio route

```text
Use $feature-to-icons for Idea Spark, Visual Compose, Brand System, Smart
Export, Asset Library, and Launch Story. The product is a warm editorial
creation studio for independent makers.
```

Expected: an original six-icon family whose metaphors remain recognisable at
24 px and whose manifest records custom geometry with no optical warnings.

## 3. Native system route

```text
Use $feature-to-icons for Source Code, Pull Requests, Issue Tracking, CI
Workflows, Packages, and Releases. These are compact controls for a developer
platform, so use one 32 px regular outline system family.
```

Expected: one pinned Phosphor weight, explicit semantic matches, no decorative
tile or badge wrapper, editable SVGs, family previews, provenance metadata, and
a passing optical manifest.

## 4. Ambiguous semantic match

```text
Use $feature-to-icons for Discovery, Exploration, and Research. Show the source
choices before delivery if any match is ambiguous.
```

Expected: candidate icon names are exposed instead of an invented or
alphabetical fallback.

## Boundary and failure tests

- Request 3 or 20 unique features: accepted.
- Request 2 or 21 features: rejected with a count error.
- Repeat a feature with different casing: rejected as a duplicate.
- Return text-bearing, scripted, external, or raster SVG: rejected.
- Omit or add one feature: exact-coverage validation rejects the family.
- Mix icon libraries or native weights inside a system family: rejected.
