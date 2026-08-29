import { buildPrompt } from "../src/index.js";
import { cases, type EvalCase } from "./cases.js";

interface EvalResult {
  caseName: string;
  passed: boolean;
  failures: string[];
}

function runCase(evalCase: EvalCase): EvalResult {
  const prompt = buildPrompt(evalCase.input);
  const failures: string[] = [];

  // Check that expected keywords are present in the prompt.
  for (const keyword of evalCase.expectedPromptContains) {
    if (!prompt.includes(keyword)) {
      failures.push(`MISSING: "${keyword}"`);
    }
  }

  // Check that unwanted keywords are absent from the prompt.
  for (const keyword of evalCase.expectedPromptNotContains) {
    if (prompt.includes(keyword)) {
      failures.push(`UNWANTED: "${keyword}" (should not appear in prompt)`);
    }
  }

  return {
    caseName: evalCase.name,
    passed: failures.length === 0,
    failures,
  };
}

function main(): void {
  const results: EvalResult[] = cases.map(runCase);

  let totalPassed = 0;
  let totalFailed = 0;

  console.log("=".repeat(72));
  console.log("  Logo to Clay -- Prompt Eval");
  console.log("=".repeat(72));
  console.log("");

  for (const result of results) {
    const status = result.passed ? "PASS" : "FAIL";
    const icon = result.passed ? "✔" : "✘";

    console.log(`  ${icon}  ${status}   ${result.caseName}`);

    if (!result.passed) {
      totalFailed++;
      for (const failure of result.failures) {
        console.log(`     → ${failure}`);
      }
    } else {
      totalPassed++;
    }
    console.log("");
  }

  console.log("-".repeat(72));
  console.log(`  Results: ${totalPassed} passed, ${totalFailed} failed, ${results.length} total`);
  console.log("=".repeat(72));

  if (totalFailed > 0) {
    process.exit(1);
  }
}

main();
