import { mkdir, rm, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import { deliverPhosphorIconFamily, validate } from "../src/index.js";
import type { FeatureIconInput, IconOverrides } from "../src/types.js";

interface ExampleFamily {
  slug: string;
  title: string;
  summary: string;
  request: string;
  input: FeatureIconInput;
  overrides: IconOverrides;
}

const families: ExampleFamily[] = [
  {
    slug: "product-essentials-outline",
    title: "Product essentials · Outline",
    summary: "A compact Phosphor regular family for common product actions.",
    request:
      "Icons for Search, Filters, Team Sharing, and Cloud Sync. " +
      "Use a 24 px outline family in #4F46E5.",
    input: {
      features: ["Search", "Filters", "Team Sharing", "Cloud Sync"],
      style: "outline",
      colors: { primary: "#4F46E5" },
      gridSize: 24,
      strokeWidth: 2,
      cornerRadius: "rounded",
      visualWeight: "regular",
    },
    overrides: {},
  },
  {
    slug: "analytics-light-outline",
    title: "Analytics · Light outline",
    summary: "A quiet data-product family sourced from Phosphor light.",
    request:
      "Icons for Dashboard, Analytics, Reports, Trends, and Export Data. " +
      "Use a light 24 px outline family in #2563EB.",
    input: {
      features: ["Dashboard", "Analytics", "Reports", "Trends", "Export Data"],
      style: "outline",
      colors: { primary: "#2563EB" },
      gridSize: 24,
      strokeWidth: 1.75,
      cornerRadius: "rounded",
      visualWeight: "light",
      productContext: "A calm analytics workspace for product teams",
    },
    overrides: {},
  },
  {
    slug: "collaboration-filled",
    title: "Collaboration · Filled",
    summary: "Solid collaboration symbols sourced from Phosphor fill.",
    request:
      "Filled icons for Team Chat, File Sharing, Video Calls, Task Board, " +
      "and Calendar. Use a 32 px grid and #6366F1.",
    input: {
      features: ["Team Chat", "File Sharing", "Video Calls", "Task Board", "Calendar"],
      style: "filled",
      colors: { primary: "#6366F1" },
      gridSize: 32,
      cornerRadius: "round",
      visualWeight: "bold",
      productContext: "A real-time workspace for distributed creative teams",
    },
    overrides: {},
  },
  {
    slug: "commerce-duotone",
    title: "Commerce · Duotone",
    summary: "Commerce metaphors sourced from one Phosphor duotone family.",
    request:
      "Duotone icons for Shopping Cart, Wishlist, Orders, Payment, and Delivery. " +
      "Use #FF6B35 primary and #004E89 secondary.",
    input: {
      features: ["Shopping Cart", "Wishlist", "Orders", "Payment", "Delivery"],
      style: "duotone",
      colors: { primary: "#FF6B35", secondary: "#004E89" },
      gridSize: 24,
      strokeWidth: 2,
      cornerRadius: "round",
      visualWeight: "regular",
      productContext: "A friendly direct-to-consumer commerce platform",
    },
    overrides: {},
  },
  {
    slug: "security-bold-outline",
    title: "Security · Bold outline",
    summary: "High-emphasis security symbols sourced from Phosphor bold.",
    request:
      "Bold outline icons for Authentication, Encryption, Access Control, " +
      "Audit Log, and Alerts. Use a 32 px grid and #0F766E.",
    input: {
      features: ["Authentication", "Encryption", "Access Control", "Audit Log", "Alerts"],
      style: "outline",
      colors: { primary: "#0F766E" },
      gridSize: 32,
      strokeWidth: 3,
      cornerRadius: "rounded",
      visualWeight: "bold",
      productContext: "An enterprise identity and access management platform",
    },
    overrides: {},
  },
  {
    slug: "creator-brand-duotone",
    title: "Creator Brand · Duotone",
    summary: "Creator-tool concepts sourced from Phosphor duotone.",
    request:
      "Duotone icons for Image Generation, Background Removal, Brand Kit, " +
      "Export Assets, and Templates. Use a 32 px grid with purple and pink.",
    input: {
      features: [
        "Image Generation",
        "Background Removal",
        "Brand Kit",
        "Export Assets",
        "Templates",
      ],
      style: "duotone",
      colors: { primary: "#7C3AED", secondary: "#EC4899" },
      gridSize: 32,
      strokeWidth: 2,
      cornerRadius: "round",
      visualWeight: "regular",
      productContext: "An AI-assisted visual creation suite",
    },
    overrides: {},
  },
  {
    slug: "ai-workspace-outline-48",
    title: "AI workspace · 48 px outline",
    summary: "A large-grid family that exercises semantic resolution without overrides.",
    request:
      "Outline icons for AI Copilot, Knowledge Search, Automation, and Version History. " +
      "Use a 48 px grid, regular weight, and #0F172A.",
    input: {
      features: ["AI Copilot", "Knowledge Search", "Automation", "Version History"],
      style: "outline",
      colors: { primary: "#0F172A" },
      gridSize: 48,
      strokeWidth: 2,
      cornerRadius: "rounded",
      visualWeight: "regular",
      productContext: "An AI workspace for research and recurring workflows",
    },
    overrides: {},
  },
];

const packageRoot = dirname(fileURLToPath(new URL("../package.json", import.meta.url)));
const examplesRoot = join(packageRoot, "examples");

async function main(): Promise<void> {
  await mkdir(examplesRoot, { recursive: true });
  for (const family of families) {
    const validation = validate(family.input);
    if (!validation.data) {
      throw new Error(`${family.slug}: ${JSON.stringify(validation.errors)}`);
    }
    const outputDir = join(examplesRoot, family.slug);
    await rm(outputDir, { recursive: true, force: true });
    const delivery = await deliverPhosphorIconFamily(validation.data, outputDir, family.overrides);
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
    console.log(`PASS ${family.slug}: ${delivery.iconPaths.length} Phosphor icons`);
  }
  console.log(`Generated ${families.length} library-backed icon families.`);
}

main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
