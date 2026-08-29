# Eval Framework

Offline evaluation for the product-to-mascot prompt generator. These tests verify that `validate()` and `buildPrompt()` produce correct output for a variety of product inputs, without requiring an AI model round-trip.

## Structure

```
eval/
  cases.ts    — Eval case definitions (input + expected assertions)
  run.ts      — Eval runner (validate → buildPrompt → assert)
  README.md   — This file
```

## How It Works

Each eval case defines:

- **input**: Raw parameters passed to `validate()` then `buildPrompt()`
- **expectedPromptContains**: Keywords that MUST appear in the generated prompt (case-insensitive)
- **expectedPromptNotContains**: Keywords that MUST NOT appear in the generated prompt (case-insensitive)
- **expectValid**: Whether validation should pass or fail

The runner executes cases in order and reports pass/fail with detailed failure messages.

## Running Eval

```bash
# From project root
npx tsx eval/run.ts
```

## Case Coverage

| # | Name | What It Tests |
|---|---|---|
| 1 | SaaS product, friendly, character | Friendly→Caregiver mapping, character type guidance |
| 2 | Dev tool, technical, robot | Technical→Sage mapping, robot type guidance |
| 3 | Consumer app, playful, animal | Playful→Jester mapping, animal type guidance |
| 4 | Enterprise, professional, abstract | Professional→Ruler mapping, abstract type guidance |
| 5 | Local business, approachable, character | Approachable→Everyman mapping |
| 6 | Minimal input | Default behavior with bare-minimum input |
| 7 | Detailed input (all fields) | Full field passthrough + variation count |
| 8 | 3 variations | Minimum variation count boundary |
| 9 | 8 variations | Maximum variation count boundary |
| 10 | Very technical description | Technical→Sage with domain-dense input |
| 11 | Whimsical/creative product | Playful→Jester with creative-domain input |
| 12 | Personality mapping: friendly | Verify all Caregiver keywords present, none conflicting |
| 13 | Personality mapping: technical | Verify all Sage keywords present, none conflicting |
| 14 | Invalid personality | Validation rejection |
| 15 | Invalid mascotType | Validation rejection |

## Adding New Cases

Add a new entry to the `cases` array in `cases.ts`:

```typescript
{
  name: 'Your case name',
  input: {
    productName: '...',
    productDescription: '...',
    personality: 'friendly',
    mascotType: 'character',
  },
  expectedPromptContains: ['warm', 'rounded', 'caregiver'],
  expectedPromptNotContains: ['corporate', 'cold'],
  expectValid: true,
}
```

## Design Notes

These evals test the deterministic parts of the pipeline: validation, prompt template assembly, and personality/mascot-type mappings. They do NOT test the AI model's output quality, which is inherently non-deterministic and requires human evaluation or LLM-as-judge approaches.