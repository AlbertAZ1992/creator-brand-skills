import { validate, buildPrompt } from "../src/index.js";

const SAMPLE_INPUT = {
  logoPath: "./logo.png",
  shape: "object" as const,
  depth: 6,
  clayColor: "#C4956A",
  background: "studio" as const,
};

const { options, errors } = validate(SAMPLE_INPUT);

if (errors.length > 0) {
  console.error("Validation errors:");
  for (const e of errors) {
    console.error(`  ${e.field}: ${e.message}`);
  }
  process.exit(1);
}

console.log("=== Validated Options ===");
console.log(JSON.stringify(options, null, 2));
console.log();

const prompt = buildPrompt(options);
console.log("=== Generated Prompt ===");
console.log(prompt);
console.log();

// Quick assertions
const checks = [
  { name: "contains refined clay style", ok: prompt.includes("refined clay-style") },
  { name: "contains object shape", ok: prompt.includes("standalone clay object") },
  { name: "contains clay color", ok: prompt.includes("#C4956A") },
  { name: "contains 6mm depth", ok: prompt.includes("6mm") },
  { name: "contains studio background", ok: prompt.includes("studio") },
  { name: "no old keywords", ok: !prompt.includes("pixel-faithful") },
  { name: "concise", ok: prompt.length < 1500 },
];

let passed = 0;
let failed = 0;

for (const check of checks) {
  if (check.ok) {
    console.log(`  PASS  ${check.name}`);
    passed++;
  } else {
    console.log(`  FAIL  ${check.name}`);
    failed++;
  }
}

console.log();
console.log(`Results: ${passed} passed, ${failed} failed`);

if (failed > 0) {
  process.exit(1);
}
