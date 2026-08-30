import { mkdir, readdir, readFile, rm, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import { Resvg } from "@resvg/resvg-js";

import { deliverIconFamily, deliverPhosphorIconFamily, validate } from "../src/index.js";
import type { FeatureIconInput, IconOverrides } from "../src/types.js";
import { customBrandInput, customBrandRaw, customBrandRequest } from "./custom-brand-example.js";
import {
  creatorStudioInput,
  creatorStudioRaw,
  creatorStudioRequest,
} from "./custom-creator-example.js";

interface ExampleFamily {
  slug: string;
  title: string;
  summary: string;
  request: string;
  input: FeatureIconInput;
  overrides: IconOverrides;
  raw?: () => string;
  kicker: string;
  headline: readonly [string, string];
  accent: string;
  highlight: string;
}

const families: ExampleFamily[] = [
  {
    slug: "release-workflow-duotone",
    title: "Release workflow · Custom duotone",
    summary: "Original brand feature art for an open-source JavaScript release studio.",
    request: customBrandRequest,
    input: customBrandInput,
    overrides: {},
    raw: customBrandRaw,
    kicker: "RELEASE WORKFLOW",
    headline: ["FROM SPARK", "TO SHIP."],
    accent: "#5B4BDB",
    highlight: "#FF7665",
  },
  {
    slug: "creator-studio-duotone",
    title: "Creator studio · Custom duotone",
    summary: "Warm editorial feature art for an independent maker studio.",
    request: creatorStudioRequest,
    input: creatorStudioInput,
    overrides: {},
    raw: creatorStudioRaw,
    kicker: "CREATOR STUDIO",
    headline: ["MAKE IT", "MEMORABLE."],
    accent: "#17142C",
    highlight: "#FF6B57",
  },
  {
    slug: "developer-platform-outline",
    title: "Developer platform · System outline",
    summary: "Familiar developer-platform actions from one native Phosphor family.",
    request:
      "System icons for Source Code, Pull Requests, Issue Tracking, CI Workflows, " +
      "Packages, and Releases. Use a 32 px regular outline family in #172A46.",
    input: {
      purpose: "system",
      features: [
        "Source Code",
        "Pull Requests",
        "Issue Tracking",
        "CI Workflows",
        "Packages",
        "Releases",
      ],
      style: "outline",
      colors: { primary: "#172A46" },
      gridSize: 32,
      strokeWidth: 2,
      cornerRadius: "round",
      visualWeight: "regular",
      productContext: "A focused open-source code hosting and release platform",
    },
    overrides: {
      "Source Code": "code",
      "Pull Requests": "git-pull-request",
      "Issue Tracking": "bug",
      "CI Workflows": "arrows-clockwise",
      Packages: "package",
      Releases: "rocket-launch",
    },
    kicker: "DEVELOPER PLATFORM",
    headline: ["BUILD.", "REVIEW. SHIP."],
    accent: "#172A46",
    highlight: "#F7DF1E",
  },
];

const packageRoot = dirname(fileURLToPath(new URL("../package.json", import.meta.url)));
const examplesRoot = join(packageRoot, "examples");

async function cleanExampleDirectories(): Promise<void> {
  await mkdir(examplesRoot, { recursive: true });
  const entries = await readdir(examplesRoot, { withFileTypes: true });
  for (const entry of entries) {
    if (entry.isDirectory()) await rm(join(examplesRoot, entry.name), { recursive: true });
  }
}

async function generateFamily(family: ExampleFamily): Promise<void> {
  const validation = validate(family.input);
  if (!validation.data) throw new Error(`${family.slug}: ${JSON.stringify(validation.errors)}`);
  const outputDir = join(examplesRoot, family.slug);
  const delivery = family.raw
    ? await deliverIconFamily(validation.data, family.raw(), outputDir)
    : await deliverPhosphorIconFamily(validation.data, outputDir, family.overrides);
  await writeShowcasePreview(outputDir, delivery.iconPaths, family);
  await writeFile(
    join(outputDir, "example.json"),
    `${JSON.stringify(
      {
        title: family.title,
        summary: family.summary,
        request: family.request,
        input: validation.data,
        overrides: family.overrides,
      },
      null,
      2,
    )}\n`,
    "utf8",
  );
  console.log(`PASS ${family.slug}: ${delivery.iconPaths.length} icons`);
}

async function main(): Promise<void> {
  await cleanExampleDirectories();
  for (const family of families) await generateFamily(family);
  console.log(`Generated ${families.length} current icon families.`);
}

function escapeXml(value: string): string {
  return value.replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;");
}

async function buildCards(iconPaths: string[], features: string[], highlight: string) {
  return Promise.all(
    iconPaths.map(async (iconPath, index) => {
      const feature = features[index];
      if (!feature) throw new Error(`Missing feature label for icon ${index + 1}`);
      const x = 500 + (index % 3) * 220;
      const y = 72 + Math.floor(index / 3) * 286;
      const source = await readFile(iconPath, "utf8");
      const icon = source.trim().replace(/<svg\b([^>]*)>/i, (_match, attributes: string) => {
        const clean = attributes.replace(/\s(?:x|y|width|height)=["'][^"']*["']/gi, "");
        return `<svg${clean} x="${x + 43}" y="${y + 34}" width="98" height="98">`;
      });
      return [
        `<rect x="${x}" y="${y}" width="184" height="238" rx="26" fill="#FFFDF8" ` +
          `stroke="#DDD6CB"/>`,
        `<text x="${x + 20}" y="${y + 24}" font-family="Arial, sans-serif" ` +
          `font-size="10" font-weight="700" fill="#9A92A5">0${index + 1}</text>`,
        icon,
        `<text x="${x + 92}" y="${y + 198}" text-anchor="middle" ` +
          `font-family="Arial, sans-serif" font-size="14" font-weight="700" ` +
          `fill="#242038">${escapeXml(feature)}</text>`,
        `<circle cx="${x + 92}" cy="${y + 218}" r="3" fill="${highlight}"/>`,
      ].join("\n");
    }),
  );
}

function buildBrief(features: string[], accent: string): string[] {
  return features.map((feature, index) => {
    const x = 72 + (index % 2) * 174;
    const y = 390 + Math.floor(index / 2) * 42;
    return [
      `<circle cx="${x + 5}" cy="${y - 5}" r="5" fill="${accent}"/>`,
      `<text x="${x + 18}" y="${y}" font-family="Arial, sans-serif" ` +
        `font-size="14" font-weight="700" fill="#615B6A">${escapeXml(feature)}</text>`,
    ].join("\n");
  });
}

async function writeShowcasePreview(
  outputDir: string,
  iconPaths: string[],
  family: ExampleFamily,
): Promise<void> {
  const features = family.input.features;
  const cards = await buildCards(iconPaths, features, family.highlight);
  const brief = buildBrief(features, family.accent);
  const svg = [
    '<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="720" viewBox="0 0 1200 720">',
    '<rect width="1200" height="720" rx="42" fill="#F3EFE7"/>',
    `<path d="M0 0h18v720H0z" fill="${family.accent}"/>`,
    `<circle cx="425" cy="92" r="38" fill="${family.highlight}"/>`,
    `<text x="72" y="92" font-family="Arial, sans-serif" font-size="13" font-weight="700" ` +
      `letter-spacing="2.3" fill="${family.accent}">${escapeXml(family.kicker)}</text>`,
    `<text x="72" y="166" font-family="Arial, sans-serif" font-size="56" font-weight="800" ` +
      `letter-spacing="-3" fill="#17142C">${escapeXml(family.headline[0])}</text>`,
    `<text x="72" y="225" font-family="Arial, sans-serif" font-size="56" font-weight="800" ` +
      `letter-spacing="-3" fill="#17142C">${escapeXml(family.headline[1])}</text>`,
    '<text x="72" y="284" font-family="Arial, sans-serif" font-size="13" font-weight="700" ' +
      'letter-spacing="1.4" fill="#81798A">INPUT FEATURE BRIEF</text>',
    '<text x="72" y="314" font-family="Arial, sans-serif" font-size="16" fill="#615B6A">' +
      "One context. Six named benefits.</text>",
    ...brief,
    '<path d="M72 540h312" stroke="#D2C9BC" stroke-width="2"/>',
    '<text x="72" y="580" font-family="Arial, sans-serif" font-size="13" font-weight="700" ' +
      'letter-spacing="1.4" fill="#81798A">ACTUAL VERIFIED OUTPUTS →</text>',
    `<circle cx="83" cy="652" r="11" fill="${family.accent}"/>`,
    `<circle cx="115" cy="652" r="11" fill="${family.highlight}"/>`,
    ...cards,
    "</svg>",
    "",
  ].join("\n");
  await writeFile(join(outputDir, "showcase-preview.svg"), svg, "utf8");
  const png = new Resvg(svg, { font: { loadSystemFonts: true } }).render().asPng();
  await writeFile(join(outputDir, "showcase-preview.png"), png);
}

main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
