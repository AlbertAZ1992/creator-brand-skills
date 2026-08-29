# Product to Mascot architecture

## Scale contract

```text
Product facts → character bible → primary reference → 4 locked poses
              → contact-sheet review → manifest → reusable mascot set
```

The planning model may propose the character bible, but it must be accepted
before any pose generation. Each later image uses that accepted bible and the
primary reference. This prevents each generation from independently inventing a
new mascot.

## Repository structure

```text
SKILL.md                               Runtime workflow and quality gates
agents/openai.yaml                     Discoverable UI metadata
schemas/input.schema.json              Input contract
schemas/character-bible.schema.json    Mascot identity contract
schemas/mascot-manifest.schema.json    Delivery contract
examples/                              Invocation and accepted output layout
src/                                   Prompt, parsing, and typed bible handoff
scripts/verify-mascot-reference-set.sh Real file and contact-sheet validator
scripts/eval-mascot-reference-set.sh   Disposable end-to-end deliverable eval
eval/                                  Offline semantic and prompt evals
tests/                                 Unit tests
```

## Gates

| Gate | Evidence | Failure action |
| --- | --- | --- |
| Product truth | stated facts separated from creative choices | remove unsupported claims |
| Character lock | complete bible with palette and three avoids | refine bible before images |
| Primary reference | full silhouette and signature feature match bible | targeted primary retry |
| Pose consistency | each of four named poses matches primary identity | retry only the drifting pose |
| Delivery | five PNGs are at least 512 px and contact sheet exists | reject incomplete set |

## Eval suite

- `npm test`: validation, prompt parsing, and typed character-bible handoff.
- `npx tsx eval/run.ts`: personality, mascot type, and prompt constraint cases.
- `npm run verify:deliverables`: creates temporary 1024 px references, runs the
  actual contact-sheet validator, and asserts the final 1280-by-256 proof.

Human review remains required for identity drift, unwanted text, and visual
quality. The file validator prevents falsely reporting a missing or undersized
reference set as complete.
