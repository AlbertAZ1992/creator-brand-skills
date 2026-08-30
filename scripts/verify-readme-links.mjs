import { execFileSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";

const repoRoot = resolve(import.meta.dirname, "..");
const readmes = execFileSync("git", ["ls-files", "*README*.md"], {
  cwd: repoRoot,
  encoding: "utf8",
})
  .trim()
  .split("\n")
  .filter(Boolean);

function localTargets(markdown) {
  const targets = [];
  const patterns = [
    /<img\s+[^>]*src=["']([^"']+)["'][^>]*>/g,
    /!\[[^\]]*\]\(([^)]+)\)/g,
    /(?<!!)\[[^\]]+\]\(([^)]+)\)/g,
  ];
  for (const pattern of patterns) {
    for (const match of markdown.matchAll(pattern)) targets.push(match[1]);
  }
  return targets;
}

function normalizeTarget(rawTarget) {
  const target = rawTarget.trim().replace(/^<|>$/g, "").split(/\s+["']/)[0];
  if (!target || target.startsWith("#") || /^[a-z]+:/i.test(target)) return null;
  return decodeURIComponent(target.split("#")[0]);
}

const missing = [];
for (const readme of readmes) {
  const absoluteReadme = resolve(repoRoot, readme);
  const markdown = readFileSync(absoluteReadme, "utf8");
  for (const rawTarget of localTargets(markdown)) {
    const target = normalizeTarget(rawTarget);
    if (!target) continue;
    const absoluteTarget = resolve(dirname(absoluteReadme), target);
    if (!existsSync(absoluteTarget)) missing.push(`${readme} -> ${target}`);
  }
}

if (missing.length > 0) {
  console.error("Missing local README targets:\n" + missing.map((item) => `- ${item}`).join("\n"));
  process.exitCode = 1;
} else {
  console.log(`PASS ${readmes.length} README files have valid local links and images.`);
}
