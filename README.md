<div align="center">

# Creator Brand Skills

### One brand input. Four reusable visual systems.

Turn a logo, image, feature list, or product idea into production-ready visual
assets with Codex.

**English** · [简体中文](README.zh-CN.md) · [Install](#install) ·
[Verify](#verify-locally)

</div>

## Four skills, one toolkit

| **01 · Logo to Clay** | **02 · Image to Sticker** |
| :---: | :---: |
| <img src="logo-to-clay/examples/generated/clay-render.png" alt="Threads wordmark transformed into dark clay" width="560"> | <img src="image-to-sticker/examples/generated/recommended-preview.png" alt="Threads wordmark transformed into a transparent contour sticker" width="560"> |
| Logo or icon → clay render or real OBJ mesh | Flat image → transparent, source-faithful sticker |
| [`$logo-to-clay`](logo-to-clay/) | [`$image-to-sticker`](image-to-sticker/) |

| **03 · Feature to Icons** | **04 · Product to Mascot** |
| :---: | :---: |
| <img src="feature-to-icons/examples/social-publishing-outline/icon-family-preview.png" alt="Social publishing outline icon family" width="560"> | <img src="product-to-mascot/examples/generated/threads-mascot-preview.png" alt="Two poses from a five-pose brand mascot system" width="560"> |
| 3–20 features → one consistent, editable SVG family | Product facts → character bible and five reference poses |
| [`$feature-to-icons`](feature-to-icons/) | [`$product-to-mascot`](product-to-mascot/) |

The gallery uses one recognizable input to make each transformation easy to
judge. Threads is a trademark of Meta Platforms, Inc.; these are unofficial
demonstrations and this project is not affiliated with or endorsed by Meta.

## Try a Skill

| Goal | Copy this into Codex |
| --- | --- |
| Make a clay logo | `Use $logo-to-clay to turn this logo into a polished clay render.` |
| Make a sticker | `Use $image-to-sticker to turn this image into a transparent contour sticker.` |
| Build an icon family | `Use $feature-to-icons to make consistent SVG icons for these product features.` |
| Design a mascot | `Use $product-to-mascot to turn these product facts into a reusable brand mascot.` |

## Install

Install from the published repository with the standard Skills CLI:

```bash
npx skills add AlbertAZ1992/creator-brand-skills
```

The interactive flow lets you choose one or more Skills, supported agents, and
installation scope. After installation, start a new Codex task and use one of
the requests above.

<details>
<summary><strong>Install all four, install one, or use a Skill once</strong></summary>

Install all four globally for Codex:

```bash
npx skills add AlbertAZ1992/creator-brand-skills \
  --skill '*' --global --agent codex --yes
```

List the available Skills or install only one:

```bash
npx skills add AlbertAZ1992/creator-brand-skills --list
npx skills add AlbertAZ1992/creator-brand-skills \
  --skill image-to-sticker --global --agent codex
```

Run one Skill without keeping it installed:

```bash
npx skills use AlbertAZ1992/creator-brand-skills@logo-to-clay --agent codex
```

</details>

## Production outputs, clearly specified

| Skill | Supported input | Styles and controls | Files you receive |
| --- | --- | --- | --- |
| [`logo-to-clay`](logo-to-clay/) | Simple SVG or PNG logo | Image, mesh, or both; standalone object or relief; studio or transparent background; color and depth | Generated raster + prompt; OBJ, MTL, bump PNG, 1024 px preview, manifest JSON |
| [`image-to-sticker`](image-to-sticker/) | Transparent or flat-background logo, wordmark, icon, badge, or flat illustration | Borderless or 0–64 px contour; custom color; original, holographic, glitter, or reflective finish; ±15° tilt; 512/1024/2048 px | Transparent RGBA PNG, alpha-proof PNG, reproducible source-card JSON, manifest JSON |
| [`feature-to-icons`](feature-to-icons/) | 3–20 feature names plus optional product context, including non-Latin labels | Outline light/regular/bold, filled, or duotone; custom colors; 24/32/48 px grid | One editable SVG per feature, spec and provenance JSON, SVG/PNG family preview, optical-check manifest JSON |
| [`product-to-mascot`](product-to-mascot/) | Product facts plus optional audience, personality, mascot type, visual medium, and palette | One locked character system; primary, welcome, working, thinking, and celebration poses | Character-bible JSON, five reference PNGs, contact-sheet PNG, verification manifest JSON |

## Why this toolkit is different

| **Source-faithful** | **Production-ready** | **Verified** |
| :---: | :---: | :---: |
| Locks logo geometry, artwork, feature meaning, or character identity before transformation | Returns real RGBA, SVG, OBJ/MTL, PNG, and JSON assets—not just a prompt or mockup | Runs task-specific alpha, geometry, provenance, optical, or identity checks and records the result in a manifest |

The shared delivery pattern is:

```text
source truth → task spec → controlled generation
             → deterministic finishing → hard checks → proof → manifest
```

## Verify locally

```bash
./scripts/verify.sh
```

This runs lint, formatting, strict TypeScript checks, unit tests, behavior
evals, and real deliverable validation for all four Skills. GitHub Actions runs
the same package-level checks on every push and pull request.

<details>
<summary><strong>Requirements and repository structure</strong></summary>

Requirements:

- Codex or another compatible Skill runtime
- Node.js 22 and npm
- ImageMagick and `jq` when regenerating every visual example

```bash
brew install imagemagick jq
```

```text
creator-brand-skills/
├── scripts/verify.sh
├── examples/
├── .github/workflows/
├── feature-to-icons/
├── image-to-sticker/
├── logo-to-clay/
└── product-to-mascot/
```

Every Skill folder owns its `SKILL.md`, UI metadata, implementation, evals,
schemas, examples, and package lock. There is no shared root Node package, so
the four Skills remain independently installable and testable.

</details>

## License

MIT. See [`LICENSE`](LICENSE). Third-party demonstration assets are documented
in [`THIRD_PARTY_NOTICES.md`](THIRD_PARTY_NOTICES.md).
