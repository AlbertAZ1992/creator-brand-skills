# Feature to Icons forward tests

The checked-in [example gallery](../feature-to-icons/examples/) contains one
current 20-icon hand-drawn family with a source brief, actual SVG outputs,
static previews, a playable motion preview, and a passing manifest.

## 1. Default hand-drawn animated route

```text
Use $feature-to-icons for Capture Idea, Sketch Fast, Build Palette, Shape Story,
Record Moment, Collect Notes, Save Favorite, Share Draft, Team Chat, Pin
Reference, Plan Drop, Upload Asset, Download Kit, Launch Project, Publish
Worldwide, Protect Work, Add Magic, Score Sound, Reward Fans, and Take a Break.
The product is a playful independent creator toolkit.
```

Expected: twenty original 48 px SVGs with gently imperfect curves, round 2.6 px
strokes, a shared accent language, distinct silhouettes, embedded subtle wiggle
motion, and a reduced-motion fallback.

## 2. Static doodle route

```text
Use $feature-to-icons for Draft, Review, Approve, Publish, and Archive. Keep the
hand-drawn style but use motion none.
```

Expected: original custom doodle geometry without animation markers. Static
SVG, PNG, and HTML previews still contain exact feature coverage.

## 3. Explicit native system route

```text
Use $feature-to-icons for Search, Settings, Notifications, Profile, and Help.
These are compact 24 px controls: purpose system, motion none, regular outline.
```

Expected: one pinned Phosphor weight, explicit semantic matches, no doodle
treatment, no motion, no decorative wrapper, and complete provenance.

## Boundary and failure tests

- Request 3 or 20 unique features: accepted.
- Request 2 or 21 features: rejected.
- Repeat a feature with different casing: rejected.
- Return text-bearing, scripted, external, raster, or event-bearing SVG: rejected.
- Omit or add a feature: exact-coverage validation rejects the family.
- Omit hand-drawn or animation markers in the default route: rejected.
- Omit `prefers-reduced-motion` from an animated SVG: rejected.
- Mix icon libraries or native weights inside a system family: rejected.
