---
name: product-to-mascot
description: Create a brand mascot and reusable character bible from a product description. Use when a product needs a consistent character across product, marketing, or stickers; not for a one-off illustration prompt.
---

# Product to Mascot

Create a mascot that can survive reuse. The outcome is a locked character bible
and verified reference images, not just a poetic concept or a list of prompts.

## Inputs

- Product name and factual product description.
- Optional audience, personality, mascot type, visual style, and brand palette.
- Optional existing logo or brand asset. Inspect it before using it as a visual
  reference; do not alter its distinctive contours without permission.

Use this skill for a product or brand character. Do not use it to create a
generic avatar, imitate a named studio or living artist, or redraw an existing
mascot with no product context.

## Workflow

### 1. Extract the product truth

Identify the product's role, audience, core benefit, and three to five brand
attributes. Distinguish facts supplied by the user from creative choices. Do not
invent product capabilities, claims, or cultural associations.

### 2. Write and lock a character bible

Before generating images, create `character-bible.json` with:

- mascot name and one-sentence product connection;
- species/form, silhouette, proportions, face and eye rule;
- three to five exact palette colours;
- signature prop or motif and permitted pose range;
- line, fill, texture, and rendering rules;
- three explicit avoids; and
- minimum size and clear-space rules.

Choose one primary visual grammar. A mascot may be friendly or technical, for
example, but it must not alternate between unrelated cartoon, 3D, anime, and
flat-vector identities. The bible becomes the source of truth for every pose in
this reference set.

### 3. Generate a reference set

Generate a primary full-body reference image first. It must show the complete
silhouette, signature feature, palette, and neutral pose on a simple opaque
background. Review it against the bible before generating anything else.

Then generate four reference poses individually: welcome, focused work,
thinking/help, and celebration. Use the accepted primary reference and the same
bible for each pose. Do not use a single multi-character sheet as the master
asset. Retry one pose once when it changes silhouette, face, palette, signature
prop, or medium; make the retry instruction specific to that failure.

### 4. Verify and package

Run `scripts/verify-mascot-reference-set.sh <reference-dir>` after saving the
accepted files. It verifies that the required PNG files exist and are large
enough for downstream use, then writes a contact sheet. Review the contact
sheet at 64 px and reject any pose that no longer reads as the same character.

## Invariants

- Preserve the product facts and user-provided brand assets.
- Keep the same face rule, proportions, palette, signature feature, and medium
  across every pose.
- Keep each pose readable at 64 px; remove detail before adding decoration.
- Do not render text, logos, UI, or claims inside the mascot image unless the
  user supplies the exact copy.
- Do not claim that a mascot is locked until the bible and all five accepted
  reference images agree.

## Deliverables

Deliver a directory containing:

- `character-bible.json`;
- `mascot-primary.png`;
- `mascot-welcome.png`, `mascot-working.png`, `mascot-thinking.png`, and
  `mascot-celebrate.png`;
- `mascot-contact-sheet.png`;
- `mascot-manifest.json` with source, palette, accepted poses, retries, and
  validation result.

Report absolute paths, the core character rule, any targeted retry, and whether
the reference set passed review.
