---
name: logo-to-clay
description: Transform a logo into a refined clay-style 3D render or 3D mesh asset. Use when user wants to create a clay version of a logo or icon — either a quick image render or a real OBJ 3D model.
---

# Logo to Clay

Turn a flat logo into clay. The two delivery routes are:

- **Clay Render** — fast, AI-generated refined clay image (via DALL-E/FLUX/Midjourney)
- **Clay Asset** — real 3D OBJ mesh with a clay material (procedural, no AI image model needed)

Delivery route is not a style selector. The public 3D form API has exactly two
values: `object` and `relief`. Do not expose or claim `badge`, `freestanding`,
`subtle`, or `handmade` as modes.

## How You Should Work

When a user asks you to clay-ify a logo, follow this process:

### Step 1: Understand what they want

Extract intent from their natural language. Map their words to parameters:

| They say                                        | You infer                       |
| ----------------------------------------------- | ------------------------------- |
| "快速做一张黏土图" / "clay render"              | `output: 'image'`               |
| "做成 3D 模型" / "导出 mesh" / "OBJ"            | `output: 'mesh'`                |
| 没说输出形式                                    | `output: 'both'`                |
| "独立的" / "黏土物件" / "object"                  | `shape: 'object'`               |
| "浮雕" / "relief" / "牌匾"                        | `shape: 'relief'`               |
| "透明背景" / "png" / "抠图"                     | `background: 'transparent'`     |
| "正常背景" / "摄影棚" / "studio"                | `background: 'studio'`          |
| 指定颜色了（"偏暖的土色"）                      | `clayColor: '#C4956A'`          |
| 没说颜色                                        | 用 auto（LLM 从 logo 分析主色） |

### Step 2: Validate

Resolve this Skill's directory from the loaded `SKILL.md`. Before importing the
runtime, check for `dist/src/index.js`. If it is missing, run `npm ci` followed
by `npm run build` in that directory. This is first-use runtime preparation;
do not ask the user to clone the repository or run a repository installer.

```typescript
import { validate } from "./dist/src/index.js";
const { options, errors } = validate({ logoPath, ...inferredParams });
if (errors.length > 0) {
  /* report to user, ask for clarification */
}
```

### Step 3: Execute

**If `output: 'image'` or `output: 'both'`:**

```typescript
import { buildPrompt } from "./dist/src/index.js";
const prompt = buildPrompt(options);
// Send `prompt` + logo image to image generation API (DALL-E, FLUX, etc.)
// Return the generated image to user
```

**If `output: 'mesh'` or `output: 'both'`:**

```typescript
import { buildMesh } from "./dist/src/index.js";
const result = await buildMesh(options);
// result.meshPath → show OBJ file to user
// result.materialPath → show MTL file to user
// result.imagePath → show preview PNG to user
// result.manifestPath → show validation record to user
```

### Step 4: Report

Summarize what was generated and where files are saved.

## Parameters Reference

| Parameter    | Values                              | Default       | What it controls                                                                        |
| ------------ | ----------------------------------- | ------------- | --------------------------------------------------------------------------------------- |
| `logoPath`   | SVG or PNG path                     | _required_    | Simple visible logo silhouette                                                         |
| `outputDir`  | directory path                      | `outputs/`    | Where mesh deliverables are written                                                     |
| `output`     | `image` / `mesh` / `both`           | `both`        | What to generate                                                                        |
| `shape`      | `object` / `relief`                  | `object`      | object=standalone clay logo, relief=raised logo on a backing surface                    |
| `depth`      | number (mm)                         | `4`           | How thick the extrusion is                                                              |
| `clayColor`  | hex color                           | auto-detected | Clay material base color                                                                |
| `background` | `transparent` / `studio`            | `studio`      | Preview/rendering background                                                            |

## Clay Render Mode (image)

Generates a ~600-character prompt. Send it to an image model with the logo as reference.
The prompt covers one refined clay material, form description, background
preference, and constraints against chunky, cartoon, fingerprinted, or
low-poly results.

## Clay Asset Mode (mesh)

Procedural 3D pipeline — no AI image model required:

1. SVG → render at 1024 px → alpha/high-contrast foreground → closed contours
2. PNG → render at 512 px → alpha/high-contrast foreground → closed contours
3. Subtract enclosed background contours from the 2D foreground profile, then extrude it once
4. One refined PBR clay material (roughness 0.85, metalness 0) with a restrained bump map
5. Export the mesh and material, render a WebGL preview when available, and
   otherwise create a deterministic silhouette preview
6. Hard-validate OBJ geometry, MTL linkage, 1024px PNG, and manifest

For simple logos, enclosed counters such as `a`, `d`, `e`, and `@` are excluded
from both faces before extrusion. They remain open from front to back, with continuous
inner sidewalls and no floor.

Outputs to `outputs/` directory:

- `*-clay-mesh.obj` — 3D mesh, ready for Blender/Three.js/Unity
- `*-clay-clay.mtl` — matching clay material referenced by the OBJ
- `*-clay-bump.png` — 512 × 512 clay surface map referenced by the MTL
- `*-clay-preview.png` — 1024 × 1024 rendered or deterministic fallback preview
- `*-clay-manifest.json` — source/spec, artifact paths, and validation evidence

## Guardrails

- Clay asset mode traces the visible SVG/PNG silhouette. It supports SVG
  primitives, arcs, transforms, and compound fills through rasterization, but
  does not claim mathematically exact source-vector geometry.
- If no foreground can be found, fail clearly. Never substitute a square or
  another invented logo.
- Never report mesh mode complete unless `result.validation.passed` is true.
- Image mode returns a constrained reference-image prompt; the calling agent
  still owns image-model invocation and must return the generated image.
- Never make the output look glossy, metallic, or CGI-perfect.
- Never add a fingerprint or tool-mark treatment. The single shared material
  is smooth, matte clay with restrained micro-variation.
- `object` and `relief` are the only 3D forms. `image`, `mesh`, and `both`
  choose deliverables, not visual styles.
