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
| <img src="feature-to-icons/examples/social-publishing-outline/icon-family-preview.png" alt="Social publishing outline icon family" width="560"> | <img src="product-to-mascot/examples/generated/threads-mascot-contact-sheet.png" alt="Five-pose brand mascot contact sheet" width="560"> |
| 3–20 features → one consistent, editable SVG family | Product facts → character bible and five reference poses |
| [`$feature-to-icons`](feature-to-icons/) | [`$product-to-mascot`](product-to-mascot/) |

The gallery uses one recognizable input to make each transformation easy to
judge. Threads is a trademark of Meta Platforms, Inc.; these are unofficial
demonstrations and this project is not affiliated with or endorsed by Meta.

## Install

Install from the published repository with the standard Skills CLI:

```bash
npx skills add AlbertAZ1992/creator-brand-skills
```

The interactive flow lets you choose one or more Skills, supported agents, and
installation scope. After installation, start a new Codex task and use a short
request:

```text
Use $logo-to-clay to turn this logo into clay.
```

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

## What each Skill delivers

| Skill | Input | Verified deliverables |
| --- | --- | --- |
| [`logo-to-clay`](logo-to-clay/) | Logo or icon | Clay render prompt and/or OBJ, MTL, 1024 px preview, manifest |
| [`image-to-sticker`](image-to-sticker/) | Logo, wordmark, icon, badge | 512/1024/2048 px transparent sticker, alpha proof, source card, manifest |
| [`feature-to-icons`](feature-to-icons/) | 3–20 product features | Phosphor-backed SVG family, preview, provenance, optical metrics, manifest |
| [`product-to-mascot`](product-to-mascot/) | Product facts | Character bible, primary reference, four poses, contact sheet, manifest |

Each Skill locks source facts before generation, then applies task-specific
finishing and artifact checks:

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
