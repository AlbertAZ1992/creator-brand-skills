/**
 * Eval runner for feature-to-icons.
 *
 * Two phases:
 *   Phase 1 -- Prompt structure: run validate() + buildPrompt(), check string expectations.
 *   Phase 2 -- SVG template check: verify the prompt encodes correct SVG parameters.
 *
 * Usage: npx tsx eval/run.ts
 */

import { cases, type EvalCase } from "./cases.js";
import { validate, buildPrompt } from "../src/index.js";
import type { FeatureIconInput } from "../src/types.js";

interface CaseResult {
  name: string;
  passed: boolean;
  failures: string[];
}

function runPromptAssertions(c: EvalCase): string[] {
  const failures: string[] = [];

  // Phase 1: Validate input
  const validation = validate(c.input);
  if (validation.errors) {
    failures.push(`validate() returned errors: ${JSON.stringify(validation.errors)}`);
    return failures;
  }

  const validInput = validation.data as FeatureIconInput;

  // Phase 2: Build prompt
  const prompt = buildPrompt(validInput);

  // Check contains
  for (const expected of c.expectedPromptContains) {
    if (!prompt.includes(expected)) {
      failures.push(`prompt missing: "${expected}"`);
    }
  }

  // Check not-contains
  for (const notExpected of c.expectedPromptNotContains) {
    if (prompt.includes(notExpected)) {
      failures.push(`prompt should NOT contain: "${notExpected}"`);
    }
  }

  // Phase 3: SVG expectations
  if (c.svgExpectations) {
    const svg = c.svgExpectations;

    if (svg.strokeWidth !== undefined) {
      const search = `Stroke width: ${svg.strokeWidth}px`;
      if (!prompt.includes(search)) {
        failures.push(`SVG strokeWidth: prompt missing "${search}"`);
      }
    }

    if (svg.gridSize !== undefined) {
      const search = `${svg.gridSize}x${svg.gridSize}`;
      if (!prompt.includes(search)) {
        failures.push(`SVG gridSize: prompt missing "${search}"`);
      }
    }

    if (svg.cornerRadius !== undefined) {
      const expectedRadii: Record<string, string> = {
        sharp: "0px",
        rounded: "2px",
        round: "9999px",
      };
      const radiusValue = expectedRadii[svg.cornerRadius];
      if (radiusValue && !prompt.includes(radiusValue)) {
        failures.push(`SVG cornerRadius: prompt missing corner value "${radiusValue}"`);
      }
    }

    if (svg.visualWeight !== undefined) {
      const weightTerms: Record<string, string[]> = {
        light: ["light", "thinner strokes"],
        regular: ["regular", "balanced strokes"],
        bold: ["bold", "thicker strokes"],
      };
      const terms = weightTerms[svg.visualWeight] ?? [svg.visualWeight];
      const found = terms.some((t) => prompt.includes(t));
      if (!found) {
        failures.push(`SVG visualWeight: prompt missing weight term for "${svg.visualWeight}"`);
      }
    }

    if (svg.noText) {
      if (prompt.includes("<text") || prompt.includes("<text ")) {
        failures.push("SVG noText: prompt contains a <text> element");
      }
    }

    if (svg.viewBoxMatchesGrid && svg.gridSize !== undefined) {
      const expectedViewBox = `viewBox="0 0 ${svg.gridSize} ${svg.gridSize}"`;
      if (!prompt.includes(expectedViewBox)) {
        failures.push(`SVG viewBox: prompt missing "${expectedViewBox}"`);
      }
    }
  }

  return failures;
}

// ── Main ─────────────────────────────────────────────────────────

let total = 0;
let passed = 0;
const results: CaseResult[] = [];

console.log("feature-to-icons -- Eval Runner\n");
console.log(`Running ${cases.length} cases...\n`);

for (const c of cases) {
  total++;
  const failures = runPromptAssertions(c);
  const ok = failures.length === 0;

  results.push({ name: c.name, passed: ok, failures });

  if (ok) {
    passed++;
    console.log(`  PASS  ${c.name}`);
  } else {
    console.log(`  FAIL  ${c.name}`);
    for (const f of failures) {
      console.log(`        ${f}`);
    }
  }
}

console.log(`\n${passed}/${total} passed`);

if (passed < total) {
  console.log("\nFailures:");
  for (const r of results) {
    if (!r.passed) {
      console.log(`\n  ${r.name}`);
      for (const f of r.failures) {
        console.log(`    - ${f}`);
      }
    }
  }
  process.exit(1);
}

console.log("All evals passed.\n");
process.exit(0);
