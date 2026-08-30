# Product to Mascot architecture

## Scale contract

```text
Product facts → 3 direction audition → V2 character bible → primary reference
              → 4 locked poses
              → contact-sheet review → manifest → reusable mascot set
```

The planning model first proposes three product-specific silhouettes. One is
selected before the V2 bible locks product connection, exact proportions,
appeal hook, face, palette, signature feature, medium, minimum size, and clear
space. The planner does not invent exact counts for tiny repeated marks because
those are fragile generation anchors; user-supplied counts remain hard checks.
Each later image uses the accepted primary as a reference.

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
| Direction audition | three distinct silhouettes and product connections | reject recolours or generic subjects |
| Character lock | complete V2 bible with proportions, appeal hook, palette, three avoids, and no invented micro-counts | refine bible before images |
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
