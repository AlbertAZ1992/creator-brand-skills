import { buildPrompt, validate } from "../src/index.js";
import { cases } from "./cases.js";

let failures = 0;

for (const testCase of cases) {
  const validation = validate(testCase.input as unknown as Record<string, unknown>);
  const prompt = buildPrompt(testCase.input).prompt.toLowerCase();
  const missing = testCase.expected.filter((token) => !prompt.includes(token.toLowerCase()));
  const unwanted = testCase.forbidden.filter((token) => prompt.includes(token.toLowerCase()));

  if (validation.valid && missing.length === 0 && unwanted.length === 0) {
    console.log(`PASS  ${testCase.name}`);
    continue;
  }

  failures += 1;
  console.log(`FAIL  ${testCase.name}`);
  if (!validation.valid) {
    console.log(`      Validation: ${validation.errors.map((error) => error.message).join(", ")}`);
  }
  if (missing.length > 0) console.log(`      Missing: ${missing.join(", ")}`);
  if (unwanted.length > 0) console.log(`      Unwanted: ${unwanted.join(", ")}`);
}

console.log(`\n${cases.length} cases: ${cases.length - failures} passed, ${failures} failed`);
process.exit(failures > 0 ? 1 : 0);
