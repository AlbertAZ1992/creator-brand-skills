import { mkdtemp, readFile, rm, stat } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { deliverIconFamily, validate } from "../src/index.js";

const SVG_START =
  '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" ' +
  'fill="none" stroke="#6366F1" stroke-width="2" stroke-linecap="round">';

const rawResponse = JSON.stringify({
  icons: {
    Search: `${SVG_START}<circle cx="10" cy="10" r="6"/><path d="m15 15 5 5"/></svg>`,
    Filter: `${SVG_START}<path d="M4 5h16l-6 7v6l-4 2v-8z"/></svg>`,
    Share:
      `${SVG_START}<circle cx="6" cy="12" r="2"/><circle cx="18" cy="6" r="2"/>` +
      '<circle cx="18" cy="18" r="2"/><path d="m8 11 8-4m-8 6 8 4"/></svg>',
  },
});

async function main(): Promise<void> {
  const validation = validate({
    purpose: "system",
    features: ["Search", "Filter", "Share"],
    style: "outline",
    colors: { primary: "#6366F1" },
    gridSize: 24,
    strokeWidth: 2,
    cornerRadius: "round",
    visualWeight: "regular",
  });
  if (!validation.data) {
    throw new Error(`Fixture input failed validation: ${JSON.stringify(validation.errors)}`);
  }

  const outputDir = await mkdtemp(join(tmpdir(), "feature-to-icons-eval-"));
  try {
    const delivery = await deliverIconFamily(validation.data, rawResponse, outputDir);
    const previewSvgPath = join(outputDir, "icon-family-preview.svg");
    await verifyDelivery(
      delivery.manifestPath,
      previewSvgPath,
      delivery.previewPath,
      delivery.iconPaths,
    );
    console.log("PASS real icon-family deliverable");
    console.log(`  3 SVG icons + PNG preview + manifest verified in ${outputDir}`);
  } finally {
    await rm(outputDir, { recursive: true, force: true });
  }
}

async function verifyDelivery(
  manifestPath: string,
  previewSvgPath: string,
  previewPath: string,
  iconPaths: string[],
): Promise<void> {
  const manifest = JSON.parse(await readFile(manifestPath, "utf8")) as {
    featureCount: number;
    validation: { passed: boolean; checks: string[] };
  };
  if (manifest.featureCount !== 3 || !manifest.validation.passed) {
    throw new Error("Manifest did not record a passing three-icon family");
  }
  if (!manifest.validation.checks.some((check) => check.includes("visible icon pixels"))) {
    throw new Error("Manifest did not record visible-pixel verification");
  }
  if (iconPaths.length !== 3) {
    throw new Error("Delivery did not contain exactly three icon paths");
  }
  const signature = (await readFile(previewPath)).subarray(0, 8).toString("hex");
  if (signature !== "89504e470d0a1a0a") {
    throw new Error("Preview is not a PNG file");
  }
  const previewSvg = await readFile(previewSvgPath, "utf8");
  if (!previewSvg.includes('stroke="#6366F1"') || !previewSvg.includes('fill="none"')) {
    throw new Error("Preview SVG did not preserve root presentation attributes");
  }
  for (const iconPath of iconPaths) {
    if ((await stat(iconPath)).size === 0) {
      throw new Error(`Icon is empty: ${iconPath}`);
    }
  }
}

main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
