# Creator Brand Skills

**English** · [简体中文](README.zh-CN.md)

Four standalone Codex skills for turning brand inputs into reusable visual
assets. Each skill combines a focused workflow with reproducible evals and
artifact-level verification.

## Skills

| Skill | Input | Verified output |
| --- | --- | --- |
| [`logo-to-clay`](logo-to-clay/) | Logo or icon | Clay render prompt and/or OBJ, MTL, 1024 px preview, and manifest |
| [`image-to-sticker`](image-to-sticker/) | Simple logo, icon, badge, or flat artwork | One 512/1024/2048 px transparent sticker, alpha proof, source card, and manifest |
| [`feature-to-icons`](feature-to-icons/) | 3–20 product features | Phosphor-backed SVG family, previews, provenance, optical metrics, and manifest |
| [`product-to-mascot`](product-to-mascot/) | Product facts | Character bible, primary reference, four poses, contact sheet, and manifest |

`logo-to-clay`, `image-to-sticker`, and `feature-to-icons` form the core
visual-asset toolkit. `product-to-mascot` extends the suite into reusable brand
character systems.

## Requirements

- Codex or another compatible Skill runtime
- Node.js 22 and npm
- ImageMagick's `magick` command and `jq` for regenerating or fully verifying
  `image-to-sticker` examples

On macOS:

```bash
brew install imagemagick jq
```

## Install

Install from the published repository with the standard Skills CLI:

```bash
npx skills add AlbertAZ1992/creator-brand-skills
```

The interactive flow lets you select skills, supported agents, and installation
scope. To install all four globally for Codex without prompts:

```bash
npx skills add AlbertAZ1992/creator-brand-skills \
  --skill '*' --global --agent codex --yes
```

List the available skills or install only one:

```bash
npx skills add AlbertAZ1992/creator-brand-skills --list
npx skills add AlbertAZ1992/creator-brand-skills \
  --skill logo-to-clay --global --agent codex
```

For a one-off terminal session without keeping the Skill installed:

```bash
npx skills use AlbertAZ1992/creator-brand-skills@logo-to-clay --agent codex
```

Start a new Codex task, or restart Codex if an installed Skill does not appear
immediately. Skills that use the local TypeScript runtime prepare their locked
dependencies and build output on first use.

## Try the core skills

Users do not need to describe every option. Attach the required source and use
one short request:

```text
Use $logo-to-clay to turn this logo into clay.
```

```text
Use $image-to-sticker to turn this image into a sticker.
```

```text
Use $feature-to-icons to make icons for Search, Filters, Team Sharing, and
Cloud Sync.
```

Each Skill infers documented defaults. Name a material, output mode, or
design-system choice only when it matters. Read the individual Skill README
for request modes and options; use [`examples/`](examples/) for copy-ready
forward tests and acceptance checks.

## Core output previews

### Logo to Clay · generated image route

![Generated clay logo render](logo-to-clay/examples/generated/clay-render.png)

### Logo to Clay · verified mesh route

![Verified object and relief mesh previews](logo-to-clay/examples/generated/mesh-forms.png)

### Image to Sticker · styles

![Sticker style overview](image-to-sticker/examples/generated/style-overview.png)

### Image to Sticker · supported source types

![Transparent and flat-background sticker inputs](image-to-sticker/examples/generated/source-types.png)

## Feature to Icons preview

The generated icon families are embedded here so you can judge consistency
without opening a separate page.

### Product essentials · outline

![Product essentials outline icon family](feature-to-icons/examples/product-essentials-outline/icon-family-preview.png)

### Collaboration · filled

![Collaboration filled icon family](feature-to-icons/examples/collaboration-filled/icon-family-preview.png)

### Commerce · duotone

![Commerce duotone icon family](feature-to-icons/examples/commerce-duotone/icon-family-preview.png)

## Verify

Run all four release checks locally:

```bash
./scripts/verify.sh
```

Each package runs lint, formatting checks, strict TypeScript checks, unit
tests, prompt/behavior evals, and a real deliverable eval. The final evals
inspect files rather than merely matching expected prose:

- `logo-to-clay` checks OBJ geometry, MTL linkage, a 1024 px preview, and its
  manifest.
- `image-to-sticker` checks real RGBA transparency, corner alpha, visible
  coverage, an alpha proof, and its manifest.
- `feature-to-icons` checks exact feature coverage, pinned Phosphor provenance,
  SVG safety, optical metrics, editable files, PNG rasterization, and its
  manifest.
- `product-to-mascot` checks the character bible, five required reference
  images, a 1280 x 256 contact sheet, and its manifest.

GitHub Actions runs the same package-level verification on every push and pull
request.

## Reliability model

```text
source truth → task-specific spec → controlled generation
             → deterministic finishing → hard checks → proof → manifest
```

## Repository structure

```text
creator-brand-skills/
├── scripts/verify.sh        # reproduce verification for all or named skills
├── examples/                # copy-ready requests and acceptance checks
├── .github/workflows/       # package verification matrix
├── feature-to-icons/
├── image-to-sticker/
├── logo-to-clay/
└── product-to-mascot/
```

Every skill folder owns its `SKILL.md`, UI metadata, implementation, evals,
schemas, architecture notes, and package lock. There is intentionally no root
Node package or shared `node_modules`; the four skills remain independently
installable and testable.

## License

MIT. See [`LICENSE`](LICENSE).
