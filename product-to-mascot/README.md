# Product to Mascot

Turn product semantics into a reusable brand character. The skill first locks a
character bible, then generates and reviews a primary reference plus four
consistent poses.

## The contract

```text
Product facts → character bible → primary reference → four pose references
              → contact-sheet review → verified mascot reference set
```

The primary reference and every pose must retain the same silhouette, face rule,
palette, signature feature, and illustration medium.

## Install

Install the published Skill globally for Codex:

```bash
npx skills add AlbertAZ1992/creator-brand-skills \
  --skill product-to-mascot --global --agent codex
```

## Use it

```text
Use $product-to-mascot for Seedling, a plant-care app for new houseplant owners.
Create a friendly character mascot in flat vector art. The watering can is a
signature feature. Generate the verified reference set.
```

Expected result: a `character-bible.json`, primary reference image, four named
poses, a contact sheet, and a manifest. A pose is retried only when it breaks a
locked identity rule; it is not regenerated merely to make a different-looking
variant.

## Deliverables

- `character-bible.json`
- `mascot-primary.png`
- `mascot-welcome.png`, `mascot-working.png`, `mascot-thinking.png`, and
  `mascot-celebrate.png`
- `mascot-contact-sheet.png`
- `mascot-manifest.json`

The contact-sheet helper needs ImageMagick:

```bash
brew install imagemagick
scripts/verify-mascot-reference-set.sh mascot-reference-set
```

## Verify

From the repository root:

```bash
./scripts/verify.sh product-to-mascot
```

`verify` runs lint, formatting, types, units, offline evals, and the real
deliverable check. `verify:deliverables` creates disposable reference fixtures and proves the
validator rejects missing or undersized inputs before producing the contact
sheet. The input, character-bible, and manifest contracts are in
[`schemas/`](schemas/).

## Scope

Use this skill when a product needs a consistent long-lived character. Use a
general image-generation request for an isolated character illustration.
