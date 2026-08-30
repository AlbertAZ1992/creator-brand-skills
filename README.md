<div align="center">

# Creator Brand Skills

### Four open-source Agent Skills for turning product inputs into finished brand assets.

Clay logo renders and OBJ meshes · transparent PNG stickers · editable SVG
icon families · reusable product mascots

[![Verify](https://github.com/AlbertAZ1992/creator-brand-skills/actions/workflows/verify.yml/badge.svg)](https://github.com/AlbertAZ1992/creator-brand-skills/actions/workflows/verify.yml)
[![MIT License](https://img.shields.io/badge/license-MIT-17142c.svg)](LICENSE)
[![Agent Skills](https://img.shields.io/badge/Agent%20Skills-4-5b4bdb.svg)](#four-skills-one-production-toolkit)

**English** · [简体中文](README.zh-CN.md) · [Install](#install) ·
[Outputs](#input--result--production-files) · [Verify](#verify-locally)

</div>

## Four Skills, one production toolkit

| **01 · Logo to Clay** | **02 · Image to Sticker** |
| :---: | :---: |
| <img src="logo-to-clay/examples/generated/vite-bolt/clay-render.png" alt="Vite bolt rendered as a dimensional purple and blue clay campaign object" width="560"> | <img src="image-to-sticker/examples/generated/open-source-tech/sticker-wall.png" alt="Open-source technology marks rendered as a varied transparent sticker wall" width="560"> |
| Vite bolt → campaign render + verified 5,388-vertex OBJ | 11 varied sources → crisp transparent PNG stickers with alpha proof |
| [`$logo-to-clay`](logo-to-clay/) | [`$image-to-sticker`](image-to-sticker/) |

| **03 · Feature to Icons** | **04 · Product to Mascot** |
| :---: | :---: |
| **Visual candidate stays in local review until approved.**<br><br>Brand benefits → original custom SVGs<br>System controls → native Phosphor | <img src="product-to-mascot/examples/generated/openpatch-pip/mascot-contact-sheet.png" alt="Pip, the OpenPatch patch fox, across five locked poses" width="560"> |
| No previous Orbit / Signal / Die-cut result is promoted here | OpenPatch facts → three directions → Pip character bible → five locked poses |
| [`$feature-to-icons`](feature-to-icons/) | [`$product-to-mascot`](product-to-mascot/) |

These approved images are production-route evidence, not isolated beauty
shots; the Feature to Icons position remains intentionally unfilled until its
new visual candidate is approved. Pip and Azi are repository-owned concepts.
Third-party technology marks appear only as clearly attributed transformation
fixtures; their names and marks remain the property of their respective owners,
with no affiliation implied.

### More approved runs

| **JavaScript · Logo to Clay** | **ALBERTAZ · Product to Mascot** |
| :---: | :---: |
| <img src="logo-to-clay/examples/generated/javascript/clay-render.png" alt="JavaScript letter mark rendered as thick yellow clay" width="560"> | <img src="product-to-mascot/examples/generated/albertaz-azi/mascot-contact-sheet.png" alt="Azi, the ALBERTAZ folded swift mascot, across five locked poses" width="560"> |
| Yellow campaign render + standalone object + relief | Folded-paper swift + locked five-pose identity system |

Marketing boards remain separate from clean deliverables and machine-checkable
proof. Every board is built from outputs produced by the route its Skill
documents.

## Start with one sentence

| Goal | Paste into Codex |
| --- | --- |
| Make a clay logo | `Use $logo-to-clay to turn this logo into a refined clay render and OBJ mesh.` |
| Make a sticker | `Use $image-to-sticker to turn this artwork into a transparent contour sticker.` |
| Build an icon family | `Use $feature-to-icons to make consistent SVG icons for these product features.` |
| Design a mascot | `Use $product-to-mascot to turn these product facts into a reusable mascot system.` |

## Input → result → production files

| Skill | Give it | Review this result | Keep these files and proof |
| --- | --- | --- | --- |
| [`logo-to-clay`](logo-to-clay/) | One simple SVG/PNG logo, plus optional form, colour, depth, and background choices | Source-locked campaign render with visible clay depth; standalone object or relief mesh preview | Final image prompt/render; OBJ, MTL, bump PNG, 1024 px preview, geometry manifest |
| [`image-to-sticker`](image-to-sticker/) | One transparent or flat-background logo, icon, wordmark, badge, or flat illustration | Complete source as a transparent die-cut sticker; optional contour colour, tilt, and four deterministic finishes | RGBA `sticker.png`, alpha proof, reproducible source card, topology/provenance manifest |
| [`feature-to-icons`](feature-to-icons/) | 3–20 feature names, product context, optional palette and style; source overrides for system glyphs | System glyphs stay native; brand benefits audition three original custom systems before expanding one | One editable SVG per feature, spec/provenance JSON, SVG/PNG preview, optical manifest |
| [`product-to-mascot`](product-to-mascot/) | Product facts plus optional audience, personality, mascot type, medium, palette, or existing logo | Three genuinely different silhouettes, then one selected identity shown in five recognisable usage poses | V2 character bible, five full-size PNGs, 64 px contact-sheet review, verification manifest |

## Why the outputs hold up

| **Source-locked** | **Production-ready** | **Verified** |
| :---: | :---: | :---: |
| Locks the supplied logo, artwork, feature meaning, or product facts before creative work starts | Returns real RGBA, SVG, OBJ/MTL, PNG, and JSON assets—not only a prompt or mockup | Runs alpha, geometry, provenance, optical, or identity checks and records the result |

```text
source truth → task spec → controlled generation
             → deterministic finishing → hard checks → proof → manifest
```

This boundary matters. The generated clay image can be expressive while the
OBJ route remains deterministic. Sticker materials can look different while
alpha geometry stays unchanged and small-viewBox SVGs stay crisp. Icons keep
system controls undecorated on one pinned library while brand benefits require
original custom geometry and distinct silhouettes. Mascot
poses vary only after three directions are compared and the V2 identity
contract is locked.

## See the breadth, then inspect the proof

| Skill | Portfolio view | Verification view |
| --- | --- | --- |
| Logo to Clay | [Vite bolt and JavaScript clay renders with verified 3D assets](logo-to-clay/examples/) | OBJ faces, material linkage, 1024 px preview, passing manifest |
| Image to Sticker | [Open-source technology wall and focused Vite + React pair](image-to-sticker/examples/) | Transparent asset, grayscale alpha proof, topology and provenance manifest |
| Feature to Icons | [Technical contract fixtures; marketing visual pending approval](feature-to-icons/examples/) | One SVG per feature, source boundary, optical metrics, zero hidden fallback |
| Product to Mascot | [Pip, Azi, and Mori verified five-pose systems](product-to-mascot/examples/) | Character bible, five full-size references, contact sheet, passing manifest |

## Install

Install from the published repository with the standard Skills CLI:

```bash
npx skills add AlbertAZ1992/creator-brand-skills
```

The interactive flow lets you choose one or more Skills, supported agents, and
installation scope. Start a new Codex task after installation.

<details>
<summary><strong>Install all four, install one, or use a Skill once</strong></summary>

```bash
# Install all four globally for Codex
npx skills add AlbertAZ1992/creator-brand-skills \
  --skill '*' --global --agent codex --yes

# List or install one Skill
npx skills add AlbertAZ1992/creator-brand-skills --list
npx skills add AlbertAZ1992/creator-brand-skills \
  --skill image-to-sticker --global --agent codex

# Run once without keeping it installed
npx skills use AlbertAZ1992/creator-brand-skills@logo-to-clay --agent codex
```

</details>

## Verify locally

```bash
./scripts/verify.sh
```

This runs lint, formatting, strict TypeScript checks, unit tests, behaviour
evals, committed-example checks, and real deliverable validation for all four
Skills. GitHub Actions runs the same package-level verification.

Requirements: Node.js 22 and npm. Regenerating every visual example also needs
ImageMagick and `jq` (`brew install imagemagick jq`). Each Skill folder owns its
`SKILL.md`, UI metadata, implementation, schemas, evals, and examples, so the
four packages remain independently installable.

## License

MIT. See [`LICENSE`](LICENSE). Package-specific third-party code notices are in
[`THIRD_PARTY_NOTICES.md`](THIRD_PARTY_NOTICES.md).
