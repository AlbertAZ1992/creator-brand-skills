# Product to Mascot

Turn product semantics into a reusable product mascot and brand character
system. This open-source Agent Skill first locks a character bible, then helps
Codex generate and review a primary reference plus four consistent poses.

The callable Codex Skill name is `product-to-mascot`.

<p align="center">
  <img src="examples/generated/threads-mascot-contact-sheet.png" alt="Five-pose mascot contact sheet" width="900">
</p>

## At a glance

| Capability | Contract |
| --- | --- |
| **Best for** | A long-lived product or brand character that must remain recognizable across product, marketing, and stickers |
| **Required input** | Product name and factual product description |
| **Optional direction** | Audience, personality, mascot type, visual medium, palette, and existing brand assets |
| **Character types** | Animal, human-like character, abstract living form, or robot |
| **Output formats** | Character-bible JSON, five full-size reference PNGs, contact-sheet PNG, and verification manifest JSON |
| **Core guarantee** | Product facts are separated from creative choices, then silhouette, face, palette, signature feature, and medium are locked across every pose |

## The contract

```text
Product facts → character bible → primary reference → four pose references
              → contact-sheet review → verified mascot reference set
```

The primary reference and every pose must retain the same silhouette, face rule,
palette, signature feature, and illustration medium.

## Inputs and style controls

| Control | Supported choices |
| --- | --- |
| Mascot type | `animal`, `character`, `abstract`, or `robot` |
| Personality | `friendly`, `professional`, `playful`, `technical`, or `approachable` |
| Visual medium | One user-supplied or proposed medium, such as flat vector, felt, clay, or ink; the accepted medium is locked across the set |
| Palette | Three to five exact colors recorded in the character bible |
| Reference poses | Primary, welcome, focused work, thinking/help, and celebration |

Product name and factual description are required. Audience, personality,
mascot type, visual style, and existing brand assets are optional. When a
direction is omitted, the Skill proposes it from product semantics and records
the accepted choice before generating the pose set.

## Install

Install the published Skill globally for Codex:

```bash
npx skills add AlbertAZ1992/creator-brand-skills \
  --skill product-to-mascot --global --agent codex
```

## Use it

```text
Use $product-to-mascot for Threads, a text-first social product built around
public conversation. Create a friendly loop-shaped mascot in soft felt with a
small coral thread tail. Generate the verified reference set.
```

Expected result: a `character-bible.json`, primary reference image, four named
poses, a contact sheet, and a manifest. A pose is retried only when it breaks a
locked identity rule; it is not regenerated merely to make a different-looking
variant.

## Deliverables

```text
mascot-reference-set/
├── character-bible.json       product connection and locked identity rules
├── mascot-primary.png         accepted full-body master reference
├── mascot-welcome.png         welcoming pose
├── mascot-working.png         focused-work pose
├── mascot-thinking.png        thinking/help pose
├── mascot-celebrate.png       celebration pose
├── mascot-contact-sheet.png   five-pose visual consistency proof
└── mascot-manifest.json       source, palette, retries, files, and pass result
```

The final reference set always contains these five accepted poses. Concept
exploration may vary before the character bible is approved; it does not change
the fixed delivery contract.

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
deliverable check. `verify:deliverables` creates disposable reference fixtures
and proves the validator rejects missing or undersized inputs before producing
the contact sheet. The input, character-bible, and manifest contracts are in
[`schemas/`](schemas/).

The manifest only passes when all five PNG references exist, meet the minimum
size contract, and produce the expected contact sheet. Human review still owns
identity drift, unwanted text, and subjective visual quality.

## Scope

Use this skill when a product needs a consistent long-lived character. Use a
general image-generation request for an isolated character illustration.

The README contact sheet is an unofficial transformation example inspired by
the Threads product identity. Threads is a trademark of Meta Platforms, Inc.;
this project is not affiliated with or endorsed by Meta. See
[`THIRD_PARTY_NOTICES.md`](THIRD_PARTY_NOTICES.md).
