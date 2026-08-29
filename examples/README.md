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

| Skill | First test | Full guide |
| --- | --- | --- |
| `feature-to-icons` | No source file required | [`feature-to-icons.md`](feature-to-icons.md) |
| `logo-to-clay` | Attach an SVG or PNG logo | [`logo-to-clay.md`](logo-to-clay.md) |
| `image-to-sticker` | Attach simple flat artwork | [`image-to-sticker.md`](image-to-sticker.md) |
| `product-to-mascot` | Describe a product | [`product-to-mascot.md`](product-to-mascot.md) |

These guides complement the embedded, checked-in visual galleries owned by
each Skill package.

## Automated verification

From the repository root:

```bash
./scripts/verify.sh
```

Automated verification uses disposable fixtures and does not call a paid image
model or publish assets.
