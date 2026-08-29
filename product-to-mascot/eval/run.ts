import { cases } from './cases.js';
import { buildPrompt, validate } from '../src/index.js';

interface EvalResult {
  name: string;
  passed: boolean;
  failures: string[];
}

function runEval(): { results: EvalResult[]; passed: number; failed: number } {
  const results: EvalResult[] = [];

  for (const c of cases) {
    const failures: string[] = [];

    // Step 1: Validate
    const validation = validate(c.input);
    if (validation.ok !== c.expectValid) {
      failures.push(
        `expected validation ok=${c.expectValid}, got ok=${validation.ok}`,
      );
    }

    // Step 2: If valid, build prompt and check assertions
    if (validation.ok && c.expectValid) {
      const prompt = buildPrompt(validation.value).toLowerCase();

      for (const keyword of c.expectedPromptContains) {
        if (!prompt.includes(keyword.toLowerCase())) {
          failures.push(
            `expected prompt to contain "${keyword}", but it was not found`,
          );
        }
      }

      for (const keyword of c.expectedPromptNotContains) {
        if (prompt.includes(keyword.toLowerCase())) {
          failures.push(
            `expected prompt to NOT contain "${keyword}", but it was found`,
          );
        }
      }
    }

    results.push({
      name: c.name,
      passed: failures.length === 0,
      failures,
    });
  }

  const passed = results.filter((r) => r.passed).length;
  const failed = results.filter((r) => !r.passed).length;

  return { results, passed, failed };
}

// --- CLI Runner ---

const { results, passed, failed } = runEval();

for (const r of results) {
  const icon = r.passed ? 'PASS' : 'FAIL';
  console.log(`${icon}  ${r.name}`);
  for (const f of r.failures) {
    console.log(`     -> ${f}`);
  }
}

console.log(`\n${passed} passed, ${failed} failed out of ${results.length} cases`);

if (failed > 0) {
  process.exit(1);
}