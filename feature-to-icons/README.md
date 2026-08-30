# Feature to Icons

Turn 3–20 product features into one consistent, editable, and validated SVG
icon family. The Skill deliberately uses two different routes: branded feature
art is original custom geometry, while compact system/UI controls use pinned
Phosphor icons. Stock glyphs are never decorated and presented as brand art.

The callable Codex Skill name is `feature-to-icons`.

<p align="center">
  <img src="examples/creator-studio-duotone/showcase-preview.png" alt="Creator Studio feature brief transformed into six original SVG icons" width="900">
</p>

The current gallery shows the source feature brief beside the actual verified
SVG outputs. It contains two original custom brand families and one undecorated
native Phosphor system family; retired auditions are not retained.

## At a glance

| Capability | Contract |
| --- | --- |
| **Best for** | Branded product-feature families and compact system/UI families that must not be confused with each other |
| **Input** | 3–20 unique feature names, with optional product context and explicit icon overrides |
| **Styles** | Custom outline, filled, or duotone brand art; native Phosphor light, regular, bold, fill, or duotone system glyphs |
| **Brand route** | Three original visual systems are auditioned on representative benefits before custom SVG geometry expands to the full family |
| **Presentation controls** | Primary/secondary colors and a 24, 32, or 48 px grid |
| **Output formats** | Editable SVG per feature, SVG/PNG family previews, normalized spec JSON, provenance JSON, and verification manifest JSON |
| **Core guarantee** | UI concepts stay clean and native; branded features get distinct silhouettes and original geometry instead of library glyphs with repeated decoration |

## What it does

```text
feature names → infer brand or system purpose
              → system: pinned Phosphor semantic search + one native weight
              → brand: three original custom auditions + selected visual system
              → SVG safety + optical checks
              → previews + provenance manifest
```

System icons preserve geometry reviewed by an established icon community.
Brand icons use custom geometry across the complete family: one material and
construction grammar, one restrained accent behavior, and a different
silhouette for every product benefit.

## Visual quality bar

The family must tell one product story, not merely collect individually valid
symbols. Prefer context-specific features, distinct silhouettes, comparable
visual volume, and metaphors that remain legible without labels. Do not promote
a technically passing family as a README visual before human approval.

## Requirements

- Codex or another compatible Skill runtime
- Node.js 22 and npm
- A request containing 3–20 unique feature names

The pinned `@phosphor-icons/core` and resvg packages work offline after install.
Only the explicitly selected custom-geometry route needs a capable model.

## Installation

Install the published Skill globally for Codex:

```bash
npx skills add AlbertAZ1992/creator-brand-skills \
  --skill feature-to-icons --global --agent codex
```

Start a new Codex task, or restart Codex if the Skill does not appear.

## Usage

A short request is enough:

```text
Use $feature-to-icons to make icons for Search, Filters, Team Sharing, and
Cloud Sync.
```

These common UI concepts are inferred as `system`: a 24 px, regular,
outline-style Phosphor family using `currentColor`, with no decorative tile.

### Create branded product-feature icons

```text
Use $feature-to-icons for Instant Build, Visual Diff, Bundle Health, Edge Ship,
and Team Handoff. The product is a playful web release workspace.
```

These story-like feature names are inferred as `brand`. Before expanding the
family, the Skill compares three original custom visual systems on
representative features at full size and 24 px. Say `purpose: system` or
`purpose: brand` to override inference.

### Brand and system are different products

| Route | Geometry source | Non-negotiable rule |
| --- | --- | --- |
| `brand` | Original SVG geometry for the complete family | Distinct silhouettes; no stock glyph, repeated circle, repeated card, or app-tile wrapper |
| `system` | Pinned `@phosphor-icons/core@2.1.1` | Preserve native geometry and one weight; add no marketing decoration |

### Add product context

```text
Use $feature-to-icons for Dashboard, Analytics, Reports, Users, Billing, and
API. The product is a cloud analytics platform for enterprise data teams.
```

Context helps choose among semantic candidates without changing the visual
source family.

### Make a filled family

```text
Use $feature-to-icons for Team Chat, File Sharing, Video Calls, Task Board, and
Calendar. Use filled icons, a 32 px grid, and #6366F1.
```

### Make a duotone family

```text
Use $feature-to-icons for Shopping Cart, Wishlist, Orders, Profile, and
Payment. Use duotone icons with #FF6B35 primary and #004E89 secondary.
```

### Resolve an ambiguous feature

If the catalog match is uncertain, the Skill returns candidates instead of
silently choosing an unrelated symbol. The user can answer naturally:

```text
Use the binoculars icon for Discovery and keep the rest of the family regular.
```

For Chinese or another non-Latin language, the Skill keeps the original feature
labels, translates each concept for catalog search, and records the selected
Phosphor icon as an explicit override. Unsupported terms fail with candidates
instead of silently receiving an unrelated alphabetical icon.

## Native system style mapping

| Request | Phosphor source weight | Geometry behavior |
| --- | --- | --- |
| Outline + light | `light` | Native Phosphor light geometry |
| Outline + regular | `regular` | Native Phosphor regular geometry |
| Outline + bold | `bold` | Native Phosphor bold geometry |
| Filled | `fill` | Native Phosphor fill geometry |
| Duotone | `duotone` | Native foreground/background geometry |

One output family never mixes source libraries or weights. Colors and the
export viewBox may change; source paths are not stretched, centered, or redrawn
individually.

## Example contracts

The [example index](examples/README.md) contains two original brand families
and one native Phosphor system family with exact input briefs, source metadata,
showcase boards, and passing manifests.

## Options

| Option | Values | Default | Library-first behavior |
| --- | --- | --- | --- |
| `features` | 3–20 unique names | Required | One SVG per feature |
| `purpose` | `brand`, `system` | Semantic inference | Original branded geometry or undecorated native glyph |
| `style` | `outline`, `filled`, `duotone` | `outline` | Controls custom style or native Phosphor system weight |
| `colors.primary` | Hex color | `currentColor` system; `#6C4CF6` brand | Main color |
| `colors.secondary` | Hex color | Style-dependent; `#F7DF1E` brand | Duotone or restrained brand accent |
| `gridSize` | `24`, `32`, `48` | `24` | Shared output viewBox |
| `strokeWidth` | Positive number | `2` | Exact custom stroke or native system-weight hint |
| `visualWeight` | `light`, `regular`, `bold` | `regular` | Custom visual weight or native outline weight |
| `cornerRadius` | `rounded`, `round`, `sharp` | `rounded` | Exact custom geometry; Phosphor preserves native corners |
| `productContext` | Product description | None | Improves semantic selection |

In system mode, stroke width and corner radius do not mutate individual
Phosphor paths. In brand mode they are exact family constraints.

## Output

```text
icon-output/
├── <feature>.svg
├── icon-spec.json
├── icon-metadata.json
├── icon-family-preview.svg
├── icon-family-preview.png
└── icon-family-manifest.json
```

- `icon-metadata.json` records the source icon, package version, weight,
  license, and whether geometry or presentation changed.
- The manifest records one source family for the set plus per-icon bounds,
  alpha-weighted center offset, ink ratio, optical volume, and warnings.
- Delivery rejects unsafe SVG, incorrect feature coverage, incompatible
  provenance, invisible icons, excessive center offset, undersized shapes, and
  insufficient padding.

## Developer API

```typescript
import {
  buildPrompt,
  deliverIconFamily,
  deliverPhosphorIconFamily,
  searchPhosphorIcons,
  validate,
} from "@creator-brand-skills/feature-to-icons";

const result = validate({ features: ["Search", "Team Sharing", "Cloud Sync"] });
if (!result.data) throw new Error(JSON.stringify(result.errors));

await deliverPhosphorIconFamily(result.data, "/absolute/path/to/icon-output");

// For an ambiguous feature:
const candidates = searchPhosphorIcons("Discovery");
```

For an explicit branded route, obtain the model response using the returned
prompt, then pass the SVG JSON through the same delivery gates:

```typescript
const branded = validate({
  purpose: "brand",
  features: ["Instant Preview", "Typed Confidence", "Tiny Bundles", "Edge Release"],
  colors: { primary: "#172A46", secondary: "#F7DF1E" },
  gridSize: 48,
});
if (!branded.data) throw new Error(JSON.stringify(branded.errors));
const prompt = buildPrompt(branded.data);
const rawSvgJson = await runCapableModel(prompt);
await deliverIconFamily(branded.data, rawSvgJson, "/absolute/path/to/release-icons");
```

`deliverPhosphorIconFamily()` rejects `purpose: brand` so library glyphs cannot
accidentally re-enter the branded route.

## How to test

```bash
./scripts/verify.sh feature-to-icons
```

The verification runs lint, formatting, type checking, build, unit tests,
prompt/input evals, a real deliverable test, and all 44 committed example SVGs.
It also verifies package provenance and optical metrics.

Regenerate the gallery from the checked custom example and pinned library
assets:

```bash
cd feature-to-icons
npm run examples
npm run verify:examples
```

## Limitations

- The Skill requires at least three features; it is not a single-icon exporter.
- Semantic retrieval can be ambiguous for private product vocabulary; those
  cases require a candidate choice or explicit override.
- Custom brand art requires a capable SVG-authoring model and human contact-sheet review.
- Purpose inference is conservative and can be overridden explicitly.
- Optical checks catch placement errors but cannot judge whether a metaphor is
  attractive or ownable; the brand contact sheet remains a human approval gate.
- It produces static SVGs and does not install them into an application.

Feature to Icons is MIT licensed. Library-backed artifacts use Phosphor Icons
2.1.1 under MIT; see [THIRD_PARTY_NOTICES.md](THIRD_PARTY_NOTICES.md).

Implementation details and the manifest contract are in
[`docs/architecture.md`](docs/architecture.md) and [`schemas/`](schemas/).
