import { mkdir, readdir, readFile, rm, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import { Resvg } from "@resvg/resvg-js";

import { deliverIconFamily, validate } from "../src/index.js";
import { doodleInput, doodleRaw, doodleRequest } from "./doodle-example.js";

const packageRoot = dirname(fileURLToPath(new URL("../package.json", import.meta.url)));
const examplesRoot = join(packageRoot, "examples");
const outputDir = join(examplesRoot, "creator-doodle-animated");

async function cleanExampleDirectories(): Promise<void> {
  await mkdir(examplesRoot, { recursive: true });
  const entries = await readdir(examplesRoot, { withFileTypes: true });
  for (const entry of entries) {
    if (entry.isDirectory()) await rm(join(examplesRoot, entry.name), { recursive: true });
  }
}

async function generateFamily(): Promise<void> {
  const validation = validate(doodleInput);
  if (!validation.data) throw new Error(JSON.stringify(validation.errors));
  const delivery = await deliverIconFamily(validation.data, doodleRaw(), outputDir);
  await writeShowcase(delivery.iconPaths, validation.data.features);
  await writeFile(
    join(outputDir, "example.json"),
    `${JSON.stringify(
      {
        title: "Creator Doodles · animated hand-drawn icon set",
        summary: "Twenty original feature icons with editable paths and embedded wiggle motion.",
        request: doodleRequest,
        input: validation.data,
      },
      null,
      2,
    )}\n`,
    "utf8",
  );
  console.log(`PASS creator-doodle-animated: ${delivery.iconPaths.length} animated icons`);
}

async function writeShowcase(iconPaths: string[], features: string[]): Promise<void> {
  const icons = await buildIconCards(iconPaths, features);
  const brief = buildBrief(features);
  const svg = buildShowcaseSvg(brief, icons);
  await writeFile(join(outputDir, "showcase-preview.svg"), svg, "utf8");
  const png = new Resvg(svg, { font: { loadSystemFonts: true } }).render().asPng();
  await writeFile(join(outputDir, "showcase-preview.png"), png);
}

async function buildIconCards(iconPaths: string[], features: string[]): Promise<string[]> {
  return Promise.all(
    iconPaths.map(async (iconPath, index) => {
      const feature = features[index];
      if (!feature) throw new Error(`Missing feature label for icon ${index + 1}`);
      const x = 382 + (index % 5) * 194;
      const y = 92 + Math.floor(index / 5) * 190;
      const source = await readFile(iconPath, "utf8");
      const icon = positionSvg(source, x + 48, y + 28);
      return [
        `<rect x="${x}" y="${y}" width="166" height="162" rx="25" fill="#FFFDF8"`,
        ' stroke="#DED5C8"/>',
        icon,
        `<text x="${x + 83}" y="${y + 133}" text-anchor="middle"`,
        ' font-family="Arial, sans-serif" font-size="13" font-weight="700" fill="#342F39">',
        `${escapeXml(feature)}</text>`,
        `<path d="M${x + 65} ${y + 145}q18 4 36 0" stroke="#FF765F"`,
        ' stroke-width="2.4" stroke-linecap="round" fill="none"/>',
      ].join("\n");
    }),
  );
}

function positionSvg(source: string, x: number, y: number): string {
  return source
    .replace(/<style>[\s\S]*?<\/style>/i, "")
    .replace(/\sdata-icon-motion=["'][^"']*["']/i, "")
    .replace(/\sclass=["']wiggle["']/i, "")
    .replace(/\sstyle=["']animation-delay:[^"']*["']/i, "")
    .trim()
    .replace(/<svg\b([^>]*)>/i, (_match, attributes: string) => {
      const clean = attributes.replace(/\s(?:x|y|width|height)=["'][^"']*["']/gi, "");
      return `<svg${clean} x="${x}" y="${y}" width="70" height="70">`;
    });
}

function buildBrief(features: string[]): string[] {
  return features.slice(0, 10).map((feature, index) => {
    const x = 52 + (index % 2) * 147;
    const y = 396 + Math.floor(index / 2) * 40;
    const color = index % 3 === 0 ? "#FF765F" : index % 3 === 1 ? "#20A7C9" : "#F7BD24";
    return [
      `<circle cx="${x + 5}" cy="${y - 5}" r="4.5" fill="${color}"/>`,
      `<text x="${x + 17}" y="${y}" font-family="Arial, sans-serif"`,
      ` font-size="12" font-weight="700" fill="#625B68">${escapeXml(feature)}</text>`,
    ].join("");
  });
}

function buildShowcaseSvg(brief: string[], icons: string[]): string {
  return [
    '<svg xmlns="http://www.w3.org/2000/svg" width="1400" height="880" viewBox="0 0 1400 880">',
    '<rect width="1400" height="880" rx="42" fill="#F3EFE7"/>',
    '<path d="M0 0h18v880H0z" fill="#29262E"/>',
    '<text x="52" y="70" font-family="Arial, sans-serif" font-size="12" font-weight="700"',
    ' letter-spacing="2.2" fill="#7A727F">INPUT FEATURE BRIEF</text>',
    '<text x="52" y="136" font-family="Arial, sans-serif" font-size="53" font-weight="800"',
    ' letter-spacing="-3" fill="#29262E">DOODLE</text>',
    '<text x="52" y="190" font-family="Arial, sans-serif" font-size="53" font-weight="800"',
    ' letter-spacing="-3" fill="#29262E">THE IDEAS.</text>',
    '<path d="M54 215q82 13 168-2" fill="none" stroke="#FF765F" stroke-width="5"',
    ' stroke-linecap="round"/>',
    '<text x="52" y="270" font-family="Arial, sans-serif" font-size="16"',
    ' fill="#625B68">20 creator features → one hand-drawn set</text>',
    '<text x="52" y="301" font-family="Arial, sans-serif" font-size="16"',
    ' fill="#625B68">Editable SVG · embedded wiggle motion</text>',
    ...brief,
    '<rect x="52" y="642" width="264" height="96" rx="23" fill="#FFFDF8" stroke="#DED5C8"/>',
    '<circle cx="82" cy="674" r="8" fill="#FF765F"/>',
    '<circle cx="105" cy="674" r="8" fill="#20A7C9"/>',
    '<circle cx="128" cy="674" r="8" fill="#F7BD24"/>',
    '<text x="76" y="713" font-family="Arial, sans-serif" font-size="12" font-weight="700"',
    ' letter-spacing="1.3" fill="#625B68">ACTUAL VERIFIED SVGs →</text>',
    '<text x="382" y="54" font-family="Arial, sans-serif" font-size="12" font-weight="700"',
    ' letter-spacing="2.2" fill="#7A727F">HAND-DRAWN ANIMATED ICON SET · 01—20</text>',
    ...icons,
    "</svg>",
    "",
  ].join("\n");
}

function escapeXml(value: string): string {
  return value.replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;");
}

async function main(): Promise<void> {
  await cleanExampleDirectories();
  await generateFamily();
  console.log("Generated one current 20-icon hand-drawn family.");
}

main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
