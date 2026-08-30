# Creator Brand Skills examples and forward tests

This directory contains copy-ready Codex requests organized by Skill. Each
example states the input, request, expected behavior, and acceptance check so a
user can test one route at a time.

## Start here

1. Install the Skill from the repository root.
2. Start a new Codex task.
3. Attach the required source image, if any.
4. Copy one request from the relevant guide.
5. Save test output outside the repository until it has been reviewed.

| Skill | Public source → output proof | Full guide |
| --- | --- | --- |
| `logo-to-clay` | [Flat Vite/JS logos → clay renders + verified OBJ previews](../logo-to-clay/examples/generated/source-to-clay.png) | [`logo-to-clay.md`](logo-to-clay.md) |
| `image-to-sticker` | [Six flat logos → six transparent PNG sticker treatments](../image-to-sticker/examples/generated/open-source-tech/source-to-sticker.png) | [`image-to-sticker.md`](image-to-sticker.md) |
| `feature-to-icons` | [20 feature names → 20 hand-drawn animated SVGs](../feature-to-icons/examples/creator-doodle-animated/showcase-preview.png) | [`feature-to-icons.md`](feature-to-icons.md) |
| `product-to-mascot` | [OpenPatch product facts → five-pose Pip system](../product-to-mascot/examples/generated/openpatch-pip/source-to-mascot.png) | [`product-to-mascot.md`](product-to-mascot.md) |

These guides complement the embedded, checked-in visual galleries owned by
each Skill package.

## Automated verification

From the repository root:

```bash
./scripts/verify.sh
```

Automated verification uses disposable fixtures and does not call a paid image
model or publish assets.
