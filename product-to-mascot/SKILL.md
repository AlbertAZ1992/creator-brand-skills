---
name: product-to-mascot
description: Create a brand mascot and reusable character bible from a product description. Use when a product needs a consistent character across product, marketing, or stickers; not for a one-off illustration prompt.
---

# Product to Mascot

Create a mascot that is appealing enough to remember and strict enough to
survive reuse. The outcome is a selected direction, V2 character bible, and
verified reference images—not one generic character prompt.

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

### 2. Audition three directions

Use `buildMascotDirectionPrompt()` to propose three concise directions with
different product connections and outer silhouettes. Do not return three
recolours of one subject. If the user supplied a concrete subject, vary its
proportion, signature feature, and silhouette treatment instead.

When the user asks you to proceed without another decision, select the
simplest direction that communicates the product at 32 px and record why.

### 3. Write and lock a V2 character bible

Before generating images, create `character-bible.json` with:

- mascot name and one-sentence product connection;
- species/form, silhouette, proportions, face and eye rule;
- three to five exact palette colours;
- signature prop or motif and one memorable appeal hook;
- line, fill, texture, and rendering rules;
- three explicit avoids; and
- minimum size and clear-space rules.

Choose one primary visual grammar. A mascot may be friendly or technical, for
example, but it must not alternate between unrelated cartoon, 3D, anime, and
flat-vector identities. The bible becomes the source of truth for every pose in
this reference set.

The character must encode the product connection in its silhouette, signature
feature, prop system, or material—not only in its colour palette. Reject a
generic round creature with a logo pasted onto it. At least one locked visual
rule should still communicate the product role when the mascot is shown without
text or surrounding UI.

Use a hard complexity budget: four to seven large silhouette masses, one form
or species cue, one product cue, no more than three facial marks, short limbs,
and two character base colours plus one accent by default. Do not default to an
adult human silhouette, black body suit, tactical robot, or detailed costume.
Do not invent exact counts for tiny repeated decorations such as stitches,
dots, scales, or screws. Lock large identity anchors instead; preserve a tiny
exact count only when the user or supplied brand asset explicitly requires it.

### 4. Generate a reference set

Build the primary prompt with `buildPrimaryImagePrompt()`. It must show the
complete silhouette, proportions, signature feature, appeal hook, and neutral
pose on a simple opaque background. Review it at full size and 32 px before
generating anything else. Treat every user-supplied named count, side,
direction, colour, and shape as a hard identity check. A reference still fails
when an explicit supplied anchor changes, even when it otherwise looks attractive.

Then use `buildPoseImagePrompt()` to generate welcome, focused work,
thinking/help, and celebration individually. Attach the accepted primary as
the identity reference every time. Retry one pose once when it breaks a locked
rule; name the broken rule instead of asking for a generic improvement.

### 5. Verify and package

Run `scripts/verify-mascot-reference-set.sh <reference-dir>` after saving the
accepted files. It verifies that the required PNG files exist and are large
enough for downstream use, then writes a contact sheet. Review the contact
sheet at 64 px and reject any pose that no longer reads as the same character.

## Invariants

- Preserve the product facts and user-provided brand assets.
- Do not lock the first plausible concept without comparing three directions.
- Keep the same face rule, proportions, palette, signature feature, and medium
  across every pose.
- Keep the identity readable at the bible's declared minimum size; remove
  detail before adding decoration.
- Do not render text, logos, UI, or claims inside the mascot image unless the
  user supplies the exact copy.
- Do not claim that a mascot is locked until the bible and all five accepted
  reference images agree.
- Review the primary and contact sheet at full size and 64 px. Reject identity
  drift, prop substitution, inconsistent rendering medium, unreadable gestures,
  or five poses that differ only by arm position without telling distinct usage
  stories.

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
